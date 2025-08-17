<template>
  <view class="error-boundary">
    <!-- 正常内容渲染 -->
    <slot v-if="!hasError" />
    
    <!-- 错误状态显示 -->
    <view v-else class="error-container liquid-glass">
      <view class="error-icon">
        <text class="icon">⚠️</text>
      </view>
      
      <view class="error-content">
        <text class="error-title">页面加载异常</text>
        <text class="error-message">{{ errorMessage }}</text>
        
        <view class="error-actions">
          <button class="btn btn-primary" @click="retry">重试</button>
          <button class="btn btn-secondary" @click="goHome">返回首页</button>
        </view>
        
        <!-- 调试信息 (仅开发环境) -->
        <view v-if="isDevelopment && errorDetails" class="error-details">
          <text class="details-title">错误详情：</text>
          <text class="details-content">{{ errorDetails }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ErrorBoundary',
  props: {
    // 自定义错误消息
    fallbackMessage: {
      type: String,
      default: '页面出现了一些问题，请稍后重试'
    },
    // 是否显示重试按钮
    showRetry: {
      type: Boolean,
      default: true
    },
    // 是否显示返回首页按钮
    showHome: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      hasError: false,
      errorMessage: '',
      errorDetails: '',
      isDevelopment: process.env.NODE_ENV === 'development'
    };
  },
  
  created() {
    // 监听全局错误
    this.setupErrorHandling();
  },
  
  beforeDestroy() {
    // 清理错误监听
    this.cleanupErrorHandling();
  },
  
  methods: {
    /**
     * 设置错误处理
     */
    setupErrorHandling() {
      // Vue错误处理
      this.$options.errorCaptured = this.handleError;
      
      // 全局错误处理
      if (typeof uni !== 'undefined') {
        uni.onError && uni.onError(this.handleGlobalError);
      }
      
      // Promise未捕获错误处理
      if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', this.handlePromiseRejection);
      }
    },
    
    /**
     * 清理错误处理
     */
    cleanupErrorHandling() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
      }
    },
    
    /**
     * 处理Vue组件错误
     */
    handleError(err, instance, info) {
      console.error('[ErrorBoundary] Vue组件错误:', err, info);
      
      this.hasError = true;
      this.errorMessage = this.fallbackMessage;
      this.errorDetails = this.isDevelopment ? `${err.message}\n${err.stack}` : '';
      
      // 错误上报
      this.reportError('vue_component', err, { info });
      
      // 阻止错误继续传播
      return false;
    },
    
    /**
     * 处理全局错误
     */
    handleGlobalError(error) {
      console.error('[ErrorBoundary] 全局错误:', error);
      
      this.hasError = true;
      this.errorMessage = this.fallbackMessage;
      this.errorDetails = this.isDevelopment ? error.toString() : '';
      
      // 错误上报
      this.reportError('global', error);
    },
    
    /**
     * 处理Promise拒绝错误
     */
    handlePromiseRejection(event) {
      console.error('[ErrorBoundary] Promise拒绝:', event.reason);
      
      // 如果是网络错误，显示特定消息
      if (this.isNetworkError(event.reason)) {
        this.hasError = true;
        this.errorMessage = '网络连接异常，请检查网络设置';
        this.errorDetails = this.isDevelopment ? event.reason.toString() : '';
      } else {
        this.hasError = true;
        this.errorMessage = this.fallbackMessage;
        this.errorDetails = this.isDevelopment ? event.reason.toString() : '';
      }
      
      // 错误上报
      this.reportError('promise_rejection', event.reason);
      
      // 阻止默认处理
      event.preventDefault();
    },
    
    /**
     * 判断是否为网络错误
     */
    isNetworkError(error) {
      if (!error) return false;
      
      const errorString = error.toString().toLowerCase();
      const networkKeywords = [
        'network',
        'timeout',
        'connection',
        'fetch',
        'request failed',
        'net::err'
      ];
      
      return networkKeywords.some(keyword => errorString.includes(keyword));
    },
    
    /**
     * 错误上报
     */
    reportError(type, error, extra = {}) {
      try {
        // 收集错误信息
        const errorInfo = {
          type,
          message: error.message || error.toString(),
          stack: error.stack,
          url: window.location ? window.location.href : '',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          extra
        };
        
        // 在开发环境下打印详细信息
        if (this.isDevelopment) {
          console.group('[ErrorBoundary] 错误详情');
          console.error('错误类型:', type);
          console.error('错误信息:', error);
          console.error('额外信息:', extra);
          console.error('完整信息:', errorInfo);
          console.groupEnd();
        }
        
        // 这里可以添加错误上报到服务器的逻辑
        // 例如：发送到错误监控服务
        this.sendErrorToService(errorInfo);
        
      } catch (reportError) {
        console.error('[ErrorBoundary] 错误上报失败:', reportError);
      }
    },
    
    /**
     * 发送错误到服务器
     */
    async sendErrorToService(errorInfo) {
      try {
        // 这里可以调用错误上报API
        // 例如：调用uniCloud函数或第三方错误监控服务
        
        // 示例：调用uniCloud函数上报错误
        if (typeof uniCloud !== 'undefined') {
          await uniCloud.callFunction({
            name: 'error-report',
            data: errorInfo
          });
        }
        
      } catch (error) {
        console.error('[ErrorBoundary] 发送错误报告失败:', error);
      }
    },
    
    /**
     * 重试操作
     */
    retry() {
      console.log('[ErrorBoundary] 用户点击重试');
      
      // 重置错误状态
      this.hasError = false;
      this.errorMessage = '';
      this.errorDetails = '';
      
      // 触发重试事件
      this.$emit('retry');
      
      // 如果没有自定义重试逻辑，则刷新当前页面
      this.$nextTick(() => {
        if (this.hasError === false) {
          // 页面重新加载
          this.reloadCurrentPage();
        }
      });
    },
    
    /**
     * 返回首页
     */
    goHome() {
      console.log('[ErrorBoundary] 用户点击返回首页');
      
      this.$emit('go-home');
      
      // 跳转到首页
      uni.switchTab({
        url: '/pages/home/home',
        fail: (error) => {
          console.error('[ErrorBoundary] 跳转首页失败:', error);
          // 如果switchTab失败，尝试使用reLaunch
          uni.reLaunch({
            url: '/pages/home/home'
          });
        }
      });
    },
    
    /**
     * 重新加载当前页面
     */
    reloadCurrentPage() {
      try {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        
        if (currentPage && currentPage.onLoad) {
          // 重新调用页面的onLoad方法
          currentPage.onLoad(currentPage.options || {});
        } else {
          // 如果无法重新加载，则跳转到当前页面
          const currentRoute = currentPage ? currentPage.route : '';
          if (currentRoute) {
            uni.redirectTo({
              url: `/${currentRoute}`,
              fail: () => {
                // 如果redirectTo失败，跳转到首页
                this.goHome();
              }
            });
          } else {
            this.goHome();
          }
        }
      } catch (error) {
        console.error('[ErrorBoundary] 重新加载页面失败:', error);
        this.goHome();
      }
    },
    
    /**
     * 手动触发错误边界
     */
    triggerError(error, message) {
      this.hasError = true;
      this.errorMessage = message || this.fallbackMessage;
      this.errorDetails = this.isDevelopment ? error.toString() : '';
      
      this.reportError('manual', error);
    },
    
    /**
     * 重置错误状态
     */
    reset() {
      this.hasError = false;
      this.errorMessage = '';
      this.errorDetails = '';
    }
  }
};
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
  min-height: 100vh;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 60rpx 40rpx;
  margin: 40rpx 20rpx;
  text-align: center;
}

.error-icon {
  margin-bottom: 40rpx;
}

.error-icon .icon {
  font-size: 120rpx;
  line-height: 1;
}

.error-content {
  width: 100%;
  max-width: 600rpx;
}

.error-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 20rpx;
  line-height: 1.4;
}

.error-message {
  display: block;
  font-size: 28rpx;
  color: #8E8E93;
  margin-bottom: 60rpx;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  margin-bottom: 40rpx;
}

.btn {
  padding: 24rpx 48rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  border: none;
  outline: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  color: white;
}

.btn-primary:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #007AFF;
  border: 1rpx solid rgba(0, 122, 255, 0.3);
}

.btn-secondary:active {
  transform: scale(0.95);
  background: rgba(0, 122, 255, 0.1);
}

.error-details {
  margin-top: 40rpx;
  padding: 30rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  text-align: left;
}

.details-title {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #FF3B30;
  margin-bottom: 20rpx;
}

.details-content {
  display: block;
  font-size: 22rpx;
  color: #8E8E93;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.4;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .error-title {
    color: #F2F2F7;
  }
  
  .error-details {
    background: rgba(28, 28, 30, 0.6);
  }
  
  .details-content {
    color: #8E8E93;
  }
}

/* 响应式适配 */
@media screen and (min-width: 768px) {
  .error-actions {
    flex-direction: row;
    justify-content: center;
    gap: 40rpx;
  }
  
  .btn {
    min-width: 200rpx;
  }
}
</style>
