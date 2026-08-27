const DEFAULT_RULES = {
    '你好': '你好，欢迎关注！回复任意内容试试自动回复。',
    'hi': '你好，欢迎关注！',
    '菜单': '当前功能：\n1. 关键词自动回复\n2. 发送任意文字会原样收到',
    '帮助': '发送任意文字即可获得自动回复；回复「菜单」查看功能。',
}

function loadRules() {
    try {
        const json = process.env.REPLY_RULES
        if (!json) {
            return DEFAULT_RULES
        }
        const parsed = JSON.parse(json)
        return parsed && typeof parsed === 'object' ? parsed : DEFAULT_RULES
    } catch (e) {
        console.error('REPLY_RULES 解析失败，使用默认规则:', e.message)
        return DEFAULT_RULES
    }
}

/**
 * 根据收到的微信消息生成自动回复文本。
 * 可用环境变量定制：
 *   - REPLY_RULES: JSON 关键词表，如 {"你好":"你好呀","菜单":"..."}
 * @param {Record<string, string>} message 解析后的微信消息
 *   （字段见 https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_standard_messages.html）
 * @returns {string} 回复文本；空字符串表示不回复
 */
export function buildReply(message) {
    if (message.MsgType === 'text') {
        const content = (message.Content || '').trim()
        if (!content) {
            return '请发送文字内容'
        }
        const rules = loadRules()
        for (const [keyword, reply] of Object.entries(rules)) {
            if (content.includes(keyword)) {
                return reply
            }
        }
        return `收到：${content}`
    }

    if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            return '感谢关注！回复任意内容试试自动回复功能。'
        }
        // 取消关注等事件无需回复
        return ''
    }

    return '暂不支持该类型消息'
}
