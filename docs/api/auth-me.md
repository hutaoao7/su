# auth-me API文档

## 基本信息

- **云函数名称**: `auth-me`
- **功能描述**: 获取当前登录用户的完整信息
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多20次请求

---

## 请求参数

### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| include_stats | Boolean | 否 | false | 是否包含统计数据 |
| include_settings | Boolean | 否 | false | 是否包含用户设置 |

### 请求示例

```javascript
// 基础查询
const { result } = await uniCloud.callFunction({
  name: 'auth-me'
});

// 包含统计数据和设置
const { result } = await uniCloud.callFunction({
  name: 'auth-me',
  data: {
    include_stats: true,
    include_settings: true
  }
});
```

---

## 响应格式

### 基础响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "openid": "oXXXXXXXXXXXXXXXX",
    "nickname": "张三",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "gender": "male",
    "birthday": "1995-06-15",
    "role": "user",
    "status": "active",
    "bio": "这是我的个人简介",
    "location": "北京",
    "occupation": "学生",
    "education": "本科",
    "created_at": "2025-01-01T00:00:00Z",
    "last_login_at": "2025-10-18T08:00:00Z"
  }
}
```

### 包含统计数据的响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nickname": "张三",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "role": "user",
    "stats": {
      "total_assessments": 15,
      "completed_assessments": 12,
      "total_chat_sessions": 8,
      "total_chat_messages": 156,
      "favorite_tracks_count": 23,
      "member_days": 45
    }
  }
}
```

### 包含设置的响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nickname": "张三",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "role": "user",
    "settings": {
      "theme": "light",
      "language": "zh_CN",
      "notifications_enabled": true,
      "push_stress_reminder": true,
      "push_daily_tips": true,
      "push_community_updates": false,
      "sound_effects_enabled": true,
      "vibration_enabled": true,
      "font_size": "medium"
    }
  }
}
```

### 失败响应

```json
{
  "code": 40301,
  "msg": "未登录或Token已过期",
  "data": null
}
```

```json
{
  "code": 40401,
  "msg": "用户不存在",
  "data": null
}
```

---

## 错误码

| 错误码 | 错误信息 | 说明 | 处理建议 |
|--------|----------|------|----------|
| 0 | 查询成功 | 成功 | - |
| 40301 | 未登录或Token已过期 | 认证失败 | 重新登录 |
| 40401 | 用户不存在 | 数据库中找不到用户 | 检查用户状态 |
| 50002 | 数据库查询失败 | 数据库错误 | 联系技术支持 |

---

## 业务流程

### 查询流程图

```
前端                    auth-me云函数                  数据库
  |                          |                           |
  |--1. callFunction-------->|                           |
  |     { include_stats }    |                           |
  |                          |                           |
  |                          |--2. 验证Token------------>|
  |                          |<--返回用户ID--------------|
  |                          |                           |
  |                          |--3. 查询用户基本信息------>|
  |                          |<--返回users + profiles----|
  |                          |                           |
  |                          |--4. 查询settings--------->|
  |                          |   (如需要)                |
  |                          |<--返回settings------------|
  |                          |                           |
  |                          |--5. 查询统计数据--------->|
  |                          |   (如需要)                |
  |                          |<--返回stats---------------|
  |                          |                           |
  |<--6. 返回完整用户信息-----|                           |
```

---

## 云函数实现示例

### 完整实现

```javascript
'use strict';

const { requireAuth } = require('../common/auth');
const { createClient } = require('../common/db');
const { success, error } = require('../common/response');

exports.main = async (event, context) => {
  try {
    // 1. Token验证
    const authResult = await requireAuth(context);
    if (!authResult.success) {
      return error(40301, '未登录或Token已过期');
    }
    
    const userId = authResult.userId;
    const { include_stats, include_settings } = event;
    
    // 2. 查询用户基本信息
    const supabase = createClient();
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select(`
        *,
        user_profiles (
          bio,
          location,
          occupation,
          education,
          interests
        )
      `)
      .eq('id', userId)
      .single();
    
    if (queryError || !user) {
      console.error('查询用户失败:', queryError);
      return error(40401, '用户不存在');
    }
    
    // 3. 合并profile数据到user对象
    const userData = {
      ...user,
      bio: user.user_profiles?.[0]?.bio,
      location: user.user_profiles?.[0]?.location,
      occupation: user.user_profiles?.[0]?.occupation,
      education: user.user_profiles?.[0]?.education,
      interests: user.user_profiles?.[0]?.interests || []
    };
    delete userData.user_profiles;
    
    // 4. 查询设置（如需要）
    if (include_settings) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (settings) {
        userData.settings = {
          theme: settings.theme,
          language: settings.language,
          notifications_enabled: settings.notifications_enabled,
          push_stress_reminder: settings.push_stress_reminder,
          push_daily_tips: settings.push_daily_tips,
          push_community_updates: settings.push_community_updates,
          sound_effects_enabled: settings.sound_effects_enabled,
          vibration_enabled: settings.vibration_enabled,
          font_size: settings.font_size
        };
      }
    }
    
    // 5. 查询统计数据（如需要）
    if (include_stats) {
      const stats = await getUserStats(userId, supabase);
      userData.stats = stats;
    }
    
    // 6. 返回结果
    return success(userData, '查询成功');
    
  } catch (err) {
    console.error('auth-me错误:', err);
    return error(50002, '查询失败');
  }
};

/**
 * 获取用户统计数据
 */
async function getUserStats(userId, supabase) {
  try {
    // 评估统计
    const { count: totalAssessments } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    const { count: completedAssessments } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    // 聊天统计
    const { count: totalChatSessions } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    const { data: messageCounts } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('user_id', userId);
    
    // 收藏统计
    const { count: favoriteTracksCount } = await supabase
      .from('user_music_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // 计算会员天数
    const { data: user } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();
    
    const memberDays = user ? Math.floor((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      total_assessments: totalAssessments || 0,
      completed_assessments: completedAssessments || 0,
      total_chat_sessions: totalChatSessions || 0,
      total_chat_messages: messageCounts?.length || 0,
      favorite_tracks_count: favoriteTracksCount || 0,
      member_days: memberDays
    };
  } catch (error) {
    console.error('查询统计数据失败:', error);
    return {};
  }
}
```

---

## 前端集成

### 封装查询方法

```javascript
// utils/user.js
export async function getCurrentUserInfo(options = {}) {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'auth-me',
      data: {
        include_stats: options.includeStats || false,
        include_settings: options.includeSettings || false
      }
    });
    
    if (result.code === 0) {
      // 更新本地缓存
      uni.setStorageSync('uni_id_user_info', JSON.stringify(result.data));
      return result.data;
    } else {
      throw new Error(result.msg);
    }
  } catch (error) {
    console.error('[USER] 获取用户信息失败:', error);
    throw error;
  }
}
```

### 使用示例

```javascript
// 在用户中心页面使用
export default {
  async onLoad() {
    try {
      // 获取完整用户信息（包含统计）
      const userInfo = await getCurrentUserInfo({
        includeStats: true,
        includeSettings: false
      });
      
      this.userInfo = userInfo;
      this.stats = userInfo.stats;
      
    } catch (error) {
      uni.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  }
}
```

---

## 缓存策略

### 1. 本地缓存

```javascript
// 优先使用本地缓存，异步更新
export async function getCachedUserInfo() {
  // 1. 先返回缓存
  const cached = uni.getStorageSync('uni_id_user_info');
  const userInfo = cached ? JSON.parse(cached) : null;
  
  // 2. 异步更新
  getCurrentUserInfo().then(freshData => {
    // 更新缓存已在getCurrentUserInfo中处理
  }).catch(err => {
    console.warn('更新用户信息失败:', err);
  });
  
  return userInfo;
}
```

### 2. 失效策略

- 用户信息缓存有效期：1小时
- 统计数据缓存有效期：5分钟
- 更新资料后立即刷新缓存

---

## 性能优化

### 1. 查询优化

```sql
-- 使用单次查询获取所有数据
SELECT 
  u.*,
  p.bio, p.location, p.occupation, p.education, p.interests,
  s.theme, s.language, s.notifications_enabled
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id
LEFT JOIN user_settings s ON s.user_id = u.id
WHERE u.id = :user_id;
```

### 2. 统计数据缓存

```javascript
// 使用Redis缓存统计数据
const cacheKey = `user_stats:${userId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
} else {
  const stats = await getUserStats(userId);
  await redis.setex(cacheKey, 300, JSON.stringify(stats)); // 5分钟缓存
  return stats;
}
```

---

## 数据脱敏

```javascript
// 对敏感信息进行脱敏
function maskSensitiveData(user) {
  if (user.phone) {
    // 手机号：138****5678
    user.phone = user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  if (user.email) {
    // 邮箱：abc***@example.com
    user.email = user.email.replace(/(.{3}).*(@.*)/, '$1***$2');
  }
  
  // 不返回openid（隐私信息）
  delete user.openid;
  
  return user;
}
```

---

## 测试用例

```javascript
describe('auth-me云函数', () => {
  test('正常查询', async () => {
    const result = await testCloudFunction('auth-me', {}, {
      UNI_ID_TOKEN: mockToken
    });
    
    expect(result.code).toBe(0);
    expect(result.data.id).toBeDefined();
    expect(result.data.nickname).toBeDefined();
  });
  
  test('未登录', async () => {
    const result = await testCloudFunction('auth-me', {});
    
    expect(result.code).toBe(40301);
    expect(result.msg).toContain('登录');
  });
  
  test('查询包含统计数据', async () => {
    const result = await testCloudFunction('auth-me', {
      include_stats: true
    }, {
      UNI_ID_TOKEN: mockToken
    });
    
    expect(result.code).toBe(0);
    expect(result.data.stats).toBeDefined();
    expect(result.data.stats.total_assessments).toBeGreaterThanOrEqual(0);
  });
  
  test('查询包含设置', async () => {
    const result = await testCloudFunction('auth-me', {
      include_settings: true
    }, {
      UNI_ID_TOKEN: mockToken
    });
    
    expect(result.code).toBe(0);
    expect(result.data.settings).toBeDefined();
    expect(result.data.settings.theme).toBeDefined();
  });
});
```

---

## 监控指标

### 响应时间
- P50: < 100ms
- P95: < 200ms
- P99: < 300ms

### 缓存命中率
- 目标: > 80%

### 调用频率
- 预期：每用户每天5-10次
- 异常：每分钟超过10次需告警

---

## 相关文档

- [auth-login API文档](./auth-login.md)
- [user-update-profile API文档](./user-update-profile.md)
- [用户表设计文档](../database/schema-users.md)

---

## 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-18 | 初始版本 | 开发团队 |

---

**维护说明**: 
- 新增字段需要同步更新响应示例
- 统计维度变更需要更新getUserStats函数
- 缓存策略调整需要评估性能影响

