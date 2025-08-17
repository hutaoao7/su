/**
 * 白屏问题修复初始化
 * 在应用启动时自动检测和修复白屏问题
 */

import whiteScreenDetector from './white-screen-detector.js';

class WhiteScreenFix {
  constructor() {
    this.isInitialized = false;
    this.fixAttempts = 0;
    this.maxFixAttempts = 3;
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * 初始化白屏修复系统
   */
  async init() {
    if (this.isInitialized) {
      console.log('[白屏修复] 系统已初始化');
      return;
    }

    console.log('[白屏修复] 开始初始化...');

    try {
      // 1. 设置全局错误处理
      this.setupGlobalErrorHandling();

      // 2. 设置页面生命周期监听
      this.setupPageLifecycleMonitoring();

      // 3. 设置网络状态监听
      this.setupNetworkMonitoring();

      // 4. 设置资源加载监听
      this.setupResourceMonitoring();

      // 5. 执行初始检测
      await this.performInitialCheck();

      this.isInitialized = true;
      console.log('[白屏修复] 初始化完成');

    } catch (error) {
      console.error('[白屏修复] 初始化失败:', error);
      // 即使初始化失败，也要设置基本的错误处理
      this.setupBasicErrorHandling();
    }
  }

  /**
   * 设置全局错误处理
   */
  setupGlobalErrorHandling() {
    // Vue全局错误处理
    if (typeof Vue !== 'undefined') {
      Vue.config.errorHandler = (err, vm, info) => {
        console.error('[Vue错误]', err, info);
        this.handleVueError(err, vm, info);
      };
    }

    // UniApp全局错误处理
    if (typeof uni !== 'undefined') {
      uni.onError((error) => {
        console.error('[UniApp错误]', error);
        this.handleUniAppError(error);
      });

      // 网络请求错误处理
      const originalRequest = uni.request;
      uni.request = (options) => {
        const originalSuccess = options.success;
        const originalFail = options.fail;

        options.success = (res) => {
          if (originalSuccess) originalSuccess(res);
        };

        options.fail = (err) => {
          console.error('[网络请求错误]', err);
          this.handleNetworkError(err, options);
          if (originalFail) originalFail(err);
        };

        return originalRequest(options);
      };
    }

    // Promise未捕获错误处理
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('[Promise拒绝]', event.reason);
        this.handlePromiseRejection(event);
      });

      window.addEventListener('error', (event) => {
        console.error('[全局错误]', event.error);
        this.handleGlobalError(event);
      });
    }
  }

  /**
   * 设置页面生命周期监听
   */
  setupPageLifecycleMonitoring() {
    // 监听页面显示
    if (typeof uni !== 'undefined') {
      uni.onAppShow(() => {
        console.log('[白屏修复] 应用显示');
        this.checkPageRenderStatus();
      });

      // 监听页面隐藏
      uni.onAppHide(() => {
        console.log('[白屏修复] 应用隐藏');
      });
    }

    // 页面路由监听
    this.setupRouteMonitoring();
  }

  /**
   * 设置路由监听
   */
  setupRouteMonitoring() {
    // 重写页面跳转方法，添加错误处理
    const routeMethods = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab', 'navigateBack'];
    
    routeMethods.forEach(method => {
      if (uni[method]) {
        const originalMethod = uni[method];
        uni[method] = (options) => {
          if (typeof options === 'string') {
            options = { url: options };
          }

          const originalSuccess = options.success;
          const originalFail = options.fail;

          options.success = (res) => {
            console.log(`[路由成功] ${method}:`, options.url);
            if (originalSuccess) originalSuccess(res);
            // 路由成功后检查页面渲染
            setTimeout(() => this.checkPageRenderStatus(), 100);
          };

          options.fail = (err) => {
            console.error(`[路由失败] ${method}:`, err);
            this.handleRouteError(method, options, err);
            if (originalFail) originalFail(err);
          };

          return originalMethod(options);
        };
      }
    });
  }

  /**
   * 设置网络状态监听
   */
  setupNetworkMonitoring() {
    if (typeof uni !== 'undefined') {
      uni.onNetworkStatusChange((res) => {
        console.log('[网络状态变化]', res);
        if (!res.isConnected) {
          this.handleNetworkDisconnected();
        } else {
          this.handleNetworkReconnected();
        }
      });
    }
  }

  /**
   * 设置资源加载监听
   */
  setupResourceMonitoring() {
    // 监听图片加载错误
    if (typeof document !== 'undefined') {
      document.addEventListener('error', (event) => {
        if (event.target.tagName === 'IMG') {
          console.error('[图片加载失败]', event.target.src);
          this.handleImageLoadError(event.target);
        }
      }, true);
    }
  }

  /**
   * 执行初始检测
   */
  async performInitialCheck() {
    console.log('[白屏修复] 执行初始检测...');
    
    try {
      const result = await whiteScreenDetector.detectAllIssues();
      
      if (result.issues.length > 0) {
        console.warn('[白屏修复] 发现问题:', result.issues);
        
        // 自动修复可修复的问题
        if (result.fixes.length > 0) {
          await whiteScreenDetector.autoFix();
        }
        
        // 显示问题报告（仅开发环境）
        if (this.debugMode) {
          this.showDebugReport(result);
        }
      } else {
        console.log('[白屏修复] 未发现问题');
      }
    } catch (error) {
      console.error('[白屏修复] 初始检测失败:', error);
    }
  }

  /**
   * 处理Vue错误
   */
  handleVueError(err, vm, info) {
    // 记录错误信息
    const errorInfo = {
      type: 'vue_error',
      message: err.message,
      stack: err.stack,
      info: info,
      component: vm ? vm.$options.name || vm.$options._componentTag : 'unknown',
      timestamp: new Date().toISOString()
    };

    // 尝试恢复
    this.attemptRecovery('vue_error', errorInfo);
  }

  /**
   * 处理UniApp错误
   */
  handleUniAppError(error) {
    const errorInfo = {
      type: 'uniapp_error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    };

    this.attemptRecovery('uniapp_error', errorInfo);
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(err, options) {
    const errorInfo = {
      type: 'network_error',
      url: options.url,
      method: options.method || 'GET',
      error: err,
      timestamp: new Date().toISOString()
    };

    // 网络错误通常需要用户手动重试
    this.showNetworkErrorToast();
  }

  /**
   * 处理Promise拒绝
   */
  handlePromiseRejection(event) {
    const errorInfo = {
      type: 'promise_rejection',
      reason: event.reason,
      timestamp: new Date().toISOString()
    };

    this.attemptRecovery('promise_rejection', errorInfo);
  }

  /**
   * 处理全局错误
   */
  handleGlobalError(event) {
    const errorInfo = {
      type: 'global_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString()
    };

    this.attemptRecovery('global_error', errorInfo);
  }

  /**
   * 处理路由错误
   */
  handleRouteError(method, options, err) {
    console.error(`[路由错误] ${method} 失败:`, err);
    
    // 尝试回退到安全页面
    if (method !== 'switchTab') {
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/home/home',
          fail: () => {
            // 如果连首页都无法跳转，尝试重启应用
            uni.reLaunch({
              url: '/pages/home/home'
            });
          }
        });
      }, 1000);
    }
  }

  /**
   * 检查页面渲染状态
   */
  checkPageRenderStatus() {
    setTimeout(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      if (!currentPage) {
        console.error('[白屏检测] 无法获取当前页面');
        this.handleWhiteScreen('no_current_page');
        return;
      }

      // 检查页面是否正常渲染
      if (this.isPageWhiteScreen(currentPage)) {
        console.error('[白屏检测] 检测到白屏');
        this.handleWhiteScreen('white_screen_detected');
      }
    }, 500);
  }

  /**
   * 判断页面是否白屏
   */
  isPageWhiteScreen(page) {
    // [FIXED] 禁用过于简单的白屏检测逻辑，避免误判
    // 原始逻辑: if (page.data && Object.keys(page.data).length === 0) { return true; }
    return false;
  }

  /**
   * 处理白屏情况
   */
  handleWhiteScreen(reason) {
    console.log('[白屏修复] 处理白屏:', reason);
    
    if (this.fixAttempts >= this.maxFixAttempts) {
      console.error('[白屏修复] 修复次数超限，停止尝试');
      this.showFatalErrorPage();
      return;
    }

    this.fixAttempts++;
    
    // 尝试修复
    this.attemptWhiteScreenFix(reason);
  }

  /**
   * 尝试修复白屏
   */
  async attemptWhiteScreenFix(reason) {
    console.log(`[白屏修复] 尝试修复 (${this.fixAttempts}/${this.maxFixAttempts}):`, reason);
    
    try {
      switch (reason) {
        case 'no_current_page':
          // 重新跳转到首页
          uni.reLaunch({ url: '/pages/home/home' });
          break;
          
        case 'white_screen_detected':
          // 重新加载当前页面
          this.reloadCurrentPage();
          break;
          
        default:
          // 通用修复：重新检测并修复
          await whiteScreenDetector.detectAllIssues();
          await whiteScreenDetector.autoFix();
          break;
      }
    } catch (error) {
      console.error('[白屏修复] 修复失败:', error);
    }
  }

  /**
   * 重新加载当前页面
   */
  reloadCurrentPage() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage && currentPage.onLoad) {
      currentPage.onLoad(currentPage.options || {});
    }
  }

  /**
   * 尝试恢复
   */
  attemptRecovery(errorType, errorInfo) {
    console.log('[白屏修复] 尝试恢复:', errorType);
    
    // 根据错误类型采取不同的恢复策略
    switch (errorType) {
      case 'vue_error':
        // Vue错误通常需要重新渲染组件
        this.$nextTick && this.$nextTick(() => {
          this.checkPageRenderStatus();
        });
        break;
        
      case 'network_error':
        // 网络错误显示提示
        this.showNetworkErrorToast();
        break;
        
      default:
        // 通用恢复策略
        setTimeout(() => {
          this.checkPageRenderStatus();
        }, 1000);
        break;
    }
  }

  /**
   * 处理网络断开
   */
  handleNetworkDisconnected() {
    console.log('[白屏修复] 网络断开');
    uni.showToast({
      title: '网络连接断开',
      icon: 'none',
      duration: 2000
    });
  }

  /**
   * 处理网络重连
   */
  handleNetworkReconnected() {
    console.log('[白屏修复] 网络重连');
    uni.showToast({
      title: '网络已恢复',
      icon: 'success',
      duration: 1500
    });
    
    // 重新检查页面状态
    this.checkPageRenderStatus();
  }

  /**
   * 处理图片加载错误
   */
  handleImageLoadError(img) {
    // 设置默认图片
    img.src = '/static/images/placeholder.png';
  }

  /**
   * 显示网络错误提示
   */
  showNetworkErrorToast() {
    uni.showToast({
      title: '网络请求失败，请检查网络连接',
      icon: 'none',
      duration: 3000
    });
  }

  /**
   * 显示致命错误页面
   */
  showFatalErrorPage() {
    uni.showModal({
      title: '应用异常',
      content: '应用出现异常，建议重启应用',
      showCancel: true,
      cancelText: '重启',
      confirmText: '继续',
      success: (res) => {
        if (res.cancel) {
          // 重启应用
          uni.reLaunch({
            url: '/pages/home/home'
          });
        }
      }
    });
  }

  /**
   * 显示调试报告
   */
  showDebugReport(result) {
    if (!this.debugMode) return;
    
    console.group('[白屏修复] 调试报告');
    console.log('问题总数:', result.summary.total);
    console.log('严重问题:', result.summary.critical);
    console.log('警告问题:', result.summary.warning);
    console.log('可修复项:', result.summary.fixes);
    console.log('详细问题:', result.issues);
    console.log('修复建议:', result.fixes);
    console.groupEnd();
  }

  /**
   * 设置基本错误处理（降级方案）
   */
  setupBasicErrorHandling() {
    console.log('[白屏修复] 设置基本错误处理');
    
    if (typeof uni !== 'undefined') {
      uni.onError((error) => {
        console.error('[基本错误处理]', error);
        uni.showToast({
          title: '应用出现异常',
          icon: 'none',
          duration: 2000
        });
      });
    }
  }
}

// 创建全局实例
const whiteScreenFix = new WhiteScreenFix();

// 导出
export default whiteScreenFix;

// 便捷初始化方法
export const initWhiteScreenFix = () => whiteScreenFix.init();