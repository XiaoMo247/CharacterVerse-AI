# CharacterVerse Backend - Docker 部署指南

## 🐳 Docker 环境配置

### 服务组件
- **Backend**: Go后端服务 (端口: 8080)
- **Redis**: 缓存数据库 (端口: 6379)
- **Redis Commander**: Redis管理界面 (端口: 8081)

### 📋 前置要求
- Docker >= 20.0
- Docker Compose >= 2.0

### 🚀 快速启动

#### 方法1: 使用启动脚本
```bash
# 给脚本执行权限
chmod +x docker-start.sh

# 启动服务
./docker-start.sh
```

#### 方法2: 手动启动
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 🔧 服务管理

#### 停止服务
```bash
docker-compose down
```

#### 重启服务
```bash
docker-compose restart
```

#### 重新构建
```bash
docker-compose up --build -d
```

#### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f redis
```

### 🌐 访问地址
- **后端API**: http://localhost:8080
- **Redis管理界面**: http://localhost:8081
- **健康检查**: http://localhost:8080/health

### 📁 数据持久化
- Redis数据存储在Docker volume `redis_data` 中
- 数据在容器重启后会保持

### 🔍 故障排除

#### Redis连接问题
```bash
# 检查Redis服务状态
docker-compose exec redis redis-cli ping

# 查看Redis日志
docker-compose logs redis
```

#### 后端服务问题
```bash
# 进入后端容器
docker-compose exec backend sh

# 查看环境变量
docker-compose exec backend env | grep REDIS
```

#### 端口冲突
如果端口被占用，可以修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8081:8080"  # 将8080改为8081
```

### 🔄 开发模式
开发环境支持热重载，修改代码后会自动重启服务。

### 📝 环境变量
- `.env`: Docker环境配置
- `.env.local`: 本地开发环境配置

### 🛠 维护命令
```bash
# 清理未使用的镜像和容器
docker system prune -f

# 查看资源使用情况
docker-compose top

# 备份Redis数据
docker-compose exec redis redis-cli BGSAVE