"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Search, Gamepad2, Compass, Heart, Wallet, Crown, Gem, Shield,
  ArrowUpRight, ArrowRight, ArrowLeft, Play, Check, X, Sparkles, Zap,
  Clock3, Bell, ChevronRight, HelpCircle, LogOut, Coins, Copy, RefreshCw,
  Send, Link2, QrCode, CheckCircle2, Menu, LoaderCircle, CircleAlert,
  Trophy, Leaf, Moon, Sun, Flame, Flower2, Rocket, Diamond, Maximize2,
  Minimize2, Star, Users, ArrowDownLeft, ShieldCheck, Tag, Globe, Settings, Volume2, VolumeX, ExternalLink,
  Gift, Mail, User, Lock, Award, KeyRound, LogIn, UserPlus
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

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("jinqp_user");
    if (raw) return { "x-jinqp-user": encodeURIComponent(raw) };
  } catch {}
  return {};
}

let activeFetchPromise: Promise<any> | null = null;
async function fetchArcadeData(): Promise<any> {
  if (activeFetchPromise) return activeFetchPromise;
  activeFetchPromise = (async () => {
    try {
      const r = await fetch("/api/arcade", {
        cache: "no-store",
        headers: {
          ...getAuthHeader()
        }
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Không thể tải dữ liệu.");
      return d;
    } finally {
      activeFetchPromise = null;
    }
  })();
  return activeFetchPromise;
}

async function action(name: string, input: unknown = {}) {
  const r = await fetch("/api/arcade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader()
    },
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

  // New features: Auth, Giftcodes, Levels, Inbox
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);
  const [showGiftcodeModal, setShowGiftcodeModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);

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
    try {
      const d = await fetchArcadeData();
      setData(d);
      setError("");
      return d;
    } catch (e: any) {
      setError(e.message || "Không thể tải dữ liệu.");
      throw e;
    }
  };

  // Synchronize URL Hash with pages, modals, and games (Router)
  const syncHashToState = () => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (!hash) return;
    const parts = hash.split("/");
    const root = parts[0];
    const subId = parts[1];

    if (root === "login") {
      setAuthModal("login");
    } else if (root === "signup") {
      setAuthModal("signup");
    } else if (root === "giftcode") {
      setShowGiftcodeModal(true);
    } else if (root === "level") {
      setShowLevelModal(true);
    } else if (root === "inbox") {
      setShowInboxModal(true);
    } else if (root === "game" && subId && data?.games) {
      const g = data.games.find(x => x.id === subId);
      if (g) setSelectedGame(g);
    } else if (root === "tournaments" && subId && data?.tournaments) {
      setPage("tournaments");
      const tr = data.tournaments.find(x => x.id === subId);
      if (tr) {
        setActiveTournament(tr);
        const g = data?.games.find(x => x.id === tr.game_id);
        if (g) setSelectedGame(g);
      }
    } else if (["explore", "tournaments", "favorites", "wallet", "membership", "settings", "help"].includes(root)) {
      setPage(root);
      if (root !== "tournaments") setActiveTournament(null);
    }
  };

  useEffect(() => {
    const onHashChange = () => syncHashToState();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [data]);

  useEffect(() => {
    if (data) syncHashToState();
  }, [data]);

  // 30s Game Heartbeat: records gameplay time for level progression
  useEffect(() => {
    if (!selectedGame || !data?.user) return;
    const timer = setInterval(async () => {
      try {
        const lvlRes = await action("game.heartbeat", { seconds: 30 });
        if (lvlRes && data?.user) {
          setData(prev => {
            if (!prev || !prev.user) return prev;
            return {
              ...prev,
              user: {
                ...prev.user,
                level: lvlRes.level,
                levelInfo: lvlRes
              }
            };
          });
        }
      } catch {}
    }, 30000);
    return () => clearInterval(timer);
  }, [selectedGame, !!data?.user]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthModal(mode);
    window.location.hash = `#/${mode}`;
  };

  const closeAuth = () => {
    setAuthModal(null);
    window.location.hash = `#/${page}`;
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("jinqp_user");
    } catch {}
    setToast("Đã đăng xuất tài khoản.");
    await reload();
  };

  const openGame = (g: Game) => {
    setSelectedGame(g);
    window.location.hash = `#/game/${g.id}`;
  };

  const closeGame = () => {
    setSelectedGame(null);
    setActiveTournament(null);
    window.location.hash = `#/${page}`;
  };

  const openTournament = (t: Tournament) => {
    setActiveTournament(t);
    const g = data?.games.find(x => x.id === t.game_id);
    if (g) setSelectedGame(g);
    window.location.hash = `#/tournaments/${t.id}`;
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
    window.location.hash = `#/${p}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openRefill = () => {
    if (!viewer && !data?.user) {
      openAuth("login");
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
    if (!viewer && !data?.user) {
      openAuth("login");
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
    if (!viewer && !data?.user) {
      setToast("Đăng nhập để lưu game yêu thích.");
      openAuth("login");
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
            [t("catAction"), "↗", "Hành động"],
            [t("catReflex"), "ϟ", "Phản xạ"],
            [t("catPuzzle"), "🧩", "Giải đố"],
            [t("catRacing"), "🏎", "Đua xe"],
            [t("catSpace"), "🚀", "Không gian"],
            [t("catBlocks"), "▦", "Xếp hình"]
          ].map(([label, s, c]) => (
            <button key={c} className={`nav-item ${category === c ? "active" : ""}`} onClick={() => { navigate("explore"); setCategory(c); }}>
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
            <span className="avatar">{(data?.user?.name || viewer?.name || "J").slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{data?.user?.name || data?.user?.email?.split("@")[0] || viewer?.name?.split("@")[0] || t("guestPlayer")}</strong>
              <span>{data?.user ? `Lv. ${data.user.level || 1} · ${member ? tierNames[member.terms.tier] : "Người chơi"}` : t("welcomeToJinqp")}</span>
            </div>
            {data?.user || viewer ? (
              <button
                className="icon-button"
                onClick={handleLogout}
                title="Đăng xuất"
                style={{ background: "none", border: "none", color: "#8b94ac", cursor: "pointer", padding: "6px" }}
              >
                <LogOut size={17} />
              </button>
            ) : (
              <button
                className="icon-button"
                onClick={() => openAuth("login")}
                title="Đăng nhập"
                style={{ background: "none", border: "none", color: "var(--lime)", cursor: "pointer", padding: "6px" }}
              >
                <LogIn size={18} />
              </button>
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

            <button
              className="giftcode-btn-top"
              onClick={() => {
                if (!data?.user && !viewer) {
                  openAuth("login");
                } else {
                  setShowGiftcodeModal(true);
                  window.location.hash = "#/giftcode";
                }
              }}
              title="Nhập mã quà tặng"
            >
              <Gift size={15} />
              <span>Mã quà</span>
            </button>

            {data?.user && (
              <button
                className="level-badge-pill"
                onClick={() => { setShowLevelModal(true); window.location.hash = "#/level"; }}
                title="Xem chi tiết cấp độ tài khoản"
              >
                <Award size={15} />
                <span>Lv. {data.user.level || 1}</span>
                <span className="level-pct">({data.user.levelInfo?.progressPercent || 0}%)</span>
              </button>
            )}

            <button className="balance-button" onClick={openRefill} title={t("refillBalance")}>
              <Coin /><strong>{number(available)}</strong><span>{t("coins")}</span>
              <span className="balance-plus">+</span>
            </button>

            {data?.user ? (
              <>
                <button
                  className="icon-button"
                  style={{ position: "relative" }}
                  aria-label="Hộp thư"
                  onClick={() => { setShowInboxModal(true); window.location.hash = "#/inbox"; }}
                  title="Hộp thư thông báo"
                >
                  <Mail size={19} />
                  {(data.user.unreadNotificationsCount || 0) > 0 && (
                    <span className="notif-badge">{data.user.unreadNotificationsCount}</span>
                  )}
                </button>
                <button
                  className="icon-button logout-btn"
                  onClick={handleLogout}
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="topbar-auth-group">
                <button className="btn secondary small" onClick={() => openAuth("login")}>
                  <LogIn size={15} /> Đăng nhập
                </button>
                <button className="btn lime small" onClick={() => openAuth("signup")}>
                  <UserPlus size={15} /> Đăng ký
                </button>
              </div>
            )}
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
                        [t("catAction"), "Hành động"],
                        [t("catReflex"), "Phản xạ"],
                        [t("catPuzzle"), "Giải đố"],
                        [t("catRacing"), "Đua xe"],
                        [t("catSpace"), "Không gian"],
                        [t("catBlocks"), "Xếp hình"]
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
                              <button className="cover-button" onClick={() => openGame(g)} aria-label={`Xem ${g.title}`}>
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
                                <h3><button onClick={() => openGame(g)}>{g.title}</button></h3>
                                <span>{g.category} <i /> ★ {avgRating} ({reviews.length || 1})</span>
                              </div>
                              <button className="game-arrow" onClick={() => openGame(g)} aria-label={`Mở ${g.title}`}>
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
                  signedIn={!!viewer || !!data?.user}
                  available={available}
                  onPlayGame={(t) => openTournament(t)}
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
                  data={data}
                  reload={reload}
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
          signedIn={!!viewer || !!data?.user}
          reviews={(data?.reviews || []).filter(r => r.game_id === selectedGame.id)}
          onClose={closeGame}
          onMembership={() => { setSelectedGame(null); navigate("membership"); }}
          reload={reload}
          notify={setToast}
        />
      )}

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={closeAuth}
          onSuccess={() => reload()}
          notify={setToast}
        />
      )}

      {showGiftcodeModal && (
        <GiftcodeModal
          onClose={() => { setShowGiftcodeModal(false); window.location.hash = `#/${page}`; }}
          reload={reload}
          notify={setToast}
        />
      )}

      {showLevelModal && (
        <LevelModal
          user={data?.user}
          onClose={() => { setShowLevelModal(false); window.location.hash = `#/${page}`; }}
          openRefill={openRefill}
        />
      )}

      {showInboxModal && (
        <InboxModal
          user={data?.user}
          onClose={() => { setShowInboxModal(false); window.location.hash = `#/${page}`; }}
          reload={reload}
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
// AUTH MODAL (Đăng nhập / Đăng ký người chơi)
// -------------------------------------------------------------

function AuthModal({
  mode,
  onClose,
  onSuccess,
  notify
}: {
  mode: "login" | "signup";
  onClose: () => void;
  onSuccess: (user: any) => void;
  notify: (msg: string) => void;
}) {
  const [tab, setTab] = useState<"login" | "signup">(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    if (tab === "signup") {
      if (password.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    setBusy(true);
    try {
      if (tab === "login") {
        const res = await action("auth.signin", { email: email.trim(), password });
        const userObj = res?.user || res;
        if (userObj && (userObj.id || userObj.userId)) {
          const session = {
            userId: userObj.userId || userObj.id,
            id: userObj.id || userObj.userId,
            email: userObj.email,
            name: userObj.name || userObj.email?.split("@")[0]
          };
          localStorage.setItem("jinqp_user", JSON.stringify(session));
          notify(`Chào mừng ${session.name} đã đăng nhập thành công!`);
          onSuccess(session);
          onClose();
        } else {
          throw new Error("Không thể xác thực thông tin đăng nhập.");
        }
      } else {
        const res = await action("auth.signup", {
          name: name.trim() || email.trim().split("@")[0],
          email: email.trim(),
          password
        });
        const userObj = res?.user || res;
        if (userObj && (userObj.id || userObj.userId)) {
          const session = {
            userId: userObj.userId || userObj.id,
            id: userObj.id || userObj.userId,
            email: userObj.email,
            name: userObj.name || userObj.email?.split("@")[0]
          };
          localStorage.setItem("jinqp_user", JSON.stringify(session));
          notify(`Tạo tài khoản thành công! Chào mừng ${session.name}!`);
          onSuccess(session);
          onClose();
        } else {
          throw new Error("Không thể tạo tài khoản.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Thao tác không thành công.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={tab === "login" ? "Đăng nhập tài khoản JINQP" : "Đăng ký thành viên mới"} onClose={onClose}>
      <div className="checkout-body">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            <LogIn size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
            Đăng nhập
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setError(""); }}
          >
            <UserPlus size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
            Đăng ký
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: "14px" }}>
            <CircleAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === "signup" && (
            <label>
              Họ tên hiển thị:
              <input
                type="text"
                placeholder="Ví dụ: Hoàng Long, Alex..."
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </label>
          )}

          <label>
            Địa chỉ Email:
            <input
              type="email"
              required
              placeholder="ten@vidu.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus={tab === "login"}
            />
          </label>

          <label>
            Mật khẩu:
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>

          {tab === "signup" && (
            <label>
              Xác nhận mật khẩu:
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </label>
          )}

          <button type="submit" className="btn lime full" disabled={busy} style={{ marginTop: "10px" }}>
            {busy ? <Spinner /> : tab === "login" ? "Đăng nhập ngay" : "Tạo tài khoản"}
          </button>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#8b94ac", margin: "6px 0 0 0" }}>
            {tab === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button
              type="button"
              style={{ background: "none", border: "none", color: "var(--lime)", cursor: "pointer", fontWeight: "700" }}
              onClick={() => { setTab(tab === "login" ? "signup" : "login"); setError(""); }}
            >
              {tab === "login" ? "Đăng ký tại đây" : "Đăng nhập ngay"}
            </button>
          </p>
        </form>
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------
// GIFTCODE MODAL (Nhập mã nhận xu)
// -------------------------------------------------------------

function GiftcodeModal({
  onClose,
  reload,
  notify
}: {
  onClose: () => void;
  reload: () => Promise<any>;
  notify: (msg: string) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reward, setReward] = useState<number | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Vui lòng nhập mã quà tặng.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await action("giftcode.redeem", { code: code.trim() });
      setReward(res.coins);
      notify(`🎉 Chúc mừng bạn đã nhận +${number(res.coins)} xu!`);
      await reload();
    } catch (err: any) {
      setError(err.message || "Không thể sử dụng mã quà tặng.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="🎁 Nhận xu qua Mã Quà Tặng (Giftcode)" onClose={onClose}>
      <div className="checkout-body">
        {reward !== null ? (
          <div className="success-state" style={{ textAlign: "center", padding: "20px 0" }}>
            <span style={{ fontSize: "52px", display: "block", marginBottom: "12px" }}>🎉</span>
            <h2 style={{ color: "#ebff00", marginBottom: "8px" }}>Nhận thưởng thành công!</h2>
            <p style={{ color: "#c5ccdf", fontSize: "14px", marginBottom: "16px" }}>
              Tài khoản của bạn đã được cộng <strong>+{number(reward)} xu</strong> vào ví khả dụng.
            </p>
            <button className="btn lime full" onClick={onClose}>Tiếp tục chơi game</button>
          </div>
        ) : (
          <form onSubmit={handleRedeem} className="auth-form">
            <p style={{ fontSize: "13px", color: "#a4adc9", marginBottom: "6px" }}>
              Nhập mã giftcode tri ân người chơi của JINQP Gaming Center để nhận xu miễn phí vào tài khoản.
            </p>

            {error && (
              <div className="error-banner">
                <CircleAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <label>
              Mã Giftcode:
              <input
                type="text"
                placeholder="Ví dụ: JINQP2026, GAMINGCENTER..."
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}
                autoFocus
              />
            </label>

            <button type="submit" className="btn lime full" disabled={busy} style={{ marginTop: "10px" }}>
              {busy ? <Spinner /> : "Đổi thưởng ngay"}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------
// LEVEL MODAL (Tiến trình Cấp độ người dùng)
// -------------------------------------------------------------

function LevelModal({
  user,
  onClose,
  openRefill
}: {
  user: any;
  onClose: () => void;
  openRefill: () => void;
}) {
  const lvlInfo = user?.levelInfo || {
    level: user?.level || 1,
    hoursPlayed: 0,
    progressPercent: 0,
    totalCoinsBought: 0,
    blockedAtCheckpoint: null,
    neededCoins: 0,
    canWithdraw: false,
    maxWithdrawalUsd: 0
  };

  return (
    <Modal title="⭐ Tiến trình Cấp độ tài khoản" onClose={onClose}>
      <div className="checkout-body">
        <div className="level-card-main">
          <span style={{ fontSize: "12px", color: "#8b94ac", textTransform: "uppercase", letterSpacing: "1.5px" }}>CẤP ĐỘ HIỆN TẠI</span>
          <div className="level-num">CẤP {lvlInfo.level}</div>

          <div className="level-progress-bar">
            <div className="level-progress-fill" style={{ width: `${lvlInfo.progressPercent}%` }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8b94ac", marginTop: "4px" }}>
            <span>Tiến trình cấp kế tiếp</span>
            <strong style={{ color: "#ebff00" }}>{lvlInfo.progressPercent}%</strong>
          </div>
        </div>

        <div className="level-stats-row">
          <div className="level-stat-box">
            <span>Thời gian chơi</span>
            <strong>{lvlInfo.hoursPlayed} giờ</strong>
          </div>
          <div className="level-stat-box">
            <span>Tổng xu đã nạp</span>
            <strong>{number(lvlInfo.totalCoinsBought)} xu</strong>
          </div>
        </div>

        {lvlInfo.blockedAtCheckpoint && (
          <div style={{ background: "rgba(255, 170, 0, 0.12)", border: "1px solid rgba(255, 170, 0, 0.4)", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <Lock size={20} style={{ color: "#ffaa00", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ color: "#ffaa00", fontSize: "13px", display: "block", marginBottom: "4px" }}>
                  Đang dừng tại Cột mốc Cấp {lvlInfo.blockedAtCheckpoint}
                </strong>
                <p style={{ fontSize: "12px", color: "#d2d8e8", margin: 0 }}>
                  Để mở khóa tiến trình cấp độ tiếp theo, bạn cần tích lũy thêm <strong>{number(lvlInfo.neededCoins)} xu</strong> từ nạp số dư.
                </p>
                <button className="btn lime small" style={{ marginTop: "10px" }} onClick={() => { onClose(); openRefill(); }}>
                  <Coins size={14} /> Nạp số dư mở khóa
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: "#101524", border: "1px solid #1f273d", borderRadius: "10px", padding: "14px" }}>
          <strong style={{ fontSize: "13px", color: "#fff", display: "block", marginBottom: "6px" }}>Quy tắc tăng cấp</strong>
          <ul style={{ fontSize: "12px", color: "#8b94ac", margin: 0, paddingLeft: "18px", lineHeight: "1.7" }}>
            <li>Cứ mỗi <strong>10 giờ</strong> trải nghiệm game sẽ tích lũy đủ điểm tăng 1 cấp.</li>
            <li>Tại các mốc cấp 10, 20, 30, 40, 50, 60, 70, 80, 90, 100... yêu cầu tích lũy nạp xu để mở khóa mốc tương ứng.</li>
            <li>Mỗi khi thăng hạng cột mốc, bạn sẽ nhận được thông báo chúc mừng và các đặc quyền mở khóa trực tiếp trong Hộp thư.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------
// INBOX MODAL (Hộp thư & Thông báo người dùng)
// -------------------------------------------------------------

function InboxModal({
  user,
  onClose,
  reload
}: {
  user: any;
  onClose: () => void;
  reload: () => Promise<any>;
}) {
  const notifs = user?.notifications || [];
  const [busy, setBusy] = useState(false);

  const handleReadAll = async () => {
    setBusy(true);
    try {
      await action("notification.read_all");
      await reload();
    } catch {} finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="📬 Hộp thư & Thông báo tài khoản" onClose={onClose} wide>
      <div className="checkout-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "13px", color: "#8b94ac" }}>
            Bạn có <strong>{user?.unreadNotificationsCount || 0}</strong> thông báo chưa đọc
          </span>
          {(user?.unreadNotificationsCount || 0) > 0 && (
            <button className="btn secondary small" disabled={busy} onClick={handleReadAll}>
              <CheckCircle2 size={14} /> Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#8b94ac" }}>
            <Mail size={36} style={{ margin: "0 auto 10px auto", opacity: 0.4 }} />
            <p>Hiện chưa có thông báo nào trong hộp thư.</p>
          </div>
        ) : (
          <div className="inbox-list">
            {notifs.map((n: any) => (
              <div key={n.id} className={`inbox-item ${!n.read ? "unread" : ""}`}>
                <div className="inbox-item-top">
                  <div className="inbox-item-title">
                    {!n.read && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ebff00", display: "inline-block" }} />}
                    {n.title}
                  </div>
                  <span className="inbox-item-time">{date(n.created_at)}</span>
                </div>
                <div className="inbox-item-msg">{n.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
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
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const symbols = [Leaf, Moon, Sun, Flame, Flower2, Rocket, Diamond, Sparkles];

  useEffect(() => {
    if ((game.id !== "reflex" && game.id !== "orbit") || !session || session.completed) return;
    const t = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(t);
  }, [game.id, session?.id, session?.stage, session?.completed]);

  // 30s COUNTDOWN TIMER PER STAGE (HẾT GIỜ => GAME OVER)
  useEffect(() => {
    if (!session || session.completed || session.gameOver) return;
    const calcLeft = () => {
      if (!session.stageDeadline) return 30;
      return Math.max(0, Math.ceil((session.stageDeadline - Date.now()) / 1000));
    };
    setTimeLeft(calcLeft());

    const timer = setInterval(() => {
      const rem = calcLeft();
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(timer);
        move({ timeout: true });
      }
    }, 500);

    return () => clearInterval(timer);
  }, [session?.id, session?.stage, session?.version, session?.completed, session?.gameOver, session?.stageDeadline]);

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
            <span className="game-type">{game.category} · 100 Màn Thử Thách</span>
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
              <div style={{ margin: "12px 0 18px", display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                <span className="pill" style={{ background: "rgba(208,250,117,0.15)", color: "var(--lime)", border: "1px solid rgba(208,250,117,0.3)" }}>
                  🏆 100 Màn Chơi (Tăng độ khó)
                </span>
                <span className="pill" style={{ background: "rgba(248,203,131,0.15)", color: "var(--amber)", border: "1px solid rgba(248,203,131,0.3)" }}>
                  ⏱️ 30 Giây Mỗi Màn (Hết giờ = Game Over)
                </span>
              </div>
              {game.engine ? (
                signedIn ? (
                  <button className="btn lime" onClick={start} disabled={busy}>
                    {busy ? <Spinner /> : <Play size={17} fill="currentColor" />}
                    {tournament ? "Bắt đầu lượt thi đấu giải" : "Bắt đầu chơi Màn 1"}
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
            session.gameOver ? (
              <div className="game-result game-over">
                <div className="trophy-circle alert" style={{ background: "rgba(232, 93, 117, 0.15)", border: "2px solid var(--rose)", color: "var(--rose)" }}>
                  <CircleAlert size={44} />
                </div>
                <span className="eyebrow" style={{ color: "var(--rose)", fontWeight: 800 }}>HẾT THỜI GIAN 30S · GAME OVER</span>
                <h2>Chưa qua màn!</h2>
                <p style={{ margin: "6px 0 16px", color: "var(--muted)", fontSize: "14px" }}>
                  Thời gian 30 giây đã hết trước khi bạn hoàn thành thử thách. Bạn dừng bước ở <strong>Màn {session.stage || 1} / 100</strong>.
                </p>
                <div className="score" style={{ color: "var(--text)" }}>{number(session.score)}<span>điểm</span></div>
                <button className="btn lime" style={{ marginTop: "16px" }} disabled={busy} onClick={start}>
                  <RefreshCw size={17} /> Chơi lại từ Màn 1
                </button>
              </div>
            ) : (
              <div className="game-result">
                <div className="trophy-circle"><Trophy size={44} /></div>
                <span className="eyebrow subtle">{(session.stage || 1) >= 100 ? "🏆 PHÁ ĐẢO TOÀN BỘ 100 MÀN!" : "THỬ THÁCH HOÀN THÀNH"}</span>
                <h2>{(session.stage || 1) >= 100 ? "Bậc Thầy Xuất Chúng!" : "Làm tốt lắm!"}</h2>
                <p style={{ margin: "4px 0 12px", color: "var(--lime)" }}>Vượt qua Màn {(session.stage || 1)} / 100</p>
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
            )
          ) : (
            <>
              {/* STAGE HUD: 100 STAGES & 30s COUNTDOWN TIMER */}
              <div className="stage-hud-wrapper">
                <div className="stage-level-badge">
                  <Trophy size={16} /> Màn {session.stage || 1} / 100
                </div>
                <div className={`stage-countdown-box ${timeLeft <= 5 ? "urgent" : timeLeft <= 10 ? "warning" : ""}`} title="Bộ đếm ngược 30 giây cho mỗi màn">
                  <Clock3 size={15} />
                  <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                  <div className="stage-countdown-bar">
                    <div className="stage-countdown-fill" style={{ width: `${Math.max(0, Math.min(100, (timeLeft / 30) * 100))}%` }} />
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: "var(--amber)", fontSize: "13px" }}>
                  {number(session.score)} đ
                </div>
              </div>

              {/* GAME 1: MEMORY */}
              {(session?.engine || game.engine) === "memory" && (
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
              {(session?.engine || game.engine) === "number" && (
                <form className="number-board" onSubmit={e => { e.preventDefault(); if (answer.trim()) move({ answer: Number(answer) }); }}>
                  <span>ĐIỀN ĐÁP ÁN CỦA BẠN</span>
                  <h2>{session.question}<em> = ?</em></h2>
                  <input autoFocus type="number" step="1" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="…" disabled={busy} />
                  <button className="btn lime" disabled={busy || !answer.trim()}>{busy ? <Spinner /> : <>Trả lời <ArrowRight size={17} /></>}</button>
                  <p aria-live="polite">{session.feedback || "Tính nhanh và chính xác."}</p>
                </form>
              )}

              {/* GAME 3: REFLEX / ACTION */}
              {(session?.engine || game.engine) === "reflex" && (
                game.category === "Hành động" ? (
                  <div className="action-combat-arena">
                    <button
                      className={`action-target-card ${now >= session.goAt ? "strike-ready" : ""}`}
                      disabled={busy}
                      onClick={() => move({})}
                    >
                      <Flame size={44} color={now >= session.goAt ? "#ff4757" : "#888"} />
                      <strong style={{ fontSize: "18px", color: now >= session.goAt ? "#ff4757" : "#aaa" }}>
                        {now >= session.goAt ? "⚡ TUNG ĐÒN TẤT SÁT!" : "ĐANG RÌNH MỒI..."}
                      </strong>
                      <span className="action-hud-text">
                        {now >= session.goAt ? "Chém chính xác trong chớp mắt" : "Chờ đối thủ lộ sơ hở"}
                      </span>
                    </button>
                    <p style={{ color: "var(--amber)", fontSize: "12px" }}>{session.feedback}</p>
                  </div>
                ) : (
                  <div className="reflex-board">
                    <button className={`reaction-target ${now >= session.goAt ? "go" : ""}`} disabled={busy} onClick={() => move({})}>
                      <Zap size={48} />
                      <strong>{now >= session.goAt ? "CHẠM NGAY!" : "CHỜ TÍN HIỆU"}</strong>
                      <span>{now >= session.goAt ? "Nhanh tay và chính xác" : "Đừng chạm vội…"}</span>
                    </button>
                    <p>{session.feedback}</p>
                  </div>
                )
              )}

              {/* GAME 4: BLOCKS DISTRICT */}
              {(session?.engine || game.engine) === "blocks" && (
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

              {/* GAME 5: ORBIT RUNNER / RACING */}
              {(session?.engine || game.engine) === "orbit" && (
                game.category === "Đua xe" ? (
                  <div className="racing-arena">
                    <div className="racing-track-wrap">
                      {[0, 1, 2].map(laneIdx => (
                        <div
                          key={laneIdx}
                          className={`racing-lane ${session.hazardLanes.includes(laneIdx) ? "hazard" : ""}`}
                        >
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                            {laneIdx === 0 ? "TRÁI" : laneIdx === 1 ? "GIỮA" : "PHẢI"}
                          </span>
                          {session.hazardLanes.includes(laneIdx) && (
                            <div className="racing-obstacle" title="Chướng ngại vật!">⚠️</div>
                          )}
                          <div style={{ height: "40px" }} />
                        </div>
                      ))}

                      {/* Moving Car */}
                      <div
                        className="racing-car-elem"
                        style={{
                          left: session.lane === 0 ? "31px" : session.lane === 1 ? "138px" : "245px"
                        }}
                      >
                        🏎️
                      </div>
                    </div>

                    <div className="racing-controls">
                      <button className={`btn ${session.lane === 0 ? "lime" : "secondary"} small`} onClick={() => move({ lane: 0 })}>
                        Làn Trái
                      </button>
                      <button className={`btn ${session.lane === 1 ? "lime" : "secondary"} small`} onClick={() => move({ lane: 1 })}>
                        Làn Giữa
                      </button>
                      <button className={`btn ${session.lane === 2 ? "lime" : "secondary"} small`} onClick={() => move({ lane: 2 })}>
                        Làn Phải
                      </button>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--amber)" }}>{session.feedback}</p>
                  </div>
                ) : (
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
                )
              )}

              {/* GAME 6: WORD VOYAGE */}
              {(session?.engine || game.engine) === "word" && (
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
            {game.category === "Đua xe" ? "Chuyển làn xe linh hoạt giữa Làn Trái, Làn Giữa và Làn Phải để né tránh xe cản và các khúc cua tử thần ở tốc độ cao!" :
             game.category === "Hành động" ? "Tập trung cao độ, quan sát kỹ sơ hở của đối thủ và chạm tung chiêu tất sát ngay trong tích tắc khi tín hiệu kích hoạt!" :
             game.category === "Không gian" ? "Điều khiển phi thuyền chuyển đổi giữa 3 tầng quỹ đạo vũ trụ để tránh các vành đai thiên thạch và hố đen tử thần!" :
             game.category === "Trí tuệ" ? "Thử thách tư duy logic, ghi nhớ ma trận và giải các phép toán tốc độ cao với độ chuẩn xác tuyệt đối." :
             game.category === "Giải đố" ? "Vận dụng óc phán đoán, phân tích gợi ý và giải mã các câu đố hóc búa để vượt qua màn chơi." :
             game.category === "Xếp hình" ? "Chọn các khối hình và sắp xếp khít vào bảng lưới để xóa hàng/cột và kích hoạt chuỗi combo điểm kỷ lục!" :
             "Chờ mục tiêu chuyển xanh rồi chạm thật nhanh để phản xạ chính xác trong từng mili-giây!"}
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
// WALLET PAGE - HỆ THỐNG 2 VÍ TÁCH BIỆT (VÍ XU & VÍ CHÍNH)
// -------------------------------------------------------------

function WalletPage({ data, available, held, reload, notify, navigate, openRefill }: {
  data: Data | null; available: number; held: number; reload: () => Promise<any>;
  notify: (s: string) => void; navigate: (s: string) => void; openRefill: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [walletTab, setWalletTab] = useState<"conversions" | "payouts" | "topups" | "transfers" | "ledger">("conversions");

  // Conversion state (Ví Xu -> Ví Chính)
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertCoinsInput, setConvertCoinsInput] = useState("1000");

  // Withdrawal state (Ví Chính -> Payoneer)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawUsdInput, setWithdrawUsdInput] = useState("10");

  // Payoneer Linking modal
  const [showLinkPayoneerModal, setShowLinkPayoneerModal] = useState(false);
  const [payoneerEmailInput, setPayoneerEmailInput] = useState(data?.user?.payoneerEmail || "");

  // P2P Transfer state (Level 10+)
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("100");
  const [transferNote, setTransferNote] = useState("");

  const availableCoins = data?.user?.availableCoins ?? available;
  const heldCoins = data?.user?.heldCoins ?? held;
  const mainUsdBalance = (data?.user?.mainUsdBalance || 0) / 100;
  const mainUsdHeldBalance = (data?.user?.mainUsdHeldBalance || 0) / 100;
  const payoneerEmail = data?.user?.payoneerEmail || "";
  const userLevel = data?.user?.level || 1;
  const canWithdraw = (data?.user?.levelInfo?.canWithdraw ?? userLevel >= 50);
  const maxWithdrawalUsd = data?.user?.levelInfo?.maxWithdrawalUsd || (userLevel >= 100 ? 500 : (userLevel >= 50 ? 50 : 0));

  // Handle Coin Conversion to Main USD
  const submitConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    const cAmount = Number(convertCoinsInput);
    if (!Number.isSafeInteger(cAmount) || cAmount < 1000) {
      notify("Số xu quy đổi tối thiểu là 1.000 xu ($1.00 USD).");
      return;
    }
    if (cAmount % 10 !== 0) {
      notify("Số xu quy đổi phải là bội số của 10.");
      return;
    }
    if (cAmount > availableCoins) {
      notify("Số dư xu khả dụng trong Ví Xu không đủ.");
      return;
    }

    setBusy(true);
    try {
      await action("wallet.convert_coins", {
        coins: cAmount,
        requestKey: crypto.randomUUID()
      });
      await reload();
      setShowConvertModal(false);
      notify(`Đã gửi yêu cầu đổi ${number(cAmount)} xu sang $${(cAmount / 1000).toFixed(2)} USD vào Ví Chính. Vui lòng chờ Admin duyệt!`);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Handle Payoneer Withdrawal from Main USD Wallet
  const submitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoneerEmail) {
      notify("Bạn cần liên kết địa chỉ ví Payoneer trước khi tạo lệnh rút tiền.");
      setShowWithdrawModal(false);
      setShowLinkPayoneerModal(true);
      return;
    }
    if (!canWithdraw) {
      notify("Bạn cần đạt tối thiểu Cấp 50 để mở khóa quyền rút tiền về ví Payoneer.");
      return;
    }
    const wAmount = Number(withdrawUsdInput);
    if (isNaN(wAmount) || wAmount < 10) {
      notify("Số tiền rút tối thiểu là $10.00 USD.");
      return;
    }
    if (wAmount > mainUsdBalance) {
      notify("Số dư trong Ví Chính ($) không đủ để rút số tiền này.");
      return;
    }
    if (wAmount > maxWithdrawalUsd) {
      notify(`Hạn mức rút tối đa cho Cấp ${userLevel} là $${maxWithdrawalUsd}.00 USD/ngày.`);
      return;
    }

    setBusy(true);
    try {
      const fee = Math.round(wAmount * 0.15 * 100) / 100;
      const net = Math.round((wAmount - fee) * 100) / 100;
      await action("payout.create", {
        usdAmount: wAmount,
        payoneerEmail,
        requestKey: crypto.randomUUID()
      });
      await reload();
      setShowWithdrawModal(false);
      notify(`Đã tạo lệnh rút $${wAmount.toFixed(2)} USD (Phí 15%: $${fee.toFixed(2)}, Thực nhận Payoneer: $${net.toFixed(2)}). Admin đang kiểm tra để chuyển tiền!`);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Handle Linking Payoneer Link
  const submitLinkPayoneer = async (e: React.FormEvent) => {
    e.preventDefault();
    const link = payoneerEmailInput.trim();
    if (!link || link.length < 5) {
      notify("Vui lòng nhập đường dẫn liên kết ví Payoneer hợp lệ.");
      return;
    }
    setBusy(true);
    try {
      await action("user.link_payoneer", { link });
      await reload();
      setShowLinkPayoneerModal(false);
      notify(`Đã liên kết link ví Payoneer thành công: ${link}`);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Handle P2P Transfer (Requires Level >= 10)
  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userLevel < 10) {
      notify("Bạn cần đạt Cấp 10 trở lên để mở khóa tính năng Chuyển xu P2P.");
      return;
    }
    const tCoins = Number(transferAmount);
    if (!Number.isSafeInteger(tCoins) || tCoins < 10) {
      notify("Số xu chuyển tối thiểu là 10 xu.");
      return;
    }
    if (tCoins > availableCoins) {
      notify("Số dư xu khả dụng trong Ví Xu không đủ.");
      return;
    }

    setBusy(true);
    try {
      await action("transfer.create", {
        recipient: transferTarget,
        coins: tCoins,
        note: transferNote,
        requestKey: crypto.randomUUID()
      });
      await reload();
      setShowTransfer(false);
      setTransferTarget("");
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
          <span className="eyebrow subtle">TÀI CHÍNH & VÍ ĐIỆN TỬ JINQP</span>
          <h1>Ví Người Dùng</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn lime small" onClick={openRefill}>
            <Coins size={16} /> Nạp xu (Phí 0%)
          </button>
          <button className="btn secondary small" onClick={() => setShowConvertModal(true)}>
            <RefreshCw size={16} /> Đổi xu sang Ví Chính ($)
          </button>
          <button
            className={`btn small ${canWithdraw ? "lime" : "secondary"}`}
            onClick={() => {
              if (!payoneerEmail) {
                setShowLinkPayoneerModal(true);
              } else {
                setShowWithdrawModal(true);
              }
            }}
          >
            <ArrowUpRight size={16} /> Rút tiền về Payoneer
          </button>
          <button
            className="btn secondary small"
            onClick={() => {
              if (userLevel < 10) {
                notify(`🔒 Tính năng Chuyển xu P2P mở khóa ở Cấp 10 (Hiện tại: Cấp ${userLevel}). Hãy chơi game để tăng cấp nhé!`);
              } else {
                setShowTransfer(true);
              }
            }}
          >
            <Send size={16} /> Chuyển xu P2P {userLevel < 10 && "🔒"}
          </button>
        </div>
      </div>

      {/* 2 DISTINCT WALLETS SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        
        {/* WALLET 1: VÍ XU (COIN WALLET) */}
        <div className="panel" style={{ background: "linear-gradient(145deg, rgba(255, 184, 0, 0.08) 0%, rgba(17, 20, 28, 0.95) 100%)", border: "1px solid rgba(255, 184, 0, 0.25)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: "radial-gradient(circle, rgba(255,184,0,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="strip-icon amber" style={{ width: 40, height: 40 }}><Coins size={22} /></span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--amber)" }}>VÍ XU (Game Coins)</h3>
                <small style={{ color: "var(--muted)" }}>Xu nạp & xu thưởng chơi game</small>
              </div>
            </div>
            <span className="pill" style={{ background: "rgba(255,184,0,0.15)", color: "var(--amber)", border: "1px solid rgba(255,184,0,0.3)" }}>Phí nạp: 0% Free</span>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Số dư khả dụng</div>
            <div style={{ fontSize: "2.1rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "baseline", gap: "8px", margin: "4px 0" }}>
              <Coin size={30} />
              {number(availableCoins)}
              <span style={{ fontSize: "1rem", color: "var(--amber)", fontWeight: 600 }}>xu</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "12px", background: "rgba(0,0,0,0.25)", borderRadius: "10px", marginBottom: "16px" }}>
            <div>
              <small style={{ color: "var(--muted)", display: "block" }}>Xu đang giữ (Đổi $):</small>
              <strong style={{ color: "var(--text)", fontSize: "1rem" }}>{number(heldCoins)} xu</strong>
            </div>
            <div>
              <small style={{ color: "var(--muted)", display: "block" }}>Xu nhận hôm nay:</small>
              <strong style={{ color: "var(--mint)", fontSize: "1rem" }}>+{number(data?.user?.earnedToday || 0)} xu</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="btn lime small" style={{ flex: 1 }} onClick={openRefill}>
              <Coins size={14} /> Nạp thêm xu (0% Phí)
            </button>
            <button className="btn secondary small" style={{ flex: 1 }} onClick={() => setShowConvertModal(true)}>
              <RefreshCw size={14} /> Đổi sang Ví Chính ($)
            </button>
          </div>
        </div>

        {/* WALLET 2: VÍ CHÍNH (MAIN USD WALLET) */}
        <div className="panel" style={{ background: "linear-gradient(145deg, rgba(180, 248, 86, 0.08) 0%, rgba(17, 20, 28, 0.95) 100%)", border: "1px solid rgba(180, 248, 86, 0.25)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: "radial-gradient(circle, rgba(180,248,86,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="strip-icon lime" style={{ width: 40, height: 40 }}><Wallet size={22} /></span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--lime)" }}>VÍ CHÍNH ($ USD)</h3>
                <small style={{ color: "var(--muted)" }}>Số dư rút về ví Payoneer</small>
              </div>
            </div>
            <span className="pill" style={{ background: "rgba(180,248,86,0.15)", color: "var(--lime)", border: "1px solid rgba(180,248,86,0.3)" }}>Phí rút: 15%/lệnh</span>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Số dư khả dụng</div>
            <div style={{ fontSize: "2.1rem", fontWeight: 800, color: "var(--lime)", display: "flex", alignItems: "baseline", gap: "6px", margin: "4px 0" }}>
              ${mainUsdBalance.toFixed(2)}
              <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: 600 }}>USD</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", wordBreak: "break-all" }}>
              Liên kết ví Payoneer:{" "}
              {payoneerEmail ? (
                <a href={payoneerEmail.startsWith("http") ? payoneerEmail : `https://${payoneerEmail}`} target="_blank" rel="noreferrer" style={{ color: "var(--lime)", textDecoration: "underline", fontWeight: 600 }}>
                  {payoneerEmail} <ExternalLink size={12} style={{ display: "inline" }} />
                </a>
              ) : (
                <span style={{ color: "var(--rose)" }}>Chưa liên kết</span>
              )}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "12px", background: "rgba(0,0,0,0.25)", borderRadius: "10px", marginBottom: "16px" }}>
            <div>
              <small style={{ color: "var(--muted)", display: "block" }}>USD đang chờ rút:</small>
              <strong style={{ color: "var(--text)", fontSize: "1rem" }}>${mainUsdHeldBalance.toFixed(2)} USD</strong>
            </div>
            <div>
              <small style={{ color: "var(--muted)", display: "block" }}>Hạn mức rút:</small>
              <strong style={{ color: canWithdraw ? "var(--lime)" : "var(--muted)", fontSize: "1rem" }}>
                {canWithdraw ? `$${maxWithdrawalUsd}/ngày (Lv.${userLevel})` : "Mở ở Cấp 50 🔒"}
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="btn lime small"
              style={{ flex: 1 }}
              onClick={() => {
                if (!payoneerEmail) {
                  setShowLinkPayoneerModal(true);
                } else {
                  setShowWithdrawModal(true);
                }
              }}
            >
              <ArrowUpRight size={14} /> Rút tiền về Payoneer (Phí 15%)
            </button>
            <button className="btn secondary small" style={{ flex: 1 }} onClick={() => setShowLinkPayoneerModal(true)}>
              <Link2 size={14} /> {payoneerEmail ? "Đổi link ví Payoneer" : "Liên kết ví Payoneer"}
            </button>
          </div>
        </div>

      </div>

      {/* CỔNG NẠP TIỀN & VÍ NHẬN PAYONEER */}
      <div className="panel payoneer-wallet-banner">
        <div className="payoneer-wallet-header">
          <span className="strip-icon mint"><Coins size={22} /></span>
          <div>
            <h3>Ví nhận tiền & Cổng nạp xu Payoneer</h3>
            <p>Quét mã QR hoặc truy cập liên kết Payoneer bên dưới để nạp tiền vào ví nhận JINQP Gaming Center (Tỷ lệ quy đổi: 1 USD = 1.000 xu · Phí nạp: 0% Miễn phí).</p>
          </div>
        </div>
        <div className="payoneer-wallet-body">
          <div className="payoneer-wallet-qr">
            <img src={PAYONEER_QR_IMAGE} alt="Mã QR ví nhận Payoneer" />
            <span>Quét mã QR Payoneer</span>
          </div>
          <div className="payoneer-wallet-details">
            <div className="payoneer-link-field">
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#a4adc9" }}>Liên kết ví nhận tiền Payoneer Ban Quản Trị:</label>
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
                <Coins size={14} /> Tạo đơn nạp xu (0% Phí)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTION HISTORY TABS */}
      <div className="panel" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              className={`btn small ${walletTab === "conversions" ? "lime" : "secondary"}`}
              onClick={() => setWalletTab("conversions")}
            >
              <RefreshCw size={14} /> Đổi xu sang $ ({data?.user?.conversions?.length || 0})
            </button>
            <button
              className={`btn small ${walletTab === "payouts" ? "lime" : "secondary"}`}
              onClick={() => setWalletTab("payouts")}
            >
              <ArrowUpRight size={14} /> Lệnh rút Payoneer ({data?.user?.payouts?.length || 0})
            </button>
            <button
              className={`btn small ${walletTab === "topups" ? "lime" : "secondary"}`}
              onClick={() => setWalletTab("topups")}
            >
              <Coins size={14} /> Đơn nạp ({data?.user?.orders?.length || 0})
            </button>
            <button
              className={`btn small ${walletTab === "transfers" ? "lime" : "secondary"}`}
              onClick={() => setWalletTab("transfers")}
            >
              <Send size={14} /> Chuyển xu P2P ({data?.user?.transfers?.length || 0})
            </button>
            <button
              className={`btn small ${walletTab === "ledger" ? "lime" : "secondary"}`}
              onClick={() => setWalletTab("ledger")}
            >
              <Clock3 size={14} /> Sổ cái đối soát
            </button>
          </div>
          <button className="btn secondary small" onClick={() => reload().catch((e: any) => notify(e.message))}>
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>

        {/* TAB 1: COIN CONVERSIONS TO MAIN USD */}
        {walletTab === "conversions" && (
          <div>
            {data?.user?.conversions?.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Thời gian / Mã đơn</th>
                      <th>Số xu quy đổi</th>
                      <th>USD nhận vào Ví Chính</th>
                      <th>Phí đổi</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.user.conversions.map((c: any) => (
                      <tr key={c.id}>
                        <td>
                          <strong>#{c.id.slice(0, 8)}</strong>
                          <small>{date(c.created_at)}</small>
                        </td>
                        <td><strong style={{ color: "var(--amber)" }}>{number(c.coins)} xu</strong></td>
                        <td><strong style={{ color: "var(--lime)" }}>${(c.usd_cents / 100).toFixed(2)} USD</strong></td>
                        <td><span className="pill">0% (Miễn phí)</span></td>
                        <td>
                          <span className={`status ${c.status}`}>
                            {c.status === "pending" ? "Chờ Admin duyệt" : c.status === "approved" ? "Đã duyệt vào Ví Chính" : "Từ chối (Đã hoàn xu)"}
                          </span>
                        </td>
                        <td><small>{c.admin_note || (c.status === "pending" ? "Đang xử lý đối soát" : "Hoàn tất")}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-small">
                <RefreshCw size={26} />
                <p>Chưa có yêu cầu quy đổi xu nào.</p>
                <button className="btn lime small" style={{ marginTop: 8 }} onClick={() => setShowConvertModal(true)}>
                  Tạo yêu cầu đổi xu sang Ví Chính ($)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYONEER PAYOUTS */}
        {walletTab === "payouts" && (
          <div>
            {data?.user?.payouts?.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Thời gian / Mã đơn</th>
                      <th>Tổng rút (Gross)</th>
                      <th>Phí rút (15%)</th>
                      <th>Thực nhận Payoneer</th>
                      <th>Ví Payoneer nhận</th>
                      <th>Trạng thái</th>
                      <th>Mã GD Payoneer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.user.payouts.map((p: any) => {
                      const fee = p.fee_cents || Math.round(p.usd_cents * 0.15);
                      const net = p.net_cents || (p.usd_cents - fee);
                      return (
                        <tr key={p.id}>
                          <td>
                            <strong>#{p.id.slice(0, 8)}</strong>
                            <small>{date(p.created_at)}</small>
                          </td>
                          <td><strong>${(p.usd_cents / 100).toFixed(2)} USD</strong></td>
                          <td><span style={{ color: "var(--rose)" }}>-${(fee / 100).toFixed(2)}</span></td>
                          <td><strong style={{ color: "var(--lime)", fontSize: "1.05em" }}>${(net / 100).toFixed(2)} USD</strong></td>
                          <td>
                            <strong style={{ color: "var(--text)" }}>{p.recipient}</strong>
                          </td>
                          <td>
                            <span className={`status ${p.status}`}>
                              {p.status === "pending" ? "Chờ Admin chuyển tiền" : p.status === "approved" ? "Đang thực hiện chuyển" : p.status === "paid" ? "Đã chuyển tiền thành công" : "Từ chối (Đã hoàn $)"}
                            </span>
                          </td>
                          <td>
                            <small style={{ color: p.external_ref ? "var(--lime)" : "var(--muted)" }}>
                              {p.external_ref || (p.status === "rejected" ? p.note : "Đang xử lý")}
                            </small>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-small">
                <ArrowUpRight size={26} />
                <p>Chưa có yêu cầu rút tiền Payoneer nào.</p>
                {canWithdraw ? (
                  <button className="btn lime small" style={{ marginTop: 8 }} onClick={() => setShowWithdrawModal(true)}>
                    Tạo lệnh rút tiền về Payoneer
                  </button>
                ) : (
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Tính năng rút tiền sẽ mở khóa khi bạn đạt Cấp 50 (Hiện tại: Cấp {userLevel}).</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TOPUP ORDERS */}
        {walletTab === "topups" && (
          <div>
            {data?.user?.orders?.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Thời gian / Mã</th>
                      <th>Gói nạp</th>
                      <th>Số tiền (USD)</th>
                      <th>Phí nạp</th>
                      <th>Phương thức</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.user.orders.map((o: any) => (
                      <tr key={o.id}>
                        <td>
                          <strong>#{o.id.slice(0, 8)}</strong>
                          <small>{date(o.created_at)}</small>
                        </td>
                        <td><strong>{o.plan_id}</strong></td>
                        <td><strong>${(o.amount_cents / 100).toFixed(2)} USD</strong></td>
                        <td><span className="pill">0% (Miễn phí)</span></td>
                        <td>{o.method}</td>
                        <td>
                          <span className={`status ${o.status}`}>
                            {o.status === "paid" ? "Đã cộng xu" : o.status === "pending" ? "Chờ xác nhận" : o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-small"><Coins size={26} /><p>Chưa có đơn nạp nào.</p></div>
            )}
          </div>
        )}

        {/* TAB 4: TRANSFERS P2P */}
        {walletTab === "transfers" && (
          <div>
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
              <div className="empty-small">
                <Send size={26} />
                <p>Chưa có giao dịch chuyển xu P2P nào.</p>
                {userLevel >= 10 ? (
                  <button className="btn secondary small" style={{ marginTop: 8 }} onClick={() => setShowTransfer(true)}>
                    Chuyển xu cho bạn bè
                  </button>
                ) : (
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Chuyển xu P2P mở khóa khi đạt Cấp 10 (Hiện tại: Cấp {userLevel}).</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: LEDGER */}
        {walletTab === "ledger" && (
          <div>
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
              <div className="empty-small"><Clock3 size={26} /><p>Chưa có bút toán sổ cái.</p></div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: CONVERT COINS TO MAIN USD WALLET */}
      {showConvertModal && (
        <Modal title="Quy đổi xu sang Ví Chính ($)" onClose={() => setShowConvertModal(false)}>
          <form className="checkout-body" onSubmit={submitConversion}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}><RefreshCw size={16} />QUY ĐỔI XU RA USD</span>
            <h2>Chuyển đổi xu sang Ví Chính ($)</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "16px", lineHeight: "1.5" }}>
              Xu trong Ví Xu sẽ được chuyển đổi thành số dư USD trong Ví Chính theo tỷ lệ <strong>1.000 xu = $1.00 USD</strong>. Sau khi Admin phê duyệt, USD sẽ được cộng ngay vào Ví Chính để bạn rút về Payoneer!
            </p>

            <label>Số xu muốn quy đổi
              <div className="input-with-unit" style={{ marginTop: 6 }}>
                <input
                  required
                  type="number"
                  min="1000"
                  max={availableCoins}
                  step="10"
                  value={convertCoinsInput}
                  onChange={e => setConvertCoinsInput(e.target.value)}
                  placeholder="1000"
                />
                <span>xu</span>
              </div>
              <small style={{ color: "var(--muted)", marginTop: 4, display: "block" }}>
                Số dư khả dụng: {number(availableCoins)} xu · Tối thiểu 1.000 xu
              </small>
            </label>

            <div className="checkout-summary" style={{ marginTop: "16px" }}>
              <span>Số xu trừ từ Ví Xu</span>
              <strong style={{ color: "var(--amber)" }}>-{number(Number(convertCoinsInput) || 0)} xu</strong>
              <span>USD nhận vào Ví Chính</span>
              <strong style={{ color: "var(--lime)", fontSize: "1.1em" }}>+${((Number(convertCoinsInput) || 0) / 1000).toFixed(2)} USD</strong>
              <span>Phí chuyển đổi</span>
              <strong style={{ color: "var(--lime)" }}>0% (Miễn phí)</strong>
              <span>Quy trình xử lý</span>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Admin kiểm duyệt đối soát</span>
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                className="btn lime full"
                type="submit"
                disabled={busy || Number(convertCoinsInput) < 1000 || Number(convertCoinsInput) > availableCoins}
              >
                {busy ? <Spinner /> : <CheckCircle2 size={18} />} Xác nhận gửi yêu cầu đổi xu
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: WITHDRAW USD FROM MAIN WALLET TO PAYONEER */}
      {showWithdrawModal && (
        <Modal title="Tạo lệnh rút tiền về ví Payoneer" onClose={() => setShowWithdrawModal(false)}>
          <form className="checkout-body" onSubmit={submitWithdrawal}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}><ArrowUpRight size={16} />RÚT TIỀN THẬT QUA PAYONEER</span>
            <h2>Rút tiền từ Ví Chính về Payoneer</h2>
            
            <div style={{ background: "rgba(180,248,86,0.06)", border: "1px solid rgba(180,248,86,0.2)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <small style={{ color: "var(--muted)", display: "block" }}>Địa chỉ ví Payoneer nhận tiền:</small>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <strong style={{ color: "var(--lime)", fontSize: "1.05rem" }}>{payoneerEmail}</strong>
                <button
                  type="button"
                  className="btn secondary small"
                  style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setShowLinkPayoneerModal(true);
                  }}
                >
                  Đổi ví
                </button>
              </div>
            </div>

            <label>Số USD muốn rút từ Ví Chính
              <div className="input-with-unit" style={{ marginTop: 6 }}>
                <input
                  required
                  type="number"
                  min="10"
                  max={Math.min(mainUsdBalance, maxWithdrawalUsd)}
                  step="1"
                  value={withdrawUsdInput}
                  onChange={e => setWithdrawUsdInput(e.target.value)}
                  placeholder="10"
                />
                <span>USD</span>
              </div>
              <small style={{ color: "var(--muted)", marginTop: 4, display: "block" }}>
                Số dư Ví Chính: ${mainUsdBalance.toFixed(2)} USD · Hạn mức hôm nay: ${maxWithdrawalUsd}.00 USD
              </small>
            </label>

            {/* CLEAR 15% FEE BREAKDOWN */}
            {(() => {
              const gross = Number(withdrawUsdInput) || 0;
              const fee = Math.round(gross * 0.15 * 100) / 100;
              const net = Math.round((gross - fee) * 100) / 100;
              return (
                <div className="checkout-summary" style={{ marginTop: "16px" }}>
                  <span>Số tiền rút (Gross)</span>
                  <strong>${gross.toFixed(2)} USD</strong>
                  <span>Phí rút tiền dịch vụ (15%)</span>
                  <strong style={{ color: "var(--rose)" }}>-${fee.toFixed(2)} USD</strong>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>Thực nhận ví Payoneer (85%)</span>
                  <strong style={{ color: "var(--lime)", fontSize: "1.15em" }}>${net.toFixed(2)} USD</strong>
                  <span>Thời gian xử lý</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Admin đối soát và chuyển tiền trong 24h</span>
                </div>
              );
            })()}

            <div style={{ marginTop: 20 }}>
              <button
                className="btn lime full"
                type="submit"
                disabled={busy || Number(withdrawUsdInput) < 10 || Number(withdrawUsdInput) > mainUsdBalance || Number(withdrawUsdInput) > maxWithdrawalUsd}
              >
                {busy ? <Spinner /> : <ArrowUpRight size={18} />} Xác nhận tạo lệnh rút tiền
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: LINK PAYONEER WALLET */}
      {showLinkPayoneerModal && (
        <Modal title="Liên kết ví Payoneer nhận tiền" onClose={() => setShowLinkPayoneerModal(false)}>
          <form className="checkout-body" onSubmit={submitLinkPayoneer}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}><Link2 size={16} />LIÊN KẾT VÍ PAYONEER</span>
            <h2>Đường dẫn liên kết ví Payoneer nhận tiền</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "16px", lineHeight: "1.5" }}>
              Vui lòng nhập đường dẫn liên kết ví Payoneer của bạn. Khi bạn tạo lệnh rút tiền từ Ví Chính, Ban Quản Trị sẽ chuyển tiền thật trực tiếp vào liên kết ví này.
            </p>

            <label>Đường dẫn liên kết ví Payoneer của bạn
              <input
                required
                type="text"
                placeholder="VD: https://link.payoneer.com/... hoặc link ví Payoneer của bạn"
                value={payoneerEmailInput}
                onChange={e => setPayoneerEmailInput(e.target.value)}
                style={{ marginTop: 6 }}
              />
            </label>

            <div style={{ marginTop: 20 }}>
              <button className="btn lime full" type="submit" disabled={busy || !payoneerEmailInput.trim()}>
                {busy ? <Spinner /> : <Link2 size={18} />} Lưu liên kết ví Payoneer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: P2P TRANSFER (LOCKED FOR LEVEL < 10) */}
      {showTransfer && (
        <Modal title="Chuyển xu cho bạn bè (P2P Transfer)" onClose={() => setShowTransfer(false)}>
          {userLevel < 10 ? (
            <div className="checkout-body" style={{ textAlign: "center", padding: "24px 16px" }}>
              <Lock size={44} style={{ color: "var(--amber)", margin: "0 auto 14px", display: "block" }} />
              <h2 style={{ color: "#fff" }}>Tính năng khóa đến Cấp 10</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", lineHeight: "1.6", marginBottom: 20 }}>
                Để đảm bảo an toàn giao dịch trên toàn hệ thống, tính năng Chuyển xu P2P chỉ mở khóa khi tài khoản của bạn đạt từ <strong>Cấp 10</strong> trở lên.
              </p>
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>Cấp độ hiện tại: <strong style={{ color: "var(--lime)" }}>Lv.{userLevel}</strong></span>
                  <span>Mục tiêu mở khóa: <strong style={{ color: "var(--amber)" }}>Lv.10</strong></span>
                </div>
                <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (userLevel / 10) * 100)}%`, height: "100%", background: "var(--lime)", borderRadius: 4 }} />
                </div>
              </div>
              <button className="btn lime full" onClick={() => setShowTransfer(false)}>
                Đã hiểu · Tiếp tục chơi game tăng cấp
              </button>
            </div>
          ) : (
            <form className="checkout-body" onSubmit={submitTransfer}>
              <span className="eyebrow" style={{ color: "var(--lime)" }}><Send size={16} />CHUYỂN XU TỨC THÌ (CẤP 10+)</span>
              <h2>Chuyển xu an toàn P2P</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "16px" }}>
                Chuyển xu trực tiếp cho tài khoản khác trên nền tảng với bút toán sổ cái kép tức thì.
              </p>
              <label>Email hoặc ID người nhận
                <input
                  required
                  type="text"
                  placeholder="nguoidung@example.com"
                  value={transferTarget}
                  onChange={e => setTransferTarget(e.target.value)}
                  style={{ marginTop: 6 }}
                />
              </label>
              <label style={{ marginTop: "14px" }}>Số xu muốn chuyển
                <input
                  required
                  type="number"
                  min="10"
                  max={availableCoins}
                  step="10"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  style={{ marginTop: 6 }}
                />
                <small style={{ color: "var(--muted)", marginTop: 4, display: "block" }}>
                  Số dư khả dụng: {number(availableCoins)} xu
                </small>
              </label>
              <label style={{ marginTop: "14px" }}>Lời nhắn (tùy chọn)
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Tặng bạn ván chơi vui vẻ…"
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  style={{ marginTop: 6 }}
                />
              </label>
              <div className="checkout-summary" style={{ marginTop: "16px" }}>
                <span>Số xu chuyển</span>
                <strong>{number(Number(transferAmount) || 0)} xu</strong>
                <span>Phí giao dịch</span>
                <strong style={{ color: "var(--lime)" }}>0 xu (Miễn phí)</strong>
              </div>
              <button className="btn lime full" type="submit" disabled={busy || Number(transferAmount) > availableCoins || !transferTarget}>
                {busy ? <Spinner /> : <Send size={16} />} Xác nhận chuyển xu
              </button>
            </form>
          )}
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
  data,
  reload,
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
  data: Data | null;
  reload: () => Promise<any>;
}) {
  const [payoneerEmail, setPayoneerEmail] = useState(data?.user?.payoneerEmail || "");
  const [busy, setBusy] = useState(false);

  const savePayoneer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoneerEmail.trim() || !payoneerEmail.includes("@")) {
      notify("Vui lòng nhập email ví Payoneer hợp lệ.");
      return;
    }
    setBusy(true);
    try {
      await action("user.link_payoneer", { email: payoneerEmail.trim() });
      await reload();
      notify(`Đã lưu liên kết ví Payoneer thành công: ${payoneerEmail.trim()}`);
    } catch (err: any) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="settings-page">
      <div className="center-heading">
        <span className="eyebrow">JINQP SETTINGS</span>
        <h1>{t("settingsTitle")}</h1>
        <p>{t("settingsSubtitle")}</p>
      </div>

      {/* PAYONEER WALLET LINKING SECTION */}
      <div className="settings-section" style={{ border: "1px solid rgba(180, 248, 86, 0.25)", background: "linear-gradient(145deg, rgba(180, 248, 86, 0.05) 0%, rgba(17, 20, 28, 0.95) 100%)" }}>
        <div className="settings-section-head">
          <h2>
            <Link2 size={18} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8, color: "var(--lime)" }} />
            Liên kết địa chỉ ví Payoneer nhận tiền thưởng
          </h2>
          <p>
            Địa chỉ email Payoneer dùng để nhận tiền thật khi bạn tạo lệnh rút tiền từ <strong>Ví Chính ($)</strong>. Tiền thật sẽ được Admin chuyển trực tiếp vào tài khoản Payoneer này (Phí rút: 15%/lệnh).
          </p>
        </div>

        <form onSubmit={savePayoneer} style={{ padding: "0 20px 20px" }}>
          <div style={{ display: "flex", gap: "10px", maxWidth: 520, flexWrap: "wrap" }}>
            <input
              type="email"
              required
              placeholder="nhap_email_payoneer@example.com"
              value={payoneerEmail}
              onChange={e => setPayoneerEmail(e.target.value)}
              style={{ flex: 1, minWidth: 260, padding: "10px 14px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
            />
            <button className="btn lime" type="submit" disabled={busy || !payoneerEmail.trim()}>
              {busy ? <Spinner /> : <Check size={16} />} Lưu ví Payoneer
            </button>
          </div>
          {data?.user?.payoneerEmail && (
            <small style={{ color: "var(--lime)", display: "block", marginTop: 8 }}>
              ✓ Đã liên kết: <strong>{data.user.payoneerEmail}</strong>
            </small>
          )}
        </form>
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
