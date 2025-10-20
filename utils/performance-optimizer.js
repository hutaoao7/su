/**
 * 性能优化工具模块
 * 提供图片懒加载、组件预加载等功能
 */

// 图片懒加载配置
const IMAGE_LAZY_CONFIG = {
  root: null,
  rootMargin: '50px 0px',
  threshold: 0.01
};

// 已加载的图片缓存
const loadedImages = new Set();

/**
 * 图片懒加载类
 */
class ImageLazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }
  
  init() {
    // 检查是否支持IntersectionObserver
    // #ifdef H5
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
          }
        });
      }, IMAGE_LAZY_CONFIG);
    }
    // #endif
    
    // 小程序使用uni的API
    // #ifdef MP-WEIXIN
    // 小程序环境下可以使用 uni.createIntersectionObserver
    // #endif
  }
  
  /**
   * 加载图片
   */
  loadImage(element) {
    const src = element.dataset.src;
    if (!src || loadedImages.has(src)) return;
    
    // 创建图片对象预加载
    const img = new Image();
    img.onload = () => {
      element.src = src;
      element.classList.add('lazy-loaded');
      loadedImages.add(src);
      
      // 停止观察已加载的图片
      if (this.observer) {
        this.observer.unobserve(element);
      }
    };
    
    img.onerror = () => {
      console.error('[Performance] 图片加载失败:', src);
      element.classList.add('lazy-error');
    };
    
    img.src = src;
  }
  
  /**
   * 观察图片元素
   */
  observe(element) {
    if (this.observer && element.dataset.src) {
      this.observer.observe(element);
    } else {
      // 不支持IntersectionObserver时直接加载
      this.loadImage(element);
    }
  }
  
  /**
   * 停止观察
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// 单例实例
let lazyLoaderInstance = null;

/**
 * 获取懒加载实例
 */
export function getLazyLoader() {
  if (!lazyLoaderInstance) {
    lazyLoaderInstance = new ImageLazyLoader();
  }
  return lazyLoaderInstance;
}

/**
 * 组件预加载管理
 */
const componentCache = new Map();

/**
 * 预加载组件
 * @param {string} componentPath - 组件路径
 * @returns {Promise}
 */
export function preloadComponent(componentPath) {
  if (componentCache.has(componentPath)) {
    return Promise.resolve(componentCache.get(componentPath));
  }
  
  return new Promise((resolve, reject) => {
    // 小程序环境的组件加载
    // #ifdef MP-WEIXIN
    const component = require(componentPath);
    componentCache.set(componentPath, component);
    resolve(component);
    // #endif
    
    // H5环境的动态导入
    // #ifdef H5
    import(componentPath)
      .then(module => {
        componentCache.set(componentPath, module.default || module);
        resolve(module.default || module);
      })
      .catch(reject);
    // #endif
  });
}

/**
 * 性能监控
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: [],
      apiCall: [],
      imageLoad: []
    };
  }
  
  /**
   * 记录页面加载时间
   */
  recordPageLoad(pageName, duration) {
    this.metrics.pageLoad.push({
      page: pageName,
      duration: duration,
      timestamp: Date.now()
    });
    
    console.log(`[Performance] 页面加载: ${pageName} - ${duration}ms`);
  }
  
  /**
   * 记录API调用时间
   */
  recordApiCall(apiName, duration) {
    this.metrics.apiCall.push({
      api: apiName,
      duration: duration,
      timestamp: Date.now()
    });
    
    if (duration > 1000) {
      console.warn(`[Performance] API响应慢: ${apiName} - ${duration}ms`);
    }
  }
  
  /**
   * 获取性能报告
   */
  getReport() {
    const report = {
      pageLoad: {
        average: this.getAverage(this.metrics.pageLoad, 'duration'),
        max: this.getMax(this.metrics.pageLoad, 'duration'),
        count: this.metrics.pageLoad.length
      },
      apiCall: {
        average: this.getAverage(this.metrics.apiCall, 'duration'),
        max: this.getMax(this.metrics.apiCall, 'duration'),
        count: this.metrics.apiCall.length
      }
    };
    
    return report;
  }
  
  getAverage(arr, key) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((acc, item) => acc + item[key], 0);
    return Math.round(sum / arr.length);
  }
  
  getMax(arr, key) {
    if (arr.length === 0) return 0;
    return Math.max(...arr.map(item => item[key]));
  }
}

// 性能监控实例
export const performanceMonitor = new PerformanceMonitor();

/**
 * 防抖函数
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 初始化性能优化
 */
export function initPerformanceOptimization() {
  console.log('[Performance] 性能优化模块初始化');
  
  // 监听页面显示
  uni.$on('page-show', (pageName) => {
    const startTime = Date.now();
    setTimeout(() => {
      const duration = Date.now() - startTime;
      performanceMonitor.recordPageLoad(pageName, duration);
    }, 0);
  });
  
  // 拦截网络请求进行性能监控
  const originalRequest = uni.request;
  uni.request = function(options) {
    const startTime = Date.now();
    const originalSuccess = options.success;
    const originalFail = options.fail;
    
    options.success = function(res) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordApiCall(options.url, duration);
      if (originalSuccess) originalSuccess(res);
    };
    
    options.fail = function(err) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordApiCall(options.url, duration);
      if (originalFail) originalFail(err);
    };
    
    return originalRequest.call(this, options);
  };
}

export default {
  getLazyLoader,
  preloadComponent,
  performanceMonitor,
  debounce,
  throttle,
  initPerformanceOptimization
};
