# `/api/voiceTypes` API 文档

## 接口说明

获取系统中所有可用的声音类型及其详细信息。

### 请求信息

| 属性 | 值 |
|------|----|
| **请求方法** | `GET` |
| **请求路径** | `/api/voiceTypes` |
| **认证要求** | 无需认证 |

### 请求参数
无

### 响应格式
JSON 格式，包含以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `code` | int | 状态码 (200 表示成功) |
| `message` | string | 状态消息 ("success" 表示成功) |
| `data` | array | 声音类型列表 |

### `data` 数组中的对象结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `voice_type` | string | 声音类型标识符 (用于创建角色时指定音色) |
| `voice_name` | string | 声音类型的友好名称 |
| `category` | string | 声音分类 (如: "中文", "英文", "双语音色"等) |
| `sample_url` | string | 声音示例的音频文件 URL |

### 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "voice_type": "qiniu_zh_female_wwxkjx",
      "voice_name": "温柔女声",
      "category": "中文",
      "sample_url": "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_wwxkjx.mp3"
    },
    {
      "voice_type": "qiniu_zh_male_wwxkjx",
      "voice_name": "温柔男声",
      "category": "中文",
      "sample_url": "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_wwxkjx.mp3"
    },
    {
      "voice_type": "qiniu_en_female_ysyyn",
      "voice_name": "英式英语女",
      "category": "双语音色",
      "sample_url": "https://aitoken-public.qnaigc.com/ai-voice/qiniu_en_female_ysyyn.mp3"
    }
  ]
}
```

### 错误响应示例

```json
{
  "code": 500,
  "message": "服务器内部错误",
  "data": null
}
```

## 使用场景

1. **创建角色时选择音色**：前端在创建角色表单中展示所有可用的声音类型供用户选择
2. **角色详情页展示音色信息**：展示角色当前使用的声音类型及其详细信息
3. **角色编辑时更换音色**：允许用户更换角色的声音类型

## 前端调用示例

```javascript
// 使用 fetch 调用
fetch('/api/voiceTypes')
  .then(response => response.json())
  .then(data => {
    if (data.code === 200) {
      console.log('获取到的声音类型:', data.data);
      // 在此处处理声音类型数据
    } else {
      console.error('获取声音类型失败:', data.message);
    }
  })
  .catch(error => console.error('请求失败:', error));

// 使用 axios 调用
axios.get('/api/voiceTypes')
  .then(response => {
    if (response.data.code === 200) {
      console.log('获取到的声音类型:', response.data.data);
      // 在此处处理声音类型数据
    } else {
      console.error('获取声音类型失败:', response.data.message);
    }
  })
  .catch(error => console.error('请求失败:', error));
```



# `/api/role/add` API 文档

## 接口说明

添加新角色到系统。

### 请求信息

| 属性 | 值 |
|------|----|
| **请求方法** | `POST` |
| **请求路径** | `/api/role/add` |
| **认证要求** | 需要有效的JWT令牌 |

### 请求参数
JSON格式请求体：

| 字段名 | 类型 | 必填 | 说明 | 约束 |
|--------|------|------|------|------|
| `name` | string | 是 | 角色名称 | 长度2-100字符 |
| `description` | string | 是 | 角色描述 | 长度≥10字符 |
| `gender` | string | 是 | 性别 | 枚举值: "男", "女", "其他", "未知" |
| `age` | int | 是 | 年龄 | 0-120之间 |
| `voice_type` | string | 是 | 声音类型标识符 | 必须为有效声音类型 |

### 响应格式
JSON 格式，包含以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `code` | int | 状态码 (200 表示成功) |
| `message` | string | 状态消息 |
| `data` | object | 包含角色ID的对象 |

### `data` 对象结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `role_id` | uint | 新创建角色的ID |

### 成功响应示例

```json
{
  "code": 200,
  "message": "角色创建成功",
  "data": {
    "role_id": 123
  }
}
```

### 错误响应示例

```json
{
  "code": 400,
  "message": "参数错误: 年龄必须在0-120之间",
  "data": null
}
```

## 使用场景

1. **创建新角色**：用户创建自定义角色
2. **角色管理**：管理员添加预设角色
3. **角色复制**：基于现有角色创建新角色

## 前端调用示例

```javascript
// 使用 fetch 调用
const roleData = {
  name: "冒险家",
  description: "勇敢的冒险者，探索未知世界",
  gender: "男",
  age: 30,
  voice_type: "qiniu_zh_male_wwxkjx"
};

fetch('/api/role/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify(roleData)
})
.then(response => response.json())
.then(data => {
  if (data.code === 200) {
    console.log('角色创建成功，ID:', data.data.role_id);
  } else {
    console.error('创建失败:', data.message);
  }
})
.catch(error => console.error('请求失败:', error));
```

---

# `/api/role/list` API 文档

## 接口说明

获取系统中所有角色的分页列表。

### 请求信息

| 属性         | 值                |
| ------------ | ----------------- |
| **请求方法** | `GET`             |
| **请求路径** | `/api/role/list`  |
| **认证要求** | 需要有效的JWT令牌 |

### 请求参数
查询参数：

| 字段名      | 类型 | 必填 | 说明     | 默认值 |
| ----------- | ---- | ---- | -------- | ------ |
| `page`      | int  | 否   | 页码     | 1      |
| `page_size` | int  | 否   | 每页数量 | 10     |

### 响应格式
JSON 格式，包含以下字段：

| 字段名    | 类型   | 说明                  |
| --------- | ------ | --------------------- |
| `code`    | int    | 状态码 (200 表示成功) |
| `message` | string | 状态消息              |
| `data`    | object | 分页结果对象          |

### `data` 对象结构

| 字段名     | 类型  | 说明         |
| ---------- | ----- | ------------ |
| `total`    | int64 | 总记录数     |
| `list`     | array | 角色对象列表 |
| `page`     | int   | 当前页码     |
| `pages`    | int   | 总页数       |
| `has_more` | bool  | 是否有下一页 |

### 角色对象结构

| 字段名        | 类型   | 说明              |
| ------------- | ------ | ----------------- |
| `id`          | uint   | 角色ID            |
| `name`        | string | 角色名称          |
| `description` | string | 角色描述          |
| `gender`      | string | 性别              |
| `age`         | int    | 年龄              |
| `voice_type`  | string | 声音类型标识符    |
| `created_at`  | string | 创建时间(ISO格式) |

### 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 45,
    "list": [
      {
        "id": 1,
        "name": "冒险家",
        "description": "勇敢的冒险者，探索未知世界",
        "gender": "男",
        "age": 30,
        "voice_type": "qiniu_zh_male_wwxkjx",
        "created_at": "2025-09-25T10:30:00Z"
      },
      {
        "id": 2,
        "name": "魔法师",
        "description": "掌握古老魔法的智者",
        "gender": "女",
        "age": 120,
        "voice_type": "qiniu_zh_female_wwxkjx",
        "created_at": "2025-09-24T14:20:00Z"
      }
    ],
    "page": 1,
    "pages": 5,
    "has_more": true
  }
}
```

## 使用场景

1. **角色浏览**：用户查看所有可用角色
2. **角色选择**：在对话前选择角色
3. **角色管理**：管理员查看角色列表

## 前端调用示例

```javascript
// 使用 axios 调用
axios.get('/api/role/list', {
  params: {
    page: 2,
    page_size: 5
  },
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
})
.then(response => {
  if (response.data.code === 200) {
    console.log('角色列表:', response.data.data.list);
    console.log('总页数:', response.data.data.pages);
  } else {
    console.error('获取失败:', response.data.message);
  }
})
.catch(error => console.error('请求失败:', error));
```

---

# `/api/role/user/:user_id` API 文档

## 接口说明

获取指定用户创建的角色分页列表。

### 请求信息

| 属性         | 值                         |
| ------------ | -------------------------- |
| **请求方法** | `GET`                      |
| **请求路径** | `/api/role/user/{user_id}` |
| **认证要求** | 需要有效的JWT令牌          |

### 路径参数

| 字段名    | 类型 | 说明   |
| --------- | ---- | ------ |
| `user_id` | uint | 用户ID |

### 查询参数

| 字段名      | 类型 | 必填 | 说明     | 默认值 |
| ----------- | ---- | ---- | -------- | ------ |
| `page`      | int  | 否   | 页码     | 1      |
| `page_size` | int  | 否   | 每页数量 | 10     |

### 响应格式
JSON 格式，包含以下字段：

| 字段名    | 类型   | 说明                  |
| --------- | ------ | --------------------- |
| `code`    | int    | 状态码 (200 表示成功) |
| `message` | string | 状态消息              |
| `data`    | object | 分页结果对象          |

### `data` 对象结构

| 字段名     | 类型  | 说明         |
| ---------- | ----- | ------------ |
| `total`    | int64 | 总记录数     |
| `list`     | array | 角色对象列表 |
| `page`     | int   | 当前页码     |
| `pages`    | int   | 总页数       |
| `has_more` | bool  | 是否有下一页 |

### 角色对象结构
同`/api/role/list`接口

### 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 8,
    "list": [
      {
        "id": 101,
        "name": "我的助手",
        "description": "个人AI助手",
        "gender": "未知",
        "age": 0,
        "voice_type": "qiniu_zh_female_wwxkjx",
        "created_at": "2025-09-20T09:15:00Z"
      }
    ],
    "page": 1,
    "pages": 1,
    "has_more": false
  }
}
```

## 使用场景

1. **用户角色管理**：查看自己创建的角色
2. **角色分享**：查看其他用户创建的角色
3. **用户分析**：分析用户的角色创建偏好

## 前端调用示例

```javascript
const userId = 123; // 目标用户ID

// 使用 fetch 调用
fetch(`/api/role/user/${userId}?page=1&page_size=5`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
})
.then(response => response.json())
.then(data => {
  if (data.code === 200) {
    console.log('用户角色列表:', data.data.list);
  } else {
    console.error('获取失败:', data.message);
  }
})
.catch(error => console.error('请求失败:', error));
```

---

## 通用错误响应

所有API共享以下错误响应格式：

| 状态码 | 含义           | 可能原因           |
| ------ | -------------- | ------------------ |
| 400    | 错误请求       | 参数缺失或格式错误 |
| 401    | 未授权         | JWT令牌无效或缺失  |
| 403    | 禁止访问       | 用户无权访问资源   |
| 404    | 未找到         | 用户或角色不存在   |
| 500    | 服务器内部错误 | 数据库或服务异常   |

```json
{
  "code": 401,
  "message": "用户未认证",
  "data": null
}
```

### `/api/role/:role_id` (DELETE) - 删除角色

#### 接口说明
删除指定ID的角色，只能删除自己创建的角色

#### 请求信息
| 属性         | 值                    |
| ------------ | --------------------- |
| **请求方法** | `DELETE`              |
| **请求路径** | `/api/role/{role_id}` |
| **认证要求** | 需要有效的JWT令牌     |

#### 路径参数
| 字段名    | 类型 | 说明   |
| --------- | ---- | ------ |
| `role_id` | uint | 角色ID |

#### 响应格式
JSON 格式，包含以下字段：
| 字段名    | 类型   | 说明                  |
| --------- | ------ | --------------------- |
| `code`    | int    | 状态码 (200 表示成功) |
| `message` | string | 状态消息              |
| `data`    | object | 空对象                |

#### 成功响应示例
```json
{
  "code": 200,
  "message": "角色删除成功",
  "data": null
}
```

#### 错误响应示例
```json
{
  "code": 403,
  "message": "角色不存在或您无权删除此角色",
  "data": null
}
```

### `/api/role/:role_id` (PUT) - 更新角色

#### 接口说明
更新指定ID的角色信息，只能更新自己创建的角色

#### 请求信息
| 属性         | 值                    |
| ------------ | --------------------- |
| **请求方法** | `PUT`                 |
| **请求路径** | `/api/role/{role_id}` |
| **认证要求** | 需要有效的JWT令牌     |

#### 路径参数
| 字段名    | 类型 | 说明   |
| --------- | ---- | ------ |
| `role_id` | uint | 角色ID |

#### 请求参数
JSON格式请求体（可更新部分字段）：
| 字段名        | 类型   | 必填 | 说明           | 约束                               |
| ------------- | ------ | ---- | -------------- | ---------------------------------- |
| `name`        | string | 否   | 角色名称       | 长度2-100字符                      |
| `description` | string | 否   | 角色描述       | 长度≥10字符                        |
| `gender`      | string | 否   | 性别           | 枚举值: "男", "女", "其他", "未知" |
| `age`         | int    | 否   | 年龄           | 0-120之间                          |
| `voice_type`  | string | 否   | 声音类型标识符 | 必须为有效声音类型                 |

#### 响应格式
JSON 格式，包含以下字段：
| 字段名    | 类型   | 说明                  |
| --------- | ------ | --------------------- |
| `code`    | int    | 状态码 (200 表示成功) |
| `message` | string | 状态消息              |
| `data`    | object | 空对象                |

#### 成功响应示例
```json
{
  "code": 200,
  "message": "角色更新成功",
  "data": null
}
```

#### 错误响应示例
```json
{
  "code": 400,
  "message": "参数错误: 年龄必须在0-120之间",
  "data": null
}
```

## 前端调用示例

### 删除角色
```javascript
const roleId = 123; // 要删除的角色ID

// 使用 fetch 调用
fetch(`/api/role/${roleId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
})
.then(response => response.json())
.then(data => {
  if (data.code === 200) {
    console.log('删除成功');
  } else {
    console.error('删除失败:', data.message);
  }
})
.catch(error => console.error('请求失败:', error));
```

### 更新角色
```javascript
const roleId = 123; // 要更新的角色ID
const updateData = {
  name: "新角色名称",
  description: "更新后的角色描述",
  age: 35
};

// 使用 axios 调用
axios.put(`/api/role/${roleId}`, updateData, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
})
.then(response => {
  if (response.data.code === 200) {
    console.log('更新成功');
  } else {
    console.error('更新失败:', response.data.message);
  }
})
.catch(error => console.error('请求失败:', error));
```





我们之前修改了语音回复的返回格式，现在返回的是语音URL而不是base64编码的音频数据。因此，我们需要更新API文档以反映这一变化。

### WebSocket 聊天 API 文档 (更新版)

#### 1. 连接建立
- **URL**: `ws://your-domain.com/api/ws/chat`
- **认证**: JWT Bearer Token (在HTTP头中)
- **协议**: WebSocket
- **连接流程**:
  1. 客户端发起WebSocket连接请求
  2. 服务端验证JWT Token
  3. 连接升级为WebSocket协议
  4. 开始双向通信

#### 2. 消息格式规范

##### 客户端 → 服务端 (用户发送消息)
```json
{
  "user_id": 123,          // 用户ID (从JWT中获取，但客户端不需要发送，由服务端从上下文中获取，所以这里实际上不需要这个字段)
  "role_id": 456,          // 角色ID (必填)
  "message": "你好",        // 消息内容 (文本或语音URL)
  "type": "text",          // 消息类型: "text" 或 "voice" (必填)
  "format": "mp3",         // 语音格式 (当type="voice"时必填)
  "response_type": 0       // 期望的回复类型: 
                            // 0=文字回复, 1=语音回复, 2=随机回复 (必填)
}
```

注意：实际上，在之前的代码中，客户端发送的消息结构体包含`UserID`字段，但服务端在`ChatHandler`中已经从JWT中获取了`userID`，所以客户端不需要发送`user_id`。因此，客户端发送的消息结构体应该去掉`user_id`字段。但是，根据我们之前的代码，客户端发送的消息结构体是`ChatMessage`，其中包含`UserID`字段。这里可能存在不一致。

为了解决这个不一致，我们需要调整：

1. 要么客户端发送的消息包含`user_id`（但这样不安全，因为用户ID应该由服务端从认证信息中获取）
2. 要么服务端忽略客户端发送的`user_id`，而使用从JWT中解析出的`userID`

在我们的代码中，服务端在`ChatHandler`中已经将`userID`（从JWT中获取）传递给了`HandleChatSession`，然后在处理消息时使用的是这个`userID`，而不是客户端消息中的`UserID`。因此，客户端不应该发送`user_id`，或者即使发送了，服务端也不会使用。

所以，我们修改客户端发送的消息结构，去掉`user_id`字段。但是，由于WebSocket消息结构已经定义，我们需要调整代码，确保服务端忽略客户端发送的`UserID`字段。

但是，为了保持文档的准确性，我们按照实际应该发送的格式来写文档。

因此，修正后的客户端发送消息格式：

```json
{
  "role_id": 456,          // 角色ID (必填)
  "message": "你好",        // 消息内容 (文本或语音URL)
  "type": "text",          // 消息类型: "text" 或 "voice" (必填)
  "format": "mp3",         // 语音格式 (当type="voice"时必填)
  "response_type": 0       // 期望的回复类型: 
                            // 0=文字回复, 1=语音回复, 2=随机回复 (必填)
}
```

##### 服务端 → 客户端 (AI回复消息)
```json
{
  "role_id": 456,          // 角色ID
  "message": "你好",        // 文本内容（当type="text"时）或语音URL（当type="voice"时）
  "type": "text",          // 消息类型: "text" 或 "voice"
  "format": "mp3"          // 语音格式 (当type="voice"时存在)
}
```

**字段说明**:
- `type`:
  - `text`: 文本回复，`message`字段为文本内容
  - `voice`: 语音回复，`message`字段为语音文件的URL（注意：现在返回的是URL，而不是base64编码的音频数据）
- `format`: 当`type="voice"`时指定音频格式

**示例**:
1. 文本回复:
```json
{
  "role_id": 1,
  "message": "亮在此，主公有何吩咐？",
  "type": "text"
}
```

2. 语音回复:
```json
{
  "role_id": 1,
  "message": "https://ai.mcell.top/uploads/1758808881083732096.mp3",
  "type": "voice",
  "format": "mp3"
}
```

#### 3. 回复类型控制 (`response_type`)

| 值   | 类型     | 行为                             |
| ---- | -------- | -------------------------------- |
| 0    | 文本回复 | AI始终返回文本消息               |
| 1    | 语音回复 | AI始终返回语音消息 (返回语音URL) |
| 2    | 随机回复 | AI随机返回文本或语音 (各50%概率) |

#### 4. 错误处理
```json
{
  "error": "错误描述",
  "code": 400
}
```

**常见错误码**:
- 400: 消息格式错误
- 401: 未认证
- 500: 服务器内部错误

#### 5. 完整交互示例

**用户发送语音消息，期望随机回复**:
```json
{
  "role_id": 1,
  "message": "https://ai.mcell.top/uploads/audio123.mp3",
  "type": "voice",
  "format": "mp3",
  "response_type": 2
}
```

**AI可能回复**:
1. 文本回复:
```json
{
  "role_id": 1,
  "message": "亮观天象，今夜必有东风",
  "type": "text"
}
```

2. 语音回复 (返回语音URL):
```json
{
  "role_id": 1,
  "message": "https://ai.mcell.top/uploads/1758808881083732096.mp3",
  "type": "voice",
  "format": "mp3"
}
```

#### 6. 注意事项
1. 语音消息需先通过独立API上传获取URL:
   ```
   POST /api/upload_voice
   Content-Type: multipart/form-data
   
   file=[语音文件]
   ```
   响应示例：
   ```json
   {
     "message": "文件上传成功",
     "filename": "tts_audio.mp3",
     "url": "/uploads/1758808881083732096.mp3"
   }
   ```
   注意：返回的URL是相对路径，客户端需要拼接基础URL（如：https://ai.mcell.top）得到完整URL。

2. WebSocket连接需要有效的JWT认证，JWT Token应通过HTTP头（Authorization: Bearer <token>）在建立WebSocket连接时发送。

3. 语音回复返回的是语音文件的URL，前端可以直接使用该URL播放音频。

4. 随机回复类型(`response_type=2`)由服务端决定最终回复形式（文本或语音）。

此API设计支持灵活的聊天交互模式，用户可根据需要选择不同的消息类型和回复形式。

### WebSocket 聊天 API 文档

#### 1. 连接建立
- **URL**: `ws://your-domain.com/api/ws/chat`
- **认证**: JWT Bearer Token (在HTTP头中)
- **协议**: WebSocket
- **连接流程**:
  1. 客户端发起WebSocket连接请求
  2. 服务端验证JWT Token
  3. 连接升级为WebSocket协议
  4. 开始双向通信

#### 2. 消息格式规范

##### 客户端 → 服务端 (用户发送消息)
```json
{
  "role_id": 123,          // 角色ID (必填)
  "message": "你好",        // 消息内容 (文本或语音URL)
  "type": "text",          // 消息类型: "text" 或 "voice" (必填)
  "format": "mp3",         // 语音格式 (当type="voice"时必填)
  "response_type": 0       // 期望的回复类型: 
                            // 0=文字回复, 1=语音回复, 2=随机回复 (必填)
}
```

**字段说明**:
- `type`:
  - `text`: 文本消息，`message`字段为文本内容
  - `voice`: 语音消息，`message`字段为语音文件URL
- `format`: 当`type="voice"`时需指定音频格式 (如 mp3, wav)
- `response_type`: 控制AI回复形式

**示例**:
1. 发送文本消息，期望语音回复:
```json
{
  "role_id": 1,
  "message": "你好，诸葛亮",
  "type": "text",
  "response_type": 1
}
```

2. 发送语音消息，期望随机回复:
```json
{
  "role_id": 1,
  "message": "https://ai.mcell.top/uploads/audio123.mp3",
  "type": "voice",
  "format": "mp3",
  "response_type": 2
}
```

##### 服务端 → 客户端 (AI回复消息)
```json
{
  "role_id": 123,          // 角色ID
  "message": "你好",        // 文本内容或语音URL
  "type": "text",          // 消息类型: "text" 或 "voice"
  "format": "mp3"          // 语音格式 (当type="voice"时存在)
}
```

**字段说明**:
- `type`:
  - `text`: 文本回复，`message`字段为文本内容
  - `voice`: 语音回复，`message`字段为语音文件URL
- `format`: 当`type="voice"`时指定音频格式

**示例**:
1. 文本回复:
```json
{
  "role_id": 1,
  "message": "亮在此，主公有何吩咐？",
  "type": "text"
}
```

2. 语音回复:
```json
{
  "role_id": 1,
  "message": "https://ai.mcell.top/uploads/1758808881083732096.mp3",
  "type": "voice",
  "format": "mp3"
}
```

#### 3. 回复类型控制 (`response_type`)

| 值   | 类型     | 行为                             |
| ---- | -------- | -------------------------------- |
| 0    | 文本回复 | AI始终返回文本消息               |
| 1    | 语音回复 | AI返回语音URL                    |
| 2    | 随机回复 | AI随机返回文本或语音 (各50%概率) |

#### 4. 错误处理
```json
{
  "error": "错误描述",
  "code": 400
}
```

**常见错误码**:
- 400: 消息格式错误
- 401: 未认证
- 500: 服务器内部错误

#### 5. 完整交互示例

**用户发送**:
```json
{
  "role_id": 1,
  "message": "https://ai.mcell.top/uploads/audio123.mp3",
  "type": "voice",
  "format": "mp3",
  "response_type": 2
}
```

**AI可能回复**:
1. 文本回复:
```json
{
  "role_id": 1,
  "message": "亮观天象，今夜必有东风",
  "type": "text"
}
```

2. 语音回复:
```json
{
  "role_id": 1,
  "message": "https://ai.mcell.top/uploads/1758808881083732096.mp3",
  "type": "voice",
  "format": "mp3"
}
```

#### 6. 语音处理流程
1. **语音上传**:
   ```
   POST /api/upload_voice
   Content-Type: multipart/form-data
   
   file=[语音文件]
   ```
   
   **响应**:
   ```json
   {
     "message": "文件上传成功",
     "filename": "tts_audio.mp3",
     "url": "/uploads/1758808881083732096.mp3"
   }
   ```

2. **语音识别**:
   - 客户端发送语音URL给服务端
   - 服务端识别语音内容并返回文本

3. **语音合成**:
   - 服务端生成语音后上传到服务器
   - 返回语音URL给客户端

#### 7. 前端处理建议

```javascript
// 处理AI回复
function handleAIResponse(response) {
  if (response.type === 'text') {
    // 显示文本消息
    displayTextMessage(response.message);
  } else if (response.type === 'voice') {
    // 播放语音
    playVoice(response.message);
  }
}

// 播放语音函数
function playVoice(voiceURL) {
  const audioPlayer = document.createElement('audio');
  audioPlayer.src = voiceURL;
  audioPlayer.controls = true;
  audioPlayer.play();
  
  // 添加到聊天界面
  chatContainer.appendChild(audioPlayer);
}
```
