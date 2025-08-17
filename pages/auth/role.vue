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
    <view v-if="result" class="card" style="margin-top:16rpx"><text :selectable="true">{{ resultText }}</text></view>
    <view v-if="data"   class="card" style="margin-top:16rpx"><text :selectable="true">{{ dataText }}</text></view>
    <view v-if="list && list.length" class="card" style="margin-top:16rpx">
      <text class="text-muted">列表（{{list.length}}）</text>
      <view v-for="(txt,idx) in listText" :key="idx" style="margin-top:8rpx">
        <text>{{ txt }}</text>
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
    resultText() {
      const v = this.result;
      if (v == null) return '';
      return typeof v === 'string' ? v : (() => { try { return JSON.stringify(v, null, 2) } catch (e) { return String(v) } })();
    },
    dataText() {
      const v = this.data;
      if (v == null) return '';
      return typeof v === 'string' ? v : (() => { try { return JSON.stringify(v, null, 2) } catch (e) { return String(v) } })();
    },
    listText() {
      const arr = Array.isArray(this.list) ? this.list : [];
      return arr.map(it => (typeof it === 'string') ? it : (() => { try { return JSON.stringify(it) } catch (e) { return String(it) } })());
    }
  }
}
</script>

<style scoped></style>