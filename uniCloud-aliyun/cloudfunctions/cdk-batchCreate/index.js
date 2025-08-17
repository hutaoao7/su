'use strict';

const jwt = require('jsonwebtoken');
const { success, error } = require('common/response');
const { validateAuth } = require('common/validator');
const { rateLimit } = require('common/rateLimit');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成随机兑换码
function generateCode(length = 12, prefix = '') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符
  let result = prefix;
  for (let i = 0; i < length - prefix.length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

exports.main = async (event, context) => {
  const { httpMethod, headers, body } = event;
  
  // CORS 处理
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };
  }

  try {
    // 限流检查
    const clientIP = event.clientIP || 'unknown';
    await rateLimit(`cdk_batch_${clientIP}`, 10, 60); // 60秒内最多10次

    // 验证请求方法
    if (httpMethod !== 'POST') {
      return error(405, 'METHOD_NOT_ALLOWED', '方法不允许');
    }

    // 验证授权
    const authResult = await validateAuth(headers.authorization || headers.Authorization);
    if (!authResult.valid) {
      return error(401, 'UNAUTHORIZED', '未授权');
    }

    // 验证角色权限
    if (authResult.user.role !== 'org') {
      return error(403, 'FORBIDDEN', '无权限访问');
    }

    // 解析请求体
    const { prefix = '', count, length = 12, expiresAt, type = 'default', metadata = {} } = JSON.parse(body || '{}');

    // 参数验证
    if (!count || count < 1 || count > 1000) {
      return error(400, 'INVALID_PARAMS', '数量必须在1-1000之间');
    }

    if (length < 6 || length > 20) {
      return error(400, 'INVALID_PARAMS', '长度必须在6-20之间');
    }

    const db = uniCloud.database();
    const now = new Date();
    const expireDate = expiresAt ? new Date(expiresAt) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 默认30天

    // 创建批次记录
    const batchResult = await db.collection('cdk_batches').add({
      prefix,
      count,
      length,
      expiresAt: expireDate,
      type,
      metadata,
      createdAt: now,
      createdBy: authResult.user.userId
    });

    const batchId = batchResult.id;

    // 批量生成兑换码
    const codes = [];
    const codeRecords = [];
    
    for (let i = 0; i < count; i++) {
      let code;
      let attempts = 0;
      
      // 确保生成的码不重复
      do {
        code = generateCode(length, prefix);
        attempts++;
        if (attempts > 10) break; // 防止无限循环
      } while (codes.includes(code));
      
      codes.push(code);
      codeRecords.push({
        code,
        batchId,
        status: 'unused',
        expiresAt: expireDate,
        type,
        metadata,
        createdAt: now
      });
    }

    // 批量插入兑换码
    await db.collection('cdk_codes').add(codeRecords);

    return success({
      batchId,
      created: count,
      sample: codes.slice(0, 5) // 返回前5个作为样本
    });

  } catch (err) {
    console.error('批量创建兑换码失败:', err);
    return error(500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};