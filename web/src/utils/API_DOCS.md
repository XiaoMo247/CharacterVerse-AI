# CharacterVerse-AI 后端接口文档

## 基础配置

- **Base URL**: `http://localhost:8080/api`
- **Content-Type**: `application/json`
- **认证方式**: JWT Token (Bearer Token)

## 响应格式规范

所有接口都遵循统一的响应格式：

```json
{
  "code": 200,           // 状态码
  "message": "success",  // 响应消息
  "data": {}            // 响应数据 (可为 null)
}
```

### 状态码说明

- `200`: 成功
- `400`: 请求参数错误
- `401`: 未授权/认证失败
- `403`: 拒绝访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## 接口列表

### 1. 用户认证相关

#### 1.1 用户注册

- **接口地址**: `POST /api/user/register`
- **是否需要认证**: 否

**请求参数**:
```json
{
  "username": "string",  // 必填，用户名
  "password": "string"   // 必填，密码
}
```

**成功响应**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": null
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

#### 1.2 用户登录

- **接口地址**: `POST /api/user/login`
- **是否需要认证**: 否

**请求参数**:
```json
{
  "username": "string",  // 必填，用户名
  "password": "string"   // 必填，密码
}
```

**成功响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误响应**:
```json
{
  "code": 401,
  "message": "用户名或密码错误",
  "data": null
}
```

### 2. 角色管理相关

#### 2.1 添加角色

- **接口地址**: `POST /api/user/addRole`
- **是否需要认证**: 是
- **请求头**: `Authorization: Bearer {token}`

**请求参数**:
```json
{
  "name": "string",        // 必填，角色名称
  "description": "string"  // 必填，角色描述
}
```

**成功响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "role_id": 123
  }
}
```

**错误响应**:
```json
{
  "code": 401,
  "message": "用户未认证",
  "data": null
}
```

### 3. WebSocket 聊天接口

#### 3.1 聊天连接

- **接口地址**: `GET /api/ws/chat`
- **协议**: WebSocket
- **是否需要认证**: 是
- **认证方式**: 通过 URL 参数传递 token

**连接地址**:
```
ws://localhost:8080/api/ws/chat?token={jwt_token}
```

**连接成功**: 建立 WebSocket 连接，可以进行实时聊天

**消息格式**:

发送消息:
```json
{
  "type": "message",
  "content": "用户消息内容",
  "character_id": 123,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

接收消息:
```json
{
  "type": "stream_start",  // 开始流式响应
  "message_id": "uuid"
}

{
  "type": "stream_chunk",  // 流式数据块
  "content": "AI回复的部分内容"
}

{
  "type": "stream_end",    // 流式响应结束
  "message_id": "uuid"
}

{
  "type": "error",         // 错误消息
  "error": "错误描述"
}
```

## 前端使用示例

### 1. 用户注册

```javascript
import { authAPI } from '@/utils/api'

const register = async () => {
  try {
    const response = await authAPI.register({
      username: 'testuser',
      password: '123456'
    })
    console.log('注册成功:', response.message)
  } catch (error) {
    console.error('注册失败:', error.message)
  }
}
```

### 2. 用户登录

```javascript
import { authAPI } from '@/utils/api'

const login = async () => {
  try {
    const response = await authAPI.login({
      username: 'testuser',
      password: '123456'
    })
    
    // 保存 token
    localStorage.setItem('token', response.data.token)
    console.log('登录成功')
  } catch (error) {
    console.error('登录失败:', error.message)
  }
}
```

### 3. 添加角色

```javascript
import { authAPI } from '@/utils/api'

const addRole = async () => {
  try {
    const response = await authAPI.addRole({
      name: '智能助手',
      description: '一个友善的AI助手'
    })
    console.log('角色创建成功，ID:', response.data.role_id)
  } catch (error) {
    console.error('创建角色失败:', error.message)
  }
}
```

### 4. WebSocket 聊天

```javascript
import StreamingChat from '@/utils/webSocket'

const chat = new StreamingChat({
  onConnected: () => console.log('聊天连接成功'),
  onStreamChunk: (chunk, fullMessage) => {
    console.log('收到消息片段:', chunk)
    console.log('完整消息:', fullMessage)
  },
  onStreamEnd: (fullMessage) => {
    console.log('消息接收完成:', fullMessage)
  },
  onError: (error) => console.error('聊天错误:', error)
})

// 建立连接
chat.connect()

// 发送消息
chat.sendMessage('你好，AI助手！', 123)

// 断开连接
chat.disconnect()
```

## 错误处理

前端的 axios 拦截器已经配置了统一的错误处理：

- **401 错误**: 自动清除本地 token，提示用户重新登录
- **网络错误**: 显示网络连接错误提示
- **业务错误**: 显示后端返回的具体错误信息

## 注意事项

1. **Token 管理**: 登录成功后需要保存 token 到 localStorage 或 sessionStorage
2. **WebSocket 认证**: WebSocket 连接需要通过 URL 参数传递 token
3. **错误处理**: 所有接口调用都应该包含 try-catch 错误处理
4. **CORS**: 开发环境需要确保后端配置了正确的 CORS 策略
5. **端口配置**: 确保前端配置的 API 地址与后端服务端口一致