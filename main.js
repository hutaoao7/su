import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false

if (process.env.NODE_ENV !== 'production') {
  const show=(l,e)=>{ try{ const el=document.createElement('div'); el.style.cssText='position:fixed;left:0;right:0;top:0;z-index:99999;background:#ff4d4f;color:#fff;padding:8px 12px;font-size:12px'; el.textContent=`[${l}] `+(e&&(e.stack||e.message||e)); document.body.appendChild(el);}catch(_){ console.error(l,e)} }
  window.addEventListener('error',e=>show('onerror',e.error||e.message))
  window.addEventListener('unhandledrejection',e=>show('unhandledrejection',e.reason||e))
}

App.mpType = 'app'
new Vue({ ...App }).$mount()