<template>
  <view v-if="visible" class="global-loading">
    <view class="loading-mask" @tap.stop="() => {}"></view>
    <view class="loading-content">
      <view class="loading-spinner">
        <view v-for="i in 12" :key="i" class="spinner-dot" :style="{ animationDelay: (i * 0.1) + 's' }"></view>
      </view>
      <text class="loading-text">{{ text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'GlobalLoading',
  data() {
    return {
      visible: false,
      text: '加载中...'
    };
  },
  
  created() {
    // 注册全局事件
    uni.$on('showLoading', this.show);
    uni.$on('hideLoading', this.hide);
  },
  
  destroyed() {
    // 注销事件
    uni.$off('showLoading', this.show);
    uni.$off('hideLoading', this.hide);
  },
  
  methods: {
    show(options = {}) {
      this.text = options.text || '加载中...';
      this.visible = true;
      
      // 自动超时隐藏（防止忘记关闭）
      if (options.timeout !== false) {
        setTimeout(() => {
          this.hide();
        }, options.timeout || 10000);
      }
    },
    
    hide() {
      this.visible = false;
    }
  }
};
</script>

<style scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.loading-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 40rpx;
  min-width: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  position: relative;
  margin-bottom: 20rpx;
}

.spinner-dot {
  position: absolute;
  width: 12rpx;
  height: 12rpx;
  background: #0A84FF;
  border-radius: 50%;
  animation: spinner-rotate 1.2s linear infinite;
  transform-origin: 40rpx 40rpx;
}

@keyframes spinner-rotate {
  0%, 20%, 80%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.5);
  }
}

.spinner-dot:nth-child(1) { transform: rotate(0deg) translateX(30rpx); }
.spinner-dot:nth-child(2) { transform: rotate(30deg) translateX(30rpx); }
.spinner-dot:nth-child(3) { transform: rotate(60deg) translateX(30rpx); }
.spinner-dot:nth-child(4) { transform: rotate(90deg) translateX(30rpx); }
.spinner-dot:nth-child(5) { transform: rotate(120deg) translateX(30rpx); }
.spinner-dot:nth-child(6) { transform: rotate(150deg) translateX(30rpx); }
.spinner-dot:nth-child(7) { transform: rotate(180deg) translateX(30rpx); }
.spinner-dot:nth-child(8) { transform: rotate(210deg) translateX(30rpx); }
.spinner-dot:nth-child(9) { transform: rotate(240deg) translateX(30rpx); }
.spinner-dot:nth-child(10) { transform: rotate(270deg) translateX(30rpx); }
.spinner-dot:nth-child(11) { transform: rotate(300deg) translateX(30rpx); }
.spinner-dot:nth-child(12) { transform: rotate(330deg) translateX(30rpx); }

.loading-text {
  font-size: 28rpx;
  color: #1D1D1F;
}
</style>
