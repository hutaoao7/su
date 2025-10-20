<template>
  <view class="revoke-page">
    <!-- 警告提示 -->
    <view class="warning-card">
      <view class="warning-icon">⚠️</view>
      <view class="warning-content">
        <text class="warning-title">重要提示</text>
        <text class="warning-text">
          撤回同意后，您的部分数据将被删除，且无法恢复。请谨慎操作。
        </text>
      </view>
    </view>

    <!-- 撤回说明 -->
    <view class="info-card">
      <view class="info-title">撤回同意意味着：</view>
      <view class="info-list">
        <view class="info-item">
          <text class="info-bullet">•</text>
          <text class="info-text">您的账号将被注销</text>
        </view>
        <view class="info-item">
          <text class="info-bullet">•</text>
          <text class="info-text">所有个人数据将被删除</text>
        </view>
        <view class="info-item">
          <text class="info-bullet">•</text>
          <text class="info-text">评估记录和聊天记录将被清除</text>
        </view>
        <view class="info-item">
          <text class="info-bullet">•</text>
          <text class="info-text">无法恢复已删除的数据</text>
        </view>
      </view>
    </view>

    <!-- 撤回原因选择 -->
    <view class="reason-card">
      <view class="reason-title">请告诉我们撤回的原因（可选）</view>
      
      <radio-group @change="onReasonChange">
        <label class="reason-label" v-for="(reason, index) in reasons" :key="index">
          <radio :value="reason.value" :checked="selectedReason === reason.value" />
          <text class="reason-text">{{ reason.label }}</text>
        </label>
      </radio-group>
      
      <textarea 
        class="reason-detail"
        v-model="reasonDetail"
        placeholder="详细说明（可选）"
        maxlength="200"
      />
      <text class="char-count">{{ reasonDetail.length }}/200</text>
    </view>

    <!-- 确认按钮 -->
    <view class="actions">
      <button 
        class="btn btn-danger"
        :disabled="revoking"
        :loading="revoking"
        @tap="handleRevoke"
      >
        确认撤回并注销账号
      </button>
      
      <button class="btn btn-cancel" @tap="handleCancel">
        取消
      </button>
    </view>
  </view>
</template>

<script>
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { clearLoginData } from '@/utils/auth.js';
import { trackEvent } from '@/utils/analytics.js';

export default {
  data() {
    return {
      selectedReason: '',
      reasonDetail: '',
      revoking: false,
      assessmentCount: 0,
      chatCount: 0,
      reasons: [
        { value: 'privacy', label: '隐私担忧' },
        { value: 'not_useful', label: '功能不满意' },
        { value: 'switch_service', label: '转用其他服务' },
        { value: 'other', label: '其他原因' }
      ]
    };
  },
  
  onLoad() {
    this.loadDataCounts();
  },
  
  methods: {
    async loadDataCounts() {
      // 加载数据统计
      try {
        const result = await callCloudFunction('user-data-stats', {});
        
        if (result && result.stats) {
          this.assessmentCount = result.stats.assessments || 0;
          this.chatCount = result.stats.chats || 0;
        }
      } catch (error) {
        console.error('[REVOKE] 加载统计失败:', error);
      }
    },
    
    onReasonChange(e) {
      this.selectedReason = e.detail.value;
    },
    
    async handleRevoke() {
      // 二次确认
      uni.showModal({
        title: '最后确认',
        content: '确定要撤回同意并删除所有数据吗？此操作不可撤销。',
        confirmText: '确定删除',
        confirmColor: '#FF3B30',
        cancelText: '我再想想',
        success: async (res) => {
          if (res.confirm) {
            await this.executeRevoke();
          }
        }
      });
    },
    
    async executeRevoke() {
      this.revoking = true;
      
      try {
        const result = await callCloudFunction('consent-revoke', {
          revoke_reason: this.selectedReason,
          revoke_detail: this.reasonDetail,
          data_deletion_requested: true
        }, {
          showLoading: true,
          loadingText: '正在处理...',
          timeout: 30000
        });
        
        if (result && result.success) {
          // 埋点
          trackEvent('consent_revoke', {
            reason: this.selectedReason
          });
          
          // 清除本地数据
          clearLoginData();
          
          uni.showToast({
            title: '账号已注销',
            icon: 'success',
            duration: 2000
          });
          
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            });
          }, 2000);
        }
      } catch (error) {
        console.error('[REVOKE] 撤回失败:', error);
        
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      } finally {
        this.revoking = false;
      }
    },
    
    handleCancel() {
      uni.navigateBack();
    },
    
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN');
    }
  }
};
</script>

<style scoped>
.revoke-page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 40rpx 24rpx;
}

.warning-card {
  background: #FFF3E0;
  border: 2rpx solid #FFB74D;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  display: flex;
  gap: 20rpx;
}

.warning-icon {
  font-size: 48rpx;
}

.warning-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.warning-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #E65100;
}

.warning-text {
  font-size: 26rpx;
  color: #6D4C41;
  line-height: 1.6;
}

.info-card,
.reason-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.info-title,
.reason-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 24rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.info-item {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.info-bullet {
  color: #FF3B30;
  font-size: 32rpx;
  line-height: 1;
}

.info-text {
  flex: 1;
  font-size: 28rpx;
  color: #1D1D1F;
  line-height: 1.6;
}

.reason-label {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.reason-text {
  font-size: 28rpx;
  color: #1D1D1F;
}

.reason-detail {
  width: 100%;
  min-height: 200rpx;
  background: #F9FAFB;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  margin-top: 24rpx;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #86868B;
  margin-top: 8rpx;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin: 48rpx 0;
}

.btn {
  height: 96rpx;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
}

.btn-danger {
  background: #FF3B30;
  color: #FFFFFF;
}

.btn-cancel {
  background: #FFFFFF;
  color: #1D1D1F;
  border: 2rpx solid #E5E5EA;
}

.btn:active {
  opacity: 0.8;
}

.history-section {
  margin-top: 48rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #F9FAFB;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.history-date {
  font-size: 28rpx;
  color: #1D1D1F;
}

.history-format {
  font-size: 24rpx;
  color: #86868B;
}
</style>

