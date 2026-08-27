# 微信云托管部署镜像
# express 5 要求 Node >= 18，这里用 Node 20 LTS（alpine 体积小）
FROM node:20-alpine

WORKDIR /app

# 先复制依赖清单并安装（利用镜像分层缓存；只装生产依赖）
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 复制业务代码
COPY app.js ./
COPY router ./router

ENV NODE_ENV=production
# 微信云托管会注入 PORT 环境变量（默认 80），本地兜底 7000
ENV PORT=80

# 健康检查：/health 探活
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1 || exit 1

EXPOSE 80

CMD ["node", "app.js"]
