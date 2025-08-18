// main.js  —— 适配 H5 / 小程序，H5 才挂错误监听（方案 A）
import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false

// #ifdef H5
if (process.env.NODE_ENV !== 'production') {
  const show = (label, err) => {
    try {
      const el = document.createElement('div')
      el.style.cssText =
        'position:fixed;left:0;right:0;top:0;z-index:99999;background:#ff4d4f;color:#fff;padding:8px 12px;font-size:12px'
      el.textContent = `[${label}] ` + (err && (err.stack || err.message || err))
      document.body.appendChild(el)
    } catch (e) {
      console.error(label, err)
    }
  }
  window.addEventListener('error', e => show('onerror', e.error || e.message))
  window.addEventListener('unhandledrejection', e => show('unhandledrejection', e.reason || e))
}
// #endif

App.mpType = 'app'
new Vue({ ...App }).$mount()
