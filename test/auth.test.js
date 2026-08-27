import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

import { verifyWechatSignature } from '../router/Auth.js'

function sha1(str) {
    return crypto.createHash('sha1').update(str).digest('hex')
}

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
