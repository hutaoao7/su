<template>
  <view class="custom-tab-bar liquid-glass">
    <view 
      v-for="(item, index) in availableTabs" 
      :key="index" 
      class="tab-item"
      :class="{ active: currentTab === item.pagePath }"
      @click="handleTabClick(item)"
    >
      <view class="tab-icon">
        <image :src="currentTab === item.pagePath ? item.selectedIconPath : item.iconPath" mode="aspectFit"></image>
      </view>
      <text class="tab-text">{{ item.text }}</text>
      <view v-if="!item.available" class="tab-badge">敬请期待</view>
    </view>
  </view>
</template>

<script>
import { getFeatureRegistry } from '@/common/features.js'
import { safeNavigate } from '@/common/nav.js'

export default {
  name: 'TabBar',
  data() {
    return {
      currentTab: '/pages/index/index',
      allTabs: [
        {
          pagePath: '/pages/index/index',
          iconPath: '/static/images/home.png',
          selectedIconPath: '/static/images/home-active.png',
          text: '首页',
          featureKey: 'home'
        },
        {
          pagePath: '/pages/stress/index',
          iconPath: '/static/images/stress.png',
          selectedIconPath: '/static/images/stress-active.png',
          text: '压力检测',
          featureKey: 'stress'
        },
        {
          pagePath: '/pages/intervene/intervene',
          iconPath: '/static/images/intervene.png',
          selectedIconPath: '/static/images/intervene-active.png',
          text: '干预',
          featureKey: 'intervene'
        },
        {
          pagePath: '/pages/community/index',
          iconPath: '/static/images/community.png',
          selectedIconPath: '/static/images/community-active.png',
          text: '社区',
          featureKey: 'community'
        },
        {
          pagePath: '/pages/user/home',
          iconPath: '/static/images/user.png',
          selectedIconPath: '/static/images/user-active.png',
          text: '我的',
          featureKey: 'user'
        }
      ]
    };
  },
  computed: {
    availableTabs() {
      const registry = getFeatureRegistry()
      return this.allTabs.map(tab => ({
        ...tab,
        available: registry[tab.featureKey]?.available || false
      }))
    }
  },
  mounted() {
    // 获取当前页面路径
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      const route = '/' + currentPage.route;
      this.currentTab = route;
    }
  },
  methods: {
    handleTabClick(item) {
      if (this.currentTab === item.pagePath) return;
      
      // 使用统一导航处理
      safeNavigate(item.pagePath, 'switchTab')
      this.currentTab = item.pagePath;
    }
  }
};
</script>

<style lang="scss" scoped>
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 30rpx 30rpx 0 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -4rpx 30rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  z-index: 999;
  
  // 适配底部安全区域
  padding-bottom: env(safe-area-inset-bottom);
  
  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.95);
    }
    
    &.active {
      .tab-text {
        color: #007AFF;
        font-weight: 600;
      }
      
      .tab-icon {
        transform: scale(1.1);
      }
    }
    
    .tab-icon {
      width: 50rpx;
      height: 50rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 0.3s ease;
      
      image {
        width: 44rpx;
        height: 44rpx;
      ; overflow: hidden}
    }
    
    .tab-text {
      font-size: 22rpx;
      margin-top: 8rpx;
      color: #8E8E93;
      transition: all 0.3s ease;
      font-weight: 500;
    }
    
    .tab-badge {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
      color: white;
      font-size: 18rpx;
      padding: 2rpx 8rpx;
      border-radius: 10rpx;
      transform: scale(0.8);
      opacity: 0.9;
    }
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .custom-tab-bar {
    background: rgba(28, 28, 30, 0.85);
    border: 1rpx solid rgba(255, 255, 255, 0.1);
    
    .tab-item {
      .tab-text {
        color: #8E8E93;
      }
      
      &.active .tab-text {
        color: #0A84FF;
      }
    }
  }
}
</style>
