<template>
  <view class="page" style="padding:24rpx">
    <view style="padding:20rpx;border:1px dashed #0a84ff;border-radius:12rpx;margin-bottom:16rpx">
      ✅ 设置页渲染成功（SafeBoot）
    </view>
    <button class="btn-primary" @click="uni.navigateTo({url:'/pages/auth/login'})">登录/注册</button>
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