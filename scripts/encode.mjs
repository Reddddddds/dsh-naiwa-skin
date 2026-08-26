/**
 * encode.mjs — 把 lib/assets/*.svg 编码为 data URI 并输出 JSON。
 *
 * 换图流程：把新图片放进 lib/assets/（同名覆盖，或改下方映射），
 * 然后运行 `node scripts/encode.mjs`，把输出的 JSON 复制进
 * lib/client.js 顶部的 ASSETS 常量，重启 DSH 即生效。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const FILES = {
  logo: "naiwa-logo.svg",
  icon: "naiwa-icon.svg",
  favicon: "naiwa-favicon.svg",
  cursor: "cursor-drop.svg",
  cursorPointer: "cursor-pointer.svg"
};

function encode(name) {
  const raw = readFileSync(join(root, "lib", "assets", FILES[name]), "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
  return "data:image/svg+xml," + encodeURIComponent(raw);
}

const out = Object.fromEntries(Object.keys(FILES).map((k) => [k, encode(k)]));
const json = JSON.stringify(out, null, 2);
writeFileSync(join(root, "lib", "assets.json"), json + "\n");
console.log(json);
