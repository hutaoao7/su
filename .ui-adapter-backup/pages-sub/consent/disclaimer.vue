<template>
  <view class="disclaimer-page">
    <scroll-view class="content-scroll" scroll-y>
      <view class="content">
        <text class="page-title">重要声明</text>
        
        <view class="section">
          <text class="section-title">评估结果说明</text>
          <text class="section-text">
本评估结果仅供参考和筛查使用，不能替代专业医疗诊断。心理健康评估具有一定的局限性，实际情况可能因个人差异而有所不同。
          </text>
        </view>

        <view class="section">
          <text class="section-title">专业建议</text>
          <text class="section-text">
如果您在心理健康方面遇到困扰，建议：寻求专业心理咨询师帮助、联系当地心理健康服务机构、与信任的朋友家人交流。
          </text>
        </view>

        <view class="section alert">
          <text class="section-title">紧急求助</text>
          <text class="section-text">
如果您有自伤或伤害他人的想法，请立即拨打心理危机干预热线：400-161-9995，或前往最近的医院急诊科。
          </text>
        </view>

        <view class="section">
          <text class="section-title">责任限制</text>
          <text class="section-text">
在法律允许的范围内，对于因使用本应用可能产生的直接或间接损失，我们不承担责任。
          </text>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-action">
      <button class="action-button" @tap="handleBack">我已知晓</button>
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
.disclaimer-page {
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
  margin-bottom: 40rpx;
}

.section {
  margin-bottom: 40rpx;
}

.section.alert {
  background: #FFF3CD;
  border-left: 4rpx solid #FFA500;
  padding: 24rpx;
  border-radius: 8rpx;
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
</style>

