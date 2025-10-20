<template>
  <view class="page">
    <view class="card"><text class="text-muted">✅ 新版 UI · 页面渲染成功</text></view>
    <view class="row" style="margin-top:16rpx">
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/user/home'})">个人中心</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/community/index'})">社区</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages-sub/other/metrics'})">数据指标</button>
    </view>
  </view>
</template>

<script>
export default {
	data() {
		return {
			title: 'Hello'
		}
	},
	onLoad() {

	},
	methods: {

	},
	computed: {
	  hasFetch ()  { return typeof this.fetch  === 'function' },
	  hasStart ()  { return typeof this.start  === 'function' },
	  hasPlay  ()  { return typeof this.play   === 'function' },
	  hasDetect()  { return typeof this.detect === 'function' },
	  hasChat  ()  { return typeof this.chat   === 'function' },
	  hasRedeem()  { return typeof this.redeem === 'function' }
	}
}
</script>

<style scoped></style>