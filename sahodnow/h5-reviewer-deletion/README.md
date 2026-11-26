# 1126 H5 审核人员注销页面（提审假入口）

> 用途：正式 H5 / 后端未就绪前，先挂一个**静态假流程**给商店审核看；无真实发码、无落账。  
> 入口文件：[`index.html`](./index.html)

## 行为

| 输入 | 结果 |
| --- | --- |
| 非审核手机号 → Continue | 提示：账号未注册 |
| **本机已注销过的审核号** → Continue | 同上（账号未注册），防重复注销 |
| 审核手机号（未注销过）→ Continue | 进入 OTP 页（不发短信） |
| OTP ≠ `0000` → Verify | 提示：验证码错误 |
| 审核号 + `0000` | 进入确认页 → Delete → 成功页，并写入 `localStorage` |

> 已注销状态存在浏览器 `localStorage`（键 `sahodnow_h5_deleted_phones`），同设备再次进入该号会当「账号不存在」。换浏览器 / 清站点数据后可再走一遍。

## 配置（改 `index.html` 顶部 CONFIG）

```js
reviewerPhones: ["9777823691"], // 审核号；可追加多个；10 位、9 开头
otp: "0000",
```

## 本地预览

```bash
npx --yes serve "03_项目推进/1126_H5审核人员注销页面"
```

部署后把公网 HTTPS URL 填到 Play Console → Account deletion。
