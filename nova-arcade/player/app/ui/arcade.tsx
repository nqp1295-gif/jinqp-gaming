"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Search, Gamepad2, Compass, Heart, Wallet, Crown, Gem, Shield,
  ArrowUpRight, ArrowRight, ArrowLeft, Play, Check, X, Sparkles, Zap,
  Clock3, Bell, ChevronRight, HelpCircle, LogOut, Coins, Copy, RefreshCw,
  Send, Link2, QrCode, CheckCircle2, Menu, LoaderCircle, CircleAlert,
  Trophy, Leaf, Moon, Sun, Flame, Flower2, Rocket, Diamond, Maximize2,
  Minimize2, Star, Users, ArrowDownLeft, ShieldCheck, Tag, Globe, Settings, Volume2, VolumeX, ExternalLink
} from "lucide-react";
import QRCode from "qrcode";
import {
  type Locale,
  SUPPORTED_LANGUAGES,
  type TranslationKey,
  getTranslation,
} from "./i18n";

export const PAYONEER_RECEIVING_URL = "https://link.payoneer.com/Token?t=3B50A7728EED4CA483E62359684E5967&src=pl";
export const PAYONEER_QR_IMAGE = "/art/payoneer-qr.png";

type Plan = {
  id: string; tier: string; period: string; price_cents: number;
  multiplier_bps: number; daily_cap: number; session_cap: number;
  perks: string[]; revision: number; active: number;
};

type TopupPackage = {
  id: string; coins: number; bonus: number; priceCents: number;
  label: string; tag: string; popular?: boolean; best?: boolean;
};

type Game = {
  id: string; title: string; subtitle: string; category: string;
  art: string; engine: string | null; base_reward: number;
};

type Tournament = {
  id: string; title: string; game_id: string; entry_fee_coins: number;
  prize_pool_coins: number; min_players: number; max_players: number;
  status: string; prize_rules_json: string; rules: number[];
  start_time: number; end_time: number; totalEntries: number;
  leaderboard: any[]; myEntry: any;
};

type Review = {
  id: string; game_id: string; user_name: string; rating: number;
  comment: string; created_at: number;
};

type Data = {
  plans: Plan[];
  topupPackages: TopupPackage[];
  games: Game[];
  tournaments: Tournament[];
  reviews: Review[];
  countryPolicies: any[];
  user: any;
  livePayments: boolean;
  sandbox: boolean;
};

const tierNames: Record<string, string> = { bronze: "Đồng", gold: "Vàng", diamond: "Kim Cương" };
const periods: Record<string, string> = { week: "tuần", month: "tháng", year: "năm" };

const money = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(c / 100);
const vndEstimate = (c: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(c * 254));
const number = (v: number) => new Intl.NumberFormat("vi-VN").format(v);
const date = (v: number) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(v);
const timeRemaining = (endTime: number) => {
  const diff = Math.max(0, endTime - Date.now());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}p`;
};
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const names: Record<string, string> = {
  game_reward: "Thưởng hoàn thành game",
  payout_hold: "Giữ xu cho yêu cầu rút",
  payout_return: "Hoàn xu từ yêu cầu rút",
  payout_paid: "Rút thử nghiệm hoàn tất",
  membership: "Kích hoạt thành viên",
  topup_refill: "Nạp xu số dư",
  p2p_transfer: "Chuyển xu cho bạn bè",
  tournament_entry_fee: "Phí tham gia giải đấu",
  tournament_prize_won: "Thưởng giải đấu kỹ năng"
};

const statusNames: Record<string, string> = {
  pending: "Chờ xử lý", approved: "Đã duyệt", paid: "Hoàn tất",
  rejected: "Đã từ chối", resolved: "Đã phản hồi", open: "Đang mở",
  completed: "Thành công", winner: "Thắng giải"
};

async function action(name: string, input: unknown = {}) {
  const r = await fetch("/api/arcade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: name, input })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Yêu cầu chưa thành công.");
  return d;
}

function Spinner() { return <LoaderCircle className="spin" size={18} />; }
function Coin({ size = 18 }: { size?: number }) {
  return <span className="coin" style={{ width: size, height: size, fontSize: size * 0.6 }}>N</span>;
}

function Modal({ children, title, onClose, wide = false, fullscreen = false }: {
  children: ReactNode; title: string; onClose: () => void; wide?: boolean; fullscreen?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
      d?.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""} ${fullscreen ? "fullscreen" : ""}`}
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      aria-label={title}
    >
      <div className="modal-top">
        <span>{title}</span>
        <button className="icon-button" aria-label="Đóng hộp thoại" onClick={onClose}><X size={20} /></button>
      </div>
      {children}
    </dialog>
  );
}

export default function Arcade({ viewer }: { viewer: { name: string; email: string } | null }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState("explore");
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("month");
  const [toast, setToast] = useState("");
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [showRefill, setShowRefill] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [legal, setLegal] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [lang, setLang] = useState<Locale>("vi");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgEnabled] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<"vnd" | "usd">("vnd");

  const t = (key: TranslationKey) => getTranslation(lang, key);

  const changeLang = (l: Locale) => {
    setLang(l);
    setShowLangMenu(false);
    try {
      localStorage.setItem("jinqp_lang", l);
    } catch {}
  };

  const searchRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    const r = await fetch("/api/arcade", { cache: "no-store" });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    setData(d);
    setError("");
    return d;
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jinqp_lang") as Locale;
      if (saved && ["vi", "en", "zh", "th", "lo", "hi"].includes(saved)) {
        setLang(saved);
      }
      const savedSound = localStorage.getItem("jinqp_sfx");
      if (savedSound !== null) setSoundEnabled(savedSound === "true");
      const savedBgm = localStorage.getItem("jinqp_bgm");
      if (savedBgm !== null) setBgEnabled(savedBgm === "true");
      const savedCurr = localStorage.getItem("jinqp_currency") as "vnd" | "usd";
      if (savedCurr && ["vnd", "usd"].includes(savedCurr)) setCurrencyMode(savedCurr);
    } catch {}
  }, []);

  useEffect(() => {
    reload().catch(e => setError(e.message)).finally(() => setLoading(false));
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Check URL parameters for Playhop refill flow: balance-refill-flow=purchase
  useEffect(() => {
    if (!data) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("balance-refill-flow") === "purchase") {
      const planParam = url.searchParams.get("plan");
      if (planParam) {
        const p = data.plans.find(x => x.id === planParam);
        if (p) setCheckout(p);
      } else {
        setShowRefill(true);
      }
    }
  }, [!!data]);

  const navigate = (p: string) => {
    setPage(p);
    setMobileMenu(false);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openRefill = () => {
    if (!viewer) {
      window.location.href = "/signin-with-chatgpt?return_to=/";
      return;
    }
    setShowRefill(true);
    const u = new URL(window.location.href);
    u.searchParams.set("balance-refill-flow", "purchase");
    window.history.replaceState({}, "", u);
  };

  const closeRefill = () => {
    setShowRefill(false);
    const u = new URL(window.location.href);
    u.searchParams.delete("balance-refill-flow");
    window.history.replaceState({}, "", u);
  };

  const buy = (p: Plan) => {
    if (!viewer) {
      window.location.href = "/signin-with-chatgpt?return_to=/";
      return;
    }
    setCheckout(p);
    const u = new URL(window.location.href);
    u.searchParams.set("balance-refill-flow", "purchase");
    u.searchParams.set("plan", p.id);
    window.history.replaceState({}, "", u);
  };

  const closeCheckout = () => {
    setCheckout(null);
    const u = new URL(window.location.href);
    u.searchParams.delete("balance-refill-flow");
    u.searchParams.delete("plan");
    window.history.replaceState({}, "", u);
  };

  const available = data?.user?.accounts?.find((x: any) => x.kind === "available")?.balance || 0;
  const held = data?.user?.accounts?.find((x: any) => x.kind === "held")?.balance || 0;
  const member = data?.user?.membership;

  const nav = [
    { id: "explore", icon: Compass, label: t("navExplore") },
    { id: "tournaments", icon: Trophy, label: t("navTournaments") },
    { id: "favorites", icon: Heart, label: t("navFavorites") },
    { id: "wallet", icon: Wallet, label: t("navWallet") },
    { id: "membership", icon: Crown, label: t("navMembership") },
    { id: "settings", icon: Settings, label: t("navSettings") },
  ];

  const favorites = data?.user?.favorites || [];
  const favorite = async (g: Game) => {
    if (!viewer) {
      setToast("Đăng nhập để lưu game yêu thích.");
      return;
    }
    try {
      await action("favorite.toggle", { gameId: g.id, active: !favorites.includes(g.id) });
      await reload();
    } catch (e: any) {
      setToast(e.message);
    }
  };

  const filtered = (data?.games || []).filter(g =>
    (page !== "favorites" || favorites.includes(g.id)) &&
    (category === "Tất cả" || g.category === category) &&
    normalize(g.title + " " + g.category + " " + g.subtitle).includes(normalize(query))
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "is-open" : ""}`}>
        <button className="brand" onClick={() => navigate("explore")} aria-label="JINQP Gaming Center — Trang chủ">
          <span className="brand-mark"><Gamepad2 size={25} /></span>
          <span>JINQP<span className="brand-sub">Gaming Center</span></span>
        </button>

        <span className="nav-caption">{t("yourSpace")}</span>
        <nav>
          {nav.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => navigate(n.id)}>
              <n.icon size={20} />{n.label}
              {n.id === "tournaments" && <span className="new-dot" style={{ background: "var(--lime)" }} />}
              {n.id === "membership" && <span className="new-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-rule" />
        <span className="nav-caption">{t("exploreCategories")}</span>
        <nav className="category-nav">
          {[
            [t("catBrain"), "✦", "Trí tuệ"],
            [t("catReflex"), "ϟ", "Phản xạ"],
            [t("catPuzzle"), "▦", "Giải đố"],
            [t("catAction"), "↗", "Hành động"],
            [t("catEducation"), "✍", "Giáo dục"]
          ].map(([label, s, c]) => (
            <button key={c} className="nav-item" onClick={() => { navigate("explore"); setCategory(c); }}>
              <span className="category-symbol">{s}</span>{label}
            </button>
          ))}
        </nav>

        <div className="sidebar-upgrade">
          <span className="mini-spark"><Trophy size={19} /></span>
          <h3>{t("skillArena")}</h3>
          <p style={{ whiteSpace: "pre-line" }}>{t("arenaDesc")}</p>
          <button onClick={() => navigate("tournaments")}>{t("exploreTournaments")} <ArrowUpRight size={16} /></button>
        </div>

        <div className="sidebar-bottom">
          <button className={`nav-item ${page === "settings" ? "active" : ""}`} onClick={() => navigate("settings")}><Settings size={19} />{t("navSettings")}</button>
          <button className={`nav-item ${page === "help" ? "active" : ""}`} onClick={() => navigate("help")}><HelpCircle size={19} />{t("helpCenter")}</button>
          <div className="profile">
            <span className="avatar">{viewer?.name.slice(0, 1).toUpperCase() || "J"}</span>
            <div>
              <strong>{viewer?.name.split("@")[0] || t("guestPlayer")}</strong>
              <span>{member ? tierNames[member.terms.tier] + " · Thành viên" : t("welcomeToJinqp")}</span>
            </div>
            {viewer ? (
              <a href="/signout-with-chatgpt?return_to=/" target="_top" title="Đăng xuất"><LogOut size={17} /></a>
            ) : (
              <a href="/signin-with-chatgpt?return_to=/" target="_top" title="Đăng nhập"><ArrowUpRight size={18} /></a>
            )}
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <button className="icon-button mobile-only" aria-label="Mở menu" onClick={() => setMobileMenu(!mobileMenu)}>
            <Menu size={22} />
          </button>
          <div className="search-box">
            <Search size={19} />
            <input
              ref={searchRef}
              placeholder={t("searchPlaceholder")}
              aria-label="Tìm game"
              value={query}
              onChange={e => { setQuery(e.target.value); if (!["explore", "favorites"].includes(page)) setPage("explore"); }}
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="topbar-right">
            {/* Language Selector in Topbar */}
            <div className="lang-picker-wrap">
              <button className="lang-pill" onClick={() => setShowLangMenu(!showLangMenu)} title={t("selectLang")}>
                <Globe size={15} />
                <span>{SUPPORTED_LANGUAGES.find(x => x.code === lang)?.flag} {SUPPORTED_LANGUAGES.find(x => x.code === lang)?.name}</span>
              </button>
              {showLangMenu && (
                <div className="lang-dropdown">
                  {SUPPORTED_LANGUAGES.map(item => (
                    <button
                      key={item.code}
                      className={`lang-item ${lang === item.code ? "active" : ""}`}
                      onClick={() => changeLang(item.code)}
                    >
                      <span className="lang-flag">{item.flag}</span>
                      <div className="lang-text">
                        <span className="lang-text-main">{item.name}</span>
                        <span className="lang-text-sub">{item.region}</span>
                      </div>
                      {lang === item.code && <Check size={16} className="lang-check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="test-label"><i />{t("sandboxBadge")}</span>
            <button className="balance-button" onClick={openRefill} title={t("refillBalance")}>
              <Coin /><strong>{number(available)}</strong><span>{t("coins")}</span>
              <span className="balance-plus">+</span>
            </button>
            <div className="notification-wrap">
              <button className="icon-button" aria-label="Thông báo" onClick={() => setNotifications(!notifications)}>
                <Bell size={21} />
              </button>
              {notifications && (
                <div className="notification-pop">
                  <strong>{t("systemNotice")}</strong>
                  <p>{t("welcomeNotice")}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        <main>
          <div className="sandbox-note">
            <span><Shield size={14} />{t("sandboxNote")}</span>
            <button onClick={() => setLegal("sandbox")}>{t("learnPolicy")} <ArrowUpRight size={13} /></button>
          </div>

          {error && (
            <div className="error-banner">
              <CircleAlert size={18} />
              <span>{error}</span>
              <button onClick={() => reload().catch(e => setError(e.message))}>{t("retry")}</button>
            </div>
          )}

          {loading ? (
            <div className="page-loading"><Spinner /> {t("loadingSpace")}</div>
          ) : (
            <>
              {(page === "explore" || page === "favorites") && (
                <>
                  {page === "explore" && !query && category === "Tất cả" && (
                    <>
                      <section className="hero">
                        <img src="/art/hero.svg" alt="Tay cầm game nổi giữa những quỹ đạo vũ trụ" />
                        <div className="hero-content">
                          <span className="eyebrow"><span />{t("heroEyebrow")}</span>
                          <h1>{t("heroH1Line1")}<br /><em>{t("heroH1Line2")}</em></h1>
                          <p>{t("heroDesc")}</p>
                          <div className="hero-actions">
                            <button className="btn lime" onClick={() => document.getElementById("games")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                              <Play size={16} fill="currentColor" />{t("heroExploreNow")}
                            </button>
                            <button className="hero-link" onClick={() => navigate("tournaments")}>
                              {t("heroJoinTournament")} <ArrowUpRight size={17} />
                            </button>
                          </div>
                          <div className="hero-meta">
                            <span><Gamepad2 size={14} />{t("heroMeta1")}</span>
                            <span><Trophy size={14} />{t("heroMeta2")}</span>
                            <span><Zap size={14} />{t("heroMeta3")}</span>
                          </div>
                        </div>
                        <span className="hero-index">01 <span>/ 06</span></span>
                      </section>

                      <div className="discovery-strip">
                        <div>
                          <span className="strip-icon violet"><Gamepad2 size={21} /></span>
                          <div><strong>{t("strip1Title")}</strong><p>{t("strip1Desc")}</p></div>
                        </div>
                        <div>
                          <span className="strip-icon amber"><Trophy size={21} /></span>
                          <div><strong>{t("strip2Title")}</strong><p>{t("strip2Desc")}</p></div>
                        </div>
                        <div>
                          <span className="strip-icon mint"><Coin size={22} /></span>
                          <div><strong>{t("strip3Title")}</strong><p>{t("strip3Desc")}</p></div>
                        </div>
                        <button onClick={openRefill}>{t("stripBtn")} <ArrowRight size={17} /></button>
                      </div>
                    </>
                  )}

                  <section id="games" className="games-section">
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow subtle">{t("pickJoy")}</span>
                        <h2>
                          {page === "favorites" ? t("gameFavorites") : query ? `${t("resultsFor")} “${query}”` : t("gameLibrary")}
                          <span className="count-badge">{filtered.length}</span>
                        </h2>
                      </div>
                      <span className="section-caption">{t("sectionDesc")}</span>
                    </div>

                    <div className="filter-row">
                      {[
                        [t("catAll"), "Tất cả"],
                        [t("catBrain"), "Trí tuệ"],
                        [t("catReflex"), "Phản xạ"],
                        [t("catPuzzle"), "Giải đố"],
                        [t("catAction"), "Hành động"],
                        [t("catEducation"), "Giáo dục"]
                      ].map(([label, c], i) => (
                        <button className={`filter ${category === c ? "selected" : ""}`} key={c} onClick={() => setCategory(c)}>
                          {i === 0 && <Compass size={15} />} {label}
                        </button>
                      ))}
                    </div>

                    <div className="game-grid">
                      {filtered.map(g => {
                        const reviews = (data?.reviews || []).filter(r => r.game_id === g.id);
                        const avgRating = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "5.0";

                        return (
                          <article className="game-card" key={g.id}>
                            <div className="cover">
                              <button className="cover-button" onClick={() => setSelectedGame(g)} aria-label={`Xem ${g.title}`}>
                                <img src={`/art/${g.art}.svg`} alt={`Minh họa ${g.title}`} />
                                <span className="play-overlay"><Play size={24} fill="currentColor" /></span>
                              </button>
                              <span className={`game-badge ${g.engine ? "ready" : "soon"}`}>
                                {g.engine ? <><span /> CHƠI NGAY</> : "SẮP RA MẮT"}
                              </span>
                              <button
                                className={`favorite ${favorites.includes(g.id) ? "saved" : ""}`}
                                aria-label={`${favorites.includes(g.id) ? "Bỏ lưu" : "Yêu thích"} ${g.title}`}
                                onClick={() => favorite(g)}
                              >
                                <Heart size={17} fill={favorites.includes(g.id) ? "currentColor" : "none"} />
                              </button>
                            </div>
                            <div className="game-info">
                              <div>
                                <h3><button onClick={() => setSelectedGame(g)}>{g.title}</button></h3>
                                <span>{g.category} <i /> ★ {avgRating} ({reviews.length || 1})</span>
                              </div>
                              <button className="game-arrow" onClick={() => setSelectedGame(g)} aria-label={`Mở ${g.title}`}>
                                <ArrowUpRight size={21} />
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {filtered.length === 0 && (
                      <div className="empty-state">
                        <Search size={32} />
                        <h3>{page === "favorites" ? "Góc yêu thích còn trống" : "Chưa tìm thấy game phù hợp"}</h3>
                        <p>{page === "favorites" ? "Chạm vào trái tim trên thẻ game để lưu vào đây." : "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc."}</p>
                        <button className="btn secondary" onClick={() => { setCategory("Tất cả"); setQuery(""); if (page === "favorites") navigate("explore"); }}>
                          Khám phá game
                        </button>
                      </div>
                    )}
                  </section>

                  <section className="membership-ribbon">
                    <div className="ribbon-art"><Trophy size={54} /><Sparkles size={20} /></div>
                    <div>
                      <span className="eyebrow subtle">JINQP ARENA</span>
                      <h2>Đấu trường thi đấu kỹ năng.<br /><span>Lệ phí minh bạch · Thưởng theo thành tích.</span></h2>
                      <p>Hệ thống thi đấu kiểm chứng server, chống gian lận và tự động trả thưởng.</p>
                    </div>
                    <button className="btn secondary" onClick={() => navigate("tournaments")}>
                      Xem các giải đấu <ArrowRight size={17} />
                    </button>
                  </section>
                </>
              )}

              {page === "tournaments" && (
                <TournamentsPage
                  tournaments={data?.tournaments || []}
                  signedIn={!!viewer}
                  available={available}
                  onPlayGame={(t) => {
                    const g = data?.games.find(x => x.id === t.game_id);
                    if (g) {
                      setActiveTournament(t);
                      setSelectedGame(g);
                    }
                  }}
                  reload={reload}
                  notify={setToast}
                  openRefill={openRefill}
                />
              )}

              {page === "membership" && (
                <section className="membership-page">
                  <div className="center-heading">
                    <span className="eyebrow"><Sparkles size={15} />JINQP MEMBERSHIP</span>
                    <h1>Thêm một chút <em>đặc biệt.</em></h1>
                    <p>Ba hạng thành viên. Chín cách bắt đầu.<br />Chọn thời hạn và đặc quyền phù hợp với bạn.</p>
                  </div>

                  {member && (
                    <div className="active-member">
                      <Crown size={23} />
                      <div>
                        <strong>Bạn đang là thành viên {tierNames[member.terms.tier]}</strong>
                        <span>Hiệu lực đến {date(member.ends_at)} · Thưởng x{member.terms.multiplier_bps / 10000}</span>
                      </div>
                      <CheckCircle2 size={22} />
                    </div>
                  )}

                  <div className="period-toggle">
                    {Object.entries(periods).map(([k, v]) => (
                      <button className={period === k ? "selected" : ""} key={k} onClick={() => setPeriod(k)}>
                        Gói {v}{k === "year" && <span>Dài hạn</span>}
                      </button>
                    ))}
                  </div>

                  <p className="sample-price">Giá mẫu trong bản thử nghiệm sandbox · Chưa thu tiền thật</p>

                  <div className="plan-grid">
                    {["bronze", "gold", "diamond"].map(t => {
                      const p = data?.plans.find(x => x.tier === t && x.period === period);
                      const Icon = t === "bronze" ? Shield : t === "gold" ? Crown : Gem;
                      return (
                        <article className={`plan-card ${t}`} key={t}>
                          {t === "gold" && <div className="plan-feature">THÊM ĐẶC QUYỀN, THÊM TRẢI NGHIỆM</div>}
                          <div className="plan-emblem"><Icon size={29} /></div>
                          <span className="eyebrow subtle">THÀNH VIÊN JINQP</span>
                          <h2>{tierNames[t]}</h2>
                          <p className="plan-description">
                            {t === "bronze" ? "Bắt đầu hành trình của bạn." : t === "gold" ? "Nâng nhịp mỗi lần khám phá." : "Trọn vẹn trải nghiệm JINQP."}
                          </p>
                          {p ? (
                            <>
                              <div className="plan-price">{money(p.price_cents)}<span>/ {periods[period]}</span></div>
                              <button className={`btn ${t === "gold" ? "lime" : "secondary"}`} onClick={() => buy(p)}>
                                Chọn gói {tierNames[t]} <ArrowUpRight size={17} />
                              </button>
                              <div className="plan-rule" />
                              <ul>
                                {p.perks.map((v, i) => <li key={i}><Check size={17} />{v}</li>)}
                                <li><Check size={17} />{number(p.session_cap)} xu tối đa/phiên</li>
                              </ul>
                              <span className="plan-fine">Xu phụ thuộc kết quả và hạn mức. Không bảo đảm thu nhập.</span>
                            </>
                          ) : (
                            <div className="plan-unavailable">Gói này đang tạm đóng.</div>
                          )}
                        </article>
                      );
                    })}
                  </div>

                  <div className="membership-explainer">
                    <div><span>01</span><h3>Chọn gói phù hợp</h3><p>Giá và đặc quyền rõ ràng trước khi xác nhận.</p></div>
                    <div><span>02</span><h3>Hoàn thành thử thách</h3><p>Xu được tính từ kết quả hợp lệ, trong hạn mức gói.</p></div>
                    <div><span>03</span><h3>Theo dõi trong ví</h3><p>Xem xu đã nhận, lịch sử và tỷ lệ quy đổi.</p></div>
                  </div>
                </section>
              )}

              {page === "wallet" && (
                <WalletPage
                  data={data}
                  available={available}
                  held={held}
                  reload={reload}
                  notify={setToast}
                  navigate={navigate}
                  openRefill={openRefill}
                />
              )}

              {page === "settings" && (
                <SettingsPage
                  lang={lang}
                  onSelectLang={changeLang}
                  soundEnabled={soundEnabled}
                  onToggleSound={(v) => {
                    setSoundEnabled(v);
                    try { localStorage.setItem("jinqp_sfx", String(v)); } catch {}
                  }}
                  bgmEnabled={bgmEnabled}
                  onToggleBgm={(v) => {
                    setBgEnabled(v);
                    try { localStorage.setItem("jinqp_bgm", String(v)); } catch {}
                  }}
                  currencyMode={currencyMode}
                  onSelectCurrency={(c) => {
                    setCurrencyMode(c);
                    try { localStorage.setItem("jinqp_currency", c); } catch {}
                  }}
                  notify={setToast}
                  t={t}
                />
              )}

              {page === "help" && <HelpPage data={data} notify={setToast} reload={reload} />}
            </>
          )}

          <footer>
            <button className="footer-logo" onClick={() => navigate("explore")}>JINQP<span>Gaming Center</span></button>
            <span>{t("footerTagline")}</span>
            <div>
              <button onClick={() => setLegal("terms")}>{t("footerTerms")}</button>
              <button onClick={() => setLegal("privacy")}>{t("footerPrivacy")}</button>
              <button onClick={() => setLegal("compliance")}>{t("footerCompliance")}</button>
              <button onClick={() => navigate("settings")}>{t("navSettings")}</button>
              <button onClick={() => navigate("help")}>{t("footerHelp")}</button>
            </div>
            <small>{t("footerCopyright")}</small>
          </footer>
        </main>
      </div>

      <nav className="mobile-bottom">
        {nav.map(n => (
          <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => navigate(n.id)}>
            <n.icon size={20} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {toast && (
        <div className="toast" role="status">
          <CircleAlert size={18} />
          {toast}
          <button aria-label="Đóng thông báo" onClick={() => setToast("")}><X size={16} /></button>
        </div>
      )}

      {showRefill && (
        <RefillModal
          packages={data?.topupPackages || []}
          onClose={closeRefill}
          reload={reload}
          notify={setToast}
        />
      )}

      {checkout && (
        <Checkout plan={checkout} onClose={closeCheckout} reload={reload} notify={setToast} />
      )}

      {selectedGame && (
        <GamePlayer
          game={selectedGame}
          tournament={activeTournament}
          member={member}
          signedIn={!!viewer}
          reviews={(data?.reviews || []).filter(r => r.game_id === selectedGame.id)}
          onClose={() => { setSelectedGame(null); setActiveTournament(null); }}
          onMembership={() => { setSelectedGame(null); navigate("membership"); }}
          reload={reload}
          notify={setToast}
        />
      )}

      {legal && (
        <Modal
          title={
            legal === "privacy" ? "Quyền riêng tư" :
            legal === "sandbox" ? "Về bản thử nghiệm sandbox" :
            legal === "compliance" ? "Chính sách quốc gia & Pháp lý" :
            "Điều khoản trải nghiệm"
          }
          onClose={() => setLegal("")}
        >
          <div className="legal-content">
            <Shield size={30} />
            <h2>
              {legal === "privacy" ? "Dữ liệu của bạn" :
               legal === "sandbox" ? "Khám phá an tâm trong môi trường sandbox" :
               legal === "compliance" ? "Tuân thủ quy định từng thị trường" :
               "Chơi có trách nhiệm"}
            </h2>
            <p>
              {legal === "compliance"
                ? "Theo Nghị định 147/2024/NĐ-CP (Việt Nam) và các nghiên cứu pháp lý quốc tế, nền tảng phân định rõ giữa điểm trò chơi, nạp số dư thử nghiệm và thi đấu kỹ năng. Tiền thật không mặc định mở tại cả 6 thị trường ban đầu cho đến khi có đầy đủ đánh giá chuyên môn."
                : "JINQP Gaming Center được xây dựng theo mô hình hai server (Người dùng và Quản trị) kết nối kho dữ liệu chung, đảm bảo tính toàn vẹn của sổ cái kép. Mọi hoạt động nạp xu, thi đấu và rút thưởng hiện tại đều vận hành ở chế độ sandbox an toàn."}
            </p>
            <button className="btn lime" onClick={() => setLegal("")}>Đã hiểu <Check size={17} /></button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// REFILL MODAL (Khảo sát Playhop: balance-refill-flow=purchase)
// -------------------------------------------------------------

function RefillModal({ packages, onClose, reload, notify }: {
  packages: TopupPackage[]; onClose: () => void; reload: () => Promise<any>; notify: (s: string) => void;
}) {
  const [selectedPkg, setSelectedPkg] = useState<string>(packages[3]?.id || "topup-750");
  const [customCoins, setCustomCoins] = useState("500");
  const [isCustom, setIsCustom] = useState(false);
  const [method, setMethod] = useState("payoneer");
  const [order, setOrder] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");
  const [done, setDone] = useState(false);
  const requestKey = useRef(crypto.randomUUID());

  const currentPkg = packages.find(p => p.id === selectedPkg);
  const totalCoins = isCustom ? Number(customCoins) : (currentPkg ? currentPkg.coins + currentPkg.bonus : 0);
  const priceCents = isCustom ? Math.round(Number(customCoins) / 10) : (currentPkg?.priceCents || 0);

  useEffect(() => {
    if (order) {
      QRCode.toDataURL(`jinqp-refill:${order.id}:${totalCoins}`, {
        width: 220, margin: 2, color: { dark: "#10131fff", light: "#ffffffff" }
      }).then(setQr).catch(() => setQr(""));
    }
  }, [order, totalCoins]);

  const create = async () => {
    setBusy(true);
    try {
      const res = await action("order.create", {
        planId: isCustom ? "topup-custom" : selectedPkg,
        customCoins: isCustom ? Number(customCoins) : undefined,
        method,
        requestKey: requestKey.current
      });
      setOrder(res);
      await reload();
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    setBusy(true);
    try {
      await action("order.simulate", { id: order.id });
      await reload();
      setDone(true);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Nạp số dư xu (balance-refill-flow=purchase)" onClose={onClose} wide>
      <div className="checkout-body">
        {done ? (
          <div className="success-state">
            <span><CheckCircle2 size={44} /></span>
            <h2>Nạp số dư thành công!</h2>
            <p>+{number(totalCoins)} xu đã được cộng vào tài khoản ví của bạn qua sổ cái kép.</p>
            <button className="btn lime" onClick={onClose}>Tiếp tục khám phá <ArrowRight size={17} /></button>
          </div>
        ) : (
          <>
            <span className="eyebrow" style={{ color: "var(--lime)" }}><Coins size={18} />NẠP SỐ DƯ TỰ DO</span>
            <h2>Chọn gói nạp phù hợp</h2>
            <p style={{ fontSize: "11px", marginBottom: "16px" }}>
              Được thiết kế theo khảo sát Playhop với 6 gói phổ biến và tùy chọn số lượng tự do.
            </p>

            <div className="topup-grid">
              {packages.map(p => (
                <div
                  key={p.id}
                  className={`topup-card ${!isCustom && selectedPkg === p.id ? "selected" : ""}`}
                  onClick={() => { setIsCustom(false); setSelectedPkg(p.id); }}
                >
                  {p.popular && <span className="topup-badge">PHỔ BIẾN</span>}
                  {p.best && <span className="topup-badge" style={{ background: "var(--amber)" }}>TỐT NHẤT</span>}
                  <strong><Coin size={20} />{number(p.coins)} xu</strong>
                  <span className="price">{money(p.priceCents)} <small style={{ color: "var(--muted)", fontWeight: 400 }}>({vndEstimate(p.priceCents)})</small></span>
                  {p.bonus > 0 && <span className="bonus-tag">+{number(p.bonus)} xu thưởng</span>}
                </div>
              ))}
            </div>

            <div className="custom-topup-row">
              <button
                className={`btn ${isCustom ? "lime" : "secondary"} small`}
                type="button"
                onClick={() => setIsCustom(!isCustom)}
              >
                Số lượng khác
              </button>
              {isCustom && (
                <input
                  type="number"
                  min="50"
                  max="100000"
                  step="10"
                  value={customCoins}
                  onChange={e => setCustomCoins(e.target.value)}
                  placeholder="Nhập số xu (50 - 100.000)"
                />
              )}
            </div>

            <div className="checkout-summary">
              <span>Gói đã chọn</span>
              <strong>{isCustom ? `${customCoins} xu tùy chỉnh` : `${number(currentPkg?.coins || 0)} xu (+${currentPkg?.bonus || 0} thưởng)`}</strong>
              <span>Số tiền thanh toán</span>
              <strong style={{ color: "var(--lime)" }}>{money(priceCents)} (~{vndEstimate(priceCents)})</strong>
            </div>

            <div className="method-tabs">
              <button className={method === "payoneer" ? "selected" : ""} disabled={!!order} onClick={() => setMethod("payoneer")}>
                <Link2 size={18} />Ví Payoneer (QR & Link nhận tiền)
              </button>
              <button className={method === "qr" ? "selected" : ""} disabled={!!order} onClick={() => setMethod("qr")}>
                <QrCode size={18} />Mã QR Sandbox
              </button>
            </div>

            {order ? (
              <>
                {method === "payoneer" ? (
                  <div className="payoneer-payment-card">
                    <div className="payoneer-header">
                      <span className="payoneer-badge">CỔNG THANH TOÁN PAYONEER</span>
                      <strong>Quét mã QR hoặc mở liên kết Payoneer để nạp {number(totalCoins)} xu</strong>
                    </div>

                    <div className="payoneer-qr-box">
                      <img src={PAYONEER_QR_IMAGE} alt="Mã QR Payoneer nhận tiền" className="payoneer-qr-img" />
                      <div className="payoneer-qr-meta">
                        <span className="qr-guide">Quét mã QR Payoneer để chuyển {money(priceCents)} (~{vndEstimate(priceCents)})</span>
                        <div className="memo-box">
                          <span>Mã đơn nạp:</span>
                          <code>JINQP-{order.id.slice(0, 8).toUpperCase()}</code>
                        </div>
                      </div>
                    </div>

                    <div className="payoneer-actions">
                      <a
                        href={PAYONEER_RECEIVING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn lime full"
                        style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        <ExternalLink size={18} /> Mở liên kết ví Payoneer để nạp tiền
                      </a>
                      <button
                        type="button"
                        className="btn secondary full"
                        onClick={() => {
                          navigator.clipboard.writeText(PAYONEER_RECEIVING_URL);
                          notify("Đã sao chép liên kết ví nhận tiền Payoneer!");
                        }}
                      >
                        <Copy size={16} /> Sao chép liên kết ví Payoneer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="payment-preview">
                    {qr && <img src={qr} alt="Mã QR nạp số dư" />}
                    <strong>Mã QR Sandbox · Không chuyển tiền thật</strong>
                    <p>Mã chứa định danh đơn #{order.id.slice(0, 8)}. Nhấn xác nhận để mô phỏng hoàn tất.</p>
                  </div>
                )}
                <button className="btn lime full" style={{ marginTop: "14px" }} disabled={busy} onClick={pay}>
                  {busy ? <Spinner /> : <CheckCircle2 size={18} />} Xác nhận đã chuyển tiền / Hoàn tất nạp {number(totalCoins)} xu
                </button>
              </>
            ) : (
              <button className="btn lime full" disabled={busy} onClick={create}>
                {busy ? <Spinner /> : <ArrowRight size={18} />} Tạo đơn nạp · {money(priceCents)}
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------
// CHECKOUT FOR MEMBERSHIPS
// -------------------------------------------------------------

function Checkout({ plan, onClose, reload, notify }: {
  plan: Plan; onClose: () => void; reload: () => Promise<any>; notify: (s: string) => void;
}) {
  const [method, setMethod] = useState("payoneer");
  const [order, setOrder] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");
  const [done, setDone] = useState(false);
  const requestKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (order) {
      QRCode.toDataURL(`jinqp-sandbox:membership:${order.id}`, {
        width: 220, margin: 2, color: { dark: "#10131fff", light: "#ffffffff" }
      }).then(setQr).catch(() => setQr(""));
    }
  }, [order]);

  const create = async () => {
    setBusy(true);
    try {
      setOrder(await action("order.create", {
        planId: plan.id, revision: plan.revision, method, requestKey: requestKey.current
      }));
      await reload();
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    setBusy(true);
    try {
      await action("order.simulate", { id: order.id });
      await reload();
      setDone(true);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Đăng ký thành viên" onClose={onClose}>
      <div className="checkout-body">
        {done ? (
          <div className="success-state">
            <span><CheckCircle2 size={44} /></span>
            <h2>Chào mừng thành viên mới!</h2>
            <p>Gói {tierNames[plan.tier]} · {periods[plan.period]} đã được kích hoạt thử nghiệm.</p>
            <button className="btn lime" onClick={onClose}>Bắt đầu khám phá <ArrowRight size={17} /></button>
          </div>
        ) : (
          <>
            <span className={`checkout-tier ${plan.tier}`}><Crown size={22} />{tierNames[plan.tier]} · Gói {periods[plan.period]}</span>
            <h2>Thêm đặc quyền cho<br />hành trình của bạn.</h2>
            <div className="checkout-summary">
              <span>Thành viên {tierNames[plan.tier]}</span><strong>{money(plan.price_cents)}</strong>
              <span>Hệ số thưởng</span><strong>x{plan.multiplier_bps / 10000}</strong>
              <span>Giới hạn mỗi ngày</span><strong>{number(plan.daily_cap)} xu</strong>
            </div>
            <div className="method-tabs">
              <button className={method === "payoneer" ? "selected" : ""} disabled={!!order} onClick={() => setMethod("payoneer")}>
                <Link2 size={18} />Ví Payoneer (QR & Link)
              </button>
              <button className={method === "qr" ? "selected" : ""} disabled={!!order} onClick={() => setMethod("qr")}>
                <QrCode size={18} />Mã QR Sandbox
              </button>
            </div>
            {order ? (
              <>
                {method === "payoneer" ? (
                  <div className="payoneer-payment-card">
                    <div className="payoneer-header">
                      <span className="payoneer-badge">CỔNG THANH TOÁN PAYONEER</span>
                      <strong>Quét mã QR hoặc mở liên kết Payoneer để đăng ký gói {tierNames[plan.tier]}</strong>
                    </div>

                    <div className="payoneer-qr-box">
                      <img src={PAYONEER_QR_IMAGE} alt="Mã QR Payoneer" className="payoneer-qr-img" />
                      <div className="payoneer-qr-meta">
                        <span className="qr-guide">Quét mã QR để chuyển {money(plan.price_cents)}</span>
                        <div className="memo-box">
                          <span>Mã đơn thành viên:</span>
                          <code>JINQP-MEM-{order.id.slice(0, 8).toUpperCase()}</code>
                        </div>
                      </div>
                    </div>

                    <div className="payoneer-actions">
                      <a
                        href={PAYONEER_RECEIVING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn lime full"
                        style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        <ExternalLink size={18} /> Mở Payoneer thanh toán {money(plan.price_cents)}
                      </a>
                      <button
                        type="button"
                        className="btn secondary full"
                        onClick={() => {
                          navigator.clipboard.writeText(PAYONEER_RECEIVING_URL);
                          notify("Đã sao chép liên kết ví nhận tiền Payoneer!");
                        }}
                      >
                        <Copy size={16} /> Sao chép liên kết Payoneer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="payment-preview">
                    {qr && <img src={qr} alt="Mã QR cho đơn thử nghiệm" />}
                    <strong>QR thử nghiệm · Không chuyển tiền</strong>
                    <p>Mã chứa định danh đơn mô phỏng, không nhận tiền.</p>
                    <code>#{order.id.slice(0, 8).toUpperCase()}</code>
                  </div>
                )}
                <button className="btn lime full" style={{ marginTop: "14px" }} disabled={busy} onClick={pay}>
                  {busy ? <Spinner /> : <CheckCircle2 size={18} />} Xác nhận thanh toán & Kích hoạt thành viên
                </button>
              </>
            ) : (
              <button className="btn lime full" disabled={busy} onClick={create}>
                {busy ? <Spinner /> : <ArrowRight size={18} />} Tạo đơn đăng ký · {money(plan.price_cents)}
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------
// TOURNAMENTS PAGE (Đấu trường thi đấu kỹ năng)
// -------------------------------------------------------------

function TournamentsPage({ tournaments, signedIn, available, onPlayGame, reload, notify, openRefill }: {
  tournaments: Tournament[]; signedIn: boolean; available: number;
  onPlayGame: (t: Tournament) => void; reload: () => Promise<any>;
  notify: (s: string) => void; openRefill: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const join = async (t: Tournament) => {
    if (!signedIn) {
      window.location.href = "/signin-with-chatgpt?return_to=/";
      return;
    }
    if (available < t.entry_fee_coins) {
      notify("Số dư xu không đủ để tham gia. Hãy nạp thêm xu.");
      openRefill();
      return;
    }
    setBusyId(t.id);
    try {
      await action("tournament.join", { tournamentId: t.id });
      await reload();
      notify(`Đã tham gia giải đấu "${t.title}" thành công!`);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="tournaments-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow"><Trophy size={16} />JINQP ARENA</span>
          <h2>Đấu trường kỹ năng trực tuyến<span className="count-badge">{tournaments.length}</span></h2>
        </div>
        <span className="section-caption">Thi đấu công bằng · Kết quả được xác thực server · Chia giải thưởng tự động</span>
      </div>

      <div className="tournament-grid">
        {tournaments.map(t => {
          const joined = !!t.myEntry;
          const played = t.myEntry?.status === "played";

          return (
            <article className="tourney-card" key={t.id}>
              <div className="tourney-header">
                <div>
                  <span className="game-type">{t.game_id.toUpperCase()}</span>
                  <h3 style={{ marginTop: "8px", fontSize: "18px" }}>{t.title}</h3>
                </div>
                <span className="status paid">Còn {timeRemaining(t.end_time)}</span>
              </div>

              <div className="tourney-meta">
                <div>
                  <span>Lệ phí tham gia</span>
                  <strong>{t.entry_fee_coins > 0 ? `${t.entry_fee_coins} xu` : "Miễn phí"}</strong>
                </div>
                <div>
                  <span>Tổng giải thưởng</span>
                  <strong>{number(t.prize_pool_coins)} xu</strong>
                </div>
                <div>
                  <span>Người tham gia</span>
                  <strong>{t.totalEntries} người</strong>
                </div>
              </div>

              <div className="leaderboard-box">
                <h4><Trophy size={14} /> Bảng xếp hạng trực tiếp</h4>
                {t.leaderboard.length > 0 ? (
                  t.leaderboard.slice(0, 3).map((e, idx) => (
                    <div className="leaderboard-row" key={e.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className={`rank-pill ${idx === 0 ? "gold" : idx === 1 ? "silver" : "bronze"}`}>
                          {idx + 1}
                        </span>
                        <span>{e.user_name?.split("@")[0] || "Người chơi"}</span>
                      </div>
                      <strong>{number(e.score)} điểm</strong>
                    </div>
                  ))
                ) : (
                  <p className="muted" style={{ fontSize: "10px", margin: "5px 0" }}>Chưa có điểm số nào được ghi nhận. Hãy là người đầu tiên!</p>
                )}
              </div>

              {joined ? (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button className="btn lime full" onClick={() => onPlayGame(t)}>
                    <Play size={16} fill="currentColor" /> {played ? "Thi đấu lại (Nâng điểm)" : "Vào thi đấu ngay"}
                  </button>
                  {t.myEntry.score > 0 && (
                    <span style={{ fontSize: "11px", color: "var(--lime)", whiteSpace: "nowrap" }}>
                      Điểm của bạn: <strong>{number(t.myEntry.score)}</strong>
                    </span>
                  )}
                </div>
              ) : (
                <button
                  className="btn secondary full"
                  disabled={busyId === t.id}
                  onClick={() => join(t)}
                >
                  {busyId === t.id ? <Spinner /> : <CheckCircle2 size={16} />}
                  Tham gia giải ({t.entry_fee_coins} xu)
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// GAME PLAYER WITH 6 ENGINES, FULLSCREEN, REVIEWS
// -------------------------------------------------------------

function GamePlayer({ game, tournament, member, signedIn, reviews, onClose, onMembership, reload, notify }: {
  game: Game; tournament: Tournament | null; member: any; signedIn: boolean; reviews: Review[];
  onClose: () => void; onMembership: () => void; reload: () => Promise<any>; notify: (s: string) => void;
}) {
  const [session, setSession] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [claimed, setClaimed] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedBlockShape, setSelectedBlockShape] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const symbols = [Leaf, Moon, Sun, Flame, Flower2, Rocket, Diamond, Sparkles];

  useEffect(() => {
    if ((game.id !== "reflex" && game.id !== "orbit") || !session || session.completed) return;
    const t = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(t);
  }, [game.id, session?.id, session?.round, session?.wave, session?.completed]);

  const start = async () => {
    setBusy(true);
    try {
      const s = await action("game.start", { gameId: game.id });
      setSession(s);
      setClaimed(null);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  const move = async (input: any) => {
    if (busy || !session) return;
    setBusy(true);
    try {
      const s = await action("game.action", {
        sessionId: session.id, version: session.version, ...input
      });
      setSession(s);
      setAnswer("");

      // If playing in tournament and completed, submit tournament score
      if (s.completed && tournament) {
        await action("tournament.submit", {
          tournamentId: tournament.id, sessionId: session.id
        });
        await reload();
        notify(`Đã nộp điểm ${s.score} lên bảng xếp hạng giải đấu!`);
      }
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    setBusy(true);
    try {
      const r = await action("game.claim", { sessionId: session.id });
      setClaimed(r.coins);
      await reload();
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setBusy(true);
    try {
      await action("review.create", {
        gameId: game.id, rating: reviewStars, comment: reviewComment
      });
      setReviewComment("");
      await reload();
      notify("Cảm ơn bạn đã đánh giá trò chơi!");
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal wide fullscreen={fullscreen} title={`${game.title} ${tournament ? `(Đang thi đấu: ${tournament.title})` : ""}`} onClose={onClose}>
      <div className="game-modal">
        <div className="game-stage">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span className="game-type">{game.category}</span>
            <button
              className="icon-button"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? "Thu nhỏ màn hình" : "Toàn màn hình"}
            >
              {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>

          {!session ? (
            <div className="game-intro">
              <img src={`/art/${game.art}.svg`} alt="" />
              <h2>{game.title}</h2>
              <p>{game.subtitle}</p>
              {game.engine ? (
                signedIn ? (
                  <button className="btn lime" onClick={start} disabled={busy}>
                    {busy ? <Spinner /> : <Play size={17} fill="currentColor" />}
                    {tournament ? "Bắt đầu lượt thi đấu giải" : "Bắt đầu chơi"}
                  </button>
                ) : (
                  <a className="btn lime" href="/signin-with-chatgpt?return_to=/" target="_top">
                    Đăng nhập để chơi <ArrowUpRight size={17} />
                  </a>
                )
              ) : (
                <span className="coming-soon-label">Đang chuẩn bị · Sắp ra mắt</span>
              )}
            </div>
          ) : session.completed ? (
            <div className="game-result">
              <div className="trophy-circle"><Trophy size={44} /></div>
              <span className="eyebrow subtle">THỬ THÁCH HOÀN THÀNH</span>
              <h2>Làm tốt lắm!</h2>
              <div className="score">{number(session.score)}<span>điểm</span></div>
              {claimed !== null ? (
                <div className="reward-received"><Coin size={24} /> +{number(claimed)} xu thử nghiệm đã vào ví</div>
              ) : member ? (
                <button className="btn lime" disabled={busy} onClick={claim}>
                  {busy ? <Spinner /> : <Coin />} Nhận xu thành viên
                </button>
              ) : (
                <button className="btn lime" onClick={onMembership}>
                  <Crown size={18} /> Khám phá thành viên để tích xu
                </button>
              )}
              <button className="text-button" disabled={busy} onClick={start}><RefreshCw size={15} /> Chơi lại</button>
            </div>
          ) : (
            <>
              <div className="game-scorebar">
                <span>
                  {game.id === "memory" ? `Ghép được ${session.matched.length / 2}/8 cặp` :
                   game.id === "number" ? `Câu hỏi ${session.index + 1}/10` :
                   game.id === "reflex" ? `Lượt phản xạ ${session.round + 1}/5` :
                   game.id === "blocks" ? `Lượt xếp ${session.turn}/6 · Đã xóa ${session.linesCleared} hàng` :
                   game.id === "orbit" ? `Đợt sóng ${session.wave + 1}/8` :
                   `Từ vựng ${session.index + 1}/5`}
                </span>
                <strong>{session.score} điểm</strong>
              </div>

              {/* GAME 1: MEMORY */}
              {game.id === "memory" && (
                <div className="memory-board">
                  {session.cards.map((value: number | null, index: number) => {
                    const Icon = value === null ? Sparkles : symbols[value];
                    return (
                      <button
                        key={index}
                        className={`memory-tile ${value !== null ? "flipped" : ""} ${session.matched.includes(index) ? "matched" : ""}`}
                        aria-label={`Thẻ ${index + 1}`}
                        disabled={busy || session.matched.includes(index)}
                        onClick={() => move({ index })}
                      >
                        <Icon size={29} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* GAME 2: NUMBER */}
              {game.id === "number" && (
                <form className="number-board" onSubmit={e => { e.preventDefault(); if (answer.trim()) move({ answer: Number(answer) }); }}>
                  <span>ĐIỀN ĐÁP ÁN CỦA BẠN</span>
                  <h2>{session.question}<em> = ?</em></h2>
                  <input autoFocus type="number" step="1" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="…" disabled={busy} />
                  <button className="btn lime" disabled={busy || !answer.trim()}>{busy ? <Spinner /> : <>Trả lời <ArrowRight size={17} /></>}</button>
                  <p aria-live="polite">{session.feedback || "Tính nhanh và chính xác."}</p>
                </form>
              )}

              {/* GAME 3: REFLEX */}
              {game.id === "reflex" && (
                <div className="reflex-board">
                  <button className={`reaction-target ${now >= session.goAt ? "go" : ""}`} disabled={busy} onClick={() => move({})}>
                    <Zap size={48} />
                    <strong>{now >= session.goAt ? "CHẠM NGAY!" : "CHỜ TÍN HIỆU"}</strong>
                    <span>{now >= session.goAt ? "Nhanh tay và chính xác" : "Đừng chạm vội…"}</span>
                  </button>
                  <p>{session.feedback}</p>
                </div>
              )}

              {/* GAME 4: BLOCKS DISTRICT */}
              {game.id === "blocks" && (
                <div className="blocks-container">
                  <div className="blocks-grid">
                    {session.board.map((filled: number, idx: number) => {
                      const r = Math.floor(idx / 8);
                      const c = idx % 8;
                      return (
                        <div
                          key={idx}
                          className={`blocks-cell ${filled ? "filled" : ""}`}
                          onClick={() => move({ pieceIndex: selectedBlockShape, row: r, col: c })}
                          title={`Đặt khối vào hàng ${r + 1}, cột ${c + 1}`}
                        />
                      );
                    })}
                  </div>

                  <div className="shapes-rack">
                    {session.currentShapes.map((shape: any[], sIdx: number) => {
                      const isUsed = session.placedIndices.includes(sIdx);
                      return (
                        <div
                          key={sIdx}
                          className={`shape-card ${selectedBlockShape === sIdx ? "active" : ""} ${isUsed ? "used" : ""}`}
                          onClick={() => !isUsed && setSelectedBlockShape(sIdx)}
                        >
                          <div className="shape-mini-grid">
                            {Array.from({ length: 9 }).map((_, i) => {
                              const r = Math.floor(i / 3);
                              const c = i % 3;
                              const isDot = shape.some(([dr, dc]) => dr === r && dc === c);
                              return <div key={i} className={`shape-mini-cell ${isDot ? "dot" : ""}`} />;
                            })}
                          </div>
                          <span style={{ fontSize: "9px", color: isUsed ? "var(--muted)" : "var(--lime)" }}>
                            {isUsed ? "Đã đặt" : `Khối #${sIdx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--violet)", textAlign: "center", margin: 0 }}>
                    {session.feedback}
                  </p>
                </div>
              )}

              {/* GAME 5: ORBIT RUNNER */}
              {game.id === "orbit" && (
                <div className="orbit-arena">
                  <div className="orbit-track-wrap">
                    <div className={`orbit-circle lane-0 ${session.hazardLanes.includes(0) ? "hazard" : ""}`} />
                    <div className={`orbit-circle lane-1 ${session.hazardLanes.includes(1) ? "hazard" : ""}`} />
                    <div className={`orbit-circle lane-2 ${session.hazardLanes.includes(2) ? "hazard" : ""}`} />

                    {/* Ship representation */}
                    <div
                      className="orbit-ship"
                      style={{
                        top: session.lane === 0 ? "85px" : session.lane === 1 ? "50px" : "15px",
                        left: "126px"
                      }}
                    >
                      <Rocket size={16} />
                    </div>
                  </div>

                  <div className="orbit-controls">
                    <button className={`btn ${session.lane === 0 ? "lime" : "secondary"} small`} onClick={() => move({ lane: 0 })}>
                      Quỹ đạo Trong
                    </button>
                    <button className={`btn ${session.lane === 1 ? "lime" : "secondary"} small`} onClick={() => move({ lane: 1 })}>
                      Quỹ đạo Giữa
                    </button>
                    <button className={`btn ${session.lane === 2 ? "lime" : "secondary"} small`} onClick={() => move({ lane: 2 })}>
                      Quỹ đạo Ngoài
                    </button>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--amber)" }}>{session.feedback}</p>
                </div>
              )}

              {/* GAME 6: WORD VOYAGE */}
              {game.id === "word" && (
                <div className="word-box">
                  <span className="eyebrow subtle">GỢI Ý: {session.clue}</span>
                  <div className="scrambled-letters">
                    {session.scrambled.split("").map((char: string, i: number) => (
                      <span className="letter-tile" key={i}>{char}</span>
                    ))}
                  </div>

                  <form className="word-input-form" onSubmit={e => { e.preventDefault(); if (answer.trim()) move({ guess: answer }); }}>
                    <input
                      autoFocus
                      type="text"
                      maxLength={12}
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      placeholder="Nhập từ giải mã…"
                    />
                    <button className="btn lime" disabled={busy || !answer.trim()}>Gửi</button>
                  </form>
                  <p style={{ fontSize: "11px", color: "var(--violet)", marginTop: "12px" }}>{session.feedback}</p>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="game-guide">
          <span className="game-type">{game.category}</span>
          <h3>Cách chơi</h3>
          <p>
            {game.id === "memory" ? "Lật hai thẻ để tìm hình giống nhau. Ghép đủ 8 cặp với ít lượt nhất có thể." :
             game.id === "number" ? "Giải 10 phép tính nhẩm. Điền đáp án rồi nhấn Enter. Mỗi câu đúng cộng điểm." :
             game.id === "reflex" ? "Chờ mục tiêu chuyển xanh rồi chạm thật nhanh. Chạm sớm không đạt." :
             game.id === "blocks" ? "Chọn khối hình và đặt vào ô trống 8x8. Xếp đủ hàng hoặc cột để xóa và ghi điểm combo!" :
             game.id === "orbit" ? "Chuyển làn phi thuyền giữa 3 quỹ đạo để tránh vùng thiên thạch đang cảnh báo." :
             "Sắp xếp lại các chữ cái bị xáo trộn theo gợi ý có sẵn để tìm ra từ chính xác."}
          </p>
          <div className="guide-rule" />
          <Coin size={25} />
          <h3>Thưởng thành tích</h3>
          <p>
            {member
              ? `Thành viên ${tierNames[member.terms.tier]} · hệ số x${member.terms.multiplier_bps / 10000}. Hạn mức ${number(member.terms.daily_cap)} xu/ngày.`
              : "Bạn có thể chơi miễn phí. Cần gói thành viên còn hiệu lực để nhận thưởng xu vào ví."}
          </p>

          {/* REVIEWS SECTION */}
          <div className="reviews-container">
            <h4 style={{ margin: "0 0 10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Star size={14} fill="currentColor" color="var(--amber)" /> Đánh giá từ người chơi ({reviews.length})
            </h4>

            {signedIn && (
              <form onSubmit={submitReview} style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setReviewStars(s)}
                      style={{ padding: 0, color: s <= reviewStars ? "var(--amber)" : "#444" }}
                    >
                      <Star size={16} fill={s <= reviewStars ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <input
                  style={{ fontSize: "11px", padding: "6px 8px" }}
                  placeholder="Viết nhận xét của bạn…"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                />
              </form>
            )}

            <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background: "#161928", padding: "8px 10px", borderRadius: "8px", fontSize: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--amber)", marginBottom: "3px" }}>
                    <strong>{r.user_name}</strong>
                    <span>{"★".repeat(r.rating)}</span>
                  </div>
                  <p style={{ margin: 0, color: "var(--text)" }}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------
// WALLET PAGE WITH P2P TRANSFER
// -------------------------------------------------------------

function WalletPage({ data, available, held, reload, notify, navigate, openRefill }: {
  data: Data | null; available: number; held: number; reload: () => Promise<any>;
  notify: (s: string) => void; navigate: (s: string) => void; openRefill: () => void;
}) {
  const [coins, setCoins] = useState("1000");
  const [recipient, setRecipient] = useState("");
  const [method, setMethod] = useState("qr");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("100");
  const [transferNote, setTransferNote] = useState("");

  const req = useRef(crypto.randomUUID());
  const transferReq = useRef(crypto.randomUUID());

  const amount = Number(coins);
  const valid = Number.isSafeInteger(amount) && amount >= 1000 && amount % 10 === 0;

  const submitPayout = async () => {
    setBusy(true);
    try {
      await action("payout.create", { coins: amount, recipient, method, requestKey: req.current });
      await reload();
      setConfirm(false);
      req.current = crypto.randomUUID();
      notify("Đã tạo yêu cầu rút thử nghiệm. Xu tương ứng đang được giữ.");
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const tCoins = Number(transferAmount);
    if (!Number.isSafeInteger(tCoins) || tCoins < 10) {
      notify("Số xu chuyển tối thiểu là 10 xu.");
      return;
    }
    setBusy(true);
    try {
      await action("transfer.create", {
        recipient: transferTarget, coins: tCoins, note: transferNote, requestKey: transferReq.current
      });
      await reload();
      setShowTransfer(false);
      setTransferTarget("");
      transferReq.current = crypto.randomUUID();
      notify(`Đã chuyển thành công ${number(tCoins)} xu cho ${transferTarget}!`);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="wallet-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow subtle">MỌI THÀNH TÍCH ĐỀU ĐƯỢC GHI NHẬN</span>
          <h1>Ví của tôi<span className="pill">Sandbox</span></h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn lime small" onClick={openRefill}><Coins size={16} /> Nạp số dư</button>
          <button className="btn secondary small" onClick={() => setShowTransfer(true)}><Send size={16} /> Chuyển xu P2P</button>
          <button className="btn secondary small" onClick={() => reload().catch((e: any) => notify(e.message))}><RefreshCw size={16} /> Làm mới</button>
        </div>
      </div>

      <div className="wallet-stats">
        <div className="wallet-primary">
          <span><Wallet size={18} />Xu khả dụng</span>
          <strong><Coin size={32} />{number(available)}<small>xu</small></strong>
          <p>Tương đương ${(available / 1000).toFixed(3)} USD <span>· Tỷ lệ quy đổi: 1.000 xu = 1 USD</span></p>
          <div>
            <span>Sổ cái kép tự động đối soát</span>
            <Shield size={17} />
          </div>
        </div>
        <div className="stat-card">
          <span><Clock3 size={20} />Xu đang giữ</span>
          <strong>{number(held)} <small>xu</small></strong>
          <p>Cho yêu cầu rút đang chờ duyệt</p>
        </div>
        <div className="stat-card">
          <span><Sparkles size={20} />Xu nhận hôm nay</span>
          <strong>{number(data?.user?.earnedToday || 0)} <small>xu</small></strong>
          <p>{data?.user?.membership ? `Hạn mức ${number(data.user.membership.terms.daily_cap)} xu/ngày` : "Gói thành viên mở quyền tích xu"}</p>
        </div>
      </div>

      {/* CỔNG NẠP TIỀN & VÍ NHẬN PAYONEER */}
      <div className="panel payoneer-wallet-banner">
        <div className="payoneer-wallet-header">
          <span className="strip-icon mint"><Coins size={22} /></span>
          <div>
            <h3>Ví nhận tiền & Cổng nạp xu Payoneer</h3>
            <p>Quét mã QR hoặc truy cập liên kết Payoneer bên dưới để nạp tiền vào ví nhận JINQP Gaming Center (Tỷ lệ quy đổi: 1 USD = 1.000 xu).</p>
          </div>
        </div>
        <div className="payoneer-wallet-body">
          <div className="payoneer-wallet-qr">
            <img src={PAYONEER_QR_IMAGE} alt="Mã QR ví nhận Payoneer" />
            <span>Quét mã QR Payoneer</span>
          </div>
          <div className="payoneer-wallet-details">
            <div className="payoneer-link-field">
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#a4adc9" }}>Liên kết ví nhận tiền Payoneer:</label>
              <div className="copy-input-row">
                <input readOnly value={PAYONEER_RECEIVING_URL} />
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => {
                    navigator.clipboard.writeText(PAYONEER_RECEIVING_URL);
                    notify("Đã sao chép liên kết ví nhận tiền Payoneer!");
                  }}
                >
                  <Copy size={14} /> Chép
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              <a
                href={PAYONEER_RECEIVING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn lime small"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <ExternalLink size={14} /> Mở cổng Payoneer
              </a>
              <button className="btn secondary small" onClick={openRefill}>
                <Coins size={14} /> Tạo đơn nạp xu
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="wallet-columns">
        <div className="panel convert-panel">
          <span className="eyebrow subtle">TỪ XU ĐẾN GIÁ TRỊ</span>
          <h2>Quy đổi & yêu cầu rút</h2>
          <p>Kiểm tra số xu và thông tin nhận trước khi gửi.</p>
          <label>Số xu quy đổi
            <div className="input-with-unit">
              <input type="number" min="1000" step="10" value={coins} onChange={e => setCoins(e.target.value)} aria-label="Số xu quy đổi" />
              <span>xu</span>
            </div>
          </label>
          <div className="conversion-result">
            <span>Số tiền tương đương</span>
            <strong>{Number.isFinite(amount) ? money(Math.floor(amount / 10)) : "$0.00"}<small>USD</small></strong>
            <span>1.000 xu = 1 USD · Phí thử nghiệm: $0</span>
          </div>
          <div className="method-tabs">
            <button className={method === "qr" ? "selected" : ""} onClick={() => setMethod("qr")}><QrCode size={17} />Nhận qua QR</button>
            <button className={method === "link" ? "selected" : ""} onClick={() => setMethod("link")}><Link2 size={17} />Link ví Payoneer</button>
          </div>
          <label>Link nhận tiền Payoneer
            <input type="url" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="https://…payoneer.com/…" />
          </label>
          <p className="field-hint">Chỉ dùng link thử nghiệm; không nhập OTP hay mật khẩu.</p>
          <button className="btn lime full" disabled={!data?.user || !valid || !recipient || amount > available} onClick={() => setConfirm(true)}>
            Xem lại yêu cầu rút <ArrowRight size={17} />
          </button>
        </div>

        <div>
          <div className="panel membership-wallet">
            <Crown size={26} />
            <h3>{data?.user?.membership ? `Thành viên ${tierNames[data.user.membership.terms.tier]}` : "Bắt đầu hành trình tích xu"}</h3>
            <p>{data?.user?.membership ? `Hiệu lực đến ${date(data.user.membership.ends_at)}. Hoàn thành game để nhận xu trong hạn mức.` : "Chọn gói Đồng, Vàng hoặc Kim Cương để tích xu từ kết quả chơi hợp lệ."}</p>
            <button className="btn secondary full" onClick={() => navigate("membership")}>Xem đặc quyền <ArrowUpRight size={16} /></button>
          </div>

          <div className="panel">
            <h3>Lịch sử chuyển xu P2P</h3>
            {data?.user?.transfers?.length ? (
              data.user.transfers.map((t: any) => {
                const isSender = t.sender_id === data?.user?.id;
                return (
                  <div className="history-row" key={t.id}>
                    <span className="history-icon" style={{ color: isSender ? "var(--amber)" : "var(--mint)" }}>
                      {isSender ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </span>
                    <div>
                      <strong>{isSender ? `Chuyển tới ${t.recipient_email}` : `Nhận từ ${t.sender_name || "Bạn bè"}`}</strong>
                      <span>{date(t.created_at)} · #{t.id.slice(0, 6)} {t.note && `(${t.note})`}</span>
                    </div>
                    <strong className={isSender ? "" : "positive"}>
                      {isSender ? "-" : "+"}{number(t.coins)} xu
                    </strong>
                  </div>
                );
              })
            ) : (
              <div className="empty-small"><Send size={26} /><p>Chưa có giao dịch chuyển xu.</p></div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading compact">
          <h2>Giao dịch sổ cái gần đây</h2>
          <span className="muted">50 bút toán gần nhất đối soát tự động</span>
        </div>
        {data?.user?.history?.length ? (
          data.user.history.map((h: any) => (
            <div className="history-row" key={h.id}>
              <span className="history-icon"><Coin /></span>
              <div>
                <strong>{names[h.reason] || h.reason}</strong>
                <span>{date(h.created_at)} · #{h.id.slice(0, 8)}</span>
              </div>
              <strong className={h.delta > 0 ? "positive" : ""}>
                {h.delta > 0 ? "+" : ""}{number(h.delta)} xu
              </strong>
            </div>
          ))
        ) : (
          <div className="empty-small"><Clock3 size={26} /><p>Lịch sử sẽ xuất hiện khi có giao dịch.</p></div>
        )}
      </div>

      {showTransfer && (
        <Modal title="Chuyển xu cho bạn bè (P2P Transfer)" onClose={() => setShowTransfer(false)}>
          <form className="checkout-body" onSubmit={submitTransfer}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}><Send size={16} />CHUYỂN XU TỨC THÌ</span>
            <h2>Chuyển xu an toàn</h2>
            <p style={{ fontSize: "11px", marginBottom: "18px" }}>
              Chuyển xu trực tiếp cho tài khoản khác trên nền tảng với bút toán sổ cái kép tức thì.
            </p>
            <label>Email hoặc ID người nhận
              <input
                required
                type="text"
                placeholder="nguoidung@example.com"
                value={transferTarget}
                onChange={e => setTransferTarget(e.target.value)}
              />
            </label>
            <label style={{ marginTop: "14px" }}>Số xu muốn chuyển
              <input
                required
                type="number"
                min="10"
                max={available}
                step="10"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
              />
            </label>
            <label style={{ marginTop: "14px" }}>Lời nhắn (tùy chọn)
              <input
                type="text"
                maxLength={100}
                placeholder="Tặng bạn ván chơi vui vẻ…"
                value={transferNote}
                onChange={e => setTransferNote(e.target.value)}
              />
            </label>
            <div className="checkout-summary" style={{ marginTop: "16px" }}>
              <span>Số xu chuyển</span>
              <strong>{number(Number(transferAmount))} xu</strong>
              <span>Phí giao dịch</span>
              <strong style={{ color: "var(--lime)" }}>0 xu</strong>
            </div>
            <button className="btn lime full" type="submit" disabled={busy || Number(transferAmount) > available || !transferTarget}>
              {busy ? <Spinner /> : <Send size={16} />} Xác nhận chuyển xu
            </button>
          </form>
        </Modal>
      )}

      {confirm && (
        <Modal title="Xác nhận yêu cầu rút thử nghiệm" onClose={() => setConfirm(false)}>
          <div className="checkout-body">
            <h2>Kiểm tra thông tin một lần nữa.</h2>
            <div className="checkout-summary">
              <span>Số xu được giữ</span><strong>{number(amount)} xu</strong>
              <span>Tương đương</span><strong>{money(amount / 10)}</strong>
              <span>Phí thử nghiệm</span><strong>$0</strong>
            </div>
            <p className="recipient-preview">Ví nhận: {recipient}</p>
            <p className="info-note">Xu sẽ chuyển sang trạng thái đang giữ. Đây là yêu cầu thử nghiệm, không tạo lệnh chi tiền thật.</p>
            <button className="btn lime full" onClick={submitPayout} disabled={busy}>
              {busy ? <Spinner /> : <CheckCircle2 size={18} />}Xác nhận gửi yêu cầu
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

// -------------------------------------------------------------
// HELP PAGE
// -------------------------------------------------------------

function HelpPage({ data, notify, reload }: {
  data: Data | null; notify: (s: string) => void; reload: () => Promise<any>;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await action("ticket.create", { subject, message });
      setSubject("");
      setMessage("");
      await reload();
      notify("Đã gửi yêu cầu hỗ trợ.");
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="help-page">
      <div className="center-heading">
        <span className="eyebrow">JINQP CARE</span>
        <h1>Chúng tôi ở đây.</h1>
        <p>Mọi câu hỏi đều có một nơi để bắt đầu.</p>
      </div>

      <div className="help-columns">
        <div className="panel">
          <h2>Câu hỏi thường gặp</h2>
          {[
            ["Tôi có thể chơi game miễn phí không?", "Có. Cả 6 tựa game đều có engine playable trên trình duyệt và bạn có thể chơi rèn luyện kỹ năng bất cứ lúc nào."],
            ["Làm sao để tham gia đấu trường kỹ năng?", "Truy cập mục 'Đấu trường', chọn giải đấu và nhấn 'Tham gia giải'. Lệ phí tham gia sẽ được trích từ số dư xu khả dụng."],
            ["Quy tắc chuyển xu P2P là gì?", "Bạn có thể chuyển xu cho bất kỳ người chơi nào qua email hoặc mã tài khoản của họ. Bút toán sổ cái kép đảm bảo giao dịch diễn ra nguyên tử."],
            ["Xu được tính và quy đổi thế nào?", "Tỷ lệ chuẩn sandbox là 1.000 xu = 1 USD. Yêu cầu rút tối thiểu là 1.000 xu."],
            ["Nền tảng tuân thủ quy định pháp lý ra sao?", "Tại Việt Nam, nền tảng tuân thủ hướng dẫn Nghị định 147/2024/NĐ-CP; các tính năng thi đấu tiền thật chỉ thẩm định mở tại các thị trường đủ điều kiện như Đan Mạch, Thụy Điển, Great Britain, Estonia, Malta."]
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}<ChevronRight size={16} /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>

        <form className="panel support-form" onSubmit={submit}>
          <Send size={26} />
          <h2>Gửi lời nhắn cho JINQP</h2>
          <label>Chủ đề
            <input value={subject} onChange={e => setSubject(e.target.value)} minLength={3} maxLength={120} required placeholder="Bạn cần hỗ trợ về…" />
          </label>
          <label>Nội dung
            <textarea value={message} onChange={e => setMessage(e.target.value)} minLength={10} maxLength={2000} required rows={5} placeholder="Chia sẻ thêm để chúng tôi hiểu rõ hơn…" />
          </label>
          <button className="btn lime full" disabled={busy || !data?.user}>
            {busy ? <Spinner /> : <Send size={17} />} Gửi yêu cầu
          </button>
        </form>
      </div>

      {data?.user?.tickets?.length > 0 && (
        <div className="panel">
          <h2>Yêu cầu của bạn</h2>
          {data.user.tickets.map((t: any) => (
            <div className="ticket" key={t.id}>
              <div>
                <strong>{t.subject}</strong>
                <span className={`status ${t.status}`}>{statusNames[t.status] || t.status}</span>
              </div>
              <p>{t.message}</p>
              {t.reply && <blockquote>{t.reply}</blockquote>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------
// SETTINGS PAGE (Cài đặt ngôn ngữ, âm thanh & hệ thống)
// -------------------------------------------------------------
function SettingsPage({
  lang,
  onSelectLang,
  soundEnabled,
  onToggleSound,
  bgmEnabled,
  onToggleBgm,
  currencyMode,
  onSelectCurrency,
  notify,
  t,
}: {
  lang: Locale;
  onSelectLang: (l: Locale) => void;
  soundEnabled: boolean;
  onToggleSound: (v: boolean) => void;
  bgmEnabled: boolean;
  onToggleBgm: (v: boolean) => void;
  currencyMode: "vnd" | "usd";
  onSelectCurrency: (c: "vnd" | "usd") => void;
  notify: (s: string) => void;
  t: (k: TranslationKey) => string;
}) {
  return (
    <section className="settings-page">
      <div className="center-heading">
        <span className="eyebrow">JINQP SETTINGS</span>
        <h1>{t("settingsTitle")}</h1>
        <p>{t("settingsSubtitle")}</p>
      </div>

      <div className="settings-section">
        <div className="settings-section-head">
          <h2><Globe size={18} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8, color: "var(--lime)" }} />{t("langSectionTitle")}</h2>
          <p>{t("langSectionDesc")}</p>
        </div>

        <div className="lang-grid">
          {SUPPORTED_LANGUAGES.map(item => {
            const isCurrent = item.code === lang;
            return (
              <button
                key={item.code}
                className={`lang-card ${isCurrent ? "active" : ""}`}
                onClick={() => {
                  onSelectLang(item.code);
                  notify(t("savedNotice"));
                }}
              >
                <span className="lang-card-flag">{item.flag}</span>
                <div className="lang-card-info">
                  <div className="lang-card-title">{item.name}</div>
                  <div className="lang-card-sub">{item.region} · {item.englishName}</div>
                  {isCurrent && <span className="lang-card-badge">{t("activeLang")}</span>}
                </div>
                {isCurrent && <Check size={18} className="lang-check" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-head">
          <h2><Volume2 size={18} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8, color: "var(--violet)" }} />{t("audioSectionTitle")}</h2>
          <p>{t("audioSectionDesc")}</p>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <strong>{t("sfxLabel")}</strong>
            <span>{t("sfxDesc")}</span>
          </div>
          <button
            className={`toggle-btn ${soundEnabled ? "on" : ""}`}
            onClick={() => {
              onToggleSound(!soundEnabled);
              notify(t("savedNotice"));
            }}
          >
            {soundEnabled ? "Bật (ON)" : "Tắt (OFF)"}
          </button>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <strong>{t("bgmLabel")}</strong>
            <span>{t("bgmDesc")}</span>
          </div>
          <button
            className={`toggle-btn ${bgmEnabled ? "on" : ""}`}
            onClick={() => {
              onToggleBgm(!bgmEnabled);
              notify(t("savedNotice"));
            }}
          >
            {bgmEnabled ? "Bật (ON)" : "Tắt (OFF)"}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-head">
          <h2><Coins size={18} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8, color: "var(--amber)" }} />{t("displaySectionTitle")}</h2>
          <p>{t("displaySectionDesc")}</p>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <strong>{t("currencyLabel")}</strong>
            <span>{t("currencyDesc")}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`toggle-btn ${currencyMode === "vnd" ? "on" : ""}`}
              onClick={() => {
                onSelectCurrency("vnd");
                notify(t("savedNotice"));
              }}
            >
              VND (₫)
            </button>
            <button
              className={`toggle-btn ${currencyMode === "usd" ? "on" : ""}`}
              onClick={() => {
                onSelectCurrency("usd");
                notify(t("savedNotice"));
              }}
            >
              USD ($)
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section" style={{ background: "#10131e" }}>
        <div className="settings-section-head">
          <h2><ShieldCheck size={18} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8, color: "var(--mint)" }} />{t("systemInfoTitle")}</h2>
          <p style={{ marginTop: 6, lineHeight: 1.8 }}>
            {t("platformVersion")}<br />
            {t("systemArch")}
          </p>
        </div>
      </div>
    </section>
  );
}
