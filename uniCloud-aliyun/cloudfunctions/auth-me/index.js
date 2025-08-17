'use strict';

const v = require('../common/validator');
const jwtUtil = require('../common/jwt');
const resp = require('../common/response');
const rate = require('../common/rateLimit');

exports.main = async (event, context) => {
  const startTime = Date.now();
  
  try {
    const timeoutCheck = () => {
      if (Date.now() - startTime > 2000) {
        throw new Error('TIMEOUT');
      }
    };

    const authorization = event.authorization || event.Authorization;
    
    if (!authorization) {
      return resp.err(401, '未提供认证信息');
    }

    const tokenMatch = authorization.match(/^Bearer\s+(.+)$/);
    if (!tokenMatch) {
      return resp.err(401, '认证格式错误');
    }

    const token = tokenMatch[1];
    
    timeoutCheck();

    const decoded = jwtUtil.verify(token);
    if (!decoded) {
      return resp.err(401, 'Token无效或已过期');
    }

    timeoutCheck();

    const db = uniCloud.database();
    const usersCollection = db.collection('users');

    const userResult = await usersCollection.doc(decoded.uid).get();
    
    if (!userResult.data || userResult.data.length === 0) {
      return resp.err(404, '用户不存在');
    }

    const user = userResult.data[0];

    timeoutCheck();

    return resp.ok({
      user: {
        id: user._id,
        nickname: user.nickname,
        role: user.role
      }
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    
    if (error.message === 'TIMEOUT') {
      return resp.err(504, '服务器繁忙');
    }
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return resp.err(401, 'Token无效或已过期');
    }
    
    return resp.err(500, '服务器繁忙');
  }
};