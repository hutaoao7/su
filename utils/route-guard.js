// 简化的路由守卫实现
import { checkRouteAccess } from '@/utils/auth.js';

// 保存原始的导航方法
const originalNavigateTo = uni.navigateTo;
const originalSwitchTab = uni.switchTab;
const originalReLaunch = uni.reLaunch;
const originalRedirectTo = uni.redirectTo;

// 重写uni.navigateTo
uni.navigateTo = function(options) {
  const url = options.url;
  const path = url.split('?')[0];
  
  if (checkRouteAccess(path)) {
    return originalNavigateTo.call(this, options);
  } else {
    // 已在checkRouteAccess中处理Toast和跳转
    return Promise.reject(new Error('路由访问被拒绝'));
  }
};

// 重写uni.switchTab
uni.switchTab = function(options) {
  const url = options.url;
  const path = url.split('?')[0];
  
  if (checkRouteAccess(path)) {
    return originalSwitchTab.call(this, options);
  } else {
    return Promise.reject(new Error('路由访问被拒绝'));
  }
};

// 重写uni.reLaunch
uni.reLaunch = function(options) {
  const url = options.url;
  const path = url.split('?')[0];
  
  if (checkRouteAccess(path)) {
    return originalReLaunch.call(this, options);
  } else {
    return Promise.reject(new Error('路由访问被拒绝'));
  }
};

// 重写uni.redirectTo
uni.redirectTo = function(options) {
  const url = options.url;
  const path = url.split('?')[0];
  
  if (checkRouteAccess(path)) {
    return originalRedirectTo.call(this, options);
  } else {
    return Promise.reject(new Error('路由访问被拒绝'));
  }
};

// 导出初始化函数
export function initRouteGuard() {
  console.log('[路由守卫] 已初始化');
}

export default {
  initRouteGuard
};