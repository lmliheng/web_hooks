import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

import { verifyWechatSignature } from '../service/wechat-auth.js'
import { parseXmlMessage, buildTextReply } from '../util/xml.js'
import { buildReply } from '../service/reply.js'

function sha1(str) {
    return crypto.createHash('sha1').update(str).digest('hex')
}

// ---- 签名校验 ----

test('正确的签名校验通过', () => {
    const token = 'testtoken'
    const timestamp = '1234567890'
    const nonce = 'abc123'
    const signature = sha1([token, timestamp, nonce].sort().join(''))
    assert.equal(verifyWechatSignature(signature, timestamp, nonce, token), true)
})

test('错误的签名校验失败', () => {
    assert.equal(verifyWechatSignature('deadbeef', '1234567890', 'abc123', 'testtoken'), false)
})

test('nonce 为数字字符串时按字典序而非数值排序', () => {
    // 字典序：'1700000000' < '999' < 'liheng'；数值排序会把 999 排到最前，两者结果不同
    const token = 'liheng'
    const timestamp = '1700000000'
    const nonce = '999'
    const signature = sha1([token, timestamp, nonce].sort().join(''))
    assert.equal(verifyWechatSignature(signature, timestamp, nonce, token), true)
})

test('缺少任一参数时返回 false', () => {
    assert.equal(verifyWechatSignature(undefined, '123', '456', 'token'), false)
    assert.equal(verifyWechatSignature('sig', undefined, '456', 'token'), false)
    assert.equal(verifyWechatSignature('sig', '123', undefined, 'token'), false)
    assert.equal(verifyWechatSignature('sig', '123', '456', undefined), false)
    assert.equal(verifyWechatSignature('sig', '123', '456', ''), false)
})

// ---- XML 解析 / 构建 ----

test('解析微信文本消息 XML（含 CDATA）', () => {
    const xml = '<xml>'
        + '<ToUserName><![CDATA[gh_abc]]></ToUserName>'
        + '<FromUserName><![CDATA[o_openid123]]></FromUserName>'
        + '<CreateTime>1700000000</CreateTime>'
        + '<MsgType><![CDATA[text]]></MsgType>'
        + '<Content><![CDATA[你好]]></Content>'
        + '<MsgId>123456</MsgId>'
        + '</xml>'
    const msg = parseXmlMessage(xml)
    assert.equal(msg.ToUserName, 'gh_abc')
    assert.equal(msg.FromUserName, 'o_openid123')
    assert.equal(msg.MsgType, 'text')
    assert.equal(msg.Content, '你好')
    assert.equal(msg.CreateTime, '1700000000')
})

test('解析不含 CDATA 的 XML（事件消息）', () => {
    const msg = parseXmlMessage('<xml><MsgType>event</MsgType><Event>subscribe</Event></xml>')
    assert.equal(msg.MsgType, 'event')
    assert.equal(msg.Event, 'subscribe')
})

test('构建被动回复 XML', () => {
    const xml = buildTextReply({ from: 'gh_abc', to: 'o_openid123', content: '你好呀' })
    assert.ok(xml.startsWith('<xml>') && xml.endsWith('</xml>'))
    assert.ok(xml.includes('<ToUserName><![CDATA[o_openid123]]></ToUserName>'))
    assert.ok(xml.includes('<FromUserName><![CDATA[gh_abc]]></FromUserName>'))
    assert.ok(xml.includes('<MsgType><![CDATA[text]]></MsgType>'))
    assert.ok(xml.includes('<Content><![CDATA[你好呀]]></Content>'))
    assert.ok(xml.includes('<CreateTime>'))
})

test('回复内容含 CDATA 结束符时安全转义', () => {
    const xml = buildTextReply({ from: 'a', to: 'b', content: 'x]]>y' })
    assert.ok(xml.includes('<![CDATA[x]]]]><![CDATA[>y]]>'))
})

// ---- 自动回复规则 ----

test('buildReply: 关键词命中', () => {
    assert.equal(
        buildReply({ MsgType: 'text', Content: '你好呀' }),
        '你好，欢迎关注！回复任意内容试试自动回复。'
    )
})

test('buildReply: 未命中关键词时回显', () => {
    assert.equal(buildReply({ MsgType: 'text', Content: '随便说点什么' }), '收到：随便说点什么')
})

test('buildReply: 关注事件返回欢迎语', () => {
    assert.equal(
        buildReply({ MsgType: 'event', Event: 'subscribe' }),
        '感谢关注！回复任意内容试试自动回复功能。'
    )
})

test('buildReply: 取消关注事件不回复', () => {
    assert.equal(buildReply({ MsgType: 'event', Event: 'unsubscribe' }), '')
})

test('buildReply: 非文本消息返回占位', () => {
    assert.equal(buildReply({ MsgType: 'image' }), '暂不支持该类型消息')
})
