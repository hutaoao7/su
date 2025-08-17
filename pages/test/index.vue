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
	data() {
		return {
			list: [],
			result: null,
			data: null
		}
	},
	computed: {
		resultText() {
			if (!this.result) return '';
			try {
				return typeof this.result === 'string' ? this.result : JSON.stringify(this.result, null, 2);
			} catch (e) {
				return String(this.result);
			}
		},
		dataText() {
			if (!this.data) return '';
			try {
				return typeof this.data === 'string' ? this.data : JSON.stringify(this.data, null, 2);
			} catch (e) {
				return String(this.data);
			}
		},
		listText() {
			if (!this.list || !Array.isArray(this.list)) return [];
			return this.list.map(item => {
				try {
					return typeof item === 'object' ? JSON.stringify(item) : String(item);
				} catch (e) {
					return String(item);
				}
			});
		},
		hasFetch ()  { return typeof this.fetch  === 'function' },
		hasStart ()  { return typeof this.start  === 'function' },
		hasPlay  ()  { return typeof this.play   === 'function' },
		hasDetect()  { return typeof this.detect === 'function' },
		hasChat  ()  { return typeof this.chat   === 'function' },
		hasRedeem()  { return typeof this.redeem === 'function' }
	},
	methods: {
		fetch() { console.log('fetch method called'); },
		start() { console.log('start method called'); },
		play() { console.log('play method called'); },
		detect() { console.log('detect method called'); },
		chat() { console.log('chat method called'); },
		redeem() { console.log('redeem method called'); }
	}
}
</script>

<style scoped></style>