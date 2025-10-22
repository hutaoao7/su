'use strict';

/**
 * 限流器
 * 每用户每分钟最多10次请求
 */

const TAG = '[RATE_LIMITER]';

// 请求计数Map（用户ID -> 时间戳数组）
const requestCounts = new Map();

// 限流配置
const RATE_LIMIT = {
  maxRequests: 10,  // 最大请求数
  windowMs: 60000   // 时间窗口（毫秒）
};

/**
 * 检查是否超过限流
 * @param {string} userId - 用户ID
 * @returns {Promise<boolean>} 是否通过限流检查
 */
async function checkLimit(userId) {
  const now = Date.now();
  const userRequests = requestCounts.get(userId) || [];
  
  // 清除时间窗口外的请求记录
  const recentRequests = userRequests.filter(timestamp => {
    return now - timestamp < RATE_LIMIT.windowMs;
  });
  
  // 检查是否超限
  if (recentRequests.length >= RATE_LIMIT.maxRequests) {
    console.warn(TAG, `用户${userId}触发限流: ${recentRequests.length}次/分钟`);
    return false;
  }
  
  // 记录本次请求
  recentRequests.push(now);
  requestCounts.set(userId, recentRequests);
  
  console.log(TAG, `用户${userId}请求计数: ${recentRequests.length}/${RATE_LIMIT.maxRequests}`);
  return true;
}

/**
 * 重置用户限流计数（可选，用于测试）
 * @param {string} userId - 用户ID
 */
function resetLimit(userId) {
  requestCounts.delete(userId);
  console.log(TAG, `已重置用户${userId}的限流计数`);
}

module.exports = {
  checkLimit,
  resetLimit
};

