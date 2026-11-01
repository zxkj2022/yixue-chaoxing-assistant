# 官方脚本 API 接入核对

核对日期：2026-11-01。依据题库项目当前 `docs/API.md`、`backend/app/request_clients.py` 和 `backend/app/security.py`；对外协议仍为版本 1。

## 请求地址与来源

官方脚本继续使用 `POST https://api.sanzwk.com/api/v1/search`。`POST /api/ocs/answer` 是独立的 OCS 适配入口，脚本不切换到该接口。免费余额和能力接口仍为 `GET /api/v1/balance`、`GET /api/v1/capabilities`。

向官方域名发送有鉴权的请求时增加：

```http
X-Yisou-Client: yisou-script
X-Yisou-Client-Version: 4.1.21
```

版本读取脚本内的发布元数据，每次构建自动保持一致。官方兼容线路保留这两个字段；自定义 API 域名及匿名健康探测不附带官方来源声明。

这两个字段是公开的来源统计标识，不是认证签名或共享秘密。不收集设备 ID、浏览器属性、硬件信息或跨站设备指纹；查询权限、计费和限流继续由账户 Token 和题库决定。

## Token 与幂等

新版 Token 由题库的 `token_urlsafe(32)` 生成，为 43 个 URL 安全字符，无固定前缀。脚本保留对已有 `ys_`、`tk_` 凭证的兼容，拒绝采集用 `sub_` 凭证、错误长度、空白和非允许字符。输入区提示完整复制，不自动添加、删除或猜测前缀。

Token 仍仅通过 `Authorization: Bearer ...` 发送；不加入 URL、日志或请求来源标识。响应即使把无前缀 Token 回显成请求编号或幂等键，也不会进入诊断输出。

查题请求体仍使用题干、选项、题型与原 AI 开关。网络结果不确定时保留原 `Idempotency-Key`；官方域名兼容切换也复用原键。来源标识不改变计费行为。

## 验证方式

协议回归检查新旧 Token、官方来源与发布版本、独立 OCS 路径边界、自定义服务隔离、重试和凭证回显脱敏。安装包浏览器回归使用无前缀测试 Token 完成考试预览后的查题流程。未使用真实账户 Token，也未调用真实计费查询验证。
