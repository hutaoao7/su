<template>
  <view class="container">
    <u-toast ref="uToast"></u-toast>
    
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">兑换码兑换</text>
      <text class="page-subtitle">输入兑换码领取专属权益</text>
    </view>
    
    <!-- 兑换卡片 -->
    <view class="card">
      <view class="card-header">
        <u-icon name="gift" size="24" color="#007AFF"></u-icon>
        <text class="card-title">兑换码</text>
      </view>
      
      <u-form :model="form" ref="uForm">
        <u-form-item label="" prop="code">
          <u-input 
            v-model="code" 
            placeholder="请输入或粘贴兑换码"
            :clearable="true"
            @blur="validateCode"
            :border="true"
            class="code-input"
          />
        </u-form-item>
      </u-form>
      
      <!-- 格式提示 -->
      <view v-if="codeError" class="error-hint">
        <u-icon name="info-circle" size="14" color="#F56C6C"></u-icon>
        <text class="error-text">{{ codeError }}</text>
      </view>
      
      <view class="button-group">
        <u-button 
          @click="submit" 
          type="primary" 
          :loading="loading"
          :disabled="!code || !!codeError"
          class="submit-btn"
        >
          <u-icon v-if="!loading" name="check-circle" size="18" color="#FFFFFF" style="margin-right: 8rpx;"></u-icon>
          {{ loading ? '兑换中...' : '立即兑换' }}
        </u-button>
        
        <u-button 
          @click="showHistory" 
          type="default"
          plain
          class="history-btn"
        >
          <u-icon name="clock" size="18" style="margin-right: 8rpx;"></u-icon>
          兑换记录
        </u-button>
      </view>
    </view>
    
    <!-- 兑换结果 -->
    <view v-if="message" class="result-card" :class="messageType">
      <view class="result-icon">
        <u-icon 
          :name="messageType === 'success' ? 'checkmark-circle' : 'close-circle'" 
          size="48" 
          :color="messageType === 'success' ? '#67C23A' : '#F56C6C'"
        ></u-icon>
      </view>
      <text class="result-message">{{ message }}</text>
      <view v-if="redeemResult && messageType === 'success'" class="reward-info">
        <text class="reward-label">获得奖励：</text>
        <text class="reward-value">{{ redeemResult.reward }}</text>
      </view>
    </view>
    
    <!-- 使用说明 -->
    <view class="instructions">
      <view class="instruction-header">
        <u-icon name="question-circle" size="18" color="#909399"></u-icon>
        <text class="instruction-title">使用说明</text>
      </view>
      <view class="instruction-list">
        <view class="instruction-item">
          <text class="instruction-dot">•</text>
          <text class="instruction-text">兑换码区分大小写，请仔细核对</text>
        </view>
        <view class="instruction-item">
          <text class="instruction-dot">•</text>
          <text class="instruction-text">每个兑换码只能使用一次</text>
        </view>
        <view class="instruction-item">
          <text class="instruction-dot">•</text>
          <text class="instruction-text">兑换码有效期请以实际为准</text>
        </view>
        <view class="instruction-item">
          <text class="instruction-dot">•</text>
          <text class="instruction-text">如有疑问请联系客服</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * CDK兑换页面
 * 
 * 功能：
 * - 兑换码输入和校验
 * - 格式验证（长度、字符）
 * - 兑换历史记录
 * - 成功动画效果
 * - 错误提示优化
 */
export default {
  data() {
    return {
      code: '',
      loading: false,
      message: '',
      messageType: 'success', // 'success' or 'error'
      codeError: '', // 格式错误提示
      redeemResult: null, // 兑换结果详情
      historyList: [], // 兑换历史
      
      // CDK格式规则
      codeRules: {
        minLength: 6,
        maxLength: 32,
        pattern: /^[A-Z0-9-]+$/i // 只允许字母、数字、连字符
      }
    };
  },
  
  onLoad() {
    // 加载兑换历史
    this.loadHistory();
  },
  
  methods: {
    /**
     * 验证兑换码格式
     */
    validateCode() {
      const code = this.code.trim();
      
      if (!code) {
        this.codeError = '';
        return false;
      }
      
      // 长度检查
      if (code.length < this.codeRules.minLength) {
        this.codeError = `兑换码长度不能少于${this.codeRules.minLength}位`;
        return false;
      }
      
      if (code.length > this.codeRules.maxLength) {
        this.codeError = `兑换码长度不能超过${this.codeRules.maxLength}位`;
        return false;
      }
      
      // 格式检查
      if (!this.codeRules.pattern.test(code)) {
        this.codeError = '兑换码只能包含字母、数字和连字符';
        return false;
      }
      
      // 检查是否已使用
      const history = this.getLocalHistory();
      const used = history.find(item => item.code === code && item.status === 'success');
      if (used) {
        this.codeError = '该兑换码已使用过';
        return false;
      }
      
      this.codeError = '';
      return true;
    },
    
    /**
     * 提交兑换
     */
    async submit() {
      // 格式验证
      if (!this.validateCode()) {
        this.$refs.uToast.show({
          title: this.codeError || '兑换码格式不正确',
          type: 'warning'
        });
        return;
      }
      
      // 登录检查
      const token = uni.getStorageSync('uni_id_token');
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '您尚未登录，请先登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/login'
              });
            }
          }
        });
        return;
      }

      this.loading = true;
      this.message = '';
      this.redeemResult = null;

      try {
        const res = await uniCloud.callFunction({
          name: 'cdk-redeem',
          data: {
            code: this.code.trim()
          }
        });

        if (res.result) {
          const { code, msg, data } = res.result;
          this.redeemResult = data;
          this.handleResult(code, msg);
          
          // 保存到历史记录
          if (code === 0) {
            this.saveToHistory({
              code: this.code.trim(),
              status: 'success',
              reward: data?.reward || '未知奖励',
              timestamp: Date.now()
            });
          }
        } else {
          this.messageType = 'error';
          this.message = '兑换失败，请稍后再试。';
        }
      } catch (err) {
        console.error('[CDK] 兑换失败:', err);
        const code = err.code || (err.result && err.result.code);
        
        if (code === 401 || (err.message && err.message.includes('401'))) {
          this.handleResult(401);
        } else {
          this.messageType = 'error';
          this.message = err.message || '请求失败，请检查网络';
        }
        
        // 保存失败记录
        this.saveToHistory({
          code: this.code.trim(),
          status: 'failed',
          error: err.message || '未知错误',
          timestamp: Date.now()
        });
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 处理兑换结果
     */
    handleResult(code, defaultMsg = '') {
      switch (code) {
        case 0:
          this.messageType = 'success';
          this.message = '兑换成功！';
          this.code = ''; // Clear input on success
          break;
        case 1001:
          this.messageType = 'error';
          this.message = '兑换码无效';
          break;
        case 1002:
          this.messageType = 'error';
          this.message = '兑换码已过期';
          break;
        case 1003:
          this.messageType = 'error';
          this.message = '兑换码已被使用';
          break;
        case 1004:
          this.messageType = 'error';
          this.message = '操作过于频繁，请稍后再试';
          break;
        case 401:
            this.messageType = 'error';
            this.message = '未登录或登录已过期';
            uni.showModal({
                title: '提示',
                content: '您尚未登录或登录已过期，请先登录',
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({
                            url: '/pages/login/login'
                        });
                    }
                }
            });
            break;
        default:
          this.messageType = 'error';
          this.message = defaultMsg || '未知错误';
          break;
      }
    },
    
    /**
     * 获取本地历史记录
     */
    getLocalHistory() {
      try {
        const history = uni.getStorageSync('cdk_history');
        return history ? JSON.parse(history) : [];
      } catch (e) {
        console.error('[CDK] 读取历史记录失败:', e);
        return [];
      }
    },
    
    /**
     * 保存到历史记录
     */
    saveToHistory(record) {
      try {
        const history = this.getLocalHistory();
        history.unshift(record);
        
        // 保留最近50条
        if (history.length > 50) {
          history.splice(50);
        }
        
        uni.setStorageSync('cdk_history', JSON.stringify(history));
        console.log('[CDK] 已保存历史记录');
      } catch (e) {
        console.error('[CDK] 保存历史记录失败:', e);
      }
    },
    
    /**
     * 加载历史记录
     */
    loadHistory() {
      this.historyList = this.getLocalHistory();
    },
    
    /**
     * 显示兑换记录
     */
    showHistory() {
      const history = this.getLocalHistory();
      
      if (history.length === 0) {
        uni.showToast({
          title: '暂无兑换记录',
          icon: 'none'
        });
        return;
      }
      
      // 生成历史记录内容
      const content = history.slice(0, 5).map((item, index) => {
        const date = new Date(item.timestamp).toLocaleString();
        const statusText = item.status === 'success' ? '✓' : '✗';
        return `${index + 1}. ${statusText} ${item.code}\n   ${date}`;
      }).join('\n\n');
      
      uni.showModal({
        title: '最近兑换记录',
        content: content,
        showCancel: false,
        confirmText: '关闭'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
/* 容器 */
.container {
  min-height: 100vh;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 页面标题 */
.page-header {
  margin-bottom: 40rpx;
  padding-top: env(safe-area-inset-top);
}

.page-title {
  display: block;
  font-size: 48rpx;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 12rpx;
}

.page-subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 卡片 */
.card {
  padding: 40rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #303133;
  margin-left: 16rpx;
}

/* 输入框 */
.code-input {
  font-size: 32rpx;
  letter-spacing: 2rpx;
}

/* 错误提示 */
.error-hint {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  padding: 12rpx 16rpx;
  background-color: #FEF0F0;
  border-radius: 8rpx;
  border-left: 4rpx solid #F56C6C;
}

.error-text {
  font-size: 24rpx;
  color: #F56C6C;
  margin-left: 8rpx;
}

/* 按钮组 */
.button-group {
  margin-top: 40rpx;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
; max-width: 750rpx; overflow: hidden}

.history-btn {
  width: 100%;
  height: 80rpx;
  margin-top: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
; max-width: 750rpx; overflow: hidden}

/* 兑换结果 */
.result-card {
  margin-top: 40rpx;
  padding: 48rpx 32rpx;
  border-radius: 24rpx;
  text-align: center;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-icon {
  margin-bottom: 24rpx;
}

.result-message {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.reward-info {
  margin-top: 24rpx;
  padding: 24rpx;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 12rpx;
}

.reward-label {
  font-size: 26rpx;
  color: #606266;
}

.reward-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
  margin-left: 8rpx;
}

.success {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border: 2rpx solid #67C23A;
}

.success .result-message {
  color: #67C23A;
}

.error {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border: 2rpx solid #F56C6C;
}

.error .result-message {
  color: #F56C6C;
}

/* 使用说明 */
.instructions {
  margin-top: 40rpx;
  padding: 32rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
}

.instruction-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.instruction-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  margin-left: 12rpx;
}

.instruction-list {
  padding-left: 8rpx;
}

.instruction-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
  line-height: 1.6;
}

.instruction-dot {
  font-size: 32rpx;
  color: #909399;
  margin-right: 12rpx;
  flex-shrink: 0;
}

.instruction-text {
  font-size: 26rpx;
  color: #606266;
  flex: 1;
}


/* 响应式布局 - 平板设备 */
@media (min-width: 768px) {
  /* 平板设备样式 */
}

/* 响应式布局 - 大屏设备 */
@media (min-width: 1024px) {
  /* 大屏设备样式 */
}



/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}



/* 横屏适配 */
@media (orientation: landscape) {
  /* 横屏样式 */
}

</style>