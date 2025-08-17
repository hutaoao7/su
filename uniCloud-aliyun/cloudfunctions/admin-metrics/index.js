'use strict';

const { success, error } = require('common/response');
const { validateAuth } = require('common/validator');
const { rateLimit } = require('common/rateLimit');

exports.main = async (event, context) => {
  const { httpMethod, headers, queryStringParameters } = event;
  
  // CORS 处理
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };
  }

  try {
    // 限流检查
    const clientIP = event.clientIP || 'unknown';
    await rateLimit(`metrics_${clientIP}`, 10, 60);

    if (httpMethod !== 'GET') {
      return error(405, 'METHOD_NOT_ALLOWED', '方法不允许');
    }

    const authResult = await validateAuth(headers.authorization || headers.Authorization);
    if (!authResult.valid) {
      return error(401, 'UNAUTHORIZED', '未授权');
    }

    // 验证管理员权限
    if (authResult.user.role !== 'org') {
      return error(403, 'FORBIDDEN', '无权限访问');
    }

    const range = queryStringParameters?.range || '7d';
    const db = uniCloud.database();
    const now = new Date();
    
    // 计算时间范围
    let startDate;
    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 获取总用户数
    const totalUsersResult = await db.collection('users').count();
    const totalUsers = totalUsersResult.total;

    // 获取新用户数据
    const newUsersResult = await db.collection('users')
      .where({
        createdAt: db.command.gte(startDate)
      })
      .field({ createdAt: true })
      .get();

    // 获取DAU数据
    const dauResult = await db.collection('events')
      .where({
        ts: db.command.gte(startDate)
      })
      .field({ userId: true, ts: true })
      .get();

    // 获取兑换数据
    const redeemsResult = await db.collection('cdk_redemptions')
      .where({
        redeemedAt: db.command.gte(startDate)
      })
      .field({ redeemedAt: true })
      .get();

    // 获取播放数据
    const playsResult = await db.collection('events')
      .where({
        type: 'music_play',
        ts: db.command.gte(startDate)
      })
      .field({ ts: true })
      .get();

    // 处理数据统计
    const newUsers = [];
    const dau = [];
    const wau = [];
    const redeems = [];
    const plays = [];

    // 按天统计
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // 新用户
      const dayNewUsers = newUsersResult.data.filter(user => {
        const createdAt = new Date(user.createdAt);
        return createdAt >= dayStart && createdAt < dayEnd;
      }).length;
      newUsers.unshift({ date: dayStart.toISOString().split('T')[0], count: dayNewUsers });

      // DAU
      const dayActiveUsers = new Set(dauResult.data.filter(event => {
        const ts = new Date(event.ts);
        return ts >= dayStart && ts < dayEnd;
      }).map(event => event.userId)).size;
      dau.unshift({ date: dayStart.toISOString().split('T')[0], count: dayActiveUsers });

      // 兑换
      const dayRedeems = redeemsResult.data.filter(redeem => {
        const redeemedAt = new Date(redeem.redeemedAt);
        return redeemedAt >= dayStart && redeemedAt < dayEnd;
      }).length;
      redeems.unshift({ date: dayStart.toISOString().split('T')[0], count: dayRedeems });

      // 播放
      const dayPlays = playsResult.data.filter(play => {
        const ts = new Date(play.ts);
        return ts >= dayStart && ts < dayEnd;
      }).length;
      plays.unshift({ date: dayStart.toISOString().split('T')[0], count: dayPlays });
    }

    // WAU (简化处理，取最近7天的活跃用户)
    const weekActiveUsers = new Set(dauResult.data.map(event => event.userId)).size;
    wau.push({ date: now.toISOString().split('T')[0], count: weekActiveUsers });

    return success({
      totalUsers,
      newUsers,
      dau,
      wau,
      redeems,
      plays
    });

  } catch (err) {
    console.error('获取统计数据失败:', err);
    return error(500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};