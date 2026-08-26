/**
 * build.mjs — 生成 lib/client.js。
 *
 * 1. 编码 lib/assets/*.svg → data URI（同 scripts/encode.mjs 的编码规则）。
 * 2. 读取 src/client.template.js，把 __ASSETS_JSON__ 替换为编码结果。
 * 3. 写入 lib/client.js。
 *
 * 换图流程：替换 lib/assets/ 下的 SVG → `node scripts/build.mjs` → 重启 DSH。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const FILES = {
  logo: "naiwa-logo.svg",
  icon: "naiwa-icon.svg",
  favicon: "naiwa-favicon.svg",
  cursor: "cursor-drop.png",
  cursorPointer: "cursor-drop.png",
  stickerLg: "naiwa-sticker-lg.svg",
  stickerSm: "naiwa-sticker-sm.svg",
  newchat: "naiwa-newchat.svg",
  diving: "naiwa-diving.webp"
};

function encode(name) {
  const file = FILES[name];
  const full = join(root, "lib", "assets", file);
  if (file.endsWith(".png")) {
    return "data:image/png;base64," + readFileSync(full).toString("base64");
  }
  if (file.endsWith(".webp")) {
    return "data:image/webp;base64," + readFileSync(full).toString("base64");
  }
  const raw = readFileSync(full, "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
  return "data:image/svg+xml," + encodeURIComponent(raw);
}

const assets = Object.fromEntries(Object.keys(FILES).map((k) => [k, encode(k)]));

const template = readFileSync(join(root, "src", "client.template.js"), "utf8");
if (!template.includes("__ASSETS_JSON__")) {
  throw new Error("template missing __ASSETS_JSON__ placeholder");
}
const built = template.replaceAll("__ASSETS_JSON__", JSON.stringify(assets, null, "\t"));
writeFileSync(join(root, "lib", "client.js"), built);
writeFileSync(join(root, "lib", "assets.json"), JSON.stringify(assets, null, 2) + "\n");
console.log("built lib/client.js (" + built.length + " bytes)");
