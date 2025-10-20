<template>
  <view class="login-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar" :style="{ height: navHeight + 'px', paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-content" :style="{ height: navContentHeight + 'px' }">
        <view class="nav-left" @tap="handleBack">
          <text class="back-icon">‹</text>
        </view>
        <view class="nav-title">
          <text class="title-text">登录翎心</text>
        </view>
        <view class="nav-right"></view>
      </view>
    </view>

    <!-- 主内容区 -->
    <view class="main-content">
      <!-- 品牌区 -->
      <view class="brand-card">
        <image class="app-logo" src="/static/logo.png" mode="aspectFit"></image>
        <text class="app-name">翎心</text>
        <text class="app-subtitle">心理健康助手</text>
      </view>

      <!-- 协议勾选区 -->
      <view class="agreement-card">
        <view class="checkbox-wrapper" @tap="toggleAgreement">
          <view class="checkbox" :class="{ checked: agreedTerms }">
            <text v-if="agreedTerms" class="check-icon">✓</text>
          </view>
          <text class="agreement-text">
            我已阅读并同意
            <text class="link-text" @tap.stop="showAgreement('user')">《用户协议》</text>
            <text class="link-text" @tap.stop="showAgreement('privacy')">《隐私政策》</text>
            <text class="link-text" @tap.stop="showAgreement('disclaimer')">《免责声明》</text>
          </text>
        </view>
      </view>

      <!-- 登录按钮 -->
      <view class="login-card">
        <button 
          class="wx-login-btn"
          :class="{ 'btn-disabled': !agreedTerms || loginLoading }"
          :disabled="!agreedTerms || loginLoading"
          @tap="handleWxLogin"
        >
          <text class="btn-text">{{ loginLoading ? '登录中...' : '微信一键登录' }}</text>
          <view v-if="loginLoading" class="loading-icon">⏳</view>
        </button>
      </view>

      <!-- 调试信息区 -->
      <view class="debug-card">
        <view class="debug-header">
          <text class="debug-title">调试信息</text>
        </view>
        <view class="debug-item">
          <text class="debug-label">登录状态：</text>
          <text class="debug-value">{{ isLoggedIn ? '已登录' : '未登录' }}</text>
        </view>
        <view class="debug-item">
          <text class="debug-label">Token长度：</text>
          <text class="debug-value">{{ tokenLength }}</text>
        </view>
        <view class="debug-item">
          <text class="debug-label">Token过期：</text>
          <text class="debug-value">{{ tokenExpiredText }}</text>
        </view>
        <view class="debug-item">
          <text class="debug-label">用户ID：</text>
          <text class="debug-value">{{ currentUid || '无' }}</text>
        </view>
        <view class="debug-item">
          <text class="debug-label">协议状态：</text>
          <text class="debug-value">{{ agreedTerms ? '已同意' : '未同意' }}</text>
        </view>
        <view class="debug-item">
          <text class="debug-label">按钮状态：</text>
          <text class="debug-value">{{ (!agreedTerms || loginLoading) ? '禁用' : '可用' }}</text>
        </view>
      </view>
    </view>

    <!-- 协议弹窗 -->
    <u-popup 
      v-model="showAgreementPopup" 
      mode="center" 
      width="90%" 
      height="70%" 
      border-radius="24"
      closeable
    >
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">{{ currentAgreementTitle }}</text>
        </view>
        <scroll-view class="popup-body" scroll-y>
          <text class="popup-text">{{ currentAgreementContent }}</text>
        </scroll-view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import { authAPI } from '@/utils/request.js';
import { 
  isAuthed, 
  getToken, 
  getTokenExpired, 
  getUid, 
  getUserInfo,
  getLoginData,
  saveLoginData 
} from '@/utils/auth.js';

export default {
  data() {
    console.log('__LOGIN_PAGE_ACTIVE__');
    
    return {
      // 导航栏数据
      statusBarHeight: 0,
      navHeight: 0,
      navContentHeight: 0,
      capsuleInfo: null,
      
      // 协议相关
      agreedTerms: false,
      showAgreementPopup: false,
      currentAgreementType: '',
      
      // 登录状态
      loginLoading: false,
      
      // 来源页面
      fromPage: '',
      
      // 协议内容
      agreements: {
        user: {
          title: '用户协议',
          content: `欢迎使用"翎心心理健康助手"。本协议是用户与本应用之间关于使用服务的约定。

用户必须遵守国家法律法规。

本应用仅提供心理减压辅助，不能替代医疗诊断。

用户需妥善保管账号及登录凭证。

用户同意不利用本应用从事违法活动。

本应用保留在法律允许范围内的解释权。`
        },
        privacy: {
          title: '隐私政策',
          content: `我们高度重视您的隐私。本政策说明我们如何收集、使用、存储和保护您的个人信息。

收集信息类型：账号信息、登录凭证、使用日志。

使用目的：提供核心功能、改进服务体验。

存储与安全：数据存储在云端，采取合理安全措施。

用户权利：查询、更正、删除个人信息。

政策更新：如有变更，将通过应用公告通知。`
        },
        disclaimer: {
          title: '免责声明',
          content: `本应用为心理健康辅助工具，不构成专业医疗建议。

用户因使用本应用进行的任何决策或行为产生的后果，由用户自行承担。

因不可抗力或第三方原因导致的服务中断或数据丢失，本应用不承担责任。

用户违反本协议造成的损失，由用户自行负责。

在法律允许范围内，本应用对使用过程中可能产生的直接或间接损失不承担责任。`
        }
      }
    };
  },
  
  computed: {
    // 登录状态 - 必须以 isAuthed() 为准
    isLoggedIn() {
      return isAuthed();
    },
    
    // Token长度
    tokenLength() {
      const token = getToken();
      return token ? token.length : 0;
    },
    
    // Token过期时间
    tokenExpiredText() {
      const expired = getTokenExpired();
      if (!expired) return '未设置';
      
      const date = new Date(expired);
      return date.toLocaleString();
    },
    
    // 当前用户ID
    currentUid() {
      return getUid();
    },
    
    // 当前协议标题
    currentAgreementTitle() {
      return this.agreements[this.currentAgreementType]?.title || '';
    },
    
    // 当前协议内容
    currentAgreementContent() {
      return this.agreements[this.currentAgreementType]?.content || '';
    }
  },
  
  onLoad(options) {
    console.log('[LOGIN_PAGE] 页面加载，参数:', options);
    
    // 记录来源页面
    if (options.from) {
      this.fromPage = decodeURIComponent(options.from);
      console.log('[LOGIN_PAGE] 来源页面:', this.fromPage);
    }
    
    // 初始化导航栏
    this.initNavbar();
    
    this.checkAgreementStatus();
  },
  
  onShow() {
    console.log('[LOGIN_PAGE] 页面显示，刷新调试信息');
    
    // 刷新登录状态和调试信息
    const loginData = getLoginData();
    const authed = isAuthed();
    const expiredStr = loginData.tokenExpired ? 
      new Date(loginData.tokenExpired).toLocaleString('zh-CN') : '无';
    
    console.log(`[LOGIN_PAGE] onShow authed=${authed} tokenLen=${loginData.token ? loginData.token.length : 0} expired=${expiredStr} uid=${loginData.uid || ''}`);
    
    this.$forceUpdate();
  },
  
  methods: {
    // 初始化导航栏
    initNavbar() {
      try {
        const systemInfo = wx.getSystemInfoSync();
        this.statusBarHeight = systemInfo.statusBarHeight || 0;
        
        // 获取胶囊信息
        this.capsuleInfo = wx.getMenuButtonBoundingClientRect();
        
        // 导航内容高度 = 胶囊高度
        this.navContentHeight = this.capsuleInfo.height;
        
        // 总导航高度 = 状态栏高度 + 胶囊高度 + 胶囊顶部到状态栏的距离
        const capsuleTop = this.capsuleInfo.top - this.statusBarHeight;
        this.navHeight = this.statusBarHeight + this.capsuleInfo.height + capsuleTop * 2;
        
        console.log('[LOGIN_PAGE] 导航栏初始化完成', {
          statusBarHeight: this.statusBarHeight,
          navHeight: this.navHeight,
          navContentHeight: this.navContentHeight,
          capsuleInfo: this.capsuleInfo
        });
      } catch (error) {
        console.error('[LOGIN_PAGE] 导航栏初始化失败:', error);
        // 设置默认值
        this.statusBarHeight = 20;
        this.navHeight = 64;
        this.navContentHeight = 44;
      }
    },
    
    // 返回按钮处理
    handleBack() {
      const pages = getCurrentPages();
      console.log('[LOGIN_PAGE] 当前页面栈长度:', pages.length);
      
      if (pages.length > 1) {
        console.log('[LOGIN_PAGE] 页面栈>1，执行 navigateBack');
        uni.navigateBack();
      } else {
        console.log('[LOGIN_PAGE] 页面栈=1，跳转个人中心页');
        // #ifdef MP-WEIXIN
        wx.reLaunch({
          url: '/pages/user/home'
        });
        // #endif
        // #ifndef MP-WEIXIN
        uni.reLaunch({
          url: '/pages/user/home'
        });
        // #endif
      }
    },
    
    // 检查协议同意状态
    checkAgreementStatus() {
      try {
        const agreement = uni.getStorageSync('userAgreement');
        if (agreement && agreement.agreed) {
          this.agreedTerms = true;
          console.log('[LOGIN_PAGE] 用户已同意协议');
        }
      } catch (error) {
        console.error('[LOGIN_PAGE] 检查协议状态失败:', error);
      }
    },
    
    // 切换协议同意状态
    toggleAgreement() {
      this.agreedTerms = !this.agreedTerms;
      console.log('[LOGIN_PAGE] 协议状态切换为:', this.agreedTerms);
      
      // 保存协议同意状态
      try {
        uni.setStorageSync('userAgreement', {
          agreed: this.agreedTerms,
          timestamp: Date.now()
        });
        console.log('[LOGIN_PAGE] 协议状态已保存:', this.agreedTerms);
        
        // 强制更新视图
        this.$forceUpdate();
      } catch (error) {
        console.error('[LOGIN_PAGE] 保存协议状态失败:', error);
      }
    },
    
    // 显示协议弹窗
    showAgreement(type) {
      this.currentAgreementType = type;
      this.showAgreementPopup = true;
      console.log('[LOGIN_PAGE] 显示协议弹窗:', type);
    },
    
    // 微信登录处理
    async handleWxLogin() {
      console.log('[LOGIN_PAGE] 点击登录按钮，协议状态:', this.agreedTerms, '加载状态:', this.loginLoading);
      
      if (!this.agreedTerms) {
        console.log('[LOGIN_PAGE] 协议未同意，显示提示');
        wx.showToast({
          title: '请先同意相关协议',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      if (this.loginLoading) {
        console.log('[LOGIN_PAGE] 正在登录中，忽略重复点击');
        return;
      }
      
      this.loginLoading = true;
      console.log('[LOGIN_PAGE] 开始微信登录流程');
      
      try {
        // 1. 获取微信登录code
        console.log('[LOGIN_PAGE] 调用 wx.login');
        const { code } = await new Promise((resolve, reject) => {
          // #ifdef MP-WEIXIN
          wx.login({
            success: resolve,
            fail: reject
          });
          // #endif
          // #ifndef MP-WEIXIN
          reject(new Error('当前环境不支持微信登录'));
          // #endif
        });
        
        console.log('[LOGIN_PAGE] 微信登录开始 code=' + (code ? code.substring(0, 6) : 'null'));
        
        // 2. 调用登录接口
        let result;
        if (typeof authAPI !== 'undefined' && authAPI.wxLogin) {
          // 使用封装的登录方法
          console.log('[LOGIN_PAGE] 使用 authAPI.wxLogin');
          const loginData = await authAPI.wxLogin(code);
          result = { errCode: 0, data: loginData };
        } else {
          // 直接调用云函数
          console.log('[LOGIN_PAGE] 直接调用 uniCloud.callFunction');
          const { result: cloudResult } = await uniCloud.callFunction({
            name: 'auth-login',
            data: { code }
          });
          result = cloudResult || {};
        }
        
        console.log('[LOGIN_PAGE] 登录接口返回 errCode:', result.errCode, 'type:', typeof result.errCode);
        
        // 3. 严格判断成功条件
        const isSuccess = Number(result.errCode) === 0 && result.data;
        console.log('[LOGIN_PAGE] 成功判断结果:', isSuccess);
        
        if (isSuccess) {
          // 保存登录数据 - 同步写入
          const savedData = saveLoginData(result.data);
          console.log(`[LOGIN_PAGE] success uid=${savedData.uid || 'unknown'}`);
          
          // 立即校验写入结果
          const authed = isAuthed();
          const tokenLen = savedData.token ? savedData.token.length : 0;
          console.log(`[LOGIN_PAGE] post-save authed=${authed} uid=${savedData.uid || ''} tokenLen=${tokenLen}`);
          
          // 确保写入成功后再继续
          if (!authed) {
            throw new Error('登录数据写入失败');
          }
          
          // 发送全局事件并等待事件处理完成
          uni.$emit('AUTH_CHANGED', { authed: true });
          console.log('[LOGIN_PAGE] emit AUTH_CHANGED { authed:true }');
          
          // 显示成功提示
          uni.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500
          });
          
          // 使用 Promise.resolve() 确保下一帧执行，让事件传播完成
          Promise.resolve().then(() => {
            setTimeout(() => {
              // 个人中心是tabBar页面，必须使用switchTab
              uni.switchTab({
                url: '/pages/user/home',
                success: () => {
                  console.log('[LOGIN_PAGE] nav=switchTab');
                },
                fail: (err) => {
                  console.error('[LOGIN_PAGE] switchTab失败:', err);
                  // 降级方案
                  wx.reLaunch({
                    url: '/pages/user/home'
                  });
                  console.log('[LOGIN_PAGE] nav=reLaunch');
                }
              });
            }, 200); // 增加延迟，确保事件处理完成
          });
        } else {
          // 登录失败
          const errorMsg = result?.errMsg || '登录服务异常';
          console.log('[LOGIN_PAGE] 登录失败:', errorMsg);
          throw new Error(errorMsg);
        }
        
      } catch (error) {
        // 统一错误处理
        const errorMsg = error.message || '登录失败';
        console.log('[LOGIN_PAGE] 登录失败:', errorMsg);
        
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.loginLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #FFFFFF;
  position: relative;
}

/* 自定义导航栏 */
.custom-navbar {
  background: #FFFFFF;
  position: relative;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
}

.nav-left {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(20rpx);
}

.back-icon {
  font-size: 48rpx;
  color: #333;
  font-weight: 300;
}

.nav-title {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.title-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 88rpx;
  height: 88rpx;
}

/* 主内容区 */
.main-content {
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

/* 液态玻璃卡片基础样式 */
.brand-card,
.agreement-card,
.login-card,
.debug-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

/* 品牌区 */
.brand-card {
  text-align: center;
}

.app-logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  margin-bottom: 32rpx;
}

.app-name {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
}

.app-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

/* 协议勾选区 */
.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  margin-top: 4rpx;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.checkbox.checked {
  background: #007aff;
  border-color: #007aff;
}

.check-icon {
  font-size: 24rpx;
  color: #fff;
  font-weight: 600;
}

.agreement-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: #333;
}

.link-text {
  color: #007aff;
  text-decoration: underline;
  margin: 0 8rpx;
}

/* 登录按钮区 */
.login-card {
  padding: 20rpx 40rpx;
}

.wx-login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #07C160, #00AE66);
  border: none;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
}

.wx-login-btn:not(.btn-disabled):active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.4);
}

.wx-login-btn.btn-disabled {
  background: #C7C7CC;
  box-shadow: none;
  opacity: 0.6;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  margin-right: 16rpx;
}

.loading-icon {
  font-size: 28rpx;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 调试信息区 */
.debug-header {
  margin-bottom: 24rpx;
}

.debug-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.debug-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.debug-label {
  font-size: 26rpx;
  color: #666;
}

.debug-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

/* 协议弹窗 */
.popup-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  padding: 40rpx;
  border-bottom: 1rpx solid #eee;
  flex-shrink: 0;
}

.popup-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.popup-body {
  flex: 1;
  padding: 40rpx;
}

.popup-text {
  font-size: 28rpx;
  line-height: 1.8;
  color: #333;
  white-space: pre-line;
}
</style>