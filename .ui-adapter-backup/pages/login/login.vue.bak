<template>
  <view>
    <view class="login-page">
      <!-- 主内容区 -->
      <view class="main-content">
      <!-- 品牌区 -->
      <view class="brand-section">
        <!-- Logo图片 -->
        <image 
          class="app-logo"
          src="/static/logo.png"
          mode="aspectFit"
        />
        <text class="app-name">翎心</text>
        <text class="app-subtitle">登录后可享受完整的心理健康服务</text>
      </view>

      <!-- 协议勾选区 -->
      <view class="agreement-section">
        <!-- 第一个协议勾选 - 用户协议+隐私政策 -->
        <view class="agreement-checkbox-item">
          <view class="checkbox-wrapper" @tap="toggleMainAgreement">
            <view class="checkbox" :class="{ checked: agreedMainTerms }">
              <text v-if="agreedMainTerms" class="check-icon">✓</text>
            </view>
            <text class="agreement-text">
              我已阅读并同意
              <text class="link-text" @tap.stop="navigateToAgreement('user')">《用户协议》</text>
              <text class="link-text" @tap.stop="navigateToAgreement('privacy')">《隐私政策》</text>
            </text>
          </view>
        </view>

        <!-- 第二个协议勾选 - 免责声明 -->
        <view class="agreement-checkbox-item">
          <view class="checkbox-wrapper" @tap="toggleDisclaimerAgreement">
            <view class="checkbox" :class="{ checked: agreedDisclaimer }">
              <text v-if="agreedDisclaimer" class="check-icon">✓</text>
            </view>
            <text class="agreement-text">
              我已阅读并同意
              <text class="link-text" @tap.stop="navigateToAgreement('disclaimer')">《免责声明》</text>
            </text>
          </view>
        </view>
      </view>

      <!-- 登录按钮 -->
      <view class="login-button-section">
        <button 
          class="wx-login-btn"
          :class="{ 'btn-disabled': !allAgreed || loginLoading }"
          :disabled="!allAgreed || loginLoading"
          @tap="handleWxLogin"
        >
          <!-- Loading动画 -->
          <u-loading-icon v-if="loginLoading" mode="circle" color="#667eea" size="24"></u-loading-icon>
          <text class="btn-text" :style="{ marginLeft: loginLoading ? '12rpx' : '0' }">
            {{ loginLoading ? '登录中...' : '微信一键登录' }}
          </text>
        </button>
      </view>

      <!-- 底部提示 -->
      <view class="footer-tips">
        <text class="tips-text">我们重视您的隐私与数据安全，承诺严格保护您的个人信息</text>
      </view>
      
      <!-- 游客模式入口 -->
      <view class="guest-mode-section">
        <text class="guest-mode-link" @tap="handleGuestMode">以游客模式浏览 ></text>
      </view>
      
    </view><!-- 结束main-content -->
    </view><!-- 结束login-page -->
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
  saveLoginData,
  hasConsent,
  saveConsent,
  getConsentData
} from '@/utils/auth.js';
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { trackEvent, trackLogin, trackClick } from '@/utils/analytics.js';

export default {
  data() {
    console.log('__LOGIN_PAGE_ACTIVE__');
    
    return {
      // 协议相关 - 双勾选框
      agreedMainTerms: false,    // 用户协议+隐私政策
      agreedDisclaimer: false,   // 免责声明
      consentVersion: '1.0.0',
      
      // 登录状态
      loginLoading: false,
      
      // 来源页面
      fromPage: '',
      
      // 重试相关
      retryCount: 0,
      maxRetries: 3,
      retryDelay: 1000 // 1秒
    };
  },
  
  computed: {
    // 所有协议是否都已同意
    allAgreed() {
      return this.agreedMainTerms && this.agreedDisclaimer;
    },
    
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
    }
  },
  
  onLoad(options) {
    console.log('[LOGIN_PAGE] 页面加载，参数:', options);
    
    // 记录来源页面
    if (options.from) {
      this.fromPage = decodeURIComponent(options.from);
      console.log('[LOGIN_PAGE] 来源页面:', this.fromPage);
    }
    
    // 检查初始状态
    this.checkInitialState();
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
    // 检查初始状态
    async checkInitialState() {
      try {
        // 检查本地存储的协议同意状态
        const agreement = uni.getStorageSync('userAgreement');
        if (agreement) {
          this.agreedMainTerms = agreement.mainTerms || false;
          this.agreedDisclaimer = agreement.disclaimer || false;
        }
        
        // 如果已经登录，直接跳转到首页
        if (isAuthed()) {
          console.log('[LOGIN_PAGE] 用户已登录，跳转首页');
          uni.showToast({
            title: '您已登录',
            icon: 'success'
          });
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/home/home',
              fail: () => {
                uni.reLaunch({ url: '/pages/home/home' });
              }
            });
          }, 1500);
        }
      } catch (error) {
        console.error('[LOGIN_PAGE] 检查初始状态失败:', error);
      }
    },
    
    
    // 切换主要协议状态（用户协议+隐私政策）
    toggleMainAgreement() {
      this.agreedMainTerms = !this.agreedMainTerms;
      console.log('[LOGIN_PAGE] 主要协议状态:', this.agreedMainTerms);
      this.updateAgreementStorage();
    },
    
    // 切换免责声明状态
    toggleDisclaimerAgreement() {
      this.agreedDisclaimer = !this.agreedDisclaimer;
      console.log('[LOGIN_PAGE] 免责声明状态:', this.agreedDisclaimer);
      this.updateAgreementStorage();
    },
    
    // 更新协议同意状态到本地存储
    updateAgreementStorage() {
      const agreementData = {
        mainTerms: this.agreedMainTerms,
        disclaimer: this.agreedDisclaimer,
        allAgreed: this.allAgreed,
        timestamp: Date.now(),
        version: this.consentVersion
      };
      uni.setStorageSync('userAgreement', agreementData);
      
      // 如果全部同意，保存同意状态
      if (this.allAgreed) {
        const consentData = {
          agreed: true,
          agreedAt: Date.now(),
          version: this.consentVersion,
          agreements: {
            userAgreement: true,
            privacyPolicy: true,
            disclaimer: true
          },
          synced: false
        };
        saveConsent(consentData);
      }
    },
    
    // 跳转到协议页面
    navigateToAgreement(type) {
      console.log('[LOGIN_PAGE] 跳转到协议页面:', type);
      
      let url = '';
      switch(type) {
        case 'user':
          url = '/pages-sub/consent/user-agreement';
          break;
        case 'privacy':
          url = '/pages-sub/consent/privacy-policy';
          break;
        case 'disclaimer':
          url = '/pages-sub/consent/disclaimer';
          break;
        default:
          console.error('[LOGIN_PAGE] 未知协议类型:', type);
          return;
      }
      
      uni.navigateTo({
        url: url,
        fail: (err) => {
          console.error('[LOGIN_PAGE] 跳转失败:', err);
          uni.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 获取微信code（带超时控制）
    async getWxCode(timeout = 6000) {
      return new Promise((resolve, reject) => {
        // 设置超时定时器
        const timer = setTimeout(() => {
          reject(new Error('网络请求超时，请检查网络连接后重试'));
        }, timeout);
        
        // #ifdef MP-WEIXIN
        wx.login({
          success: (res) => {
            clearTimeout(timer);
            if (!res.code) {
              reject(new Error('获取微信授权码失败，请重试'));
            } else {
              resolve(res);
            }
          },
          fail: (err) => {
            clearTimeout(timer);
            console.error('[LOGIN_PAGE] wx.login fail:', err);
            reject(new Error('微信授权失败，请重试'));
          }
        });
        // #endif
        // #ifndef MP-WEIXIN
        clearTimeout(timer);
        reject(new Error('当前环境不支持微信登录'));
        // #endif
      });
    },
    
    // 延迟执行
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // 微信登录处理（带重试机制）
    async handleWxLogin() {
      console.log('[LOGIN_PAGE] 点击登录按钮');
      console.log('[LOGIN_PAGE] 主要协议:', this.agreedMainTerms, '免责声明:', this.agreedDisclaimer);
      
      // 埋点：登录按钮点击
      trackClick('login_button', {
        agreed_main: this.agreedMainTerms,
        agreed_disclaimer: this.agreedDisclaimer
      });
      
      if (!this.allAgreed) {
        console.log('[LOGIN_PAGE] 协议未全部同意');
        uni.showToast({
          title: '请同意所有服务协议',
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
      this.retryCount = 0;
      console.log('[LOGIN_PAGE] 开始微信登录流程');
      
      // 使用重试机制
      await this.attemptLogin();
    },
    
    // 尝试登录（支持重试）
    async attemptLogin() {
      try {
        // 1. 获取微信登录code（带超时控制）
        console.log('[LOGIN_PAGE] 调用 getWxCode, retry:', this.retryCount);
        const { code } = await this.getWxCode(6000);
        
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
            data: { code },
            timeout: 10000 // 10秒超时
          });
          result = cloudResult || {};
        }
        
        console.log('[LOGIN_PAGE] 登录接口返回 errCode:', result.errCode, 'type:', typeof result.errCode);
        
        // 处理特殊错误码
        if (result.errCode === 40163 || result.errMsg?.includes('code been used')) {
          // code已使用或过期，自动重试
          console.warn('[LOGIN_PAGE] code过期，自动重试');
          throw new Error('CODE_EXPIRED');
        }
        
        if (result.errCode === 500 || result.errCode === -1) {
          // 服务器错误
          throw new Error('服务器繁忙，请稍后重试');
        }
        
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
          
          // 埋点：登录成功
          trackLogin('wechat', true, {
            is_new_user: result.data.isNewUser,
            uid: savedData.uid,
            retry_count: this.retryCount
          });
          
          // 显示成功提示（带动画）
          uni.showToast({
            title: result.data.isNewUser ? '🎉 欢迎加入翎心！' : '✨ 欢迎回来！',
            icon: 'success',
            duration: 1500,
            mask: true
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
                  uni.reLaunch({
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
        // 判断是否可以重试
        const canRetry = this.retryCount < this.maxRetries;
        const isRetriableError = 
          error.message === 'CODE_EXPIRED' ||
          error.message.includes('超时') ||
          error.message.includes('网络') ||
          error.message.includes('服务器繁忙');
        
        if (canRetry && isRetriableError) {
          // 自动重试
          this.retryCount++;
          console.log(`[LOGIN_PAGE] 登录失败，${this.retryDelay}ms后进行第${this.retryCount}次重试`);
          
          // 显示重试提示
          uni.showToast({
            title: `登录失败，正在重试(${this.retryCount}/${this.maxRetries})...`,
            icon: 'none',
            duration: 1000
          });
          
          // 延迟后重试
          await this.delay(this.retryDelay);
          return await this.attemptLogin();
        } else {
          // 不可重试或达到最大重试次数
          const errorMsg = error.message || '登录失败';
          console.error('[LOGIN_PAGE] 登录最终失败:', errorMsg, 'retryCount:', this.retryCount);
          
          // 埋点：登录失败
          trackLogin('wechat', false, {
            error_message: errorMsg,
            retry_count: this.retryCount,
            error_type: error.message === 'CODE_EXPIRED' ? 'code_expired' : 'other'
          });
          
          // 记录错误日志（用于后续的错误上报功能）
          this.logLoginError(error);
          
          // 显示错误提示
          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          });
        }
      } finally {
        this.loginLoading = false;
      }
    },
    
    // 记录登录错误（为未来的错误上报做准备）
    logLoginError(error) {
      try {
        const errorLog = {
          type: 'login_error',
          message: error.message || '未知错误',
          stack: error.stack,
          retryCount: this.retryCount,
          timestamp: Date.now(),
          userAgent: uni.getSystemInfoSync()
        };
        
        console.log('[LOGIN_PAGE] Error Log:', errorLog);
        
        // TODO: 在实现error-report云函数后，上报错误日志
        // callCloudFunction('error-report', errorLog);
      } catch (e) {
        console.error('[LOGIN_PAGE] logLoginError failed:', e);
      }
    },
    
    // 游客模式入口
    handleGuestMode() {
      console.log('[LOGIN_PAGE] 进入游客模式');
      
      // 埋点：游客模式点击
      trackClick('guest_mode_link');
      
      uni.showModal({
        title: '游客模式',
        content: '游客模式下您可以浏览部分内容，但无法使用评估、AI对话等核心功能。确定以游客模式继续？',
        confirmText: '确定',
        cancelText: '返回登录',
        success: (res) => {
          if (res.confirm) {
            // 设置游客模式标记
            uni.setStorageSync('guest_mode', true);
            
            // 埋点：游客模式进入
            trackEvent('guest_mode_enter', {
              from_page: 'login'
            });
            
            // 跳转到首页
            uni.switchTab({
              url: '/pages/home/home',
              success: () => {
                uni.showToast({
                  title: '已进入游客模式',
                  icon: 'none',
                  duration: 2000
                });
              }
            });
          } else {
            // 埋点：取消游客模式
            trackEvent('guest_mode_cancel');
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  /* 添加安全区域适配 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 主内容区 */
.main-content {
  flex: 1;
  padding: 60rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* 确保在刘海屏设备上内容不被遮挡 */
  min-height: calc(100vh - constant(safe-area-inset-top) - constant(safe-area-inset-bottom));
  min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
}


/* 品牌区 */
.brand-section {
  text-align: center;
  margin-bottom: 60rpx;
}

/* Logo图片 */
.app-logo {
  width: 140rpx;
  height: 140rpx;
  margin: 0 auto 32rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.95);
  padding: 20rpx;
  box-sizing: border-box;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

/* 协议勾选区 */
.agreement-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8rpx;  /* 减小间距让两个勾选项更靠近 */
  margin-bottom: 48rpx;
}

.agreement-checkbox-item {
  /* 删除半透明背景和边框样式 */
  padding: 8rpx 0;  /* 保留少量垂直padding作为点击区域 */
}

.app-logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  margin-bottom: 32rpx;
}

.app-name {
  display: block;
  font-size: 56rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 16rpx;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.app-subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

/* 协议勾选区 */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  /* 扩大触摸区域，确保足够的点击空间 */
  min-height: 88rpx; /* 至少44px触摸区域 */
  padding: 8rpx 0;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.8);  /* 增强边框对比度 */
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.15);  /* 稍微增强背景 */
  /* 使用伪元素扩大点击区域 */
  position: relative;
}

.checkbox::before {
  content: '';
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  bottom: -10rpx;
  left: -10rpx;
}

.checkbox.checked {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.9);
}

.check-icon {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 600;
}

.agreement-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.link-text {
  color: #FFFFFF;
  text-decoration: underline;
  font-weight: 500;
  margin: 0 4rpx;
}

/* 登录按钮区 */
.login-button-section {
  width: 100%;
  margin-bottom: 40rpx;
}

.wx-login-btn {
  width: 100%;
  height: 96rpx;
  background: #FFFFFF;
  border: none;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  /* 确保loading和文本能正确显示 */
  padding: 0 32rpx;
}

.wx-login-btn:not(.btn-disabled):active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
}

.wx-login-btn.btn-disabled {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: none;
  opacity: 0.6;
}


/* 响应式布局 */
/* 小屏幕设备 (iPhone SE, iPhone 8等，宽度 <= 375px) */
@media screen and (max-width: 375px) {
  .main-content {
    padding: 40rpx 32rpx 32rpx;
  }
  
  .app-logo {
    width: 100rpx;
    height: 100rpx;
  }
  
  .app-name {
    font-size: 48rpx;
  }
  
  .app-subtitle {
    font-size: 26rpx;
  }
  
  .agreement-text {
    font-size: 24rpx;
  }
  
  .checkbox {
    width: 32rpx;
    height: 32rpx;
  }
}

/* 大屏幕设备 (iPhone 14 Pro Max等，宽度 >= 430px) */
@media screen and (min-width: 430px) {
  .main-content {
    padding: 80rpx 60rpx 60rpx;
    max-width: 750rpx;
    margin: 0 auto;
  }
  
  .app-logo {
    width: 160rpx;
    height: 160rpx;
  }
  
  .app-name {
    font-size: 64rpx;
  }
  
  .wx-login-btn {
    height: 104rpx;
  }
}

/* 小高度设备（横屏或小屏手机） */
@media screen and (max-height: 600px) {
  .main-content {
    padding: 20rpx;
  }
  
  .brand-section {
    margin-bottom: 30rpx;
  }
  
  .app-logo {
    width: 100rpx;
    height: 100rpx;
  }
  
  .app-name {
    font-size: 44rpx;
  }
  
  .agreement-section {
    margin-bottom: 32rpx;
  }
  
  .login-button-section {
    margin-bottom: 24rpx;
  }
}

/* 平板设备（iPad等，宽度 >= 768px） */
@media screen and (min-width: 768px) {
  .login-page {
    align-items: center;
    justify-content: center;
  }
  
  .main-content {
    max-width: 600rpx;
    padding: 100rpx 80rpx;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 48rpx;
    backdrop-filter: blur(20rpx);
  }
}

.btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.wx-login-btn.btn-disabled .btn-text {
  color: rgba(102, 126, 234, 0.5);
  -webkit-text-fill-color: rgba(102, 126, 234, 0.5);
}

/* 底部提示 */
.footer-tips {
  text-align: center;
  padding: 32rpx 40rpx 16rpx;
}

.tips-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

/* 游客模式入口 */
.guest-mode-section {
  text-align: center;
  padding: 0 40rpx 32rpx;
}

.guest-mode-link {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
  display: inline-block;
  padding: 12rpx 24rpx;
  min-height: 88rpx; /* 确保足够的触摸区域 */
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.guest-mode-link:active {
  opacity: 0.7;
}


/* 添加按钮点击效果 */
button::after {
  border: none;
}

</style>