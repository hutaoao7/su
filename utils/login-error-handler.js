/**
 * 登录错误处理器
 * 统一处理登录过程中的各种错误，提供友好的用户提示
 */

// ==================== 错误码映射表 ====================

/**
 * 错误码映射配置
 * @type {Object.<string|number, {message: string, retry: boolean, action: string}>}
 */
const ERROR_CODE_MAP = {
  // 微信登录错误码
  40029: { 
    message: '授权码已过期', 
    retry: true, 
    action: 'relogin',
    userTip: '授权已过期，请重新点击登录按钮'
  },
  40163: { 
    message: '授权码已使用', 
    retry: true, 
    action: 'relogin',
    userTip: '授权码已使用，请重新登录'
  },
  41001: { 
    message: '缺少必要参数', 
    retry: false, 
    action: 'contact',
    userTip: '登录参数错误，请联系客服'
  },
  
  // HTTP状态码
  400: { 
    message: '请求参数错误', 
    retry: false, 
    action: 'contact',
    userTip: '登录请求异常，请联系客服'
  },
  401: { 
    message: '授权失败', 
    retry: true, 
    action: 'relogin',
    userTip: '授权失败，请重新登录'
  },
  500: { 
    message: '服务器异常', 
    retry: true, 
    action: 'retry',
    userTip: '服务暂时不可用，请稍后重试'
  },
  502: { 
    message: '微信登录服务不可用', 
    retry: true, 
    action: 'retry',
    userTip: '微信登录服务暂时不可用，请稍后重试'
  },
  504: { 
    message: '网关超时', 
    retry: true, 
    action: 'retry',
    userTip: '服务响应超时，请重试'
  },
  
  // 自定义错误类型
  'NETWORK_ERROR': { 
    message: '网络连接失败', 
    retry: true, 
    action: 'check_network',
    userTip: '网络连接失败，请检查网络设置后重试'
  },
  'TIMEOUT': { 
    message: '请求超时', 
    retry: true, 
    action: 'retry',
    userTip: '请求超时，请重试'
  },
  'NO_CODE': {
    message: '未获取到授权码',
    retry: true,
    action: 'relogin',
    userTip: '授权失败，请重新登录'
  },
  'STORAGE_ERROR': {
    message: '数据保存失败',
    retry: false,
    action: 'contact',
    userTip: '登录数据保存失败，请检查存储权限'
  },
};

// ==================== 错误处理函数 ====================

/**
 * 处理登录错误
 * @param {Error|Object} error - 错误对象
 * @returns {Object} 标准化的错误信息
 */
export function handleLoginError(error) {
  console.log('[LOGIN_ERROR_HANDLER] 处理错误:', error);
  
  // 提取错误码
  let errorCode = error.errCode || 
                  error.code || 
                  error.statusCode || 
                  (error.message && error.message.toUpperCase());
  
  console.log('[LOGIN_ERROR_HANDLER] 错误码:', errorCode);
  
  // 查找错误码映射
  const errorInfo = ERROR_CODE_MAP[errorCode];
  
  if (errorInfo) {
    console.log('[LOGIN_ERROR_HANDLER] 找到映射:', errorInfo.message);
    return {
      code: errorCode,
      message: errorInfo.message,
      retry: errorInfo.retry,
      action: errorInfo.action,
      userMessage: errorInfo.userTip,
      originalError: error,
    };
  }
  
  // 未知错误
  console.log('[LOGIN_ERROR_HANDLER] 未知错误，使用默认处理');
  return {
    code: 'UNKNOWN',
    message: error.message || '登录失败',
    retry: true,
    action: 'retry',
    userMessage: '登录遇到问题，请重试',
    originalError: error,
  };
}

// ==================== 网络状态检测 ====================

/**
 * 检查网络状态
 * @returns {Promise<{isConnected: boolean, networkType: string}>}
 */
export function checkNetworkStatus() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        const isConnected = res.networkType !== 'none';
        console.log('[NETWORK_CHECK] 网络状态:', res.networkType, '连接:', isConnected);
        resolve({
          isConnected,
          networkType: res.networkType,
        });
      },
      fail: (error) => {
        console.error('[NETWORK_CHECK] 检查失败:', error);
        // 检查失败，假定网络可用（避免误判）
        resolve({ 
          isConnected: true, 
          networkType: 'unknown' 
        });
      },
    });
  });
}

// ==================== 重试装饰器 ====================

/**
 * 为登录函数添加重试能力
 * @param {Function} loginFn - 登录函数
 * @param {Object} options - 配置选项
 * @param {number} options.maxRetries - 最大重试次数，默认1
 * @param {number} options.delay - 重试延迟（毫秒），默认1000
 * @param {Function} options.shouldRetry - 判断是否应该重试的函数
 * @returns {Function} 包装后的函数
 */
export function withRetry(loginFn, options = {}) {
  const { 
    maxRetries = 1, 
    delay = 1000,
    shouldRetry = (error) => {
      const errorInfo = handleLoginError(error);
      return errorInfo.retry;
    }
  } = options;
  
  return async function (...args) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[LOGIN_RETRY] 尝试 ${attempt + 1}/${maxRetries + 1}`);
        
        const result = await loginFn(...args);
        
        console.log(`[LOGIN_RETRY] 尝试 ${attempt + 1} 成功`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.log(`[LOGIN_RETRY] 尝试 ${attempt + 1} 失败:`, error.message);
        
        // 判断是否应该重试
        if (!shouldRetry(error)) {
          console.log('[LOGIN_RETRY] 错误不可重试，直接抛出');
          throw error;
        }
        
        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
          console.log(`[LOGIN_RETRY] ${delay}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // 所有重试失败
    console.log('[LOGIN_RETRY] 所有尝试失败，抛出最后一个错误');
    throw lastError;
  };
}

// ==================== 导出 ====================

export default {
  handleLoginError,
  checkNetworkStatus,
  withRetry,
  ERROR_CODE_MAP,
};

