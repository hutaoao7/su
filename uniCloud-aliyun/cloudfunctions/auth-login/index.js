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

    const { account, password } = event;
    
    timeoutCheck();

    if (!v.isAccount(account)) {
      return resp.err(400, '账号格式不正确');
    }
    if (!password) {
      return resp.err(400, '密码不能为空');
    }

    timeoutCheck();

    const clientIP = context.CLIENTIP || 'unknown';
    const rateLimitKey = `login:${clientIP}:${account}`;
    const rateLimitResult = await rate.check(rateLimitKey, 10, 60);
    
    if (!rateLimitResult.allowed) {
      return resp.err(429, '请求过于频繁，请稍后再试');
    }

    timeoutCheck();

    const db = uniCloud.database();
    const usersCollection = db.collection('users');

    const userResult = await usersCollection.where({
      account: account
    }).get();

    if (userResult.data.length === 0) {
      console.log(`登录失败 - 用户不存在: ${account}, IP: ${clientIP}, 时间: ${new Date().toISOString()}`);
      return resp.err(404, '用户不存在');
    }

    const user = userResult.data[0];
    
    timeoutCheck();

    if (user.loginFailCount >= 5) {
      console.log(`登录失败 - 账号被锁定: ${account}, IP: ${clientIP}, 时间: ${new Date().toISOString()}`);
      return resp.err(403, '账号已被锁定，请联系管理员');
    }

    const bcrypt = require('bcryptjs');
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    timeoutCheck();

    if (!passwordValid) {
      await usersCollection.doc(user._id).update({
        loginFailCount: user.loginFailCount + 1,
        updatedAt: new Date()
      });
      
      console.log(`登录失败 - 密码错误: ${account}, IP: ${clientIP}, 时间: ${new Date().toISOString()}, 失败次数: ${user.loginFailCount + 1}`);
      return resp.err(401, '密码错误');
    }

    timeoutCheck();

    await usersCollection.doc(user._id).update({
      loginFailCount: 0,
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });

    const token = jwtUtil.sign({
      uid: user._id,
      role: user.role
    });

    return resp.ok({
      token: token,
      user: {
        id: user._id,
        nickname: user.nickname,
        role: user.role
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    
    if (error.message === 'TIMEOUT') {
      return resp.err(504, '服务器繁忙');
    }
    
    return resp.err(500, '服务器繁忙');
  }
};