/**
 * 用户相关API
 */
import request from './request.js';
import { callFunction } from '@/utils/unicloud-handler.js';
import mockAdapter from './mock-adapter.js';

// 是否使用Mock数据（开发阶段）
const USE_MOCK = false; // 设置为false使用真实接口

// 用户登录
export const login = (data) => {
  return request.post('/user/login', data);
};

// 用户微信登录
export const wxLogin = (code) => {
  return request.post('/user/wxLogin', { code });
};

// 获取用户信息
export const getUserInfo = async (targetUserId = null) => {
  if (USE_MOCK) {
    // 使用Mock数据
    return mockAdapter.getMockUserInfo();
  }
  
  try {
    // 调用云函数
    const res = await callFunction('user-info', {
      targetUserId
    });
    
    return res;
  } catch (error) {
    console.error('[API] 获取用户信息失败:', error);
    throw error;
  }
};

// 更新用户信息
export const updateUserInfo = (data) => {
  return request.put('/user/info', data);
};

// 更新用户头像
export const updateAvatar = (filePath) => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: request.defaults.baseURL + '/user/avatar',
      filePath,
      name: 'avatar',
      header: {
        'Authorization': `Bearer ${uni.getStorageSync('token') || ''}`,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
};

// 用户登出
export const logout = () => {
  return request.post('/user/logout');
}; 