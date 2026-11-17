import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const serverDir = path.join(root, "dist", "server");
const clientDir = path.join(root, "dist", "client");
const workerDir = path.join(clientDir, "_worker.js");
const serverWranglerPath = path.join(serverDir, "wrangler.json");

// Ensure no duplicate or invalid D1 placeholder bindings in wrangler.json
if (fs.existsSync(serverWranglerPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(serverWranglerPath, "utf-8"));
    if (Array.isArray(cfg.d1_databases)) {
      const seen = new Set();
      cfg.d1_databases = cfg.d1_databases.filter(db => {
        if (!db?.binding || seen.has(db.binding)) return false;
        if (db.database_id === "00000000-0000-4000-8000-000000000000") return false;
        seen.add(db.binding);
        return true;
      });
      fs.writeFileSync(serverWranglerPath, JSON.stringify(cfg, null, 2), "utf-8");
      console.log("[postbuild] Cleaned d1_databases in dist/server/wrangler.json.");
    }
  } catch (err) {
    console.warn("[postbuild] Warning processing wrangler.json:", err);
  }
}

if (fs.existsSync(serverDir) && fs.existsSync(clientDir)) {
  fs.cpSync(serverDir, workerDir, { recursive: true });
  console.log("[postbuild] Copied server bundle to dist/client/_worker.js for Cloudflare Pages.");
}
