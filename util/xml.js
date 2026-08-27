/**
 * 解析微信消息 XML（扁平结构，形如 <xml><Key><![CDATA[v]]></Key>...</xml>）
 * @param {string} xml 原始 XML 字符串
 * @returns {Record<string, string>} 字段名 -> 值（自动去掉 CDATA）
 */
export function parseXmlMessage(xml) {
    const result = {}
    let body = String(xml || '')
    // 去掉 XML 声明（如 <?xml version="1.0" encoding="utf-8"?>）
    body = body.replace(/^\s*<\?xml[\s\S]*?\?>\s*/, '')
    // 去掉根标签 <xml>...</xml>，避免它把整个内容包住
    body = body.replace(/^\s*<xml>([\s\S]*)<\/xml>\s*$/, '$1')

    const re = /<([A-Za-z_][\w-]*)>([\s\S]*?)<\/\1>/g
    let m
    while ((m = re.exec(body)) !== null) {
        result[m[1]] = m[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
    }
    return result
}

/**
 * 构建被动回复的文本消息 XML
 * @param {{from: string, to: string, content: string}} opts
 *   from = 公众号原始ID（FromUserName），to = 用户 openid（ToUserName），content = 回复文本
 * @returns {string}
 */
export function buildTextReply({ from, to, content }) {
    const ts = Math.floor(Date.now() / 1000)
    // CDATA 中不允许出现 "]]>"，需拆开转义
    const safe = String(content ?? '').replace(/\]\]>/g, ']]]]><![CDATA[>')
    return '<xml>'
        + `<ToUserName><![CDATA[${to}]]></ToUserName>`
        + `<FromUserName><![CDATA[${from}]]></FromUserName>`
        + `<CreateTime>${ts}</CreateTime>`
        + `<MsgType><![CDATA[text]]></MsgType>`
        + `<Content><![CDATA[${safe}]]></Content>`
        + '</xml>'
}
