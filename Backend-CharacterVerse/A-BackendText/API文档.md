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
