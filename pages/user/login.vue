<template>
  <view class="page">
    
    <view class="card"><text class="text-muted">🔐 微信一键登录</text></view>
    <view class="row" style="margin-top:16rpx"><button v-if="hasWxLogin" class="btn-primary" @click="wxLogin">微信一键授权</button></view>
    <view v-if="user" class="card" style="margin-top:16rpx"><text :selectable="true">{{ JSON.stringify(user,null,2) }}</text></view>
    <view v-else class="empty">未登录</view>
  </view>
</template>

<script>
export default {
  computed: {
    hasWxLogin() { return typeof this.wxLogin === 'function'; }
  }
}
</script>

<style scoped></style>