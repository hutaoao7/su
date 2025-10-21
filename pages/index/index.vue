<template>
  <view class="page">
    
    <view class="card"><text class="text-muted">✅ 新版 UI · 页面渲染成功</text></view>
    <view class="row" style="margin-top:16rpx">
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/user/home'})">个人中心</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/community/index'})">社区</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages-sub/other/metrics'})">数据指标</button>
    </view>
  </view>
</template>

<script>
export default {
  }
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx;
  /* 顶部安全区域 */
  padding-top: calc(32rpx + constant(safe-area-inset-top));
  padding-top: calc(32rpx + env(safe-area-inset-top));
  /* 底部安全区域 */
  padding-bottom: calc(32rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.text-muted {
  color: #86868B;
  font-size: 28rpx;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 30rpx;
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