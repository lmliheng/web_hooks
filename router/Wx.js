import express from 'express'

import { verifyWechatSignature } from '../service/wechat-auth.js'
import { buildReply } from '../service/reply.js'
import { sendCustomerMessage } from '../service/openapi.js'
import { buildTextReply, parseXmlMessage } from '../util/xml.js'

const router = express.Router()

function getToken() {
    return process.env.WECHAT_TOKEN || process.env.token || 'liheng'
}

// 公众号服务器配置验证（GET）：校验通过则原样返回 echostr，接入生效
router.get('/wx', (req, res) => {
    const { signature, timestamp, nonce, echostr } = req.query

    if (!echostr) {
        res.status(400).end()
        return
    }

    if (verifyWechatSignature(signature, timestamp, nonce, getToken())) {
        res.send(echostr)
    } else {
        res.status(403).end()
    }
})

// 接收公众号消息并自动回复（POST，body 为微信推送的 XML）
// 回复模式由环境变量 REPLY_MODE 控制：
//   passive（默认）：5 秒内以 XML 被动回复，无需任何鉴权
//   openapi      ：通过「开放接口服务」免 access_token 调客服消息接口下发
router.post('/wx', async (req, res) => {
    const { signature, timestamp, nonce } = req.query

    if (!verifyWechatSignature(signature, timestamp, nonce, getToken())) {
        res.status(403).end()
        return
    }

    const message = parseXmlMessage(req.body || '')
    const openid = message.FromUserName
    const replyContent = buildReply(message)

    if (process.env.REPLY_MODE === 'openapi') {
        // 客服消息方式：适合延迟回复/主动消息；无内容时按微信约定返回 success
        if (replyContent) {
            await sendCustomerMessage(openid, replyContent)
                .catch((err) => console.error('客服消息发送失败:', err.message))
        }
        res.status(200).send('success')
        return
    }

    // 被动回复方式
    if (replyContent) {
        res.type('application/xml')
        res.send(buildTextReply({ from: message.ToUserName, to: openid, content: replyContent }))
    } else {
        res.status(200).send('success')
    }
})

export {
    router
}
