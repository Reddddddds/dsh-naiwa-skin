# dsh-naiwa-skin

DeepSeek Harness web 界面的**可插拔**奶娃皮肤插件。

奶娃皮肤不是「改默认皮肤」——它通过 DSH 主题系统把 `naiwa-light` /
`naiwa-dark` 注册为**独立的一等主题**（基于基础配色做 alias-token 覆盖，
这是主题系统为第三方皮肤预留的正式通道）。内置的浅色/深色主题永远保持
原样：**卸载插件、关闭开关、或把插件在配置里禁用，界面都会回到 100%
默认皮肤，且 DSH 安装目录一个字节都不动。**

## 特性

- 🎨 独立注册主题：`naiwa-light` / `naiwa-dark`，浅色深色双方案，跟随系统切换
- 🐣 视觉件：奶黄渐变背景、奶娃 logo、螺旋奶娃新会话按钮、奶娃光标、背景贴纸、favicon
- 🔘 设置开关：设置 → 通用 →「奶娃皮肤」，关掉立即恢复默认皮肤（无需重启、无需卸载）
- 🧩 真·可插拔：卸载插件后没有任何残留，默认皮肤原样
- 📦 零构建依赖：素材以 data URI 内联，仅使用平台静态模块 `react`

## 安装

```powershell
# 方式一：npm 安装
dsh plugin --profile web add dsh-naiwa-skin

# 方式二：本地打包（本仓库）
npm pack --pack-destination dist
dsh plugin --profile web add "file:D:/path/to/dsh-naiwa-skin/dist/dsh-naiwa-skin-0.2.0.tgz"

# 然后重启 web 服务（页面会短暂断开，会话保留）
powershell -ExecutionPolicy Bypass -File scripts\restart.ps1
```

安装后皮肤默认开启；浏览器内状态存于 `localStorage`。

## 使用

| 操作 | 效果 |
| --- | --- |
| 设置 → 通用 →「奶娃皮肤」开关 | 开 = 奶娃皮肤；关 = **立即**回到默认皮肤（可随时再开） |
| 设置 → 外观：浅色 / 深色 / 跟随系统 | 奶娃皮肤开启时用于选择明暗方案（浅色 → naiwa-light，深色 → naiwa-dark，跟随系统 → 随系统自动切换） |
| 卸载插件 + 重启 | 100% 恢复默认皮肤，无残留 |

## 卸载

```powershell
dsh plugin --profile web remove dsh-naiwa-skin
# 然后重启 web 服务
```

或者在 profile 的 `cordis.patch.yml` 里禁用（不删除）：

```yaml
- id: naiwa-skin
  disabled: true
```

两种方式都会让界面回到默认皮肤；唯一保留的是浏览器里的
`dsh-naiwa-skin:on` 持久化键，它只在该插件再次安装时才有意义，无害。

## 开发

```powershell
# 改 src/client.template.js（含主题 token、皮肤 CSS、设置行）后重新构建：
node scripts/build.mjs        # 生成 lib/client.js
node --check lib/client.js    # 语法检查
npm pack --pack-destination dist
dsh plugin --profile web add "file:dist/dsh-naiwa-skin-<version>.tgz"
powershell -ExecutionPolicy Bypass -File scripts\restart.ps1
```

换图：替换 `lib/assets/` 下的素材（`logo/icon/favicon/newchat` 为 SVG，
`cursor` 为 PNG，`diving` 为 WebP），然后同上重新构建。

- 主题 token 定义在 `src/client.template.js` 的 `LIGHT_TOKENS` / `DARK_TOKENS`（扁平字符串，按 `colorScheme` 基础配色叠加）
- 皮肤 CSS 模板在 `SKIN_CSS`，仅在奶娃主题激活时挂载
- 设置开关行通过 `slots` 注入 `settings.general.item`，随插件生命周期挂载/回收

## 原理（为什么可插拔）

- 主题注册走 `ctx.theme.register({ id, colorScheme, tokens })` —— 官方为
  第三方主题预留的注册通道；注销时若该主题正被使用，偏好自动重置回默认。
- 非 token 视觉件（渐变、光标、logo、贴纸、favicon）只在奶娃主题**激活**
  时存在，切回内置主题或关闭开关时全部卸载。
- 所有挂载点都挂在 `ctx.effect` 下：插件停用/卸载时由 cordis 统一回收。
- 不写 DSH 安装目录、不碰 `@deepseek-ai/dsh-client-ui-theme`、不做
  `!important` 长期覆盖（渐变 CSS 仅在皮肤激活期间注入）。

## 许可

MIT
