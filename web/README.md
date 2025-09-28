# CharacterVerse-AI Web 项目架构与启动指南

## 🏗️ 项目概述

CharacterVerse-AI 是一个基于 React 18 + Vite 的现代化 AI 角色对话平台，支持文本聊天、语音交互、角色管理等功能。项目采用模块化架构，具有高度的可扩展性和维护性。

## 📋 技术栈

### 核心框架
- **React 18.3.1** - 现代化前端框架，支持并发特性
- **Vite 5.4.10** - 极速构建工具，开发体验优秀
- **React Router DOM 6.30.1** - 声明式路由管理

### UI 组件库
- **Ant Design 6.0.0-alpha.3** - 企业级 UI 设计语言
- **自定义 CSS 变量系统** - 支持主题切换和个性化定制

### 状态管理
- **Zustand 5.0.8** - 轻量级状态管理，简单易用
- **模块化 Store 设计** - 按功能域分离状态管理

### 网络通信
- **Axios 1.12.2** - HTTP 客户端，支持拦截器和错误处理
- **WebSocket** - 实时通信，支持流式对话
- **SSE (Server-Sent Events)** - 服务器推送事件

### 音频处理
- **AudioWorklet API** - 高性能实时音频处理
- **@ricky0123/vad-web 0.0.28** - 语音活动检测
- **自研音频处理引擎** - 支持降噪、增益控制等

## 🏛️ 项目架构

### 目录结构
```
web/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 项目资源文件
│   ├── components/        # 通用组件
│   │   ├── AuthGuard/     # 认证守卫
│   │   ├── LazyAvatar/    # 智能头像缓存组件
│   │   ├── LoginModal/    # 登录框
│   │   ├── Navigation/    # 导航组件
│   │   ├── Sidebar/       # 侧边栏
│   │   ├── ThemeController/ # 主题控制器
│   │   └── UserAvatar/    # 用户头像
│   ├── pages/             # 页面组件
│   │   ├── Home/          # 首页
│   │   ├── Chat/          # 聊天页面
│   │   ├── CharacterManagement/ # 角色管理
│   ├── router/            # 路由配置
│   ├── servers/           # API 服务层
│   ├── store/             # 全局状态管理
│   ├── styles/            # 样式文件
│   └── utils/             # 工具函数
├── package.json           # 项目配置
├── vite.config.js         # Vite 配置
└── Dockerfile            # Docker 配置
```

### 核心架构设计

#### 1. 分层架构
```
┌─────────────────┐
│   Presentation  │ ← React Components + Ant Design
├─────────────────┤
│    Business     │ ← Custom Hooks + Store (Zustand)
├─────────────────┤
│     Service     │ ← API Services + WebSocket
├─────────────────┤
│   Infrastructure│ ← Utils + Request + Audio Processing
└─────────────────┘
```

#### 2. 状态管理架构
- **useAuthStore** - 用户认证状态
- **useThemeStore** - 主题配置状态
- **useChatStore** - 聊天相关状态
- **useHomeStore** - 首页数据状态
- **useCharacterStore** - 角色管理状态

#### 3. 路由架构
- **声明式路由配置** - 集中管理所有路由
- **路由守卫** - 基于认证状态的访问控制
- **懒加载** - 按需加载页面组件，优化性能

## 🚀 启动方式

### 环境要求
- **Node.js**: 18.x (推荐 18.17.0+)
- **npm**: 9.x+ 或 **yarn**: 1.22.x+
- **现代浏览器**: Chrome 66+, Firefox 76+, Safari 14.1+

### 本地开发启动

#### 1. 安装依赖
```bash
cd web
npm install
```

#### 2. 启动开发服务器
```bash
npm run dev
```

#### 3. 访问应用
```
http://localhost:5173
```

### 生产环境构建

#### 1. 构建项目
```bash
npm run build
```

#### 2. 预览构建结果
```bash
npm run preview
```

### Docker 本地部署

#### 1. 构建镜像
```bash
docker build -t characterverse-web .
```

#### 2. 运行容器
```bash
docker run -p 5173:5173 characterverse-web
```
### 3. 启动整个项目
```bash
docker-compose up
```

## ✨ 项目亮点

### 1. 🎨 现代化 UI/UX 设计
- **响应式设计** - 完美适配桌面端和移动端
- **深色/浅色主题** - 支持系统主题自动切换
- **个性化主题** - 8种预设主题色彩，支持自定义
- **流畅动画** - 基于 CSS3 的丝滑过渡效果
- **无障碍设计** - 符合 WCAG 2.1 标准
- **高级交互语音组件** - 符合用户使用审美


### 2. 🧠 头像图片加载缓存优化
- **图片缓存优化** - 解决多组件并发请求同一图片的问题
- **请求去重机制** - 避免重复网络请求，提升性能
- **状态同步** - 多组件间实时同步缓存状态
- **内存管理** - 智能缓存清理，防止内存泄漏

### 3. 🎙️ 专业级音频处理，实现语音发送，语音通话功能
- **AudioWorklet 引擎** - 独立线程处理，不阻塞 UI
- **实时降噪** - 高通滤波 + 噪音门限 + 动态压缩
- **语音活动检测** - 智能识别有效语音片段
- **多设备支持** - 动态切换音频输入设备
- **低延迟处理** - 延迟低至 10ms，接近专业设备
- **WebSocket 实时通信** - 支持流式响应显示
- **断线重连** - 自动重连机制，保证连接稳定
- **为何使用AudioWorklet** - 详情可见 DEVREADME.md

### 4. 🔐 完善的认证系统
- **JWT Token 管理** - 自动刷新，安全可靠
- **路由守卫** - 基于权限的页面访问控制
- **多端同步** - 支持多设备登录状态同步
- **安全存储** - 敏感信息加密存储

### 5. 📱 组件化架构
- **高度复用** - 组件复用率达 85%+
- **松耦合设计** - 组件间依赖最小化
- **TypeScript 支持** - 类型安全，减少运行时错误

### 6. ⚡ 性能优化
- **代码分割** - 路由级别的懒加载
- **Tree Shaking** - 自动移除未使用代码
- **资源压缩** - Gzip 压缩，减少传输体积
- **缓存策略** - 多层缓存机制，提升加载速度
- **虚拟滚动** - 大列表性能优化

### 7. 🛠️ 开发体验，配置docker卷挂载实现实时更新
- **前后端联调** - 十分方便，无需配置环境
- **热模块替换** - 开发时实时更新，无需刷新
- **ESLint 规范** - 代码质量保证
 

