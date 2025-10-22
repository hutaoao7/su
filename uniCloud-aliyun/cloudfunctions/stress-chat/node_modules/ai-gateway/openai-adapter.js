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
 * 错误类型枚举
 */
const ErrorType = {
  NETWORK: 'NETWORK',           // 网络错误
  TIMEOUT: 'TIMEOUT',           // 超时错误
  RATE_LIMIT: 'RATE_LIMIT',     // 限流错误
  AUTH: 'AUTH',                 // 认证错误
  INVALID_REQUEST: 'INVALID_REQUEST', // 无效请求
  SERVER: 'SERVER',             // 服务器错误
  UNKNOWN: 'UNKNOWN'            // 未知错误
};

/**
 * 分析错误类型
 */
function analyzeError(error) {
  const status = error.response?.status;
  const message = error.message || '';
  
  // 网络错误
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || 
      error.code === 'ETIMEDOUT' || message.includes('network')) {
    return ErrorType.NETWORK;
  }
  
  // 超时错误
  if (error.code === 'ETIMEDOUT' || message.includes('timeout')) {
    return ErrorType.TIMEOUT;
  }
  
  // HTTP状态码判断
  if (status) {
    if (status === 429) return ErrorType.RATE_LIMIT;
    if (status === 401 || status === 403) return ErrorType.AUTH;
    if (status >= 400 && status < 500) return ErrorType.INVALID_REQUEST;
    if (status >= 500) return ErrorType.SERVER;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * 判断错误是否可以重试
 */
function isRetryableError(errorType) {
  return [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.RATE_LIMIT,
    ErrorType.SERVER
  ].includes(errorType);
}

/**
 * 获取重试延迟时间（毫秒）
 */
function getRetryDelay(attempt, errorType) {
  // 限流错误使用更长的延迟
  if (errorType === ErrorType.RATE_LIMIT) {
    return Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
  }
  // 其他错误使用标准指数退避
  return Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
}

/**
 * 格式化错误信息
 */
function formatError(error, errorType) {
  const baseInfo = {
    type: errorType,
    message: error.message,
    code: error.code,
    status: error.response?.status,
    timestamp: new Date().toISOString()
  };
  
  // 根据错误类型添加额外信息
  switch (errorType) {
    case ErrorType.RATE_LIMIT:
      return {
        ...baseInfo,
        userMessage: '请求过于频繁，请稍后再试',
        suggestion: '等待后重试'
      };
    case ErrorType.AUTH:
      return {
        ...baseInfo,
        userMessage: 'AI服务认证失败',
        suggestion: '请联系管理员检查配置'
      };
    case ErrorType.NETWORK:
    case ErrorType.TIMEOUT:
      return {
        ...baseInfo,
        userMessage: '网络连接失败，请检查网络',
        suggestion: '检查网络后重试'
      };
    case ErrorType.INVALID_REQUEST:
      return {
        ...baseInfo,
        userMessage: '请求参数错误',
        suggestion: '检查输入内容'
      };
    default:
      return {
        ...baseInfo,
        userMessage: 'AI服务暂时不可用',
        suggestion: '请稍后重试'
      };
  }
}

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
    maxRetries = 2,
    timeout = 30000  // 30秒超时
  } = options;
  
  console.log(TAG, '调用OpenAI, model:', model, 'messages:', messages.length);
  
  let lastError;
  let lastErrorType;
  
  // 重试逻辑
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1, lastErrorType);
        console.log(TAG, `重试 ${attempt}/${maxRetries}, 延迟 ${delay}ms, 错误类型: ${lastErrorType}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // 创建带超时的Promise
      const requestPromise = openai.createChatCompletion({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: 0.95,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });
      
      const response = await Promise.race([requestPromise, timeoutPromise]);
      
      // 验证响应数据
      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }
      
      const reply = response.data.choices[0].message.content.trim();
      console.log(TAG, '调用成功, 返回长度:', reply.length);
      
      return reply;
      
    } catch (error) {
      lastError = error;
      lastErrorType = analyzeError(error);
      
      const errorInfo = formatError(error, lastErrorType);
      console.error(TAG, `尝试${attempt + 1}失败:`, JSON.stringify(errorInfo, null, 2));
      
      // 不可重试的错误直接抛出
      if (!isRetryableError(lastErrorType)) {
        console.error(TAG, '错误不可重试，立即终止');
        throw {
          ...errorInfo,
          originalError: error
        };
      }
      
      // 如果是最后一次尝试，抛出格式化的错误
      if (attempt === maxRetries) {
        console.error(TAG, '已达最大重试次数');
        throw {
          ...errorInfo,
          originalError: error,
          retries: maxRetries
        };
      }
    }
  }
  
  // 理论上不会到达这里
  throw lastError;
}

module.exports = {
  chat
};

