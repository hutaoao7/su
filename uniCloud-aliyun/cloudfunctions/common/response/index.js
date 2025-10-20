'use strict';

// 成功响应
function ok(data = null, msg = 'ok') {
  return {
    code: 0,
    msg,
    data
  };
}

// 错误响应
function err(code, msg, data = null) {
  return {
    code,
    msg,
    data
  };
}

// 常用错误响应
const errors = {
  // 参数错误
  INVALID_PARAMS: (msg = '参数错误') => err(40001, msg),
  
  // 未登录
  UNAUTHORIZED: (msg = '请先登录') => err(40002, msg),
  
  // 权限不足
  FORBIDDEN: (msg = '权限不足') => err(40003, msg),
  
  // 资源不存在
  NOT_FOUND: (msg = '资源不存在') => err(41001, msg),
  
  // 资源已存在
  ALREADY_EXISTS: (msg = '资源已存在') => err(41002, msg),
  
  // 频率限制
  RATE_LIMIT: (msg = '请求过于频繁') => err(42901, msg),
  
  // 服务器错误
  SERVER_ERROR: (msg = '服务器错误') => err(50000, msg)
};

module.exports = {
  ok,
  err,
  errors
};