<template>
  <view class="page">
    
    <view class="card"><text class="text-muted">✅ 社区详情页</text></view>
    <view class="row" style="margin-top:16rpx">
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/auth/login'})">登录/注册</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/user/profile'})">编辑资料</button>
    </view>
  </view>
</template>

<script>
export default {
  }
</script>

<style scoped></style>
