<template>
  <view class="page">
    
    <view class="card"><text class="text-muted">✅ 新版 UI · 功能页</text></view>
    <view class="row" style="margin-top:16rpx">
      <button v-if="hasFetch" class="btn-primary" @click="fetch">刷新</button>
      <button v-if="hasStart" class="btn-primary" @click="start">开始</button>
      <button v-if="hasPlay"  class="btn-primary" @click="play">播放</button>
      <button v-if="hasDetect"class="btn-primary" @click="detect">检测</button>
      <button v-if="hasChat"  class="btn-primary" @click="chat">对话</button>
      <button v-if="hasRedeem"class="btn-primary" @click="redeem">兑换</button>
    </view>
    <view v-if="result" class="card" style="margin-top:16rpx"><text :selectable="true">{{ typeof result==='string'?result:JSON.stringify(result,null,2) }}</text></view>
    <view v-if="data"   class="card" style="margin-top:16rpx"><text :selectable="true">{{ typeof data==='string'?data:JSON.stringify(data,null,2) }}</text></view>
    <view v-if="list && list.length" class="card" style="margin-top:16rpx">
      <text class="text-muted">列表（{{list.length}}）</text>
      <view v-for="(it,idx) in list" :key="idx" style="margin-top:8rpx">
        <text>{{ typeof it==='object' ? JSON.stringify(it) : it }}</text>
      </view>
    </view>
    <view v-if="(!result && !data && (!list || !list.length))" class="empty">暂无数据</view>
  </view>
</template>

<script>
export default {
  computed: {
    hasFetch() { return typeof this.fetch === 'function'; },
    hasStart() { return typeof this.start === 'function'; },
    hasPlay() { return typeof this.play === 'function'; },
    hasDetect() { return typeof this.detect === 'function'; },
    hasChat() { return typeof this.chat === 'function'; },
    hasRedeem() { return typeof this.redeem === 'function'; },
  }
}
</script>

<style scoped></style>