// 统一请求封装
import { getToken, clearLoginData } from './auth.js';

// 云函数调用封装
class CloudFunctionRequest {
  constructor() {
    this.timeout = 10000;
  }

  /**
   * 调用云函数
   * @param {string} name - 云函数名称
   * @param {Object} data - 请求数据
   * @param {Object} options - 选项
   */
  async callFn(name, data = {}, options = {}) {
    const {
      showLoading = false,
      loadingText = '请求中...',
      showToast = true,
      timeout = this.timeout
    } = options;

    console.log(`[CLOUD_FN] 调用云函数: ${name}`, data);

    if (showLoading) {
      uni.showLoading({ title: loadingText });
    }

    try {
      const result = await Promise.race([
        uniCloud.callFunction({ name, data }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), timeout)
        )
      ]);

      console.log(`[CLOUD_FN] ${name} 返回:`, result);

      if (showLoading) {
        uni.hideLoading();
      }

      // 检查云函数执行结果
      if (result.result) {
        return result.result;
      } else {
        throw new Error('云函数执行失败');
      }

    } catch (error) {
      console.error(`[CLOUD_FN] ${name} 调用失败:`, error);
      
      if (showLoading) {
        uni.hideLoading();
      }

      if (showToast) {
        uni.showToast({
          title: error.message || '请求失败',
          icon: 'none',
          duration: 2000
        });
      }

      throw error;
    }
  }
}

// HTTP 请求封装
class HttpRequest {
  constructor() {
    this.timeout = 10000;
    this.baseURL = 'https://your-api-domain.com'; // 替换为实际的API域名
  }

  /**
   * HTTP 请求
   * @param {string} method - 请求方法
   * @param {string} url - 请求地址
   * @param {Object} data - 请求数据
   * @param {Object} options - 选项
   */
  async httpRequest(method, url, data = {}, options = {}) {
    const {
      skipAuth = false,
      showLoading = false,
      loadingText = '请求中...',
      showToast = true,
      timeout = this.timeout
    } = options;

    console.log(`[HTTP] ${method} ${url}`, data);

    if (showLoading) {
      uni.showLoading({ title: loadingText });
    }

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
        const token = getToken();
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
          
          if (showLoading) {
            uni.hideLoading();
          }

          console.log(`[HTTP] ${method} ${url} 响应:`, res);
          
          // 处理401未授权
          if (res.statusCode === 401 && !skipAuth) {
            console.log('[HTTP] 401未授权，清除登录数据');
            clearLoginData();
            
            if (showToast) {
              uni.showToast({
                title: '登录已过期',
                icon: 'none',
                duration: 2000
              });
            }
            
            // 跳转到登录页
            setTimeout(() => {
              uni.navigateTo({ url: '/pages/login/login' });
            }, 500);
            
            reject(new Error('登录已过期'));
            return;
          }

          // 检查HTTP状态码
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            const errorMsg = res.data?.message || `HTTP ${res.statusCode}`;
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          clearTimeout(timer);
          
          if (showLoading) {
            uni.hideLoading();
          }

          console.error(`[HTTP] ${method} ${url} 失败:`, err);
          
          if (showToast) {
            uni.showToast({
              title: err.errMsg || '网络错误',
              icon: 'none',
              duration: 2000
            });
          }
          
          reject(err);
        }
      });
    });
  }

  // GET请求
  get(url, params = {}, options = {}) {
    return this.httpRequest('GET', url, params, options);
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.httpRequest('POST', url, data, options);
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.httpRequest('PUT', url, data, options);
  }

  // DELETE请求
  delete(url, data = {}, options = {}) {
    return this.httpRequest('DELETE', url, data, options);
  }
}

// 创建实例
const cloudRequest = new CloudFunctionRequest();
const httpRequest = new HttpRequest();

// 业务API封装
export const authAPI = {
  // 微信登录
  wxLogin: async (code) => {
    // 调用云函数，并获取原始返回结果
    const { result } = await uniCloud.callFunction({ 
      name: 'auth-login', 
      data: { code } 
    });
    const r = result || {};
    
    // 严格判断：errCode必须为数字0，且data存在且非空
    const ok = (r && Number(r.errCode) === 0 && r.data && Object.keys(r.data).length > 0);
    
    if (ok) {
      // 成功，直接返回data部分
      return r.data;
    } else {
      // 失败，构造并抛出错误
      const errorMsg = r?.errMsg || '登录服务异常';
      throw new Error(errorMsg);
    }
  },
  
  // 获取用户信息
  getUserInfo: () => cloudRequest.callFn('auth-me', {}, {
    showToast: false
  })
};

export const musicAPI = {
  // 获取音乐分类
  getCategories: () => cloudRequest.callFn('fn-music', { action: 'categories' }),
  
  // 获取音乐列表
  getList: (category, page = 1, pageSize = 20) => 
    cloudRequest.callFn('fn-music', { action: 'list', category, page, pageSize }),
  
  // 获取音乐详情
  getDetail: (id) => cloudRequest.callFn('fn-music', { action: 'detail', id })
};

export const cdkAPI = {
  // 兑换CDK
  redeem: (code) => cloudRequest.callFn('cdk-redeem', { code }, {
    showLoading: true,
    loadingText: '兑换中...'
  })
};

// 导出请求实例
export { cloudRequest, httpRequest };
export default { cloudRequest, httpRequest, authAPI, musicAPI, cdkAPI };