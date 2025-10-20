# API文档：chat-history - 获取聊天历史记录

## 基本信息

| 项目 | 内容 |
|------|------|
| **API名称** | 获取聊天历史记录 |
| **云函数名** | `chat-history` |
| **请求方式** | POST |
| **认证方式** | Bearer Token（必须） |
| **版本** | v1.0.0 |
| **创建日期** | 2025-10-21 |
| **维护人** | 后端开发团队 |

---

## 功能描述

获取用户的聊天历史记录，支持按会话查询、分页加载、时间范围筛选和全文搜索。

### 主要特性
- 🔒 用户隔离：只能访问自己的聊天记录
- 📄 分页支持：避免一次性加载大量数据
- 🔍 全文搜索：支持在聊天内容中搜索关键词
- 📅 时间筛选：支持按时间范围查询
- 🔄 会话管理：按会话ID查询或列出所有会话

---

## 请求参数

### Headers

```javascript
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

### Body参数

```typescript
interface ChatHistoryRequest {
  // 查询模式（必选）
  mode: 'sessions' | 'messages' | 'search';
  
  // 会话查询参数
  session_id?: string;        // 会话ID（查询特定会话的消息）
  
  // 分页参数
  page?: number;              // 页码（默认1）
  page_size?: number;         // 每页数量（默认20，最大100）
  
  // 时间范围筛选
  start_date?: string;        // 开始时间（ISO 8601格式）
  end_date?: string;          // 结束时间（ISO 8601格式）
  
  // 全文搜索
  keyword?: string;           // 搜索关键词
  
  // 筛选条件
  status?: 'active' | 'archived' | 'deleted';  // 会话状态
  session_type?: 'general' | 'crisis' | 'cbt'; // 会话类型
  
  // 排序
  order_by?: 'created_at' | 'last_message_at';  // 排序字段
  order_direction?: 'asc' | 'desc';              // 排序方向（默认desc）
}
```

### 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| mode | string | 是 | - | 查询模式：sessions（会话列表）、messages（消息列表）、search（搜索） |
| session_id | string | 否 | - | 会话ID，查询特定会话的消息时必填 |
| page | number | 否 | 1 | 页码，从1开始 |
| page_size | number | 否 | 20 | 每页数量，范围1-100 |
| start_date | string | 否 | - | 开始时间（ISO 8601） |
| end_date | string | 否 | - | 结束时间（ISO 8601） |
| keyword | string | 否 | - | 搜索关键词（至少2个字符） |
| status | string | 否 | 'active' | 会话状态筛选 |
| session_type | string | 否 | - | 会话类型筛选 |
| order_by | string | 否 | 'created_at' | 排序字段 |
| order_direction | string | 否 | 'desc' | 排序方向 |

---

## 响应格式

### 成功响应（mode: 'sessions'）

```json
{
  "code": 0,
  "message": "获取会话列表成功",
  "data": {
    "sessions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "session_title": "关于压力管理的对话",
        "session_type": "general",
        "ai_model": "gpt-3.5-turbo",
        "ai_personality": "empathetic",
        "message_count": 15,
        "total_tokens": 1250,
        "status": "active",
        "started_at": "2025-10-15T10:00:00Z",
        "last_message_at": "2025-10-15T11:30:00Z",
        "created_at": "2025-10-15T10:00:00Z",
        "updated_at": "2025-10-15T11:30:00Z",
        "last_message_preview": "那我建议你尝试一些放松技巧..."
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "page_size": 20,
      "total_pages": 3
    }
  }
}
```

### 成功响应（mode: 'messages'）

```json
{
  "code": 0,
  "message": "获取消息列表成功",
  "data": {
    "session": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "session_title": "关于压力管理的对话",
      "session_type": "general",
      "ai_personality": "empathetic"
    },
    "messages": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "role": "user",
        "content": "我最近压力很大，不知道怎么办",
        "tokens_used": 12,
        "is_sensitive": false,
        "is_crisis": false,
        "status": "sent",
        "created_at": "2025-10-15T10:01:00Z"
      },
      {
        "id": "650e8400-e29b-41d4-a716-446655440002",
        "role": "assistant",
        "content": "我理解你现在的感受。压力大是很正常的...",
        "tokens_used": 45,
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "is_sensitive": false,
        "is_crisis": false,
        "status": "sent",
        "created_at": "2025-10-15T10:01:05Z",
        "feedback": {
          "rating": 5,
          "feedback_type": "helpful"
        }
      },
      {
        "id": "650e8400-e29b-41d4-a716-446655440003",
        "role": "user",
        "content": "[已撤回]",
        "status": "recalled",
        "recalled_at": "2025-10-15T10:02:00Z",
        "created_at": "2025-10-15T10:01:30Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "page_size": 20,
      "total_pages": 1
    }
  }
}
```

### 成功响应（mode: 'search'）

```json
{
  "code": 0,
  "message": "搜索成功",
  "data": {
    "results": [
      {
        "message_id": "650e8400-e29b-41d4-a716-446655440001",
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "session_title": "关于压力管理的对话",
        "role": "user",
        "content": "我最近<em>压力</em>很大，不知道怎么办",
        "highlight": "...最近<em>压力</em>很大...",
        "created_at": "2025-10-15T10:01:00Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "page_size": 20,
      "total_pages": 1
    },
    "search_meta": {
      "keyword": "压力",
      "search_time_ms": 45
    }
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "请求参数错误：mode参数必填",
  "error": "INVALID_REQUEST"
}
```

```json
{
  "code": 401,
  "message": "未授权访问，请先登录",
  "error": "UNAUTHORIZED"
}
```

```json
{
  "code": 403,
  "message": "无权访问该会话",
  "error": "FORBIDDEN"
}
```

```json
{
  "code": 404,
  "message": "会话不存在",
  "error": "SESSION_NOT_FOUND"
}
```

```json
{
  "code": 500,
  "message": "服务器内部错误",
  "error": "INTERNAL_ERROR",
  "request_id": "req_123456789"
}
```

---

## 状态码说明

| HTTP状态码 | code | 说明 |
|-----------|------|------|
| 200 | 0 | 请求成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未授权（Token无效或过期） |
| 403 | 403 | 禁止访问（权限不足） |
| 404 | 404 | 资源不存在 |
| 429 | 429 | 请求过于频繁 |
| 500 | 500 | 服务器内部错误 |

---

## 使用示例

### 示例1：获取会话列表

```javascript
// 前端调用示例
const getSessionList = async () => {
  try {
    const result = await uniCloud.callFunction({
      name: 'chat-history',
      data: {
        mode: 'sessions',
        page: 1,
        page_size: 20,
        status: 'active',
        order_by: 'last_message_at',
        order_direction: 'desc'
      }
    });
    
    if (result.result.code === 0) {
      const sessions = result.result.data.sessions;
      console.log('会话列表:', sessions);
    }
  } catch (error) {
    console.error('获取会话列表失败:', error);
  }
};
```

### 示例2：获取特定会话的消息

```javascript
const getSessionMessages = async (sessionId) => {
  try {
    const result = await uniCloud.callFunction({
      name: 'chat-history',
      data: {
        mode: 'messages',
        session_id: sessionId,
        page: 1,
        page_size: 50,
        order_by: 'created_at',
        order_direction: 'asc'
      }
    });
    
    if (result.result.code === 0) {
      const messages = result.result.data.messages;
      console.log('消息列表:', messages);
    }
  } catch (error) {
    console.error('获取消息失败:', error);
  }
};
```

### 示例3：搜索聊天记录

```javascript
const searchChatHistory = async (keyword) => {
  try {
    const result = await uniCloud.callFunction({
      name: 'chat-history',
      data: {
        mode: 'search',
        keyword: keyword,
        page: 1,
        page_size: 20
      }
    });
    
    if (result.result.code === 0) {
      const results = result.result.data.results;
      console.log('搜索结果:', results);
    }
  } catch (error) {
    console.error('搜索失败:', error);
  }
};
```

### 示例4：按时间范围查询

```javascript
const getRecentSessions = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  try {
    const result = await uniCloud.callFunction({
      name: 'chat-history',
      data: {
        mode: 'sessions',
        start_date: sevenDaysAgo.toISOString(),
        end_date: now.toISOString(),
        page: 1,
        page_size: 20
      }
    });
    
    if (result.result.code === 0) {
      const sessions = result.result.data.sessions;
      console.log('最近7天的会话:', sessions);
    }
  } catch (error) {
    console.error('获取失败:', error);
  }
};
```

---

## 数据库查询

### SQL查询示例（会话列表）

```sql
SELECT 
  cs.id,
  cs.session_title,
  cs.session_type,
  cs.ai_model,
  cs.ai_personality,
  cs.message_count,
  cs.total_tokens,
  cs.status,
  cs.started_at,
  cs.last_message_at,
  cs.created_at,
  cs.updated_at,
  (
    SELECT content 
    FROM chat_messages cm 
    WHERE cm.session_id = cs.id 
    ORDER BY cm.created_at DESC 
    LIMIT 1
  ) as last_message_preview
FROM chat_sessions cs
WHERE cs.user_id = $1
  AND cs.status = $2
  AND cs.last_message_at >= $3
  AND cs.last_message_at <= $4
ORDER BY cs.last_message_at DESC
LIMIT $5 OFFSET $6;
```

### SQL查询示例（消息列表）

```sql
SELECT 
  cm.id,
  cm.role,
  cm.content,
  cm.tokens_used,
  cm.model,
  cm.temperature,
  cm.is_sensitive,
  cm.is_crisis,
  cm.status,
  cm.recalled_at,
  cm.created_at,
  cf.rating,
  cf.feedback_type
FROM chat_messages cm
LEFT JOIN chat_feedbacks cf ON cf.message_id = cm.id
WHERE cm.session_id = $1
  AND cm.user_id = $2
ORDER BY cm.created_at ASC
LIMIT $3 OFFSET $4;
```

### SQL查询示例（全文搜索）

```sql
SELECT 
  cm.id as message_id,
  cm.session_id,
  cs.session_title,
  cm.role,
  cm.content,
  ts_headline('chinese', cm.content, 
    plainto_tsquery('chinese', $2),
    'StartSel=<em>, StopSel=</em>, MaxWords=20, MinWords=10'
  ) as highlight,
  cm.created_at
FROM chat_messages cm
JOIN chat_sessions cs ON cs.id = cm.session_id
WHERE cm.user_id = $1
  AND to_tsvector('chinese', cm.content) @@ plainto_tsquery('chinese', $2)
  AND cm.status != 'deleted'
ORDER BY cm.created_at DESC
LIMIT $3 OFFSET $4;
```

---

## 性能优化

### 1. 索引优化

确保以下索引已创建：

```sql
-- 会话查询优化
CREATE INDEX idx_chat_sessions_user_status 
ON chat_sessions(user_id, status, last_message_at DESC);

-- 消息查询优化
CREATE INDEX idx_chat_messages_session_created 
ON chat_messages(session_id, created_at ASC);

-- 全文搜索优化
CREATE INDEX idx_chat_messages_content_fts 
ON chat_messages USING GIN (to_tsvector('chinese', content));

-- 用户消息查询优化
CREATE INDEX idx_chat_messages_user_id 
ON chat_messages(user_id);
```

### 2. 查询优化建议

- **分页限制**：单次查询不超过100条记录
- **缓存策略**：会话列表缓存5分钟
- **查询超时**：设置30秒查询超时
- **异步加载**：前端使用虚拟滚动加载历史消息

### 3. 连接池配置

```javascript
// 云函数数据库配置
const db = uniCloud.database({
  connectionLimit: 10,
  queueLimit: 0
});
```

---

## 安全性

### 1. 权限验证

```javascript
// 验证用户只能访问自己的数据
const verifyAccess = async (userId, sessionId) => {
  const session = await db.collection('chat_sessions')
    .where({
      id: sessionId,
      user_id: userId
    })
    .get();
    
  if (!session.data || session.data.length === 0) {
    throw new Error('FORBIDDEN');
  }
};
```

### 2. 敏感内容处理

```javascript
// 脱敏处理
const maskSensitiveContent = (messages) => {
  return messages.map(msg => {
    if (msg.is_sensitive && msg.content_encrypted) {
      // 使用加密内容，需要解密
      msg.content = decrypt(msg.content_encrypted);
    }
    return msg;
  });
};
```

### 3. 速率限制

```javascript
// 限制每个用户每分钟最多60次请求
const RATE_LIMIT = {
  windowMs: 60 * 1000,
  max: 60
};
```

---

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| INVALID_REQUEST | 请求参数错误 | 检查请求参数格式和必填项 |
| UNAUTHORIZED | 未授权访问 | 检查Token是否有效 |
| FORBIDDEN | 权限不足 | 确认是否有访问权限 |
| SESSION_NOT_FOUND | 会话不存在 | 检查session_id是否正确 |
| RATE_LIMIT_EXCEEDED | 请求过于频繁 | 降低请求频率 |
| INTERNAL_ERROR | 服务器错误 | 联系技术支持 |

### 错误处理示例

```javascript
const handleChatHistoryError = (error) => {
  const errorMessages = {
    'INVALID_REQUEST': '请求参数有误，请检查后重试',
    'UNAUTHORIZED': '登录已过期，请重新登录',
    'FORBIDDEN': '您无权访问该内容',
    'SESSION_NOT_FOUND': '会话不存在或已删除',
    'RATE_LIMIT_EXCEEDED': '操作过于频繁，请稍后再试',
    'INTERNAL_ERROR': '服务器错误，请稍后重试'
  };
  
  const message = errorMessages[error.error] || error.message;
  
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
};
```

---

## 监控指标

### 关键指标

| 指标 | 说明 | 目标值 |
|------|------|--------|
| 响应时间（P95） | 95%请求响应时间 | < 500ms |
| 错误率 | 错误请求占比 | < 1% |
| QPS | 每秒查询数 | 支持1000+ |
| 缓存命中率 | 会话列表缓存命中率 | > 80% |

### 日志记录

```javascript
// 记录查询日志
const logQuery = (userId, mode, params, duration) => {
  console.log({
    timestamp: new Date().toISOString(),
    user_id: userId,
    mode: mode,
    params: params,
    duration_ms: duration,
    endpoint: 'chat-history'
  });
};
```

---

## 测试用例

### 单元测试

```javascript
describe('chat-history API', () => {
  test('应该返回用户的会话列表', async () => {
    const result = await callFunction('chat-history', {
      mode: 'sessions',
      page: 1,
      page_size: 10
    });
    
    expect(result.code).toBe(0);
    expect(result.data.sessions).toBeInstanceOf(Array);
  });
  
  test('应该能按时间范围筛选', async () => {
    const result = await callFunction('chat-history', {
      mode: 'sessions',
      start_date: '2025-10-01T00:00:00Z',
      end_date: '2025-10-31T23:59:59Z'
    });
    
    expect(result.code).toBe(0);
  });
  
  test('应该支持全文搜索', async () => {
    const result = await callFunction('chat-history', {
      mode: 'search',
      keyword: '压力'
    });
    
    expect(result.code).toBe(0);
    expect(result.data.results).toBeInstanceOf(Array);
  });
  
  test('应该阻止访问他人会话', async () => {
    const result = await callFunction('chat-history', {
      mode: 'messages',
      session_id: 'other-user-session-id'
    });
    
    expect(result.code).toBe(403);
    expect(result.error).toBe('FORBIDDEN');
  });
});
```

---

## 更新日志

| 版本 | 日期 | 变更内容 | 负责人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-21 | 初始版本，支持会话列表、消息查询、全文搜索 | 开发团队 |

---

## 相关文档

- [数据库设计文档](../database/schema-chat.md)
- [stress-chat API文档](./stress-chat.md)
- [chat-feedback API文档](./chat-feedback.md)

---

**维护说明**:
- 定期review查询性能
- 监控错误率和响应时间
- 及时更新API版本和文档

