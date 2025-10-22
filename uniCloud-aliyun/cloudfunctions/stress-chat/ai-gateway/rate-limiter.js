'use strict';

const TAG = '[RATE_LIMITER]';
const requestCounts = new Map();
const RATE_LIMIT = { maxRequests: 10, windowMs: 60000 };

async function checkLimit(userId) {
  const now = Date.now();
  const userRequests = requestCounts.get(userId) || [];
  const recentRequests = userRequests.filter(ts => now - ts < RATE_LIMIT.windowMs);
  if (recentRequests.length >= RATE_LIMIT.maxRequests) {
    console.warn(TAG, `用户${userId}触发限流: ${recentRequests.length}次/分钟`);
    return false;
  }
  recentRequests.push(now);
  requestCounts.set(userId, recentRequests);
  console.log(TAG, `用户${userId}请求计数: ${recentRequests.length}/${RATE_LIMIT.maxRequests}`);
  return true;
}

function resetLimit(userId) {
  requestCounts.delete(userId);
  console.log(TAG, `已重置用户${userId}的限流计数`);
}

module.exports = { checkLimit, resetLimit };


