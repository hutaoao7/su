// main.js
import Vue from 'vue'
import App from './App'

// 导入uView
// 先确保uView的默认配置与uni.$u初始化
import '@/uni_modules/uview-ui/init.js'
import uView from '@/uni_modules/uview-ui'

// 使用uView插件
Vue.use(uView)

// 安装后 uni.$u 由 uView index.js 负责挂载，此处不再做兜底以避免二次安装

// —— 其它全局设置 ——

// 导入统一错误处理
import { handleApiError } from '@/utils/error-messages.js'
Vue.prototype.$handleError = handleApiError

Vue.config.productionTip = false

// 导入性能优化模块
// 小程序端先禁用复杂性能劫持，避免运行时不兼容
// #ifdef H5
import { initPerformanceOptimization } from '@/utils/performance-optimizer'
initPerformanceOptimization()
// #endif

// #ifdef H5
if (process.env.NODE_ENV !== 'production') {
  window.addEventListener('error', function (event) {
    // 忽略 ResizeObserver 的已知告警，避免开发模式刷屏
    if (event?.message?.includes('ResizeObserver loop limit exceeded')) {
      event.stopImmediatePropagation()
    }
  })
}
// #endif

App.mpType = 'app'
const app = new Vue({ ...App })
app.$mount()
