import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const serverDir = path.join(root, "dist", "server");
const clientDir = path.join(root, "dist", "client");
const workerDir = path.join(clientDir, "_worker.js");

if (fs.existsSync(serverDir) && fs.existsSync(clientDir)) {
  fs.cpSync(serverDir, workerDir, { recursive: true });
  console.log("[postbuild] Copied server bundle to dist/client/_worker.js for Cloudflare Pages.");
}
