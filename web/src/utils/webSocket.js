class StreamingChat {
  constructor(callbacks = {}) {
    this.ws = null;
    this.currentMessage = '';
    this.messageBuffer = '';
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.wsUrl = callbacks.wsUrl
    
    // 回调函数
    this.onStreamStart = callbacks.onStreamStart || (() => {});
    this.onStreamChunk = callbacks.onStreamChunk || (() => {});
    this.onStreamEnd = callbacks.onStreamEnd || (() => {});
    this.onError = callbacks.onError || (() => {});
    this.onConnected = callbacks.onConnected || (() => {});
    this.onDisconnected = callbacks.onDisconnected || (() => {});
  }

  // 建立连接
  connect() {
    try {
      // 获取 token
       const stored = localStorage.getItem('auth')
       const { token } = JSON.parse(stored)
      
      if (!token) {
        this.onError(new Error('未找到认证token，请先登录'));
        return;
      }
      // 构建 WebSocket URL，将 token 作为查询参数传递
      const newwsUrl = `${this.wsUrl}?token=${token}`;
      this.ws = new WebSocket(newwsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket连接已建立');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnected();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event?.data);
        // this.handleStreamMessage(event.data);
          this.onStreamEnd(this.currentMessage, message);
      };

      this.ws.onclose = () => {
        console.log('WebSocket连接已关闭');
        this.isConnected = false;
        this.onDisconnected();
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        this.onError(error);
      };
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.onError(error);
    }
  }

  // 自动重连
  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('达到最大重连次数，停止重连');
      this.onError(new Error('连接失败，请检查网络'));
    }
  }

  // 处理流式消息
  handleStreamMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('message:', message)
      switch(message.type) {
        case 'stream_start':
          // 开始新的流式响应
          this.currentMessage = '';
          this.onStreamStart(message);
          break;
          
        case 'stream_chunk':
          // 接收流式数据块
          this.currentMessage += message.content;
          this.onStreamChunk(message.content, this.currentMessage);
          break;
          
        case 'stream_end':
          // 流式响应结束
          this.onStreamEnd(this.currentMessage, message);
          break;
          
        case 'error':
          this.onError(new Error(message.error || '服务器错误'));
          break;
          
        default:
          console.log('收到未知消息类型:', message);
      }
    } catch (error) {
      console.error('解析消息失败:', error);
      this.onError(error);
    }
  }

  // 发送消息
  sendMessage(messageData) {
    if (!this.isConnected || this.ws.readyState !== WebSocket.OPEN) {
      this.onError(new Error('WebSocket未连接'));
      return false;
    }

    try {
      this.ws.send(JSON.stringify(messageData));
      return true;
    } catch (error) {
      console.error('发送消息失败:', error);
      this.onError(error);
      return false;
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  // 检查连接状态
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export default StreamingChat;
