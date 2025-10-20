# chat-feedback API 文档

## 基本信息

- **云函数名称**: `chat-feedback`
- **功能**: 接收用户对AI回复的评分和反馈
- **版本**: v1.0.0
- **创建日期**: 2025-10-20

---

## 接口说明

### 1. 提交评分反馈

#### 请求参数

```javascript
{
  sessionId: String,        // 会话ID（必填）
  messageContent: String,   // 消息内容（必填）
  messageTimestamp: Number, // 消息时间戳（选填）
  rating: String,           // 评分类型（必填）
  feedback: String,         // 详细反馈（选填）
  timestamp: Number         // 提交时间戳（必填）
}
```

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | String | 是 | 会话唯一标识符 |
| messageContent | String | 是 | 被评价的AI回复内容 |
| messageTimestamp | Number | 否 | 消息发送时间戳 |
| rating | String | 是 | 评分类型：`good`（好评）、`bad`（差评）、`neutral`（中立） |
| feedback | String | 否 | 用户详细反馈文本 |
| timestamp | Number | 是 | 评分提交时间戳 |

#### rating 取值

- `good`: 用户认为AI回复很有帮助
- `bad`: 用户认为AI回复不够满意
- `neutral`: 中立评价（预留）

---

## 响应格式

### 成功响应

```javascript
{
  success: true,
  code: 0,
  msg: "提交成功",
  data: {
    feedback_id: "uuid-string",
    timestamp: 1697808000000
  }
}
```

### 错误响应

#### 1. 未登录（401）

```javascript
{
  success: false,
  code: 40301,
  msg: "未登录",
  data: null
}
```

#### 2. 参数缺失（400）

```javascript
{
  success: false,
  code: 40001,
  msg: "参数缺失",
  data: null
}
```

#### 3. 无效的评分值（400）

```javascript
{
  success: false,
  code: 40002,
  msg: "无效的评分值",
  data: null
}
```

#### 4. 保存失败（500）

```javascript
{
  success: false,
  code: 50001,
  msg: "保存失败",
  data: null
}
```

---

## 使用示例

### 前端调用

```javascript
// 提交好评
const res = await uniCloud.callFunction({
  name: 'chat-feedback',
  data: {
    sessionId: 'default',
    messageContent: 'AI的回复内容...',
    messageTimestamp: Date.now() - 5000,
    rating: 'good',
    timestamp: Date.now()
  }
});

if (res.result.success) {
  console.log('评分提交成功');
} else {
  console.error('评分提交失败:', res.result.msg);
}
```

### 提交差评并附带反馈

```javascript
const res = await uniCloud.callFunction({
  name: 'chat-feedback',
  data: {
    sessionId: 'session_1697808000',
    messageContent: 'AI的回复内容...',
    messageTimestamp: Date.now() - 10000,
    rating: 'bad',
    feedback: '回复太简短，没有提供实质性建议',
    timestamp: Date.now()
  }
});
```

---

## 数据库设计

### chat_feedbacks 表

```sql
CREATE TABLE chat_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL,
  session_id VARCHAR(50) NOT NULL,
  message_content TEXT NOT NULL,
  message_timestamp BIGINT,
  rating VARCHAR(20) NOT NULL CHECK (rating IN ('good', 'bad', 'neutral')),
  feedback_text TEXT,
  device_info VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_session (user_id, session_id),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at)
);
```

### 字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| user_id | VARCHAR(50) | 用户ID |
| session_id | VARCHAR(50) | 会话ID |
| message_content | TEXT | 被评价的消息内容 |
| message_timestamp | BIGINT | 消息时间戳 |
| rating | VARCHAR(20) | 评分类型 |
| feedback_text | TEXT | 详细反馈 |
| device_info | VARCHAR(50) | 设备信息 |
| created_at | TIMESTAMP | 创建时间 |

---

## 统计功能

云函数会自动更新会话表的统计信息：

```javascript
// 更新 chat_sessions 表
{
  feedback_good_count: Number,    // 好评数量
  feedback_bad_count: Number,     // 差评数量
  feedback_total_count: Number,   // 总评价数
  satisfaction_rate: Number       // 满意度百分比
}
```

---

## 安全性

### Token验证

所有请求必须携带有效的用户Token，云函数会验证：
- Token有效性
- Token过期时间
- 用户身份提取

### 数据验证

- 必填参数检查
- 评分值范围验证
- 内容长度限制

---

## 性能优化

### 异步统计

统计数据更新采用异步方式，不阻塞主响应：

```javascript
updateFeedbackStats(supabase, sessionId, rating).catch(err => {
  console.warn('更新统计失败:', err);
});
```

### 批量查询

统计计算时使用单次查询获取所有评分数据：

```javascript
const { data: stats } = await supabase
  .from('chat_feedbacks')
  .select('rating')
  .eq('session_id', sessionId);
```

---

## 错误处理

### 日志记录

所有错误都会被详细记录：

```javascript
console.error('[CHAT-FEEDBACK] 错误:', {
  type: errorType,
  message: error.message,
  timestamp: new Date().toISOString()
});
```

### 错误返回

返回友好的错误信息给前端：

```javascript
{
  success: false,
  code: errorCode,
  msg: userFriendlyMessage,
  data: null
}
```

---

## 监控指标

### 建议监控的指标

1. **好评率**: `good_count / total_count * 100%`
2. **差评率**: `bad_count / total_count * 100%`
3. **反馈率**: 提供详细反馈的比例
4. **响应时间**: API调用耗时
5. **错误率**: 失败请求占比

### 查询示例

```sql
-- 查询会话满意度
SELECT 
  session_id,
  feedback_good_count,
  feedback_bad_count,
  feedback_total_count,
  satisfaction_rate
FROM chat_sessions
WHERE feedback_total_count > 0
ORDER BY satisfaction_rate DESC;

-- 查询差评反馈
SELECT 
  user_id,
  message_content,
  feedback_text,
  created_at
FROM chat_feedbacks
WHERE rating = 'bad' AND feedback_text IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2025-10-20 | 初始版本，支持基础评分功能 |

---

## 相关文档

- [stress-chat API文档](./stress-chat.md)
- [chat_feedbacks表设计](../database/schema-chat.md)
- [前端集成指南](../frontend/chat-integration.md)

---

**维护者**: 翎心CraneHeart团队  
**更新日期**: 2025-10-20

