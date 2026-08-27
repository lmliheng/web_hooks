import crypto from 'node:crypto'
import express from 'express'

const router = express.Router()

/**
 * 微信公众号服务器验证
 * 微信校验规则：将 token、timestamp、nonce 三个参数按字典序排序后拼接成字符串，
 * 再做 sha1 加密，与请求携带的 signature 比对，一致则确认请求来自微信服务器。
 *
 * 注意：这里不再使用 @lmliheng/agent 的 AuthWithServer，
 * 其实现存在两个问题：
 *  1. 排序用 (a, b) => a - b 数字比较，而微信要求字典序，nonce 为非数字字符串时会失效；
 *  2. 校验失败时返回 Error 对象（truthy），调用方无法区分成功/失败。
 * 上游修复发版后可再切换回去。
 *
 * @param {string} signature 微信加密签名
 * @param {string} timestamp 时间戳
 * @param {string} nonce     随机数
 * @param {string} token     开发者填写的 token（与公众平台后台一致）
 * @returns {boolean} 校验是否通过
 */
export function verifyWechatSignature(signature, timestamp, nonce, token) {
    if (!signature || !timestamp || !nonce || !token) {
        return false
    }

    const str = [token, timestamp, nonce].sort().join('')
    const sha1 = crypto.createHash('sha1').update(str).digest('hex')
    return sha1 === String(signature).toLowerCase()
}

router.get('/wx', (req, res) => {
    const { signature, timestamp, nonce, echostr } = req.query

    if (!echostr) {
        res.status(400).end()
        return
    }

    const token = process.env.WECHAT_TOKEN || process.env.token || 'liheng'

    if (verifyWechatSignature(signature, timestamp, nonce, token)) {
        // 校验通过：原样返回 echostr，微信接入即生效
        res.send(echostr)
    } else {
        res.status(403).end()
    }
})

export {
    router
}
