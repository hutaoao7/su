'use strict';

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-jwt-secret-key'; // 实际项目中应该从环境变量获取

// 获取用户信息
async function getUserInfo(context) {
  try {
    // 从context中获取token
    const token = context.HEADERS?.authorization?.replace('Bearer ', '') || 
                  context.HEADERS?.Authorization?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }
    
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.uid) {
      return null;
    }
    
    return {
      uid: decoded.uid,
      role: decoded.role || 'user'
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

// 验证用户权限
async function checkPermission(context, requiredRole = 'user') {
  const userInfo = await getUserInfo(context);
  
  if (!userInfo) {
    return { valid: false, error: '未登录' };
  }
  
  const roleLevel = {
    'user': 1,
    'admin': 2,
    'super': 3
  };
  
  const userLevel = roleLevel[userInfo.role] || 0;
  const requiredLevel = roleLevel[requiredRole] || 1;
  
  if (userLevel < requiredLevel) {
    return { valid: false, error: '权限不足' };
  }
  
  return { valid: true, userInfo };
}

module.exports = {
  getUserInfo,
  checkPermission
};