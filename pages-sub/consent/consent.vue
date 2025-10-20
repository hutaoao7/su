<template>
  <view class="consent-page">
    <view class="bg-decoration"></view>
    
    <view class="brand-section">
      <image src="/static/logo.png" class="app-logo" mode="aspectFit"></image>
      <text class="app-name">翎心</text>
      <text class="app-subtitle">心理健康助手</text>
    </view>

    <view class="welcome-section">
      <text class="welcome-title">欢迎使用翎心</text>
      <text class="welcome-text">
        在开始使用之前，请仔细阅读以下协议。我们重视您的隐私和数据安全，承诺严格保护您的个人信息。
      </text>
    </view>

    <view class="agreements-section">
      <view class="section-title">
        <text class="title-text">服务协议</text>
        <text class="title-desc">点击查看详细内容</text>
      </view>
      
      <view class="agreement-card" @tap="navigateToAgreement('privacy')">
        <view class="card-icon">📄</view>
        <view class="card-content">
          <text class="card-title">隐私政策</text>
          <text class="card-desc">了解我们如何收集、使用和保护您的信息</text>
        </view>
        <view class="card-arrow">
          <text class="arrow-icon">›</text>
        </view>
      </view>

      <view class="agreement-card" @tap="navigateToAgreement('user')">
        <view class="card-icon">📋</view>
        <view class="card-content">
          <text class="card-title">用户协议</text>
          <text class="card-desc">使用本应用的服务条款和用户责任</text>
        </view>
        <view class="card-arrow">
          <text class="arrow-icon">›</text>
        </view>
      </view>

      <view class="agreement-card" @tap="navigateToAgreement('disclaimer')">
        <view class="card-icon">⚠️</view>
        <view class="card-content">
          <text class="card-title">免责声明</text>
          <text class="card-desc">重要提示和责任说明</text>
        </view>
        <view class="card-arrow">
          <text class="arrow-icon">›</text>
        </view>
      </view>
    </view>

    <view class="consent-checkbox-section">
      <view class="checkbox-container" @tap="toggleAgree">
        <view class="checkbox" :class="{ checked: agreed }">
          <text v-if="agreed" class="check-icon">✓</text>
        </view>
        <text class="checkbox-text">
          我已仔细阅读并同意以上全部协议
        </text>
      </view>
    </view>

    <view class="buttons-section">
      <button 
        class="agree-button"
        :class="{ disabled: !agreed || saving }"
        :disabled="!agreed || saving"
        @tap="handleAgree"
      >
        {{ saving ? '处理中...' : '同意并继续' }}
      </button>

      <view class="decline-section">
        <text class="decline-text" @tap="handleDecline">不同意</text>
      </view>
    </view>

    <view class="footer-tip">
      <text class="tip-text">您的隐私和数据安全是我们的首要任务</text>
    </view>
  </view>
</template>

<script>
import { saveConsent, hasConsent, isAuthed } from '@/utils/auth.js';
import { callCloudFunction } from '@/utils/unicloud-handler.js';

export default {
  name: 'ConsentPage',
  
  data() {
    return {
      agreed: false,
      saving: false,
      consentVersion: '1.0.0',
      fromPage: ''
    };
  },
  
  onLoad(options) {
    console.log('[CONSENT] 页面加载');
    
    if (hasConsent()) {
      console.log('[CONSENT] 已同意，跳转首页');
      uni.showToast({
        title: '您已同意协议',
        icon: 'success'
      });
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/home/home' });
      }, 1500);
      return;
    }
    
    if (options.from) {
      this.fromPage = decodeURIComponent(options.from);
    }
  },
  
  methods: {
    toggleAgree() {
      this.agreed = !this.agreed;
    },
    
    navigateToAgreement(type) {
      const urls = {
        privacy: '/pages/consent/privacy-policy',
        user: '/pages/consent/user-agreement',
        disclaimer: '/pages/consent/disclaimer'
      };
      
      uni.navigateTo({ url: urls[type] });
    },
    
    async handleAgree() {
      if (!this.agreed || this.saving) {
        return;
      }
      
      try {
        this.saving = true;
        
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
        
        if (isAuthed()) {
          try {
            const result = await callCloudFunction('consent-record', {
              agreed: true,
              version: this.consentVersion,
              agreedAt: Date.now()
            }, {
              showLoading: false,
              timeout: 5000
            });
            
            if (result && result.recordId) {
              consentData.synced = true;
              consentData.recordId = result.recordId;
              saveConsent(consentData);
            }
          } catch (syncError) {
            console.warn('[CONSENT] 同步失败:', syncError);
          }
        }
        
        uni.showToast({
          title: '感谢您的同意',
          icon: 'success'
        });
        
        setTimeout(() => {
          uni.reLaunch({ url: this.fromPage || '/pages/home/home' });
        }, 1500);
        
        this.saving = false;
        
      } catch (error) {
        console.error('[CONSENT] 处理失败:', error);
        this.saving = false;
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      }
    },
    
    handleDecline() {
      uni.showModal({
        title: '游客模式',
        content: '未同意协议将以游客身份使用，部分功能将受到限制。确定继续吗？',
        confirmText: '游客模式',
        success: (res) => {
          if (res.confirm) {
            saveConsent({
              agreed: false,
              guestMode: true,
              timestamp: Date.now()
            });
            uni.reLaunch({ url: '/pages/home/home?mode=guest' });
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.consent-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
}

.bg-decoration {
  position: absolute;
  top: -200rpx;
  right: -200rpx;
  width: 600rpx;
  height: 600rpx;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.brand-section {
  text-align: center;
  padding: 100rpx 0 60rpx;
}

.app-logo {
  width: 140rpx;
  height: 140rpx;
  border-radius: 28rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

.app-name {
  display: block;
  font-size: 64rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 16rpx;
}

.app-subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
}

.welcome-section {
  margin: 0 0 40rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 48rpx;
}

.welcome-title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.welcome-text {
  display: block;
  font-size: 28rpx;
  line-height: 1.7;
  color: #666;
}

.section-title {
  padding: 0 8rpx 24rpx;
}

.title-text {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 8rpx;
}

.title-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.agreement-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
}

.card-icon {
  font-size: 48rpx;
  width: 80rpx;
  text-align: center;
}

.card-content {
  flex: 1;
  margin: 0 24rpx;
}

.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.card-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.card-arrow {
  flex-shrink: 0;
}

.arrow-icon {
  font-size: 56rpx;
  color: #C7C7CC;
}

.consent-checkbox-section {
  margin: 40rpx 0 32rpx;
}

.checkbox-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
}

.checkbox {
  width: 44rpx;
  height: 44rpx;
  border: 3rpx solid #D1D1D6;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  background: #FFFFFF;
}

.checkbox.checked {
  background: #667eea;
  border-color: #667eea;
}

.check-icon {
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: 700;
}

.checkbox-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.agree-button {
  width: 100%;
  height: 96rpx;
  background: #FFFFFF;
  color: #667eea;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.agree-button.disabled {
  background: rgba(255, 255, 255, 0.5);
  color: rgba(102, 126, 234, 0.5);
}

.decline-section {
  text-align: center;
  padding: 32rpx 0;
}

.decline-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: underline;
}

.footer-tip {
  text-align: center;
  padding: 32rpx 0 60rpx;
}

.tip-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>

