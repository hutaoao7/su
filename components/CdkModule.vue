<template>
  <view class="cdk-module">
    <view class="cdk-header">
      <text class="module-title">CDK 兑换码</text>
      <text class="module-desc">输入兑换码解锁更多内容</text>
    </view>

    <view class="cdk-form">
      <view class="input-group">
        <input 
          v-model="cdkCode" 
          class="cdk-input" 
          placeholder="请输入兑换码"
          maxlength="20"
          @input="handleInput"
        />
        <button 
          class="btn-redeem" 
          :disabled="!cdkCode.trim() || isRedeeming"
          @tap="handleRedeem"
        >
          {{ isRedeeming ? '兑换中...' : '兑换' }}
        </button>
      </view>
      
      <view class="input-tips">
        <text class="tip-text">• 兑换码区分大小写</text>
        <text class="tip-text">• 每个兑换码只能使用一次</text>
        <text class="tip-text">• 兑换成功后将自动解锁相关内容</text>
      </view>
    </view>

    <!-- 兑换历史 -->
    <view v-if="redeemHistory.length > 0" class="history-section">
      <text class="history-title">兑换记录</text>
      <view class="history-list">
        <view 
          v-for="(record, index) in redeemHistory" 
          :key="index"
          class="history-item"
        >
          <view class="history-info">
            <text class="history-code">{{ record.code }}</text>
            <text class="history-time">{{ formatTime(record.time) }}</text>
          </view>
          <view class="history-result">
            <text class="result-text">{{ record.result }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { cdkAPI } from '@/utils/unicloud-request.js';

export default {
  data() {
    return {
      cdkCode: '',
      isRedeeming: false,
      redeemHistory: []
    }
  },
  mounted() {
    this.loadRedeemHistory();
  },
  methods: {
    // 输入处理
    handleInput(e) {
      // 转换为大写并移除空格
      this.cdkCode = e.detail.value.toUpperCase().replace(/\s/g, '');
    },

    // 处理兑换
    async handleRedeem() {
      const code = this.cdkCode.trim();
      
      if (!code) {
        uni.showToast({
          title: '请输入兑换码',
          icon: 'none'
        });
        return;
      }

      this.isRedeeming = true;

      try {
        const result = await cdkAPI.redeem(code);
        
        if (result.code === 0) {
          // 兑换成功
          const items = result.data.items || [];
          
          // 添加到兑换历史
          this.addToHistory(code, `成功解锁 ${items.length} 个内容`);
          
          // 清空输入框
          this.cdkCode = '';
          
          // 触发兑换成功事件
          this.$emit('cdk-redeemed', {
            code,
            items,
            unlocked: result.data.unlocked
          });
          
          uni.showModal({
            title: '兑换成功',
            content: `恭喜！已成功解锁 ${items.length} 个内容`,
            showCancel: false
          });
        }
      } catch (error) {
        console.error('兑换失败:', error);
        
        let errorMsg = '兑换失败，请稍后重试';
        
        if (error.code === 41001) {
          errorMsg = '兑换码不存在或已过期';
        } else if (error.code === 40001) {
          errorMsg = '兑换码格式不正确';
        } else if (error.code === 40002) {
          errorMsg = '兑换码已被使用';
        }
        
        // 添加到兑换历史
        this.addToHistory(this.cdkCode, errorMsg);
        
        uni.showToast({
          title: errorMsg,
          icon: 'none'
        });
      } finally {
        this.isRedeeming = false;
      }
    },

    // 添加到兑换历史
    addToHistory(code, result) {
      const record = {
        code,
        result,
        time: Date.now()
      };
      
      this.redeemHistory.unshift(record);
      
      // 只保留最近10条记录
      if (this.redeemHistory.length > 10) {
        this.redeemHistory = this.redeemHistory.slice(0, 10);
      }
      
      // 保存到本地存储
      this.saveRedeemHistory();
    },

    // 加载兑换历史
    loadRedeemHistory() {
      try {
        const history = uni.getStorageSync('redeemHistory');
        if (history && Array.isArray(history)) {
          this.redeemHistory = history;
        }
      } catch (error) {
        console.error('加载兑换历史失败:', error);
      }
    },

    // 保存兑换历史
    saveRedeemHistory() {
      try {
        uni.setStorageSync('redeemHistory', this.redeemHistory);
      } catch (error) {
        console.error('保存兑换历史失败:', error);
      }
    },

    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) { // 1分钟内
        return '刚刚';
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`;
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`;
      } else {
        return date.toLocaleDateString();
      }
    }
  }
}
</script>

<style scoped>
.cdk-module {
  padding: 32rpx;
  color: #1D1D1F;
}

.cdk-header {
  text-align: center;
  margin-bottom: 48rpx;
}

.module-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 12rpx;
}

.module-desc {
  display: block;
  font-size: 24rpx;
  color: #86868B;
  line-height: 1.4;
}

.cdk-form {
  margin-bottom: 48rpx;
}

.input-group {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.cdk-input {
  flex: 1;
  height: 88rpx;
  padding: 0 24rpx;
  background: #F2F2F7;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #1D1D1F;
  border: none;
}

.cdk-input::placeholder {
  color: #86868B;
}

.btn-redeem {
  width: 160rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #FF9500, #FF6B35);
  color: #FFFFFF;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;
}

.btn-redeem:disabled {
  opacity: 0.5;
  background: #C7C7CC;
}

.input-tips {
  padding: 24rpx;
  background: rgba(255, 149, 0, 0.1);
  border-radius: 12rpx;
}

.tip-text {
  display: block;
  font-size: 22rpx;
  color: #86868B;
  line-height: 1.6;
  margin-bottom: 8rpx;
}

.tip-text:last-child {
  margin-bottom: 0;
}

/* 兑换历史 */
.history-section {
  border-top: 1rpx solid #E5E5EA;
  padding-top: 32rpx;
}

.history-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 20rpx;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #F8F9FA;
  border-radius: 12rpx;
}

.history-info {
  flex: 1;
}

.history-code {
  display: block;
  font-size: 24rpx;
  font-weight: 500;
  color: #1D1D1F;
  margin-bottom: 4rpx;
}

.history-time {
  display: block;
  font-size: 20rpx;
  color: #86868B;
}

.history-result {
  text-align: right;
}

.result-text {
  font-size: 22rpx;
  color: #86868B;
}
</style>