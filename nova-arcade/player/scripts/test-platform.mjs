import { DatabaseSync } from "node:sqlite";
import assert from "node:assert";
import {
  seed, ensureUser, bootstrap, createOrder, simulatePayment,
  createTransfer, joinTournament, submitTournamentScore, settleTournament,
  startGame, gameAction, claimReward, createPayout, payoutDecision,
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
  assert.strictEqual(bootGuest.games.length, 6, "Phải có đủ 6 tựa game trong catalog");
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
    planId: "topup-750",
    method: "qr",
    requestKey: "req-topup-001"
  });
  assert.strictEqual(topupOrder.amount_cents, 700, "Gói 750 xu có giá $7.00");
  assert.strictEqual(topupOrder.status, "pending");

  // Mô phỏng thanh toán hoàn tất
  await simulatePayment(db, userA.id, topupOrder.id);
  const walletA = await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userA.id}:available`).first();
  assert.strictEqual(walletA.balance, 810, "750 xu + 60 xu thưởng = 810 xu trong ví");
  console.log("✓ Nạp xu số dư thành công! Số dư khả dụng User A:", walletA.balance, "xu");

  // Kiểm tra tính cân bằng sổ cái kép
  const journalLines = (await db.prepare("SELECT SUM(delta) as s FROM journal_lines WHERE transaction_id IN (SELECT id FROM journal_transactions WHERE reference=?)").bind(`topup:${topupOrder.id}`).first());
  assert.strictEqual(journalLines.s, 0, "Bút toán nạp xu phải có tổng Nợ - Có = 0 (cân đối tuyệt đối)");
  console.log("✓ Sổ cái kép cho giao dịch nạp cân bằng tuyệt đối (Tổng delta = 0)");

  // 3. Chuyển số dư P2P giữa người dùng
  console.log("\n[TEST 3] Chuyển xu P2P giữa người chơi A và B");
  const transfer = await createTransfer(db, userA.id, {
    recipient: "beta@nova.test",
    coins: 200,
    note: "Tặng bạn xu chơi giải đấu",
    requestKey: "req-transfer-001"
  });
  assert.strictEqual(transfer.status, "completed");
  const balA = (await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userA.id}:available`).first()).balance;
  const balB = (await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userB.id}:available`).first()).balance;
  assert.strictEqual(balA, 610, "User A bị trừ 200 xu còn 610 xu");
  assert.strictEqual(balB, 200, "User B nhận được 200 xu");

  // Kiểm tra chặn chuyển quá số dư
  let errCaught = false;
  try {
    await createTransfer(db, userA.id, { recipient: "beta@nova.test", coins: 10000, requestKey: "req-transfer-bad" });
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
  assert.strictEqual(memS.cards.length, 16);
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
  assert.strictEqual(refS.total, 5);
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
  assert.strictEqual(orbS.totalWaves, 8);
  const orbA1 = await gameAction(db, userA.id, { sessionId: orbS.id, version: 0, lane: 2 });
  assert.strictEqual(orbA1.lane, 2, "Chuyển sang quỹ đạo 2 thành công");
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

  // 7. Kiểm tra Rút tiền (Payout) & phê duyệt
  console.log("\n[TEST 7] Tạo yêu cầu rút tiền (Payout), giữ xu & Admin duyệt");
  const payout = await createPayout(db, userA.id, {
    coins: 1000,
    recipient: "https://payoneer.com/receive/userA",
    method: "link",
    requestKey: "req-payout-001"
  });
  assert.strictEqual(payout.status, "pending");
  const heldA = (await db.prepare("SELECT balance FROM wallet_accounts WHERE id=?").bind(`${userA.id}:held`).first()).balance;
  assert.strictEqual(heldA, 1000, "1.000 xu được chuyển sang trạng thái đang giữ");

  // Admin duyệt payout
  await payoutDecision(db, "admin:finance", { id: payout.id, decision: "approve" });
  const approvedPayout = await db.prepare("SELECT status FROM payouts WHERE id=?").bind(payout.id).first();
  assert.strictEqual(approvedPayout.status, "approved");

  // Admin mô phỏng chi trả hoàn tất
  await payoutDecision(db, "admin:finance", { id: payout.id, decision: "simulate_paid" });
  const paidPayout = await db.prepare("SELECT status FROM payouts WHERE id=?").bind(payout.id).first();
  assert.strictEqual(paidPayout.status, "paid");
  console.log("✓ Quy trình rút tiền (Hold -> Approve -> Paid) hoàn tất và ghi sổ kép chuẩn xác!");

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
