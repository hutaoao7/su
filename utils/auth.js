// 统一鉴权工具模块

// 受保护的路由列表
const PROTECTED_ROUTES = [
  '/pages/user/profile',
  '/pages/admin/metrics', 
  '/pages/cdk/admin-batch',
  '/pages/user/home'
];

/**
 * 获取token
 */
function getToken() {
  try {
    return uni.getStorageSync('AUTH_TOKEN') || '';
  } catch (error) {
    console.error('获取token失败:', error);
    return '';
  }
}

/**
 * 判断是否已登录
 */
function isAuthed() {
  const token = getToken();
  return !!token && token.length > 0;
}

/**
 * 判断路径是否受保护
 */
function isProtected(path) {
  if (!path) return false;
  
  // 标准化路径，移除查询参数
  const cleanPath = path.split('?')[0];
  
  return PROTECTED_ROUTES.includes(cleanPath);
}

/**
 * 要求登录认证
 * @param {string} toPath 目标路径
 * @returns {boolean} 是否已认证
 */
function requireAuth(toPath) {
  if (isAuthed()) {
    return true;
  }
  
  // 显示提示并跳转登录
  uni.showToast({
    title: '请先登录',
    icon: 'none',
    duration: 2000
  });
  
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/auth/login'
    });
  }, 500);
  
  return false;
}

/**
 * 检查并处理受保护路由访问
 * @param {string} toPath 目标路径
 * @returns {boolean} 是否允许访问
 */
function checkRouteAccess(toPath) {
  if (!isProtected(toPath)) {
    return true; // 非受保护路由，允许访问
  }
  
  return requireAuth(toPath);
}

export {
  getToken,
  isAuthed,
  isProtected,
  requireAuth,
  checkRouteAccess,
  PROTECTED_ROUTES
};

export default {
  getToken,
  isAuthed,
  isProtected,
  requireAuth,
  checkRouteAccess,
  PROTECTED_ROUTES
};