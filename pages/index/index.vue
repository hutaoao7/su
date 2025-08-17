<template>
  <view class="page">
    
    <view class="card"><text class="text-muted">✅ 新版 UI · 页面渲染成功</text></view>
    <view class="row" style="margin-top:16rpx">
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/user/home'})">个人中心</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/community/index'})">社区</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/admin/metrics'})">数据指标</button>
    </view>
  </view>
</template>

<script>
export default {
  }
</script>

<style scoped></style>