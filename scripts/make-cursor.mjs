/**
 * make-cursor.mjs — 把蛋形奶娃图做成透明背景光标 PNG。
 *
 * 原理：奶娃浅黄（B 通道 < 210）与纯白背景（B > 240）在蓝色通道分离度最大，
 * 逐像素置 alpha，瞳孔/高光不受影响。输出 48×48（2x，光标 32px 显示）。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const sharp = require("C:/Users/30902/AppData/Roaming/npm/node_modules/@deepseek-ai/dsh/node_modules/sharp");

const SRC = join(root, ".dsh-vision-toolkit", "tmp", "pasted-images", "3c9b4758a257d298147a", "attachment-8f458afcdad6f3a102b937c5abcbd0f1.jpg");
const OUT = join(root, "lib", "assets", "cursor-drop.png");

// 奶娃主体包围盒（来自前景提取结果，先裁掉四周空白与底部阴影）
const BOX = { left: 80, top: 120, width: 860, height: 800 };

const { data, info } = await sharp(SRC)
  .extract(BOX)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const px = Buffer.from(data);
const W = info.width, H = info.height;

// 逐像素：接近纯白（B 高且 G 高）→ 透明；其余保留。
// 奶娃浅黄 #FFE8A0-ish: R≈250+ G≈230+ B≈160-200；白底: R=G=B≈250+。
for (let i = 0; i < px.length; i += 4) {
  const r = px[i], g = px[i + 1], b = px[i + 2];
  const isWhiteBg = r > 246 && g > 244 && b > 232;
  // 底部阴影是灰色且偏暗：R≈G≈B 220-235 —— 用色相检测排除灰色（R-G 差小且 B 高）
  const isGrayShade = Math.abs(r - g) < 8 && Math.abs(g - b) < 14 && r > 200;
  if (isWhiteBg || isGrayShade) {
    px[i + 3] = 0;
  }
}

// 边缘 1px 羽化（简单均值 alpha），减少锯齿
const alpha = new Float32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) alpha[y * W + x] = px[(y * W + x) * 4 + 3];
const feather = (x, y) => {
  let sum = 0, n = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < W && ny < H) { sum += alpha[ny * W + nx]; n++; }
  }
  return sum / n;
};
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const a = alpha[y * W + x];
  if (a > 0 && a < 255) px[(y * W + x) * 4 + 3] = Math.round(feather(x, y));
}

const buf = Buffer.from(px);
const trimmed = await sharp(buf, { raw: { width: W, height: H, channels: 4 } })
  .trim() // 去掉透明边
  .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer({ resolveWithObject: true });

// 底部阴影带：硬裁 5 行后回缩到 48×48
const base = trimmed;
const cropped = await sharp(base.data, { raw: { width: base.info.width, height: base.info.height, channels: 4 } })
  .extract({ left: 0, top: 0, width: base.info.width, height: Math.max(4, base.info.height - 5) })
  .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer({ resolveWithObject: true });

// ── 数学椭圆蒙版：把奶娃轮廓补成规整竖椭圆（奶蛋形）──
// alpha 完全由椭圆方程接管（蛋壳），RGB 保留奶娃颜色；边缘 smoothstep 羽化
const ECX = 18, ECY = 22, ERX = 16, ERY = 20.5;
const eData = Buffer.from(cropped.data);
const eW = cropped.info.width, eH = cropped.info.height;
const SKIN = [255, 232, 160]; // 奶娃肤色 #FFE8A0
for (let y = 0; y < eH; y++) {
  for (let x = 0; x < eW; x++) {
    const i = (y * eW + x) * 4;
    const dx = (x + 0.5 - ECX) / ERX;
    const dy = (y + 0.5 - ECY) / ERY;
    const d = dx * dx + dy * dy;
    let a = 255;
    if (d >= 1) a = 0;
    else if (d > 0.75) a = Math.round(255 * (1 - d) / 0.25);
    eData[i + 3] = a;
    // 修复降采样伪影：椭圆内非眼睛区域（眼睛约 x12-26,y12-26）的低亮度像素 → 奶娃肤色
    if (a > 40) {
      const bright = (eData[i] + eData[i + 1] + eData[i + 2]) / 3;
      const inEyeZone = x >= 12 && x <= 26 && y >= 12 && y <= 26;
      if (bright < 170 && !inEyeZone) {
        eData[i] = SKIN[0]; eData[i + 1] = SKIN[1]; eData[i + 2] = SKIN[2];
      }
    }
  }
}

// 缩小：48×48 → 36×44（椭圆 32×41 + 边距），光标显示即 36×44
const finalImg = await sharp(eData, { raw: { width: eW, height: eH, channels: 4 } })
  .resize(36, 44, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(OUT, finalImg);
const meta = await sharp(finalImg).metadata();
console.log("cursor-drop.png written:", meta.width + "x" + meta.height, finalImg.length, "bytes (ellipse shell 32x41)");
