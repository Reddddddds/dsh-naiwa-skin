/**
 * dsh-naiwa-skin — browser half（模板；scripts/build.mjs 把素材 JSON
 * 替换为 data URI 后生成 lib/client.js）。
 *
 * 皮肤机制：
 *  1. ctx.theme.overrideTokens(...) —— 覆盖 --dsw-alias-* 语义 token，
 *     与用户的 light/dark 偏好正交（{ light, dark } 双值，切主题自动跟随）。
 *  2. 注入 <style> —— 鹅黄渐变背景、品牌 logo 替换、奶滴光标、圆角细节。
 *  3. 注入背景水印贴纸（右下思考者 + 左下扎马步，mix-blend 融入背景）。
 *  4. favicon + 页面标题。
 *
 * 全部自包含：素材以 data URI 内联，无任何 import，零构建依赖。
 */
window.__ModuleLoader__.load({
	id: "dsh-naiwa-skin",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		/** 素材 data URI（build 时由 scripts/encode.mjs 的输出注入）。 */
		var ASSETS = __ASSETS_JSON__;

		/**
		 * 主题 alias token 覆盖层。每个键都是 --dsw-alias-* 变量，
		 * 值为 { light, dark } 双模式色值。
		 * V2 主调：奶娃鹅黄 #FFD23F / 按钮亮黄 #FFC42E / 暖棕文字 / 奶黄背景。
		 */
		var TOKEN_OVERRIDES = {
			// ── 背景（奶黄系）──────────────────────────────────────
			"--dsw-alias-bg-base": { light: "#FFF9EC", dark: "#1B1509" },
			"--dsw-alias-bg-layer-1": { light: "#FFFDF6", dark: "#231B0D" },
			"--dsw-alias-bg-layer-2": { light: "#FFF5D6", dark: "#2B2110" },
			"--dsw-alias-bg-layer-3": { light: "#FFEFC2", dark: "#342814" },
			"--dsw-alias-bg-overlay": { light: "#FFE9B6", dark: "#46361B" },
			"--dsw-alias-bg-module-platform": { light: "#FFF2D0", dark: "#291F0E" },
			"--dsw-alias-bg-multi-select": { light: "#FFF3D4", dark: "#2E2412" },
			"--dsw-alias-bg-skeleton": { light: "rgba(230, 170, 30, 0.10)", dark: "rgba(255, 220, 120, 0.08)" },

			// ── 边框（黄棕）────────────────────────────────────────
			"--dsw-alias-border-l1": { light: "rgba(214, 158, 32, 0.12)", dark: "rgba(255, 225, 140, 0.08)" },
			"--dsw-alias-border-l2": { light: "rgba(214, 158, 32, 0.22)", dark: "rgba(255, 225, 140, 0.14)" },
			"--dsw-alias-border-l3": { light: "rgba(214, 158, 32, 0.30)", dark: "rgba(255, 225, 140, 0.20)" },
			"--dsw-alias-border-l4": { light: "rgba(214, 158, 32, 0.38)", dark: "rgba(255, 225, 140, 0.26)" },
			"--dsw-alias-border-inverted": { light: "rgba(214, 158, 32, 0.12)", dark: "rgba(255, 225, 140, 0.08)" },
			"--dsw-alias-border-inverted2": { light: "rgba(214, 158, 32, 0.12)", dark: "rgba(255, 225, 140, 0.08)" },
			"--dsw-alias-border-l2-darkmode-thin": { light: "rgba(214, 158, 32, 0.16)", dark: "rgba(255, 225, 140, 0.08)" },

			// ── 品牌（奶娃黄）──────────────────────────────────────
			"--dsw-alias-brand-primary": { light: "#C77400", dark: "#FFD23F" },
			"--dsw-alias-brand-primary-invert": { light: "#FFF9EC", dark: "#241A04" },
			"--dsw-alias-brand-primary-new-colorprimary-new-color": { light: "#E8912D", dark: "#FFC42E" },
			"--dsw-alias-brand-text": { light: "#8A5A00", dark: "#FFE89A" },

			// ── 文字（暖棕）────────────────────────────────────────
			"--dsw-alias-label-primary": { light: "#402F0A", dark: "#FFF3D0" },
			"--dsw-alias-label-secondary": { light: "#7C642A", dark: "#D9BC85" },
			"--dsw-alias-label-tertiary": { light: "#9C8350", dark: "#A98F5C" },
			"--dsw-alias-label-caption": { light: "#A88F5C", dark: "#977F4E" },
			"--dsw-alias-label-dimmed": { light: "#D9C393", dark: "#6E5B30" },
			"--dsw-alias-label-primary-dimmed": { light: "#4A380F", dark: "#F5E3B4" },
			"--dsw-alias-label-primary-bluish": { light: "#B07200", dark: "#FFD96E" },
			"--dsw-alias-label-primary-foreground": { light: "#5A3E06", dark: "#4A3408" },
			"--dsw-alias-label-primary-inverted": { light: "#FFFDF6", dark: "#FFFDF6" },

			// ── 按钮（鹅黄主按钮 + 深棕文字）──────────────────────
			"--dsw-alias-button-primary-fill": { light: "#FFC42E", dark: "#FFC42E" },
			"--dsw-alias-button-primary-hover": { light: "#FFB800", dark: "#FFD23F" },
			"--dsw-alias-button-primary-dimmed": { light: "#FFF1C2", dark: "#33270F" },
			"--dsw-alias-button-contrast-fill": { light: "#B07200", dark: "#FFE89A" },
			"--dsw-alias-button-elevated-fill": { light: "#FFFDF6", dark: "#342814" },
			"--dsw-alias-button-floating-fill": { light: "#FFFDF6", dark: "#2B2110" },
			"--dsw-alias-button-floating-hover": { light: "#FFF3D0", dark: "#342814" },
			"--dsw-alias-button-info-fill": { light: "#D97706", dark: "#E8912D" },
			"--dsw-alias-button-info-hover": { light: "#C2560B", dark: "#F2A81E" },
			"--dsw-alias-button-ghost-active-fill": { light: "#FFF2CF", dark: "#382C13" },
			"--dsw-alias-button-ghost-active-hover": { light: "#FFEBBB", dark: "#423315" },
			"--dsw-alias-button-ghost-active-border": { light: "#E8B84A", dark: "#977F4E" },

			// ── 交互态 ─────────────────────────────────────────────
			"--dsw-alias-interactive-bg-hover": { light: "rgba(230, 170, 30, 0.12)", dark: "rgba(255, 225, 140, 0.09)" },
			"--dsw-alias-interactive-bg-hover-accent": { light: "rgba(230, 170, 30, 0.18)", dark: "rgba(255, 225, 140, 0.16)" },
			"--dsw-alias-interactive-bg-active": { light: "rgba(230, 170, 30, 0.18)", dark: "rgba(255, 225, 140, 0.16)" },
			"--dsw-alias-interactive-bg-hover-solid": { light: "#FFF4D4", dark: "#342814" },
			"--dsw-alias-interactive-bg-hover-danger": { light: "rgba(224, 69, 42, 0.07)", dark: "rgba(244, 112, 78, 0.16)" },

			// ── 代码块 / markdown ──────────────────────────────────
			"--dsw-alias-markdown-code-block": { light: "#FFF6DC", dark: "#1F180A" },
			"--dsw-alias-markdown-code-block-banner": { light: "#FFF9E8", dark: "#241C0C" },
			"--dsw-alias-markdown-inline-code": { light: "#FFEFC0", dark: "#2A200E" },
			"--dsw-alias-markdown-citation": { light: "#FFF3D0", dark: "#2A200E" },
			"--dsw-alias-markdown-tag": { light: "#FFF4D4", dark: "#2B2110" },
			"--dsw-alias-markdown-placeholder": { light: "#FFF3CE", dark: "#261D0C" },
			"--dsw-alias-markdown-code-segment-selected": { light: "#FFFDF6", dark: "#342814" },
			"--dsw-alias-markdown-code-segment-unselected": { light: "#FFF3CE", dark: "#1F180A" },

			// ── 滚动条（奶黄）──────────────────────────────────────
			"--dsw-alias-scrollbar-bg-l1": { light: "#FFE494", dark: "#4A3A17" },
			"--dsw-alias-scrollbar-bg-l2": { light: "#FFE494", dark: "#4A3A17" },
			"--dsw-alias-scrollbar-hover-l1": { light: "#F5C94A", dark: "#5E4A1E" },
			"--dsw-alias-scrollbar-hover-l2": { light: "#F5C94A", dark: "#5E4A1E" },

			// ── 状态色（暖调，成功用奶娃眼睛绿）────────────────────
			"--dsw-alias-state-success-primary": { light: "#3E9E55", dark: "#5CBE78" },
			"--dsw-alias-state-success-secondary": { light: "#5CBE78", dark: "#5CBE78" },
			"--dsw-alias-state-success-tertiary": { light: "#DFF5E3", dark: "#1A3320" },
			"--dsw-alias-state-error-primary": { light: "#E0452A", dark: "#F4704E" },
			"--dsw-alias-state-error-secondary": { light: "#F0664A", dark: "#F4704E" },
			"--dsw-alias-state-warn-primary": { light: "#F2A81E", dark: "#F2A81E" },
			"--dsw-alias-state-warn-secondary": { light: "#F5C94A", dark: "#F5C94A" },
			"--dsw-alias-state-warn-label": { light: "#C77400", dark: "#F5C94A" },
			"--dsw-alias-state-warn-tertiary": { light: "#FFF0C8", dark: "#3D2E10" },
			"--dsw-alias-state-business-primary": { light: "#E8912D", dark: "#F2A81E" },
			"--dsw-alias-state-business-tertiary": { light: "#FFF0C8", dark: "#3D2E10" },

			// ── 浮层 ───────────────────────────────────────────────
			"--dsw-alias-toast-bg": { light: "#5A4308", dark: "#46361B" },
			"--dsw-alias-tooltip-bg": { light: "#5A4308", dark: "#46361B" },

			// ── 侧边栏（奶黄）──────────────────────────────────────
			"--dsw-specific-sidebar-fill": { light: "#FFEFC0", dark: "#201807" }
		};

		/**
		 * 皮肤 CSS 模板。%%LOGO%% / %%ICON%% / %%CURSOR%% / %%CURSOR_POINTER%%
		 * 在 apply 时替换为 ASSETS 中的 data URI。
		 */
		var SKIN_CSS = [
			"/* ===== dsh-naiwa-skin v2 ===== */",

			// 圆体优先的字体栈
			":root{--dsw-font-family:'YouYuan','Yuanti SC','幼圆','PingFang SC','Hiragino Sans GB','Microsoft YaHei','Segoe UI',Helvetica,Arial,sans-serif}",

			// 聊天区背景：奶黄柔和渐变（!important 压过主题 presenter 的内联值）
			"body{background:linear-gradient(180deg,#FFF9EC 0%,#FFF3D6 52%,#FFE9B8 100%) fixed !important}",
			"body[data-ds-dark-theme]{background:linear-gradient(180deg,#1B1509 0%,#231B0D 55%,#2E2412 100%) fixed !important}",

			// 选中文本：奶黄
			"::selection{background:rgba(255,196,46,.5)}",

			// 品牌区（含宽 wordmark svg 的按钮）：隐藏原 wordmark，显示奶娃 logo
			'button[aria-label="新建会话"]>svg[width="182"],button[aria-label="New session"]>svg[width="182"]{display:none!important}',
			'button[aria-label="新建会话"]:has(>svg[width="182"])::before,button[aria-label="New session"]:has(>svg[width="182"])::before{content:"";display:inline-block;flex:none;width:156px;height:34px;background:url("%%LOGO%%") center/contain no-repeat}',

			// 新会话按钮（带文字 span 的宽态 / 折叠态 18px 图标）：换成螺旋奶娃（24px）
			'button[aria-label="新建会话"]:has(span)>svg,button[aria-label="New session"]:has(span)>svg{display:none!important}',
			'button[aria-label="新建会话"]:has(span)::before,button[aria-label="New session"]:has(span)::before{content:"";display:inline-block;flex:none;width:24px;height:24px;background:url("%%NEWCHAT%%") center/contain no-repeat}',
			'button[aria-label="新建会话"]>svg[width="18"],button[aria-label="New session"]>svg[width="18"]{display:none!important}',
			'button[aria-label="新建会话"]:has(>svg[width="18"])::before,button[aria-label="New session"]:has(>svg[width="18"])::before{content:"";display:inline-block;flex:none;width:24px;height:24px;background:url("%%NEWCHAT%%") center/contain no-repeat}',

			// 折叠态：小奶娃徽章（收起/打开侧边栏按钮）
			'button[aria-label="收起侧边栏"]>svg:first-child,button[aria-label="打开侧边栏"]>svg:first-child,button[aria-label="Collapse sidebar"]>svg:first-child,button[aria-label="Open sidebar"]>svg:first-child{display:none!important}',
			'button[aria-label="收起侧边栏"]::before,button[aria-label="打开侧边栏"]::before,button[aria-label="Collapse sidebar"]::before,button[aria-label="Open sidebar"]::before{content:"";display:inline-block;flex:none;width:24px;height:24px;background:url("%%ICON%%") center/contain no-repeat}',

			// 奶娃光标（用户抠图蛋形奶娃，普通态 / 可点态 / 文本态）
			'html{cursor:url("%%CURSOR%%") 20 23,auto}',
			'button,[role="button"],a,select,summary,input[type="checkbox"],input[type="radio"],input[type="range"],label{cursor:url("%%CURSOR_POINTER%%") 20 23,pointer}',
			'textarea,input[type="text"],input:not([type]),[contenteditable="true"]{cursor:text}',

			// 焦点环奶黄 + 输入区圆角
			":focus-visible{outline-color:#F2A81E!important}",
			'textarea,input[type="text"],input:not([type]),[contenteditable="true"]{border-radius:12px}',

			// 链接细节
			"a{text-decoration-thickness:1.5px;text-underline-offset:2px}",
			"a:hover{text-decoration-thickness:2.5px}",

			// 背景水印贴纸（mix-blend 让白底融入背景）
			".naiwa-bg-sticker{position:fixed;pointer-events:none;z-index:9999;mix-blend-mode:multiply;background-repeat:no-repeat;background-position:center;background-size:contain}",
			".naiwa-bg-sticker-lg{width:min(38vw,360px);height:min(38vw,360px);right:-48px;bottom:-48px;opacity:.17}",
			".naiwa-bg-sticker-sm{width:190px;height:190px;left:10px;bottom:10px;opacity:.16}",
			"body[data-ds-dark-theme] .naiwa-bg-sticker{opacity:.10}",

			// Deep diving... 动态标志 → 奶娃动画（[class$="turnStatus"] 为 CSS-modules 稳定后缀，仅命中回合状态标签）
			// 时间计时（turnStatusClock span）自带 font 设置，不受父级 font-size:0 影响，正常保留
			'[class$="turnStatus"]{font-size:0!important;color:transparent!important;background:none!important;-webkit-text-fill-color:transparent!important;gap:8px}',
			'[class$="turnStatus"]::before{content:"";display:inline-block;flex:none;width:28px;height:28px;background:url("%%DIVING%%") center/contain no-repeat}'
		].join("\n");

		/** 注入 <style>（幂等：同一 data-naiwa 标记只注入一次）。 */
		function injectStyle() {
			if (document.querySelector('style[data-naiwa-skin]')) return;
			var style = document.createElement("style");
			style.setAttribute("data-naiwa-skin", "1");
			style.textContent = SKIN_CSS
				.replaceAll("%%LOGO%%", ASSETS.logo)
				.replaceAll("%%ICON%%", ASSETS.icon)
				.replaceAll("%%NEWCHAT%%", ASSETS.newchat)
				.replaceAll("%%CURSOR%%", ASSETS.cursor)
				.replaceAll("%%CURSOR_POINTER%%", ASSETS.cursorPointer)
				.replaceAll("%%DIVING%%", ASSETS.diving);
			document.head.appendChild(style);
		}

		/** 背景水印贴纸：右下思考者 + 左下扎马步。 */
		function injectStickers() {
			if (document.querySelector("[data-naiwa-sticker]")) return;
			var mk = function (uri, cls) {
				var d = document.createElement("div");
				d.setAttribute("data-naiwa-sticker", "1");
				d.className = "naiwa-bg-sticker " + cls;
				d.style.backgroundImage = "url('" + uri + "')";
				return d;
			};
			var lg = mk(ASSETS.stickerLg, "naiwa-bg-sticker-lg");
			var sm = mk(ASSETS.stickerSm, "naiwa-bg-sticker-sm");
			document.body.appendChild(lg);
			document.body.appendChild(sm);
		}

		/** favicon + 页面标题。 */
		function injectBrandBits() {
			if (document.title && document.title.indexOf("奶娃") === -1) {
				document.title = "奶娃 · " + document.title;
			}
			if (!document.querySelector('link[rel="icon"][data-naiwa-skin]')) {
				var link = document.createElement("link");
				link.rel = "icon";
				link.type = "image/svg+xml";
				link.href = ASSETS.favicon;
				link.setAttribute("data-naiwa-skin", "1");
				document.head.appendChild(link);
			}
		}

		/** 主题 alias token 层：覆盖层随 active 主题合成，light/dark 均生效。 */
		function applyThemeLayer(ctx) {
			if (!ctx.theme || typeof ctx.theme.overrideTokens !== "function") {
				console.warn("[naiwa-skin] theme service unavailable — alias tokens stay default (CSS extras still apply)");
				return;
			}
			ctx.effect(function () {
				return ctx.theme.overrideTokens("dsh-naiwa-skin", TOKEN_OVERRIDES);
			}, "naiwa-skin: alias token layer");
		}

		/**
		 * 客户端插件主体。
		 * @param {import('@deepseek-ai/cordis').Context} ctx - 客户端 cordis 上下文。
		 */
		function apply(ctx) {
			try {
				applyThemeLayer(ctx);
			} catch (error) {
				console.error("[naiwa-skin] theme layer failed:", error);
			}
			try {
				injectStyle();
				injectStickers();
				injectBrandBits();
			} catch (error) {
				console.error("[naiwa-skin] css/brand injection failed:", error);
			}
		}

		exports.apply = apply;
		/** 需要 ui-theme 的 theme 服务（inject 解析完成后才调用 apply）。 */
		exports.inject = ["theme"];
		return module.exports;
	}
});
