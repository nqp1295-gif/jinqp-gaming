import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { readExecutionProfile } from "./execution-profile.mjs";

// Ensure vinext error-boundary-navigation hook dispatcher safety
try {
  const p = fileURLToPath(new URL("../node_modules/vinext/dist/shims/error-boundary-navigation.js", import.meta.url));
  if (fs.existsSync(p)) {
    let code = fs.readFileSync(p, "utf-8");
    if (code.includes("React$1.useContext(getClientNavigationRenderContext())")) {
      code = code.replace(
        /function useErrorBoundaryPathname\(\)[\s\S]*?return committedPathname;\s*\}/,
        `function useErrorBoundaryPathname() {\n\treturn getClientPathnameSnapshot();\n}`
      );
      fs.writeFileSync(p, code, "utf-8");
    }
  }
} catch {}

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (managedLinux && command === "build") {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];
await import(cli.href);
