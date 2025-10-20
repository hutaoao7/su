/**
 * 加载状态管理器
 * 统一管理应用中的加载状态
 */

class LoadingManager {
  constructor() {
    this.loadingStack = [];
    this.globalLoadingVisible = false;
  }
  
  /**
   * 显示加载状态
   * @param {Object} options - 配置选项
   * @param {String} options.text - 加载提示文字
   * @param {Boolean} options.mask - 是否显示遮罩
   * @param {Number} options.timeout - 超时时间（毫秒）
   * @param {String} options.type - 加载类型：global/local/toast
   */
  show(options = {}) {
    const config = {
      text: '加载中...',
      mask: true,
      timeout: 10000,
      type: 'toast',
      ...options
    };
    
    // 添加到栈中
    const loadingId = Date.now();
    this.loadingStack.push({
      id: loadingId,
      config: config,
      startTime: Date.now()
    });
    
    // 根据类型显示不同的加载状态
    switch (config.type) {
      case 'global':
        this.showGlobalLoading(config);
        break;
      case 'toast':
        this.showToastLoading(config);
        break;
      case 'local':
        // 局部加载由组件自己处理
        break;
    }
    
    // 设置超时
    if (config.timeout > 0) {
      setTimeout(() => {
        this.hide(loadingId);
      }, config.timeout);
    }
    
    return loadingId;
  }
  
  /**
   * 隐藏加载状态
   * @param {Number} loadingId - 加载ID（可选）
   */
  hide(loadingId) {
    if (loadingId) {
      // 移除特定的加载状态
      const index = this.loadingStack.findIndex(item => item.id === loadingId);
      if (index !== -1) {
        this.loadingStack.splice(index, 1);
      }
    } else {
      // 移除最后一个加载状态
      this.loadingStack.pop();
    }
    
    // 如果没有加载状态了，隐藏所有加载UI
    if (this.loadingStack.length === 0) {
      this.hideAllLoading();
    }
  }
  
  /**
   * 清空所有加载状态
   */
  clear() {
    this.loadingStack = [];
    this.hideAllLoading();
  }
  
  /**
   * 显示全局加载
   */
  showGlobalLoading(config) {
    uni.$emit('showLoading', config);
    this.globalLoadingVisible = true;
  }
  
  /**
   * 显示Toast加载
   */
  showToastLoading(config) {
    uni.showLoading({
      title: config.text,
      mask: config.mask
    });
  }
  
  /**
   * 隐藏所有加载UI
   */
  hideAllLoading() {
    uni.hideLoading();
    uni.$emit('hideLoading');
    this.globalLoadingVisible = false;
  }
  
  /**
   * 获取当前加载状态
   */
  getStatus() {
    return {
      isLoading: this.loadingStack.length > 0,
      count: this.loadingStack.length,
      current: this.loadingStack[this.loadingStack.length - 1] || null
    };
  }
}

// 创建单例实例
const loadingManager = new LoadingManager();

/**
 * 包装异步函数，自动处理加载状态
 * @param {Function} fn - 异步函数
 * @param {Object} options - 加载选项
 */
export function withLoading(fn, options = {}) {
  return async function(...args) {
    const loadingId = loadingManager.show(options);
    
    try {
      const result = await fn.apply(this, args);
      loadingManager.hide(loadingId);
      return result;
    } catch (error) {
      loadingManager.hide(loadingId);
      throw error;
    }
  };
}

/**
 * 装饰器：自动添加加载状态
 * 用法：@loading({ text: '提交中...' })
 */
export function loading(options = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const loadingId = loadingManager.show(options);
      
      try {
        const result = await originalMethod.apply(this, args);
        loadingManager.hide(loadingId);
        return result;
      } catch (error) {
        loadingManager.hide(loadingId);
        throw error;
      }
    };
    
    return descriptor;
  };
}

// 导出管理器实例
export default loadingManager;
