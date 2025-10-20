// 增强的路由守卫实现 - 同意检查 + 登录检查
import { checkRouteAccess, hasConsent, isAuthed } from '@/utils/auth.js';

// 白名单（无需检查）
const CONSENT_WHITELIST = [
  '/pages/home/home',
  '/pages/index/index',
  '/pages/consent/privacy-policy',
  '/pages/consent/user-agreement',
  '/pages/consent/disclaimer',
  '/pages/login/login'
];

function guardCheck(path) {
  // 1. 白名单
  if (CONSENT_WHITELIST.includes(path)) {
    return { allow: true };
  }
  
  // 2. 同意检查
  if (!hasConsent()) {
    console.log('[ROUTE_GUARD] 未同意协议，重定向到登录页');
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/login' });
    }, 100);
    return { allow: false, reason: 'consent' };
  }
  
  // 3. 登录检查（原有逻辑）
  return checkRouteAccess(path) ? { allow: true } : { allow: false, reason: 'auth' };
}

// 保存原始的导航方法
const originalNavigateTo = uni.navigateTo;
const originalSwitchTab = uni.switchTab;
const originalReLaunch = uni.reLaunch;
const originalRedirectTo = uni.redirectTo;

// 重写uni.navigateTo
uni.navigateTo = function(options) {
  const url = options.url;
  const path = url.split('?')[0];
  
  const checkResult = guardCheck(path);
  if (checkResult.allow) {
    return originalNavigateTo.call(this, options);
  } else {
    return Promise.reject(new Error(`Route guarded: ${checkResult.reason}`));
  }
};

// 重写uni.switchTab
uni.switchTab = function(options) {
  const url = options.url;
  const path = url.split('?')[0];
  
  const checkResult = guardCheck(path);
  if (checkResult.allow) {
    return originalSwitchTab.call(this, options);
  } else {
    return Promise.reject(new Error(`Route guarded: ${checkResult.reason}`));
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