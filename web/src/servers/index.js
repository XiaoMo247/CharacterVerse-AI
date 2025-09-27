import { request} from "../utils/request";

// 用户认证相关接口
export const userRegister = (params) => {
    return request.post('/user/register', params)
}

export const userLogin = (params) => {
    return request.post('/user/login', params)
}


// WebSocket 聊天连接
// 使用 StreamingChat 类来处理 WebSocket 连接
// 接口地址: ws://localhost:8080/api/ws/chat
// 需要在 URL 参数中传递 token: ?token={jwt_token}
