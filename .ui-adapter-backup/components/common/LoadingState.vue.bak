<template>
  <view class="loading-state">
    <!-- 骨架屏加载状态 -->
    <view v-if="type === 'skeleton'" class="skeleton-container">
      <view class="skeleton-header liquid-glass">
        <view class="skeleton-avatar"></view>
        <view class="skeleton-info">
          <view class="skeleton-line skeleton-title"></view>
          <view class="skeleton-line skeleton-subtitle"></view>
        </view>
      </view>
      
      <view class="skeleton-content">
        <view v-for="n in skeletonLines" :key="n" class="skeleton-item liquid-glass">
          <view class="skeleton-line skeleton-text"></view>
          <view class="skeleton-line skeleton-text short"></view>
        </view>
      </view>
    </view>
    
    <!-- 简单加载动画 -->
    <view v-else-if="type === 'spinner'" class="spinner-container liquid-glass">
      <view class="spinner-wrapper">
        <view class="spinner"></view>
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>
    
    <!-- 进度条加载 -->
    <view v-else-if="type === 'progress'" class="progress-container liquid-glass">
      <view class="progress-content">
        <text class="progress-title">{{ progressTitle }}</text>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progress + '%' }"></view>
        </view>
        <text class="progress-text">{{ progress }}%</text>
      </view>
    </view>
    
    <!-- 点状加载动画 -->
    <view v-else-if="type === 'dots'" class="dots-container liquid-glass">
      <view class="dots-wrapper">
        <view class="dot" v-for="n in 3" :key="n" :class="'dot-' + n"></view>
      </view>
      <text class="loading-text">{{ loadingText }}</text>
    </view>
    
    <!-- 默认加载状态 -->
    <view v-else class="default-container liquid-glass">
      <view class="default-spinner"></view>
      <text class="loading-text">{{ loadingText }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'LoadingState',
  props: {
    // 加载类型：skeleton, spinner, progress, dots, default
    type: {
      type: String,
      default: 'spinner'
    },
    // 加载文本
    loadingText: {
      type: String,
      default: '加载中...'
    },
    // 骨架屏行数
    skeletonLines: {
      type: Number,
      default: 3
    },
    // 进度条标题
    progressTitle: {
      type: String,
      default: '正在加载'
    },
    // 进度百分比
    progress: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0 && value <= 100
    },
    // 是否显示
    show: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      animationClass: ''
    };
  },
  
  mounted() {
    // 添加入场动画
    this.$nextTick(() => {
      this.animationClass = 'fade-in';
    });
  },
  
  methods: {
    /**
     * 隐藏加载状态
     */
    hide() {
      this.$emit('hide');
    },
    
    /**
     * 更新进度
     */
    updateProgress(value) {
      this.$emit('progress-update', value);
    }
  }
};
</script>

<style scoped>
.loading-state {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.loading-state.fade-in {
  opacity: 1;
  transform: translateY(0);
}

/* 骨架屏样式 */
.skeleton-container {
  width: 90%;
  max-width: 600rpx;
  padding: 40rpx;
}

.skeleton-header {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  padding: 30rpx;
}

.skeleton-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-right: 30rpx;
}

.skeleton-info {
  flex: 1;
}

.skeleton-line {
  height: 24rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 20rpx;
}

.skeleton-title {
  width: 60%;
}

.skeleton-subtitle {
  width: 40%;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.skeleton-item {
  padding: 30rpx;
}

.skeleton-text {
  width: 100%;
}

.skeleton-text.short {
  width: 70%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 旋转加载器样式 */
.spinner-container {
  padding: 60rpx 40rpx;
  text-align: center;
}

.spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;
}

.spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid rgba(0, 122, 255, 0.2);
  border-top: 6rpx solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 进度条样式 */
.progress-container {
  padding: 60rpx 40rpx;
  text-align: center;
  min-width: 500rpx;
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.progress-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #1D1D1F;
}

.progress-bar {
  width: 100%;
  height: 12rpx;
  background: rgba(0, 122, 255, 0.2);
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007AFF, #5AC8FA);
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 28rpx;
  color: #8E8E93;
}

/* 点状加载动画 */
.dots-container {
  padding: 60rpx 40rpx;
  text-align: center;
}

.dots-wrapper {
  display: flex;
  justify-content: center;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #007AFF;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.dot-1 {
  animation-delay: -0.32s;
}

.dot-2 {
  animation-delay: -0.16s;
}

.dot-3 {
  animation-delay: 0s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 默认加载器样式 */
.default-container {
  padding: 60rpx 40rpx;
  text-align: center;
}

.default-spinner {
  width: 60rpx;
  height: 60rpx;
  margin: 0 auto 40rpx;
  border: 4rpx solid rgba(0, 122, 255, 0.2);
  border-left: 4rpx solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 通用文本样式 */
.loading-text {
  font-size: 28rpx;
  color: #8E8E93;
  line-height: 1.4;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .loading-state {
    background: rgba(28, 28, 30, 0.9);
  }
  
  .skeleton-avatar,
  .skeleton-line {
    background: linear-gradient(90deg, #2C2C2E 25%, #3A3A3C 50%, #2C2C2E 75%);
    background-size: 200% 100%;
  }
  
  .progress-title {
    color: #F2F2F7;
  }
  
  .loading-text {
    color: #8E8E93;
  }
}

/* 响应式适配 */
@media screen and (max-width: 750rpx) {
  .skeleton-container {
    width: 95%;
    padding: 30rpx;
  }
  
  .progress-container {
    min-width: 400rpx;
    padding: 50rpx 30rpx;
  }
}
</style>