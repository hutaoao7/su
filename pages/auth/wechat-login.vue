<template>
  <view class="page">
    <view class="title">登录</view>
    <view class="card">
      <view class="agreement-section">
        <view class="checkbox-wrapper" @click="toggleAgree">
          <view class="checkbox" :class="{ checked: agree }">
            <text v-if="agree" class="check-icon">✓</text>
          </view>
          <text class="agreement-text">已阅读并同意《用户协议》《隐私政策》</text>
        </view>
      </view>
      
      <button 
        class="login-button" 
        :class="{ disabled: !agree || submitting }"
        :disabled="!agree || submitting"
        @click="doLogin"
      >
        <text class="button-text">{{ submitting ? '登录中...' : '微信一键登录' }}</text>
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      agree: false,
      submitting: false
    }
  },
  methods: {
    toggleAgree() {
      this.agree = !this.agree;
    },
    
    async doLogin() {
      if (!this.agree || this.submitting) return;
      
      this.submitting = true;
      try {
        // 仅小程序端取 code
        // #ifdef MP-WEIXIN
        const { code } = await new Promise((resolve, reject) => wx.login({ success: resolve, fail: reject }));
        console.log('[wx.login code]', code);
        
        const { result } = await uniCloud.callFunction({ name: 'auth-wechat-oneTap', data: { code } });
        console.log('[auth-wechat-oneTap result]', result);
        
        if (result && result.code === 0) {
          const { token, uid, nickname, avatarUrl, expiresAt } = result.data || {};
          uni.setStorageSync('token', token);
          uni.setStorageSync('user', { uid, nickname, avatarUrl, expiresAt });
          this.$u.toast('登录成功');
          // 回到个人中心（若在 tabBar，请替换为你的实际路径）
          uni.switchTab({ url: '/pages/user/home' });
          return;
        }
        
        this.$u.toast(result?.msg || '登录失败');
        // #endif
        
        // #ifdef H5
        this.$u.toast('请在微信小程序内使用一键登录');
        // #endif
      } catch (e) {
        console.error('[login exception]', e);
        this.$u.toast('系统异常');
      } finally {
        this.submitting = false;
      }
    }
  }
}
</script>

<style scoped>
.page {
  background: #FFFFFF;
  min-height: 100vh;
  padding: 20px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 24px;
  text-align: center;
}

.card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.agreement-section {
  margin-bottom: 32px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background: #F2F2F7;
}

.checkbox {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid #C7C7CC;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  transition: all 0.3s ease;
}

.checkbox.checked {
  background: #007AFF;
  border-color: #007AFF;
}

.check-icon {
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
}

.agreement-text {
  font-size: 14px;
  color: #424245;
  line-height: 1.4;
}

.login-button {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transition: all 0.3s ease;
}

.login-button:active {
  transform: scale(0.98);
}

.login-button.disabled {
  background: #C7C7CC;
  box-shadow: none;
}

.button-text {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
}
</style>