<template>
  <view class="result-page">
    <view class="score-card">
      <text class="score-label">评估结果</text>
      <text class="score-value">{{ result.score }}</text>
      <text class="score-level" :class="'level-' + result.level">
        {{ levelText }}
      </text>
    </view>
    
    <view class="suggestion-card">
      <text class="suggestion-title">专业建议</text>
      <text class="suggestion-text">{{ suggestionText }}</text>
    </view>
    
    <view class="actions">
      <button class="action-button primary" @tap="saveResult">保存结果</button>
      <button class="action-button secondary" @tap="goBack">返回</button>
    </view>
  </view>
</template>

<script>
import { callCloudFunction } from '@/utils/unicloud-handler.js';

export default {
  data() {
    return {
      result: {
        scaleId: '',
        score: 0,
        level: 'normal'
      }
    };
  },
  
  computed: {
    levelText() {
      const map = {
        normal: '正常',
        mild: '轻度',
        moderate: '中度',
        severe: '重度'
      };
      return map[this.result.level] || '未知';
    },
    
    suggestionText() {
      const suggestions = {
        normal: '您的评估结果在正常范围内。继续保持积极的生活方式，关注心理健康。',
        mild: '您可能有轻度症状。建议保持规律作息，适当运动，必要时寻求心理咨询。',
        moderate: '您可能有中度症状。建议尽快咨询心理医生，获得专业帮助。',
        severe: '您的症状较为严重。强烈建议立即就医，寻求专业治疗。'
      };
      return suggestions[this.result.level] || '';
    }
  },
  
  onLoad(options) {
    if (options.result) {
      this.result = JSON.parse(decodeURIComponent(options.result));
    }
  },
  
  methods: {
    async saveResult() {
      try {
        await callCloudFunction('assessment-save-result', this.result, {
          showLoading: true,
          loadingText: '保存中...'
        });
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
      } catch (error) {
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    },
    
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: #F0F0F5;
  padding: 40rpx;
}

.score-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 24rpx;
  padding: 80rpx 40rpx;
  text-align: center;
  margin-bottom: 32rpx;
}

.score-label {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 16rpx;
}

.score-value {
  display: block;
  font-size: 120rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 16rpx;
}

.score-level {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  padding: 16rpx 40rpx;
  border-radius: 32rpx;
  display: inline-block;
}

.level-normal {
  background: #52C41A;
  color: #FFFFFF;
}

.level-mild {
  background: #FAAD14;
  color: #FFFFFF;
}

.level-moderate {
  background: #FA8C16;
  color: #FFFFFF;
}

.level-severe {
  background: #F5222D;
  color: #FFFFFF;
}

.suggestion-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
}

.suggestion-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.suggestion-text {
  display: block;
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
}

.actions {
  display: flex;
  gap: 16rpx;
}

.action-button {
  flex: 1;
  height: 88rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.action-button.primary {
  background: #007AFF;
  color: #FFFFFF;
}

.action-button.secondary {
  background: #F5F5F5;
  color: #666;
}


/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}

</style>

