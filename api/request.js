/**
 * 网络请求封装
 * 统一处理请求参数、响应结果、错误处理
 */

// 开发环境API基础URL
const DEV_BASE_URL = 'http://localhost:3000/api';
// 生产环境API基础URL
const PROD_BASE_URL = 'https://api.lingxin.example.com';

// 配置当前环境
const BASE_URL = process.env.NODE_ENV === 'development' ? DEV_BASE_URL : PROD_BASE_URL;

// 请求拦截器
const requestInterceptor = (config) => {
  // 获取token
  const token = uni.getStorageSync('token') || '';
  
  // 如果有token则添加到header
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    };
  }
  
  return config;
};

// 响应拦截器
const responseInterceptor = (response) => {
  // 这里可以统一处理响应
  // 例如，只返回服务器的data部分，或者根据状态码处理错误
  if (response.statusCode >= 200 && response.statusCode < 300) {
    return response.data;
  } else {
    // 请求成功但状态码不对，统一处理错误
    handleError(response);
    return Promise.reject(response);
  }
};

// 错误处理
const handleError = (error) => {
  let message = '';
  
  // 根据状态码生成错误信息
  switch (error.statusCode) {
    case 400:
      message = '请求参数错误';
      break;
    case 401:
      message = '未授权，请重新登录';
      // 可以在这里处理登录过期的情况，例如跳转到登录页
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/user/login'
        });
      }, 1500);
      break;
    case 403:
      message = '拒绝访问';
      break;
    case 404:
      message = '请求的资源不存在';
      break;
    case 500:
      message = '服务器内部错误';
      break;
    default:
      message = `未知错误：${error.statusCode}`;
  }
  
  // 显示错误提示
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
};

/**
 * 统一请求方法
 * @param {Object} options - 请求配置
 * @returns {Promise} - 请求Promise对象
 */
const request = (options) => {
  // 合并配置
  const config = {
    url: BASE_URL + options.url,
    method: options.method || 'GET',
    data: options.data || {},
    header: options.header || {
      'Content-Type': 'application/json'
    },
    timeout: options.timeout || 30000, // 默认30秒超时
    ...options
  };
  
  // 应用请求拦截器
  const interceptedConfig = requestInterceptor(config);
  
  // 返回Promise
  return new Promise((resolve, reject) => {
    uni.request({
      ...interceptedConfig,
      success: (res) => {
        try {
          // 应用响应拦截器
          const result = responseInterceptor(res);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => {
        // 请求失败的处理
        uni.showToast({
          title: '网络异常，请稍后再试',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

// 导出各种请求方法
export default {
  // GET请求
  get(url, data = {}, options = {}) {
    return request({
      url,
      data,
      method: 'GET',
      ...options
    });
  },
  
  // POST请求
  post(url, data = {}, options = {}) {
    return request({
      url,
      data,
      method: 'POST',
      ...options
    });
  },
  
  // PUT请求
  put(url, data = {}, options = {}) {
    return request({
      url,
      data,
      method: 'PUT',
      ...options
    });
  },
  
  // DELETE请求
  delete(url, data = {}, options = {}) {
    return request({
      url,
      data,
      method: 'DELETE',
      ...options
    });
  }
}; 