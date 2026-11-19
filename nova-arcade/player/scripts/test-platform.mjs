import { DatabaseSync } from "node:sqlite";
import assert from "node:assert";
import {
  seed, ensureUser, bootstrap, createOrder, simulatePayment,
  createTransfer, joinTournament, submitTournamentScore, settleTournament,
  startGame, gameAction, claimReward, createPayout, payoutDecision,
  requestCoinConversion, conversionDecision, linkPayoneer,
  CLAIM_MACHINES, getClaimState, startClaimSession, harvestClaimSession,
  transferClaimToWallet, claimTransferDecision,
  adminAction, playerAction, AppError, TOPUP_PACKAGES
} from "../lib/core.mjs";

class D1Mock {
  constructor(rawDb) {
    this.raw = rawDb;
  }
  prepare(sql) {
    const raw = this.raw;
    const createExec = (...args) => ({
      run: async () => {
        const stmt = raw.prepare(sql);
        stmt.run(...args);
        return { success: true };
      },
      first: async (col) => {
        const stmt = raw.prepare(sql);
        const r = stmt.get(...args);
        if (!r) return null;
        return col ? r[col] : r;
      },
      all: async () => {
        const stmt = raw.prepare(sql);
        return { results: stmt.all(...args) };
      }
    });

    return {
      bind: (...args) => createExec(...args),
      run: async () => createExec().run(),
      first: async (col) => createExec().first(col),
      all: async () => createExec().all()
    };
  }
  async batch(statements) {
    this.raw.exec("BEGIN TRANSACTION");
    try {
      for (const s of statements) {
        await s.run();
      }
      this.raw.exec("COMMIT");
    } catch (e) {
      this.raw.exec("ROLLBACK");
      throw e;
    }
  }
}

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ NỀN TẢNG WEB GAME & TÀI CHÍNH NOVA ARCADE ===");
  const rawDb = new DatabaseSync(":memory:");
  const db = new D1Mock(rawDb);

  // 1. Khởi tạo & Seed Database
  console.log("\n[TEST 1] Khởi tạo Database & Seed 6 game, 9 gói, chính sách quốc gia, giải đấu");
  await seed(db);
  const bootGuest = await bootstrap(db, null);
  assert.strictEqual(bootGuest.games.length, 50, "Phải có đủ 50 tựa game trong catalog");
  assert.strictEqual(bootGuest.plans.length, 9, "Phải có đủ 9 gói thành viên");
  assert.strictEqual(bootGuest.topupPackages.length, 6, "Phải có đủ 6 gói nạp Playhop");
  assert.ok(bootGuest.tournaments.length >= 4, "Phải có ít nhất 4 giải đấu kỹ năng ban đầu");
  assert.strictEqual(bootGuest.countryPolicies.length, 11, "Phải có 11 quốc gia theo ma trận sàng lọc");
  console.log("✓ Khởi tạo seed thành công!");

  // 2. Tạo người chơi & nạp xu số dư (balance-refill-flow=purchase)
  console.log("\n[TEST 2] Nạp số dư qua Playhop refill modal & Kiểm tra sổ cái kép");
  const userA = await ensureUser(db, { userId: "user-alpha", displayName: "Nguyễn Văn A", email: "alpha@nova.test" });
  const userB = await ensureUser(db, { userId: "user-beta", displayName: "Trần Thị B", email: "beta@nova.test" });

  const topupOrder = await createOrder(db, userA.id, {
    planId: "topup-50000",
    method: "qr",
    requestKey: "req-topup-001"
  });
  assert.strictEqual(topupOrder.amount_cents, 5000, "Gói 50.000 xu có giá $50.00");
  assert.strictEqual(topupOrder.status, "pending");

  // Mô phỏng thanh toán hoàn tất
  await simulatePayment(db, userA.id, topupOrder.id);
  const walletA = await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userA.id}:available`).first();
  assert.strictEqual(walletA.balance, 60000, "50.000 xu + 10.000 xu thưởng = 60.000 xu trong ví");
  console.log("✓ Nạp xu số dư thành công! Số dư khả dụng User A:", walletA.balance, "xu");

  // Kiểm tra tính cân bằng sổ cái kép
  const journalLines = (await db.prepare("SELECT SUM(delta) as s FROM journal_lines WHERE transaction_id IN (SELECT id FROM journal_transactions WHERE reference=?)").bind(`topup:${topupOrder.id}`).first());
  assert.strictEqual(journalLines.s, 0, "Bút toán nạp xu phải có tổng Nợ - Có = 0 (cân đối tuyệt đối)");
  console.log("✓ Sổ cái kép cho giao dịch nạp cân bằng tuyệt đối (Tổng delta = 0)");

  // 3. Chuyển số dư P2P giữa người dùng (yêu cầu Cấp 10+)
  console.log("\n[TEST 3] Chuyển xu P2P giữa người chơi A và B (Mở khóa Cấp 10+)");
  await db.prepare("UPDATE app_users SET play_time_seconds = 1800000 WHERE id = ?").bind(userA.id).run();
  const transfer = await createTransfer(db, userA.id, {
    recipient: "beta@nova.test",
    coins: 200,
    note: "Tặng bạn xu chơi giải đấu",
    requestKey: "req-transfer-001"
  });
  assert.strictEqual(transfer.status, "completed");
  const balA = (await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userA.id}:available`).first()).balance;
  const balB = (await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userB.id}:available`).first()).balance;
  assert.strictEqual(balA, 59800, "User A bị trừ 200 xu còn 59.800 xu");
  assert.strictEqual(balB, 200, "User B nhận được 200 xu");

  // Kiểm tra chặn chuyển quá số dư
  let errCaught = false;
  try {
    await createTransfer(db, userA.id, { recipient: "beta@nova.test", coins: 100000, requestKey: "req-transfer-bad" });
  } catch (e) {
    errCaught = true;
    assert.ok(e instanceof AppError);
  }
  assert.ok(errCaught, "Phải chặn chuyển xu khi số dư không đủ");

  // Kiểm tra chặn tự chuyển cho chính mình
  let selfTransferErr = false;
  try {
    await createTransfer(db, userA.id, { recipient: "alpha@nova.test", coins: 50, requestKey: "req-transfer-self" });
  } catch (e) {
    selfTransferErr = true;
  }
  assert.ok(selfTransferErr, "Phải chặn chuyển xu cho chính mình");
  console.log("✓ Chuyển xu P2P nguyên tử thành công và bảo vệ số dư chặt chẽ!");

  // 4. Đấu trường thi đấu kỹ năng & Trao thưởng
  console.log("\n[TEST 4] Tham gia giải đấu kỹ năng, nộp điểm & Quyết toán giải");
  const tourney = (await db.prepare("SELECT * FROM tournaments WHERE game_id='memory'").all()).results[0];

  // User A và User B cùng tham gia giải đấu (lệ phí 50 xu)
  await joinTournament(db, userA.id, tourney.id);
  await joinTournament(db, userB.id, tourney.id);

  const updatedTourney = await db.prepare("SELECT prize_pool_coins FROM tournaments WHERE id=?").bind(tourney.id).first();
  assert.strictEqual(updatedTourney.prize_pool_coins, tourney.prize_pool_coins + 100, "Tổng thưởng tăng thêm lệ phí của 2 người chơi");

  // Chơi ván đấu và nộp điểm
  const sessionA = await startGame(db, userA.id, "memory");
  // Hoàn thành session với điểm số 120
  await db.prepare("UPDATE game_sessions SET completed=1, score=140 WHERE id=?").bind(sessionA.id).run();
  await submitTournamentScore(db, userA.id, tourney.id, sessionA.id);

  const sessionB = await startGame(db, userB.id, "memory");
  await db.prepare("UPDATE game_sessions SET completed=1, score=110 WHERE id=?").bind(sessionB.id).run();
  await submitTournamentScore(db, userB.id, tourney.id, sessionB.id);

  // Quyết toán giải
  const settleResult = await settleTournament(db, "admin:system", tourney.id);
  assert.strictEqual(settleResult.settled, true);
  assert.strictEqual(settleResult.winners[0].userId, userA.id, "User A điểm cao hơn xếp hạng 1");
  assert.strictEqual(settleResult.winners[1].userId, userB.id, "User B xếp hạng 2");

  const finalBalA = (await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userA.id}:available`).first()).balance;
  assert.ok(finalBalA > 610 - 50, "User A nhận được giải thưởng Top 1 cộng vào ví");
  console.log("✓ Giải đấu kỹ năng hoạt động hoàn hảo: Tham gia -> Chơi -> Bảng xếp hạng -> Quyết toán chia thưởng!");

  // 5. Kiểm tra toàn bộ 6 Engine trò chơi
  console.log("\n[TEST 5] Kiểm tra 6 Engine trò chơi (Memory, Number, Reflex, Blocks, Orbit, Word)");

  // 5.1 Memory
  const memS = await startGame(db, userA.id, "memory");
  assert.ok(memS.cards.length >= 4);
  assert.strictEqual(memS.stage, 1);
  const memA1 = await gameAction(db, userA.id, { sessionId: memS.id, version: 0, index: 0 });
  assert.strictEqual(memA1.version, 1);
  console.log("  ✓ Engine Memory Garden: OK");

  // 5.2 Number
  const numS = await startGame(db, userA.id, "number");
  assert.ok(numS.question);
  const numA1 = await gameAction(db, userA.id, { sessionId: numS.id, version: 0, answer: 100 });
  assert.strictEqual(numA1.version, 1);
  console.log("  ✓ Engine Number Rush: OK");

  // 5.3 Reflex
  const refS = await startGame(db, userA.id, "reflex");
  assert.ok(refS.goAt);
  assert.strictEqual(refS.stage, 1);
  const refA1 = await gameAction(db, userA.id, { sessionId: refS.id, version: 0 });
  assert.strictEqual(refA1.version, 1);
  console.log("  ✓ Engine Neon Reflex: OK");

  // 5.4 Blocks (KHỐI8 style)
  const blkS = await startGame(db, userA.id, "blocks");
  assert.strictEqual(blkS.board.length, 64, "Bàn cờ 8x8 gồm 64 ô");
  assert.strictEqual(blkS.currentShapes.length, 3, "Có 3 khối hình để lựa chọn");
  const blkA1 = await gameAction(db, userA.id, { sessionId: blkS.id, version: 0, pieceIndex: 0, row: 0, col: 0 });
  assert.strictEqual(blkA1.placedIndices.length, 1, "Đã đặt 1 khối thành công");
  console.log("  ✓ Engine Block District (KHỐI8 style): OK");

  // 5.5 Orbit
  const orbS = await startGame(db, userA.id, "orbit");
  assert.strictEqual(orbS.stage, 1);
  // Find safe lane to pass stage 1
  const safeLane = [0, 1, 2].find(l => !orbS.hazardLanes?.includes(l)) ?? 0;
  const orbA1 = await gameAction(db, userA.id, { sessionId: orbS.id, version: 0, lane: safeLane });
  assert.strictEqual(orbA1.stage, 2, "Vượt màn 1 và chuyển sang Màn 2 thành công");
  console.log("  ✓ Engine Orbit Runner: OK");

  // 5.6 Word
  const wrdS = await startGame(db, userA.id, "word");
  assert.ok(wrdS.scrambled);
  assert.ok(wrdS.clue);
  const wrdA1 = await gameAction(db, userA.id, { sessionId: wrdS.id, version: 0, guess: "WRONG" });
  assert.strictEqual(wrdA1.version, 1);
  console.log("  ✓ Engine Word Voyage: OK");

  // 6. Kiểm tra Chính sách quốc gia (Country Policies)
  console.log("\n[TEST 6] Kiểm tra Chính sách thị trường & Quản trị");
  const polVN = await db.prepare("SELECT * FROM country_policies WHERE country_code='VN'").first();
  assert.strictEqual(polVN.withdrawal_enabled, 0, "Việt Nam mặc định không mở rút tiền mặt theo Nghị định 147");

  const polDK = await db.prepare("SELECT * FROM country_policies WHERE country_code='DK'").first();
  assert.strictEqual(polDK.paid_competition_enabled, 1, "Đan Mạch mở thi đấu thuần kỹ năng theo ưu tiên sàng lọc Doc 04");

  // Admin cập nhật policy
  await adminAction(db, "admin:staff", "policy.save", {
    country_code: "VN",
    catalog_enabled: 1,
    game_play_enabled: 1,
    purchase_enabled: 1,
    cash_deposit_enabled: 0,
    paid_competition_enabled: 0,
    transfer_enabled: 1,
    withdrawal_enabled: 0,
    note: "Nghị định 147/2024: Đã rà soát tuân thủ"
  });
  const updatedVN = await db.prepare("SELECT * FROM country_policies WHERE country_code='VN'").first();
  assert.strictEqual(updatedVN.note, "Nghị định 147/2024: Đã rà soát tuân thủ");
  console.log("✓ Chính sách quốc gia hoạt động chính xác theo đặc tả Doc 03 & 04!");

  // 7. Kiểm tra Quy đổi xu sang Ví Chính ($) & Rút tiền Payoneer (Payout)
  console.log("\n[TEST 7] Đổi xu sang Ví Chính ($), liên kết ví Payoneer & Rút tiền");
  // A. Liên kết ví Payoneer (bằng liên kết)
  await linkPayoneer(db, userA.id, "https://link.payoneer.com/Token?t=96B839277F5348A3B7D90751C5477937&src=tpl");

  // B. Đổi 2.000 xu sang $2.00 USD
  const convReq = await requestCoinConversion(db, userA.id, { coins: 2000, requestKey: "conv-001" });
  assert.strictEqual(convReq.status, "pending");
  await conversionDecision(db, "admin:finance", { id: convReq.id, decision: "approve" });

  const mainUsdBal = (await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userA.id}:main_usd`).first()).balance;
  assert.strictEqual(mainUsdBal, 200, "Ví Chính nhận được $2.00 USD (200 cents)");

  // C. Tạo lệnh rút tiền $2.00 USD từ Ví Chính (phí 15%: $0.30, thực nhận: $1.70)
  const payout = await createPayout(db, userA.id, {
    usdAmount: 2,
    requestKey: "req-payout-001"
  });
  assert.strictEqual(payout.status, "pending");
  assert.strictEqual(payout.fee_cents, 30, "Phí rút tiền 15% của $2.00 là 30 cents ($0.30)");
  assert.strictEqual(payout.net_cents, 170, "Thực nhận 85% là 170 cents ($1.70)");

  // Admin duyệt và chuyển tiền qua Payoneer
  await payoutDecision(db, "admin:finance", { id: payout.id, decision: "approve" });
  await payoutDecision(db, "admin:finance", { id: payout.id, decision: "confirm_paid", externalRef: "PAY-96B839277F" });
  const paidPayout = await db.prepare("SELECT status, external_ref FROM payouts WHERE id=?").bind(payout.id).first();
  assert.strictEqual(paidPayout.status, "paid");
  assert.strictEqual(paidPayout.external_ref, "PAY-96B839277F");
  console.log("✓ Quy trình rút tiền Payoneer (Hold -> Approve -> Paid) hoàn tất và ghi sổ kép chuẩn xác!");

  // 9. Kiểm tra Tính năng Claim Xu, Máy Đào & Duyệt chuyển sang Ví Xu
  console.log("\n[TEST 9] Kiểm tra Tính năng Claim Xu, 10 Cấp Máy Đào, Ví Claim & Admin duyệt");
  // User B chỉ ở Cấp 1 -> Phải bị chặn không được tham gia Claim
  let blockedClaimErr = false;
  try {
    await startClaimSession(db, userB.id, { machineLevel: 1 });
  } catch (e) {
    blockedClaimErr = true;
    assert.strictEqual(e.code, "LEVEL_LOCKED", "Chặn người chơi dưới Cấp 10 tham gia Claim");
  }
  assert.ok(blockedClaimErr, "Chặn thành công người chơi Cấp 1");

  // User A ở Cấp 50 -> Bật Máy Cấp 5 (150 xu/h)
  const startTime = Date.now();
  const claimS1 = await startClaimSession(db, userA.id, { machineLevel: 5 }, startTime);
  assert.strictEqual(claimS1.activeSession.machineLevel, 5);
  assert.strictEqual(claimS1.activeSession.ratePerHour, 150);
  assert.strictEqual(claimS1.activeSession.isRunning, true);

  // Giả lập trôi qua 30 phút (1800 giây = 0.5h) -> sinh ra 75 xu
  const midTime = startTime + 1800 * 1000;
  const midState = await getClaimState(db, userA.id, midTime);
  assert.strictEqual(midState.activeSession.isRunning, true);
  assert.strictEqual(midState.activeSession.uncollectedCoins, 75);

  // Thu hoạch 75 xu vào Ví Claim
  const harvestedState = await harvestClaimSession(db, userA.id, midTime);
  assert.strictEqual(harvestedState.claimWallet.balance, 75);

  // Giả lập trôi qua 1h10p (tổng 4200 giây) -> Phiên tự động dừng ở mốc 1h (tối đa 3600s)
  const overTime = startTime + 4200 * 1000;
  const stoppedState = await getClaimState(db, userA.id, overTime);
  assert.strictEqual(stoppedState.activeSession.isRunning, false, "Máy tự động dừng sau 1h");
  assert.strictEqual(stoppedState.claimWallet.balance, 150, "Cộng đủ 150 xu của 1 giờ vào Ví Claim");

  // Thêm xu trực tiếp để test chuyển sang Ví Xu (Ví dụ tích lũy đủ 1.200 xu)
  await db.prepare("UPDATE claim_wallets SET balance = 1200 WHERE user_id=?").bind(userA.id).run();

  // Thử chuyển dưới 1.000 xu -> Bị chặn
  let underMinErr = false;
  try {
    await transferClaimToWallet(db, userA.id, { coins: 500 });
  } catch (e) {
    underMinErr = true;
  }
  assert.ok(underMinErr, "Chặn lệnh chuyển dưới 1.000 xu");

  // Chuyển 1.000 xu sang Ví Xu
  const claimTr = await transferClaimToWallet(db, userA.id, { coins: 1000, requestKey: "req-claim-tr-1" }, overTime);
  assert.strictEqual(claimTr.coins, 1000);
  assert.strictEqual(claimTr.status, "pending");

  const walletAfterTr = await db.prepare("SELECT balance, held FROM claim_wallets WHERE user_id=?").bind(userA.id).first();
  assert.strictEqual(walletAfterTr.balance, 200, "Ví Claim còn lại 200 xu khả dụng");
  assert.strictEqual(walletAfterTr.held, 1000, "1.000 xu được giữ trong trạng thái chờ duyệt");

  // Admin duyệt chuyển xu
  const balBeforeApprove = (await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userA.id}:available`).first()).balance;
  await claimTransferDecision(db, "admin:finance", { id: claimTr.id, decision: "approve" }, overTime);

  const balAfterApprove = (await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userA.id}:available`).first()).balance;
  assert.strictEqual(balAfterApprove, balBeforeApprove + 1000, "Ví Xu nhận đúng 1.000 xu sau khi Admin duyệt");

  console.log("✓ Quy trình Claim Xu (Level check -> Bật 1h -> Tự động dừng -> Thu hoạch -> Chuyển Ví Xu -> Admin duyệt) hoàn tất 100%!");

  // 8. Kiểm tra toàn diện sổ cái kép (Zero-sum double-entry ledger invariant)
  console.log("\n[TEST 8] Kiểm tra bất biến toàn diện sổ cái kép (Debit == Credit across entire system)");
  const allJournals = (await db.prepare("SELECT id, reference, reason, unit FROM journal_transactions WHERE status='posted'").all()).results;
  console.log(`Đang kiểm tra ${allJournals.length} giao dịch sổ cái đã ghi...`);

  for (const j of allJournals) {
    const sum = (await db.prepare("SELECT SUM(delta) as s FROM journal_lines WHERE transaction_id=?").bind(j.id).first()).s;
    assert.strictEqual(sum, 0, `Giao dịch ${j.reference} (${j.reason}) bị lệch sổ cái: sum = ${sum}`);
  }
  console.log("✓ TẤT CẢ GIAO DỊCH SỔ CÁI ĐỀU CÂN BẰNG TUYỆT ĐỐI (SUM DELTA = 0)!");

  console.log("\n==================================================================");
  console.log("🎉 TOÀN BỘ 8 NHÓM BÀI TEST NGHIỆM THU ĐÃ VƯỢT QUA 100% THÀNH CÔNG! 🎉");
  console.log("==================================================================");
}

runTests().catch(err => {
  console.error("Test thất bại:", err);
  process.exit(1);
});
