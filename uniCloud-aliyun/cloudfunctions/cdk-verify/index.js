'use strict';

const jwt = require('jsonwebtoken');
const { success, error } = require('common/response');
const { validateAuth } = require('common/validator');
const { rateLimit } = require('common/rateLimit');

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
    await rateLimit(`cdk_verify_${clientIP}`, 30, 60);

    if (httpMethod !== 'POST') {
      return error(405, 'METHOD_NOT_ALLOWED', '方法不允许');
    }

    const authResult = await validateAuth(headers.authorization || headers.Authorization);
    if (!authResult.valid) {
      return error(401, 'UNAUTHORIZED', '未授权');
    }

    const { code } = JSON.parse(body || '{}');
    if (!code || typeof code !== 'string') {
      return error(400, 'INVALID_PARAMS', '兑换码不能为空');
    }

    const db = uniCloud.database();
    const now = new Date();

    const codeDoc = await db.collection('cdk_codes').where({ code }).get();
    
    if (codeDoc.data.length === 0) {
      return success({
        valid: false,
        reason: '兑换码不存在'
      });
    }

    const codeData = codeDoc.data[0];
    
    if (codeData.status === 'redeemed') {
      return success({
        valid: false,
        reason: '兑换码已被使用'
      });
    }
    
    if (new Date(codeData.expiresAt) < now) {
      return success({
        valid: false,
        reason: '兑换码已过期'
      });
    }

    return success({
      valid: true,
      expiresAt: codeData.expiresAt
    });

  } catch (err) {
    console.error('验证兑换码失败:', err);
    return error(500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};