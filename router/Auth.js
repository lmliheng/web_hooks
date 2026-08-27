import { AuthWithServer } from '@lmliheng/agent'
import express from 'express'

const router = express.Router()

router.get('/wx', async (req, res) => {
    try {
        // 这个是写在环境变量里的
        let token = process.env.token || 'liheng'
        const { signature, timestamp, nonce, echostr } = req.query
        let res = AuthWithServer(signature, timestamp, nonce, echostr, token)
        if (res) {
            res.send(echostr)
        }
    } catch (e) {
        console.log(e)
    }
}
)

export {
    router
}

