'use strict';

const jwt = require('jsonwebtoken');
const { success, error } = require('common/response');
const { validateAuth } = require('common/validator');
const { rateLimit } = require('common/rateLimit');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    await rateLimit(`cdk_redeem_${clientIP}`, 20, 60); // 60秒内最多20次

    // 验证请求方法
    if (httpMethod !== 'POST') {
      return error(405, 'METHOD_NOT_ALLOWED', '方法不允许');
    }

    // 验证授权
    const authResult = await validateAuth(headers.authorization || headers.Authorization);
    if (!authResult.valid) {
      return error(401, 'UNAUTHORIZED', '未授权');
    }

    // 解析请求体
    const { code } = JSON.parse(body || '{}');

    if (!code || typeof code !== 'string') {
      return error(400, 'INVALID_PARAMS', '兑换码不能为空');
    }

    const db = uniCloud.database();
    const now = new Date();
    const userId = authResult.user.userId;

    // 原子性更新兑换码状态
    const updateResult = await db.collection('cdk_codes').where({
      code: code,
      status: 'unused'
    }).update({
      status: 'redeemed',
      userId: userId,
      redeemedAt: now
    });

    if (updateResult.updated === 0) {
      // 查询具体原因
      const codeDoc = await db.collection('cdk_codes').where({ code }).get();
      
      if (codeDoc.data.length === 0) {
        return error(400, 'CODE_NOT_FOUND', '兑换码不存在');
      }

      const codeData = codeDoc.data[0];
      if (codeData.status === 'redeemed') {
        return error(400, 'CODE_ALREADY_USED', '兑换码已被使用');
      }
      
      if (new Date(codeData.expiresAt) < now) {
        return error(400, 'CODE_EXPIRED', '兑换码已过期');
      }

      return error(400, 'CODE_INVALID', '兑换码无效');
    }

    // 获取兑换码信息
    const codeInfo = await db.collection('cdk_codes').where({ code }).get();
    const codeData = codeInfo.data[0];

    // 记录兑换日志
    await db.collection('cdk_redemptions').add({
      code,
      userId,
      batchId: codeData.batchId,
      redeemedAt: now,
      client: {
        platform: event.platform || 'unknown',
        appVersion: event.appVersion || 'unknown',
        ip: event.clientIP || 'unknown'
      }
    });

    return success({
      ok: true,
      code,
      boundTo: userId,
      benefits: codeData.metadata || {}
    });

  } catch (err) {
    console.error('兑换码兑换失败:', err);
    return error(500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};