'use strict';
const crypto = require('crypto');
const qs = require('querystring');
const uniCloudHttp = uniCloud.httpclient;

// 自签 token（最小实现）
function signToken(payload, secret, expSeconds = 7 * 24 * 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + expSeconds })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

exports.main = async (event, context) => {
  try {
    const code = event && event.code;
    if (!code) return { errCode: 400, errMsg: '缺少 code' };

    // 用环境变量优先，其次用内联常量（把下面改成你的）
    const appid = process.env.WX_APPID || 'wx5a3c2fd2f74332b9';
    const secret = process.env.WX_APPSECRET || '306bf5a31398b0af35bd72e3fa072131';
    const tokenSecret = process.env.TOKEN_SECRET || '7AqR9mK3xG2pL6vB1tY5cW8dF4zN0jUe';

    // 1) 调微信 jscode2session
    const url = `https://api.weixin.qq.com/sns/jscode2session?${qs.stringify({
      appid,
      secret,
      js_code: code,
      grant_type: 'authorization_code'
    })}`;

    const { status, data } = await uniCloudHttp.request(url, { method: 'GET', dataType: 'json', timeout: 6000 });
    if (status !== 200) return { errCode: 502, errMsg: '微信登录服务不可用' };
    if (!data || data.errcode) return { errCode: 401, errMsg: data.errmsg || 'code 无效' };

    const { openid, session_key, unionid } = data;

    // 2) 这里你可以落库用户（示例省略：users 表 upsert）
    // const db = uniCloud.database(); await db.collection('users').doc(openid).set({...})

    // 3) 签发自定义 token（前端后续携带）
    const token = signToken({ sub: openid, sk: session_key ? session_key.slice(0, 6) : '' }, tokenSecret);

    return {
      errCode: 0,
      errMsg: 'ok',
      data: {
        uid: openid,
        token,
        tokenInfo: { token, tokenExpired: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 },
        userInfo: { uid: openid, unionid: unionid || '' }
      }
    };
  } catch (e) {
    console.log('[AUTH-LOGIN/J2S] error =', e && e.message);
    return { errCode: 500, errMsg: '登录服务异常' };
  }
};
