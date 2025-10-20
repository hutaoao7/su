<template>
  <view class="page">
    <view class="feedback-container">
      <view class="feedback-header">
        <text class="page-title">问题反馈</text>
        <text class="page-desc">您的意见对我们很重要</text>
      </view>
      
      <view class="feedback-card">
        <!-- 标题输入 -->
        <view class="form-group">
          <text class="form-label">标题 <text class="required">*</text></text>
          <input 
            v-model="title"
            class="form-input"
            placeholder="请简要描述问题"
            :maxlength="50"
            @input="onInputTitle"
          />
          <text class="char-count">{{ title.length }}/50</text>
        </view>
        
        <!-- 详细描述 -->
        <view class="form-group">
          <text class="form-label">详细描述 <text class="required">*</text></text>
          <textarea 
            v-model="content"
            class="form-textarea"
            placeholder="请详细描述您遇到的问题或建议..."
            :maxlength="1000"
            auto-height
            @input="onInputContent"
          />
          <text class="char-count">{{ content.length }}/1000</text>
        </view>
        
        <!-- 联系方式 -->
        <view class="form-group">
          <text class="form-label">联系方式（选填）</text>
          <input 
            v-model="contact"
            class="form-input"
            placeholder="可填写微信号或手机号，以便我们回复"
            :maxlength="60"
            @input="onInputContact"
          />
          <text class="char-count">{{ contact.length }}/60</text>
        </view>
        
        <!-- 提交按钮 -->
        <view class="submit-section">
          <button 
            class="submit-btn"
            :class="{ disabled: !canSubmit || submitting }"
            :disabled="!canSubmit || submitting"
            @tap="handleSubmit"
          >
            {{ submitting ? '提交中...' : '提交反馈' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getLoginData } from '@/utils/auth.js';

export default {
  data() {
    return {
      title: '',
      content: '',
      contact: '',
      submitting: false,
      canSubmit: false
    };
  },
  
  watch: {
    title() {
      this.updateCanSubmit();
    },
    content() {
      this.updateCanSubmit();
    }
  },
  
  onShow() {
    console.log('[FEEDBACK] ready');
  },
  
  methods: {
    // 标题输入处理
    onInputTitle(e) {
      this.title = e.detail.value.slice(0, 50);
      console.log(`[FEEDBACK] input change titleLen=${this.title.length} contentLen=${this.content.length}`);
    },
    
    // 内容输入处理
    onInputContent(e) {
      this.content = e.detail.value.slice(0, 1000);
      console.log(`[FEEDBACK] input change titleLen=${this.title.length} contentLen=${this.content.length}`);
    },
    
    // 联系方式输入处理
    onInputContact(e) {
      this.contact = e.detail.value.slice(0, 60);
    },
    
    // 更新提交按钮状态
    updateCanSubmit() {
      this.canSubmit = this.title.trim().length > 0 && this.content.trim().length > 0;
    },
    
    // 表单校验
    validate() {
      if (!this.title.trim()) {
        return { ok: false, reason: '请填写标题' };
      }
      if (this.title.trim().length > 50) {
        return { ok: false, reason: '标题不能超过50字' };
      }
      if (!this.content.trim()) {
        return { ok: false, reason: '请填写详细描述' };
      }
      if (this.content.trim().length > 1000) {
        return { ok: false, reason: '描述不能超过1000字' };
      }
      if (this.contact.length > 60) {
        return { ok: false, reason: '联系方式不能超过60字' };
      }
      return { ok: true };
    },
    
    // 提交反馈
    async handleSubmit() {
      // 校验
      const validation = this.validate();
      if (!validation.ok) {
        console.log(`[FEEDBACK] validate fail reason=${validation.reason}`);
        uni.showToast({
          title: validation.reason,
          icon: 'none'
        });
        return;
      }
      
      // 防重复提交
      if (this.submitting) {
        return;
      }
      
      this.submitting = true;
      
      try {
        // 获取登录信息
        const loginData = getLoginData();
        const uid = loginData.uid || '';
        
        console.log(`[FEEDBACK] submit start uid=${uid}`);
        
        // 获取设备信息
        let deviceModel = '';
        try {
          const systemInfo = uni.getSystemInfoSync();
          deviceModel = systemInfo.model || '';
        } catch (error) {
          // 忽略获取设备信息失败
        }
        
        // 组装提交数据
        const payload = {
          title: this.title.trim(),
          content: this.content.trim(),
          contact: this.contact.trim(),
          uid: uid,
          meta: {
            platform: 'mp-weixin',
            appVersion: '1.0.0', // 项目版本
            deviceModel: deviceModel,
            ts: Date.now()
          }
        };
        
        // 调用云函数
        const { result } = await uniCloud.callFunction({
          name: 'feedback-submit',
          data: payload
        });
        
        if (result && result.errCode === 0) {
          const rid = result.data?.rid || 'unknown';
          console.log(`[FEEDBACK] submit ok rid=${rid}`);
          
          uni.showToast({
            title: '反馈已提交',
            icon: 'none'
          });
          
          // 800ms 后返回
          setTimeout(() => {
            uni.navigateBack();
          }, 800);
          
        } else {
          throw new Error(result?.errMsg || '提交失败');
        }
        
      } catch (error) {
        console.log(`[FEEDBACK] submit fail msg=${error.message}`);
        uni.showToast({
          title: error.message || '提交失败，请稍后重试',
          icon: 'none'
        });
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
}

.feedback-container {
  padding: 40rpx;
}

.feedback-header {
  text-align: center;
  margin-bottom: 40rpx;
}

.page-title {
  font-size: 48rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.page-desc {
  font-size: 28rpx;
  color: #666;
  display: block;
}

.feedback-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.form-group {
  margin-bottom: 40rpx;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.required {
  color: #FF3B30;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: rgba(0, 0, 0, 0.03);
  border: 1rpx solid rgba(0, 0, 0, 0.1);
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #007AFF;
  background: rgba(0, 122, 255, 0.05);
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  background: rgba(0, 0, 0, 0.03);
  border: 1rpx solid rgba(0, 0, 0, 0.1);
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
  line-height: 1.6;
}

.form-textarea:focus {
  border-color: #007AFF;
  background: rgba(0, 122, 255, 0.05);
}

.char-count {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  margin-top: 8rpx;
  display: block;
}

.submit-section {
  margin-top: 60rpx;
  text-align: center;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: #FFFFFF;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn.disabled {
  background: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.3);
  transform: none;
}

.submit-btn.disabled:active {
  transform: none;
}
</style>