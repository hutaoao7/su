'use strict';

const { Configuration, OpenAIApi } = require('openai');

const TAG = '[OPENAI_ADAPTER]';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY未配置');
}

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

const ErrorType = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
  AUTH: 'AUTH',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

function analyzeError(error) {
  const status = error.response?.status;
  const message = error.message || '';
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || message.includes('network')) return ErrorType.NETWORK;
  if (error.code === 'ETIMEDOUT' || message.includes('timeout')) return ErrorType.TIMEOUT;
  if (status) {
    if (status === 429) return ErrorType.RATE_LIMIT;
    if (status === 401 || status === 403) return ErrorType.AUTH;
    if (status >= 400 && status < 500) return ErrorType.INVALID_REQUEST;
    if (status >= 500) return ErrorType.SERVER;
  }
  return ErrorType.UNKNOWN;
}

function isRetryableError(errorType) {
  return [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.RATE_LIMIT, ErrorType.SERVER].includes(errorType);
}

function getRetryDelay(attempt, errorType) {
  if (errorType === ErrorType.RATE_LIMIT) return Math.pow(2, attempt) * 2000;
  return Math.pow(2, attempt) * 1000;
}

function formatError(error, errorType) {
  const baseInfo = { type: errorType, message: error.message, code: error.code, status: error.response?.status, timestamp: new Date().toISOString() };
  switch (errorType) {
    case ErrorType.RATE_LIMIT: return { ...baseInfo, userMessage: '请求过于频繁，请稍后再试', suggestion: '等待后重试' };
    case ErrorType.AUTH: return { ...baseInfo, userMessage: 'AI服务认证失败', suggestion: '请联系管理员检查配置' };
    case ErrorType.NETWORK:
    case ErrorType.TIMEOUT: return { ...baseInfo, userMessage: '网络连接失败，请检查网络', suggestion: '检查网络后重试' };
    case ErrorType.INVALID_REQUEST: return { ...baseInfo, userMessage: '请求参数错误', suggestion: '检查输入内容' };
    default: return { ...baseInfo, userMessage: 'AI服务暂时不可用', suggestion: '请稍后重试' };
  }
}

async function chat(messages, options = {}) {
  const { model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 400, maxRetries = 2, timeout = 30000 } = options;
  console.log(TAG, '调用OpenAI, model:', model, 'messages:', messages.length);
  let lastError; let lastErrorType;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1, lastErrorType);
        console.log(TAG, `重试 ${attempt}/${maxRetries}, 延迟 ${delay}ms, 错误类型: ${lastErrorType}`);
        await new Promise(r => setTimeout(r, delay));
      }
      const requestPromise = openai.createChatCompletion({ model, messages, temperature, max_tokens: maxTokens, top_p: 0.95, frequency_penalty: 0.5, presence_penalty: 0.5 });
      const timeoutPromise = new Promise((_, reject) => { setTimeout(() => reject(new Error('Request timeout')), timeout); });
      const response = await Promise.race([requestPromise, timeoutPromise]);
      if (!response.data?.choices?.[0]?.message?.content) throw new Error('Invalid response format from OpenAI');
      const reply = response.data.choices[0].message.content.trim();
      console.log(TAG, '调用成功, 返回长度:', reply.length);
      return reply;
    } catch (error) {
      lastError = error; lastErrorType = analyzeError(error);
      const errorInfo = formatError(error, lastErrorType);
      console.error(TAG, `尝试${attempt + 1}失败:`, JSON.stringify(errorInfo, null, 2));
      if (!isRetryableError(lastErrorType)) throw { ...errorInfo, originalError: error };
      if (attempt === maxRetries) throw { ...errorInfo, originalError: error, retries: maxRetries };
    }
  }
  throw lastError;
}

module.exports = { chat };


