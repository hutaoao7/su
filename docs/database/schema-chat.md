# AI对话相关表设计文档

## 文档信息
- **创建日期**: 2025-10-18
- **版本**: v1.0.0
- **维护人**: 后端开发团队

## 表结构清单

### 1. chat_sessions - 聊天会话表

#### 表说明
存储用户与AI的对话会话信息。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| session_title | varchar | 200 | 否 | null | 会话标题（自动生成或用户编辑） |
| session_type | varchar | 50 | 否 | 'general' | 会话类型（general/crisis/cbt） |
| ai_model | varchar | 50 | 否 | 'gpt-3.5-turbo' | 使用的AI模型 |
| ai_personality | varchar | 50 | 否 | 'empathetic' | AI人格设置 |
| message_count | int | - | 否 | 0 | 消息数量 |
| total_tokens | int | - | 否 | 0 | 总token消耗 |
| status | varchar | 20 | 否 | 'active' | 会话状态（active/archived/deleted） |
| started_at | timestamptz | - | 是 | now() | 开始时间 |
| last_message_at | timestamptz | - | 否 | now() | 最后消息时间 |
| ended_at | timestamptz | - | 否 | null | 结束时间 |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 普通索引
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

-- 复合索引（用于查询用户的活跃会话）
CREATE INDEX idx_chat_sessions_user_status ON chat_sessions(user_id, status, last_message_at DESC);
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE chat_sessions 
ADD CONSTRAINT fk_chat_sessions_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 检查约束
ALTER TABLE chat_sessions 
ADD CONSTRAINT check_session_type 
CHECK (session_type IN ('general', 'crisis', 'cbt'));

ALTER TABLE chat_sessions 
ADD CONSTRAINT check_status 
CHECK (status IN ('active', 'archived', 'deleted'));

ALTER TABLE chat_sessions 
ADD CONSTRAINT check_message_count 
CHECK (message_count >= 0);

ALTER TABLE chat_sessions 
ADD CONSTRAINT check_total_tokens 
CHECK (total_tokens >= 0);
```

---

### 2. chat_messages - 聊天消息表

#### 表说明
存储会话中的每条消息内容。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| session_id | uuid | - | 是 | - | 会话ID（外键） |
| user_id | uuid | - | 是 | - | 用户ID（冗余，便于查询） |
| role | varchar | 20 | 是 | - | 角色（user/assistant/system） |
| content | text | - | 是 | - | 消息内容 |
| content_encrypted | text | - | 否 | null | 加密内容（敏感对话） |
| tokens_used | int | - | 否 | 0 | 本条消息token消耗 |
| model | varchar | 50 | 否 | null | 使用的模型（仅AI消息） |
| temperature | decimal | 3,2 | 否 | null | 温度参数（仅AI消息） |
| is_sensitive | boolean | - | 否 | false | 是否包含敏感内容 |
| is_crisis | boolean | - | 否 | false | 是否触发危机干预 |
| sentiment_score | decimal | 3,2 | 否 | null | 情感分数（-1到1） |
| status | varchar | 20 | 否 | 'sent' | 消息状态（sent/recalled/deleted） |
| recalled_at | timestamptz | - | 否 | null | 撤回时间 |
| created_at | timestamptz | - | 是 | now() | 发送时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 普通索引
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_is_crisis ON chat_messages(is_crisis) WHERE is_crisis = true;

-- 复合索引（用于查询会话的消息列表）
CREATE INDEX idx_chat_messages_session_created ON chat_messages(session_id, created_at ASC);

-- 全文搜索索引（用于搜索聊天记录）
CREATE INDEX idx_chat_messages_content_fts ON chat_messages USING GIN (to_tsvector('chinese', content));
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_session_id 
FOREIGN KEY (session_id) 
REFERENCES chat_sessions(id) 
ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 检查约束
ALTER TABLE chat_messages 
ADD CONSTRAINT check_role 
CHECK (role IN ('user', 'assistant', 'system'));

ALTER TABLE chat_messages 
ADD CONSTRAINT check_status 
CHECK (status IN ('sent', 'recalled', 'deleted'));

ALTER TABLE chat_messages 
ADD CONSTRAINT check_tokens_used 
CHECK (tokens_used >= 0);

ALTER TABLE chat_messages 
ADD CONSTRAINT check_sentiment_score 
CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1));
```

#### 分区策略

```sql
-- 按月分区（处理大量消息数据）
CREATE TABLE chat_messages (
  id uuid DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  -- ...其他字段
  created_at timestamptz DEFAULT now()
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE chat_messages_2025_10 PARTITION OF chat_messages
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE chat_messages_2025_11 PARTITION OF chat_messages
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

---

### 3. chat_feedbacks - 聊天反馈表

#### 表说明
存储用户对AI回复的评价和反馈。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| message_id | uuid | - | 是 | - | 消息ID（外键） |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| rating | smallint | - | 否 | null | 评分（1-5星） |
| feedback_type | varchar | 50 | 否 | null | 反馈类型（helpful/unhelpful/inappropriate） |
| feedback_text | text | - | 否 | null | 文字反馈 |
| improvement_tags | jsonb | - | 否 | '[]'::jsonb | 改进标签（JSON数组） |
| created_at | timestamptz | - | 是 | now() | 反馈时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 唯一索引（一条消息只能有一个反馈）
CREATE UNIQUE INDEX idx_chat_feedbacks_message_id ON chat_feedbacks(message_id);

-- 普通索引
CREATE INDEX idx_chat_feedbacks_user_id ON chat_feedbacks(user_id);
CREATE INDEX idx_chat_feedbacks_rating ON chat_feedbacks(rating);
CREATE INDEX idx_chat_feedbacks_feedback_type ON chat_feedbacks(feedback_type);
CREATE INDEX idx_chat_feedbacks_created_at ON chat_feedbacks(created_at DESC);
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE chat_feedbacks 
ADD CONSTRAINT fk_chat_feedbacks_message_id 
FOREIGN KEY (message_id) 
REFERENCES chat_messages(id) 
ON DELETE CASCADE;

ALTER TABLE chat_feedbacks 
ADD CONSTRAINT fk_chat_feedbacks_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 检查约束
ALTER TABLE chat_feedbacks 
ADD CONSTRAINT check_rating 
CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

ALTER TABLE chat_feedbacks 
ADD CONSTRAINT check_feedback_type 
CHECK (feedback_type IN ('helpful', 'unhelpful', 'inappropriate'));
```

---

### 4. ai_usage_stats - AI使用统计表

#### 表说明
记录AI服务的使用量和成本统计。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| date | date | - | 是 | - | 统计日期 |
| model | varchar | 50 | 是 | - | AI模型 |
| total_requests | int | - | 否 | 0 | 总请求数 |
| successful_requests | int | - | 否 | 0 | 成功请求数 |
| failed_requests | int | - | 否 | 0 | 失败请求数 |
| total_tokens | int | - | 否 | 0 | 总token消耗 |
| prompt_tokens | int | - | 否 | 0 | prompt token |
| completion_tokens | int | - | 否 | 0 | completion token |
| estimated_cost | decimal | 10,4 | 否 | 0 | 预估成本（美元） |
| avg_response_time | decimal | 10,2 | 否 | null | 平均响应时间（毫秒） |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 唯一索引（每个用户每天每个模型只有一条统计记录）
CREATE UNIQUE INDEX idx_ai_usage_stats_unique ON ai_usage_stats(user_id, date, model);

-- 普通索引
CREATE INDEX idx_ai_usage_stats_user_id ON ai_usage_stats(user_id);
CREATE INDEX idx_ai_usage_stats_date ON ai_usage_stats(date DESC);
CREATE INDEX idx_ai_usage_stats_model ON ai_usage_stats(model);
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE ai_usage_stats 
ADD CONSTRAINT fk_ai_usage_stats_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 检查约束
ALTER TABLE ai_usage_stats 
ADD CONSTRAINT check_request_counts 
CHECK (total_requests >= 0 AND successful_requests >= 0 AND failed_requests >= 0);

ALTER TABLE ai_usage_stats 
ADD CONSTRAINT check_token_counts 
CHECK (total_tokens >= 0 AND prompt_tokens >= 0 AND completion_tokens >= 0);

ALTER TABLE ai_usage_stats 
ADD CONSTRAINT check_estimated_cost 
CHECK (estimated_cost >= 0);
```

---

## 数据迁移脚本

```sql
-- 1. 创建chat_sessions表
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  session_title varchar(200),
  session_type varchar(50) DEFAULT 'general',
  ai_model varchar(50) DEFAULT 'gpt-3.5-turbo',
  ai_personality varchar(50) DEFAULT 'empathetic',
  message_count int DEFAULT 0,
  total_tokens int DEFAULT 0,
  status varchar(20) DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_chat_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_session_type CHECK (session_type IN ('general', 'crisis', 'cbt')),
  CONSTRAINT check_status CHECK (status IN ('active', 'archived', 'deleted')),
  CONSTRAINT check_message_count CHECK (message_count >= 0),
  CONSTRAINT check_total_tokens CHECK (total_tokens >= 0)
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);
CREATE INDEX idx_chat_sessions_user_status ON chat_sessions(user_id, status, last_message_at DESC);

-- 2. 创建chat_messages表（带分区）
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role varchar(20) NOT NULL,
  content text NOT NULL,
  content_encrypted text,
  tokens_used int DEFAULT 0,
  model varchar(50),
  temperature decimal(3,2),
  is_sensitive boolean DEFAULT false,
  is_crisis boolean DEFAULT false,
  sentiment_score decimal(3,2),
  status varchar(20) DEFAULT 'sent',
  recalled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_chat_messages_session_id FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_messages_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_role CHECK (role IN ('user', 'assistant', 'system')),
  CONSTRAINT check_status CHECK (status IN ('sent', 'recalled', 'deleted')),
  CONSTRAINT check_tokens_used CHECK (tokens_used >= 0),
  CONSTRAINT check_sentiment_score CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1))
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE chat_messages_2025_10 PARTITION OF chat_messages
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE chat_messages_2025_11 PARTITION OF chat_messages
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE chat_messages_2025_12 PARTITION OF chat_messages
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- 创建索引
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_is_crisis ON chat_messages(is_crisis) WHERE is_crisis = true;
CREATE INDEX idx_chat_messages_session_created ON chat_messages(session_id, created_at ASC);
CREATE INDEX idx_chat_messages_content_fts ON chat_messages USING GIN (to_tsvector('chinese', content));

-- 3. 创建chat_feedbacks表
CREATE TABLE IF NOT EXISTS chat_feedbacks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating smallint,
  feedback_type varchar(50),
  feedback_text text,
  improvement_tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_chat_feedbacks_message_id FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_feedbacks_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  CONSTRAINT check_feedback_type CHECK (feedback_type IN ('helpful', 'unhelpful', 'inappropriate'))
);

CREATE UNIQUE INDEX idx_chat_feedbacks_message_id ON chat_feedbacks(message_id);
CREATE INDEX idx_chat_feedbacks_user_id ON chat_feedbacks(user_id);
CREATE INDEX idx_chat_feedbacks_rating ON chat_feedbacks(rating);
CREATE INDEX idx_chat_feedbacks_feedback_type ON chat_feedbacks(feedback_type);
CREATE INDEX idx_chat_feedbacks_created_at ON chat_feedbacks(created_at DESC);

-- 4. 创建ai_usage_stats表
CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  model varchar(50) NOT NULL,
  total_requests int DEFAULT 0,
  successful_requests int DEFAULT 0,
  failed_requests int DEFAULT 0,
  total_tokens int DEFAULT 0,
  prompt_tokens int DEFAULT 0,
  completion_tokens int DEFAULT 0,
  estimated_cost decimal(10,4) DEFAULT 0,
  avg_response_time decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_ai_usage_stats_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_request_counts CHECK (total_requests >= 0 AND successful_requests >= 0 AND failed_requests >= 0),
  CONSTRAINT check_token_counts CHECK (total_tokens >= 0 AND prompt_tokens >= 0 AND completion_tokens >= 0),
  CONSTRAINT check_estimated_cost CHECK (estimated_cost >= 0)
);

CREATE UNIQUE INDEX idx_ai_usage_stats_unique ON ai_usage_stats(user_id, date, model);
CREATE INDEX idx_ai_usage_stats_user_id ON ai_usage_stats(user_id);
CREATE INDEX idx_ai_usage_stats_date ON ai_usage_stats(date DESC);
CREATE INDEX idx_ai_usage_stats_model ON ai_usage_stats(model);
```

---

## 触发器

### 自动更新会话统计

```sql
-- 当添加新消息时，更新会话的消息计数和最后消息时间
CREATE OR REPLACE FUNCTION update_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions 
  SET 
    message_count = message_count + 1,
    total_tokens = total_tokens + COALESCE(NEW.tokens_used, 0),
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_stats
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_session_stats();
```

### 自动更新AI使用统计

```sql
-- 当AI消息创建时，更新使用统计
CREATE OR REPLACE FUNCTION update_ai_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 仅对AI消息（assistant角色）进行统计
  IF NEW.role = 'assistant' THEN
    INSERT INTO ai_usage_stats (user_id, date, model, total_requests, successful_requests, total_tokens, completion_tokens)
    VALUES (
      NEW.user_id,
      CURRENT_DATE,
      COALESCE(NEW.model, 'gpt-3.5-turbo'),
      1,
      1,
      COALESCE(NEW.tokens_used, 0),
      COALESCE(NEW.tokens_used, 0)
    )
    ON CONFLICT (user_id, date, model)
    DO UPDATE SET
      total_requests = ai_usage_stats.total_requests + 1,
      successful_requests = ai_usage_stats.successful_requests + 1,
      total_tokens = ai_usage_stats.total_tokens + COALESCE(EXCLUDED.total_tokens, 0),
      completion_tokens = ai_usage_stats.completion_tokens + COALESCE(EXCLUDED.completion_tokens, 0),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_stats
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_ai_usage_stats();
```

---

## 数据清理策略

### 1. 归档旧聊天记录

```sql
-- 归档6个月前的聊天消息
CREATE TABLE chat_messages_archive (LIKE chat_messages INCLUDING ALL);

-- 移动旧数据
WITH archived_messages AS (
  DELETE FROM chat_messages 
  WHERE created_at < now() - interval '6 months'
  RETURNING *
)
INSERT INTO chat_messages_archive 
SELECT * FROM archived_messages;
```

### 2. 清理已删除的会话

```sql
-- 永久删除30天前标记为deleted的会话
DELETE FROM chat_sessions 
WHERE status = 'deleted' 
AND updated_at < now() - interval '30 days';
```

### 3. 清理撤回消息

```sql
-- 永久删除7天前撤回的消息内容（保留记录）
UPDATE chat_messages 
SET content = '[已撤回]',
    content_encrypted = null
WHERE status = 'recalled' 
AND recalled_at < now() - interval '7 days';
```

---

## 统计查询示例

### 1. 用户AI使用情况

```sql
SELECT 
  u.id,
  u.nickname,
  COUNT(DISTINCT cs.id) as total_sessions,
  COUNT(DISTINCT cs.id) FILTER (WHERE cs.status = 'active') as active_sessions,
  SUM(cs.message_count) as total_messages,
  SUM(cs.total_tokens) as total_tokens,
  AVG(EXTRACT(EPOCH FROM (cs.ended_at - cs.started_at))) FILTER (WHERE cs.ended_at IS NOT NULL) as avg_session_duration
FROM users u
LEFT JOIN chat_sessions cs ON cs.user_id = u.id
GROUP BY u.id, u.nickname
ORDER BY total_messages DESC;
```

### 2. 危机干预触发统计

```sql
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as crisis_count,
  COUNT(DISTINCT user_id) as affected_users
FROM chat_messages
WHERE is_crisis = true
AND created_at >= now() - interval '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;
```

### 3. AI回复质量分析

```sql
SELECT 
  cm.model,
  COUNT(cf.id) as feedback_count,
  AVG(cf.rating) as avg_rating,
  COUNT(*) FILTER (WHERE cf.feedback_type = 'helpful') as helpful_count,
  COUNT(*) FILTER (WHERE cf.feedback_type = 'unhelpful') as unhelpful_count,
  COUNT(*) FILTER (WHERE cf.feedback_type = 'inappropriate') as inappropriate_count
FROM chat_messages cm
LEFT JOIN chat_feedbacks cf ON cf.message_id = cm.id
WHERE cm.role = 'assistant'
AND cm.created_at >= now() - interval '30 days'
GROUP BY cm.model
ORDER BY avg_rating DESC;
```

### 4. Token使用成本统计

```sql
SELECT 
  DATE_TRUNC('month', date) as month,
  model,
  SUM(total_requests) as total_requests,
  SUM(total_tokens) as total_tokens,
  SUM(estimated_cost) as total_cost,
  AVG(avg_response_time) as avg_response_time
FROM ai_usage_stats
WHERE date >= CURRENT_DATE - interval '6 months'
GROUP BY DATE_TRUNC('month', date), model
ORDER BY month DESC, total_cost DESC;
```

---

## 性能优化建议

### 1. 分区管理
- chat_messages表按月分区，提升查询性能
- 自动创建新分区脚本：

```sql
-- 创建下个月分区（放在定时任务中）
DO $$
DECLARE
  next_month_start date := date_trunc('month', current_date + interval '1 month');
  next_month_end date := date_trunc('month', current_date + interval '2 months');
  partition_name text := 'chat_messages_' || to_char(next_month_start, 'YYYY_MM');
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF chat_messages FOR VALUES FROM (%L) TO (%L)',
    partition_name, next_month_start, next_month_end
  );
END $$;
```

### 2. 索引优化
- 全文搜索索引加速聊天记录搜索
- GIN索引优化JSONB查询
- 部分索引减少索引大小

### 3. 查询优化
- 使用prepared statements
- 避免查询大量历史消息
- 使用游标分页查询

---

## 安全与隐私

### 1. 数据加密
- 敏感对话内容使用content_encrypted字段加密存储
- 危机干预相关消息特别保护

### 2. 数据脱敏
```sql
-- 查询时脱敏处理
SELECT 
  id,
  session_id,
  role,
  LEFT(content, 50) || '...' as content_preview, -- 只显示前50字
  is_sensitive,
  is_crisis,
  created_at
FROM chat_messages
WHERE user_id = :current_user_id;
```

### 3. 访问控制
- 用户只能访问自己的聊天记录
- 管理员可查看统计数据，但不可见具体对话内容
- 危机干预记录需要特殊权限访问

### 4. 数据保留策略
- 普通聊天记录保留6个月
- 危机干预记录保留2年（符合医疗记录保留要求）
- 用户可申请删除所有聊天记录

---

## 数据导出格式

### 用户聊天记录导出（JSON）

```json
{
  "user_id": "xxx-xxx-xxx",
  "export_date": "2025-10-18T12:00:00Z",
  "sessions": [
    {
      "session_id": "xxx",
      "started_at": "2025-10-15T10:00:00Z",
      "messages": [
        {
          "role": "user",
          "content": "我最近压力很大",
          "created_at": "2025-10-15T10:01:00Z"
        },
        {
          "role": "assistant",
          "content": "我理解您的感受...",
          "created_at": "2025-10-15T10:01:05Z"
        }
      ]
    }
  ]
}
```

---

## 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-18 | 初始版本，包含4个核心表 | 开发团队 |

---

**维护说明**: 
- 每月初自动创建下个月的分区
- 定期检查分区性能
- 及时归档旧数据释放存储空间

