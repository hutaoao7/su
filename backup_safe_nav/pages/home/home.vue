<template>
  <view class="page" style="padding:24rpx">
    <view style="padding:20rpx;border:1px dashed #0a84ff;border-radius:12rpx;margin-bottom:16rpx">
      ✅ 首页渲染成功（SafeBoot）
    </view>
    <view style="display:flex;gap:16rpx;flex-wrap:wrap">
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/user/home'})">去个人中心</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/community/index'})">去社区</button>
    </view>
  </view>
</template>
<script>
export default {}
</script>
<style scoped>
.page{min-height:100vh;background:#fff;}
.btn-primary{
  border-radius:12rpx;padding:20rpx 28rpx;font-weight:600;
  background:linear-gradient(135deg,#5AC8FA,#0A84FF);color:#fff;
  box-shadow:0 8rpx 16rpx rgba(10,132,255,.25);
}
</style>