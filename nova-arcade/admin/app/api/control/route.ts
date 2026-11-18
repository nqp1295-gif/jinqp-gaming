import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

function isAllowedOrigin(originHeader: string | null, requestUrl: string): boolean {
  if (!originHeader) return true;
  try {
    const originUrl = new URL(originHeader);
    const host = originUrl.host.toLowerCase();
    if (host.includes("chiprin.com") || host.includes("localhost") || host.includes("127.0.0.1")) {
      return true;
    }
    const currentOrigin = new URL(requestUrl).origin;
    return originHeader === currentOrigin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request.headers.get("origin"), request.url) || !request.headers.get("content-type")?.startsWith("application/json")) {
      return Response.json({ error: "Yêu cầu không được phép." }, { status: 403 });
    }

    const user = await getChatGPTUser();
    const rawAllowed = env.NOVA_ADMIN_EMAILS || "jinofc.ytb@gmail.com,seedy@sites.test,admin@nova.test,admin@example.com";
    const allowed = rawAllowed.split(",").map(x => x.trim().toLowerCase()).filter(Boolean);

    if (!user || (allowed.length > 0 && !allowed.includes(user.email.toLowerCase()))) {
      return Response.json({ error: "Tài khoản chưa có quyền quản trị." }, { status: 403 });
    }

    const bridgeSecret = env.NOVA_BRIDGE_SECRET || "nova-arcade-bridge-shared-secret-key-32b";
    const playerOriginStr = env.NOVA_PLAYER_ORIGIN || "https://dashboardgaming.chiprin.com";

    const incoming = await request.text();
    if (incoming.length > 65536) return Response.json({ error: "Yêu cầu quá lớn." }, { status: 413 });

    let data;
    try { data = JSON.parse(incoming); } catch { return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }

    const raw = JSON.stringify({ actor: `admin:${user.userId}`, action: data.action, input: data.input || {} });
    const stamp = String(Date.now());
    const nonce = crypto.randomUUID();

    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(bridgeSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${stamp}.${nonce}.${raw}`));
    const sig = Array.from(new Uint8Array(signature)).map(v => v.toString(16).padStart(2, "0")).join("");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Nova-Timestamp": stamp,
      "X-Nova-Nonce": nonce,
      "X-Nova-Signature": sig
    };
    if (env.NOVA_PLAYER_SERVICE_TOKEN) headers["OAI-Sites-Authorization"] = `Bearer ${env.NOVA_PLAYER_SERVICE_TOKEN}`;

    const origin = new URL(playerOriginStr);
    if (origin.protocol !== "https:" && origin.hostname !== "127.0.0.1" && origin.hostname !== "localhost") {
      throw new Error("Invalid backend origin");
    }

    const upstream = await fetch(new URL("/api/internal", origin), {
      method: "POST",
      headers,
      body: raw,
      redirect: "follow",
      signal: AbortSignal.timeout(15000)
    });

    const result = await upstream.json();
    return Response.json(result, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("control_bridge_failed", e instanceof Error ? e.message.slice(0, 120) : "unknown");
    return Response.json({ error: "Chưa thể kết nối kho dữ liệu. Vui lòng thử lại." }, { status: 502 });
  }
}
