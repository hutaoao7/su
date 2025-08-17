/**
 * 增强的网络请求封装
 * 统一处理请求参数、响应结果、错误处理
 * 集成增强的API调用异常处理机制
 */

import { enhancedApiCall, initNetworkMonitor, defaultApiOptions } from '@/utils/api-handler.js';

// 开发环境API基础URL
const DEV_BASE_URL = 'http://localhost:3000/api';
// 生产环境API基础URL
const PROD_BASE_URL = 'https://api.lingxin.example.com';

// 配置当前环境
const BASE_URL = process.env.NODE_ENV === 'development' ? DEV_BASE_URL : PROD_BASE_URL;

// 初始化网络监控
initNetworkMonitor();

/**
 * 增强的请求拦截器
 */
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
  
  // 添加请求ID用于追踪
  config.header['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return config;
};

/**
 * 增强的响应拦截器
 */
const responseInterceptor = (response) => {
  // 检查HTTP状态码
  if (response.statusCode >= 200 && response.statusCode < 300) {
    // 检查业务状态码
    if (response.data && response.data.code !== undefined) {
      if (response.data.code === 0 || response.data.code === 200) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.message || '业务处理失败');
      }
    }
    return response.data;
  } else {
    // HTTP状态码错误
    const error = new Error(getHttpErrorMessage(response.statusCode));
    error.statusCode = response.statusCode;
    error.response = response;
    throw error;
  }
};

/**
 * 获取HTTP错误信息
 */
function getHttpErrorMessage(statusCode) {
  const errorMessages = {
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '拒绝访问',
    404: '请求的资源不存在',
    408: '请求超时',
    429: '请求过于频繁',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
    504: '网关超时'
  };
  
  return errorMessages[statusCode] || `HTTP错误 ${statusCode}`;
}

/**
 * 处理认证错误
 */
function handleAuthError() {
  // 清除本地认证信息
  uni.removeStorageSync('token');
  uni.removeStorageSync('userInfo');
  uni.removeStorageSync('AUTH_TOKEN');
  uni.removeStorageSync('AUTH_USER');
  uni.removeStorageSync('AUTH_ROLE');
  
  // 延迟跳转到登录页，避免重复跳转
  setTimeout(() => {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 如果当前不在登录页，则跳转
    if (currentPage && !currentPage.route.includes('login')) {
      uni.reLaunch({
        url: '/pages/auth/login'
      });
    }
  }, 1000);
}

/**
 * 统一请求方法
 */
const request = (options) => {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    timeout = 15000,
    cacheKey = null,
    cacheDuration = 5 * 60 * 1000,
    retryCount = 2,
    showLoading = false,
    loadingText = '请求中...',
    showError = true,
    fallbackData = null,
    ...otherOptions
  } = options;
  
  // 构建完整的请求配置
  const config = {
    url: url.startsWith('http') ? url : BASE_URL + url,
    method: method.toUpperCase(),
    data,
    header: {
      'Content-Type': 'application/json',
      ...header
    },
    timeout,
    ...otherOptions
  };
  
  // 应用请求拦截器
  const interceptedConfig = requestInterceptor(config);
  
  // 使用增强的API调用
  return enhancedApiCall(
    async () => {
      return new Promise((resolve, reject) => {
        uni.request({
          ...interceptedConfig,
          success: (res) => {
            try {
              // 特殊处理401错误
              if (res.statusCode === 401) {
                handleAuthError();
                reject(new Error('登录已过期'));
                return;
              }
              
              // 应用响应拦截器
              const result = responseInterceptor(res);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
          fail: (err) => {
            // 网络请求失败
            const error = new Error(err.errMsg || '网络请求失败');
            error.networkError = true;
            reject(error);
          }
        });
      });
    },
    {
      timeout,
      retryCount,
      cacheKey,
      cacheDuration,
      showLoading,
      loadingText,
      showError,
      fallbackData,
      errorMessage: '网络请求失败'
    }
  );
};

/**
 * 导出各种请求方法
 */
const enhancedRequest = {
  // GET请求
  get(url, params = {}, options = {}) {
    // 处理查询参数
    let fullUrl = url;
    if (Object.keys(params).length > 0) {
      const queryString = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      if (queryString) {
        fullUrl += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    
    return request({
      url: fullUrl,
      method: 'GET',
      cacheKey: options.cache ? `get_${url}_${JSON.stringify(params)}` : null,
      ...options
    });
  },
  
  // POST请求
  post(url, data = {}, options = {}) {
    return request({
      url,
      method: 'POST',
      data,
      showLoading: true,
      loadingText: '提交中...',
      ...options
    });
  },
  
  // PUT请求
  put(url, data = {}, options = {}) {
    return request({
      url,
      method: 'PUT',
      data,
      showLoading: true,
      loadingText: '更新中...',
      ...options
    });
  },
  
  // DELETE请求
  delete(url, data = {}, options = {}) {
    return request({
      url,
      method: 'DELETE',
      data,
      showLoading: true,
      loadingText: '删除中...',
      ...options
    });
  },
  
  // PATCH请求
  patch(url, data = {}, options = {}) {
    return request({
      url,
      method: 'PATCH',
      data,
      showLoading: true,
      loadingText: '更新中...',
      ...options
    });
  },
  
  // 文件上传
  upload(url, filePath, options = {}) {
    const {
      name = 'file',
      formData = {},
      header = {},
      showProgress = true,
      ...otherOptions
    } = options;
    
    return enhancedApiCall(
      async () => {
        return new Promise((resolve, reject) => {
          const uploadTask = uni.uploadFile({
            url: url.startsWith('http') ? url : BASE_URL + url,
            filePath,
            name,
            formData,
            header: {
              ...requestInterceptor({ header }).header
            },
            success: (res) => {
              try {
                const result = responseInterceptor({
                  statusCode: res.statusCode,
                  data: JSON.parse(res.data)
                });
                resolve(result);
              } catch (error) {
                reject(error);
              }
            },
            fail: (err) => {
              reject(new Error(err.errMsg || '文件上传失败'));
            }
          });
          
          // 显示上传进度
          if (showProgress) {
            uploadTask.onProgressUpdate((res) => {
              uni.showLoading({
                title: `上传中 ${res.progress}%`,
                mask: true
              });
            });
          }
        });
      },
      {
        timeout: 60000, // 上传超时时间更长
        retryCount: 1,
        showLoading: showProgress,
        loadingText: '上传中...',
        errorMessage: '文件上传失败',
        ...otherOptions
      }
    );
  },
  
  // 文件下载
  download(url, options = {}) {
    const {
      showProgress = true,
      ...otherOptions
    } = options;
    
    return enhancedApiCall(
      async () => {
        return new Promise((resolve, reject) => {
          const downloadTask = uni.downloadFile({
            url: url.startsWith('http') ? url : BASE_URL + url,
            success: (res) => {
              if (res.statusCode === 200) {
                resolve(res.tempFilePath);
              } else {
                reject(new Error('文件下载失败'));
              }
            },
            fail: (err) => {
              reject(new Error(err.errMsg || '文件下载失败'));
            }
          });
          
          // 显示下载进度
          if (showProgress) {
            downloadTask.onProgressUpdate((res) => {
              uni.showLoading({
                title: `下载中 ${res.progress}%`,
                mask: true
              });
            });
          }
        });
      },
      {
        timeout: 60000, // 下载超时时间更长
        retryCount: 1,
        showLoading: showProgress,
        loadingText: '下载中...',
        errorMessage: '文件下载失败',
        ...otherOptions
      }
    );
  }
};

/**
 * 业务API封装 - 增强版
 */
export const apiAuth = {
  login: (data) => enhancedRequest.post('/auth/login', data, {
    loadingText: '登录中...',
    showError: true
  }),
  
  register: (data) => enhancedRequest.post('/auth/register', data, {
    loadingText: '注册中...',
    showError: true
  }),
  
  me: () => enhancedRequest.get('/auth/me', {}, {
    cache: true,
    cacheDuration: 10 * 60 * 1000, // 10分钟缓存
    showLoading: false
  }),
  
  refresh: () => enhancedRequest.post('/auth/refresh', {}, {
    showLoading: false,
    showError: false
  }),
  
  wxLogin: (data) => enhancedRequest.post('/auth/wxLogin', data, {
    loadingText: '微信登录中...',
    showError: true
  }),
  
  logout: () => enhancedRequest.post('/auth/logout', {}, {
    showLoading: false
  })
};

export const apiCDK = {
  batchCreate: (data) => enhancedRequest.post('/cdk/batchCreate', data, {
    loadingText: '生成中...',
    timeout: 30000
  }),
  
  redeem: (data) => enhancedRequest.post('/cdk/redeem', data, {
    loadingText: '兑换中...'
  }),
  
  verify: (data) => enhancedRequest.post('/cdk/verify', data, {
    showLoading: false
  })
};

export const apiMusic = {
  list: (category) => enhancedRequest.get('/music/list', { category }, {
    cache: true,
    cacheDuration: 30 * 60 * 1000 // 30分钟缓存
  })
};

export const apiEvents = {
  track: (data) => enhancedRequest.post('/events/track', data, {
    showLoading: false,
    showError: false,
    retryCount: 1
  })
};

export const apiAdmin = {
  metrics: (range = '7d') => enhancedRequest.get('/admin/metrics', { range }, {
    cache: true,
    cacheDuration: 2 * 60 * 1000 // 2分钟缓存
  })
};

/**
 * 请求状态管理混入
 */
export const requestMixin = {
  data() {
    return {
      requestLoading: false,
      requestError: null
    };
  },
  
  methods: {
    /**
     * 安全的请求调用
     */
    async $request(requestFn, options = {}) {
      this.requestLoading = true;
      this.requestError = null;
      
      try {
        const result = await requestFn();
        return result;
      } catch (error) {
        this.requestError = error;
        console.error(`[${this.$options.name}] 请求失败:`, error);
        return null;
      } finally {
        this.requestLoading = false;
      }
    },
    
    /**
     * 重置请求状态
     */
    resetRequestStatus() {
      this.requestLoading = false;
      this.requestError = null;
    }
  }
};

// 导出默认请求实例
export default enhancedRequest;

console.log('[增强请求] 模块加载完成');