// 统一认证工具模块

// 受保护的路由列表
const PROTECTED_ROUTES = [
  '/pages/user/profile',
  '/pages/admin/metrics', 
  '/pages/cdk/admin-batch',
  '/pages/user/home'
];

// 存储键名常量
const STORAGE_KEYS = {
  TOKEN: 'uni_id_token',
  TOKEN_EXPIRED: 'uni_id_token_expired',
  UID: 'uni_id_uid',
  USER_INFO: 'uni_id_user_info'
};

/**
 * 获取token
 */
function getToken() {
  try {
    return uni.getStorageSync(STORAGE_KEYS.TOKEN) || '';
  } catch (error) {
    console.error('[AUTH] 获取token失败:', error);
    return '';
  }
}

/**
 * 设置token
 * @param {string} token 
 */
function setToken(token) {
  try {
    uni.setStorageSync(STORAGE_KEYS.TOKEN, token);
    console.log('[AUTH] token已保存');
  } catch (error) {
    console.error('[AUTH] 保存token失败:', error);
  }
}

/**
 * 获取token过期时间
 */
function getTokenExpired() {
  try {
    return uni.getStorageSync(STORAGE_KEYS.TOKEN_EXPIRED) || 0;
  } catch (error) {
    console.error('[AUTH] 获取token过期时间失败:', error);
    return 0;
  }
}

/**
 * 设置token过期时间
 * @param {number} expired 
 */
function setTokenExpired(expired) {
  try {
    uni.setStorageSync(STORAGE_KEYS.TOKEN_EXPIRED, expired);
    console.log('[AUTH] token过期时间已保存');
  } catch (error) {
    console.error('[AUTH] 保存token过期时间失败:', error);
  }
}

/**
 * 获取用户ID
 */
function getUid() {
  try {
    return uni.getStorageSync(STORAGE_KEYS.UID) || '';
  } catch (error) {
    console.error('[AUTH] 获取uid失败:', error);
    return '';
  }
}

/**
 * 设置用户ID
 * @param {string} uid 
 */
function setUid(uid) {
  try {
    uni.setStorageSync(STORAGE_KEYS.UID, uid);
    console.log('[AUTH] uid已保存');
  } catch (error) {
    console.error('[AUTH] 保存uid失败:', error);
  }
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  try {
    const userInfo = uni.getStorageSync(STORAGE_KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('[AUTH] 获取用户信息失败:', error);
    return null;
  }
}

/**
 * 设置用户信息
 * @param {Object} userInfo 
 */
function setUserInfo(userInfo) {
  try {
    uni.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
    console.log('[AUTH] 用户信息已保存');
  } catch (error) {
    console.error('[AUTH] 保存用户信息失败:', error);
  }
}

/**
 * 获取完整登录数据
 */
function getLoginData() {
  return {
    token: getToken(),
    tokenExpired: getTokenExpired(),
    uid: getUid(),
    userInfo: getUserInfo()
  };
}

/**
 * 保存登录数据 - 同步写入并触发事件
 * @param {Object} loginData - 登录返回的数据
 */
function saveLoginData(loginData) {
  console.log('[AUTH] 保存登录数据');
  
  // 兼容提取token
  const token = loginData.token || loginData.tokenInfo?.token;
  if (token) {
    setToken(token);
  }
  
  // 兼容提取过期时间，统一为毫秒时间戳
  let tokenExpired = loginData.tokenExpired || 
                    loginData.tokenInfo?.tokenExpired || 
                    loginData.tokenInfo?.exp || 
                    loginData.tokenInfo?.expiresIn;
  
  if (tokenExpired) {
    // 如果是秒级时间戳，转换为毫秒
    if (tokenExpired < 9999999999) {
      tokenExpired = tokenExpired * 1000;
    }
  } else {
    // 默认7天过期
    tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000;
  }
  setTokenExpired(tokenExpired);
  
  // 兼容提取uid
  const uid = loginData.uid || loginData.userInfo?.uid;
  if (uid) {
    setUid(uid);
  }
  
  // 保存用户信息
  if (loginData.userInfo) {
    setUserInfo(loginData.userInfo);
  } else if (uid) {
    // 最小用户信息
    setUserInfo({ uid });
  }
  
  // 安全日志
  const expiredDate = new Date(tokenExpired);
  const expiredStr = expiredDate.getFullYear() + '-' + 
                    String(expiredDate.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(expiredDate.getDate()).padStart(2, '0') + ' ' +
                    String(expiredDate.getHours()).padStart(2, '0') + ':' + 
                    String(expiredDate.getMinutes()).padStart(2, '0') + ':' + 
                    String(expiredDate.getSeconds()).padStart(2, '0');
  
  console.log(`[AUTH] saved tokenLen=${token ? token.length : 0} uid=${uid || ''} expired=${expiredStr}`);
  
  // 触发登录状态变更事件
  try {
    uni.$emit('AUTH_CHANGED', { authed: true });
    console.log('[AUTH] 触发 AUTH_CHANGED 事件: authed=true');
  } catch (error) {
    console.warn('[AUTH] 触发登录状态变更事件失败:', error);
  }
  
  return { token, tokenExpired, uid, userInfo: loginData.userInfo };
}

/**
 * 判断是否已登录
 */
function isAuthed() {
  const token = getToken();
  const expired = getTokenExpired();
  
  // 必须有token
  if (!token) {
    return false;
  }
  
  // 如果没有过期时间，或者未过期，则认为已登录
  if (!expired || expired > Date.now()) {
    return true;
  }
  
  // token已过期，清除数据
  console.log('[AUTH] token已过期，清除登录数据');
  clearLoginData();
  return false;
}

/**
 * 清除登录数据
 */
function clearLoginData() {
  try {
    uni.removeStorageSync(STORAGE_KEYS.TOKEN);
    uni.removeStorageSync(STORAGE_KEYS.TOKEN_EXPIRED);
    uni.removeStorageSync(STORAGE_KEYS.UID);
    uni.removeStorageSync(STORAGE_KEYS.USER_INFO);
    console.log('[AUTH] 登录数据已清除');
    
    // 触发登录状态变更事件
    try {
      uni.$emit('AUTH_CHANGED', { authed: false });
      console.log('[AUTH] 触发 AUTH_CHANGED 事件: authed=false');
    } catch (error) {
      console.warn('[AUTH] 触发登录状态变更事件失败:', error);
    }
  } catch (error) {
    console.error('[AUTH] 清除登录数据失败:', error);
  }
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
      url: '/pages/login/login'
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
  setToken,
  getTokenExpired,
  setTokenExpired,
  getUid,
  setUid,
  getUserInfo,
  setUserInfo,
  getLoginData,
  saveLoginData,
  isAuthed,
  clearLoginData,
  isProtected,
  requireAuth,
  checkRouteAccess,
  PROTECTED_ROUTES,
  STORAGE_KEYS
};

// ==================== 同意状态管理 ====================

/**
 * 检查用户是否已同意协议
 */
export function hasConsent() {
  try {
    const consent = uni.getStorageSync('user_consent');
    return consent && consent.agreed === true;
  } catch (error) {
    console.error('[AUTH] 获取同意状态失败:', error);
    return false;
  }
}

/**
 * 保存同意状态
 */
export function saveConsent(consentData) {
  try {
    uni.setStorageSync('user_consent', consentData);
    console.log('[AUTH] 同意状态已保存');
    return true;
  } catch (error) {
    console.error('[AUTH] 保存同意状态失败:', error);
    return false;
  }
}

/**
 * 获取同意数据
 */
export function getConsentData() {
  try {
    return uni.getStorageSync('user_consent');
  } catch (error) {
    return null;
  }
}

/**
 * 撤回同意
 */
export function revokeConsent() {
  try {
    uni.removeStorageSync('user_consent');
    console.log('[AUTH] 同意已撤回');
    return true;
  } catch (error) {
    return false;
  }
}

export default {
  getToken,
  setToken,
  getTokenExpired,
  setTokenExpired,
  getUid,
  setUid,
  getUserInfo,
  setUserInfo,
  getLoginData,
  saveLoginData,
  isAuthed,
  clearLoginData,
  isProtected,
  requireAuth,
  checkRouteAccess,
  hasConsent,
  saveConsent,
  getConsentData,
  revokeConsent,
  PROTECTED_ROUTES,
  STORAGE_KEYS
};