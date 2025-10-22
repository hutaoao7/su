<template>
  <view class="page">
    <!-- 骨架屏加载状态 -->
    <view v-if="isLoading" class="skeleton-wrapper">
      <view class="skeleton-user-card">
        <view class="skeleton-avatar skeleton-animation"></view>
        <view class="skeleton-info">
          <view class="skeleton-name skeleton-animation"></view>
          <view class="skeleton-status skeleton-animation"></view>
        </view>
      </view>
      <view class="skeleton-menu skeleton-animation"></view>
      <view class="skeleton-menu skeleton-animation"></view>
    </view>
    
    <!-- 用户信息卡片 -->
    <view v-else class="user-card">
      <view class="user-avatar">
        <image 
          v-if="avatar" 
          :src="avatar" 
          class="avatar-img"
          mode="aspectFill"
        ></image>
        <view v-else class="avatar-placeholder">
          <text class="avatar-text">{{ avatarText }}</text>
        </view>
      </view>
      
      <view class="user-info">
        <text class="user-name">{{ name }}</text>
        <text class="user-status">{{ statusText }}</text>
      </view>
      
      <view class="user-actions">
        <button 
          class="action-btn"
          :class="{ 'logout-btn': authed, 'login-btn': !authed }"
          @tap="handleAuthAction"
        >
          {{ authed ? '退出登录' : '登录/注册' }}
        </button>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-title">
        <text class="title-text">个人设置</text>
      </view>
      
      <view class="menu-list">
        <view class="menu-item" @tap="navigateTo('/pages-sub/other/profile')">
          <view class="menu-icon">👤</view>
          <text class="menu-text">个人资料</text>
          <text class="menu-arrow">›</text>
        </view>
        
        <view class="menu-item" @tap="navigateTo('/pages-sub/other/settings/settings')">
          <view class="menu-icon">⚙️</view>
          <text class="menu-text">应用设置</text>
          <text class="menu-arrow">›</text>
        </view>
        
        <view class="menu-item" @tap="showSubscriptionSettings">
          <view class="menu-icon">🔔</view>
          <text class="menu-text">订阅设置</text>
          <text class="menu-arrow">›</text>
        </view>
        
        <view class="menu-item" @tap="showFeedback">
          <view class="menu-icon">💬</view>
          <text class="menu-text">意见反馈</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="shortcut-section">
      <view class="menu-title">
        <text class="title-text">快捷入口</text>
      </view>
      
      <view class="shortcut-grid">
        <view class="shortcut-item" @tap="navigateTo('/pages-sub/stress/history')">
          <view class="shortcut-icon">📊</view>
          <text class="shortcut-text">检测历史</text>
        </view>
        
        <view class="shortcut-item" @tap="navigateTo('/pages-sub/other/redeem')">
          <view class="shortcut-icon">🎁</view>
          <text class="shortcut-text">CDK兑换</text>
        </view>
        
        <view class="shortcut-item" @tap="navigateTo('/pages-sub/other/metrics')" v-if="isAdmin">
          <view class="shortcut-icon">📈</view>
          <text class="shortcut-text">数据指标</text>
        </view>
        
        <view class="shortcut-item" @tap="navigateTo('/pages-sub/other/test/index')">
          <view class="shortcut-icon">🧪</view>
          <text class="shortcut-text">测试页面</text>
        </view>
      </view>
    </view>

    <!-- 订阅设置弹窗 -->
    <u-popup v-model="showSubscriptionPopup" mode="bottom" height="60%" border-radius="24" :safe-area-inset-bottom="true">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">订阅设置</text>
          <view class="popup-close" @tap="showSubscriptionPopup = false">
            <text class="close-icon">×</text>
          </view>
        </view>
        <view class="popup-body">
          <view class="setting-item">
            <text class="setting-label">压力检测提醒</text>
            <u-switch v-model="subscriptionSettings.stressReminder" @change="updateSubscription"></u-switch>
          </view>
          <view class="setting-item">
            <text class="setting-label">每日心理建议</text>
            <u-switch v-model="subscriptionSettings.dailyTips" @change="updateSubscription"></u-switch>
          </view>
          <view class="setting-item">
            <text class="setting-label">社区动态通知</text>
            <u-switch v-model="subscriptionSettings.communityUpdates" @change="updateSubscription"></u-switch>
          </view>
        </view>
      </view>
    </u-popup>
    
    
  </view>
</template>

<script>
import { 
  isAuthed, 
  getLoginData, 
  clearLoginData,
  getUid,
  getUserInfo
} from '@/utils/auth.js';
import { authAPI, subscribeAPI } from '@/utils/request.js';
import tabBarManager from '@/utils/tabbar-manager.js';
import { trackPageView, trackClick, trackEvent } from '@/utils/analytics.js';

export default {
  data() {
    return {
      // 加载状态
      isLoading: true,
      
      // 用户状态数据 - 直接存储，不使用计算属性
      authed: false,
      name: '未登录',
      uid: '',
      avatar: '',
      
      // 弹窗状态
      showSubscriptionPopup: false,
      
      // 订阅设置
      subscriptionSettings: {
        stressReminder: false,
        dailyTips: false,
        communityUpdates: false
      }
    };
  },
  
  computed: {
    // 状态文本
    statusText() {
      return this.authed ? '已登录' : '点击登录获取完整功能';
    },
    
    // 头像文字
    avatarText() {
      if (!this.authed) {
        return '未';
      }
      
      const name = this.name;
      return name.length > 0 ? name.charAt(0) : '用';
    },
    
    // 是否管理员
    isAdmin() {
      // 简单的管理员判断逻辑，可根据实际需求调整
      const loginData = getLoginData();
      return loginData.userInfo?.role === 'admin';
    }
  },
  
  onLoad() {
    console.log('[PROFILE] 页面加载');
    
    // 注册登录状态变更事件监听
    uni.$on('AUTH_CHANGED', this.onAuthChanged);
    
    this.refreshProfile();
  },
  
  onShow() {
    console.log('[PROFILE] 页面显示，刷新用户数据');
    
    // 页面浏览埋点
    trackPageView(
      '/pages/user/home',
      '用户中心',
      {
        is_logged_in: this.authed,
        user_name: this.name
      }
    );
    
    this.refreshProfile();
    // 通知导航栏更新状态
    tabBarManager.setCurrentIndexByPath('/pages/user/home');
  },
  
  onUnload() {
    // 移除事件监听
    uni.$off('AUTH_CHANGED', this.onAuthChanged);
  },
  
  methods: {
    // 统一刷新函数 - 基于 isAuthed() 和 getLoginData() 更新所有状态
    refreshProfile() {
      // 开始加载
      this.isLoading = true;
      
      // 模拟异步加载（确保骨架屏可见）
      setTimeout(() => {
        // 获取最新登录状态
        this.authed = isAuthed();
        const loginData = getLoginData();
      
      if (this.authed) {
        // 已登录状态
        const uid = loginData.uid || '';
        const userInfo = loginData.userInfo || {};
        
        // 计算显示名称：nickname > username > uid后6位（不加前缀）
        let displayName = '';
        if (userInfo.nickname) {
          displayName = userInfo.nickname;
        } else if (userInfo.username) {
          displayName = userInfo.username;
        } else if (uid) {
          // uid兜底：只显示后6位，不加前缀
          displayName = uid.slice(-6);
        } else {
          displayName = '用户';
        }
        
        // 更新状态数据
        this.name = displayName;
        this.uid = uid;
        this.avatar = userInfo.avatar || '';
        
        // 加载订阅设置
        this.loadSubscriptionSettings();
        
      } else {
        // 未登录状态
        this.name = '未登录';
        this.uid = '';
        this.avatar = '';
      }
      
        // 输出日志
        console.log(`[PROFILE] refreshProfile authed=${this.authed} name=${this.name} uid=${this.uid}`);
        
        // 强制更新视图
        this.$forceUpdate();
        
        // 结束加载
        this.isLoading = false;
      }, 300); // 300ms延迟，确保骨架屏可见
    },
    
    // 登录状态变更事件处理
    onAuthChanged(data) {
      console.log(`[PROFILE] on AUTH_CHANGED authed=${data.authed} → refresh`);
      // 立即刷新用户数据
      this.refreshProfile();
    },
    
    // 处理登录/退出登录
    async handleAuthAction() {
      if (this.authed) {
        // 退出登录
        await this.handleLogout();
      } else {
        // 跳转登录
        this.handleLogin();
      }
    },
    
    // 处理登录
    handleLogin() {
      console.log('[PROFILE] 跳转登录页');
      
      // 埋点：点击登录按钮
      trackClick('profile_login_button', {
        from_page: '/pages/user/home'
      });
      
      uni.navigateTo({
        url: '/pages/login/login?from=' + encodeURIComponent('/pages/user/home')
      });
    },
    
    // 处理退出登录
    async handleLogout() {
      try {
        // 埋点：点击退出登录
        trackClick('profile_logout_button', {
          uid: this.uid
        });
        
        uni.showLoading({
          title: '退出中...'
        });
        
        // 清除本地登录数据 - 这会自动触发 AUTH_CHANGED 事件
        clearLoginData();
        
        console.log('[PROFILE] logout done');
        
        // 立即刷新用户数据
        this.refreshProfile();
        
        uni.hideLoading();
        
        // 埋点：退出登录成功
        trackEvent('logout_success', {
          from_page: '/pages/user/home'
        });
        
        uni.showToast({
          title: '已退出登录',
          icon: 'success',
          duration: 2000
        });
        
      } catch (error) {
        console.error('[PROFILE] 退出登录失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: '退出失败',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 页面导航
    navigateTo(url) {
      console.log('[PROFILE] 导航到:', url);
      uni.navigateTo({ url });
    },
    
    // 显示问题反馈 - 跳转到独立页面
    showFeedback() {
      console.log('[PROFILE] click feedback → /pages-sub/other/feedback');
      uni.navigateTo({
        url: '/pages-sub/other/feedback'
      });
    },
    
    // 显示订阅设置
    showSubscriptionSettings() {
      if (!this.authed) {
        this.handleLogin();
        return;
      }
      this.showSubscriptionPopup = true;
    },
    
    // 加载订阅设置
    async loadSubscriptionSettings() {
      try {
        if (typeof subscribeAPI !== 'undefined' && subscribeAPI.getSettings) {
          const settings = await subscribeAPI.getSettings();
          this.subscriptionSettings = { ...this.subscriptionSettings, ...settings };
        }
      } catch (error) {
        console.error('[PROFILE] 加载订阅设置失败:', error);
      }
    },
    
    // 更新订阅设置
    async updateSubscription() {
      try {
        if (typeof subscribeAPI !== 'undefined' && subscribeAPI.updateSettings) {
          await subscribeAPI.updateSettings(this.subscriptionSettings);
          console.log('[PROFILE] 订阅设置已更新');
        }
      } catch (error) {
        console.error('[PROFILE] 更新订阅设置失败:', error);
      }
    }
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 40rpx;
  padding-top: calc(40rpx + constant(safe-area-inset-top));
  padding-top: calc(40rpx + env(safe-area-inset-top));
  padding-bottom: calc(50px + constant(safe-area-inset-bottom) + 40rpx);
  padding-bottom: calc(50px + env(safe-area-inset-bottom) + 40rpx);
}

/* 骨架屏样式 */
.skeleton-wrapper {
  padding: 40rpx;
}

.skeleton-user-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  display: flex;
  align-items: center;
}

.skeleton-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #E5E5EA;
  margin-right: 32rpx;
  flex-shrink: 0;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.skeleton-name {
  width: 200rpx;
  height: 36rpx;
  border-radius: 8rpx;
  background: #E5E5EA;
}

.skeleton-status {
  width: 160rpx;
  height: 26rpx;
  border-radius: 8rpx;
  background: #E5E5EA;
}

.skeleton-menu {
  height: 100rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  margin-bottom: 16rpx;
}

/* 骨架屏动画 */
@keyframes skeleton-loading {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.skeleton-animation {
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

/* 用户信息卡片 */
.user-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  margin-right: 32rpx;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 60rpx;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 添加渐变动画背景 */
.avatar-placeholder::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, 
    transparent 30%, 
    rgba(255, 255, 255, 0.2) 50%, 
    transparent 70%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.avatar-text {
  font-size: 48rpx;
  font-weight: 600;
  color: #FFFFFF;
  position: relative;
  z-index: 1;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.user-status {
  font-size: 26rpx;
  color: #666;
}

.user-actions {
  flex-shrink: 0;
  min-width: 160rpx;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 16rpx 32rpx;
  border-radius: 48rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
  min-height: 88rpx;
  min-width: 144rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.login-btn {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: #FFFFFF;
}

.logout-btn {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
  border: 1rpx solid rgba(255, 59, 48, 0.2);
}

.action-btn:active {
  transform: scale(0.95);
}

/* 菜单区域 */
.menu-section,
.shortcut-section {
  margin-bottom: 40rpx;
}

.menu-title {
  margin-bottom: 24rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.menu-list {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-arrow {
  font-size: 32rpx;
  color: #C7C7CC;
  font-weight: 300;
}

/* 快捷入口 */
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

/* 小屏幕设备（宽度 <= 375px） */
@media screen and (max-width: 375px) {
  .shortcut-grid {
    gap: 16rpx;
  }
  
  .shortcut-item {
    padding: 32rpx;
  }
  
  .shortcut-icon {
    font-size: 40rpx;
  }
  
  .shortcut-text {
    font-size: 24rpx;
  }
}

/* 大屏幕设备（宽度 >= 428px） */
@media screen and (min-width: 428px) {
  .shortcut-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 32rpx;
  }
}

/* 平板设备（宽度 >= 768px） */
@media screen and (min-width: 768px) {
  .page {
    max-width: 750rpx;
    margin: 0 auto;
  }
  
  .shortcut-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.shortcut-item {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.shortcut-item:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.7);
}

.shortcut-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.shortcut-text {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

/* 弹窗样式 */
.popup-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 添加底部安全区域 */
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.popup-header {
  padding: 40rpx;
  border-bottom: 1rpx solid #eee;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.popup-close {
  position: absolute;
  right: 40rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F5F5F7;
  transition: all 0.3s ease;
}

.popup-close:active {
  transform: translateY(-50%) scale(0.9);
  background: #E5E5EA;
}

.close-icon {
  font-size: 48rpx;
  color: #86868B;
  font-weight: 300;
  line-height: 1;
}

.popup-body {
  flex: 1;
  padding: 40rpx;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 30rpx;
  color: #333;
}
</style>