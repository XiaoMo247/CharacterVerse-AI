# 使用 Alpine Linux 作为基础镜像
FROM alpine:3.18

# 安装 Redis
RUN apk add --no-cache redis

# 创建 Redis 数据目录
RUN mkdir -p /data

# 设置工作目录
WORKDIR /data

# 暴露 Redis 端口
EXPOSE 6379

# 启动 Redis 服务器
CMD ["redis-server", "--bind", "0.0.0.0", "--appendonly", "yes"]