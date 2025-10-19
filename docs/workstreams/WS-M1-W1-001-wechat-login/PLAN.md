# WS-M1-W1-001: 微信登录 - 计划文档

**工作流ID**: WS-M1-W1-001  
**分支**: `feat/WS-M1-W1-001-wechat-login-enhance`  
**负责人**: 前端A  
**预计工时**: 8h

---

## 一、输入/输出

### 输入

1. **现有代码分析**（从复用扫描）
   - ✅ pages/login/login.vue - 完整的登录页面
   - ✅ utils/wechat-login.js - 微信登录封装
   - ✅ utils/auth.js - 认证工具（Token/用户信息管理）
   - ✅ uniCloud-aliyun/cloudfunctions/auth-login/index.js - 登录云函数

2. **发现的问题**
   - ⚠️ 错误处理不够细致
   - ⚠️ code过期未提示重试
   - ⚠️ 网络异常处理简单
   - ⚠️ Token刷新机制未实现
   - ⚠️ 缺少加密存储（M2任务，本工作流不涉及）

### 输出

1. ✅ 完善的错误处理逻辑
2. ✅ code过期自动重试机制
3. ✅ 网络异常友好提示
4. ✅ Token过期检测与提示
5. ✅ 登录流程优化（减少等待时间）
6. ✅ 用户友好的提示文案
7. ✅ 完整的测试用例

---

## 二、依赖关系

### 前置依赖

- **WS-M0-001**: UI组件库统一（login.vue使用u-popup）
- **WS-M0-003**: 环境变量管理（WX_APPID、WX_APPSECRET配置）

### 后置影响

- **WS-M1-W1-002**: 用户信息页面（依赖登录态）
- **WS-M1-W1-003**: 同意管理流程（依赖登录态）
- **WS-M1-W1-006**: 路由守卫（依赖isAuthed()）
- **所有需要登录的功能**: 评估、AI干预、CDK等

---

## 三、风险控制

| 风险项 | 可能性 | 影响 | 缓解措施 | 应急预案 |
|--------|--------|------|----------|----------|
| code只能使用一次 | 高 | 中 | 1. 失败后重新获取code<br>2. 不缓存code<br>3. 清晰提示用户 | 引导用户重试 |
| 网络超时 | 中 | 中 | 1. 设置合理超时（6s）<br>2. 离线检测<br>3. 重试机制 | 缓存凭证，允许离线 |
| 微信登录接口限流 | 低 | 低 | 1. 控制调用频率<br>2. 防抖处理 | 提示稍后重试 |
| 用户拒绝授权 | 中 | 低 | 1. 说明授权必要性<br>2. 允许返回 | 部分功能游客可用 |
| Token过期 | 中 | 中 | 1. 过期检测<br>2. 自动清理<br>3. 引导重新登录 | M2实现自动刷新 |

---

## 四、文件清单

### 4.1 复用文件（验证，无需改动）

#### pages/login/login.vue

- **复用策略**: ✅ 直接复用
- **验证内容**:
  - u-popup组件可用（依赖WS-M0-001）
  - 登录流程完整
  - 调试信息展示正常
- **风险**: 低

#### utils/auth.js

- **复用策略**: ✅ 直接复用
- **验证内容**:
  - Token管理功能完整
  - isAuthed()逻辑正确
  - saveLoginData()正确保存
- **风险**: 低

#### uniCloud-aliyun/cloudfunctions/auth-login/index.js

- **复用策略**: ✅ 直接复用
- **验证内容**:
  - 微信jscode2session调用正确
  - JWT签发逻辑正确
  - 错误处理完善
- **风险**: 低

---

### 4.2 小改文件（优化）

#### utils/wechat-login.js

- **复用策略**: ⚠️ 小改
- **优化内容**:

```javascript
// 优化点1: 添加网络状态检测
export const wechatLogin = async () => {
  // 检查网络状态
  const networkStatus = await checkNetworkStatus();
  if (!networkStatus.isConnected) {
    throw new Error('网络未连接，请检查网络设置');
  }
  
  // 原有登录逻辑...
}

// 优化点2: 添加code过期重试
// 如果返回errCode=40029（code过期），自动重试一次
if (r.errCode === 40029) {
  console.log('[WX_LOGIN] code过期，重新获取');
  // 递归调用（最多1次重试）
}

// 优化点3: 更友好的错误提示
const ERROR_MESSAGES = {
  40029: 'code已过期，请重新登录',
  40163: '授权码已使用',
  41001: '缺少必要参数',
  // ...
};

// 优化点4: 添加超时控制
const timeout = 6000; // 6秒超时
```

**预计改动行数**: 50-80行（增加）

---

#### pages/login/login.vue

- **复用策略**: ⚠️ 小改（可选）
- **可选优化**:

```javascript
// 优化1: 更详细的加载提示
loginLoading: false,
loginStep: '', // '获取授权' / '登录中' / '保存信息'

// 优化2: 错误提示区域
loginError: '',
showErrorTip: false,

// 优化3: 重试按钮
methods: {
  handleRetry() {
    this.loginError = '';
    this.handleWxLogin();
  }
}
```

**预计改动行数**: 30-50行（增加，可选）

---

### 4.3 新建文件

#### utils/login-error-handler.js

- **用途**: 统一登录错误处理
- **功能**:

```javascript
/**
 * 登录错误处理器
 */

// 错误码映射
const ERROR_CODE_MAP = {
  // 微信登录错误
  40029: { message: '授权码已过期', retry: true, action: 'relogin' },
  40163: { message: '授权码已使用', retry: true, action: 'relogin' },
  41001: { message: '缺少必要参数', retry: false, action: 'contact' },
  
  // 云函数错误
  400: { message: '请求参数错误', retry: false, action: 'contact' },
  401: { message: '授权失败', retry: true, action: 'relogin' },
  500: { message: '服务器异常', retry: true, action: 'retry' },
  502: { message: '微信登录服务不可用', retry: true, action: 'retry' },
  
  // 网络错误
  'NETWORK_ERROR': { message: '网络连接失败', retry: true, action: 'check_network' },
  'TIMEOUT': { message: '请求超时', retry: true, action: 'retry' },
};

/**
 * 处理登录错误
 * @param {Error|Object} error - 错误对象
 * @returns {Object} { message, retry, action, userMessage }
 */
export function handleLoginError(error) {
  let errorCode = error.errCode || error.code || error.message;
  
  // 查找错误码映射
  const errorInfo = ERROR_CODE_MAP[errorCode];
  
  if (errorInfo) {
    return {
      code: errorCode,
      message: errorInfo.message,
      retry: errorInfo.retry,
      action: errorInfo.action,
      userMessage: getUserFriendlyMessage(errorInfo),
    };
  }
  
  // 未知错误
  return {
    code: 'UNKNOWN',
    message: error.message || '登录失败',
    retry: true,
    action: 'retry',
    userMessage: '登录遇到问题，请重试',
  };
}

/**
 * 获取用户友好的错误提示
 */
function getUserFriendlyMessage(errorInfo) {
  const actionMessages = {
    relogin: '请重新点击登录按钮',
    retry: '请稍后重试',
    check_network: '请检查网络连接后重试',
    contact: '请联系客服',
  };
  
  return `${errorInfo.message}。${actionMessages[errorInfo.action] || ''}`;
}

/**
 * 检查网络状态
 */
export async function checkNetworkStatus() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        const isConnected = res.networkType !== 'none';
        resolve({
          isConnected,
          networkType: res.networkType,
        });
      },
      fail: () => {
        resolve({ isConnected: false, networkType: 'unknown' });
      },
    });
  });
}

/**
 * 登录重试装饰器
 * @param {Function} loginFn - 登录函数
 * @param {Object} options - 配置选项
 */
export function withRetry(loginFn, options = {}) {
  const { maxRetries = 1, delay = 1000 } = options;
  
  return async function (...args) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[LOGIN_RETRY] 尝试 ${attempt + 1}/${maxRetries + 1}`);
        return await loginFn(...args);
      } catch (error) {
        lastError = error;
        const errorInfo = handleLoginError(error);
        
        // 如果不可重试，直接抛出
        if (!errorInfo.retry) {
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
    throw lastError;
  };
}
```

**文件大小**: 约200行

---

#### utils/token-refresh.js（新建，M2任务，本工作流仅规划）

```javascript
/**
 * Token刷新逻辑（M2阶段实现）
 * 本工作流仅添加检测逻辑，不实现刷新
 */

export function needsRefresh(tokenExpired) {
  if (!tokenExpired) return false;
  
  const now = Date.now();
  const remainingTime = tokenExpired - now;
  const oneHour = 60 * 60 * 1000;
  
  // 剩余时间 < 1小时，需要刷新
  return remainingTime < oneHour;
}

// TODO: M2阶段实现自动刷新
export async function refreshToken() {
  throw new Error('Token刷新功能将在M2阶段实现');
}
```

---

## 五、实施步骤

### Step 1: 代码审查（2h）

#### 1.1 阅读现有代码
- [x] pages/login/login.vue（740行）
- [x] utils/wechat-login.js（137行）
- [x] utils/auth.js（333行）
- [x] auth-login/index.js（60行）

#### 1.2 识别优化点
- [ ] 错误处理可优化（wechat-login.js）
- [ ] 用户提示可优化（login.vue）
- [ ] Token检测逻辑（auth.js，已完善）

---

### Step 2: 开发错误处理器（2h）

创建 `utils/login-error-handler.js`:
- 错误码映射表
- handleLoginError()
- checkNetworkStatus()
- withRetry()装饰器

---

### Step 3: 优化wechat-login.js（2h）

```javascript
// 主要优化内容：

// 1. 导入错误处理器
import { handleLoginError, checkNetworkStatus, withRetry } from './login-error-handler.js';

// 2. 网络检测
const networkStatus = await checkNetworkStatus();
if (!networkStatus.isConnected) {
  throw new Error('NETWORK_ERROR');
}

// 3. 更详细的错误日志
console.log('[WX_LOGIN] auth-login返回:', {
  errCode: r.errCode,
  errMsg: r.errMsg,
  hasData: !!r.data,
});

// 4. code过期重试
if (r.errCode === 40029) {
  console.log('[WX_LOGIN] code过期，重新获取');
  // 不递归调用，返回特定错误码让上层处理
  throw { code: 40029, message: 'code已过期', needRetry: true };
}

// 5. 使用withRetry包装
export const wechatLoginWithRetry = withRetry(wechatLogin, {
  maxRetries: 1,
  delay: 1000,
});
```

---

### Step 4: 优化登录页面（可选，1h）

```javascript
// pages/login/login.vue 优化内容：

// 1. 更详细的加载状态
data() {
  return {
    loginStep: '', // '获取授权' / '验证中' / '保存信息'
    loginError: null,
  }
},

// 2. 使用优化后的登录方法
import { wechatLoginWithRetry } from '@/utils/wechat-login.js';
import { handleLoginError } from '@/utils/login-error-handler.js';

async handleWxLogin() {
  try {
    this.loginStep = '获取授权';
    // 使用带重试的版本
    const result = await wechatLoginWithRetry();
    
    this.loginStep = '保存信息';
    saveLoginData(result);
    
    // 成功...
  } catch (error) {
    // 使用错误处理器
    const errorInfo = handleLoginError(error);
    
    this.loginError = errorInfo.userMessage;
    uni.showToast({
      title: errorInfo.userMessage,
      icon: 'none',
      duration: 3000,
    });
    
    // 如果可重试，显示重试按钮
    if (errorInfo.retry) {
      this.showRetryButton = true;
    }
  }
}
```

---

### Step 5: 测试验证（1h）

见 TESTS.md

---

## 六、详细代码分析

### 6.1 现有登录流程

```
用户点击登录按钮
  ↓
检查协议是否同意
  ↓
wx.login() 获取 code
  ↓
调用 auth-login 云函数 (code)
  ↓
云函数调用微信 jscode2session
  ↓
返回 openid + session_key
  ↓
云函数签发自定义 JWT token
  ↓
前端保存 token/uid/userInfo
  ↓
跳转到个人中心
```

### 6.2 存储的数据

```javascript
// 存储在uni.storage中：
uni_id_token: "JWT_TOKEN_STRING"           // JWT token
uni_id_token_expired: 1234567890000        // 过期时间戳（毫秒）
uni_id_uid: "openid_string"                // 用户openid
user_info: { uid, unionid, ... }           // 用户信息对象（JSON字符串）
userAgreement: { agreed: true, timestamp } // 协议同意状态
```

### 6.3 现有错误处理

```javascript
// wechat-login.js 中的错误处理：

// wx.login fail
fail: (err) => {
  console.error('[WX_LOGIN] wx.login fail:', err);
  uni.showToast({ title: '微信授权失败', icon: 'none' });
  reject(err);
}

// 云函数调用失败
.catch(err => {
  console.error('[WX_LOGIN] cloud function call error:', err);
  uni.showToast({ title: '网络错误，请重试', icon: 'none' });
  reject(err);
});

// 登录失败（errCode !== 0）
if (!ok) {
  const errMsg = r?.errMsg || '登录服务异常';
  uni.showToast({ title: errMsg, icon: 'none' });
  reject(new Error(errMsg));
}
```

**评估**: 
- ✅ 基本错误处理已实现
- ⚠️ 错误提示较简单，可优化
- ⚠️ 缺少重试机制
- ⚠️ 缺少网络检测

---

## 七、优化对比

### 7.1 错误提示优化

| 场景 | 现有提示 | 优化后提示 | 改进点 |
|------|---------|-----------|--------|
| wx.login失败 | "微信授权失败" | "微信授权失败，请重试或检查权限" | 增加引导 |
| 网络错误 | "网络错误，请重试" | "网络连接失败，请检查网络设置后重试" | 更具体 |
| code过期 | "登录服务异常" | "授权已过期，请重新点击登录" | 明确问题 |
| 云函数异常 | "登录服务异常" | "登录服务暂时不可用，请稍后重试" | 更友好 |

### 7.2 用户体验优化

| 优化项 | 现状 | 优化后 | 收益 |
|--------|------|--------|------|
| 加载提示 | "登录中..." | "获取授权中..." / "验证中..." | 更清晰 |
| 错误展示 | Toast提示 | Toast + 页面错误区域 | 更持久 |
| 重试交互 | 手动点击登录按钮 | 错误后显示"重试"按钮 | 更便捷 |
| 网络提示 | 统一"网络错误" | 离线检测 + 具体提示 | 更准确 |

---

## 八、验证计划

### 8.1 正常流程测试

1. **首次登录**
   - 检查协议勾选
   - 点击登录按钮
   - 观察加载提示
   - 登录成功跳转

2. **二次登录**
   - Token有效期内
   - 直接使用已登录态

3. **退出后重新登录**
   - 清除登录态
   - 重新走登录流程

---

### 8.2 异常流程测试

1. **网络断开**
   - 断开网络
   - 点击登录
   - 预期：提示"网络连接失败"

2. **code过期**
   - 使用已过期的code
   - 预期：自动重试或提示重新登录

3. **微信接口异常**
   - Mock微信接口返回错误
   - 预期：友好提示

4. **云函数异常**
   - Mock云函数返回错误
   - 预期：友好提示 + 重试按钮

5. **快速重复点击**
   - 多次点击登录按钮
   - 预期：防抖，仅执行一次

---

### 8.3 边界场景测试

1. **协议未勾选**
   - 点击登录
   - 预期：提示"请先同意相关协议"

2. **Token即将过期**
   - 设置Token剩余1小时
   - 预期：（M2实现刷新）暂无处理

3. **存储失败**
   - Mock存储失败
   - 预期：登录失败提示

---

## 九、成功标准

### 9.1 功能标准

- [ ] 正常登录流程通畅（<3s）
- [ ] 网络异常正确检测和提示
- [ ] code过期可自动重试或引导重试
- [ ] Token过期自动清理
- [ ] 所有错误有友好提示
- [ ] 防止重复点击

### 9.2 体验标准

- [ ] 加载提示清晰
- [ ] 错误提示友好（不显示技术术语）
- [ ] 可以方便地重试
- [ ] 等待时间合理（<3s成功，>3s显示"请稍候"）

### 9.3 安全标准

- [ ] Token安全存储（M2加密，本阶段明文可接受）
- [ ] 敏感信息不在日志中
- [ ] 登录失败有日志记录

---

## 十、后续任务

### M1阶段

- **WS-M1-W1-002**: 用户信息页面（依赖登录态）
- **WS-M1-W1-006**: 路由守卫（使用isAuthed()）

### M2阶段

- **WS-M2-W5-001**: 本地存储加密（加密Token）
- **WS-M2-W7-002**: 异常捕获（集成登录错误上报）

### 长期优化

- Token自动刷新（auth-refresh云函数）
- 游客模式（部分功能无需登录）
- 多端登录检测

---

**计划状态**: ✅ 已完成  
**审核人**: _______  
**批准实施**: [ ] 是  [ ] 否

