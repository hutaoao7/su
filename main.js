import Vue from 'vue'
import App from './App'

// ✅ 引入 uView（如果你用的是 uview-plus，把这一行改掉）
import uView from '@/uni_modules/uview-ui'

// 全局注册 uView
Vue.use(uView)

// 确保 this.$u 可用（部分版本需要手动挂载）
Vue.prototype.$u = uni.$u

Vue.config.productionTip = false

// #ifdef H5
if (process.env.NODE_ENV !== 'production') {
  window.addEventListener('error', function (event) {
    if (event.message && event.message.includes('ResizeObserver loop limit exceeded')) {
      // 忽略 ResizeObserver 错误
      event.stopImmediatePropagation()
    }
  })
}
// #endif

App.mpType = 'app'

const app = new Vue({
  ...App
})
app.$mount()
