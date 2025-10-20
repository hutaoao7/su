/**
 * 埋点统计SDK
 * 
 * 功能：
 * 1. 页面浏览埋点（PV/UV）
 * 2. 事件埋点（点击、提交等）
 * 3. 用户行为路径追踪
 * 4. 停留时长统计
 * 5. 批量上报数据
 */

// 配置
const config = {
  // 是否启用埋点
  enabled: true,
  
  // 批量上报配置
  batchSize: 10,           // 批量上报数量
  batchInterval: 30000,    // 批量上报间隔（毫秒）
  
  // 数据压缩
  compress: true,
  
  // 云函数名称
  cloudFunction: 'events-track'
};

// 事件队列
let eventQueue = [];

// 批量上报定时器
let batchTimer = null;

// 当前页面信息
let currentPage = {
  path: '',
  startTime: 0,
  params: {}
};

// 用户信息（延迟加载）
let userInfo = null;

// 设备信息（缓存）
let deviceInfo = null;

/**
 * 初始化埋点SDK
 */
export function initAnalytics(options = {}) {
  config.enabled = options.enabled !== false;
  
  if (!config.enabled) {
    console.log('[ANALYTICS] 埋点已禁用');
    return;
  }
  
  // 获取设备信息
  deviceInfo = getDeviceInfo();
  
  // 启动批量上报定时器
  startBatchTimer();
  
  console.log('[ANALYTICS] 埋点SDK初始化完成');
}

/**
 * 获取设备信息
 */
function getDeviceInfo() {
  try {
    const systemInfo = uni.getSystemInfoSync();
    return {
      platform: systemInfo.platform,
      system: systemInfo.system,
      model: systemInfo.model,
      brand: systemInfo.brand,
      pixelRatio: systemInfo.pixelRatio,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight,
      version: systemInfo.version,
      SDKVersion: systemInfo.SDKVersion,
      appVersion: systemInfo.appVersion || '1.0.0'
    };
  } catch (error) {
    console.error('[ANALYTICS] 获取设备信息失败:', error);
    return {};
  }
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  if (userInfo) return userInfo;
  
  try {
    const uid = uni.getStorageSync('uni_id_uid');
    const token = uni.getStorageSync('uni_id_token');
    const userInfoStr = uni.getStorageSync('uni_id_user_info');
    
    userInfo = {
      uid: uid || 'guest',
      isLoggedIn: !!token,
      userInfo: userInfoStr ? JSON.parse(userInfoStr) : {}
    };
    
    return userInfo;
  } catch (error) {
    console.error('[ANALYTICS] 获取用户信息失败:', error);
    return { uid: 'guest', isLoggedIn: false };
  }
}

/**
 * 页面浏览埋点（PV）
 * @param {string} pagePath - 页面路径
 * @param {object} params - 页面参数
 */
export function trackPageView(pagePath, params = {}) {
  if (!config.enabled) return;
  
  // 记录上一个页面的停留时长
  if (currentPage.path && currentPage.startTime) {
    const duration = Date.now() - currentPage.startTime;
    trackEvent('page_leave', {
      page_path: currentPage.path,
      duration: duration,
      params: currentPage.params
    });
  }
  
  // 更新当前页面信息
  currentPage = {
    path: pagePath,
    startTime: Date.now(),
    params: params
  };
  
  // 记录页面进入事件
  trackEvent('page_view', {
    page_path: pagePath,
    params: params,
    referrer: currentPage.path || ''
  });
  
  console.log('[ANALYTICS] page_view:', pagePath);
}

/**
 * 事件埋点
 * @param {string} eventName - 事件名称
 * @param {object} eventData - 事件数据
 */
export function trackEvent(eventName, eventData = {}) {
  if (!config.enabled) return;
  
  const event = {
    event_name: eventName,
    event_data: eventData,
    user: getUserInfo(),
    device: deviceInfo,
    timestamp: Date.now(),
    page_path: currentPage.path || '',
    session_id: getSessionId()
  };
  
  // 添加到队列
  eventQueue.push(event);
  
  console.log(`[ANALYTICS] event: ${eventName}`, eventData);
  
  // 检查是否需要立即上报
  if (eventQueue.length >= config.batchSize) {
    flushEvents();
  }
}

/**
 * 点击事件埋点
 * @param {string} elementId - 元素标识
 * @param {object} extraData - 额外数据
 */
export function trackClick(elementId, extraData = {}) {
  trackEvent('click', {
    element_id: elementId,
    ...extraData
  });
}

/**
 * 登录事件埋点
 * @param {string} method - 登录方式
 * @param {boolean} success - 是否成功
 * @param {object} extraData - 额外数据
 */
export function trackLogin(method, success, extraData = {}) {
  trackEvent('login', {
    login_method: method,
    success: success,
    ...extraData
  });
}

/**
 * 评估事件埋点
 * @param {string} action - 操作类型（start/complete/abandon）
 * @param {string} scaleId - 量表ID
 * @param {object} extraData - 额外数据
 */
export function trackAssessment(action, scaleId, extraData = {}) {
  trackEvent('assessment', {
    action: action,
    scale_id: scaleId,
    ...extraData
  });
}

/**
 * AI对话埋点
 * @param {string} action - 操作类型（send/receive/error）
 * @param {object} extraData - 额外数据
 */
export function trackChat(action, extraData = {}) {
  trackEvent('chat', {
    action: action,
    ...extraData
  });
}

/**
 * 获取会话ID
 */
function getSessionId() {
  let sessionId = uni.getStorageSync('analytics_session_id');
  
  if (!sessionId) {
    sessionId = generateSessionId();
    uni.setStorageSync('analytics_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * 生成会话ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 启动批量上报定时器
 */
function startBatchTimer() {
  if (batchTimer) {
    clearInterval(batchTimer);
  }
  
  batchTimer = setInterval(() => {
    if (eventQueue.length > 0) {
      flushEvents();
    }
  }, config.batchInterval);
}

/**
 * 立即上报所有事件
 */
export function flushEvents() {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  // 上报到云端
  sendToCloud(eventsToSend);
}

/**
 * 发送数据到云端
 */
async function sendToCloud(events) {
  try {
    console.log(`[ANALYTICS] 上报 ${events.length} 个事件`);
    
    // 数据压缩（简单JSON字符串化）
    const payload = {
      events: events,
      batch_id: generateBatchId(),
      timestamp: Date.now()
    };
    
    // 调用云函数
    const result = await uniCloud.callFunction({
      name: config.cloudFunction,
      data: payload
    });
    
    if (result && result.result && result.result.code === 0) {
      console.log('[ANALYTICS] 上报成功');
    } else {
      console.warn('[ANALYTICS] 上报失败:', result);
    }
    
  } catch (error) {
    console.error('[ANALYTICS] 上报异常:', error);
    // 上报失败，将事件放回队列
    eventQueue.unshift(...events);
  }
}

/**
 * 生成批次ID
 */
function generateBatchId() {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 应用退出时上报所有未发送的事件
 */
export function onAppHide() {
  flushEvents();
}

// 导出配置（用于测试）
export { config, eventQueue };

// 全局混入（自动追踪页面浏览）
export const analyticsMixin = {
  onShow() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    if (currentPage) {
      trackPageView(currentPage.route, currentPage.options || {});
    }
  },
  
  onHide() {
    // 记录页面离开时长
    if (currentPage.path && currentPage.startTime) {
      const duration = Date.now() - currentPage.startTime;
      trackEvent('page_leave', {
        page_path: currentPage.path,
        duration: duration
      });
    }
  }
};

