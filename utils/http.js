/**
 * @deprecated 本模块已不推荐使用
 * 请使用 utils/unicloud-handler.js 调用云函数
 * http.js 仅保留用于第三方服务调用（如微信API）
 */
console.warn('[DEPRECATED] utils/http.js已废弃，请使用utils/unicloud-handler.js');

// HTTP请求封装
import { getToken } from './auth.js';

// 第三方服务基础URL（仅用于非uniCloud服务）
const BASE_URL = 'https://api.thirdparty.com';

/**
 * 统一请求方法
 * @param {Object} options - 请求配置
 * @param {string} options.url - 请求地址
 * @param {string} options.method - 请求方法，默认GET
 * @param {Object} options.data - 请求数据
 * @param {number} options.timeout - 超时时间，默认2000ms
 */
export function request(options = {}) {
  const {
    url,
    method = 'GET',
    data = {},
    timeout = 2000
  } = options;

  return new Promise((resolve, reject) => {
    // 构建请求头
    const header = {
      'Content-Type': 'application/json'
    };

    // 自动注入Authorization头
    const token = getToken();
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    // 发起请求
    uni.request({
      url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
      method: method.toUpperCase(),
      data,
      header,
      timeout,
      success: (res) => {
        // 检查HTTP状态码
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.data?.message || '请求失败'}`));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
}

/**
 * GET请求
 */
export function get(url, params = {}) {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  return request({
    url: fullUrl,
    method: 'GET'
  });
}

/**
 * POST请求
 */
export function post(url, data = {}) {
  return request({
    url,
    method: 'POST',
    data
  });
}

/**
 * PUT请求
 */
export function put(url, data = {}) {
  return request({
    url,
    method: 'PUT',
    data
  });
}

/**
 * DELETE请求
 */
export function del(url) {
  return request({
    url,
    method: 'DELETE'
  });
}

// 默认导出
export default {
  request,
  get,
  post,
  put,
  delete: del
};