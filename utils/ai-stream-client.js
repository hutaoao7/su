/**
 * AI流式输出客户端
 * 
 * 功能：
 * - 支持SSE（Server-Sent Events）流式接收
 * - 支持OpenAI流式API
 * - 自动重连机制
 * - 错误处理和降级
 * - 支持H5和小程序平台
 * 
 * 使用方法：
 * ```javascript
 * import AIStreamClient from '@/utils/ai-stream-client.js';
 * 
 * const client = new AIStreamClient({
 *   onToken: (token) => console.log('收到token:', token),
 *   onComplete: () => console.log('完成'),
 *   onError: (err) => console.error('错误:', err)
 * });
 * 
 * client.sendMessage('你好，请介绍一下自己');
 * ```
 */

class AIStreamClient {
  constructor(options = {}) {
    this.options = {
      // 流式输出回调
      onToken: options.onToken || (() => {}),
      onComplete: options.onComplete || (() => {}),
      onError: options.onError || (() => {}),
      onStart: options.onStart || (() => {}),
      
      // 配置
      baseUrl: options.baseUrl || '',
      timeout: options.timeout || 60000, // 60秒超时
      enableFallback: options.enableFallback !== false, // 是否启用降级
      
      // 重连配置
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000
    };
    
    // 状态
    this.isStreaming = false;
    this.controller = null;
    this.retryCount = 0;
  }

  /**
   * 发送消息并接收流式响应
   * @param {string} message - 用户消息
   * @param {object} options - 额外配置
   * @returns {Promise<string>} - 完整的响应文本
   */
  async sendMessage(message, options = {}) {
    if (this.isStreaming) {
      throw new Error('正在进行流式输出，请等待完成');
    }
    
    this.isStreaming = true;
    this.controller = new AbortController();
    
    try {
      // 触发开始回调
      this.options.onStart();
      
      // 判断平台，选择合适的实现
      // #ifdef H5
      return await this.streamH5(message, options);
      // #endif
      
      // #ifdef MP-WEIXIN || MP-ALIPAY
      return await this.streamMiniProgram(message, options);
      // #endif
      
      // 其他平台降级到非流式
      return await this.fallbackNonStream(message, options);
    } catch (error) {
      // 错误处理
      this.options.onError(error);
      
      // 如果启用降级且未超过重试次数，尝试非流式请求
      if (this.options.enableFallback && this.retryCount < this.options.maxRetries) {
        console.warn('[AI Stream] 流式请求失败，降级到非流式', error);
        return await this.fallbackNonStream(message, options);
      }
      
      throw error;
    } finally {
      this.isStreaming = false;
      this.controller = null;
    }
  }

  /**
   * H5平台流式实现（使用Fetch API + ReadableStream）
   */
  async streamH5(message, options = {}) {
    const response = await fetch(this.getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({
        message,
        stream: true,
        ...options
      }),
      signal: this.controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 解码数据块
      const chunk = decoder.decode(value, { stream: true });
      
      // 解析SSE数据
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          
          // 检查结束标记
          if (data === '[DONE]') {
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            const token = this.extractToken(parsed);
            
            if (token) {
              fullText += token;
              this.options.onToken(token);
            }
          } catch (err) {
            console.warn('[AI Stream] JSON解析失败:', data, err);
          }
        }
      }
    }
    
    this.options.onComplete(fullText);
    return fullText;
  }

  /**
   * 小程序平台流式实现（使用requestTask + 分块接收）
   */
  async streamMiniProgram(message, options = {}) {
    return new Promise((resolve, reject) => {
      let fullText = '';
      let buffer = '';
      
      const requestTask = uni.request({
        url: this.getApiUrl(),
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        data: {
          message,
          stream: true,
          ...options
        },
        enableChunked: true, // 启用分块传输
        
        success: (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP错误: ${res.statusCode}`));
            return;
          }
          
          // 小程序会一次性返回完整响应
          // 这里需要模拟流式输出效果
          this.simulateStream(res.data, (token) => {
            fullText += token;
            this.options.onToken(token);
          }).then(() => {
            this.options.onComplete(fullText);
            resolve(fullText);
          });
        },
        
        fail: (err) => {
          reject(err);
        }
      });
      
      // 监听分块数据（部分小程序支持）
      if (requestTask.onChunkReceived) {
        requestTask.onChunkReceived((res) => {
          const chunk = this.arrayBufferToString(res.data);
          buffer += chunk;
          
          // 解析缓冲区中的完整消息
          const messages = this.parseSSEBuffer(buffer);
          
          messages.forEach(msg => {
            const token = this.extractToken(msg);
            if (token) {
              fullText += token;
              this.options.onToken(token);
            }
          });
          
          // 清理已处理的部分
          buffer = this.cleanBuffer(buffer);
        });
      }
      
      // 保存任务引用以便取消
      this.controller = { abort: () => requestTask.abort() };
    });
  }

  /**
   * 降级到非流式请求
   */
  async fallbackNonStream(message, options = {}) {
    console.log('[AI Stream] 使用非流式请求');
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: this.getApiUrl(),
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        data: {
          message,
          stream: false,
          ...options
        },
        timeout: this.options.timeout,
        
        success: (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP错误: ${res.statusCode}`));
            return;
          }
          
          const content = res.data?.content || res.data?.message || '';
          
          // 模拟流式输出效果
          this.simulateStream(content, (token) => {
            this.options.onToken(token);
          }).then(() => {
            this.options.onComplete(content);
            resolve(content);
          });
        },
        
        fail: (err) => {
          reject(err);
        }
      });
    });
  }

  /**
   * 模拟流式输出效果（逐字输出）
   * @param {string} text - 完整文本
   * @param {function} onToken - token回调
   * @returns {Promise}
   */
  simulateStream(text, onToken) {
    return new Promise((resolve) => {
      let index = 0;
      const interval = 30; // 每30ms输出一个字符
      
      const timer = setInterval(() => {
        if (index >= text.length) {
          clearInterval(timer);
          resolve();
          return;
        }
        
        // 每次输出1-3个字符（模拟自然输出）
        const chunkSize = Math.min(
          Math.floor(Math.random() * 3) + 1,
          text.length - index
        );
        
        const chunk = text.substring(index, index + chunkSize);
        onToken(chunk);
        
        index += chunkSize;
      }, interval);
    });
  }

  /**
   * 从响应中提取token
   * @param {object} data - 解析后的数据
   * @returns {string|null}
   */
  extractToken(data) {
    // OpenAI格式
    if (data.choices && data.choices[0]) {
      const delta = data.choices[0].delta;
      return delta?.content || null;
    }
    
    // 自定义格式
    if (data.token) {
      return data.token;
    }
    
    if (data.content) {
      return data.content;
    }
    
    return null;
  }

  /**
   * 解析SSE缓冲区
   * @param {string} buffer - 缓冲区内容
   * @returns {array} - 解析后的消息数组
   */
  parseSSEBuffer(buffer) {
    const messages = [];
    const lines = buffer.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6).trim();
        
        if (data && data !== '[DONE]') {
          try {
            messages.push(JSON.parse(data));
          } catch (err) {
            console.warn('[AI Stream] 解析失败:', data);
          }
        }
      }
    }
    
    return messages;
  }

  /**
   * 清理缓冲区（移除已处理的完整消息）
   * @param {string} buffer
   * @returns {string}
   */
  cleanBuffer(buffer) {
    const lastNewline = buffer.lastIndexOf('\n\n');
    if (lastNewline !== -1) {
      return buffer.substring(lastNewline + 2);
    }
    return buffer;
  }

  /**
   * ArrayBuffer转字符串
   * @param {ArrayBuffer} buffer
   * @returns {string}
   */
  arrayBufferToString(buffer) {
    const uint8Array = new Uint8Array(buffer);
    let str = '';
    
    for (let i = 0; i < uint8Array.length; i++) {
      str += String.fromCharCode(uint8Array[i]);
    }
    
    return decodeURIComponent(escape(str));
  }

  /**
   * 获取API地址
   * @returns {string}
   */
  getApiUrl() {
    if (this.options.baseUrl) {
      return this.options.baseUrl;
    }
    
    // 从配置或环境变量获取
    // #ifdef H5
    return '/api/ai/chat/stream';
    // #endif
    
    // #ifdef MP-WEIXIN || MP-ALIPAY
    // 小程序需要使用云函数
    return 'https://your-cloud-function-url.com/stress-chat';
    // #endif
    
    return '';
  }

  /**
   * 获取认证头
   * @returns {object}
   */
  getAuthHeaders() {
    const token = uni.getStorageSync('token');
    
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    
    return {};
  }

  /**
   * 取消当前流式请求
   */
  cancel() {
    if (this.controller) {
      if (typeof this.controller.abort === 'function') {
        this.controller.abort();
      }
      this.isStreaming = false;
      this.controller = null;
    }
  }

  /**
   * 重置状态
   */
  reset() {
    this.cancel();
    this.retryCount = 0;
  }
}

export default AIStreamClient;

