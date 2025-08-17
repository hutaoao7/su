<template>
  <view class="page" style="padding:24rpx">
    <view style="padding:20rpx;border:1px dashed #0a84ff;border-radius:12rpx;margin-bottom:16rpx">
      ✅ 功能页渲染成功（SafeBoot）
    </view>
    <view style="padding:16rpx;border:1px solid #eee;border-radius:12rpx" @click="uni.navigateTo({url:'/pages/admin/metrics'})">
      <text>数据指标面板</text>
    </view>
  </view>
</template>
<script>
export default {}
</script>
<style scoped>
.page{min-height:100vh;background:#fff;}
</style>