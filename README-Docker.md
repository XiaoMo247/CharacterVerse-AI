# CharacterVerse-AI Docker 部署指南

## 🚀 快速启动

### 一键启动
```bash
# 克隆项目后，在项目根目录执行
docker-compose up -d --build
```

### 访问应用
- **前端应用**: http://localhost:5173
- **API接口**: http://localhost:8080/api
- **WebSocket**: ws://localhost:8080/api/ws/chat
- **数据库**: localhost:3306

## 📋 服务架构

```
用户请求 → 前端(5173) / 后端API(8080)
                    ↓
               MySQL数据库(3306)
```

### 服务组件
| 服务 | 容器名 | 端口 | 功能 |
|------|--------|------|------|
| 前端 | characterverse-frontend | 5173 | React应用 |
| 后端 | characterverse-backend | 8080 | Go API服务 + WebSocket |
| 数据库 | characterverse-mysql | 3306 | MySQL数据存储 |

## 🛠️ 常用命令

### 启动服务
```bash
# 启动所有服务
docker-compose up -d

# 重新构建并启动
docker-compose up -d --build

# 启动特定服务
docker-compose up -d frontend backend
```

### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止特定服务
docker-compose stop frontend
```

### 查看状态
```bash
# 查看所有服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [服务名]

# 查看特定服务日志
docker logs characterverse-backend --tail 50
docker logs characterverse-frontend --tail 50
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart nginx
```

## 🔧 开发模式

### 热重载功能
- **前端热重载**: 修改 `web/` 目录下的代码，浏览器自动刷新
- **后端热重载**: 修改 `Backend-CharacterVerse/` 目录下的Go代码，服务自动重启

### 实时代码同步
项目使用Docker卷挂载实现实时代码同步：
```yaml
volumes:
  # 前端代码同步
  - ./web:/app
  - /app/node_modules
  
  # 后端代码同步  
  - ./Backend-CharacterVerse:/app
  - /app/tmp
```
