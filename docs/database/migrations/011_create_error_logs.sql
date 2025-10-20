/**
 * 错误日志表迁移脚本
 * 
 * 创建日期: 2025-10-21
 * 用途: 记录客户端错误日志
 */

-- ============================================
-- 表: error_logs (错误日志表)
-- ============================================
CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  
  -- 错误基本信息
  error_id VARCHAR(100) UNIQUE NOT NULL,           -- 错误ID
  error_type VARCHAR(50) NOT NULL,                 -- 错误类型 (vue_error/promise_rejection/js_error/api_error)
  error_level VARCHAR(20) NOT NULL,                -- 错误级别 (debug/info/warning/error/fatal)
  error_message TEXT NOT NULL,                      -- 错误消息
  error_stack TEXT,                                 -- 错误堆栈
  fingerprint VARCHAR(255) NOT NULL,               -- 错误指纹（用于去重和聚合）
  
  -- 上下文信息
  page VARCHAR(255),                                -- 发生错误的页面
  route JSONB,                                      -- 路由信息
  platform VARCHAR(50),                             -- 平台 (H5/WeChat/App)
  system_info JSONB,                                -- 系统信息
  user_agent TEXT,                                  -- User Agent
  
  -- 操作轨迹
  breadcrumbs JSONB,                                -- 用户操作轨迹
  
  -- 额外上下文
  context JSONB,                                    -- 其他上下文信息
  
  -- 客户端信息
  client_ip VARCHAR(50),                            -- 客户端IP
  client_ua TEXT,                                   -- 客户端UA
  
  -- 时间戳
  error_timestamp BIGINT NOT NULL,                  -- 错误发生时间戳
  report_timestamp BIGINT NOT NULL,                 -- 上报时间戳
  created_at TIMESTAMP DEFAULT NOW(),               -- 记录创建时间
  
  -- 处理状态
  status VARCHAR(20) DEFAULT 'pending',             -- 处理状态 (pending/processed/ignored)
  processed_at TIMESTAMP,                           -- 处理时间
  processed_by VARCHAR(100),                        -- 处理人
  notes TEXT                                        -- 处理备注
);

-- 索引
CREATE INDEX idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_level ON error_logs(error_level);
CREATE INDEX idx_error_logs_platform ON error_logs(platform);
CREATE INDEX idx_error_logs_page ON error_logs(page);
CREATE INDEX idx_error_logs_timestamp ON error_logs(error_timestamp DESC);
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_status ON error_logs(status);

-- 表注释
COMMENT ON TABLE error_logs IS '错误日志表';
COMMENT ON COLUMN error_logs.id IS '主键ID';
COMMENT ON COLUMN error_logs.error_id IS '错误唯一ID';
COMMENT ON COLUMN error_logs.error_type IS '错误类型';
COMMENT ON COLUMN error_logs.error_level IS '错误级别';
COMMENT ON COLUMN error_logs.error_message IS '错误消息';
COMMENT ON COLUMN error_logs.error_stack IS '错误堆栈';
COMMENT ON COLUMN error_logs.fingerprint IS '错误指纹（用于去重和聚合）';
COMMENT ON COLUMN error_logs.breadcrumbs IS '用户操作轨迹JSON';
COMMENT ON COLUMN error_logs.status IS '处理状态';

-- ============================================
-- 错误统计视图
-- ============================================
CREATE OR REPLACE VIEW v_error_stats AS
SELECT 
  error_type,
  error_level,
  platform,
  COUNT(*) as total_count,
  COUNT(DISTINCT fingerprint) as unique_count,
  MAX(created_at) as last_occurred,
  MIN(created_at) as first_occurred
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY error_type, error_level, platform
ORDER BY total_count DESC;

-- ============================================
-- 高频错误视图
-- ============================================
CREATE OR REPLACE VIEW v_frequent_errors AS
SELECT 
  fingerprint,
  error_message,
  error_type,
  error_level,
  page,
  platform,
  COUNT(*) as occurrence_count,
  MAX(created_at) as last_occurred,
  MIN(created_at) as first_occurred
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY fingerprint, error_message, error_type, error_level, page, platform
HAVING COUNT(*) >= 10
ORDER BY occurrence_count DESC
LIMIT 100;

-- ============================================
-- 自动清理触发器
-- ============================================
-- 自动清理30天前的已处理或忽略的错误日志
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM error_logs
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND status IN ('processed', 'ignored');
  
  RAISE NOTICE 'Cleaned up old error logs';
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务（需要pg_cron扩展）
-- SELECT cron.schedule('cleanup-error-logs', '0 2 * * *', 'SELECT cleanup_old_error_logs()');

-- ============================================
-- 示例查询
-- ============================================

-- 1. 查询最近24小时的错误统计
-- SELECT * FROM v_error_stats;

-- 2. 查询高频错误
-- SELECT * FROM v_frequent_errors;

-- 3. 查询特定页面的错误
-- SELECT error_message, error_level, COUNT(*) as count
-- FROM error_logs
-- WHERE page = '/pages/home/home'
--   AND created_at >= NOW() - INTERVAL '24 hours'
-- GROUP BY error_message, error_level
-- ORDER BY count DESC;

-- 4. 查询致命错误
-- SELECT *
-- FROM error_logs
-- WHERE error_level = 'fatal'
--   AND created_at >= NOW() - INTERVAL '7 days'
-- ORDER BY created_at DESC;

-- 5. 查询特定指纹的错误详情
-- SELECT *
-- FROM error_logs
-- WHERE fingerprint = 'xxx'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- 6. 错误趋势分析（按小时统计）
-- SELECT 
--   DATE_TRUNC('hour', created_at) as hour,
--   error_level,
--   COUNT(*) as count
-- FROM error_logs
-- WHERE created_at >= NOW() - INTERVAL '24 hours'
-- GROUP BY hour, error_level
-- ORDER BY hour DESC;

-- ============================================
-- 权限设置
-- ============================================
-- GRANT SELECT, INSERT ON error_logs TO app_user;
-- GRANT SELECT ON v_error_stats TO app_user;
-- GRANT SELECT ON v_frequent_errors TO app_user;

