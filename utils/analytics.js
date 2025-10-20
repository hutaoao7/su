/**
 * 埋点统计SDK
 * 
 * 功能：
 * 1. 页面浏览追踪
 * 2. 用户行为追踪
 * 3. 错误追踪
 * 4. 自定义事件追踪
 * 5. 批量上报
 * 6. 离线缓存
 * 7. 数据压缩
 * 
 * @author CraneHeart Team
 * @version 1.0.0
 */

class Analytics {
  constructor(options = {}) {
    // 配置
    this.config = {
      enabled: options.enabled !== false, // 是否启用
      debug: options.debug || false, // 调试模式
      maxQueueSize: options.maxQueueSize || 10, // 队列最大长度
      flushInterval: options.flushInterval || 30000, // 上报间隔（毫秒）
      immediateEvents: options.immediateEvents || [ // 立即上报的事件
        'user_login',
        'user_register',
        'error_occurred',
        'api_error'
      ],
      ...options
    };
    
    // 事件队列
    this.queue = [];
    
    // 会话信息
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    // 页面信息
    this.currentPage = null;
    this.pageEnterTime = null;
    this.lastPageUrl = null;
    
    // 用户信息
    this.userId = null;
    this.userProperties = {};
    
    // 设备信息
    this.deviceInfo = null;
    
    // 定时器
    this.flushTimer = null;
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化
   */
  init() {
    if (!this.config.enabled) {
      return;
    }
    
    // 获取设备信息
    this.deviceInfo = this.getDeviceInfo();
    
    // 尝试获取用户信息
    this.loadUserInfo();
    
    // 启动自动上报
    this.startAutoFlush();
    
    // 监听页面隐藏事件（上报数据）
    this.setupPageVisibilityListener();
    
    // 加载离线缓存的事件
    this.loadOfflineEvents();
    
    this.log('Analytics SDK initialized', this.config);
  }
  
  /**
   * 设置用户ID
   * @param {String} userId - 用户ID
   * @param {Object} properties - 用户属性
   */
  setUser(userId, properties = {}) {
    this.userId = userId;
    this.userProperties = {
      ...this.userProperties,
      ...properties
    };
    
    // 保存到本地
    try {
      uni.setStorageSync('analytics_user_id', userId);
      uni.setStorageSync('analytics_user_properties', this.userProperties);
    } catch (error) {
      this.log('Save user info failed:', error);
    }
    
    this.log('User set:', userId, properties);
  }
  
  /**
   * 清除用户信息
   */
  clearUser() {
    this.userId = null;
    this.userProperties = {};
    
    try {
      uni.removeStorageSync('analytics_user_id');
      uni.removeStorageSync('analytics_user_properties');
    } catch (error) {
      this.log('Clear user info failed:', error);
    }
  }
  
  /**
   * 加载用户信息
   */
  loadUserInfo() {
    try {
      const userId = uni.getStorageSync('analytics_user_id');
      const properties = uni.getStorageSync('analytics_user_properties');
      
      if (userId) {
        this.userId = userId;
        this.userProperties = properties || {};
      }
    } catch (error) {
      this.log('Load user info failed:', error);
    }
  }
  
  /**
   * 追踪事件
   * @param {String} eventName - 事件名称
   * @param {Object} properties - 事件属性
   * @param {Boolean} immediate - 是否立即上报
   */
  track(eventName, properties = {}, immediate = false) {
    if (!this.config.enabled) {
      return;
    }
    
    const event = {
      event_name: eventName,
      event_type: properties.event_type || 'custom',
      event_time: Date.now(),
      properties,
      user_id: this.userId,
      session_id: this.sessionId,
      page_url: this.currentPage,
      device_info: this.deviceInfo
    };
    
    this.queue.push(event);
    
    this.log('Event tracked:', event);
    
    // 判断是否立即上报
    const shouldFlushImmediately = immediate || 
      this.config.immediateEvents.includes(eventName) ||
      this.queue.length >= this.config.maxQueueSize;
    
    if (shouldFlushImmediately) {
      this.flush();
    }
  }
  
  /**
   * 追踪页面浏览
   * @param {String} pageUrl - 页面URL
   * @param {String} pageTitle - 页面标题
   * @param {Object} extraProps - 额外属性
   */
  trackPageView(pageUrl, pageTitle, extraProps = {}) {
    // 如果有上一个页面，先记录离开事件
    if (this.currentPage && this.pageEnterTime) {
      const duration = Date.now() - this.pageEnterTime;
      this.trackPageLeave(this.currentPage, duration);
    }
    
    // 记录新页面浏览
    this.currentPage = pageUrl;
    this.pageEnterTime = Date.now();
    
    this.track('page_view', {
      event_type: 'page_view',
      page_url: pageUrl,
      page_title: pageTitle,
      referrer: this.lastPageUrl || '',
      enter_time: this.pageEnterTime,
      ...extraProps
    });
    
    this.lastPageUrl = pageUrl;
  }
  
  /**
   * 追踪页面离开
   * @param {String} pageUrl - 页面URL
   * @param {Number} duration - 停留时长（毫秒）
   */
  trackPageLeave(pageUrl, duration) {
    this.track('page_leave', {
      event_type: 'page_view',
      page_url: pageUrl,
      duration: Math.floor(duration / 1000) // 转为秒
    });
  }
  
  /**
   * 追踪点击事件
   * @param {String} elementId - 元素ID
   * @param {Object} extraProps - 额外属性
   */
  trackClick(elementId, extraProps = {}) {
    this.track('button_click', {
      event_type: 'click',
      button_id: elementId,
      page_url: this.currentPage,
      ...extraProps
    });
  }
  
  /**
   * 追踪表单提交
   * @param {String} formName - 表单名称
   * @param {Object} extraProps - 额外属性
   */
  trackFormSubmit(formName, extraProps = {}) {
    this.track('form_submit', {
      event_type: 'form',
      form_name: formName,
      page_url: this.currentPage,
      ...extraProps
    });
  }
  
  /**
   * 追踪搜索
   * @param {String} keyword - 搜索关键词
   * @param {Number} resultCount - 结果数量
   */
  trackSearch(keyword, resultCount) {
    this.track('search', {
      event_type: 'custom',
      keyword,
      result_count: resultCount,
      page_url: this.currentPage
    });
  }
  
  /**
   * 追踪错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   */
  trackError(error, context = {}) {
    this.track('error_occurred', {
      event_type: 'custom',
      error_type: error.name || 'Error',
      error_message: error.message,
      error_stack: error.stack,
      page_url: this.currentPage,
      ...context
    }, true); // 错误事件立即上报
  }
  
  /**
   * 追踪API错误
   * @param {String} apiUrl - API地址
   * @param {Number} statusCode - 状态码
   * @param {String} errorMessage - 错误信息
   */
  trackApiError(apiUrl, statusCode, errorMessage) {
    this.track('api_error', {
      event_type: 'custom',
      api_url: apiUrl,
      api_status: statusCode,
      error_message: errorMessage,
      page_url: this.currentPage
    }, true); // API错误立即上报
  }
  
  /**
   * 追踪用户行为路径
   * @param {String} action - 行为动作
   * @param {Object} properties - 行为属性
   */
  trackUserAction(action, properties = {}) {
    this.track('user_action', {
      event_type: 'custom',
      action,
      page_url: this.currentPage,
      session_id: this.sessionId,
      ...properties
    });
  }
  
  /**
   * 刷新队列（上报）
   */
  async flush() {
    if (this.queue.length === 0) {
      return;
    }
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      const { result } = await uniCloud.callFunction({
        name: 'events-track',
        data: {
          events,
          batch: true,
          app_version: this.getAppVersion(),
          sdk_version: '1.0.0'
        }
      });
      
      if (result && result.code === 200) {
        this.log('Events flushed successfully:', events.length);
      } else {
        // 上报失败，重新加入队列
        this.queue.unshift(...events);
        this.log('Events flush failed, re-queued');
        
        // 保存到离线缓存
        this.saveOfflineEvents(events);
      }
    } catch (error) {
      this.log('Events flush error:', error);
      
      // 网络错误，保存到离线缓存
      this.saveOfflineEvents(events);
      
      // 重新加入队列
      this.queue.unshift(...events);
    }
  }
  
  /**
   * 启动自动上报
   */
  startAutoFlush() {
    if (this.flushTimer) {
      return;
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
    
    this.log('Auto flush started, interval:', this.config.flushInterval);
  }
  
  /**
   * 停止自动上报
   */
  stopAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
      this.log('Auto flush stopped');
    }
  }
  
  /**
   * 保存离线事件
   * @param {Array} events - 事件列表
   */
  saveOfflineEvents(events) {
    try {
      const existing = uni.getStorageSync('analytics_offline_events') || [];
      const combined = [...existing, ...events];
      
      // 限制最多保存1000条
      const limited = combined.slice(-1000);
      
      uni.setStorageSync('analytics_offline_events', limited);
      this.log('Offline events saved:', limited.length);
    } catch (error) {
      this.log('Save offline events failed:', error);
    }
  }
  
  /**
   * 加载离线事件
   */
  async loadOfflineEvents() {
    try {
      const offlineEvents = uni.getStorageSync('analytics_offline_events');
      
      if (offlineEvents && offlineEvents.length > 0) {
        this.log('Loading offline events:', offlineEvents.length);
        
        // 尝试上报离线事件
        const { result } = await uniCloud.callFunction({
          name: 'events-track',
          data: {
            events: offlineEvents,
            batch: true,
            app_version: this.getAppVersion(),
            sdk_version: '1.0.0'
          }
        });
        
        if (result && result.code === 200) {
          // 上报成功，清除缓存
          uni.removeStorageSync('analytics_offline_events');
          this.log('Offline events flushed successfully');
        }
      }
    } catch (error) {
      this.log('Load offline events failed:', error);
    }
  }
  
  /**
   * 监听页面可见性变化
   */
  setupPageVisibilityListener() {
    // #ifdef H5
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // 页面隐藏时立即上报
          this.flush();
        }
      });
    }
    // #endif
    
    // #ifdef MP-WEIXIN
    // 小程序使用onHide生命周期
    // 需要在页面中手动调用
    // #endif
  }
  
  /**
   * 生成会话ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 获取设备信息
   */
  getDeviceInfo() {
    try {
      const systemInfo = uni.getSystemInfoSync();
      
      return {
        platform: systemInfo.platform,
        os: systemInfo.system,
        os_version: systemInfo.version,
        device_model: systemInfo.model,
        device_brand: systemInfo.brand,
        screen_width: systemInfo.screenWidth,
        screen_height: systemInfo.screenHeight,
        window_width: systemInfo.windowWidth,
        window_height: systemInfo.windowHeight,
        pixel_ratio: systemInfo.pixelRatio,
        network_type: systemInfo.networkType,
        language: systemInfo.language,
        // #ifdef MP-WEIXIN
        wechat_version: systemInfo.version,
        wechat_sdk_version: systemInfo.SDKVersion,
        // #endif
      };
    } catch (error) {
      this.log('Get device info failed:', error);
      return {};
    }
  }
  
  /**
   * 获取应用版本
   */
  getAppVersion() {
    // 从manifest.json或package.json读取
    // 这里简化处理
    try {
      const appInfo = uni.getStorageSync('app_info');
      return appInfo ? appInfo.version : '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }
  
  /**
   * 日志输出
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }
  
  /**
   * 销毁实例
   */
  destroy() {
    // 停止自动上报
    this.stopAutoFlush();
    
    // 上报剩余事件
    this.flush();
    
    this.log('Analytics destroyed');
  }
}

// ==================== 全局单例 ====================

let analyticsInstance = null;

/**
 * 初始化埋点SDK
 * @param {Object} options - 配置选项
 */
export function initAnalytics(options = {}) {
  if (analyticsInstance) {
    console.warn('[Analytics] Already initialized');
    return analyticsInstance;
  }
  
  analyticsInstance = new Analytics(options);
  return analyticsInstance;
}

/**
 * 获取埋点SDK实例
 * @returns {Analytics}
 */
export function getAnalytics() {
  if (!analyticsInstance) {
    console.warn('[Analytics] Not initialized, creating with default options');
    analyticsInstance = new Analytics();
  }
  return analyticsInstance;
}

/**
 * 销毁埋点SDK实例
 */
export function destroyAnalytics() {
  if (analyticsInstance) {
    analyticsInstance.destroy();
    analyticsInstance = null;
  }
}

// ==================== 快捷方法 ====================

/**
 * 追踪事件
 */
export function track(eventName, properties, immediate) {
  return getAnalytics().track(eventName, properties, immediate);
}

/**
 * 追踪页面浏览
 */
export function trackPageView(pageUrl, pageTitle, extraProps) {
  return getAnalytics().trackPageView(pageUrl, pageTitle, extraProps);
}

/**
 * 追踪点击
 */
export function trackClick(elementId, extraProps) {
  return getAnalytics().trackClick(elementId, extraProps);
}

/**
 * 追踪错误
 */
export function trackError(error, context) {
  return getAnalytics().trackError(error, context);
}

/**
 * 设置用户
 */
export function setUser(userId, properties) {
  return getAnalytics().setUser(userId, properties);
}

/**
 * 清除用户
 */
export function clearUser() {
  return getAnalytics().clearUser();
}

// ==================== 导出 ====================

export default {
  initAnalytics,
  getAnalytics,
  destroyAnalytics,
  track,
  trackPageView,
  trackClick,
  trackError,
  setUser,
  clearUser
};
