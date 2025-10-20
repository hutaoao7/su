<template>
  <view class="agreement-page">
    <scroll-view class="content-scroll" scroll-y>
      <view class="content">
        <text class="page-title">翎心用户服务协议</text>
        <text class="page-meta">生效日期：2025年10月12日 | 版本：v1.0.0</text>
        
        <view class="section">
          <text class="section-title">一、服务说明</text>
          <text class="section-text">
翎心是一款心理健康辅助工具，提供心理健康评估、AI智能干预、冥想练习等服务。本应用仅提供辅助服务，不能替代专业医疗诊断和治疗。
          </text>
        </view>

        <view class="section">
          <text class="section-title">二、用户责任</text>
          <text class="section-text">
您应妥善保管账号、遵守法律法规、诚实评估、不发布违法信息、不侵犯他人权益。
          </text>
        </view>

        <view class="section">
          <text class="section-title">三、免责条款</text>
          <text class="section-text">
因不可抗力、第三方原因、用户违规、网络故障等导致的问题，本应用不承担责任。
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
/* 样式同privacy-policy.vue */
.agreement-page {
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
  bottom: calc(0px + env(safe-area-inset-bottom));
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
; max-width: 750rpx; overflow: hidden}


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

