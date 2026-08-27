import express from 'express'

import { router } from './router/Auth.js'

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', router)

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

async function startServer() {
    const PORT = process.env.PORT || 7000;
    app.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
    });
}

startServer();
