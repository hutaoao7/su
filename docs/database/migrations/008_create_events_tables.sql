-- ============================================================================
-- 数据库迁移脚本：事件埋点相关表
-- 版本：v1.0.0
-- 创建日期：2025-10-18
-- 描述：创建events、user_behaviors、error_logs表（带分区）
-- ============================================================================

-- ============================================================================
-- 1. 创建events表（事件埋点，按月分区）
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT uuid_generate_v4(),
  user_id uuid,
  session_id varchar(100),
  event_name varchar(100) NOT NULL,
  event_data jsonb,
  page_path varchar(255),
  referrer varchar(255),
  device_info jsonb,
  ip_address inet,
  timestamp bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE events IS '事件埋点表（月度分区）';
COMMENT ON COLUMN events.event_name IS '事件名称（page_view/click/login等）';

-- 创建月度分区
CREATE TABLE IF NOT EXISTS events_2025_10 PARTITION OF events
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS events_2025_11 PARTITION OF events
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS events_2025_12 PARTITION OF events
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS events_2026_01 PARTITION OF events
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_page_path ON events(page_path);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_data ON events USING GIN (event_data);

-- ============================================================================
-- 2. 创建user_behaviors表（用户行为路径）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_behaviors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  session_id varchar(100) NOT NULL,
  behavior_path jsonb NOT NULL,
  page_sequence jsonb NOT NULL,
  total_duration int,
  page_count int,
  event_count int,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_user_behaviors_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_behaviors IS '用户行为路径表';
COMMENT ON COLUMN user_behaviors.behavior_path IS '行为路径（JSON数组）';
COMMENT ON COLUMN user_behaviors.page_sequence IS '页面序列（JSON数组）';

CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_session_id ON user_behaviors(session_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_created_at ON user_behaviors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_behavior_path ON user_behaviors USING GIN (behavior_path);

-- ============================================================================
-- 3. 创建error_logs表（错误日志，按月分区）
-- ============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid DEFAULT uuid_generate_v4(),
  user_id uuid,
  error_type varchar(50) NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  page_path varchar(255),
  user_agent jsonb,
  device_info jsonb,
  operation_trace jsonb,
  severity varchar(20) DEFAULT 'error',
  is_handled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (id, created_at),
  CONSTRAINT check_error_logs_severity CHECK (severity IN ('error', 'warning', 'fatal'))
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE error_logs IS '错误日志表（月度分区）';
COMMENT ON COLUMN error_logs.operation_trace IS '用户操作轨迹';
COMMENT ON COLUMN error_logs.severity IS '严重程度（error/warning/fatal）';

-- 创建月度分区
CREATE TABLE IF NOT EXISTS error_logs_2025_10 PARTITION OF error_logs
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS error_logs_2025_11 PARTITION OF error_logs
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS error_logs_2025_12 PARTITION OF error_logs
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_is_handled ON error_logs(is_handled);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- ============================================================================
-- 验证数据
-- ============================================================================

SELECT '✅ 事件埋点相关表迁移完成' as status;


