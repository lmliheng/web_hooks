import crypto from 'node:crypto'

/**
 * 微信公众号服务器验证
 * 规则：将 token、timestamp、nonce 按字典序排序后拼接，sha1 加密，与 signature 比对。
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
