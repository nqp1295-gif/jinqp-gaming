"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity, ArrowDownLeft, ArrowUpRight, ArrowRight, Check, CheckCircle2,
  ChevronRight, CircleAlert, Clock3, Coins, CreditCard, Crown, Database,
  ExternalLink, Eye, EyeOff, Gamepad2, Gem, LayoutDashboard, Link2,
  LoaderCircle, LogOut, Menu, MessageSquare, MoreHorizontal, RefreshCw,
  Save, Search, Settings2, Shield, ShieldCheck, SlidersHorizontal, Users,
  Wallet, X, XCircle, Trophy, Globe, Send, Plus, Gift, Sparkles
} from "lucide-react";

type Plan = {
  id: string; tier: string; period: string; price_cents: number;
  multiplier_bps: number; daily_cap: number; session_cap: number;
  perks: string[]; revision: number; active: number;
};

const tiers: Record<string, string> = { bronze: "Đồng", gold: "Vàng", diamond: "Kim Cương" };
const periods: Record<string, string> = { week: "Tuần", month: "Tháng", year: "Năm" };

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n / 100);
const num = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
const date = (n: number) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(n);

const statuses: Record<string, string> = {
  pending: "Chờ xử lý", approved: "Đã duyệt", paid: "Hoàn tất",
  rejected: "Từ chối", open: "Đang mở", resolved: "Đã phản hồi",
  active: "Đang diễn ra", settled: "Đã quyết toán", cancelled: "Đã hủy",
  completed: "Thành công"
};

async function call(action: string, input: unknown = {}) {
  const r = await fetch("/api/control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, input })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Yêu cầu chưa thành công.");
  return d;
}

function Spinner() { return <LoaderCircle className="spin" size={17} />; }
function Badge({ value }: { value: string }) { return <span className={`status ${value}`}>{statuses[value] || value}</span>; }
function Empty({ message = "Chưa có dữ liệu trong mục này." }: { message?: string }) {
  return <div className="empty"><Database size={28} /><p>{message}</p></div>;
}

function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = old; };
  }, []);
  return (
    <dialog ref={ref} className="modal" aria-label={title} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.currentTarget === e.target) close(); }}>
      <div className="modal-top">
        <h3>{title}</h3>
        <button className="icon-button" aria-label="Đóng" onClick={close}><X size={19} /></button>
      </div>
      {children}
    </dialog>
  );
}

export default function Control({ viewer }: { viewer: { name: string; email: string } | null }) {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<Plan | null>(null);
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [mobile, setMobile] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");
  const [showCreateTourney, setShowCreateTourney] = useState(false);
  const [showCreateGiftcode, setShowCreateGiftcode] = useState(false);
  const [giftcodeForm, setGiftcodeForm] = useState({ code: "", coins: 1000, maxUses: 100, expiresDays: 30 });
  const [adjustUserModal, setAdjustUserModal] = useState<any>(null);
  const [adjustHours, setAdjustHours] = useState(10);
  const [adjustCoins, setAdjustCoins] = useState(10000);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantPlanId, setGrantPlanId] = useState("gold-month");
  const [grantNote, setGrantNote] = useState("Cấp quyền thành viên thủ công từ Ban Quản Trị");
  const [confirmPaidModal, setConfirmPaidModal] = useState<any>(null);
  const [payoutRefId, setPayoutRefId] = useState("");
  const [payoutRefNote, setPayoutRefNote] = useState("Đã chuyển tiền qua Payoneer thành công");
  const [adminLoggedIn, setAdminLoggedIn] = useState(true);

  const handleResetPassword = async (u: any) => {
    const newPw = window.prompt(`Đặt lại mật khẩu mới cho tài khoản ${u.email}:`, "123456");
    if (!newPw) return;
    setBusy(true);
    try {
      await action("user.reset_password", { userId: u.id, password: newPw });
      window.alert(`Đã đổi mật khẩu thành công cho ${u.email} thành: ${newPw}`);
      await reload();
    } catch (err: any) {
      window.alert(err.message || "Lỗi khi đổi mật khẩu.");
    } finally {
      setBusy(false);
    }
  };

  const nav = [
    { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { id: "conversions", label: "Duyệt đổi xu ($)", icon: RefreshCw },
    { id: "payouts", label: "Rút tiền Payoneer", icon: ArrowUpRight },
    { id: "plans", label: "Gói thành viên", icon: Crown },
    { id: "giftcodes", label: "Mã Giftcode", icon: Gift },
    { id: "tournaments", label: "Giải đấu kỹ năng", icon: Trophy },
    { id: "orders", label: "Đơn nạp & dịch vụ", icon: CreditCard },
    { id: "transfers", label: "Chuyển số dư P2P", icon: Send },
    { id: "users", label: "Người chơi", icon: Users },
    { id: "games", label: "Kho game", icon: Gamepad2 },
    { id: "policies", label: "Chính sách thị trường", icon: Globe },
    { id: "support", label: "Hỗ trợ", icon: MessageSquare },
    { id: "audit", label: "Nhật ký & sổ cái", icon: Activity },
    { id: "settings", label: "Cấu hình thanh toán", icon: Settings2 },
  ];

  const reload = async () => {
    const d = await call("overview");
    setData(d);
    setError("");
    return d;
  };

  useEffect(() => {
    reload().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  // Sync router with hash URL for direct subpage access and browser back/forward
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, "").split("/")[0];
      if (hash && (nav.some(n => n.id === hash) || hash === "giftcodes")) {
        setPage(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const run = async (action: string, input: unknown, success: string) => {
    setBusy(true);
    try {
      await call(action, input);
      await reload();
      setToast(success);
      return true;
    } catch (e: any) {
      setToast(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const navigate = (p: string) => {
    setPage(p);
    setQuery("");
    setMobile(false);
    window.location.hash = `#/${p}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const paid = (data?.orders || []).filter((o: any) => o.status === "paid");
  const gross = paid.reduce((a: number, o: any) => a + o.amount_cents, 0);
  const pending = (data?.payouts || []).filter((p: any) => ["pending", "approved"].includes(p.status));
  const search = (v: unknown) => JSON.stringify(v).toLowerCase().includes(query.toLowerCase());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d;
  });
  const chart = days.map(d => {
    const key = d.toISOString().slice(0, 10);
    return (data?.journals || []).filter((j: any) => j.reason === "game_reward" && new Date(j.created_at).toISOString().slice(0, 10) === key).length;
  });
  const max = Math.max(1, ...chart);

  if (!adminLoggedIn) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(circle at center, #151a24 0%, #080a0e 100%)", padding: 20
      }}>
        <div style={{
          maxWidth: 420, width: "100%", background: "#11141c", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "36px 30px", boxShadow: "0 25px 60px rgba(0,0,0,0.7)", textAlign: "center"
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%", background: "rgba(180,255,57,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
            color: "var(--lime)", border: "1px solid rgba(180,255,57,0.3)"
          }}>
            <ShieldCheck size={30} />
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 8px", letterSpacing: "1px" }}>JINQP CONTROL</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "0 0 24px" }}>
            Bảng điều khiển quản trị hệ thống game & giao dịch
          </p>
          <form onSubmit={e => { e.preventDefault(); setAdminLoggedIn(true); }}>
            <div style={{ marginBottom: 16, textAlign: "left" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: 6 }}>TÀI KHOẢN QUẢN TRỊ VIÊN</label>
              <input
                type="text"
                value="Admin JINQP (admin@nova.test)"
                readOnly
                style={{ width: "100%", padding: "11px 14px", background: "#181d28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "var(--text)", fontSize: "0.95rem" }}
              />
            </div>
            <button type="submit" className="btn lime" style={{ width: "100%", padding: "12px", fontSize: "1rem", fontWeight: 700, borderRadius: 8 }}>
              Đăng nhập Quản trị viên
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="control-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <button className="brand" onClick={() => navigate("overview")}>
          <span><Gamepad2 size={24} /></span>
          <div>JINQP <small>CONTROL</small></div>
        </button>

        <div className="workspace-tag">
          <ShieldCheck size={15} />
          <span>Quản trị độc lập</span>
          <i />
        </div>

        <span className="nav-caption">ĐIỀU HÀNH NỀN TẢNG</span>
        <nav>
          {nav.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)} className={`nav-item ${page === n.id ? "active" : ""}`}>
              <n.icon size={18} />
              {n.label}
              {n.id === "payouts" && pending.length > 0 && <span className="nav-count">{pending.length}</span>}
              {n.id === "tournaments" && <span className="new-dot" style={{ background: "var(--lime)" }} />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="environment">
            <span />
            <div>
              <strong>Môi trường thử nghiệm</strong>
              <small>Tiền thật đang tắt</small>
            </div>
          </div>
          <div className="profile">
            <span className="avatar">A</span>
            <div>
              <strong>Admin JINQP</strong>
              <span>Quản trị viên</span>
            </div>
            <button className="icon-button" onClick={() => setAdminLoggedIn(false)} title="Đăng xuất" style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4 }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div>
            <button className="icon-button mobile-only" aria-label="Mở menu" onClick={() => setMobile(!mobile)}>
              <Menu size={21} />
            </button>
            <span>JINQP Control</span>
            <ChevronRight size={14} />
            <strong>{nav.find(n => n.id === page)?.label}</strong>
          </div>
          <div>
            <span className="shared-db"><Database size={14} />Dữ liệu dùng chung</span>
            <button className="icon-button" aria-label="Làm mới dữ liệu" onClick={() => reload().catch(e => setToast(e.message))}>
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        <main>
          <div className="sandbox-banner">
            <Shield size={15} />
            <span>Bản thử nghiệm sandbox · Hai server độc lập kết nối database chung qua HMAC signed bridge.</span>
            <span className="live-lock">SANDBOX MODE</span>
          </div>

          <div className="page-heading">
            <div>
              <span className="eyebrow">JINQP WORKSPACE</span>
              <h1>{nav.find(n => n.id === page)?.label}</h1>
              <p>
                {page === "overview" ? "Tổng quan toàn bộ hoạt động, giao dịch và nhịp chơi của nền tảng." :
                 page === "tournaments" ? "Quản lý các giải đấu kỹ năng, lệ phí tham gia và quyết toán trao thưởng." :
                 page === "policies" ? "Ma trận chính sách theo quốc gia (Nghị định 147 VN, Đan Mạch, Thụy Điển, Anh, v.v.)." :
                 page === "transfers" ? "Lịch sử chuyển xu P2P giữa người chơi với đối soát sổ cái kép." :
                 page === "plans" ? "Thiết lập 9 gói dịch vụ và đặc quyền thành viên." :
                 page === "settings" ? "Quản lý thông tin thanh toán tham chiếu và trạng thái kết nối." :
                 "Theo dõi, kiểm tra và xử lý trên kho dữ liệu chung của hệ thống."}
              </p>
            </div>
            <button className="btn secondary" onClick={() => reload().catch(e => setToast(e.message))}>
              <RefreshCw size={15} />Đồng bộ dữ liệu
            </button>
          </div>

          {error && (
            <div className="error-banner">
              <CircleAlert size={19} />
              <span>{error}</span>
              <button onClick={() => reload().catch(e => setError(e.message))}>Thử lại</button>
            </div>
          )}

          {loading ? (
            <div className="loading"><Spinner />Đang kết nối kho dữ liệu…</div>
          ) : data && (
            <>
              {page === "overview" && (
                <>
                  <div className="stats-grid">
                    {[
                      { label: "Người chơi", value: num(data.users.length), icon: Users, note: "Tài khoản đã đăng ký", color: "violet" },
                      { label: "Giải đấu kỹ năng", value: num(data.stats.tournaments || data.tournaments.length), icon: Trophy, note: "Đang mở tranh tài", color: "amber" },
                      { label: "Xu đã thưởng", value: num(data.stats.earned), icon: Coins, note: "Từ game & giải đấu", color: "mint" },
                      { label: "Giao dịch P2P", value: num(data.stats.transfers || data.transfers.length), icon: Send, note: "Chuyển xu giữa người chơi", color: "rose" }
                    ].map(s => (
                      <article className="stat" key={s.label}>
                        <div>
                          <span>{s.label}</span>
                          <span className={`stat-icon ${s.color}`}><s.icon size={19} /></span>
                        </div>
                        <strong>{s.value}</strong>
                        <p>{s.note}</p>
                      </article>
                    ))}
                  </div>

                  <div className="overview-grid">
                    <section className="panel chart-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Nhịp chơi của nền tảng</h2>
                          <p>Lượt nhận thưởng hợp lệ trong 7 ngày qua</p>
                        </div>
                        <span className="pill">7 ngày qua</span>
                      </div>
                      <div className="chart">
                        <div className="chart-grid"><span /><span /><span /><span /></div>
                        {days.map((d, i) => (
                          <div className="bar-group" key={i}>
                            <span className="bar-value">{chart[i] || ""}</span>
                            <div className={`bar ${i === 6 ? "latest" : ""}`} style={{ height: `${Math.max(3, chart[i] / max * 150)}px` }} title={`${chart[i]} lượt thưởng`} />
                            <span>{d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
                          </div>
                        ))}
                      </div>
                      <div className="chart-footer">
                        <span><i />Lượt nhận thưởng game</span>
                        <span>{data.stats.plays} phiên chơi đã ghi nhận</span>
                      </div>
                    </section>

                    <section className="panel operation-panel">
                      <span className="eyebrow">TRẠNG THÁI VẬN HÀNH</span>
                      <h2>Hệ thống sẵn sàng.</h2>
                      <p>Kiến trúc hai server chuẩn Playhop + Sổ cái kép độc lập.</p>
                      <div className="operation-item"><Database size={18} /><span>Cơ sở dữ liệu chung (D1 SQLite)</span><span className="dot green" /></div>
                      <div className="operation-item"><Gamepad2 size={18} /><span>Kho game (6 engine)</span><strong>Đầy đủ 6 engine</strong></div>
                      <div className="operation-item"><Trophy size={18} /><span>Giải đấu kỹ năng</span><strong>{data.tournaments.filter((t: any) => t.status === "active").length} giải đang mở</strong></div>
                      <div className="operation-item"><Wallet size={18} /><span>Tỷ lệ quy đổi sandbox</span><strong>1.000 xu = $1</strong></div>
                      <div className="operation-item"><Shield size={18} /><span>Thanh toán tiền thật</span><strong className="amber-text">Đang khóa</strong></div>
                      <button className="btn secondary full" onClick={() => navigate("tournaments")}>
                        Quản lý giải đấu kỹ năng <ArrowRight size={15} />
                      </button>
                    </section>
                  </div>

                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Đơn nạp & dịch vụ gần đây</h2>
                        <p>Tổng giá trị mô phỏng đã xác nhận: {money(gross)}</p>
                      </div>
                      <button className="text-button" onClick={() => navigate("orders")}>Xem tất cả <ArrowRight size={15} /></button>
                    </div>
                    <OrdersTable orders={data.orders.slice(0, 5)} busy={busy} confirm={o => setDecision({ type: "order", item: o })} />
                  </section>
                </>
              )}

              {/* GIFTCODES MANAGEMENT */}
              {page === "giftcodes" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Quản lý Mã Giftcode</h2>
                      <p>Tạo mã quà tặng nhận xu cho người chơi, giới hạn lượt dùng và thời gian hiệu lực.</p>
                    </div>
                    <button className="btn lime small" onClick={() => setShowCreateGiftcode(true)}>
                      <Plus size={16} /> Tạo mã Giftcode mới
                    </button>
                  </div>

                  {(data?.giftCodes || []).length ? (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Mã Giftcode</th>
                            <th>Xu thưởng</th>
                            <th>Lượt dùng</th>
                            <th>Hạn sử dụng</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.giftCodes || []).map((gc: any) => (
                            <tr key={gc.id}>
                              <td>
                                <strong style={{ color: "var(--lime)", letterSpacing: "1px", fontSize: "1.05rem" }}>{gc.code}</strong>
                              </td>
                              <td><span className="pill" style={{ color: "var(--lime)", background: "rgba(180,255,57,0.1)" }}>+{num(gc.coins)} xu</span></td>
                              <td>
                                <strong>{gc.used_count}</strong> / {gc.max_uses} lượt
                              </td>
                              <td>{gc.expires_at ? date(gc.expires_at) : <span className="pill">Vô thời hạn</span>}</td>
                              <td>
                                <span className={`enabled ${gc.active ? "on" : ""}`}>
                                  {gc.active ? "Hoạt động" : "Đã khóa"}
                                </span>
                              </td>
                              <td><small>{date(gc.created_at)}</small></td>
                              <td>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    className="text-button"
                                    onClick={() => run("giftcode.toggle", { id: gc.id }, gc.active ? "Đã khóa mã quà tặng." : "Đã kích hoạt mã quà tặng.")}
                                    disabled={busy}
                                  >
                                    {gc.active ? "Khóa" : "Mở"}
                                  </button>
                                  <button
                                    className="text-button"
                                    style={{ color: "var(--red)" }}
                                    onClick={() => run("giftcode.delete", { id: gc.id }, "Đã xóa mã quà tặng.")}
                                    disabled={busy}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty message="Chưa có mã Giftcode nào. Hãy bấm nút tạo mã đầu tiên!" />
                  )}
                </section>
              )}

              {/* TOURNAMENTS MANAGEMENT */}
              {page === "tournaments" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Quản lý giải đấu kỹ năng</h2>
                      <p>Khởi tạo giải đấu, theo dõi số người tham gia và quyết toán trao thưởng.</p>
                    </div>
                    <button className="btn lime small" onClick={() => setShowCreateTourney(true)}>
                      <Plus size={16} /> Tạo giải đấu mới
                    </button>
                  </div>

                  {data.tournaments.length ? (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Giải đấu / Game</th>
                            <th>Lệ phí / Giải thưởng</th>
                            <th>Thời gian kết thúc</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.tournaments.map((t: any) => (
                            <tr key={t.id}>
                              <td>
                                <strong>{t.title}</strong>
                                <small>Game: {t.game_id.toUpperCase()} · #{t.id.slice(0, 8)}</small>
                              </td>
                              <td>
                                <strong>{num(t.prize_pool_coins)} xu thưởng</strong>
                                <small>Phí tham gia: {t.entry_fee_coins} xu</small>
                              </td>
                              <td>{date(t.end_time)}</td>
                              <td><Badge value={t.status} /></td>
                              <td>
                                {t.status === "active" && (
                                  <button
                                    className="btn tiny"
                                    disabled={busy}
                                    onClick={() => run("tournament.settle", { id: t.id }, `Đã quyết toán và chia thưởng cho giải ${t.title}`)}
                                  >
                                    Quyết toán giải
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty message="Chưa có giải đấu nào được tạo." />
                  )}
                </section>
              )}

              {/* COUNTRY POLICIES MATRIX */}
              {page === "policies" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Chính sách thị trường theo quốc gia</h2>
                      <p>Quản lý các cờ tính năng tuân thủ quy định địa phương (Doc 03 & 04).</p>
                    </div>
                  </div>

                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Quốc gia</th>
                          <th>Chơi game</th>
                          <th>Nạp xu</th>
                          <th>Thi đấu kỹ năng</th>
                          <th>Chuyển P2P</th>
                          <th>Rút tiền</th>
                          <th>Ghi chú pháp lý</th>
                          <th>Lưu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.countryPolicies.map((cp: any) => (
                          <PolicyRow key={cp.country_code} policy={cp} onSave={(updated: any) => run("policy.save", updated, `Đã cập nhật chính sách cho ${cp.name}`)} busy={busy} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* TRANSFERS LOG */}
              {page === "transfers" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Lịch sử chuyển xu P2P giữa người chơi</h2>
                      <p>Bút toán sổ cái kép đảm bảo tính nguyên tử giữa hai tài khoản.</p>
                    </div>
                    <SearchBox query={query} setQuery={setQuery} />
                  </div>

                  {data.transfers.filter(search).length ? (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Người gửi</th>
                            <th>Người nhận</th>
                            <th>Số xu</th>
                            <th>Lời nhắn</th>
                            <th>Thời điểm</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.transfers.filter(search).map((t: any) => (
                            <tr key={t.id}>
                              <td><strong>{t.sender_name || t.sender_id.slice(0, 8)}</strong></td>
                              <td><strong>{t.recipient_name || t.recipient_email}</strong></td>
                              <td><strong style={{ color: "var(--lime)" }}>{num(t.coins)} xu</strong></td>
                              <td><small>{t.note || "—"}</small></td>
                              <td><small>{date(t.created_at)}</small></td>
                              <td><Badge value={t.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty message="Chưa có giao dịch chuyển xu P2P." />
                  )}
                </section>
              )}

              {page === "plans" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div className="info-box" style={{ flex: 1, margin: 0 }}>
                      <SlidersHorizontal size={19} />
                      <p>Thay đổi được lưu trong database chung và áp dụng cho đơn mới. Quyền lợi của đơn đã mua được giữ theo phiên bản lúc xác nhận.</p>
                    </div>
                    <button
                      className="btn lime"
                      style={{ marginLeft: 16, whiteSpace: "nowrap", padding: "10px 18px", fontWeight: 700 }}
                      onClick={() => {
                        setGrantUserId("");
                        setShowGrantModal(true);
                      }}
                    >
                      <Crown size={16} /> Cấp gói thành viên thủ công
                    </button>
                  </div>
                  <div className="plan-matrix">
                    {["bronze", "gold", "diamond"].map(t => {
                      const Icon = t === "bronze" ? Shield : t === "gold" ? Crown : Gem;
                      return (
                        <section key={t} className={`tier-column ${t}`}>
                          <div className="tier-heading">
                            <span><Icon size={23} /></span>
                            <div>
                              <small>THÀNH VIÊN JINQP</small>
                              <h2>{tiers[t]}</h2>
                            </div>
                          </div>
                          {["week", "month", "year"].map(period => {
                            const p = data.plans.find((x: Plan) => x.id === `${t}-${period}`);
                            return p && (
                              <article className="plan-config" key={p.id}>
                                <div>
                                  <span>Gói {periods[period]}</span>
                                  <span className={`enabled ${p.active ? "on" : ""}`}>{p.active ? "Đang mở" : "Tạm đóng"}</span>
                                </div>
                                <strong>{money(p.price_cents)}<small>/ {periods[period].toLowerCase()}</small></strong>
                                <dl>
                                  <div><dt>Hệ số thưởng</dt><dd>x{p.multiplier_bps / 10000}</dd></div>
                                  <div><dt>Hạn mức ngày</dt><dd>{num(p.daily_cap)} xu</dd></div>
                                  <div><dt>Hạn mức phiên</dt><dd>{num(p.session_cap)} xu</dd></div>
                                </dl>
                                <span className="perks-preview">{p.perks.length} đặc quyền · Phiên bản {p.revision}</span>
                                <button className="btn secondary full" onClick={() => setEdit(p)}>
                                  <Settings2 size={14} />Chỉnh sửa gói
                                </button>
                              </article>
                            );
                          })}
                        </section>
                      );
                    })}
                  </div>
                </>
              )}

              {page === "orders" && (
                <section className="panel">
                  <div className="table-toolbar">
                    <div className="tab-group">
                      {[["all", "Tất cả"], ["pending", "Chờ xác nhận"], ["paid", "Hoàn tất"]].map(([v, l]) => (
                        <button key={v} className={orderFilter === v ? "selected" : ""} onClick={() => setOrderFilter(v)}>{l}</button>
                      ))}
                    </div>
                    <SearchBox query={query} setQuery={setQuery} />
                  </div>
                  <OrdersTable
                    orders={data.orders.filter((o: any) => (orderFilter === "all" || o.status === orderFilter) && search(o))}
                    busy={busy}
                    confirm={o => setDecision({ type: "order", item: o })}
                  />
                </section>
              )}

              {/* COIN TO USD CONVERSIONS APPROVAL */}
              {page === "conversions" && (
                <>
                  <div className="mini-stats">
                    <div><span>Chờ duyệt</span><strong>{(data.conversions || []).filter((c: any) => c.status === "pending").length}</strong></div>
                    <div><span>Xu chờ quy đổi</span><strong style={{ color: "var(--amber)" }}>{num((data.conversions || []).filter((c: any) => c.status === "pending").reduce((a: number, c: any) => a + c.coins, 0))} xu</strong></div>
                    <div><span>USD chuyển vào Ví Chính</span><strong style={{ color: "var(--lime)" }}>{money((data.conversions || []).filter((c: any) => c.status === "pending").reduce((a: number, c: any) => a + c.usd_cents, 0))}</strong></div>
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Duyệt quy đổi xu sang Ví Chính ($)</h2>
                        <p>Người chơi yêu cầu đổi xu ảo sang số dư USD trên hệ thống JINQP (Tỷ lệ: 1.000 xu = $1.00 USD, Phí nạp/đổi: 0% Free).</p>
                      </div>
                      <SearchBox query={query} setQuery={setQuery} />
                    </div>
                    {(data.conversions || []).filter(search).length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Thời gian / Mã đơn</th>
                              <th>Người chơi</th>
                              <th>Số xu đổi (Ví Xu)</th>
                              <th>USD nhận (Ví Chính)</th>
                              <th>Tỷ lệ quy đổi</th>
                              <th>Trạng thái</th>
                              <th>Xử lý</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data.conversions || []).filter(search).map((c: any) => (
                              <tr key={c.id}>
                                <td>
                                  <strong>#{c.id.slice(0, 8)}</strong>
                                  <small>{date(c.created_at)}</small>
                                </td>
                                <td>
                                  <strong>{c.user_name || "Người chơi"}</strong>
                                  <small>{c.user_email}</small>
                                </td>
                                <td><strong style={{ color: "var(--amber)", fontSize: "1.05em" }}>{num(c.coins)} xu</strong></td>
                                <td><strong style={{ color: "var(--lime)", fontSize: "1.05em" }}>{money(c.usd_cents)}</strong></td>
                                <td><span className="pill">1.000 xu = $1.00</span></td>
                                <td><Badge value={c.status} /></td>
                                <td>
                                  {c.status === "pending" ? (
                                    <div className="row-actions">
                                      <button
                                        className="btn tiny lime"
                                        disabled={busy}
                                        onClick={async () => {
                                          if (window.confirm(`Xác nhận DUYỆT đổi ${num(c.coins)} xu sang ${money(c.usd_cents)} vào Ví Chính cho ${c.user_email}?`)) {
                                            await run("conversion.decision", { id: c.id, decision: "approve" }, "Đã duyệt quy đổi xu sang USD thành công!");
                                          }
                                        }}
                                      >
                                        Duyệt đổi
                                      </button>
                                      <button
                                        className="text-button danger"
                                        disabled={busy}
                                        onClick={async () => {
                                          const reason = window.prompt("Lý do từ chối quy đổi (xu sẽ hoàn trả lại Ví Xu):", "Không đủ điều kiện quy đổi");
                                          if (reason !== null) {
                                            await run("conversion.decision", { id: c.id, decision: "reject", note: reason }, "Đã từ chối và hoàn trả xu về Ví Xu.");
                                          }
                                        }}
                                      >
                                        Từ chối
                                      </button>
                                    </div>
                                  ) : (
                                    <small style={{ color: "var(--muted)" }}>{c.admin_note || "Đã xử lý"}</small>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty message="Chưa có yêu cầu quy đổi xu nào." />
                    )}
                  </section>
                </>
              )}

              {/* PAYOUT REQUESTS TO PAYONEER */}
              {page === "payouts" && (
                <>
                  <div className="mini-stats">
                    <div><span>Chờ thanh toán</span><strong>{data.payouts.filter((p: any) => p.status === "pending").length}</strong></div>
                    <div><span>Tổng USD rút (Gross)</span><strong>{money(data.payouts.filter((p: any) => p.status === "pending").reduce((a: number, p: any) => a + p.usd_cents, 0))}</strong></div>
                    <div><span>Phí rút 15% (Hệ thống)</span><strong style={{ color: "var(--amber)" }}>{money(data.payouts.filter((p: any) => p.status === "pending").reduce((a: number, p: any) => a + (p.fee_cents || Math.round(p.usd_cents * 0.15)), 0))}</strong></div>
                    <div><span>Thực chuyển Payoneer (85%)</span><strong style={{ color: "var(--lime)" }}>{money(data.payouts.filter((p: any) => p.status === "pending").reduce((a: number, p: any) => a + (p.net_cents || (p.usd_cents - Math.round(p.usd_cents * 0.15))), 0))}</strong></div>
                  </div>

                  <div className="info-box" style={{ marginBottom: 16 }}>
                    <ShieldCheck size={20} style={{ color: "var(--lime)", flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: "var(--text)" }}>Quy chuẩn kiểm tra và chi trả tiền thật qua Payoneer:</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.5 }}>
                        • Các số liệu trên web là điểm số và số dư nội bộ. Tiền thật chỉ tồn tại trong tài khoản Payoneer.<br />
                        • Admin kiểm tra email Payoneer của người nhận, đăng nhập ví Payoneer của admin và chuyển đúng <strong>Thực nhận Payoneer (85%)</strong>.<br />
                        • Bấm <strong>"Xác nhận đã chuyển"</strong>, nhập mã GD Payoneer để hệ thống lưu sổ cái và gửi thông báo hoàn tất đến tài khoản người chơi.
                      </p>
                    </div>
                  </div>

                  <section className="panel">
                    <div className="panel-heading"><h2>Yêu cầu rút tiền về ví Payoneer</h2><SearchBox query={query} setQuery={setQuery} /></div>
                    {data.payouts.filter(search).length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Thời gian / Mã</th>
                              <th>Người chơi</th>
                              <th>Tổng rút (Gross)</th>
                              <th>Phí rút (15%)</th>
                              <th>Thực chuyển Payoneer</th>
                              <th>Liên kết ví Payoneer nhận</th>
                              <th>Trạng thái</th>
                              <th>Xử lý</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.payouts.filter(search).map((p: any) => {
                              const fee = p.fee_cents || Math.round(p.usd_cents * 0.15);
                              const net = p.net_cents || (p.usd_cents - fee);
                              return (
                                <tr key={p.id}>
                                  <td>
                                    <strong>#{p.id.slice(0, 8)}</strong>
                                    <small>{date(p.created_at)}</small>
                                  </td>
                                  <td>
                                    <strong>{(p.user_name || "").split("@")[0]}</strong>
                                    <small>#{p.user_id?.slice(0, 8)}</small>
                                  </td>
                                  <td><strong>{money(p.usd_cents)}</strong></td>
                                  <td><span style={{ color: "var(--rose)", fontWeight: 600 }}>-{money(fee)}</span></td>
                                  <td><strong style={{ color: "var(--lime)", fontSize: "1.1em" }}>{money(net)}</strong></td>
                                  <td>
                                    <a
                                      href={p.recipient?.startsWith("http") ? p.recipient : `https://${p.recipient}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: "var(--lime)", textDecoration: "underline", wordBreak: "break-all", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                    >
                                      {p.recipient} <ExternalLink size={12} />
                                    </a>
                                    <small>Link ví nhận của người chơi</small>
                                  </td>
                                  <td><Badge value={p.status} /></td>
                                  <td>
                                    {p.status === "pending" || p.status === "approved" ? (
                                      <div className="row-actions">
                                        <button
                                          className="btn tiny lime"
                                          disabled={busy}
                                          onClick={() => setConfirmPaidModal(p)}
                                        >
                                          Xác nhận đã chuyển
                                        </button>
                                        <button
                                          className="text-button danger"
                                          disabled={busy}
                                          onClick={async () => {
                                            const reason = window.prompt("Lý do từ chối rút tiền (USD sẽ được hoàn trả lại Ví Chính):", "Thông tin Payoneer chưa chính xác");
                                            if (reason !== null) {
                                              await run("payout.decision", { id: p.id, decision: "reject", note: reason }, "Đã từ chối lệnh rút và hoàn trả $ về Ví Chính.");
                                            }
                                          }}
                                        >
                                          Từ chối
                                        </button>
                                      </div>
                                    ) : (
                                      <div>
                                        <small style={{ color: "var(--lime)" }}>Mã GD: {p.external_ref || "N/A"}</small>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty message="Chưa có yêu cầu rút nào." />
                    )}
                  </section>
                </>
              )}

              {page === "users" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Người chơi của JINQP</h2>
                      <p>Quản lý tài khoản, Ví Xu, Ví Chính ($), liên kết Payoneer và quyền thành viên.</p>
                    </div>
                    <SearchBox query={query} setQuery={setQuery} />
                  </div>
                  {data.users.filter(search).length ? (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Người chơi</th>
                            <th>Cấp độ</th>
                            <th>Ví Xu (Coins)</th>
                            <th>Ví Chính ($ USD)</th>
                            <th>Ví Payoneer liên kết</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.users.filter(search).map((u: any) => (
                            <tr key={u.id}>
                              <td>
                                <strong>{u.name.split("@")[0]}</strong>
                                <small>{u.email} · #{u.id.slice(0, 8)}</small>
                              </td>
                              <td>
                                <strong style={{ color: "var(--lime)" }}>Lv. {u.level || 1}</strong>
                                <small>{((u.play_time_seconds || 0) / 3600).toFixed(1)}h chơi</small>
                              </td>
                              <td>
                                <strong style={{ color: "var(--amber)" }}>{num(u.available || 0)} xu</strong>
                                <small>Đang giữ: {num(u.held || 0)} xu</small>
                              </td>
                              <td>
                                <strong style={{ color: "var(--lime)" }}>{money(u.main_usd || 0)}</strong>
                                <small>Đang giữ: {money(u.main_usd_held || 0)}</small>
                              </td>
                              <td>
                                {u.payoneer_email ? (
                                  <a
                                    href={u.payoneer_email.startsWith("http") ? u.payoneer_email : `https://${u.payoneer_email}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "var(--lime)", textDecoration: "underline", wordBreak: "break-all", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                  >
                                    {u.payoneer_email} <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  <small style={{ color: "var(--muted)" }}>Chưa liên kết</small>
                                )}
                              </td>
                              <td><span className={`enabled ${!u.banned ? "on" : ""}`}>{u.banned ? "Tạm khóa" : "Hoạt động"}</span></td>
                              <td>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  <button
                                    className="btn tiny lime"
                                    onClick={() => {
                                      setGrantUserId(u.id);
                                      setShowGrantModal(true);
                                    }}
                                    title="Cấp gói thành viên thủ công cho tài khoản này"
                                  >
                                    👑 Cấp VIP
                                  </button>
                                  <button className="text-button" onClick={() => setAdjustUserModal(u)} title="Cộng giờ chơi hoặc xu nạp để test tăng cấp">
                                    + Cấp/Xu
                                  </button>
                                  <button className="text-button" onClick={() => handleResetPassword(u)} title="Đặt lại mật khẩu cho tài khoản">
                                    Đổi MK
                                  </button>
                                  <button className="text-button" onClick={() => setDecision({ type: "user", item: u })} disabled={busy}>
                                    {u.banned ? "Mở khóa" : "Tạm khóa"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <Empty />}
                </section>
              )}

              {page === "games" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Danh mục trò chơi ({data.games.length})</h2>
                      <p>Cả 6 trò chơi đều đã có engine chơi trực tiếp trên trình duyệt.</p>
                    </div>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr><th>Game</th><th>Thể loại</th><th>Engine</th><th>Thưởng cơ sở</th><th>Hiển thị</th></tr>
                      </thead>
                      <tbody>
                        {data.games.map((g: any) => (
                          <tr key={g.id}>
                            <td><strong>{g.title}</strong><small>{g.subtitle}</small></td>
                            <td>{g.category}</td>
                            <td><span className="enabled on">{g.engine ? "Có thể chơi" : "Sắp ra mắt"}</span></td>
                            <td>{num(g.base_reward)} xu</td>
                            <td>
                              <button
                                className={`switch ${g.active ? "on" : ""}`}
                                role="switch"
                                aria-checked={!!g.active}
                                aria-label={`Hiển thị ${g.title}`}
                                disabled={busy}
                                onClick={() => run("game.toggle", { id: g.id, active: !g.active }, "Đã cập nhật danh mục game.")}
                              >
                                <span />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {page === "support" && (
                <section className="panel">
                  <div className="panel-heading"><h2>Yêu cầu hỗ trợ</h2><SearchBox query={query} setQuery={setQuery} /></div>
                  {data.tickets.filter(search).length ? (
                    data.tickets.filter(search).map((t: any) => (
                      <article key={t.id} className="support-ticket">
                        <div><Badge value={t.status} /><span>{date(t.created_at)}</span></div>
                        <h3>{t.subject}</h3>
                        <small>{t.user_name}</small>
                        <p>{t.message}</p>
                        {t.reply && <blockquote>{t.reply}</blockquote>}
                        <button className="btn secondary small" onClick={() => { setTicket(t); setReply(t.reply || ""); }}>
                          Phản hồi <ArrowRight size={14} />
                        </button>
                      </article>
                    ))
                  ) : <Empty message="Hộp thư hỗ trợ đang trống." />}
                </section>
              )}

              {page === "audit" && (
                <>
                  <div className="info-box">
                    <ShieldCheck size={19} />
                    <p>Sổ cái kép tự động cân đối và bảo vệ bằng ràng buộc database. Mọi biến động số dư đều có bút toán Nợ (Debit) / Có (Credit) nguyên tử.</p>
                  </div>
                  <section className="panel">
                    <div className="panel-heading"><h2>Nhật ký thao tác hệ thống</h2><SearchBox query={query} setQuery={setQuery} /></div>
                    {data.audit.filter(search).length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr><th>Thời điểm</th><th>Thao tác</th><th>Người thực hiện</th><th>Đối tượng</th></tr>
                          </thead>
                          <tbody>
                            {data.audit.filter(search).map((a: any) => (
                              <tr key={a.id}>
                                <td>{date(a.created_at)}</td>
                                <td><code>{a.action}</code></td>
                                <td><small title={a.actor}>{a.actor.startsWith("admin:") ? "Quản trị viên" : a.actor === "sandbox-provider" ? "Đối tác mô phỏng" : "Người chơi"}</small></td>
                                <td><code>{a.target.slice(0, 30)}</code></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <Empty />}
                  </section>
                  <section className="panel">
                    <div className="panel-heading"><h2>Giao dịch sổ cái kép (Journals)</h2><span className="pill">Chỉ đọc</span></div>
                    {data.journals.length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr><th>Thời điểm</th><th>Nghiệp vụ</th><th>Đơn vị</th><th>Trạng thái</th><th>Mã tham chiếu</th></tr>
                          </thead>
                          <tbody>
                            {data.journals.map((j: any) => (
                              <tr key={j.id}>
                                <td>{date(j.created_at)}</td>
                                <td><code>{j.reason}</code></td>
                                <td>{j.unit}</td>
                                <td><span className="enabled on">Đã ghi sổ</span></td>
                                <td><code>{j.reference.slice(0, 27)}…</code></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <Empty />}
                  </section>
                </>
              )}

              {page === "settings" && <PaymentSettings config={data.paymentConfig} run={run} busy={busy} />}
            </>
          )}

          <footer>
            <strong>JINQP CONTROL</strong>
            <span>Hai ứng dụng riêng · Một kho dữ liệu chung · Chuẩn đặc tả 13/11/2026</span>
            <small>© 2026 JINQP Gaming Center</small>
          </footer>
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          <CircleAlert size={18} />
          {toast}
          <button aria-label="Đóng thông báo" onClick={() => setToast("")}><X size={16} /></button>
        </div>
      )}

      {showCreateTourney && (
        <CreateTournamentModal
          close={() => setShowCreateTourney(false)}
          games={data?.games || []}
          onSave={async (input) => {
            const ok = await run("tournament.create", input, "Đã khởi tạo giải đấu mới!");
            if (ok) setShowCreateTourney(false);
          }}
          busy={busy}
        />
      )}

      {showCreateGiftcode && (
        <Modal title="Tạo mã Giftcode mới" close={() => setShowCreateGiftcode(false)}>
          <div style={{ padding: "16px 20px" }}>
            <div className="form-group">
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>MÃ GIFTCODE</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="VD: JINQP2026..."
                  value={giftcodeForm.code}
                  onChange={e => setGiftcodeForm({ ...giftcodeForm, code: e.target.value.toUpperCase() })}
                  style={{ flex: 1, padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontWeight: 700 }}
                />
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => setGiftcodeForm({ ...giftcodeForm, code: "JINQP" + Math.floor(1000 + Math.random() * 9000) })}
                >
                  Ngẫu nhiên
                </button>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>SỐ XU THƯỞNG (COIN)</label>
              <input
                type="number"
                min="10"
                step="100"
                value={giftcodeForm.coins}
                onChange={e => setGiftcodeForm({ ...giftcodeForm, coins: Math.max(10, parseInt(e.target.value) || 0) })}
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
              />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>SỐ LƯỢT DÙNG TỐI ĐA (TOÀN HỆ THỐNG)</label>
              <input
                type="number"
                min="1"
                value={giftcodeForm.maxUses}
                onChange={e => setGiftcodeForm({ ...giftcodeForm, maxUses: Math.max(1, parseInt(e.target.value) || 1) })}
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
              />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>THỜI HẠN SỬ DỤNG (SỐ NGÀY, 0 = VÔ THỜI HẠN)</label>
              <input
                type="number"
                min="0"
                value={giftcodeForm.expiresDays}
                onChange={e => setGiftcodeForm({ ...giftcodeForm, expiresDays: Math.max(0, parseInt(e.target.value) || 0) })}
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
              />
            </div>
            <div className="modal-actions" style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn secondary" onClick={() => setShowCreateGiftcode(false)}>Hủy</button>
              <button
                className="btn lime"
                disabled={busy || !giftcodeForm.code.trim()}
                onClick={async () => {
                  const ok = await run("giftcode.create", giftcodeForm, "Đã tạo mã Giftcode thành công!");
                  if (ok) {
                    setShowCreateGiftcode(false);
                    setGiftcodeForm({ code: "", coins: 1000, maxUses: 100, expiresDays: 30 });
                  }
                }}
              >
                Tạo mã Giftcode
              </button>
            </div>
          </div>
        </Modal>
      )}

      {adjustUserModal && (
        <Modal title={`Điều chỉnh Cấp độ & Giờ chơi: ${adjustUserModal.name}`} close={() => setAdjustUserModal(null)}>
          <div style={{ padding: "16px 20px" }}>
            <p style={{ color: "var(--muted)", marginBottom: 14, fontSize: "0.88rem", lineHeight: 1.5 }}>
              Quy tắc tăng cấp: Cứ 10h chơi game tăng 1 cấp. Để mở mốc cấp 10, 20, 30, 50, 100... người dùng cần nạp đủ số xu (Cấp × 1.000 xu).
            </p>
            <div className="form-group">
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>CỘNG THÊM GIỜ CHƠI (GIỜ)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={adjustHours}
                onChange={e => setAdjustHours(parseFloat(e.target.value) || 0)}
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
              />
              <small style={{ color: "var(--muted)", display: "block", marginTop: 4 }}>Nhập 10 để tăng 1 cấp (10h chơi game)</small>
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>CỘNG THÊM XU ĐÃ MUA / NẠP (COIN)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={adjustCoins}
                onChange={e => setAdjustCoins(parseInt(e.target.value) || 0)}
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
              />
              <small style={{ color: "var(--muted)", display: "block", marginTop: 4 }}>Cần 10.000 xu để mở cấp 10; 50.000 xu để mở cấp 50 (Rút Payoneer)</small>
            </div>
            <div className="modal-actions" style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn secondary" onClick={() => setAdjustUserModal(null)}>Hủy</button>
              <button
                className="btn lime"
                disabled={busy}
                onClick={async () => {
                  const ok = await run("user.adjust_level", {
                    userId: adjustUserModal.id,
                    addHours: adjustHours,
                    addCoins: adjustCoins
                  }, "Đã cập nhật tiến trình cấp độ người chơi!");
                  if (ok) setAdjustUserModal(null);
                }}
              >
                Cập nhật cấp & xu
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: GRANT MEMBERSHIP MANUALLY */}
      {showGrantModal && (
        <Modal title="👑 Cấp gói thành viên thủ công cho Người chơi" close={() => setShowGrantModal(false)}>
          <div style={{ padding: "16px 20px" }}>
            <p style={{ color: "var(--muted)", marginBottom: 14, fontSize: "0.88rem", lineHeight: 1.5 }}>
              Cấp quyền thành viên đặc quyền trực tiếp từ Ban Quản Trị mà không cần qua quy trình thanh toán.
            </p>
            <div className="form-group">
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>CHỌN NGƯỜI CHƠI NHẬN GÓI</label>
              <select
                value={grantUserId}
                onChange={e => setGrantUserId(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
              >
                <option value="">-- Chọn tài khoản người chơi --</option>
                {(data?.users || []).map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) - Lv.{u.level || 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>CHỌN GÓI THÀNH VIÊN</label>
              <select
                value={grantPlanId}
                onChange={e => setGrantPlanId(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
              >
                <option value="bronze-month">Gói Đồng (Bronze) - 1 Tháng</option>
                <option value="bronze-year">Gói Đồng (Bronze) - 1 Năm</option>
                <option value="gold-month">Gói Vàng (Gold) - 1 Tháng (VIP)</option>
                <option value="gold-year">Gói Vàng (Gold) - 1 Năm (VIP)</option>
                <option value="diamond-month">Gói Kim Cương (Diamond) - 1 Tháng (PRO)</option>
                <option value="diamond-year">Gói Kim Cương (Diamond) - 1 Năm (PRO)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>GHI CHÚ / LÝ DO CẤP GÓI</label>
              <input
                type="text"
                value={grantNote}
                onChange={e => setGrantNote(e.target.value)}
                placeholder="VD: Tri ân người chơi VIP, giải thưởng sự kiện..."
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
              />
            </div>
            <div className="modal-actions" style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn secondary" onClick={() => setShowGrantModal(false)}>Hủy</button>
              <button
                className="btn lime"
                disabled={busy || !grantUserId}
                onClick={async () => {
                  const ok = await run("membership.grant", {
                    userId: grantUserId,
                    planId: grantPlanId,
                    note: grantNote
                  }, "Đã cấp gói thành viên thủ công thành công cho người chơi!");
                  if (ok) {
                    setShowGrantModal(false);
                    setGrantUserId("");
                  }
                }}
              >
                👑 Kích hoạt gói thành viên
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CONFIRM PAYOUT PAID VIA PAYONEER */}
      {confirmPaidModal && (
        <Modal title="Xác nhận đã chuyển tiền qua Payoneer" close={() => setConfirmPaidModal(null)}>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ background: "rgba(180, 248, 86, 0.08)", border: "1px solid rgba(180, 248, 86, 0.2)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Liên kết ví Payoneer nhận tiền của người chơi:</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--lime)", marginTop: 2, wordBreak: "break-all" }}>
                <a href={confirmPaidModal.recipient?.startsWith("http") ? confirmPaidModal.recipient : `https://${confirmPaidModal.recipient}`} target="_blank" rel="noreferrer" style={{ color: "var(--lime)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {confirmPaidModal.recipient} <ExternalLink size={14} />
                </a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
                <span>Tổng rút: <strong>{money(confirmPaidModal.usd_cents)}</strong></span>
                <span>Phí 15%: <strong style={{ color: "var(--rose)" }}>-{money(confirmPaidModal.fee_cents || Math.round(confirmPaidModal.usd_cents * 0.15))}</strong></span>
                <span>Thực chuyển Payoneer: <strong style={{ color: "var(--lime)", fontSize: "1.05em" }}>{money(confirmPaidModal.net_cents || (confirmPaidModal.usd_cents - Math.round(confirmPaidModal.usd_cents * 0.15)))}</strong></span>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>MÃ GIAO DỊCH PAYONEER (TRANSACTION ID) *</label>
              <input
                type="text"
                placeholder="VD: PAY-82910482 hoặc mã ID Payoneer..."
                value={payoutRefId}
                onChange={e => setPayoutRefId(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontWeight: 600 }}
              />
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", color: "var(--muted)" }}>GHI CHÚ GỬI NGƯỜI CHƠI</label>
              <input
                type="text"
                value={payoutRefNote}
                onChange={e => setPayoutRefNote(e.target.value)}
                placeholder="VD: Đã chuyển tiền qua Payoneer thành công"
                style={{ width: "100%", padding: "10px 12px", background: "var(--card-sub)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
              />
            </div>

            <div className="modal-actions" style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn secondary" onClick={() => setConfirmPaidModal(null)}>Hủy</button>
              <button
                className="btn lime"
                disabled={busy || !payoutRefId.trim()}
                onClick={async () => {
                  const ok = await run("payout.decision", {
                    id: confirmPaidModal.id,
                    decision: "confirm_paid",
                    externalRef: payoutRefId.trim(),
                    note: payoutRefNote.trim()
                  }, "Đã xác nhận thanh toán Payoneer thành công và gửi thông báo cho người chơi!");
                  if (ok) {
                    setConfirmPaidModal(null);
                    setPayoutRefId("");
                    setPayoutRefNote("Đã chuyển tiền qua Payoneer thành công");
                  }
                }}
              >
                Xác nhận đã chuyển thành công
              </button>
            </div>
          </div>
        </Modal>
      )}

      {edit && (
        <PlanEditor
          plan={edit}
          close={() => setEdit(null)}
          save={async p => {
            const ok = await run("plan.save", p, "Đã lưu gói. Website người dùng sẽ đọc cấu hình mới.");
            if (ok) setEdit(null);
          }}
          busy={busy}
        />
      )}

      {decision && (
        <Modal
          title={
            decision.type === "order" ? "Xác nhận đơn thử nghiệm" :
            decision.type === "user" ? "Thay đổi trạng thái tài khoản" :
            "Xử lý yêu cầu rút"
          }
          close={() => setDecision(null)}
        >
          <div className="modal-body">
            <Shield size={30} />
            <h2>
              {decision.type === "order" ? "Kích hoạt đơn thử nghiệm?" :
               decision.type === "user" ? (decision.item.banned ? "Mở lại tài khoản?" : "Tạm khóa tài khoản?") :
               decision.decision === "approve" ? "Duyệt yêu cầu rút?" :
               decision.decision === "reject" ? "Từ chối và hoàn xu?" :
               "Mô phỏng chi trả thành công?"}
            </h2>
            <p>
              {decision.type === "order" ? "Thao tác mô phỏng đã nhận tiền và cập nhật số dư hoặc thành viên theo đúng nghiệp vụ." :
               decision.type === "user" ? "Tài khoản tạm khóa không thể tiếp tục ghi thưởng hoặc tạo yêu cầu mới." :
               decision.decision === "reject" ? "Xu đang giữ sẽ trở lại số dư khả dụng đúng một lần qua sổ cái." :
               decision.decision === "simulate_paid" ? "Đối tác mô phỏng sẽ xác nhận kết quả và tất toán xu đang giữ." :
               "Yêu cầu chuyển sang trạng thái đã duyệt."}
            </p>
            {decision.type !== "user" && (
              <div className="confirm-amount">
                <span>#{decision.item.id.slice(0, 8)}</span>
                <strong>{money(decision.item.amount_cents || decision.item.usd_cents)}</strong>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setDecision(null)}>Quay lại</button>
              <button
                className="btn primary"
                disabled={busy}
                onClick={async () => {
                  const ok = decision.type === "order"
                    ? await run("order.simulate", { id: decision.item.id }, "Đã xác nhận đơn thử nghiệm.")
                    : decision.type === "user"
                    ? await run("user.toggle", { id: decision.item.id, banned: !decision.item.banned }, "Đã cập nhật trạng thái tài khoản.")
                    : await run("payout.decision", { id: decision.item.id, decision: decision.decision }, "Đã xử lý yêu cầu rút thử nghiệm.");
                  if (ok) setDecision(null);
                }}
              >
                {busy ? <Spinner /> : <Check size={16} />} Xác nhận
              </button>
            </div>
          </div>
        </Modal>
      )}

      {ticket && (
        <Modal title="Phản hồi người chơi" close={() => setTicket(null)}>
          <form className="modal-body" onSubmit={async e => {
            e.preventDefault();
            if (await run("ticket.reply", { id: ticket.id, reply }, "Đã gửi phản hồi.")) setTicket(null);
          }}>
            <h2>{ticket.subject}</h2>
            <p>{ticket.message}</p>
            <label>Nội dung phản hồi
              <textarea rows={5} value={reply} onChange={e => setReply(e.target.value)} minLength={1} maxLength={2000} required />
            </label>
            <button className="btn primary full" disabled={busy}>
              {busy ? <Spinner /> : <MessageSquare size={16} />} Lưu & gửi phản hồi
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SearchBox({ query, setQuery }: { query: string; setQuery: (s: string) => void }) {
  return (
    <div className="table-search">
      <Search size={15} />
      <input aria-label="Tìm trong danh sách" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm trong danh sách…" />
    </div>
  );
}

function OrdersTable({ orders, busy, confirm }: { orders: any[]; busy: boolean; confirm: (o: any) => void }) {
  return orders.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Đơn / người chơi</th>
            <th>Loại đơn</th>
            <th>Giá trị mẫu</th>
            <th>Trạng thái</th>
            <th>Xử lý</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => {
            const isTopup = o.plan_id.startsWith("topup-");
            return (
              <tr key={o.id}>
                <td>
                  <strong>{o.user_name.split("@")[0]}</strong>
                  <small>#{o.id.slice(0, 8)} · {date(o.created_at)}</small>
                </td>
                <td>
                  <span className={`tier-badge ${isTopup ? "gold" : o.plan_id.split("-")[0]}`}>
                    {isTopup ? "Nạp xu số dư" : tiers[o.plan_id.split("-")[0]]}
                  </span>
                  <small>{isTopup ? o.plan_id : `Gói ${periods[o.plan_id.split("-")[1]]}`}</small>
                </td>
                <td>
                  <strong>{money(o.amount_cents)}</strong>
                  <small>{o.method === "qr" ? "Mã QR" : "Link ví"}</small>
                </td>
                <td><Badge value={o.status} /></td>
                <td>
                  {o.status === "pending" && (
                    <button
                      className="btn tiny"
                      disabled={busy || o.expires_at < Date.now()}
                      onClick={() => confirm(o)}
                    >
                      {o.expires_at < Date.now() ? "Hết hạn" : "Xác nhận thử"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty message="Chưa có đơn nào. Đơn được tạo từ website người dùng sẽ xuất hiện tại đây." />
  );
}

function PolicyRow({ policy, onSave, busy }: { policy: any; onSave: (u: any) => Promise<boolean>; busy: boolean }) {
  const [play, setPlay] = useState(!!policy.game_play_enabled);
  const [purchase, setPurchase] = useState(!!policy.purchase_enabled);
  const [comp, setComp] = useState(!!policy.paid_competition_enabled);
  const [transfer, setTransfer] = useState(!!policy.transfer_enabled);
  const [withdrawal, setWithdrawal] = useState(!!policy.withdrawal_enabled);
  const [note, setNote] = useState(policy.note || "");

  const save = () => {
    onSave({
      country_code: policy.country_code,
      catalog_enabled: 1,
      game_play_enabled: play,
      purchase_enabled: purchase,
      paid_competition_enabled: comp,
      transfer_enabled: transfer,
      withdrawal_enabled: withdrawal,
      note
    });
  };

  return (
    <tr>
      <td>
        <strong>{policy.name}</strong>
        <span className="pill">{policy.country_code}</span>
      </td>
      <td>
        <input type="checkbox" checked={play} onChange={e => setPlay(e.target.checked)} />
      </td>
      <td>
        <input type="checkbox" checked={purchase} onChange={e => setPurchase(e.target.checked)} />
      </td>
      <td>
        <input type="checkbox" checked={comp} onChange={e => setComp(e.target.checked)} />
      </td>
      <td>
        <input type="checkbox" checked={transfer} onChange={e => setTransfer(e.target.checked)} />
      </td>
      <td>
        <input type="checkbox" checked={withdrawal} onChange={e => setWithdrawal(e.target.checked)} />
      </td>
      <td>
        <input
          style={{ fontSize: "11px", padding: "4px 8px", maxWidth: "220px" }}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </td>
      <td>
        <button className="btn tiny" disabled={busy} onClick={save}>Lưu</button>
      </td>
    </tr>
  );
}

function CreateTournamentModal({ close, games, onSave, busy }: {
  close: () => void; games: any[]; onSave: (input: any) => Promise<void>; busy: boolean;
}) {
  const [title, setTitle] = useState("");
  const [gameId, setGameId] = useState(games[0]?.id || "memory");
  const [entryFee, setEntryFee] = useState("50");
  const [prizePool, setPrizePool] = useState("500");
  const [hours, setHours] = useState("24");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      gameId,
      entryFeeCoins: Number(entryFee),
      prizePoolCoins: Number(prizePool),
      durationHours: Number(hours)
    });
  };

  return (
    <Modal title="Khởi tạo giải đấu kỹ năng mới" close={close}>
      <form className="modal-body" onSubmit={submit}>
        <label>Tên giải đấu
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Bão Phép Tính Mùa 1" />
        </label>
        <label style={{ marginTop: "12px" }}>Trò chơi thi đấu
          <select
            style={{ width: "100%", padding: "10px", background: "#10131e", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "8px", marginTop: "6px" }}
            value={gameId}
            onChange={e => setGameId(e.target.value)}
          >
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.title} ({g.category})</option>
            ))}
          </select>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
          <label>Lệ phí tham gia (xu)
            <input required type="number" min="0" step="10" value={entryFee} onChange={e => setEntryFee(e.target.value)} />
          </label>
          <label>Tổng giải thưởng ban đầu (xu)
            <input required type="number" min="100" step="50" value={prizePool} onChange={e => setPrizePool(e.target.value)} />
          </label>
        </div>
        <label style={{ marginTop: "12px" }}>Thời lượng diễn ra (giờ)
          <input required type="number" min="1" max="720" value={hours} onChange={e => setHours(e.target.value)} />
        </label>
        <div className="modal-actions" style={{ marginTop: "18px" }}>
          <button type="button" className="btn secondary" onClick={close}>Hủy</button>
          <button className="btn primary" disabled={busy || !title}>
            {busy ? <Spinner /> : <Plus size={16} />} Tạo giải đấu
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PlanEditor({ plan, close, save, busy }: {
  plan: Plan; close: () => void; save: (p: Plan) => Promise<void>; busy: boolean;
}) {
  const [price, setPrice] = useState((plan.price_cents / 100).toFixed(2));
  const [multiplier, setMultiplier] = useState(String(plan.multiplier_bps / 10000));
  const [daily, setDaily] = useState(String(plan.daily_cap));
  const [session, setSession] = useState(String(plan.session_cap));
  const [perks, setPerks] = useState(plan.perks.join("\n"));
  const [active, setActive] = useState(!!plan.active);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d+(\.\d{1,2})?$/.test(price)) {
      setError("Giá USD tối đa 2 chữ số thập phân.");
      return;
    }
    const [whole, fraction = ""] = price.split(".");
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    await save({
      ...plan,
      price_cents: cents,
      multiplier_bps: Math.round(Number(multiplier) * 10000),
      daily_cap: Number(daily),
      session_cap: Number(session),
      perks: perks.split("\n").map(x => x.trim()).filter(Boolean),
      active: active ? 1 : 0
    });
  };

  return (
    <Modal title={`Chỉnh sửa ${tiers[plan.tier]} · ${periods[plan.period]}`} close={close}>
      <form className="modal-body plan-editor" onSubmit={submit}>
        <span className={`tier-badge ${plan.tier}`}>{tiers[plan.tier]}</span>
        <h2>Đặc quyền theo cách bạn chọn.</h2>
        <p>Phiên bản {plan.revision} · Thay đổi áp dụng cho đơn mua mới.</p>
        <div className="form-grid">
          <label>Giá dịch vụ (USD)<input type="text" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} required /></label>
          <label>Hệ số thưởng (1–5)<input type="number" min="1" max="5" step="0.01" value={multiplier} onChange={e => setMultiplier(e.target.value)} required /></label>
          <label>Xu tối đa/ngày<input type="number" min="10" max="100000" step="1" value={daily} onChange={e => setDaily(e.target.value)} required /></label>
          <label>Xu tối đa/phiên<input type="number" min="10" max={daily} step="1" value={session} onChange={e => setSession(e.target.value)} required /></label>
        </div>
        <label>Đặc quyền hiển thị — mỗi dòng một mục
          <textarea value={perks} onChange={e => setPerks(e.target.value)} rows={5} required />
        </label>
        <div className="switch-row">
          <div>
            <strong>Mở bán gói</strong>
            <span>Gói tạm đóng không xuất hiện cho đơn mới.</span>
          </div>
          <button type="button" className={`switch ${active ? "on" : ""}`} role="switch" aria-checked={active} aria-label="Mở bán gói" onClick={() => setActive(!active)}><span /></button>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={close}>Hủy</button>
          <button className="btn primary" disabled={busy}>{busy ? <Spinner /> : <Save size={16} />}Lưu vào hệ thống</button>
        </div>
      </form>
    </Modal>
  );
}

function PaymentSettings({ config, run, busy }: { config: any; run: (a: string, i: unknown, s: string) => Promise<boolean>; busy: boolean }) {
  const [link, setLink] = useState(config.payoneer_link);
  const [instructions, setInstructions] = useState(config.instructions);

  return (
    <div className="settings-grid">
      <form className="panel settings-form" onSubmit={e => {
        e.preventDefault();
        run("payment.save", { payoneer_link: link, instructions }, "Đã lưu cấu hình tham chiếu. Tiền thật vẫn tắt.");
      }}>
        <span className="section-icon"><Link2 size={24} /></span>
        <h2>Thông tin ví nhận của admin</h2>
        <p>Lưu link Payoneer để chuẩn bị cấu hình. Việc lưu không kích hoạt checkout hoặc chuyển tiền thật.</p>
        <label>Link ví Payoneer<input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://…payoneer.com/…" maxLength={1000} /></label>
        <div style={{ margin: "14px 0", padding: "12px", background: "#10131e", borderRadius: "10px", textAlign: "center" }}>
          <img src="/art/payoneer-qr.png" alt="QR Payoneer" style={{ width: "120px", height: "120px", background: "#fff", padding: "6px", borderRadius: "8px" }} />
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--muted)" }}>Mã QR ví nhận Payoneer hiện tại của nền tảng</p>
        </div>
        <label>Hướng dẫn hiển thị<textarea value={instructions} onChange={e => setInstructions(e.target.value)} maxLength={1500} required rows={4} /></label>
        <div className="locked-setting"><span>Tiền tệ</span><strong>USD</strong></div>
        <div className="locked-setting"><span>Tỷ lệ quy đổi</span><strong>1.000 xu = 1 USD</strong></div>
        <button className="btn primary" disabled={busy}>{busy ? <Spinner /> : <Save size={16} />}Lưu cấu hình</button>
      </form>
      <div>
        <section className="panel provider-status">
          <Shield size={27} />
          <span className="pill">CHƯA MỞ TIỀN THẬT</span>
          <h2>Kết nối cần đúng phạm vi.</h2>
          <p>Payoneer Payment Request tiêu chuẩn không dùng làm checkout B2C cho người chơi. Cần đối tác chấp nhận rõ mô hình thu phí thi đấu và trả thưởng.</p>
        </section>
        <section className="panel">
          <h3>Trước khi mở thanh toán thật</h3>
          <ul className="checklist">
            <li><ShieldCheck size={16} />Xác nhận mô hình theo từng quốc gia (Đan Mạch, Thụy Điển, Great Britain, v.v.)</li>
            <li><ShieldCheck size={16} />Đối tác PSP chấp nhận nhận/chi tiền thi đấu kỹ năng</li>
            <li><ShieldCheck size={16} />Hệ thống sổ cái kép đối soát tự động</li>
            <li><ShieldCheck size={16} />KYC, chống rửa tiền và kiểm soát gian lận</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
