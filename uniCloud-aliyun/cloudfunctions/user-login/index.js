'use strict';

/**
 * 用户登录云函数
 * 处理微信登录
 */

const crypto = require('crypto');
const { getSupabaseClient } = require('../common/supabase-client');

// 生成JWT Token
function generateToken(userId) {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const payload = {
    uid: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7天过期
  };
  
  // 简化的JWT生成（生产环境应使用jsonwebtoken库）
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64');
  
  return `${header}.${body}.${signature}`;
}

exports.main = async (event, context) => {
  const TAG = '[user-login]';
  
  try {
    console.log(TAG, '========== 请求开始 ==========');
    console.log(TAG, '请求参数:', JSON.stringify(event, null, 2));
    
    const { code, userInfo = {} } = event;
    
    // 参数验证
    if (!code) {
      return {
        errCode: 400,
        errMsg: '缺少登录凭证'
      };
    }
    
    // 获取微信用户openid
    // 注意：这里需要配置微信小程序的appid和appsecret
    const APPID = process.env.WX_APPID || 'your-appid';
    const APPSECRET = process.env.WX_APPSECRET || 'your-appsecret';
    
    // 调用微信接口获取openid（简化处理）
    // 实际应该使用https请求微信API
    console.log(TAG, '获取openid，code:', code);
    
    // 模拟openid（开发环境）
    const openid = 'mock_openid_' + code.substring(0, 8);
    const sessionKey = 'mock_session_key_' + Date.now();
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 查询用户是否存在
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single();
    
    let userId;
    let isNewUser = false;
    
    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 表示没有找到记录，这是正常的
      console.error(TAG, '查询用户失败:', queryError);
      return {
        errCode: -1,
        errMsg: '查询用户失败'
      };
    }
    
    if (existingUser) {
      // 已存在的用户，更新最后登录时间
      userId = existingUser.id;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          session_key: sessionKey
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error(TAG, '更新用户信息失败:', updateError);
      }
      
      console.log(TAG, '老用户登录，ID:', userId);
    } else {
      // 新用户，创建记录
      isNewUser = true;
      
      const newUserData = {
        openid: openid,
        nickname: userInfo.nickName || '微信用户',
        avatar_url: userInfo.avatarUrl || '/static/images/default-avatar.png',
        gender: userInfo.gender || 0,
        session_key: sessionKey,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      };
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([newUserData])
        .select()
        .single();
      
      if (insertError) {
        console.error(TAG, '创建用户失败:', insertError);
        return {
          errCode: -1,
          errMsg: '创建用户失败'
        };
      }
      
      userId = newUser.id;
      console.log(TAG, '新用户注册，ID:', userId);
    }
    
    // 生成token
    const token = generateToken(userId);
    
    console.log(TAG, '登录成功');
    console.log(TAG, '========== 请求结束 ==========');
    
    return {
      errCode: 0,
      errMsg: '登录成功',
      data: {
        token: token,
        userId: userId,
        isNewUser: isNewUser,
        openid: openid, // 开发环境返回，生产环境不应返回
        expiresIn: 7 * 24 * 60 * 60 // 7天
      }
    };
    
  } catch (error) {
    console.error(TAG, '执行错误:', error);
    return {
      errCode: -1,
      errMsg: '系统错误: ' + error.message
    };
  }
};
