<template>
  <!-- #ifdef H5 -->
  <view id="app">
    <router-view />
  </view>
  <!-- #endif -->
  
  <!-- #ifndef H5 -->
  <view id="app"></view>
  <!-- #endif -->
</template>

<script>
import { hasConsent } from '@/utils/auth.js';
import { initRouteGuard } from '@/utils/route-guard.js';
import errorTracker from '@/utils/error-tracker.js';
import cacheManager from '@/utils/cache-manager.js';
import networkMonitor from '@/utils/network-monitor.js';
import preloader from '@/utils/preloader.js';

export default {
  onLaunch() {
    console.log('App Launch');
    
    try {
      // 初始化错误追踪（最先初始化）
      this.initErrorTracker();
      
      // 初始化缓存管理器
      this.initCacheManager();
      
      // 初始化网络监测
      this.initNetworkMonitor();
      
      // 初始化智能预加载
      this.initPreloader();
      
      // 初始化路由守卫
      initRouteGuard();
      
      // 检查同意状态
      this.checkConsentStatus();
      
      // 记录应用启动轨迹
      errorTracker.addBreadcrumb('lifecycle', 'App launched', {
        timestamp: Date.now()
      });
      
    } catch (error) {
      // 即使初始化失败也要记录错误
      console.error('[APP] 初始化失败:', error);
      errorTracker.logError('App initialization failed', {
        error: error.message,
        stack: error.stack
      });
    }
  },
  
  methods: {
    /**
     * 初始化错误追踪
     */
    initErrorTracker() {
      errorTracker.init({
        enabled: true,
        sampleRate: 1.0, // 100%采样
        autoReport: true,
        reportInterval: 30000, // 30秒
        maxQueueSize: 50,
        includeContext: true
      });
      
      console.log('[APP] 错误追踪已初始化');
    },
    
    /**
     * 初始化缓存管理器
     */
    async initCacheManager() {
      try {
        await cacheManager.init();
        console.log('[APP] 缓存管理器已初始化');
        
        // 记录操作轨迹
        errorTracker.addBreadcrumb('system', 'Cache manager initialized');
      } catch (error) {
        console.error('[APP] 缓存管理器初始化失败:', error);
        errorTracker.logError('Cache manager initialization failed', {
          error: error.message
        });
      }
    },
    
    /**
     * 初始化网络监测
     */
    initNetworkMonitor() {
      try {
        networkMonitor.start();
        console.log('[APP] 网络监测已启动');
        
        // 监听网络状态变化
        networkMonitor.on('change', (event) => {
          errorTracker.addBreadcrumb('network', 'Network status changed', {
            status: event.data.status,
            networkType: event.data.networkType,
            quality: event.data.quality
          });
        });
        
        // 监听网络恢复
        networkMonitor.on('recovered', () => {
          errorTracker.addBreadcrumb('network', 'Network recovered');
        });
        
        // 监听离线
        networkMonitor.on('offline', () => {
          errorTracker.addBreadcrumb('network', 'Network offline');
        });
        
      } catch (error) {
        console.error('[APP] 网络监测启动失败:', error);
        errorTracker.logError('Network monitor initialization failed', {
          error: error.message
        });
      }
    },
    
    /**
     * 初始化智能预加载
     */
    initPreloader() {
      try {
        // 启用预加载
        preloader.setEnabled(true);
        console.log('[APP] 智能预加载已启用');
        
        // 记录操作轨迹
        errorTracker.addBreadcrumb('system', 'Preloader initialized');
      } catch (error) {
        console.error('[APP] 智能预加载初始化失败:', error);
        errorTracker.logError('Preloader initialization failed', {
          error: error.message
        });
      }
    },
    
    /**
     * 检查同意状态
     */
    checkConsentStatus() {
      try {
        const hasAgreed = hasConsent();
        console.log('[APP] 同意状态:', hasAgreed);
        
        // 记录操作轨迹
        errorTracker.addBreadcrumb('consent', 'Check consent status', {
          hasAgreed
        });
        
        if (!hasAgreed) {
          console.log('[APP] 首次使用，跳转同意页');
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/consent/consent',
              fail: (error) => {
                console.error('[APP] 跳转同意页失败:', error);
                errorTracker.logError('Navigate to consent page failed', {
                  error: error.errMsg
                });
                
                // 降级跳转首页
                uni.reLaunch({ url: '/pages/home/home' });
              }
            });
          }, 500);
        }
      } catch (error) {
        console.error('[APP] 检查同意状态失败:', error);
        errorTracker.logError('Check consent status failed', {
          error: error.message
        });
      }
    }
  },
  
  onShow() {
    console.log('App Show');
    
    try {
      // 记录应用显示
      errorTracker.addBreadcrumb('lifecycle', 'App shown');
      
      // 智能预加载当前页面的关联页面
      try {
        const pages = getCurrentPages();
        if (pages.length > 0) {
          const currentPage = pages[pages.length - 1];
          const route = currentPage.route || currentPage.$page?.fullPath || '';
          if (route) {
            preloader.smartPreload(route);
          }
        }
      } catch (preloadError) {
        console.warn('[APP] 智能预加载失败:', preloadError);
      }
      
      // 检查并同步离线数据
      if (networkMonitor.isOnline() && cacheManager.offlineQueue.length > 0) {
        cacheManager.syncOfflineQueue().catch(error => {
          errorTracker.logError('Offline queue sync failed', {
            error: error.message
          });
        });
      }
    } catch (error) {
      console.error('[APP] onShow error:', error);
      errorTracker.logError('App onShow error', {
        error: error.message
      });
    }
  },
  
  onHide() {
    console.log('App Hide');
    
    try {
      // 记录应用隐藏
      errorTracker.addBreadcrumb('lifecycle', 'App hidden');
      
      // 上报未上报的错误
      errorTracker.report();
    } catch (error) {
      console.error('[APP] onHide error:', error);
    }
  },
  
  onError(error) {
    // 捕获应用级错误
    console.error('[APP] Application error:', error);
    
    try {
      errorTracker.logError('Application error', {
        error: String(error),
        level: 'fatal'
      });
    } catch (e) {
      console.error('[APP] Error tracking failed:', e);
    }
  }
}
</script>

<style lang="scss">
@import '@/uni_modules/uview-ui/index.scss';

html, body, #app, page { 
  background: #fff !important; 
  height: 100%;
  margin: 0;
  padding: 0;
}

/* 确保页面内容可见 */
#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 移除可能的隐藏样式 */
* {
  box-sizing: border-box;
}

/* 确保没有全屏遮罩 */
.mask, .overlay, .loading-mask {
  display: none !important;
}
</style>