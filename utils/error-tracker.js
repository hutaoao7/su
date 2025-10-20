/**
 * 全局错误追踪工具
 * 
 * 功能：
 * 1. 捕获Vue组件错误
 * 2. 捕获Promise未处理的rejection
 * 3. 捕获全局JavaScript错误
 * 4. 收集错误堆栈和上下文
 * 5. 错误去重和聚合
 * 6. 批量上报错误
 * 7. 用户操作轨迹追踪
 * 
 * @author CraneHeart Team
 * @date 2025-10-21
 */

/**
 * 错误类型枚举
 */
const ErrorType = {
  VUE_ERROR: 'vue_error',           // Vue组件错误
  PROMISE_REJECTION: 'promise_rejection', // Promise rejection
  JS_ERROR: 'js_error',             // JavaScript错误
  RESOURCE_ERROR: 'resource_error', // 资源加载错误
  API_ERROR: 'api_error',           // API请求错误
  CUSTOM_ERROR: 'custom_error'      // 自定义错误
};

/**
 * 错误级别枚举
 */
const ErrorLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'fatal'
};

/**
 * 错误追踪器类
 */
class ErrorTracker {
  constructor() {
    this.errors = [];              // 错误队列
    this.breadcrumbs = [];         // 用户操作轨迹
    this.maxErrors = 50;           // 最大错误数
    this.maxBreadcrumbs = 30;      // 最大操作记录数
    this.reportInterval = null;     // 上报定时器
    this.isReporting = false;      // 是否正在上报
    this.errorFingerprints = new Set(); // 错误指纹集合（去重）
    
    // 配置
    this.config = {
      enabled: true,              // 是否启用
      sampleRate: 1.0,           // 采样率（0-1）
      reportUrl: '',             // 上报URL（云函数）
      autoReport: true,          // 自动上报
      reportInterval: 10000,     // 上报间隔（毫秒）
      maxQueueSize: 50,          // 最大队列大小
      includeContext: true       // 包含上下文信息
    };
  }
  
  /**
   * 初始化错误追踪
   */
  init(options = {}) {
    // 合并配置
    this.config = { ...this.config, ...options };
    
    if (!this.config.enabled) {
      console.log('[ErrorTracker] 错误追踪已禁用');
      return;
    }
    
    console.log('[ErrorTracker] 初始化错误追踪');
    
    // 设置Vue错误处理器
    this.setupVueErrorHandler();
    
    // 设置Promise rejection处理器
    this.setupPromiseRejectionHandler();
    
    // 设置全局错误处理器（H5）
    this.setupGlobalErrorHandler();
    
    // 启动自动上报
    if (this.config.autoReport) {
      this.startAutoReport();
    }
    
    // 监听页面隐藏，上报错误
    uni.onAppHide(() => {
      this.report();
    });
  }
  
  /**
   * 设置Vue错误处理器
   */
  setupVueErrorHandler() {
    // Vue 2的全局错误处理
    if (typeof Vue !== 'undefined') {
      Vue.config.errorHandler = (err, vm, info) => {
        this.captureVueError(err, vm, info);
      };
      
      // Vue 2的警告处理
      Vue.config.warnHandler = (msg, vm, trace) => {
        this.captureVueWarning(msg, vm, trace);
      };
    }
  }
  
  /**
   * 设置Promise rejection处理器
   */
  setupPromiseRejectionHandler() {
    // #ifdef H5
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.capturePromiseRejection(event.reason, event);
      });
    }
    // #endif
    
    // 小程序环境：拦截uni.request等方法
    this.interceptUniAPIs();
  }
  
  /**
   * 设置全局错误处理器（H5）
   */
  setupGlobalErrorHandler() {
    // #ifdef H5
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (event.error) {
          this.captureError(event.error, {
            type: ErrorType.JS_ERROR,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          });
        } else if (event.target && event.target.src) {
          // 资源加载错误
          this.captureError(new Error(`Resource load error: ${event.target.src}`), {
            type: ErrorType.RESOURCE_ERROR,
            src: event.target.src
          });
        }
      }, true);
    }
    // #endif
  }
  
  /**
   * 拦截uni API
   */
  interceptUniAPIs() {
    // 拦截uni.request
    const originalRequest = uni.request;
    uni.request = (options) => {
      const originalFail = options.fail;
      
      options.fail = (error) => {
        // 记录API错误
        this.captureError(new Error(`API请求失败: ${options.url}`), {
          type: ErrorType.API_ERROR,
          url: options.url,
          method: options.method || 'GET',
          statusCode: error.statusCode,
          errMsg: error.errMsg
        });
        
        // 调用原始fail回调
        if (originalFail) {
          originalFail(error);
        }
      };
      
      return originalRequest(options);
    };
  }
  
  /**
   * 捕获Vue错误
   */
  captureVueError(err, vm, info) {
    const componentName = vm?.$options?.name || vm?.$options?._componentTag || 'Unknown';
    
    this.captureError(err, {
      type: ErrorType.VUE_ERROR,
      level: ErrorLevel.ERROR,
      component: componentName,
      lifecycle: info,
      props: vm?.$props,
      data: vm?.$data
    });
  }
  
  /**
   * 捕获Vue警告
   */
  captureVueWarning(msg, vm, trace) {
    const componentName = vm?.$options?.name || vm?.$options?._componentTag || 'Unknown';
    
    this.captureError(new Error(msg), {
      type: ErrorType.VUE_ERROR,
      level: ErrorLevel.WARNING,
      component: componentName,
      trace: trace
    });
  }
  
  /**
   * 捕获Promise rejection
   */
  capturePromiseRejection(reason, event) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    this.captureError(error, {
      type: ErrorType.PROMISE_REJECTION,
      level: ErrorLevel.ERROR,
      promise: event?.promise
    });
  }
  
  /**
   * 捕获错误（核心方法）
   */
  captureError(error, context = {}) {
    if (!this.config.enabled) return;
    
    // 采样
    if (Math.random() > this.config.sampleRate) {
      return;
    }
    
    try {
      // 构建错误对象
      const errorObj = {
        id: this.generateErrorId(),
        timestamp: Date.now(),
        type: context.type || ErrorType.JS_ERROR,
        level: context.level || ErrorLevel.ERROR,
        message: error.message || String(error),
        stack: error.stack || '',
        context: this.config.includeContext ? {
          ...context,
          page: this.getCurrentPage(),
          route: this.getCurrentRoute(),
          userAgent: this.getUserAgent(),
          platform: this.getPlatform(),
          systemInfo: this.getSystemInfo()
        } : {},
        breadcrumbs: [...this.breadcrumbs], // 操作轨迹
        fingerprint: this.generateFingerprint(error, context)
      };
      
      // 去重检查
      if (this.errorFingerprints.has(errorObj.fingerprint)) {
        console.log('[ErrorTracker] 重复错误，已忽略:', errorObj.message);
        return;
      }
      
      // 添加到错误队列
      this.errors.push(errorObj);
      this.errorFingerprints.add(errorObj.fingerprint);
      
      // 限制队列大小
      if (this.errors.length > this.config.maxQueueSize) {
        this.errors.shift();
      }
      
      // 输出到控制台
      console.error('[ErrorTracker] 捕获错误:', errorObj);
      
      // 如果是致命错误，立即上报
      if (errorObj.level === ErrorLevel.FATAL) {
        this.report();
      }
      
    } catch (e) {
      console.error('[ErrorTracker] 捕获错误时发生异常:', e);
    }
  }
  
  /**
   * 添加用户操作轨迹
   */
  addBreadcrumb(category, message, data = {}) {
    const breadcrumb = {
      timestamp: Date.now(),
      category,
      message,
      data
    };
    
    this.breadcrumbs.push(breadcrumb);
    
    // 限制轨迹数量
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }
  
  /**
   * 生成错误ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 生成错误指纹（用于去重）
   */
  generateFingerprint(error, context) {
    const parts = [
      context.type || '',
      error.message || '',
      error.stack ? error.stack.split('\n')[0] : ''
    ];
    
    return parts.join('|');
  }
  
  /**
   * 获取当前页面
   */
  getCurrentPage() {
    try {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        return currentPage.route || currentPage.__route__ || '';
      }
    } catch (e) {
      // ignore
    }
    return 'unknown';
  }
  
  /**
   * 获取当前路由
   */
  getCurrentRoute() {
    try {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        return {
          path: currentPage.route || currentPage.__route__ || '',
          options: currentPage.options || {}
        };
      }
    } catch (e) {
      // ignore
    }
    return null;
  }
  
  /**
   * 获取UserAgent
   */
  getUserAgent() {
    // #ifdef H5
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    // #endif
    
    return 'uni-app';
  }
  
  /**
   * 获取平台信息
   */
  getPlatform() {
    // #ifdef H5
    return 'H5';
    // #endif
    
    // #ifdef MP-WEIXIN
    return 'WeChat';
    // #endif
    
    // #ifdef APP-PLUS
    return 'App';
    // #endif
    
    return 'unknown';
  }
  
  /**
   * 获取系统信息
   */
  getSystemInfo() {
    try {
      return uni.getSystemInfoSync();
    } catch (e) {
      return {};
    }
  }
  
  /**
   * 启动自动上报
   */
  startAutoReport() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    
    this.reportInterval = setInterval(() => {
      if (this.errors.length > 0) {
        this.report();
      }
    }, this.config.reportInterval);
  }
  
  /**
   * 停止自动上报
   */
  stopAutoReport() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }
  
  /**
   * 上报错误
   */
  async report() {
    if (!this.config.enabled || this.isReporting || this.errors.length === 0) {
      return;
    }
    
    this.isReporting = true;
    
    try {
      console.log(`[ErrorTracker] 开始上报${this.errors.length}个错误`);
      
      // 取出所有错误
      const errorsToReport = [...this.errors];
      this.errors = [];
      this.errorFingerprints.clear();
      
      // 调用云函数上报
      const result = await uniCloud.callFunction({
        name: 'error-report',
        data: {
          errors: errorsToReport,
          timestamp: Date.now()
        }
      });
      
      if (result.result && result.result.code === 0) {
        console.log('[ErrorTracker] 错误上报成功');
      } else {
        console.error('[ErrorTracker] 错误上报失败:', result.result);
        
        // 上报失败，放回队列
        this.errors.unshift(...errorsToReport);
      }
      
    } catch (e) {
      console.error('[ErrorTracker] 错误上报异常:', e);
    } finally {
      this.isReporting = false;
    }
  }
  
  /**
   * 手动记录错误
   */
  logError(message, context = {}) {
    this.captureError(new Error(message), {
      ...context,
      type: ErrorType.CUSTOM_ERROR
    });
  }
  
  /**
   * 获取错误列表
   */
  getErrors() {
    return this.errors;
  }
  
  /**
   * 清空错误队列
   */
  clearErrors() {
    this.errors = [];
    this.errorFingerprints.clear();
  }
  
  /**
   * 获取操作轨迹
   */
  getBreadcrumbs() {
    return this.breadcrumbs;
  }
  
  /**
   * 清空操作轨迹
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }
  
  /**
   * 设置配置
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取配置
   */
  getConfig() {
    return this.config;
  }
}

// 导出单例
const errorTracker = new ErrorTracker();

export default errorTracker;
export { ErrorType, ErrorLevel };

