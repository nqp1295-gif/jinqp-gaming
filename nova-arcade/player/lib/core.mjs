export const SANDBOX = true;
export const COINS_PER_USD = 1000;
export const TIERS = { bronze: { name: "Đồng", rank: 1 }, gold: { name: "Vàng", rank: 2 }, diamond: { name: "Kim Cương", rank: 3 } };
export const PERIODS = { week: "Tuần", month: "Tháng", year: "Năm" };

export const TOPUP_PACKAGES = [
  { id: "topup-1000", coins: 1000, bonus: 0, priceCents: 100, label: "Khởi đầu", tag: "Phí nạp 0% (Free)" },
  { id: "topup-5000", coins: 5000, bonus: 500, priceCents: 500, label: "Tập sự", tag: "Tặng 500 xu · Phí nạp 0%" },
  { id: "topup-10000", coins: 10000, bonus: 1500, priceCents: 1000, label: "Cao thủ (Mở Cấp 10)", tag: "Mở Chuyển P2P · Phí nạp 0%", popular: true },
  { id: "topup-20000", coins: 20000, bonus: 3500, priceCents: 2000, label: "Chiến binh (Mở Cấp 20)", tag: "Đột phá Cấp 20 · Phí nạp 0%" },
  { id: "topup-50000", coins: 50000, bonus: 10000, priceCents: 5000, label: "VIP Đặc quyền (Mở Cấp 50)", tag: "Mở Rút Payoneer · Phí nạp 0%", best: true },
  { id: "topup-100000", coins: 100000, bonus: 25000, priceCents: 10000, label: "Huyền thoại (Mở Cấp 100)", tag: "Hạn mức rút $500 · Phí nạp 0%" },
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
    `CREATE TABLE IF NOT EXISTS conversion_requests (
      id text PRIMARY KEY, user_id text NOT NULL, coins integer NOT NULL,
      usd_cents integer NOT NULL, rate integer NOT NULL, status text DEFAULT 'pending' NOT NULL,
      request_key text NOT NULL, admin_note text, created_at integer NOT NULL, settled_at integer
    );`,
    `CREATE TABLE IF NOT EXISTS claim_wallets (
      user_id text PRIMARY KEY, balance real DEFAULT 0 NOT NULL,
      held real DEFAULT 0 NOT NULL, updated_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS claim_sessions (
      id text PRIMARY KEY, user_id text NOT NULL, machine_level integer NOT NULL,
      rate_per_hour real NOT NULL, started_at integer NOT NULL, ends_at integer NOT NULL,
      last_collected_at integer NOT NULL, coins_collected real DEFAULT 0 NOT NULL,
      status text DEFAULT 'running' NOT NULL, created_at integer NOT NULL, updated_at integer NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS claim_transfers (
      id text PRIMARY KEY, user_id text NOT NULL, coins integer NOT NULL,
      status text DEFAULT 'pending' NOT NULL, request_key text NOT NULL,
      admin_note text, created_at integer NOT NULL, settled_at integer
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
    "ALTER TABLE app_users ADD COLUMN last_payout_time integer DEFAULT 0",
    "ALTER TABLE app_users ADD COLUMN payoneer_email text",
    "ALTER TABLE payouts ADD COLUMN fee_cents integer DEFAULT 0",
    "ALTER TABLE payouts ADD COLUMN net_cents integer DEFAULT 0",
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
  if (ver === "6.0") return;

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

  // Catalog: 50 games across 7 categories - each with its own unique dedicated art & fully playable engines
  const catalog = [
    // 1. Trí tuệ (7 games)
    ["memory", "Memory Garden", "Lật thẻ, tìm cặp và thử thách trí nhớ", "Trí tuệ", "memory", "memory", 80],
    ["number", "Number Rush", "Tăng tốc tư duy qua 10 phép tính nhanh", "Trí tuệ", "number", "number", 100],
    ["matrix-mind", "Matrix Mind", "Ghi nhớ ma trận số và quy luật tư duy đỉnh cao", "Trí tuệ", "matrix-mind", "number", 110],
    ["super-recall", "Super Recall", "Thử thách trí nhớ siêu phàm qua các chuỗi thẻ liên hoàn", "Trí tuệ", "super-recall", "memory", 90],
    ["logic-master", "Logic Master", "Đấu trí số học và tìm ẩn số ma thuật chính xác", "Trí tuệ", "logic-master", "number", 120],
    ["reverse-think", "Reverse Think", "Tư duy đảo ngược và phản ứng logic thần tốc", "Trí tuệ", "reverse-think", "number", 85],
    ["iq-arena", "IQ Arena", "Võ đài trí tuệ đỉnh cao tranh tài tư duy sắc bén", "Trí tuệ", "iq-arena", "memory", 130],

    // 2. Hành động (7 games)
    ["shadow-strike", "Shadow Strike", "Đột kích bóng đêm, phản xạ chém nhanh chuẩn xác", "Hành động", "shadow-strike", "reflex", 100],
    ["ninja-slash", "Ninja Slash", "Đường kiếm sắc bén chém gục mục tiêu trong chớp mắt", "Hành động", "ninja-slash", "reflex", 110],
    ["cyber-warrior", "Cyber Warrior", "Chiến binh mạng luồn lách qua hệ thống phòng ngự", "Hành động", "cyber-warrior", "orbit", 95],
    ["street-fighter", "Street Fighter", "Quyền vương đường phố tung đòn phản xạ cực chuẩn", "Hành động", "street-fighter", "reflex", 105],
    ["beast-hunter", "Beast Hunter", "Thợ săn quái thú, né tránh móng vuốt trong gang tấc", "Hành động", "beast-hunter", "orbit", 115],
    ["secret-agent", "Secret Agent", "Điệp viên thâm nhập, phản ứng mau lẹ trước cạm bẫy", "Hành động", "secret-agent", "reflex", 90],
    ["master-archer", "Master Archer", "Thiện xạ bách phát bách trúng hạ gục hồng tâm", "Hành động", "master-archer", "reflex", 120],

    // 3. Phản xạ (7 games)
    ["reflex", "Neon Reflex", "Giữ bình tĩnh. Chạm đúng tín hiệu ánh sáng", "Phản xạ", "reflex", "reflex", 60],
    ["speed-tap", "Speed Tap", "Chạm màn hình tốc độ cao thử thách ngón tay vàng", "Phản xạ", "speed-tap", "reflex", 75],
    ["bullseye-blitz", "Bullseye Blitz", "Bắn trúng tâm điểm chớp nhoáng nhận thưởng lớn", "Phản xạ", "bullseye-blitz", "reflex", 85],
    ["green-light-rush", "Green Light Rush", "Tiến bước khi đèn xanh, dừng lại ngay khi đèn đỏ", "Phản xạ", "green-light-rush", "reflex", 95],
    ["diamond-snatch", "Diamond Snatch", "Giật lấy kim cương quý giá trước khi bẫy sập", "Phản xạ", "diamond-snatch", "reflex", 90],
    ["voltage-jump", "Voltage Jump", "Phản xạ vượt xung điện cao thế nghẹt thở", "Phản xạ", "voltage-jump", "reflex", 105],
    ["whack-master", "Whack Master", "Đập búa siêu tốc bắt trọn mọi sinh vật tinh quái", "Phản xạ", "whack-master", "reflex", 80],

    // 4. Giải đố (7 games)
    ["word", "Word Voyage", "Khám phá từ vựng, giải mã các chữ cái xáo trộn", "Giải đố", "word", "word", 110],
    ["word-master", "Word Master", "Bậc thầy ngôn ngữ giải đố các cụm từ hóc búa", "Giải đố", "word-master", "word", 120],
    ["anagram-quest", "Anagram Quest", "Tìm đảo ngữ bí ẩn và mở khóa rương kho báu", "Giải đố", "anagram-quest", "word", 100],
    ["mystic-maze", "Mystic Maze", "Khám phá mê cung huyền bí qua quy luật số học", "Giải đố", "mystic-maze", "number", 90],
    ["circuit-connect", "Circuit Connect", "Nối mạch điện tử thông minh thắp sáng mạng lưới", "Giải đố", "circuit-connect", "memory", 115],
    ["rope-rescue", "Rope Rescue", "Gỡ rối dây thừng và giải cứu mục tiêu an toàn", "Giải đố", "rope-rescue", "memory", 95],
    ["riddle-realm", "Riddle Realm", "Vùng đất câu đố ma thuật thử thách óc phán đoán", "Giải đố", "riddle-realm", "word", 130],

    // 5. Đua xe (7 games)
    ["turbo-highway", "Turbo Highway", "Cao tốc tử thần, phóng hết ga lượn làn tránh xe tải", "Đua xe", "turbo-highway", "orbit", 100],
    ["neon-drift", "Neon Drift", "Khúc cua rực rỡ neon, ôm cua điệu nghệ không va chạm", "Đua xe", "neon-drift", "orbit", 110],
    ["grand-prix-apex", "Grand Prix Apex", "Chinh phục đỉnh vinh quang F1 trên đường đua thế giới", "Đua xe", "grand-prix-apex", "orbit", 125],
    ["monster-offroad", "Monster Offroad", "Xe quái thú vượt địa hình hiểm trở và chướng ngại vật", "Đua xe", "monster-offroad", "orbit", 95],
    ["cosmic-racer", "Cosmic Racer", "Đua phi thuyền siêu thanh xuyên không gian vô tận", "Đua xe", "cosmic-racer", "orbit", 105],
    ["highway-pursuit", "Highway Pursuit", "Cuộc truy đuổi nghẹt thở của cảnh sát trên đại lộ", "Đua xe", "highway-pursuit", "orbit", 115],
    ["cyber-bus-2099", "Cyber Bus 2099", "Lái buýt tương lai vượt qua luồng giao thông tầng cao", "Đua xe", "cyber-bus-2099", "orbit", 90],

    // 6. Không gian (7 games)
    ["orbit", "Orbit Runner", "Điều khiển phi thuyền chuyển quỹ đạo né thiên thạch", "Không gian", "orbit", "orbit", 90],
    ["galaxy-fire", "Galaxy Fire", "Hạm đội liên sao nghênh chiến hỏa lực ngoài hành tinh", "Không gian", "galaxy-fire", "orbit", 120],
    ["mars-lander", "Mars Lander", "Hạ cánh thám hiểm sao Hỏa trên bãi đáp an toàn", "Không gian", "mars-lander", "orbit", 110],
    ["black-hole-escape", "Black Hole Escape", "Thoát khỏi lực hút hố đen trước khi bị nuốt chửng", "Không gian", "black-hole-escape", "orbit", 130],
    ["satellite-gatherer", "Satellite Gatherer", "Thu thập vệ tinh hỏng và dọn dẹp rác vũ trụ", "Không gian", "satellite-gatherer", "orbit", 95],
    ["station-defense", "Station Defense", "Bảo vệ trạm không gian quốc tế khỏi mưa sao băng", "Không gian", "station-defense", "orbit", 105],
    ["wormhole-warp", "Wormhole Warp", "Du hành xuyên lỗ sâu tới các thiên hà xa xôi", "Không gian", "wormhole-warp", "orbit", 115],

    // 7. Xếp hình (8 games)
    ["blocks", "Block District", "Giải đố khối màu, xếp khít dòng và cột kiểu KHỐI8", "Xếp hình", "blocks", "blocks", 120],
    ["wood-block-puzzle", "Wood Block Puzzle", "Khối gỗ mộc mạc, thư giãn xếp hàng nhận điểm kỷ lục", "Xếp hình", "wood-block-puzzle", "blocks", 100],
    ["crystal-match", "Crystal Match", "Ghép ngọc pha lê lấp lánh phát nổ thành chuỗi combo", "Xếp hình", "crystal-match", "memory", 110],
    ["merge-2048", "Merge 2048", "Hợp nhất các khối số tương đương đạt đỉnh 2048", "Xếp hình", "merge-2048", "number", 130],
    ["ice-tetris", "Ice Tetris", "Những khối băng trơn trượt thử thách xếp tầng thần tốc", "Xếp hình", "ice-tetris", "blocks", 115],
    ["classic-brick", "Classic Brick", "Gạch cổ điển huyền thoại tuổi thơ sống lại rực rỡ", "Xếp hình", "classic-brick", "blocks", 105],
    ["dice-matcher", "Dice Matcher", "Xúc xắc ma thuật ghép 3 mặt đồng điệu ghi điểm", "Xếp hình", "dice-matcher", "memory", 95],
    ["mecha-assembly", "Mecha Assembly", "Lắp ghép robot cơ giáp chiến đấu hoàn hảo từng chi tiết", "Xếp hình", "mecha-assembly", "blocks", 125],
  ];
  catalog.forEach((g, i) => {
    commands.push(stmt(db, "INSERT INTO games (id,title,subtitle,category,art,engine,active,base_reward,sort) VALUES (?,?,?,?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,subtitle=excluded.subtitle,category=excluded.category,art=excluded.art,engine=excluded.engine,active=1,base_reward=excluded.base_reward,sort=excluded.sort", [...g, i]));
  });

  // System accounts for double-entry ledger
  for (const [a, unit] of [
    ["system:rewards", "COIN"],
    ["system:payout", "COIN"],
    ["system:services", "USD_CENT"],
    ["system:clearing", "USD_CENT"],
    ["system:tournament_pool", "COIN"],
    ["system:topup_reserve", "COIN"],
    ["system:usd_reserve", "USD_CENT"],
    ["system:coin_conversions", "COIN"],
    ["system:withdrawal_fees", "USD_CENT"],
    ["system:claim_mining", "COIN"],
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
  commands.push(stmt(db, "INSERT INTO app_settings (key,value) VALUES ('seed_version','6.0') ON CONFLICT(key) DO UPDATE SET value='6.0'", []));

  await db.batch(commands);
}

export async function ensureUser(db, user, now = Date.now()) {
  const uid = user?.userId || user?.id;
  if (!uid) throw new AppError("Vui lòng đăng nhập để tiếp tục.", 401, "SIGN_IN_REQUIRED");
  const userName = user.displayName || user.name || (user.email ? user.email.split("@")[0] : "Người chơi");
  await db.batch([
    stmt(db, "INSERT INTO app_users (id,name,email,country,banned,created_at,play_time_seconds,total_coins_bought,level) VALUES (?,?,?,'VN',0,?,0,0,1) ON CONFLICT(id) DO UPDATE SET name=COALESCE(excluded.name, app_users.name),email=COALESCE(excluded.email, app_users.email)", [uid, userName, user.email || null, now]),
    ...["available", "held"].map(k => stmt(db, "INSERT INTO wallet_accounts (id,user_id,kind,unit,balance) VALUES (?,?,?,'COIN',0) ON CONFLICT(id) DO NOTHING", [acc(uid, k), uid, k])),
    ...["main_usd", "main_usd_held"].map(k => stmt(db, "INSERT INTO wallet_accounts (id,user_id,kind,unit,balance) VALUES (?,?,?,'USD_CENT',0) ON CONFLICT(id) DO NOTHING", [acc(uid, k), uid, k])),
    stmt(db, "INSERT INTO claim_wallets (user_id, balance, held, updated_at) VALUES (?, 0, 0, ?) ON CONFLICT(user_id) DO NOTHING", [uid, now]),
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
  const userPayload = { id: u.id, userId: u.id, name: u.name, email: u.email, country: u.country, level: u.level };
  return { ok: true, user: userPayload, ...userPayload };
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

  const userPayload = { id: u.id, userId: u.id, name: u.name, email: u.email, country: u.country, level: u.level };
  return { ok: true, user: userPayload, ...userPayload };
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
  const userAccounts = await rows(db, "SELECT kind,unit,balance FROM wallet_accounts WHERE user_id=?", [u.id]);
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
  const userConversions = await rows(db, "SELECT * FROM conversion_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 30", [u.id]);

  const availableCoins = userAccounts.find(a => a.kind === "available")?.balance || 0;
  const heldCoins = userAccounts.find(a => a.kind === "held")?.balance || 0;
  const mainUsdBalance = userAccounts.find(a => a.kind === "main_usd")?.balance || 0;
  const mainUsdHeldBalance = userAccounts.find(a => a.kind === "main_usd_held")?.balance || 0;

  result.user = {
    id: u.id,
    name: u.name,
    email: u.email,
    country: u.country,
    payoneerEmail: u.payoneer_email || null,
    level: levelInfo?.level || u.level || 1,
    levelInfo: levelInfo || computeLevelInfo(u.play_time_seconds, u.total_coins_bought),
    membership: await membership(db, u.id),
    accounts: userAccounts,
    availableCoins,
    heldCoins,
    mainUsdBalance,
    mainUsdHeldBalance,
    conversions: userConversions,
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
    tickets: await rows(db, "SELECT * FROM support_tickets WHERE user_id=? ORDER BY created_at DESC LIMIT 20", [u.id]),
    claim: await getClaimState(db, u.id, now)
  };

  result.claimMachines = CLAIM_MACHINES;
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
  await checkAndProcessLevelUp(db, userId, now);
  const sender = await one(db, "SELECT level FROM app_users WHERE id=?", [userId]);
  if ((sender?.level || 1) < 10) {
    throw new AppError("Bạn cần đạt tối thiểu Cấp 10 để mở khóa tính năng Chuyển xu P2P.", 403, "LEVEL_LOCKED");
  }

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
  { word: "CHAMPION", clue: "Nhà vô địch trên bảng xếp hạng vàng" },
  { word: "REFLEX", clue: "Phản xạ nhanh nhạy trong từng tích tắc" },
  { word: "MATRIX", clue: "Ma trận dữ liệu số học quy luật" },
  { word: "WARRIOR", clue: "Chiến binh dũng cảm xông pha chiến trường" },
  { word: "KNIGHT", clue: "Hiệp sĩ hoàng gia mang gươm báu" },
  { word: "DRAGON", clue: "Rồng thiêng huyền thoại phun lửa" },
  { word: "PHOENIX", clue: "Phượng hoàng lửa hồi sinh từ tro tàn" },
  { word: "SPEED", clue: "Tốc độ đỉnh cao xé toạc màn đêm" },
  { word: "ENERGY", clue: "Nguồn năng lượng bất tận thắp sáng hành tinh" },
  { word: "SHADOW", clue: "Bóng đêm huyền bí rình rập mục tiêu" },
  { word: "TARGET", clue: "Mục tiêu chuẩn xác ngay giữa hồng tâm" },
  { word: "COMBO", clue: "Chuỗi đòn tấn công liên hoàn uy lực" },
  { word: "LEGEND", clue: "Huyền thoại bất tử lưu danh muôn thuở" },
  { word: "FUTURE", clue: "Thế giới tương lai với công nghệ đỉnh cao" },
  { word: "COSMOS", clue: "Vũ trụ vô tận chứa hàng tỷ vì sao" },
  { word: "METEOR", clue: "Mưa sao băng lướt qua bầu trời đêm" },
  { word: "PLANET", clue: "Hành tinh xanh quay quanh mặt trời" },
  { word: "ROCKET", clue: "Tên lửa đẩy xuyên tầng khí quyển" },
  { word: "RADAR", clue: "Hệ thống radar quét định vị mục tiêu" },
  { word: "SHIELD", clue: "Lá chắn hộ thân ngăn chặn mọi đòn đánh" },
  { word: "WEAPON", clue: "Vũ khí tối thượng hạ gục đối thủ" },
  { word: "CASTLE", clue: "Tòa lâu đài cổ nguy nga tráng lệ" },
  { word: "DIAMOND", clue: "Kim cương quý giá cứng nhất trần đời" },
  { word: "EMERALD", clue: "Ngọc lục bảo xanh biếc quý hiếm" },
  { word: "SAPPHIRE", clue: "Đá lam ngọc lấp lánh ánh đại dương" },
  { word: "CRYSTAL", clue: "Khối pha lê trong suốt tỏa hào quang" },
  { word: "THUNDER", clue: "Tiếng sấm rền vang rung chuyển đất trời" },
  { word: "LIGHTNING", clue: "Tia chớp xé rách màn mây giông bão" },
  { word: "BLIZZARD", clue: "Cơn bão tuyết trắng xóa phủ kín ngọn núi" },
  { word: "CYCLONE", clue: "Cơn lốc xoáy dữ dội cuốn phăng chướng ngại" },
  { word: "VOLCANO", clue: "Núi lửa phun trào dòng nham thạch rực đỏ" },
  { word: "GLACIER", clue: "Khối sông băng vĩnh cửu trôi dạt cực bắc" },
  { word: "ISLAND", clue: "Hòn đảo hoang sơ ẩn chứa bí mật thần bí" },
  { word: "JUNGLE", clue: "Khu rừng rậm nhiệt đới bạt ngàn muôn thú" },
  { word: "DESERT", clue: "Sa mạc cát vàng mênh mông dưới nắng hè" },
  { word: "CANYON", clue: "Hẻm núi đá sâu thẳm hùng vĩ nghìn năm" },
  { word: "TEMPLE", clue: "Ngôi đền thiêng cổ kính giữa rừng sâu" },
  { word: "PYRAMID", clue: "Kim tự tháp kỳ vĩ sừng sững giữa cát vàng" },
  { word: "TREASURE", clue: "Rương kho báu vàng bạc chôn giấu ngàn năm" },
  { word: "ODYSSEY", clue: "Cuộc hải trình phiêu lưu khám phá tân thế giới" },
  { word: "HORIZON", clue: "Đường chân trời rực rỡ buổi hoàng hôn" },
  { word: "ECLIPSE", clue: "Hiện tượng nhật thực kỳ thú che khuất mặt trời" },
  { word: "AURORA", clue: "Vũ điệu cực quang kỳ ảo trên bầu trời đêm" },
  { word: "NEBULA", clue: "Tinh vân rực rỡ sắc màu không gian sâu" },
  { word: "GRAVITY", clue: "Lực hấp dẫn níu giữ vạn vật trong vũ trụ" },
  { word: "QUANTUM", clue: "Thế giới cơ học lượng tử vi mô bí ẩn" },
  { word: "ROBOTIC", clue: "Hệ thống người máy tự hành thông minh" },
  { word: "CYBER", clue: "Không gian mạng kết nối dữ liệu toàn cầu" },
  { word: "NEURAL", clue: "Mạng lưới thần kinh nhân tạo học sâu" },
  { word: "SILICON", clue: "Chất bán dẫn chế tạo vi mạch điện tử" },
  { word: "ENGINE", clue: "Khối động cơ tăng áp gầm rú mãnh liệt" },
  { word: "TURBO", clue: "Chế độ tăng tốc độ cực hạn bứt phá" },
  { word: "RACER", clue: "Tay đua cự phách chinh phục khúc cua gắt" },
  { word: "CIRCUIT", clue: "Đường đua khép kín tranh tài cúp Grand Prix" },
  { word: "RUNNER", clue: "Vận động viên chạy nước rút chạm đích đầu tiên" },
  { word: "JUMPER", clue: "Cú bật nhảy vượt chướng ngại vật ngoạn mục" },
  { word: "MASTER", clue: "Bậc thầy lão luyện tinh thông mọi tuyệt kỹ" },
  { word: "WIZARD", clue: "Phù thủy cao tay điều khiển phép thuật ma mị" },
  { word: "ARCHER", clue: "Cung thủ tài ba ngắm bắn chuẩn xác từng milimet" },
  { word: "HUNTER", clue: "Thợ săn thiện chiến theo dấu vết trong sương mù" },
  { word: "STRIKER", clue: "Mũi nhọn tấn công chớp thời cơ dứt điểm hiểm" },
  { word: "LEADER", clue: "Người thủ lĩnh tài ba dẫn đầu đoàn quân chiến thắng" },
  { word: "HEROIC", clue: "Hành động dũng cảm phi thường lưu danh hậu thế" },
  { word: "BRAVERY", clue: "Lòng quả cảm sắt đá trước hiểm nguy bão táp" },
  { word: "COURAGE", clue: "Ý chí kiên định không hề run sợ trước nghịch cảnh" },
  { word: "SPIRIT", clue: "Ý chí chiến đấu rực lửa không bao giờ lùi bước" },
  { word: "WISDOM", clue: "Trí tuệ thông thái nhìn thấu mọi quy luật trần gian" },
  { word: "MEMORY", clue: "Ký ức hoàn hảo lưu giữ mọi chi tiết sắc nét" },
  { word: "GENIUS", clue: "Bộ óc thiên tài giải mã điều không thể" },
  { word: "TALENT", clue: "Tài năng thiên bẩm xuất chúng hơn người" },
  { word: "SYSTEM", clue: "Hệ thống vận hành trơn tru chuẩn chỉ từng giây" },
  { word: "SYMBOL", clue: "Ký hiệu cổ mang năng lượng bảo hộ nhiệm màu" },
  { word: "CIPHER", clue: "Bản mật mã cổ đại cần được giải mã" },
  { word: "SECRET", clue: "Bí mật tối cao chỉ người chiến thắng mới biết" },
  { word: "MYSTERY", clue: "Điều kỳ bí kích thích sự tò mò của nhân loại" },
  { word: "RIDDLE", clue: "Câu đố hóc búa thử thách tài suy luận bén nhạy" },
  { word: "ENIGMA", clue: "Cỗ máy giải mã bí ẩn vĩ đại trong lịch sử" },
  { word: "SPHINX", clue: "Tượng nhân sư canh giữ lăng mộ cổ Ai Cập" },
  { word: "ORACLE", clue: "Nhà tiên tri nhìn thấu quá khứ và tương lai" },
  { word: "FORTUNE", clue: "Vận may ngàn vàng bất ngờ mỉm cười" },
  { word: "DESTINY", clue: "Định mệnh an bài cho người xứng đáng nhất" },
  { word: "MIRACLE", clue: "Phép màu xuất hiện xoay chuyển tình thế" },
  { word: "PARADISE", clue: "Miền đất thiên đường ngập tràn ánh nắng ấm" },
  { word: "HARMONY", clue: "Sự hài hòa êm dịu giữa đất trời và con người" },
  { word: "SYMPHONY", clue: "Bản giao hưởng ngân vang lay động tâm can" },
  { word: "MELODY", clue: "Giai điệu du dương xua tan mọi mỏi mệt" },
  { word: "RHYTHM", clue: "Nhịp điệu sôi động cuốn hút từng bước chân" },
  { word: "PASSION", clue: "Ngọn lửa đam mê cháy bỏng khát khao chạm đỉnh" },
  { word: "TRIUMPH", clue: "Khúc khải hoàn ca vang dội trên đài vinh quang" },
  { word: "SUPREME", clue: "Cảnh giới tối cao không ai sánh bằng" },
  { word: "INFINITE", clue: "Không gian vô hạn không có điểm khởi đầu kết thúc" },
  { word: "ETERNAL", clue: "Sự tồn tại vĩnh hằng cùng thời gian năm tháng" },
  { word: "MAJESTIC", clue: "Vẻ đẹp tráng lệ uy nghiêm khiến muôn người ngưỡng mộ" },
  { word: "ULTIMATE", clue: "Giới hạn tối thượng đỉnh cao của thử thách" },
  { word: "HORIZONS", clue: "Những chân trời mới mở ra cơ hội bất tận" },
  { word: "ASCENSION", clue: "Bước thăng hoa vươn tới đẳng cấp vũ trụ" }
];

function generateStageData(engine, stage = 1, now = Date.now()) {
  const stageData = {
    stage,
    maxStages: 100,
    stageTimeLimit: 30, // 30s countdown timer
    stageDeadline: now + 30000,
    timeLeft: 30,
    engine
  };

  if (engine === "memory") {
    let pairCount = 2; // 4 cards
    if (stage > 75) pairCount = 8; // 16 cards
    else if (stage > 50) pairCount = 6; // 12 cards
    else if (stage > 25) pairCount = 4; // 8 cards
    else if (stage > 10) pairCount = 3; // 6 cards

    const cardIds = Array.from({ length: pairCount }, (_, i) => i);
    const deck = shuffle([...cardIds, ...cardIds]);
    return {
      ...stageData,
      deck,
      open: [],
      matched: [],
      moves: 0,
      feedback: `Màn ${stage}/100: Tìm đủ ${pairCount} cặp thẻ trong 30 giây!`
    };
  }

  if (engine === "number") {
    let text = "", answer = 0;
    if (stage <= 10) {
      const a = rand(9) + 2, b = rand(9) + 2;
      text = `${a} + ${b}`;
      answer = a + b;
    } else if (stage <= 25) {
      const a = rand(40) + 10, b = rand(25) + 5;
      const sub = rand(2) === 0;
      text = sub ? `${a + b} - ${b}` : `${a} + ${b}`;
      answer = sub ? a : a + b;
    } else if (stage <= 50) {
      const a = rand(10) + 2, b = rand(9) + 2;
      text = `${a} × ${b}`;
      answer = a * b;
    } else if (stage <= 75) {
      const a = rand(12) + 2, b = rand(9) + 2, c = rand(20) + 1;
      text = `${a} × ${b} + ${c}`;
      answer = a * b + c;
    } else {
      const a = rand(15) + 3, b = rand(12) + 2, c = rand(30) + 5;
      text = `${a} × ${b} - ${c}`;
      answer = a * b - c;
    }
    return {
      ...stageData,
      question: text,
      answer,
      feedback: `Màn ${stage}/100: Tính nhanh và chính xác trong 30 giây!`
    };
  }

  if (engine === "reflex") {
    const windowMs = Math.max(280, 1500 - (stage * 12));
    const delay = 1000 + rand(1500);
    return {
      ...stageData,
      goAt: now + delay,
      windowMs,
      feedback: `Màn ${stage}/100: Chạm ngay khi có tín hiệu (Cửa sổ: ${windowMs}ms · Giới hạn: 30s)!`
    };
  }

  if (engine === "blocks") {
    return {
      ...stageData,
      board: Array(64).fill(0),
      shapes: [BLOCK_SHAPES[rand(BLOCK_SHAPES.length)], BLOCK_SHAPES[rand(BLOCK_SHAPES.length)], BLOCK_SHAPES[rand(BLOCK_SHAPES.length)]],
      placed: [],
      linesCleared: 0,
      feedback: `Màn ${stage}/100: Đặt các khối và xóa ít nhất 1 dòng trong 30s!`
    };
  }

  if (engine === "orbit") {
    const numHazards = stage > 40 ? 2 : 1;
    const hazards = [];
    while (hazards.length < numHazards) {
      const h = rand(3);
      if (!hazards.includes(h)) hazards.push(h);
    }
    return {
      ...stageData,
      lane: 1,
      hazardLanes: hazards,
      strikeAt: now + Math.max(1200, 2200 - stage * 10),
      feedback: `Màn ${stage}/100: Chuyển làn né tránh vật cản trong 30s!`
    };
  }

  if (engine === "word") {
    const wordIdx = (stage - 1) % WORDS_VOCABULARY.length;
    const item = WORDS_VOCABULARY[wordIdx];
    return {
      ...stageData,
      word: item.word,
      clue: item.clue,
      scrambled: shuffle(item.word.split("")).join(""),
      feedback: `Màn ${stage}/100: Giải mã từ vựng trong 30 giây!`
    };
  }

  return stageData;
}

function publicState(session) {
  const s = parse(session.state_json);
  const engine = s.engine || session.game_id;
  const common = {
    id: session.id,
    gameId: session.game_id,
    engine,
    version: session.version,
    completed: !!session.completed,
    gameOver: !!s.gameOver,
    score: session.score,
    stage: s.stage || 1,
    maxStages: s.maxStages || 100,
    stageTimeLimit: s.stageTimeLimit || 30,
    stageDeadline: s.stageDeadline || (Date.now() + 30000),
    timeLeft: Math.max(0, Math.ceil(((s.stageDeadline || (Date.now() + 30000)) - Date.now()) / 1000)),
    feedback: s.feedback,
    expiresAt: session.expires_at
  };

  if (engine === "memory") {
    return { ...common, moves: s.moves, matched: s.matched, cards: s.deck.map((v, i) => s.matched.includes(i) || s.open.includes(i) ? v : null) };
  }
  if (engine === "number") {
    return { ...common, question: s.question, feedback: s.feedback };
  }
  if (engine === "reflex") {
    return { ...common, goAt: s.goAt, windowMs: s.windowMs, feedback: s.feedback };
  }
  if (engine === "blocks") {
    return {
      ...common,
      board: s.board,
      currentShapes: s.shapes,
      placedIndices: s.placed,
      linesCleared: s.linesCleared,
      feedback: s.feedback
    };
  }
  if (engine === "orbit") {
    return {
      ...common,
      lane: s.lane,
      hazardLanes: s.hazardLanes,
      strikeAt: s.strikeAt,
      feedback: s.feedback
    };
  }
  if (engine === "word") {
    return {
      ...common,
      scrambled: s.scrambled,
      clue: s.clue,
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

  const engine = g.engine || "reflex";
  const state = {
    ...generateStageData(engine, 1, now),
    engine,
    gameOver: false
  };

  const session = {
    id: id(),
    user_id: userId,
    game_id: gameId,
    state_json: JSON.stringify(state),
    version: 0,
    completed: 0,
    score: 0,
    created_at: now,
    expires_at: now + 30 * 60000
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
  const engine = s.engine || session.game_id;
  let completed = 0, score = session.score;

  // 1. TIMEOUT CHECK (30s per stage countdown)
  if (input.timeout || (s.stageDeadline && now > s.stageDeadline + 2500)) {
    s.gameOver = true;
    completed = 1;
    s.feedback = `⏰ HẾT THỜI GIAN (30s) - GAME OVER! Bạn đã dừng bước ở Màn ${s.stage || 1} / 100. Hãy thử lại để đạt mốc cao hơn!`;
    await stmt(db, `UPDATE game_sessions SET state_json=?,completed=1,score=?,version=version+1
      WHERE id=? AND user_id=? AND version=?`, [
      JSON.stringify(s), score, session.id, userId, session.version
    ]).run();
    return publicState({ ...session, state_json: JSON.stringify(s), completed: 1, score, version: session.version + 1 });
  }

  let stagePassed = false;

  if (engine === "memory") {
    const index = integer(input.index, 0, s.deck.length - 1, "Thẻ");
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
    if (s.matched.length === s.deck.length) {
      stagePassed = true;
    }

  } else if (engine === "number") {
    const answer = integer(input.answer, -100000, 100000, "Đáp án");
    if (answer === s.answer) {
      stagePassed = true;
    } else {
      s.feedback = `Chưa đúng. Đáp án là ${s.answer}. Tiếp tục cố gắng!`;
    }

  } else if (engine === "reflex") {
    const elapsed = now - s.goAt;
    if (elapsed < 100) {
      s.feedback = "Quá sớm! Chưa có tín hiệu.";
    } else if (elapsed <= (s.windowMs || 1500)) {
      stagePassed = true;
    } else {
      s.feedback = "Quá trễ! Phản xạ chưa kịp thời.";
    }

  } else if (engine === "blocks") {
    const pieceIdx = integer(input.pieceIndex, 0, s.shapes.length - 1, "Khối hình");
    const targetRow = integer(input.row, 0, 7, "Hàng");
    const targetCol = integer(input.col, 0, 7, "Cột");

    if (s.placed.includes(pieceIdx)) throw new AppError("Khối này đã được đặt rồi.");
    const shape = s.shapes[pieceIdx];

    for (const [dr, dc] of shape) {
      const r = targetRow + dr;
      const c = targetCol + dc;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) throw new AppError("Vị trí vượt ra ngoài bảng cờ.");
      if (s.board[r * 8 + c] !== 0) throw new AppError("Vị trí này đã có khối khác.");
    }

    for (const [dr, dc] of shape) {
      s.board[(targetRow + dr) * 8 + (targetCol + dc)] = 1;
    }
    s.placed.push(pieceIdx);
    score += shape.length * 15;

    // Check full rows & columns
    let cleared = 0;
    for (let r = 0; r < 8; r++) {
      if (Array.from({ length: 8 }, (_, c) => s.board[r * 8 + c]).every(v => v !== 0)) {
        for (let c = 0; c < 8; c++) s.board[r * 8 + c] = 0;
        cleared++;
      }
    }
    for (let c = 0; c < 8; c++) {
      if (Array.from({ length: 8 }, (_, r) => s.board[r * 8 + c]).every(v => v !== 0)) {
        for (let r = 0; r < 8; r++) s.board[r * 8 + c] = 0;
        cleared++;
      }
    }

    if (cleared > 0) {
      stagePassed = true;
    } else if (s.placed.length === s.shapes.length) {
      s.placed = [];
      s.shapes = [BLOCK_SHAPES[rand(BLOCK_SHAPES.length)], BLOCK_SHAPES[rand(BLOCK_SHAPES.length)], BLOCK_SHAPES[rand(BLOCK_SHAPES.length)]];
    }

  } else if (engine === "orbit") {
    if (input.lane !== undefined) {
      s.lane = integer(input.lane, 0, 2, "Làn");
    }
    const safe = !s.hazardLanes.includes(s.lane);
    if (safe) {
      stagePassed = true;
    } else {
      s.gameOver = true;
      completed = 1;
      s.feedback = `💥 Va chạm chướng ngại vật - GAME OVER! Bạn dừng bước ở Màn ${s.stage || 1} / 100.`;
    }

  } else if (engine === "word") {
    const guess = str(input.guess, 1, 30, "Từ đoán").toUpperCase().trim();
    if (guess === s.word) {
      stagePassed = true;
    } else {
      s.feedback = `Chưa đúng! Thử lại hoặc đọc kỹ gợi ý: ${s.clue}`;
    }
  }

  // 2. STAGE PROGRESSION (Up to 100 Stages with escalating difficulty!)
  if (stagePassed && !s.gameOver) {
    const remainingSec = Math.max(0, Math.ceil((s.stageDeadline - now) / 1000));
    const timeBonus = remainingSec * 15;
    const stageBonus = 100 + (s.stage || 1) * 20;
    score += stageBonus + timeBonus;

    if ((s.stage || 1) >= 100) {
      completed = 1;
      s.gameOver = false;
      s.feedback = `🏆 XUẤT SẮC! BẠN ĐÃ PHÁ ĐẢO TOÀN BỘ 100 MÀN CHƠI! Kỷ lục: ${score} điểm!`;
    } else {
      const nextStage = (s.stage || 1) + 1;
      const nextData = generateStageData(engine, nextStage, now);
      Object.assign(s, nextData);
      s.feedback = `🎉 VƯỢT MÀN ${nextStage - 1} (+${stageBonus + timeBonus}đ)! Tiến vào Màn ${nextStage}/100 (Độ khó tăng) · Thời gian: 30s!`;
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
// COIN CONVERSION & MAIN USD WALLET
// -------------------------

export async function requestCoinConversion(db, userId, input, now = Date.now()) {
  const coins = integer(input.coins, 1000, 10000000, "Số xu quy đổi");
  if (coins % 10 !== 0) throw new AppError("Số xu quy đổi phải là bội số của 10 (10 xu = $0.01 USD).");
  const requestKey = key(input.requestKey);

  const old = await one(db, "SELECT * FROM conversion_requests WHERE user_id=? AND request_key=?", [userId, requestKey]);
  if (old) return old;

  const wallet = await one(db, "SELECT balance FROM wallet_accounts WHERE id=?", [acc(userId)]);
  if (!wallet || wallet.balance < coins) {
    throw new AppError("Số dư xu khả dụng không đủ để quy đổi.", 409, "INSUFFICIENT_FUNDS");
  }

  // Rate: 1000 coins = 100 USD cents ($1.00 USD) => 10 coins = 1 cent
  const usdCents = Math.round(coins / 10);
  const conversionId = id();

  try {
    await db.batch([
      stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id=? AND balance>=?", [coins, acc(userId), coins]),
      stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [coins, acc(userId, "held")]),
      stmt(db, `INSERT INTO conversion_requests (id,user_id,coins,usd_cents,rate,status,request_key,created_at)
        VALUES (?,?,?,?,1000,'pending',?,?)`, [
        conversionId, userId, coins, usdCents, requestKey, now
      ]),
      ...posting(db, `conversion-hold:${conversionId}`, "coin_conversion_hold", userId, "COIN", [
        [acc(userId), -coins],
        [acc(userId, "held"), coins]
      ], now),
      auditStatement(db, userId, "wallet.coin_conversion_requested", conversionId, `Yêu cầu đổi ${coins} xu sang $${(usdCents / 100).toFixed(2)} USD`, now),
      stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'wallet',0,?)`, [
        id(), userId, "⏳ Đã gửi yêu cầu đổi xu sang Ví Chính ($)",
        `Yêu cầu quy đổi ${new Intl.NumberFormat("vi-VN").format(coins)} xu sang $${(usdCents / 100).toFixed(2)} USD đã được ghi nhận. Ban Quản Trị sẽ kiểm tra và cộng USD vào Ví Chính của bạn sớm nhất.`,
        now
      ])
    ]);
  } catch (e) {
    const dup = await one(db, "SELECT * FROM conversion_requests WHERE user_id=? AND request_key=?", [userId, requestKey]);
    if (dup) return dup;
    throw e;
  }

  return one(db, "SELECT * FROM conversion_requests WHERE id=?", [conversionId]);
}

export async function conversionDecision(db, actor, input, now = Date.now()) {
  const req = await one(db, "SELECT * FROM conversion_requests WHERE id=?", [input.id]);
  if (!req) throw new AppError("Không tìm thấy yêu cầu quy đổi.", 404);
  if (req.status !== "pending") throw new AppError("Yêu cầu này đã được xử lý trước đó.", 409);

  const decision = str(input.decision, 2, 20, "Quyết định");
  const note = input.note ? str(input.note, 1, 500, "Ghi chú") : (decision === "approve" ? "Đã duyệt quy đổi xu sang USD" : "Từ chối yêu cầu đổi xu");

  if (decision === "approve") {
    await db.batch([
      // Deduct coins from held, debit to system:coin_conversions
      stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id=?", [req.coins, acc(req.user_id, "held")]),
      stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id='system:coin_conversions'", [req.coins]),
      // Credit USD cents to user's main_usd wallet!
      stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [req.usd_cents, acc(req.user_id, "main_usd")]),
      stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id='system:usd_reserve'", [req.usd_cents]),
      ...posting(db, `conversion-approved:${req.id}`, "coin_conversion_settled", req.user_id, "COIN", [
        [acc(req.user_id, "held"), -req.coins],
        ["system:coin_conversions", req.coins]
      ], now),
      ...posting(db, `conversion-credit:${req.id}`, "usd_wallet_credit", req.user_id, "USD_CENT", [
        [acc(req.user_id, "main_usd"), req.usd_cents],
        ["system:usd_reserve", -req.usd_cents]
      ], now),
      stmt(db, "UPDATE conversion_requests SET status='approved',admin_note=?,settled_at=? WHERE id=? AND status='pending'", [
        note, now, req.id
      ]),
      auditStatement(db, actor, "conversion.approved", req.id, `Duyệt đổi ${req.coins} xu sang $${(req.usd_cents / 100).toFixed(2)} USD cho ${req.user_id}`, now),
      stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'wallet',0,?)`, [
        id(), req.user_id, "✅ Quy đổi xu sang Ví Chính ($) thành công!",
        `Ban Quản Trị đã DUYỆT yêu cầu đổi ${new Intl.NumberFormat("vi-VN").format(req.coins)} xu! Bạn đã nhận $${(req.usd_cents / 100).toFixed(2)} USD vào Ví Chính. Bạn có thể dùng số dư này để rút về Payoneer bất cứ lúc nào!`,
        now
      ])
    ]);
  } else if (decision === "reject") {
    await db.batch([
      // Return coins back to user available
      stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id=?", [req.coins, acc(req.user_id, "held")]),
      stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [req.coins, acc(req.user_id)]),
      ...posting(db, `conversion-rejected:${req.id}`, "coin_conversion_refund", req.user_id, "COIN", [
        [acc(req.user_id, "held"), -req.coins],
        [acc(req.user_id), req.coins]
      ], now),
      stmt(db, "UPDATE conversion_requests SET status='rejected',admin_note=?,settled_at=? WHERE id=? AND status='pending'", [
        note, now, req.id
      ]),
      auditStatement(db, actor, "conversion.rejected", req.id, `Từ chối đổi xu: ${note}`, now),
      stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'wallet',0,?)`, [
        id(), req.user_id, "❌ Yêu cầu quy đổi xu chưa được duyệt",
        `Yêu cầu đổi ${new Intl.NumberFormat("vi-VN").format(req.coins)} xu của bạn chưa được duyệt. Số xu đã được hoàn trả lại Ví Xu của bạn. Lý do: ${note}`,
        now
      ])
    ]);
  } else {
    throw new AppError("Quyết định không hợp lệ.", 400);
  }

  return one(db, "SELECT * FROM conversion_requests WHERE id=?", [req.id]);
}

export async function linkPayoneer(db, userId, linkInput) {
  const link = str(linkInput, 5, 300, "Liên kết ví Payoneer").trim();
  if (link.length < 5) throw new AppError("Đường dẫn liên kết ví Payoneer không hợp lệ.", 400);

  await stmt(db, "UPDATE app_users SET payoneer_email=? WHERE id=?", [link, userId]).run();
  const now = Date.now();
  try {
    await stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'wallet',0,?)`, [
      id(), userId, "🔗 Đã liên kết ví Payoneer thành công!",
      `Tài khoản của bạn đã liên kết thành công liên kết ví Payoneer: [${link}]. Khi có lệnh rút tiền, Ban Quản Trị sẽ chuyển tiền trực tiếp vào liên kết ví này.`,
      now
    ]).run();
  } catch {}

  return { success: true, payoneerEmail: link };
}

// -------------------------
// PAYOUT (WITHDRAWAL FROM VÍ CHÍNH TO PAYONEER)
// -------------------------

export async function createPayout(db, userId, input, now = Date.now()) {
  const usdAmount = Number(input.usdAmount || (input.usdCents ? input.usdCents / 100 : (input.coins ? input.coins / 1000 : 0)));
  if (isNaN(usdAmount) || usdAmount < 1) {
    throw new AppError("Số tiền rút tối thiểu là $1.00 USD.", 400);
  }
  const usdCents = Math.round(usdAmount * 100);
  const requestKey = key(input.requestKey);

  const u = await one(db, "SELECT * FROM app_users WHERE id=?", [userId]);
  if (!u) throw new AppError("Người dùng không tồn tại.", 404);

  // Requirement: Must link Payoneer wallet before withdrawing (supports both link URL and email)
  const payoneerRecipient = (input.payoneerEmail || input.recipient || u.payoneer_email || "").trim();
  if (!payoneerRecipient || payoneerRecipient.length < 5) {
    throw new AppError("Bạn cần liên kết địa chỉ ví Payoneer vào tài khoản trước khi tạo lệnh rút tiền.", 400, "PAYONEER_NOT_LINKED");
  }

  // Update payoneer_email if changed or newly provided
  if (!u.payoneer_email || u.payoneer_email !== payoneerRecipient) {
    await stmt(db, "UPDATE app_users SET payoneer_email=? WHERE id=?", [payoneerRecipient, userId]).run();
  }

  const lvlInfo = computeLevelInfo(u.play_time_seconds || 0, u.total_coins_bought || 0);
  if (lvlInfo.level < 50) {
    throw new AppError("Bạn cần đạt tối thiểu Cấp 50 để mở khóa quyền rút tiền về ví Payoneer.", 403, "LEVEL_LOCKED");
  }

  const maxUsd = lvlInfo.level >= 100 ? 500 : 50;
  const maxCents = maxUsd * 100;
  if (usdCents > maxCents) {
    throw new AppError(`Hạn mức rút tối đa cho Cấp ${lvlInfo.level} là $${maxUsd}.00 USD mỗi ngày.`, 400);
  }

  const dayAgo = now - 24 * 3600 * 1000;
  const todayPayout = await one(db, "SELECT COUNT(*) as n FROM payouts WHERE user_id=? AND created_at>? AND status != 'rejected'", [userId, dayAgo]);
  if (todayPayout?.n >= 1) {
    throw new AppError("Bạn đã thực hiện yêu cầu rút tiền hôm nay. Mỗi ngày chỉ được tạo tối đa 1 lệnh rút.", 429);
  }

  const old = await one(db, "SELECT * FROM payouts WHERE user_id=? AND request_key=?", [userId, requestKey]);
  if (old) return old;

  // Check Ví Chính (main_usd) balance
  const mainUsdWallet = await one(db, "SELECT balance FROM wallet_accounts WHERE id=?", [acc(userId, "main_usd")]);
  if (!mainUsdWallet || mainUsdWallet.balance < usdCents) {
    throw new AppError("Số dư Ví Chính ($) không đủ để thực hiện lệnh rút.", 409, "INSUFFICIENT_FUNDS");
  }

  // Requirement 5: Withdrawal fee is 15% / request
  const feeCents = Math.round(usdCents * 0.15);
  const netCents = usdCents - feeCents;
  const payoutId = id();

  try {
    await db.batch([
      stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id=? AND balance>=?", [usdCents, acc(userId, "main_usd"), usdCents]),
      stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [usdCents, acc(userId, "main_usd_held")]),
      stmt(db, `INSERT INTO payouts (id,user_id,coins,usd_cents,fee_cents,net_cents,recipient,method,status,request_key,created_at,updated_at)
        VALUES (?,?,0,?,?,?,?,'payoneer','pending',?,?,?)`, [
        payoutId, userId, usdCents, feeCents, netCents, payoneerRecipient, requestKey, now, now
      ]),
      ...posting(db, `payout-hold:${payoutId}`, "payout_hold", userId, "USD_CENT", [
        [acc(userId, "main_usd"), -usdCents],
        [acc(userId, "main_usd_held"), usdCents]
      ], now),
      auditStatement(db, userId, "wallet.payout_requested", payoutId, `Rút $${(usdCents / 100).toFixed(2)} USD (Phí 15%: $${(feeCents / 100).toFixed(2)}, Thực nhận: $${(netCents / 100).toFixed(2)}) về ${payoneerRecipient}`, now),
      stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'wallet',0,?)`, [
        id(), userId, "💸 Đã gửi yêu cầu rút tiền về Payoneer!",
        `Lệnh rút $${(usdCents / 100).toFixed(2)} USD (Phí 15%: $${(feeCents / 100).toFixed(2)} USD, Thực nhận: $${(netCents / 100).toFixed(2)} USD) về ví [${payoneerRecipient}] đã được gửi tới Ban Quản Trị. Quản trị viên sẽ kiểm tra và chuyển tiền thật qua Payoneer.`,
        now
      ])
    ]);
  } catch (e) {
    const duplicate = await one(db, "SELECT * FROM payouts WHERE user_id=? AND request_key=?", [userId, requestKey]);
    if (duplicate) return duplicate;
    throw e;
  }

  return one(db, "SELECT * FROM payouts WHERE id=?", [payoutId]);
}

export async function payoutDecision(db, actor, input, now = Date.now()) {
  const p = await one(db, "SELECT * FROM payouts WHERE id=?", [input.id]);
  if (!p) throw new AppError("Không tìm thấy yêu cầu.", 404);

  if (input.decision === "approve") {
    if (p.status !== "pending") throw new AppError("Yêu cầu đã được xử lý.", 409);
    await db.batch([
      stmt(db, "UPDATE payouts SET status='approved',approved_by=?,updated_at=? WHERE id=? AND status='pending'", [actor, now, p.id]),
      auditStatement(db, actor, "payout.approved", p.id, "Duyệt lệnh rút tiền (chờ xác nhận chuyển Payoneer)", now)
    ]);
  } else if (["reject", "confirm_paid", "simulate_paid"].includes(input.decision)) {
    const paid = input.decision === "confirm_paid" || input.decision === "simulate_paid";
    if (paid ? !["pending", "approved"].includes(p.status) : !["pending", "approved"].includes(p.status)) {
      throw new AppError("Trạng thái yêu cầu không phù hợp.", 409);
    }
    const state = paid ? "paid" : "rejected";
    const externalRef = input.externalRef ? str(input.externalRef, 2, 100, "Mã giao dịch Payoneer") : `PAY-${now.toString(36).toUpperCase()}`;
    const noteText = str(input.note || (paid ? `Đã chuyển $${((p.net_cents || p.usd_cents) / 100).toFixed(2)} USD qua ví Payoneer` : "Không đủ điều kiện rút tiền"), 1, 500, "Ghi chú");

    try {
      await db.batch([
        stmt(db, "UPDATE wallet_accounts SET balance=balance-? WHERE id=?", [p.usd_cents, acc(p.user_id, "main_usd_held")]),
        ...(paid ? [
          stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id='system:withdrawal_fees'", [p.fee_cents || 0]),
          stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id='system:services'", [p.net_cents || p.usd_cents]),
        ] : [
          stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [p.usd_cents, acc(p.user_id, "main_usd")])
        ]),
        ...posting(db, `payout-final:${p.id}`, paid ? "payout_paid" : "payout_return", p.user_id, "USD_CENT", paid ? [
          [acc(p.user_id, "main_usd_held"), -p.usd_cents],
          ["system:withdrawal_fees", p.fee_cents || 0],
          ["system:services", p.net_cents || p.usd_cents]
        ] : [
          [acc(p.user_id, "main_usd_held"), -p.usd_cents],
          [acc(p.user_id, "main_usd"), p.usd_cents]
        ], now),
        stmt(db, "UPDATE payouts SET status=?,external_ref=?,note=?,updated_at=? WHERE id=?", [
          state, paid ? externalRef : null, noteText, now, p.id
        ]),
        auditStatement(db, actor, `payout.${state}`, p.id, `Actor: ${actor}; Giao dịch Payoneer: ${externalRef}`, now),
        stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'wallet',0,?)`, [
          id(), p.user_id, paid ? "🎉 Rút tiền Payoneer thành công!" : "❌ Lệnh rút tiền bị từ chối",
          paid
            ? `Admin đã thực hiện chuyển tiền thật vào ví Payoneer [${p.recipient}]! Số tiền: $${((p.net_cents || p.usd_cents) / 100).toFixed(2)} USD (sau phí 15%). Mã giao dịch Payoneer: ${externalRef}.`
            : `Lệnh rút $${(p.usd_cents / 100).toFixed(2)} USD của bạn đã bị từ chối. Số tiền đã được hoàn trả lại Ví Chính. Lý do: ${noteText}.`,
          now
        ])
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
// CLAIM XU (MINING MACHINES & CLAIM WALLET)
// -------------------------

export const CLAIM_MACHINES = [
  { level: 1, reqLevel: 10, ratePerHour: 10, name: "Máy Cấp 1", tag: "10 xu/h", desc: "Máy sơ cấp năng lượng lượng tử" },
  { level: 2, reqLevel: 20, ratePerHour: 30, name: "Máy Cấp 2", tag: "30 xu/h", desc: "Máy tăng áp nhịp xung điện từ" },
  { level: 3, reqLevel: 30, ratePerHour: 50, name: "Máy Cấp 3", tag: "50 xu/h", desc: "Máy lõi điện tử Cyber Core" },
  { level: 4, reqLevel: 40, ratePerHour: 100, name: "Máy Cấp 4", tag: "100 xu/h", desc: "Máy gia tốc hạt Hyper Drive" },
  { level: 5, reqLevel: 50, ratePerHour: 150, name: "Máy Cấp 5", tag: "150 xu/h", desc: "Máy hút năng lượng Quantum Vault" },
  { level: 6, reqLevel: 60, ratePerHour: 220, name: "Máy Cấp 6", tag: "220 xu/h", desc: "Máy bão xoáy Vortex Prime" },
  { level: 7, reqLevel: 70, ratePerHour: 300, name: "Máy Cấp 7", tag: "300 xu/h", desc: "Máy bức xạ mặt trời Solar Flare" },
  { level: 8, reqLevel: 80, ratePerHour: 400, name: "Máy Cấp 8", tag: "400 xu/h", desc: "Máy lò phản ứng Nova Reactor" },
  { level: 9, reqLevel: 90, ratePerHour: 600, name: "Máy Cấp 9", tag: "600 xu/h", desc: "Máy ma trận ngân hà Galactic Matrix" },
  { level: 10, reqLevel: 100, ratePerHour: 1000, name: "Máy Cấp 10", tag: "1000 xu/h", desc: "Máy quyền năng tối thượng Infinity Lord" },
];

export async function getClaimState(db, userId, now = Date.now()) {
  await checkAndProcessLevelUp(db, userId, now);
  const u = await one(db, "SELECT * FROM app_users WHERE id=?", [userId]);
  if (!u) throw new AppError("Người dùng không tồn tại.", 404);

  const lvlInfo = computeLevelInfo(u.play_time_seconds || 0, u.total_coins_bought || 0);
  const userLevel = lvlInfo.level;

  let cw = await one(db, "SELECT * FROM claim_wallets WHERE user_id=?", [userId]);
  if (!cw) {
    await stmt(db, "INSERT INTO claim_wallets (user_id, balance, held, updated_at) VALUES (?, 0, 0, ?)", [userId, now]).run();
    cw = { user_id: userId, balance: 0, held: 0, updated_at: now };
  }

  let session = await one(db, "SELECT * FROM claim_sessions WHERE user_id=? ORDER BY started_at DESC LIMIT 1", [userId]);
  let uncollected = 0;
  let isRunning = false;
  let timeLeftSec = 0;

  if (session && session.status === "running") {
    const effectiveTime = Math.min(now, session.ends_at);
    const durationMs = Math.max(0, effectiveTime - session.last_collected_at);
    uncollected = (durationMs / 3600000) * session.rate_per_hour;

    if (now >= session.ends_at) {
      // Auto-stop after 1h!
      const totalSessionEarned = Number(((session.coins_collected || 0) + uncollected).toFixed(5));
      const newBal = Number(((cw.balance || 0) + uncollected).toFixed(5));
      await db.batch([
        stmt(db, "UPDATE claim_wallets SET balance=?, updated_at=? WHERE user_id=?", [newBal, now, userId]),
        stmt(db, "UPDATE claim_sessions SET coins_collected=?, last_collected_at=?, status='stopped', updated_at=? WHERE id=?", [
          totalSessionEarned, session.ends_at, now, session.id
        ])
      ]);
      cw.balance = newBal;
      session.coins_collected = totalSessionEarned;
      session.last_collected_at = session.ends_at;
      session.status = "stopped";
      uncollected = 0;
      isRunning = false;
      timeLeftSec = 0;
    } else {
      isRunning = true;
      timeLeftSec = Math.max(0, Math.ceil((session.ends_at - now) / 1000));
    }
  }

  const claimTransfers = await rows(db, "SELECT * FROM claim_transfers WHERE user_id=? ORDER BY created_at DESC LIMIT 30", [userId]);

  return {
    userLevel,
    isEligible: userLevel >= 10,
    claimWallet: {
      balance: Number((cw.balance || 0).toFixed(5)),
      held: Number((cw.held || 0).toFixed(5)),
    },
    activeSession: session ? {
      id: session.id,
      machineLevel: session.machine_level,
      ratePerHour: session.rate_per_hour,
      startedAt: session.started_at,
      endsAt: session.ends_at,
      lastCollectedAt: session.last_collected_at,
      coinsCollected: Number((session.coins_collected || 0).toFixed(5)),
      status: session.status,
      isRunning,
      timeLeftSec,
      uncollectedCoins: Number(uncollected.toFixed(5)),
    } : null,
    transfers: claimTransfers,
    machines: CLAIM_MACHINES.map(m => ({
      ...m,
      unlocked: userLevel >= m.reqLevel,
      current: session?.machine_level === m.level && isRunning
    }))
  };
}

export async function startClaimSession(db, userId, input = {}, now = Date.now()) {
  await checkAndProcessLevelUp(db, userId, now);
  const u = await one(db, "SELECT * FROM app_users WHERE id=?", [userId]);
  if (!u) throw new AppError("Người dùng không tồn tại.", 404);

  const lvlInfo = computeLevelInfo(u.play_time_seconds || 0, u.total_coins_bought || 0);
  const userLevel = lvlInfo.level;
  if (userLevel < 10) {
    throw new AppError("Bạn cần đạt tối thiểu Cấp 10 để mở khóa tính năng Claim xu.", 403, "LEVEL_LOCKED");
  }

  const maxAllowedTier = Math.min(10, Math.floor(userLevel / 10));
  const reqLvl = input.machineLevel ? Math.max(1, Math.min(10, Number(input.machineLevel))) : maxAllowedTier;
  const machine = CLAIM_MACHINES.find(m => m.level === reqLvl);
  if (!machine || userLevel < machine.reqLevel) {
    throw new AppError(`Bạn cần đạt Cấp ${machine?.reqLevel || 10} để mở khóa ${machine?.name || 'máy này'}.`, 403);
  }

  let cw = await one(db, "SELECT * FROM claim_wallets WHERE user_id=?", [userId]);
  if (!cw) {
    await stmt(db, "INSERT INTO claim_wallets (user_id, balance, held, updated_at) VALUES (?, 0, 0, ?)", [userId, now]).run();
    cw = { user_id: userId, balance: 0, held: 0, updated_at: now };
  }

  // Harvest any remaining coins from previous session if exists
  const prevSession = await one(db, "SELECT * FROM claim_sessions WHERE user_id=? ORDER BY started_at DESC LIMIT 1", [userId]);
  if (prevSession && prevSession.last_collected_at < prevSession.ends_at) {
    const effectiveTime = Math.min(now, prevSession.ends_at);
    const durationMs = Math.max(0, effectiveTime - prevSession.last_collected_at);
    const uncollected = (durationMs / 3600000) * prevSession.rate_per_hour;
    if (uncollected > 0) {
      const newBal = Number(((cw.balance || 0) + uncollected).toFixed(5));
      const newTotal = Number(((prevSession.coins_collected || 0) + uncollected).toFixed(5));
      await db.batch([
        stmt(db, "UPDATE claim_wallets SET balance=?, updated_at=? WHERE user_id=?", [newBal, now, userId]),
        stmt(db, "UPDATE claim_sessions SET coins_collected=?, last_collected_at=?, status='stopped', updated_at=? WHERE id=?", [
          newTotal, effectiveTime, now, prevSession.id
        ])
      ]);
    } else {
      await stmt(db, "UPDATE claim_sessions SET status='stopped', updated_at=? WHERE id=?", [now, prevSession.id]).run();
    }
  }

  // Create new 1-hour session
  const sid = id();
  const endsAt = now + 3600 * 1000;
  await stmt(db, `INSERT INTO claim_sessions (id, user_id, machine_level, rate_per_hour, started_at, ends_at, last_collected_at, coins_collected, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'running', ?, ?)`, [
    sid, userId, machine.level, machine.ratePerHour, now, endsAt, now, now, now
  ]).run();

  return getClaimState(db, userId, now);
}

export async function harvestClaimSession(db, userId, now = Date.now()) {
  let cw = await one(db, "SELECT * FROM claim_wallets WHERE user_id=?", [userId]);
  if (!cw) {
    await stmt(db, "INSERT INTO claim_wallets (user_id, balance, held, updated_at) VALUES (?, 0, 0, ?)", [userId, now]).run();
    cw = { user_id: userId, balance: 0, held: 0, updated_at: now };
  }

  const session = await one(db, "SELECT * FROM claim_sessions WHERE user_id=? ORDER BY started_at DESC LIMIT 1", [userId]);
  if (!session) return getClaimState(db, userId, now);

  const effectiveTime = Math.min(now, session.ends_at);
  const durationMs = Math.max(0, effectiveTime - session.last_collected_at);
  const uncollected = (durationMs / 3600000) * session.rate_per_hour;

  if (uncollected > 0) {
    const newBal = Number(((cw.balance || 0) + uncollected).toFixed(5));
    const newTotal = Number(((session.coins_collected || 0) + uncollected).toFixed(5));
    const isFinished = now >= session.ends_at;
    await db.batch([
      stmt(db, "UPDATE claim_wallets SET balance=?, updated_at=? WHERE user_id=?", [newBal, now, userId]),
      stmt(db, "UPDATE claim_sessions SET coins_collected=?, last_collected_at=?, status=?, updated_at=? WHERE id=?", [
        newTotal, effectiveTime, isFinished ? 'stopped' : session.status, now, session.id
      ])
    ]);
  }

  return getClaimState(db, userId, now);
}

export async function transferClaimToWallet(db, userId, input = {}, now = Date.now()) {
  const coins = integer(input.coins, 1000, 50000, "Số xu chuyển");
  const requestKey = key(input.requestKey);

  let cw = await one(db, "SELECT * FROM claim_wallets WHERE user_id=?", [userId]);
  if (!cw || (cw.balance || 0) < 1000) {
    throw new AppError("Bạn cần tích lũy tối thiểu 1.000 xu trong Ví Claim để tạo lệnh chuyển.", 400);
  }
  if ((cw.balance || 0) < coins) {
    throw new AppError("Số dư Ví Claim không đủ để chuyển số xu này.", 400);
  }

  const old = await one(db, "SELECT * FROM claim_transfers WHERE user_id=? AND request_key=?", [userId, requestKey]);
  if (old) return old;

  const transferId = id();
  await db.batch([
    stmt(db, "UPDATE claim_wallets SET balance=balance-?, held=held+?, updated_at=? WHERE user_id=? AND balance>=?", [
      coins, coins, now, userId, coins
    ]),
    stmt(db, `INSERT INTO claim_transfers (id, user_id, coins, status, request_key, created_at)
      VALUES (?, ?, ?, 'pending', ?, ?)`, [
      transferId, userId, coins, requestKey, now
    ]),
    stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'wallet',0,?)`, [
      id(), userId, "⏳ Đã gửi yêu cầu chuyển xu Claim sang Ví Xu!",
      `Yêu cầu chuyển ${new Intl.NumberFormat("vi-VN").format(coins)} xu từ Ví Claim sang Ví Xu đã được gửi tới Ban Quản Trị. Vui lòng chờ kiểm tra và phê duyệt.`,
      now
    ]),
    auditStatement(db, userId, "claim.transfer_requested", transferId, `Chuyển ${coins} xu từ Ví Claim sang Ví Xu (chờ duyệt)`, now)
  ]);

  return one(db, "SELECT * FROM claim_transfers WHERE id=?", [transferId]);
}

export async function claimTransferDecision(db, actor, input, now = Date.now()) {
  const t = await one(db, "SELECT * FROM claim_transfers WHERE id=?", [input.id]);
  if (!t) throw new AppError("Không tìm thấy yêu cầu.", 404);
  if (t.status !== "pending") throw new AppError("Yêu cầu này đã được xử lý trước đó.", 409);

  const note = input.note ? str(input.note, 1, 300, "Ghi chú") : (input.decision === "approve" ? "Đã duyệt chuyển xu" : "Từ chối yêu cầu");

  if (input.decision === "approve") {
    await db.batch([
      stmt(db, "UPDATE claim_wallets SET held=held-?, updated_at=? WHERE user_id=? AND held>=?", [
        t.coins, now, t.user_id, t.coins
      ]),
      stmt(db, "UPDATE wallet_accounts SET balance=balance+? WHERE id=?", [
        t.coins, acc(t.user_id, "available")
      ]),
      ...posting(db, `claim-payout:${t.id}`, "claim_mining_payout", t.user_id, "COIN", [
        ["system:claim_mining", -t.coins],
        [acc(t.user_id, "available"), t.coins]
      ], now),
      stmt(db, "UPDATE claim_transfers SET status='approved', admin_note=?, settled_at=? WHERE id=? AND status='pending'", [
        note, now, t.id
      ]),
      auditStatement(db, actor, "claim_transfer.approved", t.id, `Duyệt chuyển ${t.coins} xu từ Ví Claim sang Ví Xu cho ${t.user_id}`, now),
      stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'wallet',0,?)`, [
        id(), t.user_id, "🎉 Chuyển xu Claim thành công!",
        `Ban Quản Trị đã duyệt chuyển ${new Intl.NumberFormat("vi-VN").format(t.coins)} xu từ Ví Claim sang Ví Xu (Ví chơi game) của bạn! Bạn có thể dùng xu này để chơi game, tham gia giải đấu hoặc quy đổi.`,
        now
      ])
    ]);
  } else if (input.decision === "reject") {
    await db.batch([
      stmt(db, "UPDATE claim_wallets SET held=held-?, balance=balance+?, updated_at=? WHERE user_id=?", [
        t.coins, t.coins, now, t.user_id
      ]),
      stmt(db, "UPDATE claim_transfers SET status='rejected', admin_note=?, settled_at=? WHERE id=? AND status='pending'", [
        note, now, t.id
      ]),
      auditStatement(db, actor, "claim_transfer.rejected", t.id, `Từ chối chuyển xu: ${note}`, now),
      stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'wallet',0,?)`, [
        id(), t.user_id, "❌ Yêu cầu chuyển xu Claim chưa được duyệt",
        `Yêu cầu chuyển ${new Intl.NumberFormat("vi-VN").format(t.coins)} xu từ Ví Claim của bạn chưa được duyệt. Số xu đã được hoàn trả lại Ví Claim. Lý do: ${note}`,
        now
      ])
    ]);
  } else {
    throw new AppError("Quyết định không hợp lệ.", 400);
  }

  return one(db, "SELECT * FROM claim_transfers WHERE id=?", [t.id]);
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
    const pendingConversions = (await one(db, "SELECT COUNT(*) AS n FROM conversion_requests WHERE status='pending'"))?.n || 0;
    const totalTournaments = (await one(db, "SELECT COUNT(*) AS n FROM tournaments"))?.n || 0;
    const totalTransfers = (await one(db, "SELECT COUNT(*) AS n FROM wallet_transfers"))?.n || 0;

    return {
      sandbox: true,
      livePayments: false,
      users: await rows(db, `
        SELECT u.*,
          COALESCE(a.balance, 0) AS available,
          COALESCE(h.balance, 0) AS held,
          COALESCE(m.balance, 0) AS main_usd,
          COALESCE(mh.balance, 0) AS main_usd_held
        FROM app_users u
        LEFT JOIN wallet_accounts a ON a.id = u.id || ':available'
        LEFT JOIN wallet_accounts h ON h.id = u.id || ':held'
        LEFT JOIN wallet_accounts m ON m.id = u.id || ':main_usd'
        LEFT JOIN wallet_accounts mh ON mh.id = u.id || ':main_usd_held'
        ORDER BY u.created_at DESC LIMIT 100
      `),
      plans: (await rows(db, "SELECT * FROM plans")).map(p => ({ ...p, perks: parse(p.perks_json) })),
      orders: await rows(db, `
        SELECT o.*, u.name AS user_name
        FROM orders o
        JOIN app_users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 100
      `),
      conversions: await rows(db, `
        SELECT c.*, u.name AS user_name, u.email AS user_email
        FROM conversion_requests c
        JOIN app_users u ON u.id = c.user_id
        ORDER BY c.created_at DESC LIMIT 100
      `),
      claimTransfers: await rows(db, `
        SELECT ct.*, u.name AS user_name, u.email AS user_email, u.level AS user_level
        FROM claim_transfers ct
        JOIN app_users u ON u.id = ct.user_id
        ORDER BY ct.created_at DESC LIMIT 100
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
        pendingConversions: pendingConversions,
        pendingClaimTransfers: (await one(db, "SELECT COUNT(*) AS n FROM claim_transfers WHERE status='pending'"))?.n || 0,
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
  if (action === "conversion.decision") return conversionDecision(db, actor, input);
  if (action === "claim.transfer_decision") return claimTransferDecision(db, actor, input);

  if (action === "membership.grant") {
    const targetUserId = str(input.userId, 1, 100, "Người nhận");
    const planId = str(input.planId, 3, 50, "Gói thành viên");
    const note = str(input.note || "Cấp quyền thành viên thủ công từ Ban Quản Trị", 1, 500, "Ghi chú");

    const targetUser = await one(db, "SELECT * FROM app_users WHERE id=? OR LOWER(email)=LOWER(?)", [targetUserId, targetUserId]);
    if (!targetUser) throw new AppError("Không tìm thấy người dùng phù hợp.", 404);

    const plan = await one(db, "SELECT * FROM plans WHERE id=?", [planId]);
    if (!plan) throw new AppError("Gói thành viên không tồn tại.", 404);

    const now = Date.now();
    const last = await one(db, "SELECT MAX(ends_at) AS ends_at FROM memberships WHERE user_id=? AND plan_id=?", [targetUser.id, plan.id]);
    const start = Math.max(now, last?.ends_at || 0);
    const end = periodEnd(start, plan.period);
    const orderId = `admin-grant:${id()}`;

    await db.batch([
      stmt(db, "INSERT INTO memberships (id,user_id,plan_id,order_id,starts_at,ends_at,terms_json) VALUES (?,?,?,?,?,?,?)", [
        id(), targetUser.id, plan.id, orderId, start, end, JSON.stringify({ ...plan, manual_grant: true, granted_by: actor, note })
      ]),
      auditStatement(db, actor, action, targetUser.id, `Cấp thủ công gói ${planId} cho ${targetUser.email} đến ${new Date(end).toISOString().slice(0, 10)}`, now),
      stmt(db, `INSERT INTO user_notifications (id,user_id,title,message,kind,read,created_at) VALUES (?,?,?,?,'membership',0,?)`, [
        id(), targetUser.id, `👑 Chúc mừng! Bạn đã được cấp gói thành viên ${plan.id.toUpperCase()}!`,
        `Ban Quản Trị đã kích hoạt gói thành viên đặc quyền cho tài khoản của bạn. Hạn sử dụng đến: ${new Date(end).toLocaleDateString("vi-VN")}. Lời nhắn: ${note}`,
        now
      ])
    ]);
    return { success: true, userId: targetUser.id, planId, startsAt: start, endsAt: end };
  }

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

  if (action === "user.reset_password") {
    const newPassword = str(input.password || "123456", 1, 100, "Mật khẩu mới");
    const newHash = await hashPassword(newPassword);
    await db.batch([
      stmt(db, "UPDATE app_users SET password_hash=? WHERE id=?", [newHash, input.userId]),
      auditStatement(db, actor, action, str(input.userId, 1, 100, "Tài khoản"), `Đặt lại mật khẩu thành công`)
    ]);
    return { success: true, newPassword };
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
  if (action === "wallet.convert_coins") return requestCoinConversion(db, userId, input);
  if (action === "user.link_payoneer") return linkPayoneer(db, userId, input.link || input.email);
  if (action === "payout.create") return createPayout(db, userId, input);
  if (action === "review.create") return createGameReview(db, userId, input);
  if (action === "claim.state") return getClaimState(db, userId);
  if (action === "claim.start") return startClaimSession(db, userId, input);
  if (action === "claim.harvest") return harvestClaimSession(db, userId);
  if (action === "claim.transfer_to_wallet") return transferClaimToWallet(db, userId, input);

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
