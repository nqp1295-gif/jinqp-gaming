import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { AppError, bootstrap, ensureUser, playerAction, seed } from "../../../lib/core.mjs";
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
function database() { if (!env.DB) throw new AppError("Dữ liệu đang được chuẩn bị. Vui lòng thử lại.",503); return env.DB; }
export async function GET() {
  try { return json(await bootstrap(database(),await getChatGPTUser())); }
  catch(e) { return failure(e); }
}
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
    if (!isAllowedOrigin(request.headers.get("origin"), request.url) || !request.headers.get("content-type")?.startsWith("application/json")) throw new AppError("Yêu cầu không được phép.",403);
    const raw = await request.text(); if (raw.length > 65536) throw new AppError("Yêu cầu quá lớn.",413);
    let body; try { body = JSON.parse(raw); } catch { throw new AppError("Dữ liệu không hợp lệ."); }
    const db=database();await seed(db);const u=await ensureUser(db,await getChatGPTUser());
    return json(await playerAction(db,u.id,body.action,body.input || {}));
  }catch(e){return failure(e);}
}
function failure(e: unknown) { if(e instanceof AppError)return json({error:e.message,code:e.code},e.status);console.error("arcade_request_failed", e instanceof Error ? e.message.slice(0,240) : "unknown");return json({error:"Chưa thể xử lý yêu cầu. Vui lòng thử lại."},500); }
