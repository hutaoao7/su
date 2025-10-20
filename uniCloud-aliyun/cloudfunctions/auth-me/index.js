'use strict';

const uniID = require('uni-id');

exports.main = async (event, context) => {
  const TAG = '[AUTH-ME]';
  
  try {
    console.log(TAG, 'whoami request start');
    
    // 获取token（从context或event中）
    const token = context.UNI_ID_TOKEN || event.uniIdToken;
    
    if (!token) {
      return {
        errCode: 401,
        errMsg: '未提供token',
        tag: TAG
      };
    }
    
    console.log(TAG, 'token received, length:', token.length);
    
    // 验证token并获取用户信息
    let ins = null;
    let checkTokenFn = null;
    
    // 尝试创建实例
    if (typeof uniID.createInstance === 'function') {
      try {
        const cfg = require('uni-config-center')({ pluginId: 'uni-id' }).config();
        ins = uniID.createInstance({ context, config: cfg });
        checkTokenFn = ins.checkToken ? ins.checkToken.bind(ins) : null;
      } catch (e) {
        console.log(TAG, 'createInstance failed:', e.message);
      }
    }
    
    // 回退到静态方法
    if (!checkTokenFn && typeof uniID.checkToken === 'function') {
      checkTokenFn = uniID.checkToken.bind(uniID);
    }
    
    if (!checkTokenFn) {
      return {
        errCode: 500,
        errMsg: 'checkToken方法不可用',
        tag: TAG
      };
    }
    
    console.log(TAG, 'calling checkToken...');
    
    // 验证token
    const result = await checkTokenFn(token);
    
    console.log(TAG, 'checkToken result:', result);
    
    if (result && result.code === 0 && result.uid) {
      return {
        errCode: 0,
        errMsg: 'ok',
        uid: result.uid,
        userInfo: result.userInfo || null,
        tag: TAG
      };
    }
    
    return {
      errCode: result?.code || 401,
      errMsg: result?.message || 'token验证失败',
      detail: result,
      tag: TAG
    };
    
  } catch (error) {
    console.error(TAG, 'error:', error);
    return {
      errCode: 500,
      errMsg: error.message || String(error),
      tag: TAG
    };
  }
};