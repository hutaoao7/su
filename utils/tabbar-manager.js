/**
 * 全局 TabBar 状态管理器
 * 解决多个 TabBar 实例之间状态同步问题
 */

class TabBarManager {
  constructor() {
    // 当前选中的索引
    this.currentIndex = 0;
    
    // 监听器列表（使用数组代替Set，避免小程序兼容性问题）
    this.listeners = [];
    
    // TabBar 页面路径映射到索引
    this.pathToIndex = {
      '/pages/home/home': 0,
      '/pages/features/features': 1,
      '/pages/intervene/chat': 2,
      '/pages/community/index': 3,
      '/pages/user/home': 4
    };
  }
  
  /**
   * 获取当前选中索引
   */
  getCurrentIndex() {
    return this.currentIndex;
  }
  
  /**
   * 设置当前选中索引
   * @param {number} index - 新的索引
   * @param {boolean} notify - 是否通知监听器
   */
  setCurrentIndex(index, notify = true) {
    if (this.currentIndex === index) return;
    
    this.currentIndex = index;
    
    if (notify) {
      this.notifyListeners();
    }
  }
  
  /**
   * 根据页面路径设置当前索引
   * @param {string} path - 页面路径
   */
  setCurrentIndexByPath(path) {
    const index = this.pathToIndex[path];
    if (index !== undefined) {
      this.setCurrentIndex(index);
    }
  }
  
  /**
   * 根据当前页面自动更新索引
   */
  updateFromCurrentPage() {
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      const currentPath = '/' + currentPage.route;
      this.setCurrentIndexByPath(currentPath);
    }
  }
  
  /**
   * 添加监听器
   * @param {Function} listener - 监听函数
   */
  addListener(listener) {
    // 避免重复添加
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }
  
  /**
   * 移除监听器
   * @param {Function} listener - 监听函数
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * 通知所有监听器
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentIndex);
      } catch (error) {
        console.error('[TabBarManager] Listener error:', error);
      }
    });
  }
  
  /**
   * 重置状态
   */
  reset() {
    this.currentIndex = 0;
    this.listeners = [];
  }
}

// 创建单例实例
const tabBarManager = new TabBarManager();

// 导出管理器
export default tabBarManager;

