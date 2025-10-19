# auth-login API文档

## 基本信息

- **云函数名称**: `auth-login`
- **功能描述**: 处理微信登录，生成JWT Token
- **请求方式**: uniCloud.callFunction
- **认证要求**: 无需Token（开放接口）
- **限流策略**: 同一用户5分钟内最多10次请求

---

## 请求参数

### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| code | String | 是 | - | 微信登录code（通过wx.login获取） |
| userInfo | Object | 否 | {} | 用户信息（可选，用于更新用户资料） |
| device_info | Object | 否 | {} | 设备信息（可选，用于登录日志） |

### userInfo对象结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| nickname | String | 用户昵称 |
| avatar | String | 头像URL |
| gender | Number | 性别（0:未知, 1:男, 2:女） |

### device_info对象结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| device_type | String | 设备类型（ios/android/web） |
| device_model | String | 设备型号 |
| os_version | String | 操作系统版本 |
| app_version | String | 应用版本 |

### 请求示例

```javascript
// 前端调用示例
const { result } = await uniCloud.callFunction({
  name: 'auth-login',
  data: {
    code: 'WECHAT_CODE_FROM_WX_LOGIN',
    userInfo: {
      nickname: '张三',
      avatar: 'https://xxx.com/avatar.jpg',
      gender: 1
    },
    device_info: {
      device_type: 'ios',
      device_model: 'iPhone 14',
      os_version: 'iOS 16.0',
      app_version: '1.0.0'
    }
  }
});

console.log('登录结果:', result);
```

---

## 响应格式

### 成功响应

```json
{
  "errCode": 0,
  "errMsg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpired": 1697654400000,
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "userInfo": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nickname": "张三",
      "avatar": "https://xxx.com/avatar.jpg",
      "role": "user",
      "openid": "oXXXXXXXXXXXXXXX"
    },
    "isNewUser": false
  }
}
```

### 响应字段说明

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| errCode | Number | 错误码（0表示成功） |
| errMsg | String | 错误信息 |
| data.token | String | JWT Token（用于后续认证） |
| data.tokenExpired | Number | Token过期时间戳（毫秒） |
| data.uid | String | 用户UUID |
| data.userInfo | Object | 用户信息对象 |
| data.userInfo.id | String | 用户ID |
| data.userInfo.nickname | String | 用户昵称 |
| data.userInfo.avatar | String | 头像URL |
| data.userInfo.role | String | 用户角色（user/vip/admin） |
| data.userInfo.openid | String | 微信OpenID |
| data.isNewUser | Boolean | 是否新用户 |

---

## 错误码

### 标准错误码

| 错误码 | 错误信息 | 说明 | 处理建议 |
|--------|----------|------|----------|
| 0 | 登录成功 | 成功 | - |
| 40001 | 缺少code参数 | 请求参数错误 | 检查参数 |
| 40163 | code无效或已过期 | 微信code过期 | 重新调用wx.login获取新code |
| 40029 | code已被使用 | code重复使用 | 重新调用wx.login获取新code |
| 50001 | 微信接口调用失败 | 微信服务器错误 | 稍后重试 |
| 50002 | 数据库操作失败 | 数据库错误 | 联系技术支持 |
| 50003 | Token生成失败 | 服务器内部错误 | 联系技术支持 |
| 42901 | 请求过于频繁 | 触发限流 | 等待一段时间后重试 |
| -1 | 未知错误 | 服务器异常 | 稍后重试或联系支持 |

### 失败响应示例

```json
{
  "errCode": 40163,
  "errMsg": "微信code已过期，请重新获取",
  "data": null
}
```

```json
{
  "errCode": 50001,
  "errMsg": "微信接口调用失败，请稍后重试",
  "data": null
}
```

```json
{
  "errCode": 42901,
  "errMsg": "登录请求过于频繁，请5分钟后再试",
  "data": {
    "retryAfter": 300
  }
}
```

---

## 业务流程

### 登录流程图

```
用户端                      auth-login云函数              微信服务器              数据库
  |                              |                           |                    |
  |--1. wx.login()-------------->|                           |                    |
  |<----返回code-----------------|                           |                    |
  |                              |                           |                    |
  |--2. callFunction------------>|                           |                    |
  |     { code }                 |                           |                    |
  |                              |--3. 调用微信API---------->|                    |
  |                              |     (code2Session)        |                    |
  |                              |<---返回openid、session_key|                    |
  |                              |                           |                    |
  |                              |--4. 查询用户------------->|                    |
  |                              |     (根据openid)         |                    |
  |                              |<---返回用户信息-----------|                    |
  |                              |                           |                    |
  |                              |--5. 创建/更新用户-------->|                    |
  |                              |<---返回用户ID-------------|                    |
  |                              |                           |                    |
  |                              |--6. 生成JWT Token---------|                    |
  |                              |                           |                    |
  |                              |--7. 记录登录日志--------->|                    |
  |                              |<---记录成功---------------|                    |
  |                              |                           |                    |
  |<--8. 返回token和用户信息-----|                           |                    |
```

### 详细步骤说明

1. **客户端获取code**
   - 调用`wx.login()`获取临时code
   - code有效期5分钟，仅可使用一次

2. **调用云函数**
   - 将code传递给auth-login云函数
   - 可选传递userInfo用于更新用户资料

3. **验证微信code**
   - 调用微信code2Session接口
   - 获取openid和session_key

4. **查询或创建用户**
   - 根据openid查询数据库
   - 如果用户不存在，创建新用户记录
   - 如果用户存在，更新最后登录时间

5. **生成JWT Token**
   - 使用HS256算法签名
   - Payload包含：uid, openid, role
   - Token有效期7天

6. **记录登录日志**
   - 记录登录时间、IP、设备信息
   - 用于安全审计和异常检测

7. **返回结果**
   - 返回token和用户信息
   - 前端保存token到本地存储

---

## 安全说明

### 1. Token安全

- Token使用HS256算法签名
- 密钥存储在云函数环境变量中
- Token包含过期时间，过期后需刷新

### 2. 限流策略

```javascript
// 限流规则
{
  windowMs: 5 * 60 * 1000,  // 5分钟
  maxRequests: 10,          // 最多10次
  keyGenerator: (context) => context.UNI_OPENID || context.CLIENTIP
}
```

### 3. 日志记录

- 记录所有登录尝试（成功和失败）
- 记录IP地址用于异常检测
- 敏感信息（openid、session_key）不记录到日志

### 4. 错误处理

- 不暴露内部错误详情
- 返回用户友好的错误信息
- 记录详细错误到云端日志

---

## 性能指标

### 响应时间

- P50: < 200ms
- P95: < 500ms
- P99: < 1000ms

### 成功率

- 目标成功率: > 99%
- 微信接口失败自动重试

### 并发能力

- 支持并发数: 1000 QPS
- 使用数据库连接池

---

## 测试用例

### 1. 正常登录

```javascript
// 测试用例1：首次登录
const result = await testAuthLogin({
  code: 'VALID_CODE_NEW_USER'
});

expect(result.errCode).toBe(0);
expect(result.data.token).toBeDefined();
expect(result.data.isNewUser).toBe(true);
expect(result.data.userInfo.id).toBeDefined();
```

### 2. 重复登录

```javascript
// 测试用例2：已注册用户登录
const result = await testAuthLogin({
  code: 'VALID_CODE_EXISTING_USER'
});

expect(result.errCode).toBe(0);
expect(result.data.isNewUser).toBe(false);
```

### 3. code过期

```javascript
// 测试用例3：code过期
const result = await testAuthLogin({
  code: 'EXPIRED_CODE'
});

expect(result.errCode).toBe(40163);
expect(result.errMsg).toContain('过期');
```

### 4. code已使用

```javascript
// 测试用例4：code重复使用
const result = await testAuthLogin({
  code: 'USED_CODE'
});

expect(result.errCode).toBe(40029);
expect(result.errMsg).toContain('已被使用');
```

### 5. 触发限流

```javascript
// 测试用例5：频繁请求触发限流
for (let i = 0; i < 12; i++) {
  const result = await testAuthLogin({
    code: `CODE_${i}`
  });
  
  if (i < 10) {
    expect(result.errCode).toBe(0);
  } else {
    expect(result.errCode).toBe(42901);
    expect(result.errMsg).toContain('频繁');
  }
}
```

---

## 使用示例

### 完整登录流程（前端）

```javascript
// 1. 定义登录函数
async function loginWithWechat() {
  try {
    // 显示loading
    uni.showLoading({ title: '登录中...' });
    
    // 2. 获取微信code
    const { code } = await uni.login({ provider: 'weixin' });
    
    if (!code) {
      throw new Error('获取微信授权失败');
    }
    
    // 3. 获取设备信息
    const systemInfo = uni.getSystemInfoSync();
    const device_info = {
      device_type: systemInfo.platform,
      device_model: systemInfo.model,
      os_version: systemInfo.system,
      app_version: '1.0.0'
    };
    
    // 4. 调用登录云函数
    const { result } = await uniCloud.callFunction({
      name: 'auth-login',
      data: {
        code,
        device_info
      },
      timeout: 10000
    });
    
    // 5. 处理响应
    if (result.errCode === 0) {
      // 保存token
      uni.setStorageSync('token', result.data.token);
      uni.setStorageSync('token_expired', result.data.tokenExpired);
      uni.setStorageSync('uid', result.data.uid);
      uni.setStorageSync('userInfo', JSON.stringify(result.data.userInfo));
      
      // 提示成功
      uni.showToast({
        title: result.data.isNewUser ? '欢迎加入翎心！' : '欢迎回来！',
        icon: 'success'
      });
      
      // 跳转首页
      setTimeout(() => {
        uni.switchTab({ url: '/pages/home/home' });
      }, 1500);
      
      return result.data;
    } else {
      // 处理错误
      throw new Error(result.errMsg);
    }
    
  } catch (error) {
    console.error('登录失败:', error);
    
    // 显示错误信息
    uni.showToast({
      title: error.message || '登录失败，请重试',
      icon: 'none',
      duration: 3000
    });
    
    return null;
  } finally {
    uni.hideLoading();
  }
}

// 2. 在登录页面调用
export default {
  methods: {
    async handleLogin() {
      const result = await loginWithWechat();
      if (result) {
        console.log('登录成功，用户ID:', result.uid);
      }
    }
  }
}
```

### 错误处理示例

```javascript
// 统一错误处理函数
function handleLoginError(error) {
  const errorMap = {
    40163: {
      userMessage: '微信授权已过期，请重新登录',
      action: 'retry',
      logLevel: 'warning'
    },
    40029: {
      userMessage: '登录凭证已失效，请重新登录',
      action: 'retry',
      logLevel: 'warning'
    },
    50001: {
      userMessage: '微信服务暂时不可用，请稍后重试',
      action: 'retry_later',
      logLevel: 'error'
    },
    42901: {
      userMessage: '登录请求过于频繁，请5分钟后再试',
      action: 'wait',
      logLevel: 'warning'
    }
  };
  
  const errorInfo = errorMap[error.errCode] || {
    userMessage: error.errMsg || '登录失败，请重试',
    action: 'retry',
    logLevel: 'error'
  };
  
  // 记录日志
  console[errorInfo.logLevel]('登录错误:', {
    code: error.errCode,
    message: error.errMsg,
    action: errorInfo.action
  });
  
  return errorInfo;
}

// 使用示例
try {
  const { result } = await uniCloud.callFunction({
    name: 'auth-login',
    data: { code }
  });
  
  if (result.errCode !== 0) {
    const errorInfo = handleLoginError(result);
    
    uni.showToast({
      title: errorInfo.userMessage,
      icon: 'none'
    });
    
    // 根据action决定后续操作
    if (errorInfo.action === 'retry') {
      // 可以自动重试
    } else if (errorInfo.action === 'wait') {
      // 需要等待
    }
  }
} catch (error) {
  console.error('网络错误:', error);
}
```

---

## 云函数实现要点

### 1. 调用微信code2Session

```javascript
const axios = require('axios');

async function getWxSession(code) {
  const APPID = process.env.WX_APPID;
  const SECRET = process.env.WX_SECRET;
  
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
  
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;
    
    if (data.errcode) {
      throw new Error(`微信接口错误: ${data.errmsg}`);
    }
    
    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid
    };
  } catch (error) {
    console.error('调用微信接口失败:', error);
    throw error;
  }
}
```

### 2. 查询或创建用户

```javascript
const { createClient } = require('../common/db');

async function findOrCreateUser(openid, userInfo = {}) {
  const supabase = createClient();
  
  // 查询用户
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('openid', openid)
    .single();
  
  if (existingUser) {
    // 更新最后登录时间
    await supabase
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString(),
        nickname: userInfo.nickname || existingUser.nickname,
        avatar: userInfo.avatar || existingUser.avatar
      })
      .eq('id', existingUser.id);
    
    return { user: existingUser, isNewUser: false };
  }
  
  // 创建新用户
  const { data: newUser } = await supabase
    .from('users')
    .insert({
      openid,
      nickname: userInfo.nickname || `用户${openid.slice(-6)}`,
      avatar: userInfo.avatar,
      gender: userInfo.gender || 0,
      role: 'user',
      status: 'active'
    })
    .select()
    .single();
  
  // 同时创建用户扩展表
  await createUserProfiles(newUser.id);
  await createUserSettings(newUser.id);
  
  return { user: newUser, isNewUser: true };
}
```

### 3. 生成JWT Token

```javascript
const crypto = require('crypto');

function signToken(payload, secret, expSeconds = 7 * 24 * 3600) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expSeconds
  };
  
  // Base64URL编码
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  
  // 生成签名
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64urlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

### 4. 记录登录日志

```javascript
async function logLogin(userId, deviceInfo, ip, status = 'success') {
  const supabase = createClient();
  
  await supabase
    .from('user_login_logs')
    .insert({
      user_id: userId,
      login_method: 'wechat',
      login_ip: ip,
      device_type: deviceInfo.device_type,
      device_model: deviceInfo.device_model,
      os_version: deviceInfo.os_version,
      app_version: deviceInfo.app_version,
      login_status: status
    });
}
```

---

## 监控与告警

### 监控指标

1. **成功率监控**
   - 目标: > 99%
   - 告警阈值: < 95%

2. **响应时间监控**
   - 目标P95: < 500ms
   - 告警阈值: > 1000ms

3. **错误码分布**
   - 监控各错误码的占比
   - 40163（code过期）过高需要优化引导

4. **限流触发次数**
   - 监控每日限流触发次数
   - 过高需要调整限流策略

### 告警规则

```yaml
alerts:
  - name: 登录成功率过低
    condition: success_rate < 95%
    action: 发送钉钉告警
    
  - name: 登录响应时间过长
    condition: p95_response_time > 1000ms
    action: 发送邮件告警
    
  - name: 微信接口错误率过高
    condition: wx_api_error_rate > 5%
    action: 发送紧急告警
```

---

## 版本历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-18 | 初始版本 | 开发团队 |

---

## 相关文档

- [用户表设计文档](../database/schema-users.md)
- [JWT工具文档](./common-jwt.md)
- [限流中间件文档](./common-rate-limit.md)
- [Supabase封装文档](./common-db.md)

---

**维护说明**: 
- 接口参数变更需要同步更新文档
- 错误码新增需要更新错误码表
- 性能指标需要定期review

