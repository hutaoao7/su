<template>
  <view class="nav-bar" :style="navBarStyle">
    <view class="nav-status" :style="{height: statusBarHeight + 'px'}"></view>
    <view class="nav-content">
      <view class="nav-left" v-if="showBack" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="nav-title">
        <text>{{title}}</text>
      </view>
      <view class="nav-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'NavBar',
  props: {
    title: {
      type: String,
      default: ''
    },
    showBack: {
      type: Boolean,
      default: true
    },
    backgroundColor: {
      type: String,
      default: '#6A5ACD'
    }
  },
  data() {
    return {
      statusBarHeight: 20
    }
  },
  computed: {
    navBarStyle() {
      return {
        backgroundColor: this.backgroundColor
      }
    }
  },
  mounted() {
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
  },
  methods: {
    goBack() {
      uni.navigateBack();
    }
  }
}
</script>

<style lang="scss" scoped>
.nav-bar {
  position: fixed;
  top: calc(0px + env(safe-area-inset-top));
  left: 0;
  right: 0;
  z-index: 999;
  background-color: #6A5ACD;
  
  .nav-status {
    background-color: inherit;
  }
  
  .nav-content {
    height: 44px;
    display: flex;
    align-items: center;
    position: relative;
    
    .nav-left {
      position: absolute;
      left: 0;
      width: 100rpx;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .back-icon {
        font-size: 40rpx;
        color: #ffffff;
        font-weight: bold;
      }
    }
    
    .nav-title {
      flex: 1;
      text-align: center;
      
      text {
        font-size: 36rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }
    
    .nav-right {
      position: absolute;
      right: 30rpx;
      height: 100%;
      display: flex;
      align-items: center;
    }
  }
}


/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}

</style>