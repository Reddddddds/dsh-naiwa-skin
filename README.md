# dsh-naiwa-skin 🍼

奶娃皮肤 —— DeepSeek Harness web 界面的全套可爱化皮肤。主题主体是「奶娃」（奶龙的宝宝变体）：奶黄配色、奶娃 logo、奶娃动画光标、圆体字体。

[![npm](https://img.shields.io/npm/v/dsh-naiwa-skin)](https://www.npmjs.com/package/dsh-naiwa-skin)

## 特性

| 模块 | 说明 |
|---|---|
| 配色 | 覆盖 `--dsw-alias-*` 语义 token 全表，浅色（奶黄）/ 深色（奶茶夜）双套，跟随系统/手动主题偏好自动切换 |
| 品牌 | 侧边栏 wordmark → 奶娃 logo（圆形徽章 + 「奶娃 HARNESS」），折叠态图标 → 低头奶娃 |
| 背景 | 奶黄渐变 + 右下思考者水印 + 左下扎马步贴纸 |
| 光标 | 奶娃透明光标（可点态同图），文本编辑区保持文本光标 |
| 加载动画 | 「Deep diving...」动态标志 → 奶娃动画（时间计时保留） |
| 细节 | 圆体字体优先、奶黄选中色/焦点环、favicon 奶娃、页面标题「奶娃 · …」 |

## 安装

```powershell
dsh plugin --profile web add dsh-naiwa-skin
# 然后重启 web 服务（页面会短暂断开，会话保留）
```

> 插件包内 `cordis.patch.yml` 声明 `dsh.bundle.patch`，`dsh plugin` 的 bundle 协调会自动把它加入 `dsh.profile.bundles`，无需手改 profile。

## 卸载

```powershell
dsh plugin --profile web remove dsh-naiwa-skin
# 重启 web 服务
```

## 换图 / 自定义

所有素材在 `lib/assets/`（SVG/PNG/WebP 源文件）：

| 文件 | 用途 |
|---|---|
| `naiwa-logo.svg` | 侧边栏品牌标（奶娃圆徽章 + 文字，340×72 视口） |
| `naiwa-icon.svg` | 折叠/收起侧边栏小图标（低头奶娃） |
| `naiwa-favicon.svg` | 浏览器标签页图标（经典站姿奶娃） |
| `naiwa-newchat.svg` | 新会话按钮图标（螺旋奶娃，24px） |
| `cursor-drop.png` | 普通态/可点态奶娃光标（透明抠图） |
| `naiwa-sticker-lg.svg` | 聊天背景右下角水印（思考者） |
| `naiwa-sticker-sm.svg` | 聊天背景左下角水印（扎马步） |
| `naiwa-diving.webp` | 「Deep diving...」动画（奶娃大笑 GIF） |

替换后重新生成并重启：

```powershell
node scripts\build.mjs   # 重新编码素材并写入 lib\client.js
# 重启 DSH web 服务
```

> 素材支持 SVG / PNG / WebP（动画）：直接放进 `lib/assets/` 并在 `scripts/build.mjs` 的 `FILES` 里登记即可。

配色在 `src/client.template.js` 的 `TOKEN_OVERRIDES`（键 = `--dsw-alias-*` 变量，值 = `{ light, dark }` 双模式）。改完同样 `node scripts\build.mjs` + 重启。

## 文件结构

```
nailong_skin/
├── package.json            # dsh.client / dsh.bundle 声明
├── cordis.patch.yml        # 挂载行（insert naiwa-skin）
├── LICENSE                 # MIT
├── lib/
│   ├── index.js            # node 半身（空 apply）
│   ├── client.js           # 浏览器 bundle（自包含，素材内联 data URI）
│   └── assets/             # 素材源文件（SVG/PNG/WebP）
├── src/client.template.js  # client bundle 模板（素材 JSON 占位）
└── scripts/
    ├── build.mjs           # 编码素材 + 生成 lib/client.js
    ├── prepare-photos.mjs  # 用奶娃照片生成素材（sharp）
    ├── make-cursor.mjs     # 光标抠图（B 通道阈值 + 羽化）
    └── restart.ps1         # 重启 web 服务
```

## 原理

- 浏览器端通过 `window.__ModuleLoader__.load({ id, factory })` 注册 bundle，`exports.apply` + `exports.inject = ["theme"]` 由客户端 cordis Loader 消费；
- 主题层用 `ctx.theme.overrideTokens("dsh-naiwa-skin", …)` 叠加 alias token（内联变量优先级高于样式表，所以必须走主题服务而不是裸 CSS）；
- `dsh.client.inject` 声明 `@deepseek-ai/dsh-client-ui-theme` 保证 bundle 先于本插件到达；
- CSS/logo/光标等纯展示部分直接注入 `<style>` 与 `<link rel="icon">`。

## 版权

素材为自用奶娃图片（来自网络表情包），仅作个人使用；分发前请确认素材授权。代码 MIT。

