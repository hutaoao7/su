/**
 * 路由修复工具
 * 专门处理可能导致白屏的路由问题
 */

class RouteFix {
  constructor() {
    this.routeHistory = [];
    this.maxHistoryLength = 10;
    this.retryAttempts = new Map();
    this.maxRetryAttempts = 3;
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * 初始化路由修复系统
   */
  init() {
    console.log('[路由修复] 初始化路由修复系统...');
    
    // 1. 修复路由守卫
    this.fixRouteGuard();
    
    // 2. 增强路由方法
    this.enhanceRouteMethods();
    
    // 3. 监听页面生命周期
    this.setupPageLifecycleMonitoring();
    
    // 4. 设置路由错误恢复
    this.setupRouteErrorRecovery();
    
    console.log('[路由修复] 路由修复系统初始化完成');
  }

  /**
   * 修复路由守卫问题
   */
  fixRouteGuard() {
    // 保存原始方法
    const originalMethods = {
      navigateTo: uni.navigateTo,
      switchTab: uni.switchTab,
      reLaunch: uni.reLaunch,
      redirectTo: uni.redirectTo,
      navigateBack: uni.navigateBack
    };

    // 重写路由方法，添加错误处理和白屏检测
    Object.keys(originalMethods).forEach(methodName => {
      uni[methodName] = (options) => {
        return this.safeRouteNavigation(methodName, options, originalMethods[methodName]);
      };
    });
  }

  /**
   * 安全的路由导航
   */
  async safeRouteNavigation(methodName, options, originalMethod) {
    try {
      // 标准化参数
      if (typeof options === 'string') {
        options = { url: options };
      }

      const url = options.url;
      const routeKey = `${methodName}:${url}`;

      // 检查重试次数
      const retryCount = this.retryAttempts.get(routeKey) || 0;
      if (retryCount >= this.maxRetryAttempts) {
        console.error(`[路由修复] ${methodName} 重试次数超限:`, url);
        this.handleRouteFailure(methodName, options, new Error('重试次数超限'));
        return Promise.reject(new Error('路由重试次数超限'));
      }

      // 记录路由历史
      this.recordRouteHistory(methodName, url);

      // 预检查路由
      const preCheckResult = await this.preCheckRoute(methodName, url);
      if (!preCheckResult.success) {
        console.warn(`[路由修复] 路由预检查失败:`, preCheckResult.reason);
        return this.handleRoutePreCheckFailure(methodName, options, preCheckResult);
      }

      // 增强选项
      const enhancedOptions = this.enhanceRouteOptions(methodName, options);

      // 执行路由导航
      return new Promise((resolve, reject) => {
        const originalSuccess = enhancedOptions.success;
        const originalFail = enhancedOptions.fail;

        enhancedOptions.success = (res) => {
          console.log(`[路由修复] ${methodName} 成功:`, url);
          this.retryAttempts.delete(routeKey);
          this.onRouteSuccess(methodName, url);
          if (originalSuccess) originalSuccess(res);
          resolve(res);
        };

        enhancedOptions.fail = (err) => {
          console.error(`[路由修复] ${methodName} 失败:`, url, err);
          this.retryAttempts.set(routeKey, retryCount + 1);
          this.handleRouteFailure(methodName, options, err);
          if (originalFail) originalFail(err);
          reject(err);
        };

        // 调用原始方法
        originalMethod.call(uni, enhancedOptions);
      });

    } catch (error) {
      console.error(`[路由修复] ${methodName} 异常:`, error);
      this.handleRouteFailure(methodName, options, error);
      return Promise.reject(error);
    }
  }

  /**
   * 路由预检查
   */
  async preCheckRoute(methodName, url) {
    try {
      // 1. 检查URL格式
      if (!url || typeof url !== 'string') {
        return { success: false, reason: 'URL格式无效' };
      }

      // 2. 检查页面是否存在于pages.json中
      const pagePath = url.split('?')[0].replace(/^\//, '');
      if (!this.isValidPagePath(pagePath)) {
        return { success: false, reason: '页面路径不存在' };
      }

      // 3. 检查tabBar页面的路由方法
      if (this.isTabBarPage(pagePath) && methodName !== 'switchTab') {
        console.warn(`[路由修复] tabBar页面应使用switchTab: ${pagePath}`);
        return { success: false, reason: 'tabBar页面路由方法错误', suggestedMethod: 'switchTab' };
      }

      // 4. 检查非tabBar页面使用switchTab
      if (!this.isTabBarPage(pagePath) && methodName === 'switchTab') {
        console.warn(`[路由修复] 非tabBar页面不能使用switchTab: ${pagePath}`);
        return { success: false, reason: '非tabBar页面路由方法错误', suggestedMethod: 'navigateTo' };
      }

      // 5. 检查页面栈深度
      if (methodName === 'navigateTo') {
        const pages = getCurrentPages();
        if (pages.length >= 10) {
          console.warn(`[路由修复] 页面栈深度过深，建议使用redirectTo`);
          return { success: false, reason: '页面栈深度过深', suggestedMethod: 'redirectTo' };
        }
      }

      return { success: true };

    } catch (error) {
      console.error('[路由修复] 路由预检查异常:', error);
      return { success: false, reason: '预检查异常' };
    }
  }

  /**
   * 检查页面路径是否有效
   */
  isValidPagePath(pagePath) {
    // 这里应该检查pages.json中的页面配置
    // 简化实现，检查常见页面
    const validPages = [
      'pages/home/home',
      'pages/index/index',
      'pages/features/features',
      'pages/settings/settings',
      'pages/auth/login',
      'pages/auth/register',
      'pages/auth/role',
      'pages/user/home',
      'pages/user/profile',
      'pages/stress/index',
      'pages/stress/history',
      'pages/community/index',
      'pages/intervene/intervene',
      'pages/intervene/chat',
      'pages/intervene/meditation',
      'pages/intervene/nature',
      'pages/music/index',
      'pages/music/player',
      'pages/admin/metrics',
      'pages/cdk/redeem',
      'pages/cdk/admin-batch'
    ];

    return validPages.includes(pagePath);
  }

  /**
   * 检查是否为tabBar页面
   */
  isTabBarPage(pagePath) {
    const tabBarPages = [
      'pages/home/home',
      'pages/features/features',
      'pages/settings/settings'
    ];
    return tabBarPages.includes(pagePath);
  }

  /**
   * 增强路由选项
   */
  enhanceRouteOptions(methodName, options) {
    const enhanced = { ...options };

    // 添加超时处理
    if (!enhanced.timeout) {
      enhanced.timeout = 10000; // 10秒超时
    }

    // 添加动画配置
    if (methodName === 'navigateTo' && !enhanced.animationType) {
      enhanced.animationType = 'slide-in-right';
      enhanced.animationDuration = 300;
    }

    return enhanced;
  }

  /**
   * 处理路由预检查失败
   */
  handleRoutePreCheckFailure(methodName, options, preCheckResult) {
    const { reason, suggestedMethod } = preCheckResult;

    // 如果有建议的方法，尝试使用建议的方法
    if (suggestedMethod) {
      console.log(`[路由修复] 尝试使用建议的路由方法: ${suggestedMethod}`);
      return uni[suggestedMethod](options);
    }

    // 根据失败原因采取不同的处理策略
    switch (reason) {
      case '页面路径不存在':
        return this.handleInvalidPagePath(options.url);
      
      case 'tabBar页面路由方法错误':
        return uni.switchTab({ url: options.url });
      
      case '非tabBar页面路由方法错误':
        return uni.navigateTo(options);
      
      case '页面栈深度过深':
        return uni.redirectTo(options);
      
      default:
        return Promise.reject(new Error(reason));
    }
  }

  /**
   * 处理无效页面路径
   */
  handleInvalidPagePath(url) {
    console.error('[路由修复] 页面路径无效，跳转到首页:', url);
    
    // 显示错误提示
    uni.showToast({
      title: '页面不存在',
      icon: 'none',
      duration: 2000
    });

    // 跳转到首页
    return uni.switchTab({
      url: '/pages/home/home',
      fail: () => {
        // 如果首页也失败，尝试重启应用
        uni.reLaunch({
          url: '/pages/home/home'
        });
      }
    });
  }

  /**
   * 记录路由历史
   */
  recordRouteHistory(methodName, url) {
    const record = {
      method: methodName,
      url: url,
      timestamp: Date.now()
    };

    this.routeHistory.push(record);

    // 保持历史记录长度
    if (this.routeHistory.length > this.maxHistoryLength) {
      this.routeHistory.shift();
    }

    if (this.debugMode) {
      console.log('[路由修复] 路由历史:', this.routeHistory);
    }
  }

  /**
   * 路由成功回调
   */
  onRouteSuccess(methodName, url) {
    // 延迟检查页面渲染状态
    setTimeout(() => {
      this.checkPageRenderStatus(url);
    }, 500);
  }

  /**
   * 检查页面渲染状态
   */
  checkPageRenderStatus(url) {
    try {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];

      if (!currentPage) {
        console.error('[路由修复] 路由成功但无法获取当前页面');
        this.handlePageRenderFailure(url, '无法获取当前页面');
        return;
      }

      // 检查页面是否正常渲染
      if (this.isPageWhiteScreen(currentPage)) {
        console.error('[路由修复] 检测到页面白屏');
        this.handlePageRenderFailure(url, '页面白屏');
      }

    } catch (error) {
      console.error('[路由修复] 检查页面渲染状态异常:', error);
    }
  }

  /**
   * 判断页面是否白屏
   */
  isPageWhiteScreen(page) {
    // 简单的白屏检测逻辑
    // 实际项目中可以根据具体情况调整
    
    // 检查页面数据
    if (!page.data || Object.keys(page.data).length === 0) {
      return true;
    }

    // 检查页面是否有onLoad方法被调用
    if (!page._isLoaded) {
      return true;
    }

    return false;
  }

  /**
   * 处理页面渲染失败
   */
  handlePageRenderFailure(url, reason) {
    console.error(`[路由修复] 页面渲染失败: ${reason}, URL: ${url}`);

    // 尝试重新加载页面
    setTimeout(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];

      if (currentPage && currentPage.onLoad) {
        console.log('[路由修复] 尝试重新加载页面');
        currentPage.onLoad(currentPage.options || {});
      } else {
        // 如果无法重新加载，跳转到安全页面
        this.navigateToSafePage();
      }
    }, 1000);
  }

  /**
   * 处理路由失败
   */
  handleRouteFailure(methodName, options, error) {
    console.error(`[路由修复] 路由失败处理: ${methodName}`, options, error);

    // 根据错误类型采取不同的恢复策略
    const errorMessage = error.message || error.toString();

    if (errorMessage.includes('页面不存在') || errorMessage.includes('not found')) {
      this.handleInvalidPagePath(options.url);
    } else if (errorMessage.includes('tabBar')) {
      // tabBar相关错误
      this.handleTabBarError(options);
    } else {
      // 通用错误处理
      this.handleGenericRouteError(methodName, options, error);
    }
  }

  /**
   * 处理tabBar错误
   */
  handleTabBarError(options) {
    console.log('[路由修复] 处理tabBar错误');
    
    const url = options.url;
    const pagePath = url.split('?')[0].replace(/^\//, '');

    if (this.isTabBarPage(pagePath)) {
      // 使用switchTab重试
      uni.switchTab({
        url: url,
        fail: () => {
          this.navigateToSafePage();
        }
      });
    } else {
      // 使用navigateTo重试
      uni.navigateTo({
        url: url,
        fail: () => {
          this.navigateToSafePage();
        }
      });
    }
  }

  /**
   * 处理通用路由错误
   */
  handleGenericRouteError(methodName, options, error) {
    console.log('[路由修复] 处理通用路由错误');

    // 显示错误提示
    uni.showToast({
      title: '页面跳转失败',
      icon: 'none',
      duration: 2000
    });

    // 延迟跳转到安全页面
    setTimeout(() => {
      this.navigateToSafePage();
    }, 2000);
  }

  /**
   * 跳转到安全页面
   */
  navigateToSafePage() {
    console.log('[路由修复] 跳转到安全页面');

    // 尝试跳转到首页
    uni.switchTab({
      url: '/pages/home/home',
      fail: () => {
        // 如果首页失败，尝试重启应用
        uni.reLaunch({
          url: '/pages/home/home',
          fail: () => {
            // 最后的兜底方案
            uni.showModal({
              title: '应用异常',
              content: '应用出现异常，请重启应用',
              showCancel: false,
              confirmText: '确定'
            });
          }
        });
      }
    });
  }

  /**
   * 增强路由方法
   */
  enhanceRouteMethods() {
    // 添加批量路由方法
    uni.batchNavigate = this.batchNavigate.bind(this);
    
    // 添加安全导航方法
    uni.safeNavigate = this.safeNavigate.bind(this);
    
    // 添加智能导航方法
    uni.smartNavigate = this.smartNavigate.bind(this);
  }

  /**
   * 批量路由导航
   */
  async batchNavigate(routes) {
    const results = [];
    
    for (const route of routes) {
      try {
        const result = await uni[route.method](route.options);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error });
      }
    }
    
    return results;
  }

  /**
   * 安全导航
   */
  async safeNavigate(url, method = 'navigateTo') {
    try {
      return await uni[method]({ url });
    } catch (error) {
      console.error('[路由修复] 安全导航失败:', error);
      return this.navigateToSafePage();
    }
  }

  /**
   * 智能导航（自动选择最佳路由方法）
   */
  async smartNavigate(url) {
    const pagePath = url.split('?')[0].replace(/^\//, '');
    
    if (this.isTabBarPage(pagePath)) {
      return uni.switchTab({ url });
    } else {
      const pages = getCurrentPages();
      if (pages.length >= 8) {
        return uni.redirectTo({ url });
      } else {
        return uni.navigateTo({ url });
      }
    }
  }

  /**
   * 设置页面生命周期监听
   */
  setupPageLifecycleMonitoring() {
    // 监听页面显示
    const originalOnShow = Page.prototype.onShow;
    Page.prototype.onShow = function() {
      console.log('[路由修复] 页面显示:', this.route);
      this._isShown = true;
      
      if (originalOnShow) {
        originalOnShow.call(this);
      }
    };

    // 监听页面加载
    const originalOnLoad = Page.prototype.onLoad;
    Page.prototype.onLoad = function(options) {
      console.log('[路由修复] 页面加载:', this.route, options);
      this._isLoaded = true;
      this._loadTime = Date.now();
      
      if (originalOnLoad) {
        originalOnLoad.call(this, options);
      }
    };

    // 监听页面隐藏
    const originalOnHide = Page.prototype.onHide;
    Page.prototype.onHide = function() {
      console.log('[路由修复] 页面隐藏:', this.route);
      this._isShown = false;
      
      if (originalOnHide) {
        originalOnHide.call(this);
      }
    };
  }

  /**
   * 设置路由错误恢复
   */
  setupRouteErrorRecovery() {
    // 定期检查页面状态
    setInterval(() => {
      this.performRouteHealthCheck();
    }, 30000); // 30秒检查一次
  }

  /**
   * 执行路由健康检查
   */
  performRouteHealthCheck() {
    try {
      const pages = getCurrentPages();
      
      if (pages.length === 0) {
        console.error('[路由修复] 健康检查：无页面实例');
        this.navigateToSafePage();
        return;
      }

      const currentPage = pages[pages.length - 1];
      
      if (!currentPage._isLoaded) {
        console.error('[路由修复] 健康检查：当前页面未正确加载');
        this.handlePageRenderFailure(currentPage.route, '页面未正确加载');
      }

    } catch (error) {
      console.error('[路由修复] 路由健康检查异常:', error);
    }
  }

  /**
   * 获取路由统计信息
   */
  getRouteStats() {
    return {
      history: this.routeHistory,
      retryAttempts: Object.fromEntries(this.retryAttempts),
      currentPages: getCurrentPages().length
    };
  }

  /**
   * 清理路由修复数据
   */
  cleanup() {
    this.routeHistory = [];
    this.retryAttempts.clear();
  }
}

// 创建全局实例
const routeFix = new RouteFix();

// 导出
export default routeFix;

// 便捷初始化方法
export const initRouteFix = () => routeFix.init();

// 导出工具方法
export const safeNavigate = (url, method) => routeFix.safeNavigate(url, method);
export const smartNavigate = (url) => routeFix.smartNavigate(url);
export const getRouteStats = () => routeFix.getRouteStats();