<template>
  <view class="safe-nav glass">
    <view class="left" @click="onBack" v-if="showBack">‹</view>
    <view class="title">{{ title }}</view>
    <view class="right"><slot name="right"/></view>
  </view>
</template>
<script>
export default {
  props:{ title:{type:String,default:''}, showBack:{type:Boolean,default:true} },
  methods:{ onBack(){ uni.navigateBack({delta:1}) } }
}
</script>
<style scoped>
.safe-nav{ position:fixed; top:0; left:0; right:0; height:88rpx; z-index:10;
  display:flex; align-items:center; padding:0 24rpx; box-sizing:border-box; }
.left{ width:80rpx; font-size:40rpx; line-height:88rpx; text-align:left; }
.title{ flex:1; text-align:center; font-weight:600; }
.right{ width:80rpx; text-align:right; }
.glass{ background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(255,255,255,.58));
  backdrop-filter:saturate(1.2) blur(20px); box-shadow:0 8rpx 16rpx rgba(10,132,255,.12); }
</style>