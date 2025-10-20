# auth-refresh API文档

## 基本信息

- **云函数名称**: `auth-refresh`
- **功能描述**: 刷新用户Token
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要有效或即将过期的Token
- **限流策略**: 每用户每分钟最多3次请求

---

## 业务说明

本接口用于刷新用户的访问Token，延长登录状态。当Token即将过期或已过期时，客户端应主动调用此接口获取新Token。

### Token生命周期
- **Access Token**: 有效期7天
- **Refresh Token**: 有效期30天
- **刷新策略**: Access Token过期前1天可刷新

### 使用场景
1. Token即将过期（剩余时间<24小时）
2. API调用返回401错误（Token过期）
3. 应用启动时检查Token有效期
4. 用户长时间未操作后重新激活

---

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| refresh_token | String | 是 | - | 刷新Token |
| device_id | String | 否 | - | 设备唯一标识 |
| app_version | String | 否 | - | 应用版本号 |

### 参数说明

**refresh_token**
- 格式：JWT字符串
- 来源：登录成功后服务器返回
- 存储：本地安全存储
- 示例：`"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`

**device_id**
- 用于安全验证
- 防止Token被盗用
- 建议：每个设备生成唯一ID

---

## 请求示例

```javascript
// 基本刷新
const { result } = await uniCloud.callFunction({
  name: 'auth-refresh',
  data: {
    refresh_token: uni.getStorageSync('refresh_token')
  }
});

// 带设备验证的刷新
const { result } = await uniCloud.callFunction({
  name: 'auth-refresh',
  data: {
    refresh_token: uni.getStorageSync('refresh_token'),
    device_id: uni.getStorageSync('device_id'),
    app_version: '1.0.0'
  }
});
```

---

## 响应数据

### 成功响应

```javascript
{
  "code": 200,
  "message": "Token刷新成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 604800, // 秒（7天）
    "expires_at": "2025-10-27T12:00:00Z",
    "user": {
      "user_id": "uuid-xxx-xxx",
      "nickname": "小明",
      "avatar_url": "https://...",
      "is_vip": false
    }
  }
}
```

### 错误响应

**1. Refresh Token无效**
```javascript
{
  "code": 401,
  "message": "Refresh Token无效或已过期",
  "data": {
    "reason": "token_expired",
    "need_relogin": true
  }
}
```

**2. Refresh Token已被使用**
```javascript
{
  "code": 401,
  "message": "Refresh Token已被使用，请重新登录",
  "data": {
    "reason": "token_reused",
    "need_relogin": true,
    "security_alert": true
  }
}
```

**3. 设备不匹配**
```javascript
{
  "code": 403,
  "message": "设备验证失败",
  "data": {
    "reason": "device_mismatch",
    "need_relogin": true
  }
}
```

**4. Token尚未过期**
```javascript
{
  "code": 400,
  "message": "Token尚未过期，无需刷新",
  "data": {
    "expires_in": 259200, // 还剩3天
    "expires_at": "2025-10-23T12:00:00Z"
  }
}
```

---

## 数据库操作

### 相关表

**user_sessions表**
```sql
-- 更新会话记录
UPDATE user_sessions
SET 
  access_token = $new_access_token,
  refresh_token = $new_refresh_token,
  access_token_expires_at = NOW() + INTERVAL '7 days',
  refresh_token_expires_at = NOW() + INTERVAL '30 days',
  last_refresh_at = NOW(),
  updated_at = NOW()
WHERE user_id = $user_id
  AND refresh_token = $old_refresh_token
  AND is_active = true;
```

**user_login_logs表**
```sql
-- 记录刷新日志
INSERT INTO user_login_logs (
  user_id,
  action_type,
  device_id,
  ip_address,
  user_agent,
  app_version,
  created_at
) VALUES (
  $user_id,
  'token_refresh',
  $device_id,
  $ip_address,
  $user_agent,
  $app_version,
  NOW()
);
```

---

## 业务逻辑

### 1. Token验证

```javascript
async function validateRefreshToken(refreshToken) {
  try {
    // 验证JWT签名
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // 检查Token类型
    if (decoded.type !== 'refresh') {
      throw new Error('无效的Token类型');
    }
    
    // 检查过期时间
    if (decoded.exp * 1000 < Date.now()) {
      throw new Error('Refresh Token已过期');
    }
    
    // 检查Token是否被撤销
    const isRevoked = await checkTokenRevoked(decoded.jti);
    if (isRevoked) {
      throw new Error('Token已被撤销');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Token验证失败: ' + error.message);
  }
}
```

### 2. 设备验证

```javascript
async function verifyDevice(userId, deviceId) {
  const session = await db.collection('user_sessions')
    .where({
      user_id: userId,
      device_id: deviceId,
      is_active: true
    })
    .get();
  
  if (session.data.length === 0) {
    throw new Error('设备验证失败');
  }
  
  return true;
}
```

### 3. 生成新Token

```javascript
function generateTokens(user) {
  const now = Math.floor(Date.now() / 1000);
  
  // Access Token (7天)
  const accessToken = jwt.sign({
    user_id: user.user_id,
    type: 'access',
    iat: now,
    exp: now + 7 * 24 * 60 * 60,
    jti: uuidv4()
  }, JWT_SECRET);
  
  // Refresh Token (30天)
  const refreshToken = jwt.sign({
    user_id: user.user_id,
    type: 'refresh',
    iat: now,
    exp: now + 30 * 24 * 60 * 60,
    jti: uuidv4()
  }, JWT_SECRET);
  
  return { accessToken, refreshToken };
}
```

### 4. Token轮换（Rotation）

```javascript
async function rotateTokens(oldRefreshToken) {
  // 1. 验证旧Token
  const decoded = await validateRefreshToken(oldRefreshToken);
  
  // 2. 标记旧Token为已使用
  await revokeToken(decoded.jti);
  
  // 3. 生成新Token
  const newTokens = generateTokens({ user_id: decoded.user_id });
  
  // 4. 更新数据库
  await updateSession(decoded.user_id, newTokens);
  
  return newTokens;
}
```

---

## 安全机制

### 1. Token轮换（Rotation）

每次刷新都生成新的Refresh Token，旧Token立即失效，防止重放攻击。

```javascript
// 检测Token重用
async function detectTokenReuse(jti) {
  const isRevoked = await redis.get(`revoked:${jti}`);
  
  if (isRevoked) {
    // Token已被撤销但再次使用，可能是攻击
    await handleSecurityAlert(jti);
    return true;
  }
  
  return false;
}
```

### 2. 设备指纹验证

```javascript
function generateDeviceFingerprint() {
  const systemInfo = uni.getSystemInfoSync();
  
  const fingerprint = {
    model: systemInfo.model,
    system: systemInfo.system,
    platform: systemInfo.platform,
    // 不要使用容易变化的属性
  };
  
  return crypto.createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex');
}
```

### 3. 异常检测

```javascript
async function detectAbnormalRefresh(userId) {
  // 检测频繁刷新
  const recentRefreshes = await db.collection('user_login_logs')
    .where({
      user_id: userId,
      action_type: 'token_refresh',
      created_at: db.command.gte(new Date(Date.now() - 3600000)) // 1小时内
    })
    .count();
  
  if (recentRefreshes.total > 10) {
    // 触发安全告警
    await sendSecurityAlert(userId, 'frequent_token_refresh');
    throw new Error('检测到异常刷新行为');
  }
}
```

### 4. IP地址验证

```javascript
async function verifyIPAddress(userId, currentIP) {
  const lastSession = await getLastSession(userId);
  
  // 如果IP地址变化显著，要求重新登录
  if (isIPSignificantlyDifferent(lastSession.ip_address, currentIP)) {
    return {
      need_relogin: true,
      reason: 'ip_change'
    };
  }
  
  return { verified: true };
}
```

---

## 前端集成

### Token管理工具

```javascript
/**
 * Token管理工具
 */
class TokenManager {
  constructor() {
    this.refreshing = false;
    this.refreshPromise = null;
  }
  
  /**
   * 获取Access Token
   */
  getAccessToken() {
    return uni.getStorageSync('access_token');
  }
  
  /**
   * 检查Token是否需要刷新
   */
  shouldRefresh() {
    const expiresAt = uni.getStorageSync('token_expires_at');
    if (!expiresAt) return true;
    
    const expiresTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // 剩余时间小于1天时刷新
    return (expiresTime - now) < oneDayInMs;
  }
  
  /**
   * 刷新Token
   */
  async refreshToken() {
    // 防止并发刷新
    if (this.refreshing) {
      return this.refreshPromise;
    }
    
    this.refreshing = true;
    this.refreshPromise = this._doRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshing = false;
      this.refreshPromise = null;
    }
  }
  
  /**
   * 执行刷新
   */
  async _doRefresh() {
    const refreshToken = uni.getStorageSync('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    try {
      const { result } = await uniCloud.callFunction({
        name: 'auth-refresh',
        data: {
          refresh_token: refreshToken,
          device_id: this.getDeviceId()
        }
      });
      
      if (result.code === 200) {
        // 保存新Token
        this.saveTokens(result.data);
        return result.data;
      } else if (result.data && result.data.need_relogin) {
        // 需要重新登录
        this.clearTokens();
        this.redirectToLogin();
        throw new Error('Need relogin');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Token刷新失败:', error);
      this.clearTokens();
      this.redirectToLogin();
      throw error;
    }
  }
  
  /**
   * 保存Token
   */
  saveTokens(data) {
    uni.setStorageSync('access_token', data.access_token);
    uni.setStorageSync('refresh_token', data.refresh_token);
    uni.setStorageSync('token_expires_at', data.expires_at);
    uni.setStorageSync('user_info', data.user);
  }
  
  /**
   * 清除Token
   */
  clearTokens() {
    uni.removeStorageSync('access_token');
    uni.removeStorageSync('refresh_token');
    uni.removeStorageSync('token_expires_at');
    uni.removeStorageSync('user_info');
  }
  
  /**
   * 跳转到登录页
   */
  redirectToLogin() {
    uni.reLaunch({
      url: '/pages/login/login'
    });
  }
  
  /**
   * 获取设备ID
   */
  getDeviceId() {
    let deviceId = uni.getStorageSync('device_id');
    
    if (!deviceId) {
      const systemInfo = uni.getSystemInfoSync();
      deviceId = `${systemInfo.platform}_${systemInfo.model}_${Date.now()}`;
      uni.setStorageSync('device_id', deviceId);
    }
    
    return deviceId;
  }
}

// 单例
let tokenManagerInstance = null;

export function getTokenManager() {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager();
  }
  return tokenManagerInstance;
}

export default {
  getTokenManager
};
```

### HTTP拦截器集成

```javascript
/**
 * 请求拦截器
 */
import { getTokenManager } from '@/utils/token-manager.js';

// uniCloud请求拦截
const originalCallFunction = uniCloud.callFunction;

uniCloud.callFunction = async function(options) {
  const tokenManager = getTokenManager();
  
  // 检查是否需要刷新Token
  if (tokenManager.shouldRefresh()) {
    try {
      await tokenManager.refreshToken();
    } catch (error) {
      console.error('Token刷新失败:', error);
    }
  }
  
  // 添加Token到请求头
  const token = tokenManager.getAccessToken();
  if (token) {
    options.data = options.data || {};
    options.data._token = token;
  }
  
  // 执行请求
  try {
    const result = await originalCallFunction.call(this, options);
    
    // 处理Token过期
    if (result.result && result.result.code === 401) {
      try {
        await tokenManager.refreshToken();
        // 重试请求
        return await originalCallFunction.call(this, options);
      } catch (error) {
        throw error;
      }
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};
```

### 页面中使用

```vue
<script>
import { getTokenManager } from '@/utils/token-manager.js';

export default {
  async onShow() {
    const tokenManager = getTokenManager();
    
    // 检查Token状态
    if (tokenManager.shouldRefresh()) {
      try {
        await tokenManager.refreshToken();
      } catch (error) {
        // 刷新失败，用户会被重定向到登录页
      }
    }
  }
};
</script>
```

---

## 性能优化

### 1. Token缓存

```javascript
// Redis缓存用户信息
const cacheKey = `user:${userId}:info`;
let userInfo = await redis.get(cacheKey);

if (!userInfo) {
  userInfo = await db.collection('users').doc(userId).get();
  await redis.setex(cacheKey, 3600, JSON.stringify(userInfo));
}
```

### 2. 批量刷新优化

```javascript
// 如果多个请求同时触发刷新，共享同一个刷新Promise
const refreshPromises = new Map();

async function refreshToken(userId) {
  if (refreshPromises.has(userId)) {
    return refreshPromises.get(userId);
  }
  
  const promise = doRefresh(userId);
  refreshPromises.set(userId, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    refreshPromises.delete(userId);
  }
}
```

---

## 监控指标

### 1. 关键指标
- Token刷新成功率：`成功次数 / 总请求数`
- 平均刷新时间：`< 200ms`
- Token重用检测次数
- 异常刷新告警次数

### 2. 告警规则
- 刷新成功率 < 95%：触发告警
- 平均刷新时间 > 500ms：触发告警
- 1小时内Token重用 > 3次：触发安全告警

---

## 测试用例

### 1. 正常刷新
```javascript
// 输入
{
  refresh_token: 'valid_refresh_token',
  device_id: 'device_123'
}

// 期望输出
{
  code: 200,
  data: { access_token: '...', refresh_token: '...' }
}
```

### 2. Token过期
```javascript
// 输入
{ refresh_token: 'expired_token' }

// 期望输出
{
  code: 401,
  message: 'Refresh Token无效或已过期',
  data: { need_relogin: true }
}
```

### 3. Token重用检测
```javascript
// 第一次使用Token刷新 -> 成功
// 第二次使用同一Token刷新 -> 401错误，触发安全告警
```

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2025-10-20 | 初始版本 |

---

## 相关文档

- [auth-login API文档](./auth-login.md) - 用户登录接口
- [Token安全最佳实践](../security/token-best-practices.md)
- [JWT规范说明](../security/jwt-specification.md)

---

**文档维护**: CraneHeart开发团队  
**最后更新**: 2025-10-20

