/**
 * auth-login接口Mock数据
 * 
 * 用于前端开发时模拟登录接口响应
 */

// Mock用户数据
const mockUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    openid: 'oMOCK_USER_001_XXXXX',
    nickname: '测试用户1',
    avatar: '/static/images/avatar1.png',
    role: 'user',
    gender: 1,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    openid: 'oMOCK_USER_002_XXXXX',
    nickname: '测试用户2',
    avatar: '/static/images/avatar2.png',
    role: 'user',
    gender: 2,
    created_at: '2025-01-02T00:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    openid: 'oMOCK_ADMIN_XXXXX',
    nickname: '管理员',
    avatar: '/static/images/admin-avatar.png',
    role: 'admin',
    gender: 1,
    created_at: '2024-12-01T00:00:00Z'
  }
];

// Mock code到openid的映射
const mockCodeMap = {
  'MOCK_CODE_USER1': 'oMOCK_USER_001_XXXXX',
  'MOCK_CODE_USER2': 'oMOCK_USER_002_XXXXX',
  'MOCK_CODE_ADMIN': 'oMOCK_ADMIN_XXXXX',
  'MOCK_CODE_NEW_USER': 'oMOCK_NEW_USER_XXXXX',
  'MOCK_CODE_EXPIRED': null,  // 过期code
  'MOCK_CODE_USED': null      // 已使用code
};

/**
 * Mock登录响应
 * @param {string} code - 微信登录code
 * @param {object} userInfo - 可选的用户信息
 * @returns {object} - 登录响应
 */
export function mockAuthLogin(code, userInfo = null) {
  // 模拟网络延迟
  const delay = Math.random() * 500 + 300; // 300-800ms
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 检查code是否过期
      if (code === 'MOCK_CODE_EXPIRED') {
        resolve({
          errCode: 40163,
          errMsg: '微信code已过期，请重新获取',
          data: null
        });
        return;
      }
      
      // 检查code是否已使用
      if (code === 'MOCK_CODE_USED') {
        resolve({
          errCode: 40029,
          errMsg: 'code已被使用',
          data: null
        });
        return;
      }
      
      // 检查code是否有效
      const openid = mockCodeMap[code];
      if (!openid) {
        resolve({
          errCode: 50001,
          errMsg: '无效的code',
          data: null
        });
        return;
      }
      
      // 查找用户
      let user = mockUsers.find(u => u.openid === openid);
      let isNewUser = false;
      
      // 新用户
      if (!user) {
        isNewUser = true;
        user = {
          id: generateUUID(),
          openid: openid,
          nickname: userInfo?.nickname || `用户${openid.slice(-6)}`,
          avatar: userInfo?.avatar || '/static/images/default-avatar.png',
          role: 'user',
          gender: userInfo?.gender || 0,
          created_at: new Date().toISOString()
        };
        mockUsers.push(user);
      } else if (userInfo) {
        // 更新用户信息
        Object.assign(user, {
          nickname: userInfo.nickname || user.nickname,
          avatar: userInfo.avatar || user.avatar,
          gender: userInfo.gender !== undefined ? userInfo.gender : user.gender
        });
      }
      
      // 生成Token
      const token = generateMockToken(user);
      const tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7天后过期
      
      // 返回成功响应
      resolve({
        errCode: 0,
        errMsg: '登录成功',
        data: {
          token: token,
          tokenExpired: tokenExpired,
          uid: user.id,
          userInfo: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            role: user.role,
            openid: user.openid
          },
          isNewUser: isNewUser
        }
      });
    }, delay);
  });
}

/**
 * Mock网络错误
 */
export function mockNetworkError() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        errCode: -1,
        errMsg: '网络连接失败',
        data: null
      });
    }, 2000);
  });
}

/**
 * Mock服务器错误
 */
export function mockServerError() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        errCode: 500,
        errMsg: '服务器内部错误',
        data: null
      });
    }, 1000);
  });
}

/**
 * Mock超时错误
 */
export function mockTimeout() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('请求超时'));
    }, 10000);
  });
}

/**
 * 生成Mock Token
 */
function generateMockToken(user) {
  const header = Buffer.from(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT'
  })).toString('base64url');
  
  const payload = Buffer.from(JSON.stringify({
    uid: user.id,
    openid: user.openid,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  })).toString('base64url');
  
  const signature = Buffer.from('mock_signature').toString('base64url');
  
  return `${header}.${payload}.${signature}`;
}

/**
 * 生成UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 重置Mock数据
 */
export function resetMockData() {
  mockUsers.length = 3; // 保留前3个默认用户
  console.log('[MOCK] 重置mock数据');
}

/**
 * 添加Mock用户
 */
export function addMockUser(user) {
  mockUsers.push({
    id: generateUUID(),
    created_at: new Date().toISOString(),
    role: 'user',
    gender: 0,
    ...user
  });
}

/**
 * 获取所有Mock用户
 */
export function getMockUsers() {
  return [...mockUsers];
}

// 导出默认mock函数
export default {
  mockAuthLogin,
  mockNetworkError,
  mockServerError,
  mockTimeout,
  resetMockData,
  addMockUser,
  getMockUsers,
  mockCodeMap
};

// 使用示例
/*
// 在前端代码中使用mock数据
import { mockAuthLogin } from '@/tests/mock/auth-login-mock.js';

// 正常登录
const result = await mockAuthLogin('MOCK_CODE_USER1');
console.log('登录成功:', result);

// code过期
const expiredResult = await mockAuthLogin('MOCK_CODE_EXPIRED');
console.log('code过期:', expiredResult);

// 新用户
const newUserResult = await mockAuthLogin('MOCK_CODE_NEW_USER', {
  nickname: '新用户昵称',
  avatar: '/static/avatar.png'
});
console.log('新用户:', newUserResult);
*/

