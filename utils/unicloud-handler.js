/**
 * uniCloud服务调用优化和错误处理
 * 专门处理uniCloud相关的白屏问题
 */

import { enhancedApiCall } from './api-handler.js';

// uniCloud实例缓存
let uniCloudInstance = null;

// 云函数调用状态
const cloudFunctionStatus = new Map();

/**
 * 初始化uniCloud
 */
export function initUniCloud() {
  try {
    // 检查uniCloud是否可用
    if (typeof uniCloud === 'undefined') {
      console.warn('[uniCloud处理器] uniCloud不可用');
      return false;
    }
    
    // 获取uniCloud实例 - 注释手动初始化，使用默认配置
    // uniCloudInstance = uniCloud.init({
    //   provider: 'aliyun',
    //   spaceId: 'your-space-id', // 替换为实际的spaceId
    //   clientSecret: 'your-client-secret' // 替换为实际的clientSecret
    // });
    
    // 使用默认uniCloud实例
    uniCloudInstance = uniCloud;
    
    console.log('[uniCloud处理器] 初始化完成');
    return true;
  } catch (error) {
    console.error('[uniCloud处理器] 初始化失败:', error);
    return false;
  }
}

/**
 * 增强的云函数调用
 * @param {string} functionName - 云函数名称
 * @param {Object} params - 调用参数
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回处理后的Promise
 */
export async function callCloudFunction(functionName, params = {}, options = {}) {
  const {
    timeout = 15000,
    retryCount = 2,
    cacheKey = null,
    cacheDuration = 5 * 60 * 1000,
    showLoading = false,
    loadingText = '处理中...',
    showError = true,
    fallbackData = null
  } = options;
  
  // 使用增强的API调用包装器
  return enhancedApiCall(
    async () => {
      // 检查uniCloud实例
      if (!uniCloudInstance) {
        const initialized = initUniCloud();
        if (!initialized) {
          throw new Error('uniCloud初始化失败');
        }
      }
      
      // 执行云函数调用
      const result = await uniCloudInstance.callFunction({
        name: functionName,
        data: params
      });
      
      // 检查云函数执行结果
      if (result.result && result.result.code !== undefined) {
        if (result.result.code !== 0) {
          throw new Error(result.result.message || '云函数执行失败');
        }
        return result.result.data || result.result;
      }
      
      return result.result;
    },
    {
      timeout,
      retryCount,
      cacheKey: cacheKey ? `cloud_${functionName}_${cacheKey}` : null,
      cacheDuration,
      showLoading,
      loadingText,
      showError,
      fallbackData,
      errorMessage: `${functionName}服务调用失败`
    }
  );
}

/**
 * 批量云函数调用
 * @param {Array} calls - 调用配置数组
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回结果数组
 */
export async function batchCallCloudFunction(calls, options = {}) {
  const {
    concurrency = 3,
    failFast = false,
    showProgress = false
  } = options;
  
  const apiCalls = calls.map(call => ({
    fn: () => callCloudFunction(call.name, call.params, { ...call.options, showLoading: false }),
    options: call.options || {}
  }));
  
  return enhancedApiCall.batchApiCall(apiCalls, {
    concurrency,
    failFast,
    showProgress
  });
}

/**
 * 云数据库操作包装器
 * @param {Function} dbOperation - 数据库操作函数
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回处理后的Promise
 */
export async function callCloudDB(dbOperation, options = {}) {
  const {
    timeout = 10000,
    retryCount = 2,
    showError = true,
    fallbackData = []
  } = options;
  
  return enhancedApiCall(
    async () => {
      // 检查uniCloud实例
      if (!uniCloudInstance) {
        const initialized = initUniCloud();
        if (!initialized) {
          throw new Error('uniCloud初始化失败');
        }
      }
      
      // 执行数据库操作
      const db = uniCloudInstance.database();
      const result = await dbOperation(db);
      
      return result;
    },
    {
      timeout,
      retryCount,
      showError,
      fallbackData,
      errorMessage: '数据库操作失败'
    }
  );
}

/**
 * 云存储操作包装器
 * @param {Function} storageOperation - 存储操作函数
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回处理后的Promise
 */
export async function callCloudStorage(storageOperation, options = {}) {
  const {
    timeout = 30000,
    retryCount = 1,
    showError = true,
    showProgress = false
  } = options;
  
  return enhancedApiCall(
    async () => {
      // 检查uniCloud实例
      if (!uniCloudInstance) {
        const initialized = initUniCloud();
        if (!initialized) {
          throw new Error('uniCloud初始化失败');
        }
      }
      
      // 执行存储操作
      const result = await storageOperation(uniCloudInstance);
      
      return result;
    },
    {
      timeout,
      retryCount,
      showError,
      showLoading: showProgress,
      loadingText: '文件处理中...',
      errorMessage: '文件操作失败'
    }
  );
}

/**
 * 常用云函数调用封装
 */
export const cloudFunctions = {
  // 用户认证相关
  auth: {
    login: (params) => callCloudFunction('auth-login', params, {
      showLoading: true,
      loadingText: '登录中...',
      cacheKey: null
    }),
    
    register: (params) => callCloudFunction('auth-register', params, {
      showLoading: true,
      loadingText: '注册中...',
      cacheKey: null
    }),
    
    refresh: (params) => callCloudFunction('auth-refresh', params, {
      showLoading: false,
      cacheKey: null
    }),
    
    me: () => callCloudFunction('auth-me', {}, {
      cacheKey: 'user_info',
      cacheDuration: 10 * 60 * 1000 // 10分钟缓存
    })
  },
  
  // 压力检测相关
  stress: {
    analyze: (params) => callCloudFunction('stress-analyzer', params, {
      showLoading: true,
      loadingText: '分析中...',
      timeout: 20000
    }),
    
    chat: (params) => callCloudFunction('stress-chat', params, {
      showLoading: false,
      timeout: 15000
    })
  },
  
  // CDK相关
  cdk: {
    batchCreate: (params) => callCloudFunction('cdk-batchCreate', params, {
      showLoading: true,
      loadingText: '生成中...',
      timeout: 30000
    }),
    
    redeem: (params) => callCloudFunction('cdk-redeem', params, {
      showLoading: true,
      loadingText: '兑换中...'
    }),
    
    verify: (params) => callCloudFunction('cdk-verify', params, {
      showLoading: false
    })
  },
  
  // 事件追踪
  events: {
    track: (params) => callCloudFunction('events-track', params, {
      showLoading: false,
      showError: false,
      retryCount: 1
    })
  },
  
  // 管理员功能
  admin: {
    metrics: (params) => callCloudFunction('admin-metrics', params, {
      cacheKey: `metrics_${params?.range || '7d'}`,
      cacheDuration: 2 * 60 * 1000 // 2分钟缓存
    })
  }
};

/**
 * 云数据库常用操作
 */
export const cloudDB = {
  // 获取用户压力记录
  getUserStressRecords: (userId, limit = 10) => callCloudDB(
    (db) => db.collection('stress-records')
      .where({ userId })
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get(),
    {
      cacheKey: `stress_records_${userId}`,
      cacheDuration: 5 * 60 * 1000
    }
  ),
  
  // 获取社区帖子
  getCommunityPosts: (page = 1, pageSize = 20) => callCloudDB(
    (db) => db.collection('community-posts')
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get(),
    {
      cacheKey: `community_posts_${page}`,
      cacheDuration: 2 * 60 * 1000
    }
  )
};

/**
 * uniCloud错误处理混入
 */
export const uniCloudMixin = {
  methods: {
    /**
     * 安全调用云函数
     */
    async $callCloud(functionName, params, options) {
      try {
        return await callCloudFunction(functionName, params, options);
      } catch (error) {
        console.error(`[${this.$options.name}] 云函数调用失败:`, functionName, error);
        return null;
      }
    },
    
    /**
     * 安全调用云数据库
     */
    async $callCloudDB(operation, options) {
      try {
        return await callCloudDB(operation, options);
      } catch (error) {
        console.error(`[${this.$options.name}] 云数据库调用失败:`, error);
        return null;
      }
    }
  }
};

/**
 * 预加载关键数据
 */
export async function preloadCriticalData() {
  console.log('[uniCloud处理器] 开始预加载关键数据');
  
  const preloadTasks = [
    // 预加载用户信息
    {
      key: 'user_info',
      apiCall: () => cloudFunctions.auth.me(),
      options: { showError: false }
    }
  ];
  
  try {
    await enhancedApiCall.preloadData(preloadTasks);
    console.log('[uniCloud处理器] 关键数据预加载完成');
  } catch (error) {
    console.warn('[uniCloud处理器] 关键数据预加载失败:', error);
  }
}

/**
 * 健康检查
 */
export async function healthCheck() {
  try {
    // 简单的云函数调用测试
    await callCloudFunction('auth-me', {}, {
      timeout: 5000,
      showError: false,
      showLoading: false
    });
    
    console.log('[uniCloud处理器] 健康检查通过');
    return true;
  } catch (error) {
    console.warn('[uniCloud处理器] 健康检查失败:', error);
    return false;
  }
}

console.log('[uniCloud处理器] 模块加载完成');