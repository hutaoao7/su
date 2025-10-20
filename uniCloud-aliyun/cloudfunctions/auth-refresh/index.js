'use strict';

const v = require('../common/validator');
const jwtUtil = require('jwt');
const resp = require('response');
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

    const oldToken = tokenMatch[1];
    
    timeoutCheck();

    let decoded;
    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
      decoded = jwt.verify(oldToken, secret, { ignoreExpiration: true });
    } catch (error) {
      return resp.err(401, 'Token格式错误');
    }

    if (!decoded || !decoded.uid) {
      return resp.err(401, 'Token无效');
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

    const newToken = jwtUtil.sign({
      uid: user._id,
      role: user.role
    });

    return resp.ok({
      token: newToken
    });

  } catch (error) {
    console.error('刷新Token失败:', error);
    
    if (error.message === 'TIMEOUT') {
      return resp.err(504, '服务器繁忙');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return resp.err(401, 'Token格式错误');
    }
    
    return resp.err(500, '服务器繁忙');
  }
};