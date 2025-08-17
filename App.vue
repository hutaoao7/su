<template>
  <view id="app">
    <router-view />
  </view>
</template>

<script>
export default {
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
html, body, #app, page { 
  background: #fff !important; 
  height: 100%;
  margin: 0;
  padding: 0;
}

/* 确保页面内容可见 */
#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 移除可能的隐藏样式 */
* {
  box-sizing: border-box;
}

/* 确保没有全屏遮罩 */
.mask, .overlay, .loading-mask {
  display: none !important;
}
</style>