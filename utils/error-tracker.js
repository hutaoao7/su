/**
 * 错误追踪器 - 全局异常捕获
 * 
 * 功能：
 * 1. Vue错误捕获
 * 2. Promise rejection捕获
 * 3. 错误堆栈收集
 * 4. 用户操作轨迹
 * 5. 错误去重
 * 6. 错误上报队列
 */

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.errorQueue = [];
    this.maxErrors = 100;
    this.maxQueueSize = 50;
    this.errorHashes = new Set();
    this.userActions = [];
    this.maxActions = 20;
    this.isReporting = false;
  }

  /**
   * 初始化错误追踪
   */
  init(Vue) {
    // 捕获Vue错误
    Vue.config.errorHandler = (error, vm, info) => {
      this.captureError({
        type: 'vue',
        error,
        message: error.message,
        stack: error.stack,
        componentName: vm.$options.name || 'Unknown',
        info,
        timestamp: Date.now()
      });
    };

    // 捕获Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        error: event.reason,
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'global',
        error: event.error,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    console.log('✅ 错误追踪器已初始化');
  }

  /**
   * 捕获错误
   */
  captureError(errorInfo) {
    try {
      // 生成错误哈希用于去重
      const hash = this.generateErrorHash(errorInfo);
      
      // 检查是否重复
      if (this.errorHashes.has(hash)) {
        console.log('⏭️ 错误已去重，跳过');
        return;
      }

      // 添加到错误列表
      this.errors.push(errorInfo);
      this.errorHashes.add(hash);

      // 保持错误列表大小
      if (this.errors.length > this.maxErrors) {
        const removed = this.errors.shift();
        this.errorHashes.delete(this.generateErrorHash(removed));
      }

      // 添加到上报队列
      this.addToQueue(errorInfo);

      console.error('❌ 捕获到错误:', errorInfo);

      // 立即上报
      this.reportErrors();
    } catch (error) {
      console.error('❌ 错误捕获失败:', error);
    }
  }

  /**
   * 生成错误哈希
   */
  generateErrorHash(errorInfo) {
    const key = `${errorInfo.type}_${errorInfo.message}_${errorInfo.stack?.split('\n')[0]}`;
    return this.simpleHash(key);
  }

  /**
   * 简单哈希函数
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(36);
  }

  /**
   * 添加到上报队列
   */
  addToQueue(errorInfo) {
    this.errorQueue.push({
      ...errorInfo,
      userActions: [...this.userActions],
      deviceInfo: this.getDeviceInfo(),
      userInfo: this.getUserInfo()
    });

    // 保持队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * 记录用户操作
   */
  trackUserAction(action, data = {}) {
    this.userActions.push({
      action,
      data,
      timestamp: Date.now()
    });

    // 保持操作列表大小
    if (this.userActions.length > this.maxActions) {
      this.userActions.shift();
    }

    console.log(`📍 用户操作: ${action}`);
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * 获取用户信息
   */
  getUserInfo() {
    // 从本地存储获取用户信息
    try {
      const userStr = uni.getStorageSync('user_info');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          userId: user.id,
          username: user.username
        };
      }
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error);
    }
    return { userId: 'unknown', username: 'unknown' };
  }

  /**
   * 上报错误
   */
  async reportErrors() {
    if (this.isReporting || this.errorQueue.length === 0) {
      return;
    }

    this.isReporting = true;

    try {
      const errors = [...this.errorQueue];
      this.errorQueue = [];

      console.log(`📤 上报${errors.length}个错误`);

      // 调用云函数上报错误
      const result = await uni.callFunction({
        name: 'error-report',
        data: {
          errors,
          timestamp: Date.now()
        }
      });

      if (result.result.errCode === 0) {
        console.log('✅ 错误上报成功');
      } else {
        console.error('❌ 错误上报失败:', result.result.errMsg);
        // 重新加入队列
        this.errorQueue.unshift(...errors);
      }
    } catch (error) {
      console.error('❌ 错误上报异常:', error);
      // 重新加入队列
      this.errorQueue.unshift(...errors);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errors.length,
      queuedErrors: this.errorQueue.length,
      errorsByType: {},
      recentErrors: this.errors.slice(-10)
    };

    // 按类型统计
    this.errors.forEach(error => {
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * 清空错误列表
   */
  clearErrors() {
    this.errors = [];
    this.errorQueue = [];
    this.errorHashes.clear();
    console.log('✅ 错误列表已清空');
  }

  /**
   * 清空用户操作
   */
  clearUserActions() {
    this.userActions = [];
    console.log('✅ 用户操作已清空');
  }

  /**
   * 导出错误日志
   */
  exportErrorLogs() {
    return {
      errors: this.errors,
      stats: this.getErrorStats(),
      exportTime: new Date().toISOString()
    };
  }

  /**
   * 销毁追踪器
   */
  destroy() {
    this.clearErrors();
    this.clearUserActions();
    console.log('✅ 错误追踪器已销毁');
  }
}

// 导出单例
export default new ErrorTracker();

