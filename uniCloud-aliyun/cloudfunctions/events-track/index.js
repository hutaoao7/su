'use strict';

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
    await rateLimit(`events_${clientIP}`, 50, 60);

    if (httpMethod !== 'POST') {
      return error(405, 'METHOD_NOT_ALLOWED', '方法不允许');
    }

    const authResult = await validateAuth(headers.authorization || headers.Authorization);
    if (!authResult.valid) {
      return error(401, 'UNAUTHORIZED', '未授权');
    }

    const { type, detail } = JSON.parse(body || '{}');
    if (!type || typeof type !== 'string') {
      return error(400, 'INVALID_PARAMS', '事件类型不能为空');
    }

    const db = uniCloud.database();
    const now = new Date();

    // 记录事件
    await db.collection('events').add({
      userId: authResult.user.userId,
      type,
      detail: detail || {},
      ts: now,
      client: {
        platform: event.platform || 'unknown',
        appVersion: event.appVersion || 'unknown'
      }
    });

    return success({ ok: true });

  } catch (err) {
    console.error('事件追踪失败:', err);
    return error(500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};