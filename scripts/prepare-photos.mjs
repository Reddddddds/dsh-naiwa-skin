/**
 * prepare-photos.mjs — 用真实奶娃照片生成全部皮肤素材（V2：5 张图全用）。
 *
 * 分配：
 *   logo      <- 经典呆萌站姿（5ee3fe58）        侧边栏品牌标
 *   icon      <- 抱肚站姿（5da502a3）            折叠态小图标
 *   favicon   <- 低头委屈（5ea78b3b）            浏览器标签页图标
 *   stickerLg <- 思考者（5570bbf3，400px）       聊天背景右下角大贴纸
 *   stickerSm <- 扎马步（2755764e，240px）       聊天背景左下角小贴纸
 *
 * 处理：sharp 压缩 JPEG → base64 → SVG <image> 圆形裁切（白底自然成白徽章）。
 * 生成后运行 `node scripts/build.mjs` 重建 client.js。
 */
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const sharp = require("C:/Users/30902/AppData/Roaming/npm/node_modules/@deepseek-ai/dsh/node_modules/sharp");

const IMG_DIR = join(root, ".dsh-vision-toolkit", "tmp", "pasted-images", "3c9b4758a257d298147a");
const OUT_DIR = join(root, "lib", "assets");
const DRAFT_DIR = join(OUT_DIR, "draft");

const PIC = {
  logo: "attachment-5ee3fe58de88a531e897aa117d39a5a1.jpg",
  icon: "attachment-5ea78b3baae456b329b3548bfd863ca2.jpg",
  favicon: "attachment-5ee3fe58de88a531e897aa117d39a5a1.jpg",
  newchat: "attachment-abecd261086356b0949fa900d802f434.jpg",
  stickerLg: "attachment-5570bbf35382aa4577720c772b4ec036.jpg",
  stickerSm: "attachment-2755764e32aaac8be944894da58b57f6.jpg"
};
const SIZES = { logo: 160, icon: 160, favicon: 160, newchat: 160, stickerLg: 400, stickerSm: 240 };

async function photoDataUri(file, size) {
  const src = join(IMG_DIR, file);
  if (!existsSync(src)) throw new Error("missing image: " + src);
  const buf = await sharp(src).resize(size, size, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
  return "data:image/jpeg;base64," + buf.toString("base64");
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function circleSvg(viewBox, cx, cy, r, data, stroke) {
  const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="4"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  <defs><clipPath id="c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF"${strokeAttr}/>
  <g clip-path="url(#c)">
    <image x="0" y="0" width="64" height="64" href="${esc(data)}" preserveAspectRatio="xMidYMid slice"/>
  </g>
</svg>
`;
}

function logoSvg(data) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 72">
  <defs><clipPath id="c"><circle cx="42" cy="38" r="30"/></clipPath></defs>
  <circle cx="42" cy="38" r="30" fill="#FFFFFF" stroke="#FFD23F" stroke-width="3"/>
  <g clip-path="url(#c)">
    <image x="12" y="8" width="60" height="60" href="${esc(data)}" preserveAspectRatio="xMidYMid slice"/>
  </g>
  <circle cx="86" cy="26" r="3.5" fill="#FFD23F"/>
  <text x="98" y="50" font-family="'YouYuan','Yuanti SC','幼圆','Microsoft YaHei',sans-serif" font-size="38" font-weight="700" fill="#6B4A12" letter-spacing="6">奶娃</text>
  <text x="100" y="66" font-family="'Microsoft YaHei',sans-serif" font-size="11" fill="#B0893F" letter-spacing="3">HARNESS</text>
</svg>
`;
}

// 备份 V1 素材
mkdirSync(DRAFT_DIR, { recursive: true });
for (const f of ["naiwa-logo.svg", "naiwa-icon.svg", "naiwa-favicon.svg"]) {
  const p = join(OUT_DIR, f);
  if (existsSync(p) && !existsSync(join(DRAFT_DIR, f + ".v1"))) copyFileSync(p, join(DRAFT_DIR, f + ".v1"));
}

const data = {};
for (const key of Object.keys(PIC)) data[key] = await photoDataUri(PIC[key], SIZES[key]);

writeFileSync(join(OUT_DIR, "naiwa-logo.svg"), logoSvg(data.logo));
writeFileSync(join(OUT_DIR, "naiwa-icon.svg"), circleSvg("0 0 64 64", 32, 32, 30, data.icon, "#FFD23F"));
writeFileSync(join(OUT_DIR, "naiwa-favicon.svg"), circleSvg("0 0 64 64", 32, 32, 28, data.favicon, "#FFD23F"));
writeFileSync(join(OUT_DIR, "naiwa-newchat.svg"), circleSvg("0 0 64 64", 32, 32, 30, data.newchat, "#FFD23F"));
// 背景贴纸：完整方形图（不做圆形裁切，保持照片感）
writeFileSync(join(OUT_DIR, "naiwa-sticker-lg.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><image x="0" y="0" width="400" height="400" href="${esc(data.stickerLg)}" preserveAspectRatio="xMidYMid slice"/></svg>\n`);
writeFileSync(join(OUT_DIR, "naiwa-sticker-sm.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><image x="0" y="0" width="240" height="240" href="${esc(data.stickerSm)}" preserveAspectRatio="xMidYMid slice"/></svg>\n`);
console.log("prepared assets:");
console.log("  logo <- classic, icon(collapse) <- lowered, favicon <- belly, newchat <- swirl, stickerLg <- thinker, stickerSm <- kungfu");
