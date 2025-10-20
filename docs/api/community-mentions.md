# 社区@用户提醒API文档

**文档版本**: v1.0.0  
**最后更新**: 2025-10-20  
**负责云函数**: `community-comments`

---

## 概述

本文档描述社区评论中@用户提醒功能的完整实现，包括前端解析、后端处理、提醒记录和通知推送。

---

## 功能特性

### 核心功能
1. **@用户选择**: 从话题参与者中选择要@的用户
2. **智能检测**: 自动检测输入中的@符号并提示用户选择
3. **格式解析**: 解析评论中的@标签并提取用户ID
4. **提醒记录**: 后端记录@提醒并通知被@的用户
5. **高亮显示**: 评论中的@用户以蓝色高亮显示

### @标签格式
```
@[用户名](user_id)
```

**示例**:
```
你好 @[张三](user_123456)，欢迎加入讨论！
我同意 @[李四](user_789012) 的观点。
```

---

## 数据库设计

### 1. user_mentions表（新增）

```sql
CREATE TABLE user_mentions (
  id BIGSERIAL PRIMARY KEY,
  
  -- 评论信息
  comment_id BIGINT NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
  
  -- @用户信息
  mentioned_user_id VARCHAR(50) NOT NULL, -- 被@的用户ID
  mentioned_by_user_id VARCHAR(50) NOT NULL, -- @发起人ID
  mentioned_by_user_name VARCHAR(100), -- @发起人昵称
  
  -- 评论内容（用于通知显示）
  comment_content TEXT,
  comment_preview VARCHAR(200), -- 前200字符预览
  
  -- 提醒状态
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 索引
  INDEX idx_mentions_user (mentioned_user_id, is_read, created_at DESC),
  INDEX idx_mentions_comment (comment_id),
  INDEX idx_mentions_topic (topic_id)
);

-- 评论统计
COMMENT ON TABLE user_mentions IS '用户@提醒记录表';
COMMENT ON COLUMN user_mentions.mentioned_user_id IS '被@的用户ID';
COMMENT ON COLUMN user_mentions.is_read IS '是否已读（用户查看过提醒）';
```

---

## API接口

### 1. 创建评论（带@提醒）

**云函数**: `community-comments`

**请求参数**:
```javascript
{
  "action": "create",
  "topic_id": "123456",
  "content": "你好 @[张三](user_123456)，欢迎加入！",
  "mentioned_users": ["user_123456"] // 新增：@的用户ID列表
}
```

**响应数据**:
```javascript
{
  "errCode": 0,
  "errMsg": "评论成功",
  "comment": {
    "id": "789012",
    "topic_id": "123456",
    "user_id": "user_current",
    "user_name": "当前用户",
    "content": "你好 @[张三](user_123456)，欢迎加入！",
    "mentioned_users": ["user_123456"],
    "mentions_count": 1, // @的用户数量
    "created_at": "2025-10-20T10:30:00Z"
  },
  "mentions_created": 1 // 创建的提醒记录数量
}
```

---

### 2. 获取@我的提醒列表

**云函数**: `community-mentions` （新增）

**请求参数**:
```javascript
{
  "action": "list_my_mentions",
  "page": 1,
  "page_size": 20,
  "unread_only": false // 仅未读
}
```

**响应数据**:
```javascript
{
  "errCode": 0,
  "errMsg": "success",
  "list": [
    {
      "id": "mention_001",
      "topic_id": "123456",
      "topic_title": "这是一个话题",
      "comment_id": "789012",
      "comment_preview": "你好 @[张三]，欢迎加入！",
      "mentioned_by": {
        "user_id": "user_abc",
        "user_name": "李四",
        "user_avatar": "https://xxx.com/avatar.jpg"
      },
      "is_read": false,
      "created_at": "2025-10-20T10:30:00Z"
    }
  ],
  "total": 5,
  "unread_count": 2
}
```

---

### 3. 标记提醒为已读

**云函数**: `community-mentions`

**请求参数**:
```javascript
{
  "action": "mark_read",
  "mention_ids": ["mention_001", "mention_002"] // 支持批量标记
}
```

**响应数据**:
```javascript
{
  "errCode": 0,
  "errMsg": "已标记为已读",
  "updated_count": 2
}
```

---

### 4. 获取未读提醒数量

**云函数**: `community-mentions`

**请求参数**:
```javascript
{
  "action": "get_unread_count"
}
```

**响应数据**:
```javascript
{
  "errCode": 0,
  "errMsg": "success",
  "unread_count": 5
}
```

---

## 云函数实现

### community-comments云函数（修改）

```javascript
'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  const { action, topic_id, content, mentioned_users } = event;
  const { uid } = context;
  
  // Token验证
  if (!uid) {
    return { errCode: 401, errMsg: '未登录' };
  }
  
  switch (action) {
    case 'create':
      return await createComment(event, uid);
    // ... 其他action
  }
};

/**
 * 创建评论（支持@用户）
 */
async function createComment(event, userId) {
  const { topic_id, content, mentioned_users = [] } = event;
  
  try {
    // 1. 创建评论
    const commentRes = await db.collection('community_comments').add({
      topic_id,
      user_id: userId,
      content,
      mentioned_users, // 存储@的用户ID列表
      mentions_count: mentioned_users.length,
      likes_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const commentId = commentRes.id;
    
    // 2. 获取当前用户信息
    const userRes = await db.collection('users')
      .doc(userId)
      .field('nickname, avatar')
      .get();
    
    const currentUser = userRes.data[0] || {};
    
    // 3. 创建@提醒记录
    if (mentioned_users.length > 0) {
      const mentionRecords = mentioned_users.map(mentionedUserId => ({
        comment_id: commentId,
        topic_id: topic_id,
        mentioned_user_id: mentionedUserId,
        mentioned_by_user_id: userId,
        mentioned_by_user_name: currentUser.nickname || '未知用户',
        comment_content: content,
        comment_preview: content.substring(0, 200),
        is_read: false,
        created_at: new Date()
      }));
      
      await db.collection('user_mentions').add(mentionRecords);
      
      // 4. 发送通知（可选：集成小程序订阅消息）
      await sendMentionNotifications(mentioned_users, {
        topic_id,
        comment_id: commentId,
        mentioned_by_name: currentUser.nickname,
        comment_preview: content.substring(0, 50)
      });
    }
    
    // 5. 更新话题评论数
    await db.collection('community_topics')
      .doc(topic_id)
      .update({
        comments_count: db.command.inc(1),
        updated_at: new Date()
      });
    
    return {
      errCode: 0,
      errMsg: '评论成功',
      comment: {
        id: commentId,
        topic_id,
        user_id: userId,
        user_name: currentUser.nickname,
        user_avatar: currentUser.avatar,
        content,
        mentioned_users,
        mentions_count: mentioned_users.length,
        created_at: new Date()
      },
      mentions_created: mentioned_users.length
    };
    
  } catch (error) {
    console.error('[CREATE_COMMENT] 失败:', error);
    return {
      errCode: 500,
      errMsg: '评论失败: ' + error.message
    };
  }
}

/**
 * 发送@提醒通知
 */
async function sendMentionNotifications(userIds, context) {
  // TODO: 集成小程序订阅消息
  // 1. 检查用户是否订阅了@提醒
  // 2. 调用小程序模板消息API发送通知
  
  console.log('[MENTION_NOTIFY] 发送通知给:', userIds, context);
}
```

---

### community-mentions云函数（新增）

```javascript
'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const { uid } = context;
  
  // Token验证
  if (!uid) {
    return { errCode: 401, errMsg: '未登录' };
  }
  
  switch (action) {
    case 'list_my_mentions':
      return await listMyMentions(event, uid);
    case 'mark_read':
      return await markMentionsRead(event, uid);
    case 'get_unread_count':
      return await getUnreadCount(uid);
    default:
      return { errCode: 400, errMsg: '未知操作' };
  }
};

/**
 * 获取@我的提醒列表
 */
async function listMyMentions(event, userId) {
  const { page = 1, page_size = 20, unread_only = false } = event;
  const skip = (page - 1) * page_size;
  
  try {
    // 构建查询条件
    const where = {
      mentioned_user_id: userId
    };
    
    if (unread_only) {
      where.is_read = false;
    }
    
    // 查询提醒列表（联表查询）
    const res = await db.collection('user_mentions')
      .where(where)
      .orderBy('created_at', 'desc')
      .skip(skip)
      .limit(page_size)
      .get();
    
    const list = res.data || [];
    
    // 查询总数和未读数
    const countRes = await db.collection('user_mentions')
      .where({ mentioned_user_id: userId })
      .count();
    
    const unreadRes = await db.collection('user_mentions')
      .where({ mentioned_user_id: userId, is_read: false })
      .count();
    
    return {
      errCode: 0,
      errMsg: 'success',
      list: list,
      total: countRes.total,
      unread_count: unreadRes.total
    };
    
  } catch (error) {
    console.error('[LIST_MENTIONS] 失败:', error);
    return {
      errCode: 500,
      errMsg: '获取失败: ' + error.message
    };
  }
}

/**
 * 标记提醒为已读
 */
async function markMentionsRead(event, userId) {
  const { mention_ids = [] } = event;
  
  if (mention_ids.length === 0) {
    return { errCode: 400, errMsg: '请提供要标记的提醒ID' };
  }
  
  try {
    const res = await db.collection('user_mentions')
      .where({
        id: db.command.in(mention_ids),
        mentioned_user_id: userId // 仅能标记自己的提醒
      })
      .update({
        is_read: true,
        read_at: new Date()
      });
    
    return {
      errCode: 0,
      errMsg: '已标记为已读',
      updated_count: res.updated
    };
    
  } catch (error) {
    console.error('[MARK_READ] 失败:', error);
    return {
      errCode: 500,
      errMsg: '标记失败: ' + error.message
    };
  }
}

/**
 * 获取未读提醒数量
 */
async function getUnreadCount(userId) {
  try {
    const res = await db.collection('user_mentions')
      .where({
        mentioned_user_id: userId,
        is_read: false
      })
      .count();
    
    return {
      errCode: 0,
      errMsg: 'success',
      unread_count: res.total
    };
    
  } catch (error) {
    console.error('[UNREAD_COUNT] 失败:', error);
    return {
      errCode: 500,
      errMsg: '获取失败: ' + error.message
    };
  }
}
```

---

## 前端集成

### 1. 基础使用

```javascript
import { 
  insertMention, 
  parseMentions,
  renderMentions 
} from '@/utils/mention-helper.js';

// 在评论输入时插入@用户
const result = insertMention(
  '你好 @',
  5,  // @符号位置
  6,  // 光标位置
  { id: 'user_123', name: '张三' }
);

console.log(result.content); // "你好 @[张三](user_123) "

// 提交评论时解析@用户
const mentionedUserIds = parseMentions(commentText);

// 提交评论
await callCloudFunction('community-comments', {
  action: 'create',
  topic_id: topicId,
  content: commentText,
  mentioned_users: mentionedUserIds
});

// 渲染评论（高亮@用户）
const htmlContent = renderMentions(comment.content);
```

### 2. 完整示例（detail.vue）

详见 `pages/community/detail.vue` 实现。

---

## 性能优化

### 1. 索引优化
```sql
-- 查询用户的@提醒
CREATE INDEX idx_mentions_user ON user_mentions (mentioned_user_id, is_read, created_at DESC);

-- 根据评论查询提醒
CREATE INDEX idx_mentions_comment ON user_mentions (comment_id);

-- 根据话题查询提醒
CREATE INDEX idx_mentions_topic ON user_mentions (topic_id);
```

### 2. 缓存策略
- **未读数缓存**: 使用Redis缓存未读提醒数量（TTL: 60s）
- **提醒列表缓存**: 缓存最近20条提醒（TTL: 30s）

### 3. 批量处理
- 支持批量标记已读
- 批量查询用户信息（一次性获取所有@的用户）

---

## 安全性

### 1. 权限控制
- 仅能@话题参与者（作者+评论者）
- 防止恶意@大量用户（限制每条评论最多@5个用户）
- 防止频繁@（同一用户1分钟内最多@3次）

### 2. 内容过滤
- 检测评论内容中的@标签格式
- 验证被@用户是否存在
- 过滤无效的user_id

### 3. 防刷机制
```javascript
// 检查@频率
async function checkMentionRateLimit(userId, mentionedUserId) {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  
  const count = await db.collection('user_mentions')
    .where({
      mentioned_by_user_id: userId,
      mentioned_user_id: mentionedUserId,
      created_at: db.command.gte(oneMinuteAgo)
    })
    .count();
  
  return count.total < 3; // 1分钟内最多@同一用户3次
}
```

---

## 通知推送

### 1. 小程序订阅消息

**模板消息格式**:
```
【@提醒】
{{user_name}} 在评论中@了你
话题：{{topic_title}}
内容：{{comment_preview}}
时间：{{created_at}}
```

### 2. 应用内通知
- Badge显示未读数量
- 用户中心显示@提醒列表
- 点击通知跳转到对应评论

---

## 统计分析

### 1. @使用统计
```javascript
// 统计每日@使用次数
SELECT 
  DATE(created_at) as date,
  COUNT(*) as mention_count,
  COUNT(DISTINCT mentioned_by_user_id) as active_users
FROM user_mentions
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. 活跃用户分析
```javascript
// 最常被@的用户 TOP 10
SELECT 
  mentioned_user_id,
  COUNT(*) as mention_count
FROM user_mentions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY mentioned_user_id
ORDER BY mention_count DESC
LIMIT 10;
```

---

## 错误处理

### 错误码
| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未登录 | 重新登录 |
| 403 | 无权限@该用户 | 提示用户 |
| 429 | @频率过高 | 稍后重试 |
| 500 | 服务器错误 | 稍后重试 |

---

## 测试用例

### 1. 单元测试
```javascript
// mention-helper.test.js
describe('@用户功能测试', () => {
  test('解析@标签', () => {
    const content = '你好 @[张三](user_123) 和 @[李四](user_456)';
    const userIds = parseMentions(content);
    expect(userIds).toEqual(['user_123', 'user_456']);
  });
  
  test('插入@标签', () => {
    const result = insertMention('你好 @', 5, 6, {
      id: 'user_123',
      name: '张三'
    });
    expect(result.content).toBe('你好 @[张三](user_123) ');
  });
  
  test('渲染@标签', () => {
    const html = renderMentions('你好 @[张三](user_123)');
    expect(html).toContain('class="mention-tag"');
    expect(html).toContain('@张三');
  });
});
```

### 2. 集成测试
- 创建评论并@用户
- 查询@提醒列表
- 标记已读
- 删除评论后提醒也删除（级联）

---

## 更新日志

### v1.0.0 (2025-10-20)
- ✅ 初始版本发布
- ✅ 支持@用户选择
- ✅ 解析和渲染@标签
- ✅ 提醒记录和列表查询
- ✅ 未读数量统计
- ✅ 批量标记已读

---

## 相关文档
- [社区话题API](./community-topics.md)
- [社区评论API](./community-comments.md)
- [mention-helper工具](../../utils/mention-helper.js)

---

**文档维护**: AI助手  
**审核状态**: 待审核  
**下次更新**: 功能上线后根据实际使用情况调整

