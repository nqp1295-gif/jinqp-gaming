import { env } from "cloudflare:workers";
import { AppError, adminAction } from "../../../lib/core.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!env.DB) throw new AppError("Cơ sở dữ liệu chưa được kết nối.", 503);
    const bridgeSecret = env.NOVA_BRIDGE_SECRET || "nova-arcade-bridge-shared-secret-key-32b";

    const raw = await request.text();
    if (raw.length > 65536) throw new AppError("Yêu cầu quá lớn.", 413);

    const stamp = request.headers.get("x-nova-timestamp") || "";
    const nonce = request.headers.get("x-nova-nonce") || "";
    const sig = request.headers.get("x-nova-signature") || "";

    if (!/^\d{13}$/.test(stamp) || Math.abs(Date.now() - Number(stamp)) > 60000 || !/^[\da-f-]{36}$/.test(nonce) || !/^[\da-f]{64}$/.test(sig)) {
      throw new AppError("Xác thực kênh quản trị thất bại.", 403);
    }

    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(bridgeSecret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const signature = Uint8Array.from(sig.match(/.{2}/g)!.map(x => parseInt(x, 16)));
    if (!await crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(`${stamp}.${nonce}.${raw}`))) {
      throw new AppError("Xác thực chữ ký kênh quản trị thất bại.", 403);
    }

    let body;
    try { body = JSON.parse(raw); } catch { throw new AppError("Dữ liệu không hợp lệ."); }
    if (typeof body.actor !== "string" || !body.actor.startsWith("admin:") || body.actor.length > 200) {
      throw new AppError("Danh tính không hợp lệ.", 403);
    }

    try {
      await env.DB.prepare("INSERT INTO bridge_nonces (id,created_at) VALUES (?,?)").bind(nonce, Date.now()).run();
    } catch {
      throw new AppError("Yêu cầu đã xử lý.", 409);
    }

    const result = await adminAction(env.DB, body.actor, body.action, body.input || {});
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof AppError) return Response.json({ error: e.message, code: e.code }, { status: e.status });
    console.error("internal_request_failed", e instanceof Error ? e.message.slice(0, 160) : "unknown");
    return Response.json({ error: "Không thể xử lý yêu cầu quản trị." }, { status: 500 });
  }
}
