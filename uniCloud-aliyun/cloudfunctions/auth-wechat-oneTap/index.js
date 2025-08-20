'use strict';

const crypto = require('crypto');

// 生成随机token
function generateToken(length = 36) {
  return crypto.randomBytes(length).toString('hex');
}

exports.main = async (event, context) => {
  const { code } = event;
  const clientIP = context.CLIENTIP || 'unknown';
  const userAgent = context.HEADERS ? context.HEADERS['user-agent'] || 'unknown' : 'unknown';
  
  console.log(`[auth-wechat-oneTap] 微信一键登录请求 - IP: ${clientIP}, 时间: ${new Date().toISOString()}`);
  
  // 参数校验
  if (!code) {
    console.log(`[auth-wechat-oneTap] 登录失败 - 缺少code参数, IP: ${clientIP}`);
    return {
      code: 4001,
      msg: 'MISSING_CODE'
    };
  }

  try {
    // 获取数据库引用
    const db = uniCloud.database();
    const usersCollection = db.collection('users');
    const authTokensCollection = db.collection('auth_tokens');
    
    // 读取微信小程序配置
    const configCenter = require('uni-config-center');
    const config = configCenter({
      pluginId: 'weapp'
    }).config();
    
    const mpWeixinConfig = config['mp-weixin'];
    if (!mpWeixinConfig || !mpWeixinConfig.appid || !mpWeixinConfig.secret) {
      console.log(`[auth-wechat-oneTap] 配置错误 - 缺少微信小程序配置, IP: ${clientIP}`);
      return {
        code: 5000,
        msg: 'CONFIG_ERROR'
      };
    }

    // 调用微信code2session接口
    const code2sessionUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${mpWeixinConfig.appid}&secret=${mpWeixinConfig.secret}&js_code=${code}&grant_type=authorization_code`;
    
    console.log(`[auth-wechat-oneTap] 调用微信接口: ${code2sessionUrl.replace(mpWeixinConfig.secret, '***')}`);
    
    const httpClient = uniCloud.httpclient();
    const wechatResponse = await httpClient.request(code2sessionUrl, {
      method: 'GET',
      dataType: 'json'
    });

    const wechatData = wechatResponse.data;
    console.log(`[auth-wechat-oneTap] 微信接口返回:`, JSON.stringify(wechatData));
    
    // 检查微信接口返回
    if (wechatData.errcode) {
      console.log(`[auth-wechat-oneTap] 微信接口错误 - errcode: ${wechatData.errcode}, errmsg: ${wechatData.errmsg}, IP: ${clientIP}`);
      return {
        code: 4001,
        msg: `WECHAT_${wechatData.errcode}: ${wechatData.errmsg}`
      };
    }

    const { openid, unionid, session_key } = wechatData;
    
    if (!openid) {
      console.log(`[auth-wechat-oneTap] 微信接口错误 - 未返回openid, IP: ${clientIP}`);
      return {
        code: 4001,
        msg: 'WECHAT_NO_OPENID'
      };
    }

    console.log(`[auth-wechat-oneTap] 获取到openid: ${openid}`);

    // 查找或创建用户
    let userQuery = await usersCollection.where({
      wx_openid: openid
    }).get();

    const currentTime = new Date();
    let uid;
    let user;

    if (userQuery.data.length === 0) {
      // 创建新用户
      const newUser = {
        wx_openid: openid,
        wx_unionid: unionid || null,
        nickname: `新用户${Math.random().toString(36).substr(2, 6)}`,
        avatarUrl: '',
        createdAt: currentTime,
        lastLoginAt: currentTime
      };
      
      const createResult = await usersCollection.add(newUser);
      uid = createResult.id;
      user = { ...newUser, _id: uid };
      
      console.log(`[auth-wechat-oneTap] 新用户创建 - uid: ${uid}, openid: ${openid}, IP: ${clientIP}`);
    } else {
      // 更新现有用户登录时间
      user = userQuery.data[0];
      uid = user._id;
      
      await usersCollection.doc(uid).update({
        lastLoginAt: currentTime
      });
      
      console.log(`[auth-wechat-oneTap] 用户登录 - uid: ${uid}, openid: ${openid}, IP: ${clientIP}`);
    }

    // 生成token
    const token = generateToken(36);
    const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30天后过期

    // 存储token
    await authTokensCollection.add({
      uid: uid,
      token: token,
      createdAt: currentTime,
      expiresAt: expiresAt,
      clientIP: clientIP,
      ua: userAgent
    });

    console.log(`[auth-wechat-oneTap] 登录成功 - uid: ${uid}, token生成, IP: ${clientIP}`);

    // 返回成功结果
    return {
      code: 0,
      msg: 'OK',
      data: {
        uid: uid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        token: token,
        expiresAt: expiresAt.getTime()
      }
    };

  } catch (error) {
    console.error(`[auth-wechat-oneTap] 系统错误 - ${error.message}, IP: ${clientIP}, 堆栈: ${error.stack}`);
    return {
      code: 5000,
      msg: `SYSTEM_ERROR: ${error.message}`
    };
  }
};