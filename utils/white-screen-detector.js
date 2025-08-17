/**
 * 白屏问题诊断工具
 * 用于检测和修复可能导致白屏的各种问题
 */

class WhiteScreenDetector {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.isDebugging = process.env.NODE_ENV === 'development';
  }

  /**
   * 执行全量白屏问题检测
   */
  async detectAllIssues() {
    console.log('[白屏检测] 开始全量检测...');
    
    // 清空之前的检测结果
    this.issues = [];
    this.fixes = [];
    
    // 1. 检查页面路由配置
    await this.checkRouteConfig();
    
    // 2. 检查组件渲染问题
    await this.checkComponentRendering();
    
    // 3. 检查数据加载问题
    await this.checkDataLoading();
    
    // 4. 检查静态资源加载
    await this.checkStaticResources();
    
    // 5. 检查错误边界
    await this.checkErrorBoundaries();
    
    // 6. 检查平台兼容性
    await this.checkPlatformCompatibility();
    
    console.log('[白屏检测] 检测完成，发现问题:', this.issues.length);
    return {
      issues: this.issues,
      fixes: this.fixes,
      summary: this.generateSummary()
    };
  }

  /**
   * 检查页面路由配置问题
   */
  async checkRouteConfig() {
    try {
      // 检查pages.json配置
      const currentPages = getCurrentPages();
      const currentRoute = currentPages[currentPages.length - 1];
      
      if (!currentRoute) {
        this.addIssue('route', '无法获取当前页面路由信息', 'critical');
        return;
      }

      // 检查页面是否在pages.json中正确配置
      const pagePath = currentRoute.route;
      if (!pagePath) {
        this.addIssue('route', '当前页面路径为空', 'critical');
      }

      // 检查tabBar配置
      if (this.isTabBarPage(pagePath)) {
        this.checkTabBarConfig(pagePath);
      }

    } catch (error) {
      this.addIssue('route', `路由检查异常: ${error.message}`, 'critical');
    }
  }

  /**
   * 检查组件渲染问题
   */
  async checkComponentRendering() {
    try {
      // 检查Vue实例状态
      const app = getApp();
      if (!app) {
        this.addIssue('component', 'App实例未正确初始化', 'critical');
        return;
      }

      // 检查全局数据
      if (!app.globalData) {
        this.addIssue('component', 'App.globalData未初始化', 'warning');
        this.addFix('component', '初始化App.globalData');
      }

      // 检查系统信息
      if (!app.globalData.statusBarHeight) {
        this.addIssue('component', '系统信息未正确获取', 'warning');
        this.addFix('component', '重新获取系统信息');
      }

    } catch (error) {
      this.addIssue('component', `组件检查异常: ${error.message}`, 'critical');
    }
  }

  /**
   * 检查数据加载问题
   */
  async checkDataLoading() {
    try {
      // 检查网络状态
      const networkType = await this.getNetworkType();
      if (networkType === 'none') {
        this.addIssue('data', '网络连接异常', 'critical');
        this.addFix('data', '显示网络错误提示');
      }

      // 检查uniCloud连接
      await this.checkUniCloudConnection();

      // 检查本地存储
      this.checkLocalStorage();

    } catch (error) {
      this.addIssue('data', `数据加载检查异常: ${error.message}`, 'warning');
    }
  }

  /**
   * 检查静态资源加载
   */
  async checkStaticResources() {
    try {
      // 检查关键CSS文件
      const criticalCSS = [
        '/static/css/liquid-glass.css',
        '/static/css/theme.css'
      ];

      for (const cssPath of criticalCSS) {
        const exists = await this.checkResourceExists(cssPath);
        if (!exists) {
          this.addIssue('resource', `关键CSS文件缺失: ${cssPath}`, 'critical');
          this.addFix('resource', `恢复CSS文件: ${cssPath}`);
        }
      }

      // 检查图标资源
      const iconPaths = [
        '/static/images/home.png',
        '/static/images/home-active.png'
      ];

      for (const iconPath of iconPaths) {
        const exists = await this.checkResourceExists(iconPath);
        if (!exists) {
          this.addIssue('resource', `图标文件缺失: ${iconPath}`, 'warning');
        }
      }

    } catch (error) {
      this.addIssue('resource', `资源检查异常: ${error.message}`, 'warning');
    }
  }

  /**
   * 检查错误边界
   */
  async checkErrorBoundaries() {
    try {
      // 检查全局错误处理
      if (!uni.onError) {
        this.addIssue('error', '缺少全局错误处理机制', 'warning');
        this.addFix('error', '添加全局错误处理');
      }

      // 检查页面错误处理
      const currentPages = getCurrentPages();
      const currentPage = currentPages[currentPages.length - 1];
      
      if (currentPage && !currentPage.onError) {
        this.addIssue('error', '当前页面缺少错误处理', 'warning');
        this.addFix('error', '为页面添加错误处理');
      }

    } catch (error) {
      this.addIssue('error', `错误边界检查异常: ${error.message}`, 'warning');
    }
  }

  /**
   * 检查平台兼容性
   */
  async checkPlatformCompatibility() {
    try {
      const systemInfo = uni.getSystemInfoSync();
      const platform = systemInfo.platform;

      // 检查平台特定问题
      if (platform === 'android') {
        await this.checkAndroidCompatibility(systemInfo);
      } else if (platform === 'ios') {
        await this.checkIOSCompatibility(systemInfo);
      }

      // 检查小程序特定问题
      // #ifdef MP
      await this.checkMiniProgramCompatibility();
      // #endif

      // 检查H5特定问题
      // #ifdef H5
      await this.checkH5Compatibility();
      // #endif

    } catch (error) {
      this.addIssue('platform', `平台兼容性检查异常: ${error.message}`, 'warning');
    }
  }

  /**
   * 检查Android兼容性
   */
  async checkAndroidCompatibility(systemInfo) {
    // 检查Android版本
    if (systemInfo.system && systemInfo.system.includes('Android')) {
      const androidVersion = this.extractAndroidVersion(systemInfo.system);
      if (androidVersion < 5.0) {
        this.addIssue('platform', `Android版本过低: ${androidVersion}`, 'warning');
        this.addFix('platform', '添加低版本Android兼容性处理');
      }
    }

    // 检查WebView版本
    if (systemInfo.webViewVersion) {
      const webViewVersion = parseInt(systemInfo.webViewVersion);
      if (webViewVersion < 60) {
        this.addIssue('platform', `WebView版本过低: ${webViewVersion}`, 'warning');
      }
    }
  }

  /**
   * 检查iOS兼容性
   */
  async checkIOSCompatibility(systemInfo) {
    // 检查iOS版本
    if (systemInfo.system && systemInfo.system.includes('iOS')) {
      const iosVersion = this.extractIOSVersion(systemInfo.system);
      if (iosVersion < 10.0) {
        this.addIssue('platform', `iOS版本过低: ${iosVersion}`, 'warning');
        this.addFix('platform', '添加低版本iOS兼容性处理');
      }
    }

    // 检查安全区域
    if (systemInfo.safeAreaInsets) {
      const { top, bottom } = systemInfo.safeAreaInsets;
      if (top > 44 || bottom > 34) {
        this.addIssue('platform', 'iOS刘海屏适配问题', 'warning');
        this.addFix('platform', '优化安全区域适配');
      }
    }
  }

  /**
   * 检查小程序兼容性
   */
  async checkMiniProgramCompatibility() {
    // 检查小程序基础库版本
    const systemInfo = uni.getSystemInfoSync();
    if (systemInfo.SDKVersion) {
      const version = systemInfo.SDKVersion;
      if (this.compareVersion(version, '2.10.0') < 0) {
        this.addIssue('platform', `小程序基础库版本过低: ${version}`, 'warning');
      }
    }
  }

  /**
   * 检查H5兼容性
   */
  async checkH5Compatibility() {
    // 检查浏览器兼容性
    const userAgent = navigator.userAgent;
    
    // 检查是否为老版本浏览器
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      this.addIssue('platform', '不支持IE浏览器', 'critical');
      this.addFix('platform', '显示浏览器升级提示');
    }

    // 检查移动端浏览器
    if (this.isMobile() && !this.isSupportedMobileBrowser(userAgent)) {
      this.addIssue('platform', '移动端浏览器兼容性问题', 'warning');
    }
  }

  /**
   * 辅助方法
   */
  async getNetworkType() {
    return new Promise((resolve) => {
      uni.getNetworkType({
        success: (res) => resolve(res.networkType),
        fail: () => resolve('unknown')
      });
    });
  }

  async checkUniCloudConnection() {
    try {
      // 简单的uniCloud连接测试
      const result = await uniCloud.callFunction({
        name: 'test-connection',
        data: {}
      });
      return true;
    } catch (error) {
      this.addIssue('data', 'uniCloud连接异常', 'warning');
      this.addFix('data', '检查uniCloud配置和网络连接');
      return false;
    }
  }

  checkLocalStorage() {
    try {
      // 测试本地存储功能
      const testKey = '__white_screen_test__';
      const testValue = 'test';
      
      uni.setStorageSync(testKey, testValue);
      const retrieved = uni.getStorageSync(testKey);
      uni.removeStorageSync(testKey);
      
      if (retrieved !== testValue) {
        this.addIssue('data', '本地存储功能异常', 'warning');
        this.addFix('data', '检查存储权限和空间');
      }
    } catch (error) {
      this.addIssue('data', `本地存储测试失败: ${error.message}`, 'warning');
    }
  }

  async checkResourceExists(path) {
    // 这里简化处理，实际项目中可能需要更复杂的检测逻辑
    return true; // 假设资源存在
  }

  isTabBarPage(pagePath) {
    const tabBarPages = [
      'pages/home/home',
      'pages/features/features', 
      'pages/settings/settings'
    ];
    return tabBarPages.includes(pagePath);
  }

  checkTabBarConfig(pagePath) {
    // 检查tabBar配置是否正确
    // 这里可以添加更详细的tabBar检查逻辑
  }

  extractAndroidVersion(systemString) {
    const match = systemString.match(/Android (\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  extractIOSVersion(systemString) {
    const match = systemString.match(/iOS (\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  compareVersion(version1, version2) {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  isSupportedMobileBrowser(userAgent) {
    // 检查是否为支持的移动端浏览器
    return /Chrome|Safari|Firefox|Edge/i.test(userAgent);
  }

  addIssue(category, description, severity = 'warning') {
    this.issues.push({
      category,
      description,
      severity,
      timestamp: new Date().toISOString()
    });
    
    if (this.isDebugging) {
      console.warn(`[白屏检测-${severity.toUpperCase()}] ${category}: ${description}`);
    }
  }

  addFix(category, description) {
    this.fixes.push({
      category,
      description,
      timestamp: new Date().toISOString()
    });
    
    if (this.isDebugging) {
      console.info(`[白屏修复] ${category}: ${description}`);
    }
  }

  generateSummary() {
    const criticalIssues = this.issues.filter(issue => issue.severity === 'critical');
    const warningIssues = this.issues.filter(issue => issue.severity === 'warning');
    
    return {
      total: this.issues.length,
      critical: criticalIssues.length,
      warning: warningIssues.length,
      fixes: this.fixes.length,
      categories: this.getCategorySummary()
    };
  }

  getCategorySummary() {
    const categories = {};
    this.issues.forEach(issue => {
      if (!categories[issue.category]) {
        categories[issue.category] = { total: 0, critical: 0, warning: 0 };
      }
      categories[issue.category].total++;
      categories[issue.category][issue.severity]++;
    });
    return categories;
  }

  /**
   * 自动修复可修复的问题
   */
  async autoFix() {
    console.log('[白屏修复] 开始自动修复...');
    
    for (const fix of this.fixes) {
      try {
        await this.applyFix(fix);
      } catch (error) {
        console.error(`[白屏修复] 修复失败 ${fix.category}: ${error.message}`);
      }
    }
    
    console.log('[白屏修复] 自动修复完成');
  }

  async applyFix(fix) {
    switch (fix.category) {
      case 'component':
        await this.fixComponentIssues();
        break;
      case 'data':
        await this.fixDataIssues();
        break;
      case 'error':
        await this.fixErrorHandling();
        break;
      case 'platform':
        await this.fixPlatformIssues();
        break;
      default:
        console.log(`[白屏修复] 未知修复类型: ${fix.category}`);
    }
  }

  async fixComponentIssues() {
    // 修复组件相关问题
    const app = getApp();
    if (app && !app.globalData) {
      app.globalData = {
        statusBarHeight: 20,
        navBarHeight: 44,
        screenWidth: 375,
        screenHeight: 667,
        platform: 'ios'
      };
    }
    
    if (app && !app.globalData.statusBarHeight) {
      try {
        const systemInfo = uni.getSystemInfoSync();
        app.globalData.statusBarHeight = systemInfo.statusBarHeight || 20;
        app.globalData.screenWidth = systemInfo.screenWidth || 375;
        app.globalData.screenHeight = systemInfo.screenHeight || 667;
        app.globalData.platform = systemInfo.platform || 'ios';
      } catch (error) {
        console.error('修复系统信息失败:', error);
      }
    }
  }

  async fixDataIssues() {
    // 修复数据相关问题
    // 这里可以添加数据修复逻辑
  }

  async fixErrorHandling() {
    // 修复错误处理问题
    if (!uni.onError) {
      uni.onError = (error) => {
        console.error('[全局错误]', error);
        // 可以在这里添加错误上报逻辑
      };
    }
  }

  async fixPlatformIssues() {
    // 修复平台兼容性问题
    // 这里可以添加平台特定的修复逻辑
  }
}

// 创建全局实例
const whiteScreenDetector = new WhiteScreenDetector();

// 导出检测器
export default whiteScreenDetector;

// 导出便捷方法
export const detectWhiteScreen = () => whiteScreenDetector.detectAllIssues();
export const fixWhiteScreen = () => whiteScreenDetector.autoFix();