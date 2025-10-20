'use strict';

/**
 * OpenAI适配器
 * 封装OpenAI API调用
 */

const { Configuration, OpenAIApi } = require('openai');

const TAG = '[OPENAI_ADAPTER]';

// 初始化OpenAI配置
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY未配置');
}

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

/**
 * 对话接口
 * @param {Array} messages - 消息列表
 * @param {Object} options - 配置选项
 * @returns {Promise<string>} AI回复
 */
async function chat(messages, options = {}) {
  const {
    model = 'gpt-3.5-turbo',
    temperature = 0.7,
    maxTokens = 400,
    maxRetries = 2
  } = options;
  
  console.log(TAG, '调用OpenAI, model:', model);
  
  let lastError;
  
  // 重试逻辑
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(TAG, `重试 ${attempt}/${maxRetries}`);
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
      
      const response = await openai.createChatCompletion({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: 0.95,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      });
      
      const reply = response.data.choices[0].message.content.trim();
      console.log(TAG, '调用成功');
      return reply;
      
    } catch (error) {
      lastError = error;
      console.error(TAG, `尝试${attempt + 1}失败:`, error.message);
      
      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  throw lastError;
}

module.exports = {
  chat
};

