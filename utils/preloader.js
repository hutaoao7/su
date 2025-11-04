/**
 * 智能预加载工具
 * 
 * 功能：
 * - 基于用户行为预测下一步操作
 * - 预加载高概率访问的页面
 * - 减少页面跳转等待时间
 * 
 * 使用方法：
 * import preloader from '@/utils/preloader.js';
 * preloader.smartPreload(currentRoute);
 * 
 * @version 1.0.0
 * @date 2025-11-04
 */

class Preloader {
  constructor() {
    this.preloadQueue = [];              // 预加载队列
    this.preloadedPages = new Set();     // 已预加载的页面
    this.maxPreloadCount = 3;            // 最大预加载数量
    this.preloadDelay = 500;             // 预加载延迟（ms）
    this.enabled = true;                 // 是否启用预加载
    
    // 预加载映射表：当前页面 -> 可能访问的页面
    this.preloadMap = {
      // 首页 -> 探索功能、压力评估
      '/pages/home/home': [
        '/pages/features/features',
        '/pages-sub/assess/stress/index',
        '/pages/music/index'
      ],
      
      // 探索页面 -> 各类评估
      '/pages/features/features': [
        '/pages-sub/assess/academic/index',
        '/pages-sub/assess/stress/index',
        '/pages-sub/music/index',
        '/pages/intervene/chat'
      ],
      
      // 社区列表 -> 话题详情
      '/pages/community/index': [
        '/pages/community/detail',
        '/pages/community/publish'
      ],
      
      // 用户中心 -> 个人资料、设置
      '/pages/user/home': [
        '/pages-sub/other/profile',
        '/pages-sub/other/settings/settings',
        '/pages-sub/stress/history'
      ],
      
      // 音乐列表 -> 播放器
      '/pages/music/index': [
        '/pages-sub/music/player'
      ],
      
      // AI聊天 -> 冥想、自然音
      '/pages/intervene/chat': [
        '/pages/intervene/meditation',
        '/pages/intervene/nature'
      ],
      
      // 评估结果 -> 评估历史、AI干预
      '/pages-sub/assess/result': [
        '/pages-sub/stress/history',
        '/pages/intervene/chat'
      ]
    };
  }
  
  /**
   * 启用/禁用预加载
   * @param {Boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[PRELOADER] 预加载${enabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 预加载单个页面
   * @param {String} path - 页面路径
   * @returns {Promise}
   */
  preloadPage(path) {
    // 检查是否启用
    if (!this.enabled) {
      return Promise.resolve();
    }
    
    // 检查是否已预加载
    if (this.preloadedPages.has(path)) {
      console.log(`[PRELOADER] 页面已预加载: ${path}`);
      return Promise.resolve();
    }
    
    // 检查是否超过最大预加载数量
    if (this.preloadedPages.size >= this.maxPreloadCount) {
      console.log(`[PRELOADER] 已达最大预加载数量（${this.maxPreloadCount}），跳过: ${path}`);
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      // #ifdef H5
      // H5平台：预创建页面实例（但不显示）
      // 注：H5平台的预加载需要特殊处理，这里只是标记
      console.log(`[PRELOADER] H5平台预加载（标记）: ${path}`);
      this.preloadedPages.add(path);
      resolve();
      // #endif
      
      // #ifdef MP-WEIXIN
      // 小程序平台：使用uni.preloadPage预加载
      uni.preloadPage({
        url: path,
        success: () => {
          this.preloadedPages.add(path);
          console.log(`[PRELOADER] 预加载成功: ${path}`);
          resolve();
        },
        fail: (err) => {
          console.warn(`[PRELOADER] 预加载失败: ${path}`, err);
          resolve();
        }
      });
      // #endif
      
      // #ifdef APP-PLUS
      // App平台：使用uni.preloadPage
      uni.preloadPage({
        url: path,
        success: () => {
          this.preloadedPages.add(path);
          console.log(`[PRELOADER] 预加载成功: ${path}`);
          resolve();
        },
        fail: (err) => {
          console.warn(`[PRELOADER] 预加载失败: ${path}`, err);
          resolve();
        }
      });
      // #endif
    });
  }
  
  /**
   * 智能预加载（基于当前页面）
   * @param {String} currentPage - 当前页面路径
   */
  smartPreload(currentPage) {
    if (!this.enabled) {
      return;
    }
    
    // 规范化页面路径（去除查询参数）
    const normalizedPage = currentPage.split('?')[0];
    
    // 获取预加载目标列表
    const targets = this.preloadMap[normalizedPage] || [];
    
    if (targets.length === 0) {
      console.log(`[PRELOADER] 当前页面无预加载配置: ${normalizedPage}`);
      return;
    }
    
    console.log(`[PRELOADER] 智能预加载触发: ${normalizedPage} -> ${targets.length}个目标`);
    
    // 延迟预加载（避免影响当前页面渲染）
    setTimeout(() => {
      targets.forEach((target, index) => {
        // 分散预加载时间，避免同时加载
        setTimeout(() => {
          this.preloadPage(target);
        }, index * 200);
      });
    }, this.preloadDelay);
  }
  
  /**
   * 预加载多个页面
   * @param {Array} paths - 页面路径数组
   */
  preloadPages(paths) {
    if (!Array.isArray(paths)) {
      console.warn('[PRELOADER] preloadPages参数必须是数组');
      return;
    }
    
    paths.forEach((path, index) => {
      setTimeout(() => {
        this.preloadPage(path);
      }, index * 200);
    });
  }
  
  /**
   * 清除预加载缓存
   */
  clearCache() {
    this.preloadedPages.clear();
    this.preloadQueue = [];
    console.log('[PRELOADER] 预加载缓存已清除');
  }
  
  /**
   * 获取预加载统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      enabled: this.enabled,
      preloadedCount: this.preloadedPages.size,
      maxCount: this.maxPreloadCount,
      preloadedPages: Array.from(this.preloadedPages)
    };
  }
  
  /**
   * 手动添加预加载映射
   * @param {String} fromPage - 来源页面
   * @param {Array} toPages - 目标页面数组
   */
  addPreloadMap(fromPage, toPages) {
    if (!Array.isArray(toPages)) {
      console.warn('[PRELOADER] addPreloadMap的toPages参数必须是数组');
      return;
    }
    
    this.preloadMap[fromPage] = toPages;
    console.log(`[PRELOADER] 添加预加载映射: ${fromPage} -> ${toPages.join(', ')}`);
  }
  
  /**
   * 根据用户行为动态预加载
   * @param {Object} behavior - 用户行为数据
   */
  predictivePreload(behavior) {
    const { action, target, context } = behavior;
    
    // 基于行为类型预测下一步
    switch (action) {
      case 'hover':
        // 鼠标悬停在按钮上，可能即将点击
        if (target && target.link) {
          this.preloadPage(target.link);
        }
        break;
        
      case 'scroll':
        // 滚动到底部，可能加载更多或跳转
        if (context && context.reachedBottom) {
          // 可以预加载"加载更多"相关页面
        }
        break;
        
      case 'search':
        // 搜索操作，预加载搜索结果页
        break;
        
      default:
        break;
    }
  }
}

// 导出单例
export default new Preloader();

