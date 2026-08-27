# web_hooks

webHook 相关的工作，目前是**微信公众号自动回复**，部署在**微信云托管**。

## 本地开发

```bash
npm install
npm run dev     # nodemon 热重载
npm test        # node:test 单元测试
npm run lint    # eslint
```

## 接口

| 路径 | 说明 |
| --- | --- |
| `GET /wx` | 公众号服务器配置验证，校验通过原样返回 `echostr` |
| `POST /wx` | 接收公众号消息，自动回复 |
| `GET /health` | 健康检查（云托管探活） |

## 公众号自动回复

支持两种回复模式，由环境变量 `REPLY_MODE` 控制：

- **`passive`（默认）**：收到消息后 5 秒内以 XML 被动回复，无需任何鉴权，公众号后台直接可用。
- **`openapi`**：通过微信云托管「开放接口服务」免 access_token 调用 `/cgi-bin/message/custom/send` 发客服消息，适合延迟回复 / 主动下发（用户 48h 内有互动才可发）。

关键词规则默认内置（你好 / hi / 菜单 / 帮助），可用环境变量 `REPLY_RULES` 覆盖：

```bash
REPLY_RULES='{"你好":"你好呀","优惠":"当前暂无优惠"}'
```

## 微信云托管部署

1. 仓库根目录已有 `Dockerfile`，控制台选择**代码仓库 + Dockerfile 构建**，端口 `80`，健康检查路径 `/health`。
2. 环境变量：`WECHAT_TOKEN`（公众号后台填写的 token，必配）、`REPLY_MODE`（可选，默认 passive）、`REPLY_RULES`（可选）。
3. 使用「开放接口服务」（`REPLY_MODE=openapi` 时需要）：
   - 控制台 → **云调用 → 开放接口服务** 打开开关；
   - 在「**微信令牌权限配置**」中加入要调的接口，如 `/cgi-bin/message/custom/send`；
   - 开启后**重新构建服务版本**才生效（旧版本实例不带此能力）；
   - 容器内以 HTTP 直接调 `api.weixin.qq.com` 接口、**不带 access_token**，响应头 `x-openapi-seqid` 表示走了云调用链路。
   - 详见 [官方文档：开放接口服务](https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/guide/weixin/open.html)。
4. 公众号后台 → 设置与开发 → 服务器配置：URL 填 `https://云托管域名/wx`，Token 与 `WECHAT_TOKEN` 一致，消息加解密方式选「明文模式」。
