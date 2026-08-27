import axios from 'axios'

// 「开放接口服务」：微信云托管提供的免鉴权云调用链路。
// 开启后（控制台 → 云调用 → 开放接口服务，并把需要的接口加入「微信令牌权限配置」），
// 容器内直接以 HTTP 调用 api.weixin.qq.com 的服务端接口即可，
// 无需携带 access_token / cloudbase_access_token，平台旁挂代理自动处理鉴权。
// 响应头 x-openapi-seqid 表示该请求走了云调用链路。
// 参考：https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/guide/weixin/open.html
const BASE_URL = process.env.OPEN_API_BASE_URL || 'http://api.weixin.qq.com'

/**
 * 免 access_token 调用微信服务端接口
 * @param {string} path 接口路径，如 '/cgi-bin/message/custom/send'
 * @param {{method?: string, data?: object, params?: object}} [options]
 * @returns {Promise<object>} 微信接口返回体（errcode === 0 表示成功）
 */
export async function requestWechatApi(path, options = {}) {
    const { method = 'GET', data, params } = options
    const resp = await axios({
        method,
        url: `${BASE_URL}${path}`,
        data,
        params,
        timeout: 10000, // 云调用最大超时 30s
    })
    const body = resp.data
    if (body && body.errcode !== undefined && body.errcode !== 0) {
        throw new Error(`微信接口 ${path} 调用失败: errcode=${body.errcode} errmsg=${body.errmsg}`)
    }
    return body
}

/**
 * 发送客服消息（主动下发；需用户在 48h 内与公众号有过互动）
 * @param {string} openid 用户 openid
 * @param {string} content 文本内容
 * @returns {Promise<object>}
 */
export function sendCustomerMessage(openid, content) {
    return requestWechatApi('/cgi-bin/message/custom/send', {
        method: 'POST',
        data: {
            touser: openid,
            msgtype: 'text',
            text: { content },
        },
    })
}
