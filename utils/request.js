import { enhancedApiCall, initNetworkMonitor } from './api-handler.js';

const BASE_URL = 'https://your-unicloud-domain.com'; // 替换为实际的uniCloud域名

// 统一请求封装
class Request {
  constructor() {
    this.timeout = 10000; // 增加超时时间
    this.baseURL = BASE_URL;
    
    // 初始化网络监控
    initNetworkMonitor();
  }

  // 获取token
  getToken() {
    return uni.getStorageSync('AUTH_TOKEN') || '';
  }

  // 设置token
  setToken(token) {
    uni.setStorageSync('AUTH_TOKEN', token);
  }

  // 清除token
  clearToken() {
    uni.removeStorageSync('AUTH_TOKEN');
    uni.removeStorageSync('AUTH_USER');
    uni.removeStorageSync('AUTH_ROLE');
  }

  // 刷新token
  async refreshToken() {
    try {
      const response = await this.request('POST', '/api/v1/auth/refresh', {}, { skipAuth: true });
      if (response.ok && response.data.token) {
        this.setToken(response.data.token);
        return response.data.token;
      }
      return null;
    } catch (error) {
      console.error('刷新token失败:', error);
      return null;
    }
  }

  // 核心请求方法
  async request(method, url, data = {}, options = {}) {
    const { skipAuth = false, timeout = this.timeout } = options;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('请求超时'));
      }, timeout);

      const requestOptions = {
        url: this.baseURL + url,
        method: method.toUpperCase(),
        timeout,
        header: {
          'Content-Type': 'application/json'
        }
      };

      // 添加认证头
      if (!skipAuth) {
        const token = this.getToken();
        if (token) {
          requestOptions.header.Authorization = `Bearer ${token}`;
        }
      }

      // 处理请求数据
      if (method.toUpperCase() === 'GET') {
        if (Object.keys(data).length > 0) {
          const params = new URLSearchParams(data).toString();
          requestOptions.url += '?' + params;
        }
      } else {
        requestOptions.data = data;
      }

      uni.request({
        ...requestOptions,
        success: async (res) => {
          clearTimeout(timer);
          
          // 处理401自动刷新token
          if (res.statusCode === 401 && !skipAuth) {
            const newToken = await this.refreshToken();
            if (newToken) {
              // 重试请求
              requestOptions.header.Authorization = `Bearer ${newToken}`;
              uni.request({
                ...requestOptions,
                success: (retryRes) => {
                  resolve(retryRes.data);
                },
                fail: (retryErr) => {
                  reject(retryErr);
                }
              });
              return;
            } else {
              // 刷新失败，清除token并跳转登录
              this.clearToken();
              uni.reLaunch({ url: '/pages/auth/login' });
              reject(new Error('登录已过期'));
              return;
            }
          }

          resolve(res.data);
        },
        fail: (err) => {
          clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  // GET请求
  get(url, params = {}, options = {}) {
    return this.request('GET', url, params, options);
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request('POST', url, data, options);
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request('PUT', url, data, options);
  }

  // DELETE请求
  delete(url, data = {}, options = {}) {
    return this.request('DELETE', url, data, options);
  }
}

const request = new Request();

// 业务API封装
export const apiAuth = {
  login: (data) => request.post('/api/v1/auth/login', data),
  register: (data) => request.post('/api/v1/auth/register', data),
  me: () => request.get('/api/v1/auth/me'),
  refresh: () => request.post('/api/v1/auth/refresh'),
  wxLogin: (data) => request.post('/api/v1/auth/wxLogin', data)
};

export const apiCDK = {
  batchCreate: (data) => request.post('/api/v1/cdk/batchCreate', data),
  redeem: (data) => request.post('/api/v1/cdk/redeem', data),
  verify: (data) => request.post('/api/v1/cdk/verify', data)
};

export const apiMusic = {
  list: (category) => request.get('/api/v1/music/list', { category })
};

export const apiEvents = {
  track: (data) => request.post('/api/v1/events/track', data)
};

export const apiAdmin = {
  metrics: (range = '7d') => request.get('/api/v1/admin/metrics', { range })
};

// 安全调用封装
export const safeInvokeApi = async (fn, options = {}) => {
  const { timeout = 2000 } = options;
  
  try {
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('请求超时')), timeout)
      )
    ]);
    return result;
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
};

export default request;