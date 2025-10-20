'use strict';

/**
 * AI网关主模块
 * 统一AI服务调用接口，支持限流、降级、内容安全
 */

const openaiAdapter = require('./openai-adapter');
const contentSafety = require('./content-safety');
const rateLimiter = require('./rate-limiter');
const fallbackTemplates = require('./fallback-templates');

const TAG = '[AI_GATEWAY]';

/**
 * AI网关类
 * 提供统一的AI服务调用接口
 */
class AIGateway {
  constructor() {
    this.TAG = TAG;
  }
  
  /**
   * AI对话方法
   * @param {string} userId - 用户ID
   * @param {Array} messages - 消息历史
   * @param {Object} options - 配置选项
   * @returns {Promise<string>} AI回复内容
   */
  async chat(userId, messages, options = {}) {
  try {
    console.log(TAG, '请求开始, userId:', userId);
    
    // 1. 限流检查
    const rateLimitPassed = await rateLimiter.checkLimit(userId);
    if (!rateLimitPassed) {
      console.warn(TAG, '触发限流');
      throw { code: 'RATE_LIMIT', message: '请求过于频繁，请稍后再试' };
    }
    
    // 2. 内容安全检测
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.content) {
      const safetyCheck = await contentSafety.check(lastMessage.content);
      if (!safetyCheck.safe) {
        console.warn(TAG, '内容不安全，使用安全回复');
        return fallbackTemplates.getSafeResponse();
      }
    }
    
    // 3. 调用OpenAI（带重试）
    console.log(TAG, '调用OpenAI');
    const response = await openaiAdapter.chat(messages, options);
    
    console.log(TAG, '调用成功');
    return response;
    
  } catch (error) {
    console.error(TAG, 'OpenAI调用失败:', error);
    
    // 4. 降级处理
    if (error.code === 'RATE_LIMIT') {
      throw error; // 限流错误直接抛出
    }
    
    console.log(TAG, '使用降级模板');
    return fallbackTemplates.getFallbackResponse(lastMessage?.content || '');
  }
}

  }
}

// 导出网关类
module.exports = AIGateway;

