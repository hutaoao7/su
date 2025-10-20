<template>
  <view class="policy-page">
    <scroll-view class="content-scroll" scroll-y>
      <view class="content">
        <text class="page-title">翎心隐私政策</text>
        <text class="page-meta">生效日期：2025年10月12日 | 版本：v1.0.0</text>
        
        <view class="section">
          <text class="section-title">一、信息收集</text>
          <text class="section-text">
我们收集以下信息：账号信息（微信OpenID、昵称、头像）、评估数据（问卷答案、评估结果）、使用数据（页面访问、功能使用）、交互数据（AI对话摘要）。
          </text>
        </view>

        <view class="section">
          <text class="section-title">二、信息使用</text>
          <text class="section-text">
用于提供核心功能、改进服务、个性化推荐、安全保障和客户服务。
          </text>
        </view>

        <view class="section">
          <text class="section-title">三、信息保护</text>
          <text class="section-text">
采用HTTPS传输加密、数据存储加密、访问控制、安全审计等措施保护您的信息。
          </text>
        </view>

        <view class="section">
          <text class="section-title">四、您的权利</text>
          <text class="section-text">
您享有访问权、更正权、删除权、撤回同意权、数据导出权。
          </text>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-action">
      <button class="action-button" @tap="handleBack">我已阅读</button>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    handleBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.policy-page {
  min-height: 100vh;
  background: #F0F0F5;
}

.content-scroll {
  height: calc(100vh - 120rpx);
}

.content {
  padding: 40rpx;
}

.page-title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
}

.page-meta {
  display: block;
  font-size: 24rpx;
  color: #8E8E93;
  margin-bottom: 40rpx;
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.section-text {
  display: block;
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx;
  background: #FFFFFF;
}

.action-button {
  width: 100%;
  height: 88rpx;
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
}
</style>

