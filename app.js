import 'dotenv/config'
import express from 'express'

import { router } from './router/Wx.js'

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 微信消息回调是 XML（content-type: text/xml 等），按原始文本接收
app.use(express.text({ type: ['text/xml', 'application/xml', 'text/plain'] }));

app.use('/', router)

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

async function startServer() {
    const PORT = process.env.PORT || 7000;
    const server = app.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
    });
    server.on('error', (err) => {
        console.error('服务器启动失败:', err);
        process.exit(1);
    });
}

startServer();
