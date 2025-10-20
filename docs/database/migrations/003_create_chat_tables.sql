-- ============================================================================
-- 数据库迁移脚本：AI对话相关表
-- 版本：v1.0.0
-- 创建日期：2025-10-18
-- 描述：创建chat_sessions、chat_messages、chat_feedbacks、ai_usage_stats表
-- ============================================================================

-- ============================================================================
-- 1. 创建chat_sessions表（聊天会话）
-- ============================================================================

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
  CONSTRAINT check_chat_sessions_session_type CHECK (session_type IN ('general', 'crisis', 'cbt')),
  CONSTRAINT check_chat_sessions_status CHECK (status IN ('active', 'archived', 'deleted')),
  CONSTRAINT check_chat_sessions_message_count CHECK (message_count >= 0),
  CONSTRAINT check_chat_sessions_total_tokens CHECK (total_tokens >= 0)
);

COMMENT ON TABLE chat_sessions IS '聊天会话表';
COMMENT ON COLUMN chat_sessions.ai_personality IS 'AI人格（empathetic/professional/humorous）';

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_status ON chat_sessions(user_id, status, last_message_at DESC);

-- ============================================================================
-- 2. 创建chat_messages表（带分区）
-- ============================================================================

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
  CONSTRAINT check_chat_messages_role CHECK (role IN ('user', 'assistant', 'system')),
  CONSTRAINT check_chat_messages_status CHECK (status IN ('sent', 'recalled', 'deleted')),
  CONSTRAINT check_chat_messages_tokens_used CHECK (tokens_used >= 0),
  CONSTRAINT check_chat_messages_sentiment_score CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1))
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE chat_messages IS '聊天消息表（月度分区）';

-- 创建月度分区
CREATE TABLE IF NOT EXISTS chat_messages_2025_10 PARTITION OF chat_messages
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS chat_messages_2025_11 PARTITION OF chat_messages
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS chat_messages_2025_12 PARTITION OF chat_messages
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS chat_messages_2026_01 PARTITION OF chat_messages
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_crisis ON chat_messages(is_crisis) WHERE is_crisis = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_fts ON chat_messages USING GIN (to_tsvector('chinese', content));

-- ============================================================================
-- 3. 创建chat_feedbacks表（用户反馈）
-- ============================================================================

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
  CONSTRAINT check_chat_feedbacks_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  CONSTRAINT check_chat_feedbacks_feedback_type CHECK (feedback_type IN ('helpful', 'unhelpful', 'inappropriate'))
);

COMMENT ON TABLE chat_feedbacks IS '聊天反馈表';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_feedbacks_message_id ON chat_feedbacks(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_feedbacks_user_id ON chat_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_feedbacks_rating ON chat_feedbacks(rating);
CREATE INDEX IF NOT EXISTS idx_chat_feedbacks_feedback_type ON chat_feedbacks(feedback_type);
CREATE INDEX IF NOT EXISTS idx_chat_feedbacks_created_at ON chat_feedbacks(created_at DESC);

-- ============================================================================
-- 4. 创建ai_usage_stats表（使用统计）
-- ============================================================================

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
  CONSTRAINT check_ai_usage_stats_request_counts CHECK (total_requests >= 0 AND successful_requests >= 0 AND failed_requests >= 0),
  CONSTRAINT check_ai_usage_stats_token_counts CHECK (total_tokens >= 0 AND prompt_tokens >= 0 AND completion_tokens >= 0),
  CONSTRAINT check_ai_usage_stats_estimated_cost CHECK (estimated_cost >= 0)
);

COMMENT ON TABLE ai_usage_stats IS 'AI使用统计表';

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_stats_unique ON ai_usage_stats(user_id, date, model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_user_id ON ai_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_date ON ai_usage_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_model ON ai_usage_stats(model);

-- ============================================================================
-- 创建触发器：自动更新会话统计
-- ============================================================================

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

DROP TRIGGER IF EXISTS trigger_update_session_stats ON chat_messages;
CREATE TRIGGER trigger_update_session_stats
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_session_stats();

-- ============================================================================
-- 验证数据
-- ============================================================================

SELECT '✅ AI对话相关表迁移完成' as status;


