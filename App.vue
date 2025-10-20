<template>
  <!-- #ifdef H5 -->
  <view id="app">
    <router-view />
  </view>
  <!-- #endif -->
  
  <!-- #ifndef H5 -->
  <view id="app"></view>
  <!-- #endif -->
</template>

<script>
import { hasConsent } from '@/utils/auth.js';
import { initRouteGuard } from '@/utils/route-guard.js';

export default {
  onLaunch() {
    console.log('App Launch');
    
    // 初始化路由守卫
    initRouteGuard();
    
    // 检查同意状态
    this.checkConsentStatus();
  },
  
  methods: {
    checkConsentStatus() {
      const hasAgreed = hasConsent();
      console.log('[APP] 同意状态:', hasAgreed);
      
      if (!hasAgreed) {
        console.log('[APP] 首次使用，跳转同意页');
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/consent/consent',
            fail: () => {
              uni.reLaunch({ url: '/pages/home/home' });
            }
          });
        }, 500);
      }
    }
  },
  
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
@import '@/uni_modules/uview-ui/index.scss';

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