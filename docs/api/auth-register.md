# auth-register API文档

## 基本信息

- **云函数名称**: `auth-register`
- **功能描述**: 用户注册（完善用户信息）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要微信登录后的Token
- **限流策略**: 每用户每分钟最多5次请求

---

## 业务说明

本接口用于用户首次登录后完善个人信息，包括昵称、头像、性别等。微信授权登录后，用户需要调用此接口才能完成注册流程。

### 注册流程
1. 用户通过 `auth-login` 完成微信授权登录，获取Token
2. 调用 `auth-register` 提交个人信息
3. 服务器创建用户档案（user_profiles表）
4. 返回完整的用户信息

---

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| nickname | String | 是 | - | 用户昵称（2-20字符） |
| avatar_url | String | 否 | - | 头像URL |
| gender | Number | 否 | 0 | 性别（0未知/1男/2女） |
| birthday | String | 否 | - | 生日（YYYY-MM-DD格式） |
| bio | String | 否 | - | 个人简介（最多200字） |
| consent_agreement | Boolean | 是 | - | 是否同意用户协议 |
| consent_privacy | Boolean | 是 | - | 是否同意隐私政策 |

### 参数校验规则

**nickname（昵称）**
- 长度：2-20个字符
- 不允许包含特殊字符：`<>{}[]`
- 不允许包含敏感词
- 示例：`"小明"`、`"CraneUser123"`

**avatar_url（头像）**
- 格式：HTTPS URL
- 支持格式：jpg、png、webp
- 建议尺寸：200x200以上
- 示例：`"https://cdn.example.com/avatar/user123.jpg"`

**gender（性别）**
- 0：未知
- 1：男
- 2：女

**birthday（生日）**
- 格式：YYYY-MM-DD
- 范围：1900-01-01 至 当前日期
- 示例：`"2000-01-01"`

**bio（个人简介）**
- 最大长度：200字符
- 允许换行
- 示例：`"热爱生活，享受当下"`

**同意条款**
- `consent_agreement` 和 `consent_privacy` 必须都为 `true`
- 否则返回错误

---

## 请求示例

```javascript
// 完整注册示例
const { result } = await uniCloud.callFunction({
  name: 'auth-register',
  data: {
    nickname: '小明',
    avatar_url: 'https://cdn.example.com/avatar/user123.jpg',
    gender: 1,
    birthday: '2000-01-15',
    bio: '热爱生活，享受当下',
    consent_agreement: true,
    consent_privacy: true
  }
});

// 最小注册示例
const { result } = await uniCloud.callFunction({
  name: 'auth-register',
  data: {
    nickname: '小明',
    consent_agreement: true,
    consent_privacy: true
  }
});
```

---

## 响应数据

### 成功响应

```javascript
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user_id": "uuid-xxx-xxx",
    "nickname": "小明",
    "avatar_url": "https://cdn.example.com/avatar/user123.jpg",
    "gender": 1,
    "birthday": "2000-01-15",
    "bio": "热爱生活，享受当下",
    "is_new_user": true,
    "profile_complete": 100, // 资料完整度百分比
    "created_at": "2025-10-20T12:00:00Z"
  }
}
```

### 错误响应

**1. 参数校验失败**
```javascript
{
  "code": 400,
  "message": "昵称长度必须在2-20个字符之间",
  "data": null
}
```

**2. 昵称重复**
```javascript
{
  "code": 409,
  "message": "该昵称已被使用，请更换",
  "data": {
    "field": "nickname",
    "suggestions": ["小明123", "小明2025", "小明_01"]
  }
}
```

**3. 未同意条款**
```javascript
{
  "code": 403,
  "message": "必须同意用户协议和隐私政策才能注册",
  "data": null
}
```

**4. 用户已注册**
```javascript
{
  "code": 409,
  "message": "用户已完成注册，无需重复注册",
  "data": {
    "user_id": "uuid-xxx-xxx",
    "nickname": "已存在的昵称"
  }
}
```

**5. Token无效**
```javascript
{
  "code": 401,
  "message": "Token无效或已过期",
  "data": null
}
```

---

## 数据库操作

### 相关表

**1. user_profiles（用户档案表）**
```sql
INSERT INTO user_profiles (
  user_id,
  nickname,
  avatar_url,
  gender,
  birthday,
  bio,
  created_at,
  updated_at
) VALUES (
  $user_id,
  $nickname,
  $avatar_url,
  $gender,
  $birthday,
  $bio,
  NOW(),
  NOW()
);
```

**2. consent_records（同意记录表）**
```sql
INSERT INTO consent_records (
  user_id,
  consent_type,
  consent_version,
  consented_at
) VALUES 
  ($user_id, 'user_agreement', '1.0', NOW()),
  ($user_id, 'privacy_policy', '1.0', NOW());
```

**3. users（更新注册状态）**
```sql
UPDATE users 
SET 
  is_registered = true,
  updated_at = NOW()
WHERE user_id = $user_id;
```

### 索引优化
```sql
-- 昵称唯一索引
CREATE UNIQUE INDEX idx_user_profiles_nickname ON user_profiles(nickname);

-- 用户ID索引
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
```

---

## 业务逻辑

### 1. Token验证
```javascript
// 验证Token有效性
const { user_id } = await verifyToken(token);

// 检查用户是否已注册
const existingProfile = await db.collection('user_profiles')
  .where({ user_id })
  .get();

if (existingProfile.data.length > 0) {
  return {
    code: 409,
    message: '用户已完成注册，无需重复注册'
  };
}
```

### 2. 参数校验
```javascript
// 昵称校验
if (!/^.{2,20}$/.test(nickname)) {
  throw new Error('昵称长度必须在2-20个字符之间');
}

if (/<|>|\{|\}|\[|\]/.test(nickname)) {
  throw new Error('昵称不能包含特殊字符');
}

// 昵称重复检查
const nicknameExists = await db.collection('user_profiles')
  .where({ nickname })
  .count();

if (nicknameExists.total > 0) {
  // 生成建议昵称
  const suggestions = generateNicknameSuggestions(nickname);
  return {
    code: 409,
    message: '该昵称已被使用，请更换',
    data: { field: 'nickname', suggestions }
  };
}

// 同意条款校验
if (!consent_agreement || !consent_privacy) {
  throw new Error('必须同意用户协议和隐私政策才能注册');
}
```

### 3. 创建用户档案
```javascript
// 计算资料完整度
const profileComplete = calculateProfileCompleteness({
  nickname,
  avatar_url,
  gender,
  birthday,
  bio
});

// 插入用户档案
await db.collection('user_profiles').add({
  user_id,
  nickname,
  avatar_url: avatar_url || getDefaultAvatar(gender),
  gender: gender || 0,
  birthday,
  bio,
  profile_complete,
  created_at: new Date(),
  updated_at: new Date()
});

// 记录同意条款
await recordConsent(user_id, ['user_agreement', 'privacy_policy']);

// 更新用户注册状态
await db.collection('users').doc(user_id).update({
  is_registered: true,
  updated_at: new Date()
});
```

### 4. 资料完整度计算
```javascript
function calculateProfileCompleteness(profile) {
  let completeness = 0;
  const fields = {
    nickname: 20,      // 昵称（必填）+20%
    avatar_url: 30,    // 头像+30%
    gender: 15,        // 性别+15%
    birthday: 20,      // 生日+20%
    bio: 15            // 简介+15%
  };
  
  Object.keys(fields).forEach(field => {
    if (profile[field] && profile[field] !== '') {
      completeness += fields[field];
    }
  });
  
  return completeness;
}
```

---

## 错误码说明

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 400 | 参数校验失败 | 检查参数格式和内容 |
| 401 | Token无效 | 重新登录获取Token |
| 403 | 未同意条款 | 提示用户勾选同意条款 |
| 409 | 昵称重复或已注册 | 更换昵称或检查注册状态 |
| 429 | 请求过于频繁 | 稍后再试 |
| 500 | 服务器内部错误 | 联系技术支持 |

---

## 安全性考虑

### 1. 敏感词过滤
```javascript
const sensitiveWords = ['管理员', '客服', '官方', ...];

function containsSensitiveWords(text) {
  return sensitiveWords.some(word => text.includes(word));
}

if (containsSensitiveWords(nickname)) {
  throw new Error('昵称包含敏感词，请更换');
}
```

### 2. SQL注入防护
- 使用参数化查询
- 验证所有输入参数
- 转义特殊字符

### 3. XSS防护
```javascript
function sanitizeInput(text) {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

### 4. 限流控制
- 每IP每分钟最多10次请求
- 每用户每分钟最多5次请求
- 昵称重复检查限制每分钟3次

---

## 性能优化

### 1. 数据库优化
- 在nickname字段建立唯一索引
- 使用连接池提升并发性能
- 批量插入同意记录

### 2. 缓存策略
```javascript
// 缓存已使用的昵称（Redis）
const cacheKey = `nickname_exists:${nickname}`;
let exists = await redis.get(cacheKey);

if (exists === null) {
  exists = await checkNicknameExists(nickname);
  await redis.setex(cacheKey, 3600, exists ? '1' : '0');
}
```

### 3. 异步处理
- 同意记录异步写入
- 欢迎消息异步发送
- 统计数据异步更新

---

## 前端集成示例

### Vue组件中使用

```vue
<template>
  <view class="register-page">
    <u-form :model="form" ref="formRef">
      <u-form-item label="昵称" required>
        <u-input v-model="form.nickname" placeholder="请输入昵称（2-20字符）" />
      </u-form-item>
      
      <u-form-item label="头像">
        <u-upload :action="uploadUrl" @success="handleAvatarSuccess" />
      </u-form-item>
      
      <u-form-item label="性别">
        <u-radio-group v-model="form.gender">
          <u-radio :name="1">男</u-radio>
          <u-radio :name="2">女</u-radio>
        </u-radio-group>
      </u-form-item>
      
      <u-form-item label="生日">
        <u-datetime-picker v-model="form.birthday" mode="date" />
      </u-form-item>
      
      <u-form-item label="个人简介">
        <u-textarea v-model="form.bio" placeholder="简单介绍一下自己..." maxlength="200" />
      </u-form-item>
      
      <view class="consent-section">
        <u-checkbox v-model="form.consent_agreement">我已阅读并同意《用户协议》</u-checkbox>
        <u-checkbox v-model="form.consent_privacy">我已阅读并同意《隐私政策》</u-checkbox>
      </view>
      
      <u-button @click="handleRegister" type="primary" :loading="loading">
        完成注册
      </u-button>
    </u-form>
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: {
        nickname: '',
        avatar_url: '',
        gender: 0,
        birthday: '',
        bio: '',
        consent_agreement: false,
        consent_privacy: false
      },
      loading: false
    };
  },
  methods: {
    async handleRegister() {
      // 表单校验
      if (!this.form.nickname) {
        uni.showToast({ title: '请输入昵称', icon: 'none' });
        return;
      }
      
      if (!this.form.consent_agreement || !this.form.consent_privacy) {
        uni.showToast({ title: '请阅读并同意相关条款', icon: 'none' });
        return;
      }
      
      this.loading = true;
      
      try {
        const { result } = await uniCloud.callFunction({
          name: 'auth-register',
          data: this.form
        });
        
        if (result.code === 200) {
          // 保存用户信息
          uni.setStorageSync('user_info', result.data);
          
          // 跳转到首页
          uni.reLaunch({ url: '/pages/home/home' });
          
          uni.showToast({ title: '注册成功', icon: 'success' });
        } else {
          uni.showToast({ title: result.message, icon: 'none' });
        }
      } catch (error) {
        console.error('注册失败:', error);
        uni.showToast({ title: '注册失败，请稍后重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    handleAvatarSuccess(response) {
      this.form.avatar_url = response.url;
    }
  }
};
</script>
```

---

## 测试用例

### 1. 正常注册
```javascript
// 输入
{
  nickname: '测试用户',
  avatar_url: 'https://cdn.example.com/avatar/test.jpg',
  gender: 1,
  birthday: '2000-01-01',
  bio: '这是测试简介',
  consent_agreement: true,
  consent_privacy: true
}

// 期望输出
{
  code: 200,
  message: '注册成功',
  data: { user_id: '...', nickname: '测试用户', ... }
}
```

### 2. 昵称过短
```javascript
// 输入
{ nickname: '小', consent_agreement: true, consent_privacy: true }

// 期望输出
{ code: 400, message: '昵称长度必须在2-20个字符之间' }
```

### 3. 未同意条款
```javascript
// 输入
{ nickname: '测试用户', consent_agreement: false, consent_privacy: true }

// 期望输出
{ code: 403, message: '必须同意用户协议和隐私政策才能注册' }
```

### 4. 昵称重复
```javascript
// 输入（假设"小明"已存在）
{ nickname: '小明', consent_agreement: true, consent_privacy: true }

// 期望输出
{
  code: 409,
  message: '该昵称已被使用，请更换',
  data: { field: 'nickname', suggestions: ['小明123', '小明2025', '小明_01'] }
}
```

---

## 监控指标

### 1. 关键指标
- 注册成功率：`成功注册数 / 总请求数`
- 平均响应时间：`< 500ms`
- 昵称重复率：监控热门昵称使用情况
- 同意条款拒绝率：`未同意次数 / 总请求数`

### 2. 告警规则
- 注册成功率 < 95%：触发告警
- 平均响应时间 > 1s：触发告警
- 5分钟内错误次数 > 10：触发告警

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2025-10-20 | 初始版本 |

---

## 相关文档

- [auth-login API文档](./auth-login.md) - 用户登录接口
- [user-update-profile API文档](./user-update-profile.md) - 更新用户信息
- [数据库设计文档](../database/schema-users.md) - 用户相关表设计
- [用户协议](../legal/user-agreement.md) - 用户协议内容
- [隐私政策](../legal/privacy-policy.md) - 隐私政策内容

---

**文档维护**: CraneHeart开发团队  
**最后更新**: 2025-10-20

