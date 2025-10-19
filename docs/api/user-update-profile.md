# user-update-profile API文档

## 基本信息

- **云函数名称**: `user-update-profile`
- **功能描述**: 更新用户个人资料信息
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多5次请求

---

## 请求参数

### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| nickname | String | 否 | - | 用户昵称（2-20字符） |
| avatar | String | 否 | - | 头像URL |
| gender | String | 否 | - | 性别（male/female/other） |
| birthday | String | 否 | - | 生日（YYYY-MM-DD格式） |
| bio | String | 否 | - | 个人简介（最多200字） |
| location | String | 否 | - | 所在地 |
| occupation | String | 否 | - | 职业 |
| education | String | 否 | - | 学历 |

### 参数校验规则

**nickname（昵称）**:
- 长度：2-20字符
- 格式：中英文、数字、下划线、连字符
- 不允许：特殊符号、空格

**gender（性别）**:
- 可选值：`male`, `female`, `other`

**birthday（生日）**:
- 格式：`YYYY-MM-DD`
- 范围：1900-01-01 到 今天

**bio（个人简介）**:
- 最大长度：200字符

### 请求示例

```javascript
// 更新昵称和头像
const { result } = await uniCloud.callFunction({
  name: 'user-update-profile',
  data: {
    nickname: '新昵称',
    avatar: 'https://cdn.example.com/avatar.jpg'
  }
});

// 更新完整资料
const { result } = await uniCloud.callFunction({
  name: 'user-update-profile',
  data: {
    nickname: '张三',
    avatar: 'https://cdn.example.com/avatar.jpg',
    gender: 'male',
    birthday: '1995-06-15',
    bio: '这是我的个人简介',
    location: '北京',
    occupation: '学生',
    education: '本科'
  }
});
```

---

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "msg": "更新成功",
  "data": {
    "userInfo": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nickname": "张三",
      "avatar": "https://cdn.example.com/avatar.jpg",
      "gender": "male",
      "birthday": "1995-06-15",
      "bio": "这是我的个人简介",
      "location": "北京",
      "occupation": "学生",
      "education": "本科",
      "role": "user",
      "openid": "oXXXXXXXXXXXXXXXX"
    },
    "updated_at": "2025-10-18T12:00:00Z"
  }
}
```

### 失败响应

```json
{
  "code": -1,
  "msg": "昵称长度应为2-20字符",
  "data": null
}
```

```json
{
  "code": 40001,
  "msg": "未提供任何更新字段",
  "data": null
}
```

```json
{
  "code": 40301,
  "msg": "未登录或Token已过期",
  "data": null
}
```

---

## 错误码

| 错误码 | 错误信息 | 说明 | 处理建议 |
|--------|----------|------|----------|
| 0 | 更新成功 | 成功 | - |
| -1 | 参数校验失败 | 参数不符合规则 | 检查参数格式 |
| 40001 | 未提供更新字段 | 所有字段都为空 | 至少提供一个字段 |
| 40301 | 未登录或Token已过期 | 认证失败 | 重新登录 |
| 40401 | 用户不存在 | 数据库中找不到用户 | 检查用户状态 |
| 42901 | 请求过于频繁 | 触发限流 | 等待后重试 |
| 50002 | 数据库更新失败 | 数据库错误 | 联系技术支持 |

---

## 业务流程

### 更新流程图

```
前端                    user-update-profile云函数          数据库
  |                              |                          |
  |--1. callFunction------------>|                          |
  |     { nickname, avatar }     |                          |
  |                              |                          |
  |                              |--2. 验证Token----------->|
  |                              |<--返回用户ID-------------|
  |                              |                          |
  |                              |--3. 参数校验-------------|
  |                              |                          |
  |                              |--4. 更新users表--------->|
  |                              |<--更新成功---------------|
  |                              |                          |
  |                              |--5. 更新user_profiles--->|
  |                              |<--更新成功---------------|
  |                              |                          |
  |                              |--6. 查询最新用户信息---->|
  |                              |<--返回用户数据-----------|
  |                              |                          |
  |<--7. 返回更新后的用户信息-----|                          |
```

### 详细步骤

1. **Token验证**
   - 从context.UNI_ID_TOKEN获取token
   - 验证token有效性
   - 提取用户ID

2. **参数校验**
   - 检查至少提供一个更新字段
   - 验证nickname长度和格式
   - 验证birthday日期格式
   - 验证bio长度

3. **更新用户主表（users）**
   - 更新nickname、avatar、gender、birthday
   - 自动更新updated_at

4. **更新用户扩展表（user_profiles）**
   - 更新bio、location、occupation、education
   - 如果记录不存在则创建

5. **返回最新数据**
   - 查询更新后的用户信息
   - 返回完整的userInfo对象

---

## 前端集成示例

### 封装更新方法

```javascript
// utils/user.js
import { callCloudFunction } from '@/utils/unicloud-handler.js';

/**
 * 更新用户资料
 * @param {object} profileData - 资料数据
 * @returns {Promise} - 更新结果
 */
export async function updateUserProfile(profileData) {
  try {
    // 参数校验
    if (profileData.nickname) {
      if (profileData.nickname.length < 2 || profileData.nickname.length > 20) {
        throw new Error('昵称长度应为2-20字符');
      }
      
      if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(profileData.nickname)) {
        throw new Error('昵称仅支持中英文、数字、下划线');
      }
    }
    
    if (profileData.bio && profileData.bio.length > 200) {
      throw new Error('个人简介不能超过200字');
    }
    
    // 调用云函数
    const result = await callCloudFunction('user-update-profile', profileData, {
      showLoading: true,
      loadingText: '保存中...',
      timeout: 10000
    });
    
    if (result && result.userInfo) {
      // 更新本地缓存
      const currentUserInfo = JSON.parse(uni.getStorageSync('uni_id_user_info') || '{}');
      const newUserInfo = {
        ...currentUserInfo,
        ...result.userInfo
      };
      uni.setStorageSync('uni_id_user_info', JSON.stringify(newUserInfo));
      
      // 触发全局事件
      uni.$emit('AUTH_CHANGED', { authed: true });
      
      return result.userInfo;
    }
    
    throw new Error('更新失败');
    
  } catch (error) {
    console.error('[USER] 更新资料失败:', error);
    throw error;
  }
}
```

### 在页面中使用

```javascript
// pages/user/profile.vue
import { updateUserProfile } from '@/utils/user.js';

export default {
  methods: {
    async handleSave() {
      try {
        this.saving = true;
        
        const userInfo = await updateUserProfile({
          nickname: this.formData.nickname,
          avatar: this.formData.avatar,
          gender: this.formData.gender,
          birthday: this.formData.birthday,
          bio: this.formData.bio
        });
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
        
      } catch (error) {
        uni.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        });
      } finally {
        this.saving = false;
      }
    }
  }
}
```

---

## 云函数实现要点

### 1. Token验证

```javascript
const { requireAuth } = require('../common/auth');

exports.main = async (event, context) => {
  // 验证Token并获取用户ID
  const authResult = await requireAuth(context);
  if (!authResult.success) {
    return {
      code: 40301,
      msg: '未登录或Token已过期',
      data: null
    };
  }
  
  const userId = authResult.userId;
  
  // 继续处理...
};
```

### 2. 参数校验

```javascript
const { validator } = require('../common/validator');

// 定义校验规则
const rules = {
  nickname: {
    type: 'string',
    min: 2,
    max: 20,
    pattern: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/,
    message: '昵称应为2-20字符，仅支持中英文、数字、下划线'
  },
  gender: {
    type: 'string',
    enum: ['male', 'female', 'other'],
    message: '性别参数无效'
  },
  birthday: {
    type: 'date',
    format: 'YYYY-MM-DD',
    max: new Date(),
    message: '生日格式无效或日期超出范围'
  },
  bio: {
    type: 'string',
    max: 200,
    message: '个人简介最多200字'
  }
};

// 执行校验
const validationResult = validator.validate(event, rules);
if (!validationResult.valid) {
  return {
    code: -1,
    msg: validationResult.message,
    data: null
  };
}
```

### 3. 数据库更新

```javascript
const { createClient } = require('../common/db');

async function updateProfile(userId, updateData) {
  const supabase = createClient();
  
  // 拆分数据到不同表
  const usersData = {};
  const profilesData = {};
  
  if (updateData.nickname) usersData.nickname = updateData.nickname;
  if (updateData.avatar) usersData.avatar = updateData.avatar;
  if (updateData.gender) usersData.gender = updateData.gender;
  if (updateData.birthday) usersData.birthday = updateData.birthday;
  
  if (updateData.bio) profilesData.bio = updateData.bio;
  if (updateData.location) profilesData.location = updateData.location;
  if (updateData.occupation) profilesData.occupation = updateData.occupation;
  if (updateData.education) profilesData.education = updateData.education;
  
  // 更新users表
  if (Object.keys(usersData).length > 0) {
    const { error } = await supabase
      .from('users')
      .update(usersData)
      .eq('id', userId);
    
    if (error) throw error;
  }
  
  // 更新或创建user_profiles
  if (Object.keys(profilesData).length > 0) {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profilesData
      });
    
    if (error) throw error;
  }
  
  // 查询最新用户信息
  const { data: user, error: queryError } = await supabase
    .from('users')
    .select(`
      *,
      user_profiles (*)
    `)
    .eq('id', userId)
    .single();
  
  if (queryError) throw queryError;
  
  return user;
}
```

---

## 安全注意事项

### 1. XSS防护

```javascript
// 对用户输入进行HTML转义
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// 处理用户输入
if (event.nickname) {
  event.nickname = escapeHtml(event.nickname);
}

if (event.bio) {
  event.bio = escapeHtml(event.bio);
}
```

### 2. 敏感词过滤

```javascript
const { checkSensitiveWords } = require('../common/sensitive-filter');

// 检查昵称
if (event.nickname) {
  const check = checkSensitiveWords(event.nickname);
  if (check.hasSensitive) {
    return {
      code: -1,
      msg: '昵称包含敏感词，请修改',
      data: null
    };
  }
}

// 检查个人简介
if (event.bio) {
  const check = checkSensitiveWords(event.bio);
  if (check.hasSensitive) {
    return {
      code: -1,
      msg: '个人简介包含敏感词，请修改',
      data: null
    };
  }
}
```

### 3. 权限控制

- 用户只能更新自己的资料
- Token中的userId必须与请求的userId一致
- 管理员可以更新其他用户的资料（需要额外权限检查）

---

## 性能优化

### 1. 只更新有变化的字段

```javascript
// 先查询当前数据
const { data: currentUser } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// 比较差异
const updates = {};
if (event.nickname && event.nickname !== currentUser.nickname) {
  updates.nickname = event.nickname;
}
// ... 其他字段

// 只有有变化时才更新
if (Object.keys(updates).length > 0) {
  await supabase.from('users').update(updates).eq('id', userId);
}
```

### 2. 批量更新

```javascript
// 使用数据库事务
const { data, error } = await supabase.rpc('update_user_profile', {
  p_user_id: userId,
  p_nickname: event.nickname,
  p_avatar: event.avatar,
  p_bio: event.bio
  // ... 其他参数
});
```

---

## 测试用例

### 单元测试

```javascript
describe('user-update-profile云函数', () => {
  test('更新昵称', async () => {
    const result = await testCloudFunction('user-update-profile', {
      nickname: '新昵称'
    }, {
      UNI_ID_TOKEN: mockToken
    });
    
    expect(result.code).toBe(0);
    expect(result.data.userInfo.nickname).toBe('新昵称');
  });
  
  test('昵称过短', async () => {
    const result = await testCloudFunction('user-update-profile', {
      nickname: '短'
    }, {
      UNI_ID_TOKEN: mockToken
    });
    
    expect(result.code).toBe(-1);
    expect(result.msg).toContain('长度');
  });
  
  test('昵称包含特殊字符', async () => {
    const result = await testCloudFunction('user-update-profile', {
      nickname: '昵称@#$'
    }, {
      UNI_ID_TOKEN: mockToken
    });
    
    expect(result.code).toBe(-1);
    expect(result.msg).toContain('格式');
  });
  
  test('未登录', async () => {
    const result = await testCloudFunction('user-update-profile', {
      nickname: '测试'
    }, {
      // 不提供token
    });
    
    expect(result.code).toBe(40301);
    expect(result.msg).toContain('登录');
  });
  
  test('更新个人简介', async () => {
    const result = await testCloudFunction('user-update-profile', {
      bio: '这是一段个人简介'
    }, {
      UNI_ID_TOKEN: mockToken
    });
    
    expect(result.code).toBe(0);
    expect(result.data.userInfo.bio).toBe('这是一段个人简介');
  });
  
  test('个人简介过长', async () => {
    const longBio = 'a'.repeat(201);
    
    const result = await testCloudFunction('user-update-profile', {
      bio: longBio
    }, {
      UNI_ID_TOKEN: mockToken
    });
    
    expect(result.code).toBe(-1);
    expect(result.msg).toContain('200');
  });
});
```

---

## 监控指标

### 响应时间
- P50: < 150ms
- P95: < 300ms
- P99: < 500ms

### 成功率
- 目标: > 99%

### 更新频率
- 平均每用户每天: < 5次
- 异常高频更新需要告警

---

## 相关文档

- [用户表设计文档](../database/schema-users.md)
- [认证中间件文档](./common-auth.md)
- [参数校验文档](./common-validator.md)

---

## 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-18 | 初始版本 | 开发团队 |

---

**维护说明**: 
- 新增可更新字段需要同步更新文档
- 校验规则变更需要更新规则说明
- 涉及数据库表结构变更需要更新迁移脚本

