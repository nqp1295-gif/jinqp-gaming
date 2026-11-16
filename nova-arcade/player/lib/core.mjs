export const SANDBOX = true;
export const COINS_PER_USD = 1000;
export const TIERS = { bronze: { name: "Đồng", rank: 1 }, gold: { name: "Vàng", rank: 2 }, diamond: { name: "Kim Cương", rank: 3 } };
export const PERIODS = { week: "Tuần", month: "Tháng", year: "Năm" };

export const TOPUP_PACKAGES = [
  { id: "topup-1000", coins: 1000, bonus: 0, priceCents: 100, label: "Khởi đầu", tag: "1.000 xu" },
  { id: "topup-5000", coins: 5000, bonus: 500, priceCents: 500, label: "Tập sự", tag: "Tặng 500 xu" },
  { id: "topup-10000", coins: 10000, bonus: 1500, priceCents: 1000, label: "Cao thủ (Mở Cấp 10)", tag: "Đột phá Cấp 10", popular: true },
  { id: "topup-20000", coins: 20000, bonus: 3500, priceCents: 2000, label: "Chiến binh (Mở Cấp 20)", tag: "Đột phá Cấp 20" },
  { id: "topup-50000", coins: 50000, bonus: 10000, priceCents: 5000, label: "VIP Đặc quyền (Mở Cấp 50)", tag: "Mở Rút tiền Payoneer", best: true },
  { id: "topup-100000", coins: 100000, bonus: 25000, priceCents: 10000, label: "Huyền thoại (Mở Cấp 100)", tag: "Nâng hạn mức rút $500" },
];

export const COUNTRIES = [
  { code: "VN", name: "Việt Nam", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 0, transfer: 1, withdrawal: 0, note: "Nghị định 147/2024: Đơn vị ảo không đổi thành tiền mặt" },
  { code: "DK", name: "Đan Mạch", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 1, transfer: 1, withdrawal: 0, note: "Ưu tiên #1: Pure-skill competition không cần licence" },
  { code: "SE", name: "Thụy Điển", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 1, transfer: 1, withdrawal: 0, note: "Ưu tiên #2: Pure-skill nằm ngoài Gambling Act" },
  { code: "GB", name: "Vương quốc Anh", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 1, transfer: 1, withdrawal: 0, note: "Ưu tiên #3: Prize competition theo Gambling Commission" },
  { code: "EE", name: "Estonia", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 1, transfer: 1, withdrawal: 0, note: "Ưu tiên #4: Lộ trình ETCB skill game permit" },
  { code: "MT", name: "Malta", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 1, transfer: 1, withdrawal: 0, note: "Ưu tiên #5: MGA Type 4 controlled skill games" },
  { code: "TH", name: "Thái Lan", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 0, transfer: 1, withdrawal: 0, note: "BOT / DSI đang rà soát quy định" },
  { code: "SG", name: "Singapore", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 0, transfer: 1, withdrawal: 0, note: "GRA remote gambling xem xét" },
  { code: "IN", name: "Ấn Độ", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 0, transfer: 1, withdrawal: 0, note: "PROG Act 2025 / Rules 2026 rà soát" },
  { code: "LA", name: "Lào", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 0, transfer: 1, withdrawal: 0, note: "Luật hệ thống thanh toán BOL" },
  { code: "CN", name: "Trung Quốc", catalog: 1, play: 1, purchase: 1, cash: 0, comp: 0, transfer: 0, withdrawal: 0, note: "Quy định CAC hạn chế đổi tiền ảo" },
];

export class AppError extends Error {
  constructor(message, status = 400, code = "INVALID_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const id = () => crypto.randomUUID();
const stmt = (db, sql, args = []) => db.prepare(sql).bind(...args.map(a => a === undefined ? null : a));
export const one = (db, sql, args = []) => stmt(db, sql, args).first();
export const rows = async (db, sql, args = []) => (await stmt(db, sql, args).all()).results;

const integer = (v, min, max, label) => {
  if (!Number.isSafeInteger(v) || v < min || v > max) throw new AppError(`${label} không hợp lệ.`);
  return v;
};
const str = (v, min, max, label) => {
  if (typeof v !== "string" || v.trim().length < min || v.length > max) throw new AppError(`${label} không hợp lệ.`);
  return v.trim();
};
const key = (v) => str(v, 8, 120, "Mã yêu cầu");
const day = (n) => new Date(n).toISOString().slice(0, 10);
const parse = (s) => (typeof s === "string" ? JSON.parse(s) : s);
const acc = (u, kind = "available") => `${u}:${kind}`;

export function periodEnd(start, period) {
  const d = new Date(start), date = d.getUTCDate();
  if (period === "week") return start + 7 * 86400000;
  if (!PERIODS[period]) throw new AppError("Thời hạn không hợp lệ.");
  d.setUTCDate(1);
  if (period === "month") d.setUTCMonth(d.getUTCMonth() + 1); else d.setUTCFullYear(d.getUTCFullYear() + 1);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(date, last));
  return d.getTime();
}

export function coinCents(coins) {
  integer(coins, 10, 100000000, "Số xu");
  if (coins % 10) throw new AppError("Số xu quy đổi phải là bội số của 10 (10 xu = 0,01 USD).");
  return coins / 10;
}

export function safeWalletLink(value, optional = false) {
  if (optional && !value) return "";
  let url;
  try { url = new URL(str(value, 10, 1000, "Link ví")); } catch { throw new AppError("Link ví không hợp lệ."); }
  if (url.protocol !== "https:" || url.username || url.password || (url.hostname !== "payoneer.com" && !url.hostname.endsWith(".payoneer.com"))) {
    throw new AppError("Chỉ chấp nhận link HTTPS thuộc payoneer.com.");
  }
  return url.toString();
}

export function validatePlan(p) {
  if (!TIERS[p.tier] || !PERIODS[p.period] || p.id !== `${p.tier}-${p.period}`) throw new AppError("Gói thành viên không hợp lệ.");
  integer(p.price_cents, 100, 1000000, "Giá");
  integer(p.multiplier_bps, 10000, 50000, "Hệ số thưởng");
  integer(p.daily_cap, 10, 100000, "Giới hạn ngày");
  integer(p.session_cap, 10, p.daily_cap, "Giới hạn phiên");
  if (!Array.isArray(p.perks) || p.perks.length > 8 || p.perks.some(x => typeof x !== "string" || !x.trim() || x.length > 120)) {
    throw new AppError("Danh sách đặc quyền không hợp lệ.");
  }
  return { ...p, active: p.active ? 1 : 0 };
}

export async function seed(db) {
  // Ensure all necessary tables exist
  const createStatements = [
    `CREATE TABLE IF NOT EXISTS wallet_accounts (
      id text PRIMARY KEY, user_id text, kind text NOT NULL, unit text NOT NULL, balance integer DEFAULT 0 NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS audit_events (
      id text PRIMARY KEY, actor text NOT NULL, action text NOT NULL, target text NOT NULL, detail text NOT NULL, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS daily_rewards (
      id text PRIMARY KEY, user_id text NOT NULL, day text NOT NULL, total integer DEFAULT 0 NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS favorites (
      id text PRIMARY KEY, user_id text NOT NULL, game_id text NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS game_sessions (
      id text PRIMARY KEY, user_id text NOT NULL, game_id text NOT NULL, state_json text NOT NULL,
      version integer DEFAULT 0 NOT NULL, completed integer DEFAULT 0 NOT NULL, score integer DEFAULT 0 NOT NULL,
      created_at integer NOT NULL, expires_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS games (
      id text PRIMARY KEY, title text NOT NULL, subtitle text NOT NULL, category text NOT NULL,
      art text NOT NULL, engine text, active integer DEFAULT 1 NOT NULL, base_reward integer NOT NULL, sort integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS journal_transactions (
      id text PRIMARY KEY, reference text NOT NULL UNIQUE, reason text NOT NULL, user_id text,
      unit text NOT NULL, status text DEFAULT 'draft' NOT NULL, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS journal_lines (
      id text PRIMARY KEY, transaction_id text NOT NULL, account_id text NOT NULL, delta integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS memberships (
      id text PRIMARY KEY, user_id text NOT NULL, plan_id text NOT NULL, order_id text NOT NULL UNIQUE,
      starts_at integer NOT NULL, ends_at integer NOT NULL, terms_json text NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS bridge_nonces (
      id text PRIMARY KEY, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS orders (
      id text PRIMARY KEY, user_id text NOT NULL, plan_id text NOT NULL, amount_cents integer NOT NULL,
      snapshot_json text NOT NULL, status text DEFAULT 'pending' NOT NULL, method text NOT NULL,
      request_key text NOT NULL, external_ref text, evidence_note text, created_at integer NOT NULL,
      expires_at integer NOT NULL, settled_at integer
    );`,
    `CREATE TABLE IF NOT EXISTS payouts (
      id text PRIMARY KEY, user_id text NOT NULL, coins integer NOT NULL, usd_cents integer NOT NULL,
      recipient text NOT NULL, method text NOT NULL, status text DEFAULT 'pending' NOT NULL,
      request_key text NOT NULL, approved_by text, external_ref text, note text,
      created_at integer NOT NULL, updated_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS plans (
      id text PRIMARY KEY, tier text NOT NULL, period text NOT NULL, price_cents integer NOT NULL,
      multiplier_bps integer NOT NULL, daily_cap integer NOT NULL, session_cap integer NOT NULL,
      perks_json text NOT NULL, active integer DEFAULT 1 NOT NULL, revision integer DEFAULT 1 NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS reward_claims (
      id text PRIMARY KEY, session_id text NOT NULL UNIQUE, user_id text NOT NULL,
      membership_id text NOT NULL, coins integer NOT NULL, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY, value text NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS support_tickets (
      id text PRIMARY KEY, user_id text NOT NULL, subject text NOT NULL, message text NOT NULL,
      status text DEFAULT 'open' NOT NULL, reply text, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS app_users (
      id text PRIMARY KEY, name text NOT NULL, email text NOT NULL, country text DEFAULT 'VN' NOT NULL,
      banned integer DEFAULT 0 NOT NULL, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS wallet_transfers (
      id text PRIMARY KEY, sender_id text NOT NULL, recipient_id text NOT NULL,
      recipient_email text NOT NULL, coins integer NOT NULL, note text,
      status text DEFAULT 'completed' NOT NULL, request_key text NOT NULL, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS tournaments (
      id text PRIMARY KEY, title text NOT NULL, game_id text NOT NULL,
      entry_fee_coins integer NOT NULL, prize_pool_coins integer NOT NULL,
      min_players integer DEFAULT 2 NOT NULL, max_players integer DEFAULT 100 NOT NULL,
      status text DEFAULT 'active' NOT NULL, prize_rules_json text NOT NULL,
      start_time integer NOT NULL, end_time integer NOT NULL, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS tournament_entries (
      id text PRIMARY KEY, tournament_id text NOT NULL, user_id text NOT NULL,
      entry_fee integer NOT NULL, score integer DEFAULT 0 NOT NULL,
      status text DEFAULT 'registered' NOT NULL, prize_won integer DEFAULT 0 NOT NULL,
      created_at integer NOT NULL, played_at integer
    );`,
    `CREATE TABLE IF NOT EXISTS country_policies (
      country_code text PRIMARY KEY, name text NOT NULL,
      catalog_enabled integer DEFAULT 1 NOT NULL, game_play_enabled integer DEFAULT 1 NOT NULL,
      purchase_enabled integer DEFAULT 1 NOT NULL, cash_deposit_enabled integer DEFAULT 0 NOT NULL,
      paid_competition_enabled integer DEFAULT 0 NOT NULL, transfer_enabled integer DEFAULT 1 NOT NULL,
      withdrawal_enabled integer DEFAULT 0 NOT NULL, note text
    );`,
    `CREATE TABLE IF NOT EXISTS game_reviews (
      id text PRIMARY KEY, game_id text NOT NULL, user_id text NOT NULL,
      user_name text NOT NULL, rating integer NOT NULL, comment text NOT NULL, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS gift_codes (
      id text PRIMARY KEY, code text UNIQUE NOT NULL, coins integer NOT NULL,
      max_uses integer DEFAULT 100 NOT NULL, used_count integer DEFAULT 0 NOT NULL,
      expires_at integer, active integer DEFAULT 1 NOT NULL, created_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS gift_code_redemptions (
      id text PRIMARY KEY, code text NOT NULL, user_id text NOT NULL,
      coins integer NOT NULL, created_at integer NOT NULL, UNIQUE(code, user_id)
    );`,
    `CREATE TABLE IF NOT EXISTS user_notifications (
      id text PRIMARY KEY, user_id text NOT NULL, title text NOT NULL,
      message text NOT NULL, kind text DEFAULT 'system' NOT NULL,
      read integer DEFAULT 0 NOT NULL, created_at integer NOT NULL
    );`,
  ];

  for (const q of createStatements) {
    try { await db.prepare(q).run(); } catch { /* ignore if already exists */ }
  }

  const alterColumns = [
    "ALTER TABLE app_users ADD COLUMN password_hash text",
    "ALTER TABLE app_users ADD COLUMN play_time_seconds integer DEFAULT 0",
    "ALTER TABLE app_users ADD COLUMN total_coins_bought integer DEFAULT 0",
    "ALTER TABLE app_users ADD COLUMN level integer DEFAULT 1",
    "ALTER TABLE app_users ADD COLUMN last_payout_time integer DEFAULT 0"
  ];
  for (const ac of alterColumns) {
    try { await db.prepare(ac).run(); } catch {}
  }

  // Seed default giftcodes if none exist
  try {
    const existingGcs = (await one(db, "SELECT COUNT(*) as n FROM gift_codes"))?.n || 0;
    if (existingGcs === 0) {
      const nowSeed = Date.now();
      const defaultCodes = [
        ["gc-welcome", "JINQP2026", 1000, 500, 0, null, 1, nowSeed],
        ["gc-gaming", "GAMINGCENTER", 500, 1000, 0, null, 1, nowSeed],
        ["gc-vip", "VIPBONUS", 2000, 200, 0, null, 1, nowSeed],
      ];
      for (const gc of defaultCodes) {
        await stmt(db, "INSERT INTO gift_codes (id,code,coins,max_uses,used_count,expires_at,active,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING", gc).run();
      }
    }
  } catch {}

  const ver = (await one(db, "SELECT value FROM app_settings WHERE key='seed_version'"))?.value;
  if (ver === "2.0") return;

  const commands = [];
  const prices = { bronze: [300, 900, 7900], gold: [700, 1900, 17900], diamond: [1500, 3900, 34900] };
  for (const [tier, t] of Object.entries(TIERS)) {
    for (const [index, period] of Object.keys(PERIODS).entries()) {
      const multiplier = 10000 + (t.rank - 1) * 5000 + index * 1500;
      const perks = [
        `Thưởng x${(multiplier / 10000).toFixed(2).replace(/0$/, "")}`,
        `${t.rank * 600 + index * 200} xu tối đa/ngày`,
        ...(t.rank > 1 ? ["Ưu tiên hỗ trợ"] : ["Mở khóa tích xu"]),
        ...(t.rank === 3 ? ["Huy hiệu Kim Cương"] : [])
      ];
      commands.push(stmt(db, "INSERT INTO plans (id,tier,period,price_cents,multiplier_bps,daily_cap,session_cap,perks_json,active,revision) VALUES (?,?,?,?,?,?,?,?,1,1) ON CONFLICT(id) DO UPDATE SET active=1", [
        `${tier}-${period}`, tier, period, prices[tier][index], multiplier, t.rank * 600 + index * 200, 150 + t.rank * 50 + index * 25, JSON.stringify(perks)
      ]));
    }
  }

  // Catalog: all 6 games with full HTML5/Canvas engines!
  const catalog = [
    ["memory", "Memory Garden", "Lật thẻ, tìm cặp và thử thách trí nhớ", "Trí tuệ", "memory", "memory", 80],
    ["number", "Number Rush", "Tăng tốc tư duy qua 10 phép tính nhanh", "Trí tuệ", "number", "number", 100],
    ["reflex", "Neon Reflex", "Giữ bình tĩnh. Chạm đúng tín hiệu ánh sáng.", "Phản xạ", "reflex", "reflex", 60],
    ["blocks", "Block District", "Giải đố khối màu, xếp khít dòng và cột kiểu KHỐI8", "Giải đố", "blocks", "blocks", 120],
    ["orbit", "Orbit Runner", "Điều khiển phi thuyền chuyển quỹ đạo né thiên thạch", "Hành động", "orbit", "orbit", 90],
    ["word", "Word Voyage", "Khám phá từ vựng, giải mã các chữ cái xáo trộn", "Giáo dục", "word", "word", 110],
  ];
  catalog.forEach((g, i) => {
    commands.push(stmt(db, "INSERT INTO games (id,title,subtitle,category,art,engine,active,base_reward,sort) VALUES (?,?,?,?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET engine=excluded.engine,active=1", [...g, i]));
  });

  // System accounts for double-entry ledger
  for (const [a, unit] of [
    ["system:rewards", "COIN"],
    ["system:payout", "COIN"],
    ["system:services", "USD_CENT"],
    ["system:clearing", "USD_CENT"],
    ["system:tournament_pool", "COIN"],
    ["system:topup_reserve", "COIN"]
  ]) {
    commands.push(stmt(db, "INSERT INTO wallet_accounts (id,user_id,kind,unit,balance) VALUES (?,NULL,'system',?,0) ON CONFLICT(id) DO NOTHING", [a, unit]));
  }

  // Country compliance policies
  for (const c of COUNTRIES) {
    commands.push(stmt(db, `INSERT INTO country_policies (country_code,name,catalog_enabled,game_play_enabled,purchase_enabled,cash_deposit_enabled,paid_competition_enabled,transfer_enabled,withdrawal_enabled,note)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(country_code) DO UPDATE SET name=excluded.name,note=excluded.note`, [
      c.code, c.name, c.catalog, c.play, c.purchase, c.cash, c.comp, c.transfer, c.withdrawal, c.note
    ]));
  }

  // Initial skill-based Tournaments
  const now = Date.now();
  const initialTournaments = [
    ["tourney-memory", "Giải Trí Tuệ: Memory Grand Prix", "memory", 50, 500, 2, 50, "active", JSON.stringify([50, 30, 20]), now - 3600000, now + 86400000],
    ["tourney-number", "Bão Phép Tính: Number Masters", "number", 100, 1200, 2, 100, "active", JSON.stringify([50, 30, 20]), now - 7200000, now + 43200000],
    ["tourney-reflex", "Đại Chiến Phản Xạ: Neon Blitz", "reflex", 50, 600, 2, 50, "active", JSON.stringify([50, 30, 20]), now - 1800000, now + 28800000],
    ["tourney-blocks", "Bậc Thầy Xếp Khối: Block District", "blocks", 100, 1500, 2, 100, "active", JSON.stringify([50, 30, 20]), now - 10800000, now + 172800000],
  ];
  for (const t of initialTournaments) {
    commands.push(stmt(db, "INSERT INTO tournaments (id,title,game_id,entry_fee_coins,prize_pool_coins,min_players,max_players,status,prize_rules_json,start_time,end_time,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING", [...t, now]));
  }

  // Pre-seed some game reviews
  const initialReviews = [
    ["rev-1", "blocks", "system", "Minh Trí", 5, "Game xếp khối cực cuốn, giao diện mượt mà hệt như KHỐI8!", now - 86400000],
    ["rev-2", "memory", "system", "Lan Anh", 5, "Hình ảnh đẹp mắt, âm thanh nhẹ nhàng dễ chịu.", now - 72000000],
    ["rev-3", "number", "system", "Tuấn Kiệt", 4, "Tính toán nhanh rất kích thích trí não!", now - 50000000],
    ["rev-4", "reflex", "system", "Đức Huy", 5, "Phản xạ nhanh tuyệt vời, giải đấu Neon Blitz rất kịch tính.", now - 30000000],
    ["rev-5", "orbit", "system", "Hoàng Nam", 4, "Né thiên thạch cảm giác rất mượt, đồ họa sci-fi đẹp.", now - 20000000],
    ["rev-6", "word", "system", "Ngọc Mai", 5, "Rèn luyện từ vựng vừa vui vừa bổ ích.", now - 10000000],
  ];
  for (const r of initialReviews) {
    commands.push(stmt(db, "INSERT INTO game_reviews (id,game_id,user_id,user_name,rating,comment,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING", r));
  }

  commands.push(stmt(db, "INSERT INTO app_settings (key,value) VALUES ('payment_config',?) ON CONFLICT(key) DO NOTHING", [
    JSON.stringify({
      payoneer_link: "https://link.payoneer.com/Token?t=3B50A7728EED4CA483E62359684E5967&src=pl",
      instructions: "Quét mã QR Payoneer hoặc mở liên kết thanh toán để nạp tiền vào ví nhận JINQP Gaming Center.",
      currency: "USD"
    })
  ]));
  commands.push(stmt(db, "INSERT INTO app_settings (key,value) VALUES ('seed_version','2.0') ON CONFLICT(key) DO UPDATE SET value='2.0'", []));

  await db.batch(commands);
}

export async function ensureUser(db, user, now = Date.now()) {
  const uid = user?.userId || user?.id;
  if (!uid) throw new AppError("Vui lòng đăng nhập để tiếp tục.", 401, "SIGN_IN_REQUIRED");
  const userName = user.displayName || user.name || (user.email ? user.email.split("@")[0] : "Người chơi");
  await db.batch([
    stmt(db, "INSERT INTO app_users (id,name,email,country,banned,created_at,play_time_seconds,total_coins_bought,level) VALUES (?,?,?,'VN',0,?,0,0,1) ON CONFLICT(id) DO UPDATE SET name=COALESCE(excluded.name, app_users.name),email=COALESCE(excluded.email, app_users.email)", [uid, userName, user.email || null, now]),
    ...["available", "held"].map(k => stmt(db, "INSERT INTO wallet_accounts (id,user_id,kind,unit,balance) VALUES (?,?,?,'COIN',0) ON CONFLICT(id) DO NOTHING", [acc(uid, k), uid, k])),
  ]);
  const u = await one(db, "SELECT * FROM app_users WHERE id=?", [uid]);
  if (u.banned) throw new AppError("Tài khoản đang tạm khóa. Vui lòng liên hệ hỗ trợ.", 403);
  return u;
}

async function hashPassword(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`jinqp-salt:${str}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function computeLevelInfo(playTimeSeconds = 0, totalCoinsBought = 0) {
  const safeSeconds = Math.max(0, Number(playTimeSeconds) || 0);
  const safeCoins = Math.max(0, Number(totalCoinsBought) || 0);

  // 1 level per 10 hours of play = 36000 seconds
  const hoursPlayed = safeSeconds / 3600;
  const rawLevel = Math.max(1, Math.floor(safeSeconds / 36000) + 1);
  const progressPercent = Math.min(100, Math.floor(((safeSeconds % 36000) / 36000) * 100));

  let effectiveLevel = 1;
  let blockedAtCheckpoint = null;
  let neededCoins = 0;

  for (let lvl = 2; lvl <= rawLevel; lvl++) {
    if (lvl % 10 === 0) {
      const required = lvl * 1000;
      if (safeCoins < required) {
        blockedAtCheckpoint = lvl;
        neededCoins = required - safeCoins;
        break;
      }
    }
    effectiveLevel = lvl;
  }

  return {
    level: effectiveLevel,
    rawLevel,
    hoursPlayed: Number(hoursPlayed.toFixed(1)),
    progressPercent: blockedAtCheckpoint ? 100 : progressPercent,
    blockedAtCheckpoint,
    neededCoins,
    totalCoinsBought: safeCoins,
    canWithdraw: effectiveLevel >= 50,
    maxWithdrawalUsd: effectiveLevel >= 100 ? 500 : (effectiveLevel >= 50 ? 50 : 0)
  };
}

export async function checkAndProcessLevelUp(db, userId, now = Date.now()) {
  const u = await one(db, "SELECT * FROM app_users WHERE id = ?", [userId]);
  if (!u) return null;

  const lvlInfo = computeLevelInfo(u.play_time_seconds || 0, u.total_coins_bought || 0);
  const oldLevel = u.level || 1;
  const newLevel = lvlInfo.level;

  if (newLevel !== oldLevel) {
    await stmt(db, "UPDATE app_users SET level = ? WHERE id = ?", [newLevel, userId]).run();

    // Send notifications for milestones of 10
    if (newLevel > oldLevel) {
      for (let milestone = 10; milestone <= newLevel; milestone += 10) {
        if (oldLevel < milestone) {
          let title = `🎉 Chúc mừng bạn đã đạt Cột mốc Cấp ${milestone}!`;
          let msg = `Bạn đã thăng cấp lên Cấp ${milestone} thành công nhờ chăm chỉ chơi game và đồng hành cùng JINQP Gaming Center!`;

          if (milestone === 50) {
            title = `🌟 ĐẶC QUYỀN MỞ KHÓA: ĐẠT CẤP ${milestone}!`;
            msg = `Chúc mừng bạn đã đạt Cột mốc Cấp 50! Bạn đã mở khóa tính năng đặc quyền: Rút tiền thưởng về ví Payoneer (Hạn mức: tối đa 50 USD / lần rút, mỗi ngày rút 1 lần)!`;
          } else if (milestone === 100) {
            title = `👑 ĐỈNH CAO DANH VỌNG: ĐẠT CẤP ${milestone}!`;
            msg = `Chúc mừng bạn đã đạt Cột mốc Đỉnh cao Cấp 100! Hạn mức Rút tiền về ví Payoneer của bạn đã được nâng cấp lên tối đa 500 USD / lần rút (mỗi ngày rút 1 lần)!`;
          }

          const notifId = id();
          try {
            await stmt(db, `INSERT INTO user_notifications (id, user_id, title, message, kind, read, created_at) VALUES (?, ?, ?, ?, 'level_up', 0, ?)`, [
              notifId, userId, title, msg, now
            ]).run();
          } catch {}
        }
      }
    }
  }

  return lvlInfo;
}

export async function addPlayTime(db, userId, seconds, now = Date.now()) {
  const s = Math.min(Math.max(1, Math.floor(seconds || 0)), 300);
  await stmt(db, "UPDATE app_users SET play_time_seconds = play_time_seconds + ? WHERE id = ?", [s, userId]).run();
  return checkAndProcessLevelUp(db, userId, now);
}

export async function redeemGiftCode(db, userId, codeStr, now = Date.now()) {
  const code = str(codeStr, 2, 50, "Mã quà tặng").trim().toUpperCase();
  const gc = await one(db, "SELECT * FROM gift_codes WHERE code=? AND active=1", [code]);
  if (!gc) throw new AppError("Mã quà tặng không hợp lệ hoặc đã bị khóa.", 404);
  if (gc.expires_at && gc.expires_at < now) throw new AppError("Mã quà tặng đã hết thời gian hiệu lực.", 400);
  if (gc.used_count >= gc.max_uses) throw new AppError("Mã quà tặng đã hết lượt sử dụng.", 400);

  const existing = await one(db, "SELECT id FROM gift_code_redemptions WHERE code=? AND user_id=?", [code, userId]);
  if (existing) throw new AppError("Bạn đã nhận mã quà tặng này rồi.", 400);

  const redId = id();
  try {
    await db.batch([
      stmt(db, "INSERT INTO gift_code_redemptions (id, code, user_id, coins, created_at) VALUES (?, ?, ?, ?, ?)", [redId, code, userId, gc.coins, now]),
      stmt(db, "UPDATE gift_codes SET used_count = used_count + 1 WHERE id = ?", [gc.id]),
      stmt(db, "UPDATE wallet_accounts SET balance = balance + ? WHERE id = ?", [gc.coins, acc(userId)]),
      ...posting(db, `giftcode:${redId}`, "giftcode_reward", userId, "COIN", [
        [acc(userId), gc.coins],
        ["system:rewards", -gc.coins]
      ], now),
      auditStatement(db, userId, "giftcode.redeemed", gc.code, `Nhận ${gc.coins} xu từ mã quà tặng ${gc.code}`, now),
    ]);
  } catch (e) {
    const dup = await one(db, "SELECT id FROM gift_code_redemptions WHERE code=? AND user_id=?", [code, userId]);
    if (dup) throw new AppError("Bạn đã nhận mã quà tặng này rồi.", 400);
    throw e;
  }

  try {
    await stmt(db, `INSERT INTO user_notifications (id, user_id, title, message, kind, read, created_at) VALUES (?, ?, ?, ?, 'giftcode', 0, ?)`, [
      id(), userId, `🎁 Nhận thành công ${gc.coins} xu từ mã quà tặng!`, `Mã quà tặng [${gc.code}] đã được cộng ${gc.coins} xu vào số dư khả dụng của bạn.`, now
    ]).run();
  } catch {}

  return { success: true, coins: gc.coins, code: gc.code };
}

export async function signUpUser(db, input, now = Date.now()) {
  const name = str(input.displayName || input.name, 2, 40, "Tên hiển thị").trim();
  const email = str(input.email, 5, 80, "Email").trim().toLowerCase();
  const password = str(input.password, 4, 100, "Mật khẩu");
  const country = (input.country || "VN").slice(0, 2).toUpperCase();

  const existing = await one(db, "SELECT id FROM app_users WHERE email = ?", [email]);
  if (existing) throw new AppError("Email này đã được sử dụng. Vui lòng đăng nhập.", 400);

  const userId = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const passwordHash = await hashPassword(password);

  await db.batch([
    stmt(db, "INSERT INTO app_users (id, name, email, password_hash, country, banned, created_at, play_time_seconds, total_coins_bought, level) VALUES (?, ?, ?, ?, ?, 0, ?, 0, 0, 1)", [
      userId, name, email, passwordHash, country, now
    ]),
    ...["available", "held"].map(k => stmt(db, "INSERT INTO wallet_accounts (id,user_id,kind,unit,balance) VALUES (?,?,?,'COIN',0) ON CONFLICT(id) DO NOTHING", [acc(userId, k), userId, k])),
  ]);

  try {
    await stmt(db, `INSERT INTO user_notifications (id, user_id, title, message, kind, read, created_at) VALUES (?, ?, ?, ?, 'welcome', 0, ?)`, [
      id(), userId, "Chào mừng đến với JINQP Gaming Center!", "Tài khoản của bạn đã được khởi tạo thành công. Hãy khám phá kho game, tham gia giải đấu và tích lũy cấp độ nhé!", now
    ]).run();
  } catch {}

  const u = await one(db, "SELECT * FROM app_users WHERE id = ?", [userId]);
  return { id: u.id, name: u.name, email: u.email, country: u.country, level: u.level };
}

export async function signInUser(db, input) {
  const emailOrName = str(input.email || input.account, 2, 80, "Tài khoản").trim();
  const password = str(input.password, 1, 100, "Mật khẩu");

  const u = await one(db, "SELECT * FROM app_users WHERE email = ? OR name = ? OR id = ?", [emailOrName.toLowerCase(), emailOrName, emailOrName]);
  if (!u) throw new AppError("Tài khoản hoặc mật khẩu không chính xác.", 401);
  if (u.banned) throw new AppError("Tài khoản đang bị tạm khóa. Vui lòng liên hệ hỗ trợ.", 403);

  if (u.password_hash) {
    const inputHash = await hashPassword(password);
    if (u.password_hash !== inputHash) {
      throw new AppError("Tài khoản hoặc mật khẩu không chính xác.", 401);
    }
  }

  return { id: u.id, name: u.name, email: u.email, country: u.country, level: u.level };
}

export async function membership(db, userId, now = Date.now()) {
  const list = await rows(db, "SELECT * FROM memberships WHERE user_id=? AND starts_at<=? AND ends_at>?", [userId, now, now]);
  return list.map(m => ({ ...m, terms: parse(m.terms_json) })).sort((a, b) =>
    TIERS[b.terms.tier].rank - TIERS[a.terms.tier].rank ||
    b.terms.multiplier_bps - a.terms.multiplier_bps ||
    b.ends_at - a.ends_at
  )[0] || null;
}

export async function bootstrap(db, user) {
  await seed(db);
  const countryPolicies = await rows(db, "SELECT * FROM country_policies ORDER BY country_code");
  const gamesList = await rows(db, "SELECT * FROM games WHERE active=1 ORDER BY sort");
  const reviewsList = await rows(db, "SELECT * FROM game_reviews ORDER BY created_at DESC LIMIT 30");

  const result = {
    sandbox: true,
    coinsPerUsd: COINS_PER_USD,
    livePayments: false,
    plans: (await rows(db, "SELECT * FROM plans WHERE active=1")).map(p => ({ ...p, perks: parse(p.perks_json) })),
    topupPackages: TOPUP_PACKAGES,
    games: gamesList,
    reviews: reviewsList,
    countryPolicies,
    tournaments: await getTournamentsWithLeaderboard(db, user?.userId),
    user: null,
  };

  if (!user) return result;

  const u = await ensureUser(db, user), now = Date.now();
  const levelInfo = await checkAndProcessLevelUp(db, u.id, now);
  const userAccounts = await rows(db, "SELECT kind,balance FROM wallet_accounts WHERE user_id=?", [u.id]);
  const userNotifications = await rows(db, "SELECT * FROM user_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50", [u.id]);
  const unreadCount = (await one(db, "SELECT COUNT(*) as n FROM user_notifications WHERE user_id=? AND read=0", [u.id]))?.n || 0;
  const userTransfers = await rows(db, `
    SELECT t.*, u_from.name AS sender_name, u_to.name AS recipient_name
    FROM wallet_transfers t
    LEFT JOIN app_users u_from ON u_from.id = t.sender_id
    LEFT JOIN app_users u_to ON u_to.id = t.recipient_id
    WHERE t.sender_id=? OR t.recipient_id=?
    ORDER BY t.created_at DESC LIMIT 30
  `, [u.id, u.id]);

  result.user = {
    id: u.id,
    name: u.name,
    email: u.email,
    country: u.country,
    level: levelInfo?.level || u.level || 1,
    levelInfo: levelInfo || computeLevelInfo(u.play_time_seconds, u.total_coins_bought),
    membership: await membership(db, u.id),
    accounts: userAccounts,
    earnedToday: (await one(db, "SELECT total FROM daily_rewards WHERE id=?", [`${u.id}:${day(now)}`]))?.total || 0,
    favorites: (await rows(db, "SELECT game_id FROM favorites WHERE user_id=?", [u.id])).map(x => x.game_id),
    orders: await rows(db, "SELECT id,plan_id,amount_cents,status,method,created_at,expires_at,snapshot_json FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 30", [u.id]),
    payouts: await rows(db, "SELECT * FROM payouts WHERE user_id=? ORDER BY created_at DESC LIMIT 30", [u.id]),
    transfers: userTransfers,
    notifications: userNotifications,
    unreadNotificationsCount: unreadCount,
    history: await rows(db, `
      SELECT j.id,j.reason,j.created_at,l.delta
      FROM journal_transactions j
      JOIN journal_lines l ON l.transaction_id=j.id
      WHERE l.account_id=? AND j.status='posted'
      ORDER BY j.created_at DESC LIMIT 50
    `, [acc(u.id)]),
    tickets: await rows(db, "SELECT * FROM support_tickets WHERE user_id=? ORDER BY created_at DESC LIMIT 20", [u.id])
  };

  return result;
}

function posting(db, reference, reason, userId, unit, entries, now = Date.now(), onlyIf = "", predicateArgs = []) {
  const transactionId = id(), where = onlyIf ? ` WHERE ${onlyIf}` : "";
  return [
    stmt(db, `INSERT INTO journal_transactions (id,reference,reason,user_id,unit,status,created_at) SELECT ?,?,?,?,?,'draft',?${where}`, [transactionId, reference, reason, userId, unit, now, ...predicateArgs]),
    ...entries.map(([account, delta]) =>
      stmt(db, "INSERT INTO journal_lines (id,transaction_id,account_id,delta) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM journal_transactions WHERE id=?)", [id(), transactionId, account, delta, transactionId])
    ),
    stmt(db, "UPDATE journal_transactions SET status='posted' WHERE id=?", [transactionId]),
  ];
}

function auditStatement(db, actor, action, target, detail, now = Date.now()) {
  return stmt(db, "INSERT INTO audit_events (id,actor,action,target,detail,created_at) VALUES (?,?,?,?,?,?)", [id(), actor, action, target, detail, now]);
}

// -------------------------
// ORDERS & REFILL FLOW (balance-refill-flow=purchase)
// -------------------------

export async function createOrder(db, userId, input, now = Date.now()) {
  const requestKey = key(input.requestKey);
  const planId = str(input.planId, 3, 50, "Gói");
  const method = str(input.method, 2, 20, "Phương thức");

  const previous = await one(db, "SELECT * FROM orders WHERE user_id=? AND request_key=?", [userId, requestKey]);
  if (previous) {
    if (previous.plan_id !== planId || previous.method !== method) throw new AppError("Mã yêu cầu đã dùng cho nội dung khác.", 409);
    return previous;
  }

  let amountCents = 0;
  let snapshot = {};

  if (planId.startsWith("topup-")) {
    const pkg = TOPUP_PACKAGES.find(p => p.id === planId);
    if (!pkg) {
      if (planId === "topup-custom") {
        const customCoins = integer(input.customCoins, 50, 100000, "Số xu tùy chỉnh");
        if (customCoins % 10 !== 0) throw new AppError("Số xu phải chia hết cho 10.");
        amountCents = Math.round(customCoins / 10);
        snapshot = { type: "topup", coins: customCoins, bonus: 0, priceCents: amountCents, label: `${customCoins} xu tùy chỉnh` };
      } else {
        throw new AppError("Gói nạp không khả dụng.", 404);
      }
    } else {
      amountCents = pkg.priceCents;
      snapshot = { type: "topup", coins: pkg.coins, bonus: pkg.bonus, priceCents: pkg.priceCents, label: pkg.label };
    }
  } else {
    // Membership plan
    const p = await one(db, "SELECT * FROM plans WHERE id=? AND active=1", [planId]);
    if (!p) throw new AppError("Gói không còn khả dụng.", 404);
    if (input.revision && input.revision !== p.revision) throw new AppError("Gói đã thay đổi. Vui lòng tải lại và xác nhận giá mới.", 409);
    amountCents = p.price_cents;
    snapshot = { type: "membership", ...p };
  }

  const orderId = id();
  try {
    await stmt(db, `INSERT INTO orders (id,user_id,plan_id,amount_cents,snapshot_json,status,method,request_key,created_at,expires_at)
      VALUES (?,?,?,?,?,'pending',?,?,?,?)`, [
      orderId, userId, planId, amountCents, JSON.stringify(snapshot), method, requestKey, now, now + 30 * 60000
    ]).run();
  } catch (e) {
    const duplicate = await one(db, "SELECT * FROM orders WHERE user_id=? AND request_key=?", [userId, requestKey]);
    if (duplicate && duplicate.plan_id === planId && duplicate.method === method) return duplicate;
    throw e;
  }

  return one(db, "SELECT * FROM orders WHERE id=?", [orderId]);
}

export async function simulatePayment(db, userId, orderId, now = Date.now(), actor = userId) {
  const o = await one(db, "SELECT * FROM orders WHERE id=? AND user_id=?", [orderId, userId]);
  if (!o) throw new AppError("Không tìm thấy đơn.", 404);
  if (o.status === "paid") return o;
  if (o.status !== "pending" || o.expires_at < now) throw new AppError("Đơn đã hết hạn hoặc đã hủy.", 409);

  const snapshot = parse(o.snapshot_json);

  if (snapshot.type === "topup") {
    const totalCoins = (snapshot.coins || 0) + (snapshot.bonus || 0);
    try {
      await db.batch([
        // Double-entry ledger: debit clearing, credit user available
        ...posting(db, `topup:${o.id}`, "topup_refill", userId, "COIN", [
          [acc(userId), totalCoins],
          ["system:rewards", -totalCoins]
        ], now),
        stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [totalCoins, acc(userId)]),
        stmt(db, "UPDATE orders SET status='paid',settled_at=?,external_ref=? WHERE id=? AND status='pending'", [
          now, `sandbox-topup:${o.id}`, o.id
        ]),
        stmt(db, "UPDATE app_users SET total_coins_bought=total_coins_bought+? WHERE id=?", [totalCoins, userId]),
        auditStatement(db, actor, "sandbox.topup.confirmed", o.id, `Nạp ${totalCoins} xu thử nghiệm thành công`, now),
      ]);
      await checkAndProcessLevelUp(db, userId, now);
    } catch (e) {
      const cur = await one(db, "SELECT * FROM orders WHERE id=?", [o.id]);
      if (cur?.status !== "paid") throw e;
    }
  } else {
    // Membership plan payment
    const last = await one(db, "SELECT MAX(ends_at) AS ends_at FROM memberships WHERE user_id=? AND plan_id=?", [userId, snapshot.id]);
    const start = Math.max(now, last?.ends_at || 0), end = periodEnd(start, snapshot.period);
    try {
      await db.batch([
        ...posting(db, `service:${o.id}`, "membership", userId, "USD_CENT", [
          ["system:services", o.amount_cents],
          ["system:clearing", -o.amount_cents]
        ], now),
        stmt(db, "INSERT INTO memberships (id,user_id,plan_id,order_id,starts_at,ends_at,terms_json) VALUES (?,?,?,?,?,?,?)", [
          id(), userId, snapshot.id, o.id, start, end, JSON.stringify(snapshot)
        ]),
        stmt(db, "UPDATE orders SET status='paid',settled_at=?,external_ref=? WHERE id=? AND status='pending'", [
          now, `sandbox:${o.id}`, o.id
        ]),
        auditStatement(db, actor, "sandbox.payment.confirmed", o.id, "Thanh toán thành viên mô phỏng; không nhận tiền thật", now),
      ]);
    } catch (e) {
      const current = await one(db, "SELECT * FROM orders WHERE id=?", [o.id]);
      if (current?.status !== "paid") throw e;
    }
  }

  return one(db, "SELECT * FROM orders WHERE id=?", [o.id]);
}

// -------------------------
// P2P BALANCE TRANSFER
// -------------------------

export async function createTransfer(db, userId, input, now = Date.now()) {
  const coins = integer(input.coins, 10, 1000000, "Số xu chuyển");
  const requestKey = key(input.requestKey);
  const recipientTarget = str(input.recipient, 3, 150, "Người nhận");
  const note = input.note ? str(input.note, 1, 200, "Lời nhắn") : "Chuyển xu NOVA";

  const old = await one(db, "SELECT * FROM wallet_transfers WHERE sender_id=? AND request_key=?", [userId, requestKey]);
  if (old) return old;

  // Verify recipient
  const recipient = await one(db, "SELECT * FROM app_users WHERE (LOWER(email)=LOWER(?) OR id=?) AND banned=0", [recipientTarget, recipientTarget]);
  if (!recipient) throw new AppError("Không tìm thấy tài khoản người nhận hợp lệ hoặc tài khoản đang bị khóa.", 404);
  if (recipient.id === userId) throw new AppError("Không thể chuyển xu cho chính mình.", 400);

  // Check sender balance
  const senderWallet = await one(db, "SELECT balance FROM wallet_accounts WHERE id=?", [acc(userId)]);
  if (!senderWallet || senderWallet.balance < coins) {
    throw new AppError("Số dư khả dụng không đủ để thực hiện chuyển.", 409, "INSUFFICIENT_FUNDS");
  }

  const transferId = id();
  try {
    await db.batch([
      stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id=? AND balance>=?", [coins, acc(userId), coins]),
      stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [coins, acc(recipient.id)]),
      ...posting(db, `transfer:${transferId}`, "p2p_transfer", userId, "COIN", [
        [acc(userId), -coins],
        [acc(recipient.id), coins]
      ], now),
      stmt(db, `INSERT INTO wallet_transfers (id,sender_id,recipient_id,recipient_email,coins,note,status,request_key,created_at)
        VALUES (?,?,?,?,?,?,'completed',?,?)`, [
        transferId, userId, recipient.id, recipient.email, coins, note, requestKey, now
      ]),
      auditStatement(db, userId, "transfer.sent", transferId, `Chuyển ${coins} xu cho ${recipient.email}`, now),
    ]);
  } catch (e) {
    const dup = await one(db, "SELECT * FROM wallet_transfers WHERE sender_id=? AND request_key=?", [userId, requestKey]);
    if (dup) return dup;
    throw e;
  }

  return one(db, "SELECT * FROM wallet_transfers WHERE id=?", [transferId]);
}

// -------------------------
// TOURNAMENTS & SKILL COMPETITIONS
// -------------------------

export async function getTournamentsWithLeaderboard(db, currentUserId = null) {
  const list = await rows(db, "SELECT * FROM tournaments ORDER BY end_time ASC");
  const enriched = [];
  for (const t of list) {
    const entries = await rows(db, `
      SELECT e.*, u.name as user_name
      FROM tournament_entries e
      JOIN app_users u ON u.id = e.user_id
      WHERE e.tournament_id=?
      ORDER BY e.score DESC, e.played_at ASC
    `, [t.id]);
    const myEntry = currentUserId ? entries.find(e => e.user_id === currentUserId) : null;
    enriched.push({
      ...t,
      rules: parse(t.prize_rules_json),
      totalEntries: entries.length,
      leaderboard: entries.slice(0, 10),
      myEntry: myEntry || null,
    });
  }
  return enriched;
}

export async function joinTournament(db, userId, tournamentId, now = Date.now()) {
  const tourney = await one(db, "SELECT * FROM tournaments WHERE id=?", [tournamentId]);
  if (!tourney) throw new AppError("Không tìm thấy giải đấu.", 404);
  if (tourney.status !== "active") throw new AppError("Giải đấu đã kết thúc hoặc bị hủy.", 409);
  if (tourney.end_time < now) throw new AppError("Giải đấu đã hết thời gian đăng ký.", 409);

  const existing = await one(db, "SELECT * FROM tournament_entries WHERE tournament_id=? AND user_id=?", [tournamentId, userId]);
  if (existing) return existing;

  const entryCount = (await one(db, "SELECT COUNT(*) as n FROM tournament_entries WHERE tournament_id=?", [tournamentId]))?.n || 0;
  if (entryCount >= tourney.max_players) throw new AppError("Giải đấu đã đủ số lượng người tham gia.", 409);

  const wallet = await one(db, "SELECT balance FROM wallet_accounts WHERE id=?", [acc(userId)]);
  if (!wallet || wallet.balance < tourney.entry_fee_coins) {
    throw new AppError("Số dư xu không đủ để tham gia giải.", 409, "INSUFFICIENT_FUNDS");
  }

  const entryId = id();
  try {
    await db.batch([
      stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id=? AND balance>=?", [tourney.entry_fee_coins, acc(userId), tourney.entry_fee_coins]),
      stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id='system:tournament_pool'", [tourney.entry_fee_coins]),
      stmt(db, "UPDATE tournaments SET prize_pool_coins=prize_pool_coins+? WHERE id=?", [tourney.entry_fee_coins, tournamentId]),
      ...posting(db, `tourney-entry:${entryId}`, "tournament_entry_fee", userId, "COIN", [
        [acc(userId), -tourney.entry_fee_coins],
        ["system:tournament_pool", tourney.entry_fee_coins]
      ], now),
      stmt(db, `INSERT INTO tournament_entries (id,tournament_id,user_id,entry_fee,score,status,prize_won,created_at)
        VALUES (?,?,?,?,0,'registered',0,?)`, [
        entryId, tournamentId, userId, tourney.entry_fee_coins, now
      ]),
      auditStatement(db, userId, "tournament.joined", tournamentId, `Tham gia giải đấu, trừ phí ${tourney.entry_fee_coins} xu`, now)
    ]);
  } catch (e) {
    const dup = await one(db, "SELECT * FROM tournament_entries WHERE tournament_id=? AND user_id=?", [tournamentId, userId]);
    if (dup) return dup;
    throw e;
  }

  return one(db, "SELECT * FROM tournament_entries WHERE id=?", [entryId]);
}

export async function submitTournamentScore(db, userId, tournamentId, sessionId, now = Date.now()) {
  const entry = await one(db, "SELECT * FROM tournament_entries WHERE tournament_id=? AND user_id=?", [tournamentId, userId]);
  if (!entry) throw new AppError("Bạn chưa tham gia giải đấu này.", 404);

  const session = await one(db, "SELECT * FROM game_sessions WHERE id=? AND user_id=? AND completed=1", [sessionId, userId]);
  if (!session) throw new AppError("Phiên chơi chưa hoàn tất hoặc không hợp lệ.", 400);

  // Update entry score if higher
  const newScore = Math.max(entry.score, session.score);
  await stmt(db, "UPDATE tournament_entries SET score=?,status='played',played_at=? WHERE id=?", [
    newScore, now, entry.id
  ]).run();

  return one(db, "SELECT * FROM tournament_entries WHERE id=?", [entry.id]);
}

export async function settleTournament(db, actor, tournamentId, now = Date.now()) {
  const tourney = await one(db, "SELECT * FROM tournaments WHERE id=?", [tournamentId]);
  if (!tourney) throw new AppError("Không tìm thấy giải đấu.", 404);
  if (tourney.status === "settled") throw new AppError("Giải đấu đã được quyết toán trao thưởng.", 409);

  const entries = await rows(db, "SELECT * FROM tournament_entries WHERE tournament_id=? ORDER BY score DESC, played_at ASC", [tournamentId]);
  if (!entries.length) {
    await stmt(db, "UPDATE tournaments SET status='settled' WHERE id=?", [tournamentId]).run();
    return { settled: true, winners: [] };
  }

  const rules = parse(tourney.prize_rules_json) || [50, 30, 20];
  const winners = [];
  const batchStatements = [];

  for (let i = 0; i < Math.min(entries.length, rules.length); i++) {
    const e = entries[i];
    const prizeShare = rules[i] || 0;
    const prizeCoins = Math.floor((tourney.prize_pool_coins * prizeShare) / 100);
    if (prizeCoins > 0) {
      winners.push({ rank: i + 1, userId: e.user_id, prizeCoins });
      batchStatements.push(
        stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [prizeCoins, acc(e.user_id)]),
        stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id='system:tournament_pool'", [prizeCoins]),
        ...posting(db, `tourney-prize:${e.id}`, "tournament_prize_won", e.user_id, "COIN", [
          [acc(e.user_id), prizeCoins],
          ["system:tournament_pool", -prizeCoins]
        ], now),
        stmt(db, "UPDATE tournament_entries SET prize_won=?,status='winner' WHERE id=?", [prizeCoins, e.id]),
        auditStatement(db, actor, "tournament.prize_awarded", e.id, `Trao thưởng Top ${i + 1}: ${prizeCoins} xu`, now)
      );
    }
  }

  batchStatements.push(
    stmt(db, "UPDATE tournaments SET status='settled' WHERE id=?", [tournamentId]),
    auditStatement(db, actor, "tournament.settled", tournamentId, `Quyết toán giải đấu ${tourney.title}`, now)
  );

  await db.batch(batchStatements);
  return { settled: true, winners };
}

// -------------------------
// GAME ENGINES (Memory, Number, Reflex, Blocks, Orbit, Word)
// -------------------------

const rand = n => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
};
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Block shapes for Block District
const BLOCK_SHAPES = [
  [[0,0]], // 1x1
  [[0,0],[0,1]], // 1x2 horizontal
  [[0,0],[1,0]], // 2x1 vertical
  [[0,0],[0,1],[1,0],[1,1]], // 2x2 square
  [[0,0],[0,1],[0,2]], // 1x3
  [[0,0],[1,0],[2,0]], // 3x1
  [[0,0],[1,0],[1,1]], // L small
  [[0,0],[0,1],[1,0]], // Corner
];

const WORDS_VOCABULARY = [
  { word: "ARCADE", clue: "Cổng trò chơi điện tử trực tuyến" },
  { word: "GALAXY", clue: "Dải ngân hà giữa vũ trụ bao la" },
  { word: "VICTORY", clue: "Cảm giác tuyệt vời khi chạm đỉnh vinh quang" },
  { word: "PUZZLE", clue: "Câu đố trí tuệ đòi hỏi tư duy logic" },
  { word: "CHAMPION", clue: "Nhà vô địch trên bảng xếp hạng" },
  { word: "REFLEX", clue: "Phản xạ nhanh nhạy trong từng tích tắc" },
];

function publicState(session) {
  const s = parse(session.state_json);
  const common = {
    id: session.id,
    gameId: session.game_id,
    version: session.version,
    completed: !!session.completed,
    score: session.score,
    expiresAt: session.expires_at
  };

  if (session.game_id === "memory") {
    return { ...common, moves: s.moves, matched: s.matched, cards: s.deck.map((v, i) => s.matched.includes(i) || s.open.includes(i) ? v : null) };
  }
  if (session.game_id === "number") {
    return { ...common, index: s.index, total: 10, correct: s.correct, feedback: s.feedback, question: s.questions[s.index]?.text || null };
  }
  if (session.game_id === "reflex") {
    return { ...common, round: s.round, total: 5, goAt: s.goAt, times: s.times, feedback: s.feedback };
  }
  if (session.game_id === "blocks") {
    return {
      ...common,
      board: s.board,
      currentShapes: s.shapes,
      placedIndices: s.placed,
      linesCleared: s.linesCleared,
      feedback: s.feedback,
      turn: s.turn,
      totalTurns: 6
    };
  }
  if (session.game_id === "orbit") {
    return {
      ...common,
      lane: s.lane,
      wave: s.wave,
      totalWaves: 8,
      hazardLanes: s.hazardLanes,
      strikeAt: s.strikeAt,
      feedback: s.feedback
    };
  }
  if (session.game_id === "word") {
    return {
      ...common,
      index: s.index,
      total: 5,
      scrambled: s.scrambled,
      clue: s.clue,
      correct: s.correct,
      feedback: s.feedback
    };
  }
  return common;
}

export async function startGame(db, userId, gameId, now = Date.now()) {
  const g = await one(db, "SELECT * FROM games WHERE id=? AND active=1 AND engine IS NOT NULL", [gameId]);
  if (!g) throw new AppError("Game chưa khả dụng.", 404);

  const recent = await one(db, "SELECT COUNT(*) AS n FROM game_sessions WHERE user_id=? AND created_at>?", [userId, now - 60000]);
  if (recent.n >= 15) throw new AppError("Bạn mở phiên quá nhanh. Hãy đợi một chút.", 429);

  let state;
  if (gameId === "memory") {
    state = { deck: shuffle([0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7]), open: [], matched: [], moves: 0 };
  } else if (gameId === "number") {
    state = {
      index: 0, correct: 0, feedback: null,
      questions: Array.from({ length: 10 }, () => {
        const a = rand(25) + 2, b = rand(15) + 2, m = rand(3) === 0;
        return { text: `${a} ${m ? "×" : "+"} ${b}`, answer: m ? a * b : a + b };
      })
    };
  } else if (gameId === "reflex") {
    state = { round: 0, goAt: now + 2000 + rand(2000), times: [], feedback: "Chờ tín hiệu xanh…" };
  } else if (gameId === "blocks") {
    // 8x8 board: 64 cells
    state = {
      board: Array(64).fill(0),
      shapes: [BLOCK_SHAPES[rand(BLOCK_SHAPES.length)], BLOCK_SHAPES[rand(BLOCK_SHAPES.length)], BLOCK_SHAPES[rand(BLOCK_SHAPES.length)]],
      placed: [],
      linesCleared: 0,
      feedback: "Chọn một khối hình và đặt vào ô trống trên bàn cờ.",
      turn: 1
    };
  } else if (gameId === "orbit") {
    // 3 orbital lanes: 0 (Inner), 1 (Middle), 2 (Outer)
    const hazard = rand(3);
    state = {
      lane: 1,
      wave: 0,
      hazardLanes: [hazard],
      strikeAt: now + 2200,
      feedback: `Cảnh báo thiên thạch ở quỹ đạo ${hazard === 0 ? "Trong" : hazard === 1 ? "Giữa" : "Ngoài"}!`
    };
  } else if (gameId === "word") {
    const shuffledWords = shuffle(WORDS_VOCABULARY).slice(0, 5);
    const firstWord = shuffledWords[0];
    state = {
      words: shuffledWords,
      index: 0,
      correct: 0,
      scrambled: shuffle(firstWord.word.split("")).join(""),
      clue: firstWord.clue,
      feedback: "Giải mã các chữ cái để tìm từ đúng."
    };
  } else {
    throw new AppError("Loại trò chơi chưa được hỗ trợ.");
  }

  const session = {
    id: id(),
    user_id: userId,
    game_id: gameId,
    state_json: JSON.stringify(state),
    version: 0,
    completed: 0,
    score: 0,
    created_at: now,
    expires_at: now + 15 * 60000
  };

  await stmt(db, `INSERT INTO game_sessions (id,user_id,game_id,state_json,version,completed,score,created_at,expires_at)
    VALUES (?,?,?,?,0,0,0,?,?)`, [
    session.id, userId, gameId, session.state_json, now, session.expires_at
  ]).run();

  return publicState(session);
}

export async function gameAction(db, userId, input, now = Date.now()) {
  const session = await one(db, "SELECT * FROM game_sessions WHERE id=? AND user_id=?", [input.sessionId, userId]);
  if (!session) throw new AppError("Không tìm thấy phiên chơi.", 404);
  if (session.expires_at < now) throw new AppError("Phiên đã hết hạn. Hãy bắt đầu lại.", 410);
  if (session.completed) return publicState(session);
  if (input.version !== session.version) throw new AppError("Thao tác đã thay đổi. Vui lòng thử lại.", 409);

  const s = parse(session.state_json);
  let completed = 0, score = session.score;

  if (session.game_id === "memory") {
    const index = integer(input.index, 0, 15, "Thẻ");
    if (s.open.length === 2) s.open = [];
    if (s.matched.includes(index) || s.open.includes(index)) throw new AppError("Chọn một thẻ khác.");
    s.open.push(index);
    if (s.open.length === 2) {
      s.moves++;
      if (s.deck[s.open[0]] === s.deck[s.open[1]]) {
        s.matched.push(...s.open);
        s.open = [];
      }
    }
    completed = s.matched.length === 16 ? 1 : 0;
    score = completed ? Math.max(20, 160 - (s.moves - 8) * 5) : s.matched.length * 10;

  } else if (session.game_id === "number") {
    const answer = integer(input.answer, -10000, 10000, "Câu trả lời");
    const correct = answer === s.questions[s.index].answer;
    s.correct += correct ? 1 : 0;
    s.feedback = correct ? "Chính xác!" : `Đáp án là ${s.questions[s.index].answer}`;
    s.index++;
    completed = s.index === 10 ? 1 : 0;
    score = s.correct * 100;

  } else if (session.game_id === "reflex") {
    const elapsed = now - s.goAt;
    s.round++;
    s.times.push(elapsed >= 100 && elapsed <= 3000 ? elapsed : 3000);
    s.feedback = elapsed < 100 ? "Quá sớm! Lượt này chưa đạt." : elapsed > 3000 ? "Hết thời gian lượt này." : `${elapsed} ms`;
    s.goAt = now + 1500 + rand(2000);
    completed = s.round === 5 ? 1 : 0;
    score = Math.max(0, Math.round(1000 - s.times.reduce((a, b) => a + b, 0) / s.times.length / 3));

  } else if (session.game_id === "blocks") {
    const pieceIdx = integer(input.pieceIndex, 0, 2, "Khối hình");
    const targetRow = integer(input.row, 0, 7, "Hàng");
    const targetCol = integer(input.col, 0, 7, "Cột");

    if (s.placed.includes(pieceIdx)) throw new AppError("Khối này đã được đặt rồi.");
    const shape = s.shapes[pieceIdx];

    // Check validity of placing shape at (targetRow, targetCol)
    for (const [dr, dc] of shape) {
      const r = targetRow + dr;
      const c = targetCol + dc;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) throw new AppError("Vị trí vượt ra ngoài bảng cờ.");
      if (s.board[r * 8 + c] !== 0) throw new AppError("Vị trí này đã có khối khác.");
    }

    // Place shape
    for (const [dr, dc] of shape) {
      s.board[(targetRow + dr) * 8 + (targetCol + dc)] = 1;
    }
    s.placed.push(pieceIdx);
    score += shape.length * 15;

    // Check full rows & columns
    const fullRows = [];
    const fullCols = [];
    for (let r = 0; r < 8; r++) {
      if (Array.from({ length: 8 }, (_, c) => s.board[r * 8 + c]).every(v => v !== 0)) fullRows.push(r);
    }
    for (let c = 0; c < 8; c++) {
      if (Array.from({ length: 8 }, (_, r) => s.board[r * 8 + c]).every(v => v !== 0)) fullCols.push(c);
    }

    // Clear full rows
    for (const r of fullRows) {
      for (let c = 0; c < 8; c++) s.board[r * 8 + c] = 0;
    }
    for (const c of fullCols) {
      for (let r = 0; r < 8; r++) s.board[r * 8 + c] = 0;
    }

    const cleared = fullRows.length + fullCols.length;
    s.linesCleared += cleared;
    if (cleared > 0) {
      score += cleared * 120;
      s.feedback = `Xuất sắc! Xóa được ${cleared} dòng/cột (+${cleared * 120} điểm).`;
    } else {
      s.feedback = "Đã đặt khối thành công.";
    }

    // If all 3 pieces in turn placed, advance turn
    if (s.placed.length === 3) {
      s.turn++;
      s.placed = [];
      s.shapes = [BLOCK_SHAPES[rand(BLOCK_SHAPES.length)], BLOCK_SHAPES[rand(BLOCK_SHAPES.length)], BLOCK_SHAPES[rand(BLOCK_SHAPES.length)]];
      if (s.turn > 6) {
        completed = 1;
        s.feedback = "Hoàn thành 6 lượt xếp khối!";
      }
    }

  } else if (session.game_id === "orbit") {
    // Lane switch or wait
    if (input.lane !== undefined) {
      s.lane = integer(input.lane, 0, 2, "Quỹ đạo");
    }
    // Check if hazard struck
    const safe = !s.hazardLanes.includes(s.lane);
    if (safe) {
      score += 120;
      s.feedback = "Né tránh an toàn! +120 điểm.";
    } else {
      s.feedback = "Va chạm thiên thạch! Không nhận điểm lượt này.";
    }

    s.wave++;
    if (s.wave >= 8) {
      completed = 1;
      s.feedback = "Vượt qua toàn bộ 8 đợt sóng quỹ đạo!";
    } else {
      // Pick next hazard
      const nextHazard = rand(3);
      s.hazardLanes = [nextHazard];
      s.strikeAt = now + 2500;
      s.feedback += ` Đợt ${s.wave + 1}: Thiên thạch quỹ đạo ${nextHazard === 0 ? "Trong" : nextHazard === 1 ? "Giữa" : "Ngoài"}!`;
    }

  } else if (session.game_id === "word") {
    const guess = str(input.guess, 1, 20, "Từ đoán").toUpperCase().trim();
    const targetWord = s.words[s.index].word;
    const isCorrect = guess === targetWord;
    if (isCorrect) {
      s.correct++;
      score += 150;
      s.feedback = `Chính xác! "${targetWord}" (+150 điểm).`;
    } else {
      s.feedback = `Chưa đúng. Đáp án là "${targetWord}".`;
    }

    s.index++;
    if (s.index >= 5) {
      completed = 1;
      s.feedback += " Hoàn thành chuyến hành trình từ vựng!";
    } else {
      const nextWord = s.words[s.index];
      s.scrambled = shuffle(nextWord.word.split("")).join("");
      s.clue = nextWord.clue;
    }
  }

  const updated = await stmt(db, `UPDATE game_sessions SET state_json=?,completed=?,score=?,version=version+1
    WHERE id=? AND user_id=? AND version=? RETURNING id`, [
    JSON.stringify(s), completed, score, session.id, userId, session.version
  ]).first();

  if (!updated) throw new AppError("Thao tác trùng hoặc phiên đã thay đổi. Vui lòng thử lại.", 409);
  return publicState({ ...session, state_json: JSON.stringify(s), completed, score, version: session.version + 1 });
}

export async function claimReward(db, userId, sessionId, now = Date.now()) {
  const previous = await one(db, "SELECT * FROM reward_claims WHERE session_id=? AND user_id=?", [sessionId, userId]);
  if (previous) return { coins: previous.coins, duplicate: true };

  const m = await membership(db, userId, now);
  if (!m) throw new AppError("Bạn cần gói thành viên còn hiệu lực để tích xu.", 403, "MEMBERSHIP_REQUIRED");

  const s = await one(db, "SELECT * FROM game_sessions WHERE id=? AND user_id=? AND completed=1", [sessionId, userId]);
  if (!s || s.expires_at < now) throw new AppError("Kết quả chưa hoàn tất hoặc đã hết hạn.", 409);

  const g = await one(db, "SELECT * FROM games WHERE id=?", [s.game_id]);
  const quality = s.game_id === "number" || s.game_id === "reflex" || s.game_id === "blocks" || s.game_id === "orbit" || s.game_id === "word"
    ? Math.min(1.2, s.score / 800)
    : Math.min(1, s.score / 160);

  const dailyId = `${userId}:${day(now)}`;
  const used = (await one(db, "SELECT total FROM daily_rewards WHERE id=?", [dailyId]))?.total || 0;
  const coins = Math.min(
    Math.floor((g.base_reward * quality * m.terms.multiplier_bps) / 10000),
    m.terms.session_cap,
    Math.max(0, m.terms.daily_cap - used)
  );

  if (coins <= 0) {
    throw new AppError(used >= m.terms.daily_cap ? "Bạn đã đạt giới hạn xu hôm nay." : "Hoàn thành tốt hơn để nhận xu ở lượt tiếp theo.", 409);
  }

  const claimId = id();
  try {
    await db.batch([
      stmt(db, "INSERT INTO daily_rewards (id,user_id,day,total) VALUES (?,?,?,0) ON CONFLICT(id) DO NOTHING", [dailyId, userId, day(now)]),
      stmt(db, `INSERT INTO reward_claims (id,session_id,user_id,membership_id,coins,created_at)
        SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM memberships WHERE id=? AND user_id=? AND starts_at<=? AND ends_at>?)
        AND EXISTS(SELECT 1 FROM daily_rewards WHERE id=? AND total+?<=?)`, [
        claimId, sessionId, userId, m.id, coins, now, m.id, userId, now, now, dailyId, coins, m.terms.daily_cap
      ]),
      stmt(db, "UPDATE daily_rewards SET total=total+? WHERE id=? AND EXISTS(SELECT 1 FROM reward_claims WHERE id=?)", [coins, dailyId, claimId]),
      ...posting(db, `reward:${sessionId}`, "game_reward", userId, "COIN", [
        [acc(userId), coins],
        ["system:rewards", -coins]
      ], now, "EXISTS(SELECT 1 FROM reward_claims WHERE id=?)", [claimId]),
    ]);
  } catch (e) {
    const old = await one(db, "SELECT coins FROM reward_claims WHERE session_id=? AND user_id=?", [sessionId, userId]);
    if (old) return { coins: old.coins, duplicate: true };
    throw e;
  }

  const claim = await one(db, "SELECT coins FROM reward_claims WHERE id=?", [claimId]);
  if (!claim) throw new AppError("Giới hạn hoặc quyền thành viên đã thay đổi. Hãy tải lại.", 409);
  return { coins: claim.coins, duplicate: false };
}

// -------------------------
// PAYOUT (WITHDRAWAL)
// -------------------------

export async function createPayout(db, userId, input, now = Date.now()) {
  const coins = integer(input.coins, 1000, 10000000, "Số xu");
  const cents = coinCents(coins);
  const requestKey = key(input.requestKey);
  const recipient = safeWalletLink(input.recipient);
  const method = str(input.method, 2, 20, "Phương thức");

  if (!["qr", "link"].includes(method)) throw new AppError("Phương thức không hợp lệ.");

  const u = await one(db, "SELECT * FROM app_users WHERE id=?", [userId]);
  if (!u) throw new AppError("Người dùng không tồn tại.", 404);
  const lvlInfo = computeLevelInfo(u.play_time_seconds || 0, u.total_coins_bought || 0);

  if (lvlInfo.level < 50) {
    throw new AppError("Tính năng rút tiền chưa khả dụng cho tài khoản này.", 403);
  }

  const maxUsd = lvlInfo.level >= 100 ? 500 : 50;
  const maxCents = maxUsd * 100;
  if (cents > maxCents) {
    throw new AppError(`Hạn mức rút tối đa hiện tại là $${maxUsd} USD cho mỗi giao dịch.`, 400);
  }

  const dayAgo = now - 24 * 3600 * 1000;
  const todayPayout = await one(db, "SELECT COUNT(*) as n FROM payouts WHERE user_id=? AND created_at>? AND status != 'rejected'", [userId, dayAgo]);
  if (todayPayout?.n >= 1) {
    throw new AppError("Bạn đã thực hiện yêu cầu rút tiền hôm nay. Mỗi ngày chỉ được rút tối đa 1 lần.", 429);
  }

  const old = await one(db, "SELECT * FROM payouts WHERE user_id=? AND request_key=?", [userId, requestKey]);
  if (old) {
    if (old.coins !== coins || old.recipient !== recipient || old.method !== method) {
      throw new AppError("Mã yêu cầu đã dùng với nội dung khác.", 409);
    }
    return old;
  }

  const payoutId = id();
  try {
    await db.batch([
      stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id=? AND balance>=?", [coins, acc(userId), coins]),
      stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [coins, acc(userId, "held")]),
      stmt(db, `INSERT INTO payouts (id,user_id,coins,usd_cents,recipient,method,status,request_key,created_at,updated_at)
        VALUES (?,?,?,?,?,?,'pending',?,?,?)`, [
        payoutId, userId, coins, cents, recipient, method, requestKey, now, now
      ]),
      ...posting(db, `payout-hold:${payoutId}`, "payout_hold", userId, "COIN", [
        [acc(userId), -coins],
        [acc(userId, "held"), coins]
      ], now),
    ]);
  } catch (e) {
    const duplicate = await one(db, "SELECT * FROM payouts WHERE user_id=? AND request_key=?", [userId, requestKey]);
    if (duplicate && duplicate.coins === coins && duplicate.recipient === recipient && duplicate.method === method) return duplicate;
    throw e;
  }

  const p = await one(db, "SELECT * FROM payouts WHERE id=?", [payoutId]);
  if (!p) throw new AppError("Số dư khả dụng không đủ.", 409, "INSUFFICIENT_FUNDS");
  return p;
}

export async function payoutDecision(db, actor, input, now = Date.now()) {
  const p = await one(db, "SELECT * FROM payouts WHERE id=?", [input.id]);
  if (!p) throw new AppError("Không tìm thấy yêu cầu.", 404);

  if (input.decision === "approve") {
    if (p.status !== "pending") throw new AppError("Yêu cầu đã được xử lý.", 409);
    await db.batch([
      stmt(db, "UPDATE payouts SET status='approved',approved_by=?,updated_at=? WHERE id=? AND status='pending'", [actor, now, p.id]),
      auditStatement(db, actor, "payout.approved", p.id, "Duyệt yêu cầu rút sandbox", now)
    ]);
  } else if (["reject", "simulate_paid"].includes(input.decision)) {
    const paid = input.decision === "simulate_paid";
    if (paid ? p.status !== "approved" : !["pending", "approved"].includes(p.status)) {
      throw new AppError("Trạng thái yêu cầu không phù hợp.", 409);
    }
    const state = paid ? "paid" : "rejected";
    try {
      await db.batch([
        stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id=?", [p.coins, acc(p.user_id, "held")]),
        ...(paid ? [] : [stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [p.coins, acc(p.user_id)])]),
        ...posting(db, `payout-final:${p.id}`, paid ? "payout_paid" : "payout_return", p.user_id, "COIN", [
          [acc(p.user_id, "held"), -p.coins],
          [paid ? "system:payout" : acc(p.user_id), p.coins]
        ], now),
        stmt(db, "UPDATE payouts SET status=?,external_ref=?,note=?,updated_at=? WHERE id=?", [
          state, paid ? `sandbox-payout:${p.id}` : null, str(input.note || (paid ? "Đối tác mô phỏng xác nhận chi trả" : "Không đủ điều kiện thử nghiệm"), 1, 500, "Ghi chú"), now, p.id
        ]),
        auditStatement(db, paid ? "sandbox-provider" : actor, `payout.${state}`, p.id, `Actor: ${actor}; không chi tiền thật`, now),
      ]);
    } catch (e) {
      const current = await one(db, "SELECT status FROM payouts WHERE id=?", [p.id]);
      if (current?.status !== state) throw new AppError("Yêu cầu đã có quyết định khác.", 409);
    }
  } else {
    throw new AppError("Quyết định không hợp lệ.");
  }

  return one(db, "SELECT * FROM payouts WHERE id=?", [p.id]);
}

// -------------------------
// REVIEWS
// -------------------------

export async function createGameReview(db, userId, input, now = Date.now()) {
  const gameId = str(input.gameId, 1, 40, "Game");
  const rating = integer(input.rating, 1, 5, "Đánh giá sao");
  const comment = str(input.comment, 3, 500, "Bình luận");

  const user = await one(db, "SELECT name FROM app_users WHERE id=?", [userId]);
  const userName = user?.name || "Người chơi";
  const reviewId = id();

  await stmt(db, "INSERT INTO game_reviews (id,game_id,user_id,user_name,rating,comment,created_at) VALUES (?,?,?,?,?,?,?)", [
    reviewId, gameId, userId, userName, rating, comment, now
  ]).run();

  return one(db, "SELECT * FROM game_reviews WHERE id=?", [reviewId]);
}

// -------------------------
// ADMIN DISPATCH
// -------------------------

export async function adminAction(db, actor, action, input = {}) {
  await seed(db);

  if (action === "overview") {
    const totalPlays = (await one(db, "SELECT COUNT(*) AS n FROM game_sessions"))?.n || 0;
    const activeMemberships = (await one(db, "SELECT COUNT(DISTINCT user_id) AS n FROM memberships WHERE starts_at<=? AND ends_at>?", [Date.now(), Date.now()]))?.n || 0;
    const totalEarned = (await one(db, "SELECT COALESCE(SUM(coins),0) AS n FROM reward_claims"))?.n || 0;
    const pendingPayouts = (await one(db, "SELECT COUNT(*) AS n FROM payouts WHERE status IN ('pending','approved')"))?.n || 0;
    const totalTournaments = (await one(db, "SELECT COUNT(*) AS n FROM tournaments"))?.n || 0;
    const totalTransfers = (await one(db, "SELECT COUNT(*) AS n FROM wallet_transfers"))?.n || 0;

    return {
      sandbox: true,
      livePayments: false,
      users: await rows(db, `
        SELECT u.*, a.balance AS available, h.balance AS held
        FROM app_users u
        LEFT JOIN wallet_accounts a ON a.id = u.id || ':available'
        LEFT JOIN wallet_accounts h ON h.id = u.id || ':held'
        ORDER BY u.created_at DESC LIMIT 100
      `),
      plans: (await rows(db, "SELECT * FROM plans")).map(p => ({ ...p, perks: parse(p.perks_json) })),
      orders: await rows(db, `
        SELECT o.*, u.name AS user_name
        FROM orders o
        JOIN app_users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 100
      `),
      payouts: await rows(db, `
        SELECT p.*, u.name AS user_name
        FROM payouts p
        JOIN app_users u ON u.id = p.user_id
        ORDER BY p.created_at DESC LIMIT 100
      `),
      transfers: await rows(db, `
        SELECT t.*, u_from.name AS sender_name, u_to.name AS recipient_name
        FROM wallet_transfers t
        LEFT JOIN app_users u_from ON u_from.id = t.sender_id
        LEFT JOIN app_users u_to ON u_to.id = t.recipient_id
        ORDER BY t.created_at DESC LIMIT 100
      `),
      tournaments: await rows(db, "SELECT * FROM tournaments ORDER BY created_at DESC"),
      countryPolicies: await rows(db, "SELECT * FROM country_policies ORDER BY country_code"),
      games: await rows(db, "SELECT * FROM games ORDER BY sort"),
      audit: await rows(db, "SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 100"),
      journals: await rows(db, "SELECT * FROM journal_transactions ORDER BY created_at DESC LIMIT 100"),
      tickets: await rows(db, `
        SELECT t.*, u.name AS user_name
        FROM support_tickets t
        JOIN app_users u ON u.id = t.user_id
        ORDER BY t.created_at DESC LIMIT 100
      `),
      giftCodes: await rows(db, "SELECT * FROM gift_codes ORDER BY created_at DESC"),
      paymentConfig: parse((await one(db, "SELECT value FROM app_settings WHERE key='payment_config'"))?.value || "{}"),
      stats: {
        plays: totalPlays,
        memberships: activeMemberships,
        earned: totalEarned,
        pending: pendingPayouts,
        tournaments: totalTournaments,
        transfers: totalTransfers,
      }
    };
  }

  if (action === "plan.save") {
    const p = validatePlan(input);
    const old = await one(db, "SELECT * FROM plans WHERE id=?", [p.id]);
    if (!old) throw new AppError("Không tìm thấy gói.", 404);
    if (old.revision !== p.revision) throw new AppError("Gói vừa được chỉnh sửa ở nơi khác. Hãy tải lại.", 409);
    await db.batch([
      auditStatement(db, actor, action, `${p.id}:v${p.revision}`, JSON.stringify({ before: old, after: p })),
      stmt(db, `UPDATE plans SET price_cents=?,multiplier_bps=?,daily_cap=?,session_cap=?,perks_json=?,active=?,revision=revision+1
        WHERE id=? AND revision=?`, [
        p.price_cents, p.multiplier_bps, p.daily_cap, p.session_cap, JSON.stringify(p.perks.map(x => x.trim())), p.active, p.id, p.revision
      ])
    ]);
    return { saved: true };
  }

  if (action === "payment.save") {
    const config = {
      payoneer_link: safeWalletLink(input.payoneer_link, true),
      instructions: str(input.instructions, 1, 1500, "Hướng dẫn"),
      currency: "USD"
    };
    await db.batch([
      stmt(db, "UPDATE app_settings SET value=? WHERE key='payment_config'", [JSON.stringify(config)]),
      auditStatement(db, actor, action, "payment_config", "Lưu cấu hình tham chiếu; live vẫn tắt")
    ]);
    return { saved: true };
  }

  if (action === "policy.save") {
    const code = str(input.country_code, 2, 5, "Mã quốc gia").toUpperCase();
    await db.batch([
      stmt(db, `UPDATE country_policies SET
        catalog_enabled=?, game_play_enabled=?, purchase_enabled=?,
        cash_deposit_enabled=?, paid_competition_enabled=?, transfer_enabled=?, withdrawal_enabled=?, note=?
        WHERE country_code=?`, [
        input.catalog_enabled ? 1 : 0,
        input.game_play_enabled ? 1 : 0,
        input.purchase_enabled ? 1 : 0,
        input.cash_deposit_enabled ? 1 : 0,
        input.paid_competition_enabled ? 1 : 0,
        input.transfer_enabled ? 1 : 0,
        input.withdrawal_enabled ? 1 : 0,
        str(input.note || "", 0, 500, "Ghi chú"),
        code
      ]),
      auditStatement(db, actor, action, code, `Cập nhật chính sách quốc gia ${code}`)
    ]);
    return { saved: true };
  }

  if (action === "tournament.create") {
    const title = str(input.title, 3, 100, "Tên giải đấu");
    const gameId = str(input.gameId, 1, 40, "Game");
    const entryFee = integer(input.entryFeeCoins, 0, 100000, "Lệ phí tham gia");
    const prizePool = integer(input.prizePoolCoins, 100, 1000000, "Tổng giải thưởng khởi điểm");
    const durationHours = integer(input.durationHours || 24, 1, 720, "Thời lượng giải");
    const tourneyId = id();
    const now = Date.now();

    await db.batch([
      stmt(db, `INSERT INTO tournaments (id,title,game_id,entry_fee_coins,prize_pool_coins,min_players,max_players,status,prize_rules_json,start_time,end_time,created_at)
        VALUES (?,?,?,?,?,2,100,'active',?,?,?,?)`, [
        tourneyId, title, gameId, entryFee, prizePool, JSON.stringify([50, 30, 20]), now, now + durationHours * 3600000, now
      ]),
      auditStatement(db, actor, action, tourneyId, `Tạo giải đấu ${title} với thưởng ${prizePool} xu`)
    ]);
    return { id: tourneyId };
  }

  if (action === "tournament.settle") {
    return settleTournament(db, actor, str(input.id, 1, 100, "Mã giải đấu"));
  }

  if (action === "order.simulate") {
    const o = await one(db, "SELECT * FROM orders WHERE id=?", [input.id]);
    if (!o) throw new AppError("Không tìm thấy đơn.", 404);
    return simulatePayment(db, o.user_id, o.id, Date.now(), actor);
  }

  if (action === "payout.decision") return payoutDecision(db, actor, input);

  if (action === "user.toggle") {
    const value = input.banned ? 1 : 0;
    await db.batch([
      stmt(db, "UPDATE app_users SET banned=? WHERE id=?", [value, input.id]),
      auditStatement(db, actor, action, str(input.id, 1, 150, "Tài khoản"), value ? "Tạm khóa" : "Mở khóa")
    ]);
    return { saved: true };
  }

  if (action === "game.toggle") {
    await db.batch([
      stmt(db, "UPDATE games SET active=? WHERE id=?", [input.active ? 1 : 0, str(input.id, 1, 40, "Game")]),
      auditStatement(db, actor, action, input.id, input.active ? "Bật" : "Ẩn")
    ]);
    return { saved: true };
  }

  if (action === "ticket.reply") {
    const reply = str(input.reply, 1, 2000, "Phản hồi");
    await db.batch([
      stmt(db, "UPDATE support_tickets SET reply=?,status='resolved' WHERE id=?", [reply, input.id]),
      auditStatement(db, actor, action, str(input.id, 1, 150, "Yêu cầu"), "Đã phản hồi")
    ]);
    return { saved: true };
  }

  if (action === "giftcode.create") {
    const gcId = id();
    const code = str(input.code, 2, 50, "Mã Giftcode").trim().toUpperCase();
    const coins = integer(input.coins, 10, 10000000, "Số xu thưởng");
    const maxUses = integer(input.maxUses || 100, 1, 10000000, "Số lượt dùng tối đa");
    const expiresAt = input.expiresDays ? Date.now() + input.expiresDays * 86400000 : null;
    await stmt(db, `INSERT INTO gift_codes (id, code, coins, max_uses, used_count, expires_at, active, created_at) VALUES (?, ?, ?, ?, 0, ?, 1, ?)`, [
      gcId, code, coins, maxUses, expiresAt, Date.now()
    ]).run();
    return { success: true, id: gcId };
  }

  if (action === "giftcode.toggle") {
    await db.batch([
      stmt(db, "UPDATE gift_codes SET active = CASE WHEN active=1 THEN 0 ELSE 1 END WHERE id=?", [input.id]),
      auditStatement(db, actor, action, str(input.id, 1, 100, "Mã"), "Đổi trạng thái")
    ]);
    return { saved: true };
  }

  if (action === "giftcode.delete") {
    await db.batch([
      stmt(db, "DELETE FROM gift_codes WHERE id=?", [input.id]),
      auditStatement(db, actor, action, str(input.id, 1, 100, "Mã"), "Xóa mã")
    ]);
    return { saved: true };
  }

  if (action === "user.adjust_level") {
    const addHours = Number(input.addHours) || 0;
    const addCoins = Number(input.addCoins) || 0;
    await stmt(db, "UPDATE app_users SET play_time_seconds = MAX(0, play_time_seconds + ?), total_coins_bought = MAX(0, total_coins_bought + ?) WHERE id=?", [
      addHours * 3600, addCoins, input.userId
    ]).run();
    await checkAndProcessLevelUp(db, input.userId);
    return { saved: true };
  }

  throw new AppError("Chức năng quản trị không hợp lệ.", 404);
}

// -------------------------
// PLAYER DISPATCH
// -------------------------

export async function playerAction(db, userId, action, input = {}) {
  if (action === "auth.signup") return signUpUser(db, input);
  if (action === "auth.signin") return signInUser(db, input);
  if (action === "giftcode.redeem") return redeemGiftCode(db, userId, input.code);
  if (action === "game.heartbeat") return addPlayTime(db, userId, input.seconds);
  if (action === "notification.read") {
    await stmt(db, "UPDATE user_notifications SET read=1 WHERE id=? AND user_id=?", [input.id, userId]).run();
    return { success: true };
  }
  if (action === "notification.read_all") {
    await stmt(db, "UPDATE user_notifications SET read=1 WHERE user_id=?", [userId]).run();
    return { success: true };
  }

  if (action === "order.create") return createOrder(db, userId, input);
  if (action === "order.simulate") return simulatePayment(db, userId, str(input.id, 1, 100, "Đơn"));
  if (action === "transfer.create") return createTransfer(db, userId, input);
  if (action === "tournament.join") return joinTournament(db, userId, str(input.tournamentId, 1, 100, "Giải đấu"));
  if (action === "tournament.submit") return submitTournamentScore(db, userId, str(input.tournamentId, 1, 100, "Giải đấu"), str(input.sessionId, 1, 100, "Phiên"));
  if (action === "game.start") return startGame(db, userId, str(input.gameId, 1, 40, "Game"));
  if (action === "game.action") return gameAction(db, userId, input);
  if (action === "game.claim") return claimReward(db, userId, str(input.sessionId, 1, 100, "Phiên"));
  if (action === "payout.create") return createPayout(db, userId, input);
  if (action === "review.create") return createGameReview(db, userId, input);

  if (action === "favorite.toggle") {
    const g = await one(db, "SELECT id FROM games WHERE id=?", [input.gameId]);
    if (!g) throw new AppError("Game không tồn tại.", 404);
    const fid = `${userId}:${g.id}`;
    if (input.active) {
      await stmt(db, "INSERT INTO favorites (id,user_id,game_id) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING", [fid, userId, g.id]).run();
    } else {
      await stmt(db, "DELETE FROM favorites WHERE id=? AND user_id=?", [fid, userId]).run();
    }
    return { saved: true };
  }

  if (action === "ticket.create") {
    const tid = id();
    await stmt(db, `INSERT INTO support_tickets (id,user_id,subject,message,status,created_at)
      VALUES (?,?,?,?,'open',?)`, [
      tid, userId, str(input.subject, 3, 120, "Tiêu đề"), str(input.message, 10, 2000, "Nội dung"), Date.now()
    ]).run();
    return { id: tid };
  }

  throw new AppError("Chức năng không tồn tại.", 404);
}
