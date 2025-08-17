// 安全调用工具函数
// 用于统一处理API调用和路由跳转的错误，确保应用不会因为功能未实现而崩溃

/**
 * 安全调用API函数
 * @param {Function} promiseFactory - 返回Promise的工厂函数
 * @param {number} timeout - 超时时间（毫秒），默认2000ms
 * @returns {Promise} - 返回Promise，异常/超时时返回null并Toast提示
 */
export async function safeInvokeApi(promiseFactory, timeout = 2000) {
  return new Promise((resolve) => {
    // 创建超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('请求超时'));
      }, timeout);
    });
    
    try {
      // 执行API调用
      const apiPromise = promiseFactory();
      
      // Promise.race处理超时
      Promise.race([apiPromise, timeoutPromise])
        .then(result => {
          resolve(result);
        })
        .catch(error => {
          console.error('API调用失败:', error);
          uni.showToast({
            title: '此功能暂未上线',
            icon: 'none',
            duration: 2000
          });
          resolve(null);
        });
    } catch (error) {
      console.error('API调用异常:', error);
      uni.showToast({
        title: '此功能暂未上线',
        icon: 'none',
        duration: 2000
      });
      resolve(null);
    }
  });
}

/**
 * 安全调用路由跳转
 * @param {string} toPath - 要跳转的页面路径
 * @param {Object} options - 跳转选项
 * @returns {Promise} - 返回Promise
 */
export async function safeInvokeRoute(toPath, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // 检查路径是否有效
      if (!toPath || typeof toPath !== 'string') {
        throw new Error('无效的路由地址');
      }
      
      console.log('[DEBUG] 尝试跳转到:', toPath);
      
      // 根据路径类型选择跳转方式
      if (toPath.includes('/pages/home/') || toPath.includes('/pages/features/') || toPath.includes('/pages/settings/') || toPath.includes('/pages/index/')) {
        // TabBar页面使用switchTab
        uni.switchTab({
          url: toPath,
          success: (res) => {
            console.log('[DEBUG] switchTab成功:', toPath);
            resolve(res);
          },
          fail: (error) => {
            console.error('[DEBUG] switchTab失败:', error);
            uni.showToast({
              title: '此功能暂未上线',
              icon: 'none',
              duration: 2000
            });
            reject(error);
          }
        });
      } else if (toPath.includes('/pages/auth/')) {
        // 认证页面使用reLaunch，清空页面栈
        uni.reLaunch({
          url: toPath,
          success: (res) => {
            console.log('[DEBUG] reLaunch成功:', toPath);
            resolve(res);
          },
          fail: (error) => {
            console.error('[DEBUG] reLaunch失败:', error);
            uni.showToast({
              title: '此功能暂未上线',
              icon: 'none',
              duration: 2000
            });
            reject(error);
          }
        });
      } else {
        // 普通页面使用navigateTo
        uni.navigateTo({
          url: toPath,
          success: (res) => {
            console.log('[DEBUG] navigateTo成功:', toPath);
            resolve(res);
          },
          fail: (error) => {
            console.error('[DEBUG] navigateTo失败:', error);
            uni.showToast({
              title: '此功能暂未上线',
              icon: 'none',
              duration: 2000
            });
            reject(error);
          }
        });
      }
    } catch (error) {
      console.error('[DEBUG] 路由跳转异常:', error);
      uni.showToast({
        title: '此功能暂未上线',
        icon: 'none',
        duration: 2000
      });
      reject(error);
    }
  });
}

/**
 * 安全调用通用函数
 * @param {Function} func - 要调用的函数
 * @param {string} errorMessage - 错误提示信息
 * @returns {Promise} - 返回Promise
 */
export async function safeInvoke(func, errorMessage = '此功能暂未上线') {
  return new Promise((resolve, reject) => {
    try {
      const result = func();
      
      if (result && typeof result.then === 'function') {
        result
          .then(resolve)
          .catch(error => {
            uni.showToast({
              title: errorMessage,
              icon: 'none',
              duration: 2000
            });
            reject(error);
          });
      } else {
        resolve(result);
      }
    } catch (error) {
      uni.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000
      });
      reject(error);
    }
  });
}

/**
 * 延迟执行函数
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise} - 返回Promise
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全获取本地存储
 * @param {string} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @returns {*} - 存储值或默认值
 */
export function safeGetStorage(key, defaultValue = null) {
  try {
    return uni.getStorageSync(key) || defaultValue;
  } catch (error) {
    console.error('获取本地存储失败:', error);
    return defaultValue;
  }
}

/**
 * 安全设置本地存储
 * @param {string} key - 存储键名
 * @param {*} value - 存储值
 * @returns {boolean} - 是否成功
 */
export function safeSetStorage(key, value) {
  try {
    uni.setStorageSync(key, value);
    return true;
  } catch (error) {
    console.error('设置本地存储失败:', error);
    return false;
  }
}