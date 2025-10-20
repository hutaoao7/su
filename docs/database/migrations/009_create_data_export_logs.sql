/**
 * 数据导出日志表迁移脚本
 * 
 * 说明：
 * - 记录用户数据导出历史
 * - 支持GDPR数据携带权要求
 * - 30天自动清理过期记录
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

-- ============================================
-- 1. data_export_logs表（数据导出日志）
-- ============================================

CREATE TABLE IF NOT EXISTS data_export_logs (
  -- 主键
  id BIGSERIAL PRIMARY KEY,
  
  -- 关联用户
  user_id BIGINT NOT NULL,
  
  -- 导出数据类型（JSON数组）
  -- 例如: ["profile", "assessments", "chats"]
  data_types JSONB NOT NULL,
  
  -- 导出格式
  format VARCHAR(20) NOT NULL CHECK (format IN ('json', 'csv', 'pdf')),
  
  -- 是否加密
  encrypted BOOLEAN DEFAULT FALSE,
  
  -- 数据大小（字节）
  data_size BIGINT DEFAULT 0,
  
  -- 导出状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- 文件路径（如果导出到云存储）
  file_path TEXT,
  
  -- 下载链接（临时链接）
  download_url TEXT,
  
  -- 下载次数
  download_count INT DEFAULT 0,
  
  -- 失败原因
  error_message TEXT,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 过期时间（30天后）
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- 外键约束
  CONSTRAINT fk_data_export_logs_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_data_export_logs_user_id ON data_export_logs(user_id);
CREATE INDEX idx_data_export_logs_status ON data_export_logs(status);
CREATE INDEX idx_data_export_logs_created_at ON data_export_logs(created_at DESC);
CREATE INDEX idx_data_export_logs_expires_at ON data_export_logs(expires_at);

-- 创建复合索引（用户ID + 创建时间）
CREATE INDEX idx_data_export_logs_user_created ON data_export_logs(user_id, created_at DESC);

-- 添加表注释
COMMENT ON TABLE data_export_logs IS '数据导出日志表';
COMMENT ON COLUMN data_export_logs.id IS '导出记录ID';
COMMENT ON COLUMN data_export_logs.user_id IS '用户ID';
COMMENT ON COLUMN data_export_logs.data_types IS '导出的数据类型列表';
COMMENT ON COLUMN data_export_logs.format IS '导出格式（json/csv/pdf）';
COMMENT ON COLUMN data_export_logs.encrypted IS '是否加密导出';
COMMENT ON COLUMN data_export_logs.data_size IS '导出数据大小（字节）';
COMMENT ON COLUMN data_export_logs.status IS '导出状态';
COMMENT ON COLUMN data_export_logs.file_path IS '文件路径';
COMMENT ON COLUMN data_export_logs.download_url IS '下载链接（临时）';
COMMENT ON COLUMN data_export_logs.download_count IS '下载次数';
COMMENT ON COLUMN data_export_logs.error_message IS '失败原因';
COMMENT ON COLUMN data_export_logs.created_at IS '创建时间';
COMMENT ON COLUMN data_export_logs.updated_at IS '更新时间';
COMMENT ON COLUMN data_export_logs.expires_at IS '过期时间';

-- ============================================
-- 2. 触发器：自动更新updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_data_export_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_data_export_logs_updated_at
BEFORE UPDATE ON data_export_logs
FOR EACH ROW
EXECUTE FUNCTION update_data_export_logs_updated_at();

-- ============================================
-- 3. 定时清理过期记录（可选）
-- ============================================

-- 创建清理函数
CREATE OR REPLACE FUNCTION cleanup_expired_data_exports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 删除已过期的记录
  DELETE FROM data_export_logs
  WHERE expires_at < CURRENT_TIMESTAMP
    AND status IN ('completed', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- 记录清理日志
  RAISE NOTICE '清理了 % 条过期的数据导出记录', deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION cleanup_expired_data_exports() IS '清理过期的数据导出记录';

-- ============================================
-- 4. 示例数据（开发环境）
-- ============================================

-- 仅在开发环境执行
-- INSERT INTO data_export_logs (user_id, data_types, format, encrypted, data_size, status, created_at, expires_at)
-- VALUES 
--   (1, '["profile", "assessments"]'::jsonb, 'json', false, 102400, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'),
--   (1, '["all"]'::jsonb, 'csv', true, 512000, 'completed', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '23 days'),
--   (2, '["chats", "music"]'::jsonb, 'json', false, 204800, 'completed', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '29 days');

-- ============================================
-- 5. 查询示例
-- ============================================

-- 查询用户的导出历史
-- SELECT 
--   id,
--   data_types,
--   format,
--   encrypted,
--   data_size,
--   status,
--   created_at,
--   expires_at
-- FROM data_export_logs
-- WHERE user_id = 1
-- ORDER BY created_at DESC
-- LIMIT 10;

-- 查询导出成功的记录数量
-- SELECT 
--   user_id,
--   COUNT(*) as export_count,
--   SUM(data_size) as total_size
-- FROM data_export_logs
-- WHERE status = 'completed'
-- GROUP BY user_id;

-- 查询即将过期的导出记录（7天内）
-- SELECT 
--   id,
--   user_id,
--   format,
--   expires_at
-- FROM data_export_logs
-- WHERE expires_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days'
--   AND status = 'completed'
-- ORDER BY expires_at ASC;

-- ============================================
-- 6. 性能优化建议
-- ============================================

-- 1. 定期清理过期记录（建议每天凌晨执行）
-- SELECT cleanup_expired_data_exports();

-- 2. 分区表优化（如果数据量很大）
-- CREATE TABLE data_export_logs_y2025m01 PARTITION OF data_export_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 3. 索引维护
-- REINDEX TABLE data_export_logs;

-- 4. 统计信息更新
-- ANALYZE data_export_logs;

-- ============================================
-- 7. 回滚脚本（仅在需要时执行）
-- ============================================

-- DROP TRIGGER IF EXISTS trigger_update_data_export_logs_updated_at ON data_export_logs;
-- DROP FUNCTION IF EXISTS update_data_export_logs_updated_at();
-- DROP FUNCTION IF EXISTS cleanup_expired_data_exports();
-- DROP TABLE IF EXISTS data_export_logs CASCADE;

