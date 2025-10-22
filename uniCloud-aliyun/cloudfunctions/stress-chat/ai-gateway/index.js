'use strict';

const openaiAdapter = require('./openai-adapter');
const contentSafety = require('./content-safety');
const rateLimiter = require('./rate-limiter');
const fallbackTemplates = require('./fallback-templates');

const TAG = '[AI_GATEWAY]';

class AIGateway {
  constructor() {
    this.TAG = TAG;
  }
  
  async chat(userId, messages, options = {}) {
    try {
      console.log(TAG, '请求开始, userId:', userId);
      
      const rateLimitPassed = await rateLimiter.checkLimit(userId);
      if (!rateLimitPassed) {
        console.warn(TAG, '触发限流');
        throw { code: 'RATE_LIMIT', message: '请求过于频繁，请稍后再试' };
      }
      
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.content) {
        const safetyCheck = await contentSafety.check(lastMessage.content);
        if (!safetyCheck.safe) {
          console.warn(TAG, '内容不安全，使用安全回复');
          return fallbackTemplates.getSafeResponse();
        }
      }
      
      console.log(TAG, '调用OpenAI');
      const response = await openaiAdapter.chat(messages, options);
      console.log(TAG, '调用成功');
      return response;
      
    } catch (error) {
      console.error(TAG, 'OpenAI调用失败:', error);
      if (error.code === 'RATE_LIMIT') {
        throw error;
      }
      console.log(TAG, '使用降级模板');
      return fallbackTemplates.getFallbackResponse(lastMessage?.content || '');
    }
  }
}

module.exports = new AIGateway();


