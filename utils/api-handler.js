/**
 * API调用异常处理和数据加载优化工具
 * 解决白屏问题中的数据加载机制问题
 */

// 网络状态监控
let networkStatus = {
  isConnected: true,
  networkType: 'unknown'
};

// 请求队列管理
const requestQueue = new Map();
const retryQueue = new Map();

// 缓存管理
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 初始化网络监控
 */
export function initNetworkMonitor() {
  try {
    // 监听网络状态变化
    uni.onNetworkStatusChange((res) => {
      networkStatus.isConnected = res.isConnected;
      networkStatus.networkType = res.networkType;
      
      console.log('[网络监控] 网络状态变化:', networkStatus);
      
      if (res.isConnected) {
        // 网络恢复时重试失败的请求
        retryFailedRequests();
      }
    });
    
    // 获取初始网络状态
    uni.getNetworkType({
      success: (res) => {
        networkStatus.networkType = res.networkType;
        networkStatus.isConnected = res.networkType !== 'none';
      }
    });
    
    console.log('[API处理器] 网络监控初始化完成');
  } catch (error) {
    console.error('[API处理器] 网络监控初始化失败:', error);
  }
}

/**
 * 增强的API调用包装器
 * @param {Function} apiCall - API调用函数
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回处理后的Promise
 */
export async function enhancedApiCall(apiCall, options = {}) {
  const {
    timeout = 10000,
    retryCount = 3,
    retryDelay = 1000,
    cacheKey = null,
    cacheDuration = CACHE_DURATION,
    fallbackData = null,
    showLoading = false,
    loadingText = '加载中...',
    showError = true,
    errorMessage = '数据加载失败',
    requireNetwork = true
  } = options;
  
  const requestId = generateRequestId();
  
  try {
    // 显示加载提示
    if (showLoading) {
      uni.showLoading({
        title: loadingText,
        mask: true
      });
    }
    
    // 检查网络状态
    if (requireNetwork && !networkStatus.isConnected) {
      throw new Error('网络连接不可用');
    }
    
    // 检查缓存
    if (cacheKey) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('[API处理器] 使用缓存数据:', cacheKey);
        if (showLoading) uni.hideLoading();
        return cachedData;
      }
    }
    
    // 检查是否有相同请求正在进行
    if (requestQueue.has(requestId)) {
      console.log('[API处理器] 等待相同请求完成:', requestId);
      return await requestQueue.get(requestId);
    }
    
    // 执行API调用
    const requestPromise = executeApiCallWithRetry(
      apiCall, 
      retryCount, 
      retryDelay, 
      timeout
    );
    
    requestQueue.set(requestId, requestPromise);
    
    const result = await requestPromise;
    
    // 缓存结果
    if (cacheKey && result) {
      setCachedData(cacheKey, result, cacheDuration);
    }
    
    // 清理请求队列
    requestQueue.delete(requestId);
    
    if (showLoading) uni.hideLoading();
    
    return result;
    
  } catch (error) {
    console.error('[API处理器] API调用失败:', error);
    
    // 清理请求队列
    requestQueue.delete(requestId);
    
    if (showLoading) uni.hideLoading();
    
    // 处理错误
    return handleApiError(error, {
      showError,
      errorMessage,
      fallbackData,
      cacheKey
    });
  }
}

/**
 * 执行带重试的API调用
 */
async function executeApiCallWithRetry(apiCall, retryCount, retryDelay, timeout) {
  let lastError;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // 创建超时Promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), timeout);
      });
      
      // 执行API调用
      const result = await Promise.race([
        apiCall(),
        timeoutPromise
      ]);
      
      console.log(`[API处理器] API调用成功 (尝试 ${attempt + 1}/${retryCount + 1})`);
      return result;
      
    } catch (error) {
      lastError = error;
      console.warn(`[API处理器] API调用失败 (尝试 ${attempt + 1}/${retryCount + 1}):`, error.message);
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < retryCount) {
        await delay(retryDelay * Math.pow(2, attempt)); // 指数退避
      }
    }
  }
  
  throw lastError;
}

/**
 * 处理API错误
 */
function handleApiError(error, options) {
  const { showError, errorMessage, fallbackData, cacheKey } = options;
  
  // 尝试使用过期缓存
  if (cacheKey) {
    const expiredCache = getCachedData(cacheKey, true);
    if (expiredCache) {
      console.log('[API处理器] 使用过期缓存数据:', cacheKey);
      if (showError) {
        uni.showToast({
          title: '使用离线数据',
          icon: 'none',
          duration: 2000
        });
      }
      return expiredCache;
    }
  }
  
  // 显示错误提示
  if (showError) {
    const message = getErrorMessage(error) || errorMessage;
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    });
  }
  
  // 返回降级数据
  if (fallbackData !== null) {
    console.log('[API处理器] 使用降级数据');
    return fallbackData;
  }
  
  // 重新抛出错误
  throw error;
}

/**
 * 获取错误信息
 */
function getErrorMessage(error) {
  if (!error) return '未知错误';
  
  // 网络错误
  if (error.message?.includes('timeout') || error.message?.includes('超时')) {
    return '请求超时，请检查网络连接';
  }
  
  if (error.message?.includes('network') || error.message?.includes('网络')) {
    return '网络连接异常';
  }
  
  // HTTP错误
  if (error.statusCode) {
    switch (error.statusCode) {
      case 400: return '请求参数错误';
      case 401: return '登录已过期';
      case 403: return '没有访问权限';
      case 404: return '请求的资源不存在';
      case 500: return '服务器内部错误';
      case 502: return '服务器网关错误';
      case 503: return '服务暂时不可用';
      default: return `服务器错误 (${error.statusCode})`;
    }
  }
  
  // 业务错误
  if (error.code) {
    return error.message || '业务处理失败';
  }
  
  return error.message || '请求失败';
}

/**
 * 缓存管理
 */
function getCachedData(key, allowExpired = false) {
  try {
    const cached = apiCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (!allowExpired && now > cached.expireTime) {
      apiCache.delete(key);
      return null;
    }
    
    return cached.data;
  } catch (error) {
    console.error('[API处理器] 获取缓存失败:', error);
    return null;
  }
}

function setCachedData(key, data, duration) {
  try {
    apiCache.set(key, {
      data,
      expireTime: Date.now() + duration,
      createTime: Date.now()
    });
  } catch (error) {
    console.error('[API处理器] 设置缓存失败:', error);
  }
}

/**
 * 清理过期缓存
 */
export function clearExpiredCache() {
  const now = Date.now();
  for (const [key, cached] of apiCache.entries()) {
    if (now > cached.expireTime) {
      apiCache.delete(key);
    }
  }
}

/**
 * 重试失败的请求
 */
function retryFailedRequests() {
  console.log('[API处理器] 开始重试失败的请求');
  
  for (const [requestId, requestInfo] of retryQueue.entries()) {
    setTimeout(() => {
      enhancedApiCall(requestInfo.apiCall, requestInfo.options)
        .then(result => {
          console.log('[API处理器] 重试请求成功:', requestId);
          retryQueue.delete(requestId);
        })
        .catch(error => {
          console.error('[API处理器] 重试请求失败:', requestId, error);
        });
    }, Math.random() * 2000); // 随机延迟避免同时重试
  }
}

/**
 * 数据预加载
 */
export async function preloadData(preloadConfigs) {
  console.log('[API处理器] 开始预加载数据');
  
  const preloadPromises = preloadConfigs.map(async (config) => {
    try {
      await enhancedApiCall(config.apiCall, {
        ...config.options,
        showLoading: false,
        showError: false
      });
      console.log('[API处理器] 预加载成功:', config.key);
    } catch (error) {
      console.warn('[API处理器] 预加载失败:', config.key, error);
    }
  });
  
  await Promise.allSettled(preloadPromises);
  console.log('[API处理器] 预加载完成');
}

/**
 * 批量API调用
 */
export async function batchApiCall(apiCalls, options = {}) {
  const {
    concurrency = 3,
    failFast = false,
    showProgress = false
  } = options;
  
  if (showProgress) {
    uni.showLoading({
      title: `处理中 0/${apiCalls.length}`,
      mask: true
    });
  }
  
  const results = [];
  let completed = 0;
  
  // 分批执行
  for (let i = 0; i < apiCalls.length; i += concurrency) {
    const batch = apiCalls.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (apiCall, index) => {
      try {
        const result = await enhancedApiCall(apiCall.fn, apiCall.options);
        completed++;
        
        if (showProgress) {
          uni.showLoading({
            title: `处理中 ${completed}/${apiCalls.length}`,
            mask: true
          });
        }
        
        return { success: true, data: result, index: i + index };
      } catch (error) {
        completed++;
        
        if (showProgress) {
          uni.showLoading({
            title: `处理中 ${completed}/${apiCalls.length}`,
            mask: true
          });
        }
        
        if (failFast) throw error;
        return { success: false, error, index: i + index };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  if (showProgress) {
    uni.hideLoading();
  }
  
  return results;
}

/**
 * 工具函数
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API调用状态管理混入
 */
export const apiStatusMixin = {
  data() {
    return {
      apiLoading: false,
      apiError: null,
      apiData: null
    };
  },
  
  methods: {
    /**
     * 安全的API调用
     */
    async safeApiCall(apiCall, options = {}) {
      this.apiLoading = true;
      this.apiError = null;
      
      try {
        const result = await enhancedApiCall(apiCall, options);
        this.apiData = result;
        return result;
      } catch (error) {
        this.apiError = error;
        throw error;
      } finally {
        this.apiLoading = false;
      }
    },
    
    /**
     * 重置API状态
     */
    resetApiStatus() {
      this.apiLoading = false;
      this.apiError = null;
      this.apiData = null;
    }
  }
};

// 导出默认配置
export const defaultApiOptions = {
  timeout: 10000,
  retryCount: 2,
  retryDelay: 1000,
  showLoading: false,
  showError: true
};

console.log('[API处理器] 模块加载完成');