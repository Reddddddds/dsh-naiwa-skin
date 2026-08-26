# dsh-naiwa-skin

DeepSeek Harness web 界面的奶娃皮肤：奶黄配色、奶娃 logo、奶娃光标、背景水印、加载动画。

## 安装

```powershell
dsh plugin --profile web add dsh-naiwa-skin
# 然后重启 web 服务（页面会短暂断开，会话保留）
```

## 卸载

```powershell
dsh plugin --profile web remove dsh-naiwa-skin
# 然后重启 web 服务
```

## 自定义

素材在 `lib/assets/`，配色在 `src/client.template.js` 的 `TOKEN_OVERRIDES`。修改后：

```powershell
node scripts\build.mjs
# 然后重启 web 服务
```
