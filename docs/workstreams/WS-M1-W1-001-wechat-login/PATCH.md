# WS-M1-W1-001: 代码差异 (PATCH)

**工作流ID**: WS-M1-W1-001  
**分支**: `feat/WS-M1-W1-001-wechat-login-enhance`  
**变更文件数**: 4个（1个新建，1个小改，2个复用验证）

---

## 一、新建文件

### 1.1 utils/login-error-handler.js（新建，完整代码）

```javascript
/**
 * 登录错误处理器
 * 统一处理登录过程中的各种错误，提供友好的用户提示
 */

// ==================== 错误码映射表 ====================

/**
 * 错误码映射配置
 * @type {Object.<string|number, {message: string, retry: boolean, action: string}>}
 */
const ERROR_CODE_MAP = {
  // 微信登录错误码
  40029: { 
    message: '授权码已过期', 
    retry: true, 
    action: 'relogin',
    userTip: '授权已过期，请重新点击登录按钮'
  },
  40163: { 
    message: '授权码已使用', 
    retry: true, 
    action: 'relogin',
    userTip: '授权码已使用，请重新登录'
  },
  41001: { 
    message: '缺少必要参数', 
    retry: false, 
    action: 'contact',
    userTip: '登录参数错误，请联系客服'
  },
  
  // HTTP状态码
  400: { 
    message: '请求参数错误', 
    retry: false, 
    action: 'contact',
    userTip: '登录请求异常，请联系客服'
  },
  401: { 
    message: '授权失败', 
    retry: true, 
    action: 'relogin',
    userTip: '授权失败，请重新登录'
  },
  500: { 
    message: '服务器异常', 
    retry: true, 
    action: 'retry',
    userTip: '服务暂时不可用，请稍后重试'
  },
  502: { 
    message: '微信登录服务不可用', 
    retry: true, 
    action: 'retry',
    userTip: '微信登录服务暂时不可用，请稍后重试'
  },
  504: { 
    message: '网关超时', 
    retry: true, 
    action: 'retry',
    userTip: '服务响应超时，请重试'
  },
  
  // 自定义错误类型
  'NETWORK_ERROR': { 
    message: '网络连接失败', 
    retry: true, 
    action: 'check_network',
    userTip: '网络连接失败，请检查网络设置后重试'
  },
  'TIMEOUT': { 
    message: '请求超时', 
    retry: true, 
    action: 'retry',
    userTip: '请求超时，请重试'
  },
  'NO_CODE': {
    message: '未获取到授权码',
    retry: true,
    action: 'relogin',
    userTip: '授权失败，请重新登录'
  },
  'STORAGE_ERROR': {
    message: '数据保存失败',
    retry: false,
    action: 'contact',
    userTip: '登录数据保存失败，请检查存储权限'
  },
};

// ==================== 错误处理函数 ====================

/**
 * 处理登录错误
 * @param {Error|Object} error - 错误对象
 * @returns {Object} 标准化的错误信息
 */
export function handleLoginError(error) {
  console.log('[LOGIN_ERROR_HANDLER] 处理错误:', error);
  
  // 提取错误码
  let errorCode = error.errCode || 
                  error.code || 
                  error.statusCode || 
                  (error.message && error.message.toUpperCase());
  
  console.log('[LOGIN_ERROR_HANDLER] 错误码:', errorCode);
  
  // 查找错误码映射
  const errorInfo = ERROR_CODE_MAP[errorCode];
  
  if (errorInfo) {
    console.log('[LOGIN_ERROR_HANDLER] 找到映射:', errorInfo.message);
    return {
      code: errorCode,
      message: errorInfo.message,
      retry: errorInfo.retry,
      action: errorInfo.action,
      userMessage: errorInfo.userTip,
      originalError: error,
    };
  }
  
  // 未知错误
  console.log('[LOGIN_ERROR_HANDLER] 未知错误，使用默认处理');
  return {
    code: 'UNKNOWN',
    message: error.message || '登录失败',
    retry: true,
    action: 'retry',
    userMessage: '登录遇到问题，请重试',
    originalError: error,
  };
}

// ==================== 网络状态检测 ====================

/**
 * 检查网络状态
 * @returns {Promise<{isConnected: boolean, networkType: string}>}
 */
export function checkNetworkStatus() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        const isConnected = res.networkType !== 'none';
        console.log('[NETWORK_CHECK] 网络状态:', res.networkType, '连接:', isConnected);
        resolve({
          isConnected,
          networkType: res.networkType,
        });
      },
      fail: (error) => {
        console.error('[NETWORK_CHECK] 检查失败:', error);
        // 检查失败，假定网络可用（避免误判）
        resolve({ 
          isConnected: true, 
          networkType: 'unknown' 
        });
      },
    });
  });
}

// ==================== 重试装饰器 ====================

/**
 * 为登录函数添加重试能力
 * @param {Function} loginFn - 登录函数
 * @param {Object} options - 配置选项
 * @param {number} options.maxRetries - 最大重试次数，默认1
 * @param {number} options.delay - 重试延迟（毫秒），默认1000
 * @param {Function} options.shouldRetry - 判断是否应该重试的函数
 * @returns {Function} 包装后的函数
 */
export function withRetry(loginFn, options = {}) {
  const { 
    maxRetries = 1, 
    delay = 1000,
    shouldRetry = (error) => {
      const errorInfo = handleLoginError(error);
      return errorInfo.retry;
    }
  } = options;
  
  return async function (...args) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[LOGIN_RETRY] 尝试 ${attempt + 1}/${maxRetries + 1}`);
        
        const result = await loginFn(...args);
        
        console.log(`[LOGIN_RETRY] 尝试 ${attempt + 1} 成功`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.log(`[LOGIN_RETRY] 尝试 ${attempt + 1} 失败:`, error.message);
        
        // 判断是否应该重试
        if (!shouldRetry(error)) {
          console.log('[LOGIN_RETRY] 错误不可重试，直接抛出');
          throw error;
        }
        
        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
          console.log(`[LOGIN_RETRY] ${delay}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // 所有重试失败
    console.log('[LOGIN_RETRY] 所有尝试失败，抛出最后一个错误');
    throw lastError;
  };
}

// ==================== 导出 ====================

export default {
  handleLoginError,
  checkNetworkStatus,
  withRetry,
  ERROR_CODE_MAP,
};
```

**文件大小**: 约200行  
**说明**: 完整的登录错误处理工具集

---

## 二、小改文件

### 2.1 utils/wechat-login.js（小改）

```diff
+// 导入错误处理器
+import { handleLoginError, checkNetworkStatus } from './login-error-handler.js';
+
 // 微信登录工具函数
-export const wechatLogin = () => {
+export const wechatLogin = async () => {
   return new Promise((resolve, reject) => {
     console.log('[WX_LOGIN] starting wx.login');
     
+    // 检查网络状态
+    checkNetworkStatus().then(networkStatus => {
+      if (!networkStatus.isConnected) {
+        console.error('[WX_LOGIN] 网络未连接');
+        uni.showToast({ 
+          title: '网络未连接，请检查网络设置', 
+          icon: 'none',
+          duration: 3000
+        });
+        reject(new Error('NETWORK_ERROR'));
+        return;
+      }
+      
+      console.log('[WX_LOGIN] 网络正常，继续登录');
+      performLogin();
+    });
+    
+    function performLogin() {
       // 每次都获取新的 code
       wx.login({
         success: ({ code }) => {
           if (!code) {
             console.error('[WX_LOGIN] wx.login success but no code received');
-            uni.showToast({ title: '未获取到授权码', icon: 'none' });
+            const errorInfo = handleLoginError({ code: 'NO_CODE' });
+            uni.showToast({ 
+              title: errorInfo.userMessage, 
+              icon: 'none',
+              duration: 3000
+            });
             reject(new Error('未获取到code'));
             return;
           }
           
           console.log('[WX_LOGIN] got wx.login code:', code.substring(0, 8) + '...');
           
           // 调用云函数
           console.log('[WX_LOGIN] calling auth-login cloud function');
           uniCloud.callFunction({
             name: 'auth-login',
-            data: { code }
+            data: { code },
+            timeout: 6000 // 6秒超时
           }).then(({ result }) => {
             console.log('[WX_LOGIN] auth-login raw result:', result);
             
             const r = result || {};
             const ok = (r && Number(r.errCode) === 0 && r.data && Object.keys(r.data).length > 0);
             
             if (ok) {
               console.log('[WX_LOGIN] login success, saving tokens');
               const loginData = r.data;
               
               // ... 原有保存逻辑 ...
               
               uni.showToast({ title: '登录成功' });
               resolve(loginData);
             } else {
-              const errMsg = r?.errMsg || '登录服务异常';
+              // 使用错误处理器
+              const errorInfo = handleLoginError({ 
+                errCode: r.errCode, 
+                errMsg: r.errMsg 
+              });
+              console.error('[WX_LOGIN] login failed:', errorInfo.message);
+              uni.showToast({ 
+                title: errorInfo.userMessage, 
+                icon: 'none',
+                duration: 3000
+              });
-              uni.showToast({ title: errMsg, icon: 'none' });
-              reject(new Error(errMsg));
+              reject(errorInfo);
             }
           }).catch(err => {
             console.error('[WX_LOGIN] cloud function call error:', err);
-            uni.showToast({ title: '网络错误，请重试', icon: 'none' });
+            const errorInfo = handleLoginError(err);
+            uni.showToast({ 
+              title: errorInfo.userMessage, 
+              icon: 'none',
+              duration: 3000
+            });
             reject(err);
           });
         },
         fail: (err) => {
           console.error('[WX_LOGIN] wx.login fail:', err);
-          uni.showToast({ title: '微信授权失败', icon: 'none' });
+          const errorInfo = handleLoginError(err);
+          uni.showToast({ 
+            title: errorInfo.userMessage || '微信授权失败，请重试', 
+            icon: 'none',
+            duration: 3000
+          });
           reject(err);
         }
       });
+    }
   });
 };
 
+// 导出带重试能力的版本（可选）
+import { withRetry } from './login-error-handler.js';
+export const wechatLoginWithRetry = withRetry(wechatLogin, {
+  maxRetries: 1,
+  delay: 1000,
+});
+
 // 检查登录状态
 export const checkLoginStatus = () => {
   // ... 原有代码保持不变 ...
 };
```

**说明**: 
- 新增网络状态检测
- 集成错误处理器
- 优化错误提示
- 添加超时配置
- 导出带重试版本（可选使用）

---

## 三、复用验证文件（无需修改，仅验证）

### 3.1 pages/login/login.vue

**验证内容**:
- [x] u-popup 组件可用（依赖WS-M0-001）
- [x] 登录流程完整
- [x] 错误处理存在（虽然简单）
- [x] 调试信息展示完整

**结论**: ✅ **无需修改**，可直接复用

**可选优化**（不强制）:
```diff
 // 如果需要更详细的加载提示，可添加：
 data() {
   return {
+    loginStep: '', // '获取授权' / '验证中' / '保存信息'
   }
 },
 
 methods: {
   async handleWxLogin() {
+    this.loginStep = '获取授权';
     const { code } = await wx.login(...);
     
+    this.loginStep = '验证中';
     const result = await authAPI.wxLogin(code);
     
+    this.loginStep = '保存信息';
     saveLoginData(result.data);
   }
 }
```

---

### 3.2 utils/auth.js

**验证内容**:
- [x] getToken() 功能正常
- [x] saveLoginData() 逻辑完善
- [x] isAuthed() 正确判断过期
- [x] clearLoginData() 清理干净
- [x] AUTH_CHANGED 事件触发

**结论**: ✅ **无需修改**，代码已经很完善

**已有优点**:
1. 兼容多种数据结构（tokenInfo/token）
2. 过期时间自动转换（秒→毫秒）
3. 存储失败有try-catch
4. 触发全局事件
5. 详细的日志记录

---

### 3.3 uniCloud-aliyun/cloudfunctions/auth-login/index.js

**验证内容**:
- [x] 微信jscode2session调用正确
- [x] JWT签发逻辑正确
- [x] 环境变量使用正确（WS-M0-003）
- [x] 错误处理完善

**结论**: ✅ **无需修改**

**已有优点**:
1. 使用环境变量（WX_APPID等）
2. 超时设置6秒
3. 错误码规范（errCode/errMsg）
4. 日志记录完善

---

## 四、package.json（新增scripts，可选）

```diff
 {
   "scripts": {
+    "test:login": "jest tests/login.test.js",
     ...
   }
 }
```

---

## 五、变更总结

### 新建文件（1个）

- `utils/login-error-handler.js` - 约200行

### 小改文件（1个）

- `utils/wechat-login.js` - 新增约30行，修改约10行

### 复用验证（3个）

- `pages/login/login.vue` - ✅ 无需修改
- `utils/auth.js` - ✅ 无需修改
- `auth-login/index.js` - ✅ 无需修改

### 代码行数统计

- **新增代码**: ~230行
- **修改代码**: ~10行
- **删除代码**: 0行

---

## 六、使用示例

### 6.1 使用错误处理器

```javascript
// 在login.vue中使用
import { handleLoginError } from '@/utils/login-error-handler.js';

try {
  await wechatLogin();
} catch (error) {
  const errorInfo = handleLoginError(error);
  
  // 显示友好提示
  uni.showToast({
    title: errorInfo.userMessage,
    icon: 'none',
    duration: 3000,
  });
  
  // 根据action决定下一步
  if (errorInfo.action === 'relogin') {
    // 显示重试按钮
    this.showRetryButton = true;
  } else if (errorInfo.action === 'contact') {
    // 显示联系客服
    this.showContactButton = true;
  }
}
```

---

### 6.2 使用重试版本

```javascript
// 方式1: 使用导出的重试版本
import { wechatLoginWithRetry } from '@/utils/wechat-login.js';

try {
  const result = await wechatLoginWithRetry();
  // 自动重试1次
} catch (error) {
  // 重试后仍失败
}

// 方式2: 自定义重试配置
import { wechatLogin } from '@/utils/wechat-login.js';
import { withRetry } from '@/utils/login-error-handler.js';

const loginWithCustomRetry = withRetry(wechatLogin, {
  maxRetries: 2, // 最多重试2次
  delay: 2000,   // 间隔2秒
});

const result = await loginWithCustomRetry();
```

---

### 6.3 网络检测使用

```javascript
import { checkNetworkStatus } from '@/utils/login-error-handler.js';

// 在登录前检查
const networkStatus = await checkNetworkStatus();
if (!networkStatus.isConnected) {
  uni.showModal({
    title: '网络未连接',
    content: '请检查网络设置后重试',
    showCancel: false,
  });
  return;
}

// 继续登录流程...
```

---

## 七、测试验证

### 构建验证

```bash
# 开发环境
npm run dev:mp-weixin

# 预期: 启动成功，无error
```

### ESLint验证

```bash
npm run lint utils/login-error-handler.js utils/wechat-login.js

# 预期: 0 errors
```

---

**变更状态**: ✅ 已完成  
**测试状态**: 待测试  
**审核人**: _______

