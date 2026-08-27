/**
 * dsh-naiwa-skin — browser half（模板；scripts/build.mjs 把素材 JSON
 * 替换为 data URI 后生成 lib/client.js）。
 *
 * v0.2 架构：可插拔的「注册主题」皮肤 —— 不改默认皮肤。
 *
 *  1. ctx.theme.register() 把 naiwa-light / naiwa-dark 注册为一等主题
 *     （基于基础配色的 alias token 覆盖，这是主题系统为第三方皮肤预留
 *     的正式通道）。内置 light/dark 主题永远保持原样：插件卸载即回到
 *     默认皮肤，注册主题随插件销毁自动把偏好重置回默认。
 *  2. 设置 → 通用 → 「奶娃皮肤」开关行（slots 注入，随插件销毁移除）。
 *     关 = 立即回到默认皮肤；开关状态存 localStorage，默认开。
 *  3. 开启时，内置 浅色/深色/跟随系统 三个方块继续可用 —— 它们选择
 *     的是明/暗方案，奶娃皮肤随之包裹（naiwa-light / naiwa-dark）；
 *     跟随系统时由本插件监听系统配色切换。
 *  4. 非主题 token 的视觉件（奶黄渐变背景、奶娃光标、logo 替换、
 *     贴纸水印、favicon）只在奶娃主题处于激活态时挂载，切回内置主题
 *     或关闭开关时全部卸载 —— 全部通过 ctx.effect 注册，随插件销毁
 *     一并回收。
 *
 * 自包含：素材以 data URI 内联；仅 require 平台静态模块 react。
 */
window.__ModuleLoader__.load({
	id: "dsh-naiwa-skin",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");
		var h = React.createElement;

		/** 素材 data URI（build 时由 scripts/build.mjs 的输出注入）。 */
		var ASSETS = __ASSETS_JSON__;

		/** 主题注册 id 与开关持久化键。 */
		var LIGHT_ID = "naiwa-light";
		var DARK_ID = "naiwa-dark";
		var OUR_IDS = { "naiwa-light": true, "naiwa-dark": true };
		var LS_KEY = "dsh-naiwa-skin:on";
		var SETTINGS_NS = "settings.naiwa";

		/**
		 * naiwa-light 主题 token（扁平 值→字符串；主题系统按
		 * colorScheme=light 基础配色叠加这些 alias 覆盖）。
		 * V2 主调：奶娃鹅黄 #FFD23F / 按钮亮黄 #FFC42E / 暖棕文字 / 奶黄背景。
		 */
		var LIGHT_TOKENS = {
			// ── 背景（奶黄系）──────────────────────────────────────
			"--dsw-alias-bg-base": "#FFF9EC",
			"--dsw-alias-bg-layer-1": "#FFFDF6",
			"--dsw-alias-bg-layer-2": "#FFF5D6",
			"--dsw-alias-bg-layer-3": "#FFEFC2",
			"--dsw-alias-bg-overlay": "#FFE9B6",
			"--dsw-alias-bg-module-platform": "#FFF2D0",
			"--dsw-alias-bg-multi-select": "#FFF3D4",
			"--dsw-alias-bg-skeleton": "rgba(230, 170, 30, 0.10)",
			// ── 边框（黄棕）────────────────────────────────────────
			"--dsw-alias-border-l1": "rgba(214, 158, 32, 0.12)",
			"--dsw-alias-border-l2": "rgba(214, 158, 32, 0.22)",
			"--dsw-alias-border-l3": "rgba(214, 158, 32, 0.30)",
			"--dsw-alias-border-l4": "rgba(214, 158, 32, 0.38)",
			"--dsw-alias-border-inverted": "rgba(214, 158, 32, 0.12)",
			"--dsw-alias-border-inverted2": "rgba(214, 158, 32, 0.12)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(214, 158, 32, 0.16)",
			// ── 品牌（奶娃黄）──────────────────────────────────────
			"--dsw-alias-brand-primary": "#C77400",
			"--dsw-alias-brand-primary-invert": "#FFF9EC",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "#E8912D",
			"--dsw-alias-brand-text": "#8A5A00",
			// ── 文字（暖棕）────────────────────────────────────────
			"--dsw-alias-label-primary": "#402F0A",
			"--dsw-alias-label-secondary": "#7C642A",
			"--dsw-alias-label-tertiary": "#9C8350",
			"--dsw-alias-label-caption": "#A88F5C",
			"--dsw-alias-label-dimmed": "#D9C393",
			"--dsw-alias-label-primary-dimmed": "#4A380F",
			"--dsw-alias-label-primary-bluish": "#B07200",
			"--dsw-alias-label-primary-foreground": "#5A3E06",
			"--dsw-alias-label-primary-inverted": "#FFFDF6",
			// ── 按钮（鹅黄主按钮 + 深棕文字）──────────────────────
			"--dsw-alias-button-primary-fill": "#FFC42E",
			"--dsw-alias-button-primary-hover": "#FFB800",
			"--dsw-alias-button-primary-dimmed": "#FFF1C2",
			"--dsw-alias-button-contrast-fill": "#B07200",
			"--dsw-alias-button-elevated-fill": "#FFFDF6",
			"--dsw-alias-button-floating-fill": "#FFFDF6",
			"--dsw-alias-button-floating-hover": "#FFF3D0",
			"--dsw-alias-button-info-fill": "#D97706",
			"--dsw-alias-button-info-hover": "#C2560B",
			"--dsw-alias-button-ghost-active-fill": "#FFF2CF",
			"--dsw-alias-button-ghost-active-hover": "#FFEBBB",
			"--dsw-alias-button-ghost-active-border": "#E8B84A",
			// ── 交互态 ─────────────────────────────────────────────
			"--dsw-alias-interactive-bg-hover": "rgba(230, 170, 30, 0.12)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(230, 170, 30, 0.18)",
			"--dsw-alias-interactive-bg-active": "rgba(230, 170, 30, 0.18)",
			"--dsw-alias-interactive-bg-hover-solid": "#FFF4D4",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(224, 69, 42, 0.07)",
			// ── 代码块 / markdown ──────────────────────────────────
			"--dsw-alias-markdown-code-block": "#FFF6DC",
			"--dsw-alias-markdown-code-block-banner": "#FFF9E8",
			"--dsw-alias-markdown-inline-code": "#FFEFC0",
			"--dsw-alias-markdown-citation": "#FFF3D0",
			"--dsw-alias-markdown-tag": "#FFF4D4",
			"--dsw-alias-markdown-placeholder": "#FFF3CE",
			"--dsw-alias-markdown-code-segment-selected": "#FFFDF6",
			"--dsw-alias-markdown-code-segment-unselected": "#FFF3CE",
			// ── 滚动条（奶黄）──────────────────────────────────────
			"--dsw-alias-scrollbar-bg-l1": "#FFE494",
			"--dsw-alias-scrollbar-bg-l2": "#FFE494",
			"--dsw-alias-scrollbar-hover-l1": "#F5C94A",
			"--dsw-alias-scrollbar-hover-l2": "#F5C94A",
			// ── 状态色（暖调，成功用奶娃眼睛绿）────────────────────
			"--dsw-alias-state-success-primary": "#3E9E55",
			"--dsw-alias-state-success-secondary": "#5CBE78",
			"--dsw-alias-state-success-tertiary": "#DFF5E3",
			"--dsw-alias-state-error-primary": "#E0452A",
			"--dsw-alias-state-error-secondary": "#F0664A",
			"--dsw-alias-state-warn-primary": "#F2A81E",
			"--dsw-alias-state-warn-secondary": "#F5C94A",
			"--dsw-alias-state-warn-label": "#C77400",
			"--dsw-alias-state-warn-tertiary": "#FFF0C8",
			"--dsw-alias-state-business-primary": "#E8912D",
			"--dsw-alias-state-business-tertiary": "#FFF0C8",
			// ── 浮层 ───────────────────────────────────────────────
			"--dsw-alias-toast-bg": "#5A4308",
			"--dsw-alias-tooltip-bg": "#5A4308",
			// ── 侧边栏（奶黄）──────────────────────────────────────
			"--dsw-specific-sidebar-fill": "#FFEFC0"
		};

		/** naiwa-dark 主题 token（colorScheme=dark 基础配色上的覆盖）。 */
		var DARK_TOKENS = {
			"--dsw-alias-bg-base": "#1B1509",
			"--dsw-alias-bg-layer-1": "#231B0D",
			"--dsw-alias-bg-layer-2": "#2B2110",
			"--dsw-alias-bg-layer-3": "#342814",
			"--dsw-alias-bg-overlay": "#46361B",
			"--dsw-alias-bg-module-platform": "#291F0E",
			"--dsw-alias-bg-multi-select": "#2E2412",
			"--dsw-alias-bg-skeleton": "rgba(255, 220, 120, 0.08)",
			"--dsw-alias-border-l1": "rgba(255, 225, 140, 0.08)",
			"--dsw-alias-border-l2": "rgba(255, 225, 140, 0.14)",
			"--dsw-alias-border-l3": "rgba(255, 225, 140, 0.20)",
			"--dsw-alias-border-l4": "rgba(255, 225, 140, 0.26)",
			"--dsw-alias-border-inverted": "rgba(255, 225, 140, 0.08)",
			"--dsw-alias-border-inverted2": "rgba(255, 225, 140, 0.08)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(255, 225, 140, 0.08)",
			"--dsw-alias-brand-primary": "#FFD23F",
			"--dsw-alias-brand-primary-invert": "#241A04",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "#FFC42E",
			"--dsw-alias-brand-text": "#FFE89A",
			"--dsw-alias-label-primary": "#FFF3D0",
			"--dsw-alias-label-secondary": "#D9BC85",
			"--dsw-alias-label-tertiary": "#A98F5C",
			"--dsw-alias-label-caption": "#977F4E",
			"--dsw-alias-label-dimmed": "#6E5B30",
			"--dsw-alias-label-primary-dimmed": "#F5E3B4",
			"--dsw-alias-label-primary-bluish": "#FFD96E",
			"--dsw-alias-label-primary-foreground": "#4A3408",
			"--dsw-alias-label-primary-inverted": "#FFFDF6",
			"--dsw-alias-button-primary-fill": "#FFC42E",
			"--dsw-alias-button-primary-hover": "#FFD23F",
			"--dsw-alias-button-primary-dimmed": "#33270F",
			"--dsw-alias-button-contrast-fill": "#FFE89A",
			"--dsw-alias-button-elevated-fill": "#342814",
			"--dsw-alias-button-floating-fill": "#2B2110",
			"--dsw-alias-button-floating-hover": "#342814",
			"--dsw-alias-button-info-fill": "#E8912D",
			"--dsw-alias-button-info-hover": "#F2A81E",
			"--dsw-alias-button-ghost-active-fill": "#382C13",
			"--dsw-alias-button-ghost-active-hover": "#423315",
			"--dsw-alias-button-ghost-active-border": "#977F4E",
			"--dsw-alias-interactive-bg-hover": "rgba(255, 225, 140, 0.09)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(255, 225, 140, 0.16)",
			"--dsw-alias-interactive-bg-active": "rgba(255, 225, 140, 0.16)",
			"--dsw-alias-interactive-bg-hover-solid": "#342814",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(244, 112, 78, 0.16)",
			"--dsw-alias-markdown-code-block": "#1F180A",
			"--dsw-alias-markdown-code-block-banner": "#241C0C",
			"--dsw-alias-markdown-inline-code": "#2A200E",
			"--dsw-alias-markdown-citation": "#2A200E",
			"--dsw-alias-markdown-tag": "#2B2110",
			"--dsw-alias-markdown-placeholder": "#261D0C",
			"--dsw-alias-markdown-code-segment-selected": "#342814",
			"--dsw-alias-markdown-code-segment-unselected": "#1F180A",
			"--dsw-alias-scrollbar-bg-l1": "#4A3A17",
			"--dsw-alias-scrollbar-bg-l2": "#4A3A17",
			"--dsw-alias-scrollbar-hover-l1": "#5E4A1E",
			"--dsw-alias-scrollbar-hover-l2": "#5E4A1E",
			"--dsw-alias-state-success-primary": "#5CBE78",
			"--dsw-alias-state-success-secondary": "#5CBE78",
			"--dsw-alias-state-success-tertiary": "#1A3320",
			"--dsw-alias-state-error-primary": "#F4704E",
			"--dsw-alias-state-error-secondary": "#F4704E",
			"--dsw-alias-state-warn-primary": "#F2A81E",
			"--dsw-alias-state-warn-secondary": "#F5C94A",
			"--dsw-alias-state-warn-label": "#F5C94A",
			"--dsw-alias-state-warn-tertiary": "#3D2E10",
			"--dsw-alias-state-business-primary": "#F2A81E",
			"--dsw-alias-state-business-tertiary": "#3D2E10",
			"--dsw-alias-toast-bg": "#46361B",
			"--dsw-alias-tooltip-bg": "#46361B",
			"--dsw-specific-sidebar-fill": "#201807"
		};

		/**
		 * 皮肤 CSS 模板（仅奶娃主题激活时挂载）。%%LOGO%% / %%ICON%% /
		 * %%NEWCHAT%% / %%CURSOR%% / %%CURSOR_POINTER%% / %%DIVING%% 在
		 * 挂载时替换为 ASSETS 中的 data URI。
		 */
		var SKIN_CSS = [
			"/* ===== dsh-naiwa-skin v2（可插拔注册主题）===== */",

			// 圆体优先的字体栈
			":root{--dsw-font-family:'YouYuan','Yuanti SC','幼圆','PingFang SC','Hiragino Sans GB','Microsoft YaHei','Segoe UI',Helvetica,Arial,sans-serif}",

			// 聊天区背景：奶黄柔和渐变（叠加在主题 token 的纯色之上）
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

		/**
		 * 设置行样式（材质化时注入一次；data-plugin 标记使其被模块系统
		 * 记账到本插件名下）。颜色全部走 --dsw-alias-* token，自动适配
		 * 当前明暗主题。
		 */
		var ROW_CSS = [
			".naiwa-skin-row{border-bottom:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0;font:inherit}",
			".naiwa-skin-row-title{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}",
			".naiwa-skin-row-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin-top:2px;max-width:420px}",
			".naiwa-skin-row-side{display:flex;align-items:center;gap:10px;flex:none}",
			".naiwa-skin-row-state{color:var(--dsw-alias-label-secondary);font-size:13px}",
			".naiwa-skin-switch{position:relative;width:40px;height:22px;border-radius:11px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-3);cursor:pointer;padding:0;transition:background .15s ease,border-color .15s ease}",
			".naiwa-skin-switch:hover{border-color:var(--dsw-alias-border-l4)}",
			".naiwa-skin-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
			".naiwa-skin-switch-thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-label-primary-inverted);box-shadow:0 1px 2px rgba(0,0,0,.2);transition:left .15s ease}",
			".naiwa-skin-switch[aria-checked=\"true\"]{background:var(--dsw-alias-button-primary-fill);border-color:var(--dsw-alias-button-primary-fill)}",
			".naiwa-skin-switch[aria-checked=\"true\"] .naiwa-skin-switch-thumb{left:20px}"
		].join("\n");

		/** 材质化时注入设置行样式（幂等；显式打上 data-plugin 标记）。 */
		var rowStyleEl = null;
		if (typeof document !== "undefined" && !document.querySelector("style[data-naiwa-row]")) {
			rowStyleEl = document.createElement("style");
			rowStyleEl.setAttribute("data-plugin", "dsh-naiwa-skin");
			rowStyleEl.setAttribute("data-plugin-css", "dsh-naiwa-skin/row.css");
			rowStyleEl.setAttribute("data-naiwa-row", "1");
			rowStyleEl.textContent = ROW_CSS;
			document.head.appendChild(rowStyleEl);
		} else if (typeof document !== "undefined") {
			rowStyleEl = document.querySelector("style[data-naiwa-row]");
		}

		// ── 视觉件挂载/卸载（只在奶娃主题激活期间存在）────────────────
		var extras = { style: null, stickers: [], favicon: null };

		function mountExtras() {
			if (extras.style === null) {
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
				extras.style = style;
			}
			if (extras.stickers.length === 0) {
				var mk = function (uri, cls) {
					var d = document.createElement("div");
					d.setAttribute("data-naiwa-sticker", "1");
					d.className = "naiwa-bg-sticker " + cls;
					d.style.backgroundImage = "url('" + uri + "')";
					return d;
				};
				extras.stickers.push(document.body.appendChild(mk(ASSETS.stickerLg, "naiwa-bg-sticker-lg")));
				extras.stickers.push(document.body.appendChild(mk(ASSETS.stickerSm, "naiwa-bg-sticker-sm")));
			}
			if (extras.favicon === null) {
				var link = document.createElement("link");
				link.rel = "icon";
				link.type = "image/svg+xml";
				link.href = ASSETS.favicon;
				link.setAttribute("data-naiwa-skin", "1");
				document.head.appendChild(link);
				extras.favicon = link;
			}
		}

		function unmountExtras() {
			if (extras.style !== null) {
				extras.style.remove();
				extras.style = null;
			}
			for (var i = 0; i < extras.stickers.length; i++) extras.stickers[i].remove();
			extras.stickers = [];
			if (extras.favicon !== null) {
				extras.favicon.remove();
				extras.favicon = null;
			}
		}

		function syncExtras(activeId) {
			if (OUR_IDS[activeId] === true) mountExtras();
			else unmountExtras();
		}

		// ── 设置行组件 ─────────────────────────────────────────────────
		var zh = {
			"title": "奶娃皮肤",
			"hint": "开启后使用奶娃主题（可插拔的独立主题，默认皮肤保持原样）；关闭立即恢复默认皮肤。浅色/深色/跟随系统继续用于选择明暗方案。",
			"on": "已开启",
			"off": "已关闭"
		};
		var en = {
			"title": "Naiwa Skin",
			"hint": "A pluggable standalone theme — the default skin stays untouched. Turn off to switch back to the stock theme instantly. Light/Dark/System keep selecting the color scheme.",
			"on": "On",
			"off": "Off"
		};

		function NaiwaSkinRow(props) {
			var t = typeof props.t === "function" ? props.t : function (key) { return zh[key] || key; };
			var useState = React.useState;
			var _useState = useState(function () {
				return typeof props.isSkinOn === "function" ? props.isSkinOn() : false;
			});
			var on = _useState[0];
			var setOn = _useState[1];
			var toggle = function () {
				if (typeof props.setSkinEnabled === "function") setOn(props.setSkinEnabled(!on));
			};
			return h("div", { className: "naiwa-skin-row" },
				h("div", { className: "naiwa-skin-row-main" },
					h("div", { className: "naiwa-skin-row-title" }, t("title")),
					h("div", { className: "naiwa-skin-row-hint" }, t("hint"))),
				h("div", { className: "naiwa-skin-row-side" },
					h("span", { className: "naiwa-skin-row-state", "data-naiwa-on": on ? "1" : "0" }, on ? t("on") : t("off")),
					h("button", {
						type: "button",
						role: "switch",
						"aria-checked": on ? "true" : "false",
						className: "naiwa-skin-switch",
						onClick: toggle
					}, h("span", { className: "naiwa-skin-switch-thumb" }))));
		}

		// ── 皮肤控制器：注册主题 + 开关 + 方案跟随 ─────────────────────
		function makeController(ctx) {
			var skinOn = true;
			try {
				skinOn = window.localStorage.getItem(LS_KEY) !== "0";
			} catch (error) { /* 私密模式等场景保持默认开 */ }
			var underlying = "system"; // 最近一次内置偏好（light/dark/system）
			var disposed = false;

			var isOurs = function (id) { return OUR_IDS[id] === true; };
			var variantFor = function (scheme) { return scheme === "dark" ? DARK_ID : LIGHT_ID; };
			var rememberUnderlying = function (preference) {
				if (preference === "light" || preference === "dark" || preference === "system") underlying = preference;
			};
			var safeSetTheme = function (id) {
				try { ctx.theme.setTheme(id); } catch (error) {
					console.warn("[naiwa-skin] setTheme(" + id + ") failed:", error);
				}
			};

			/** 切到当前方案对应的奶娃变体（仅在皮肤开启且当前不是奶娃时）。 */
			var adopt = function () {
				if (!skinOn || disposed) return;
				var snap = ctx.theme.getTheme();
				if (isOurs(snap.preference)) return;
				safeSetTheme(variantFor(snap.active.colorScheme));
			};

			/** theme/change：记录内置偏好；皮肤开启时把内置选择包裹为奶娃变体。 */
			var onChange = function (snap) {
				rememberUnderlying(snap.preference);
				if (!disposed && skinOn && !isOurs(snap.preference)) adopt();
				syncExtras(ctx.theme.getTheme().active.id);
			};

			/** 系统明暗翻转：仅在 跟随系统 + 皮肤开启 + 当前奶娃 时切换变体。 */
			var media = typeof matchMedia !== "undefined" ? matchMedia("(prefers-color-scheme: dark)") : undefined;
			var onMedia = function () {
				if (disposed || !skinOn || underlying !== "system" || !media) return;
				var snap = ctx.theme.getTheme();
				if (!isOurs(snap.preference)) return;
				var want = variantFor(media.matches ? "dark" : "light");
				if (snap.preference !== want) safeSetTheme(want);
			};

			ctx.effect(function () {
				var disposers = [];
				try {
					disposers.push(ctx.theme.register({ id: LIGHT_ID, colorScheme: "light", tokens: LIGHT_TOKENS }));
				} catch (error) {
					console.warn("[naiwa-skin] register naiwa-light failed (already registered?):", error);
				}
				try {
					disposers.push(ctx.theme.register({ id: DARK_ID, colorScheme: "dark", tokens: DARK_TOKENS }));
				} catch (error) {
					console.warn("[naiwa-skin] register naiwa-dark failed (already registered?):", error);
				}
				disposers.push(ctx.on("theme/change", onChange));
				if (media) {
					media.addEventListener("change", onMedia);
					disposers.push(function () { media.removeEventListener("change", onMedia); });
				}
				rememberUnderlying(ctx.theme.getTheme().preference);
				if (skinOn) adopt();
				syncExtras(ctx.theme.getTheme().active.id);
				return function () {
					disposed = true;
					for (var i = disposers.length - 1; i >= 0; i--) {
						try { disposers[i](); } catch (error) { /* 注销路径尽力而为 */ }
					}
					unmountExtras();
				};
			}, "naiwa-skin: theme registration + activation");

			return {
				isSkinOn: function () { return skinOn; },
				setSkinEnabled: function (value) {
					skinOn = value === true;
					try { window.localStorage.setItem(LS_KEY, skinOn ? "1" : "0"); } catch (error) { /* 持久化失败不影响当次生效 */ }
					if (!disposed) {
						if (skinOn) adopt();
						else if (isOurs(ctx.theme.getTheme().preference)) safeSetTheme(underlying);
						syncExtras(ctx.theme.getTheme().active.id);
					}
					return skinOn;
				}
			};
		}

		/**
		 * 客户端插件主体：注册奶娃主题 + 设置行。全部效果经 ctx.effect
		 * 登记，插件停用/卸载时逐一回收（主题注销会把激活偏好重置回默认）。
		 * @param {import('@deepseek-ai/cordis').Context} ctx - 客户端 cordis 上下文。
		 */
		function apply(ctx) {
			if (!ctx.theme || typeof ctx.theme.register !== "function") {
				console.warn("[naiwa-skin] theme service unavailable — plugin stays dormant (default skin untouched)");
				return;
			}
			var controller = makeController(ctx);

			if (ctx.locale && typeof ctx.locale.register === "function") {
				ctx.effect(function () {
					return ctx.locale.register(SETTINGS_NS, { zh: zh, en: en });
				}, "naiwa-skin: settings row dictionaries");
			}

			if (ctx.slots && typeof ctx.slots.inject === "function") {
				ctx.effect(function () {
					return ctx.slots.inject("settings.general.item", function () {
						return ctx.slots.register({
							name: "settings.general.item",
							id: "naiwa-skin",
							order: 20,
							locale: SETTINGS_NS,
							inject: function () {
								return {
									isSkinOn: function () { return controller.isSkinOn(); },
									setSkinEnabled: function (value) { return controller.setSkinEnabled(value); }
								};
							}
						}, NaiwaSkinRow);
					});
				}, "naiwa-skin: settings row");
			}
		}

		exports.apply = apply;
		/** 需要 theme（注册主题）、slots（设置行）、locale（行文案）。 */
		exports.inject = ["theme", "slots", "locale"];
		return module.exports;
	}
});
