<template>
  <view class="page">
    
    <view class="card"><text class="text-muted">📊 实时指标 · 新版 UI</text></view>
    <view class="row" style="margin-top:16rpx"><button v-if="hasFetch" class="btn-primary" @click="fetch">刷新</button></view>
    <view v-if="metrics" class="card" style="margin-top:16rpx"><text :selectable="true">{{ JSON.stringify(metrics,null,2) }}</text></view>
    <view v-else class="empty">暂无指标数据</view>
  </view>
</template>

<script>
export default {
  computed: {
    hasFetch() { return typeof this.fetch === 'function'; }
  }
}
</script>

<style scoped></style>