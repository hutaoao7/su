-- ============================================================================
-- 数据导出日志表迁移脚本
-- 版本: v1.0
-- 创建日期: 2025-10-20
-- 描述: 记录用户数据导出历史和审计日志
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 数据导出日志表 (data_export_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_export_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_format VARCHAR(10) NOT NULL CHECK (export_format IN ('JSON', 'CSV', 'PDF')),
    export_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (export_status IN ('pending', 'processing', 'completed', 'failed')),
    file_size INTEGER, -- 文件大小（字节）
    file_path TEXT, -- 文件路径或下载链接
    data_items JSONB, -- 导出的数据项统计
    error_message TEXT, -- 错误信息（如果失败）
    ip_address INET, -- 请求IP地址
    user_agent TEXT, -- 用户代理
    export_reason TEXT, -- 导出原因（可选）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- 文件过期时间（7天后）
    CONSTRAINT valid_file_size CHECK (file_size IS NULL OR file_size > 0)
);

-- 创建索引
CREATE INDEX idx_data_export_logs_user_id ON data_export_logs(user_id);
CREATE INDEX idx_data_export_logs_created_at ON data_export_logs(created_at DESC);
CREATE INDEX idx_data_export_logs_status ON data_export_logs(export_status);
CREATE INDEX idx_data_export_logs_expires_at ON data_export_logs(expires_at) WHERE export_status = 'completed';

-- 添加注释
COMMENT ON TABLE data_export_logs IS '数据导出日志表 - 记录用户数据导出历史';
COMMENT ON COLUMN data_export_logs.id IS '导出记录ID';
COMMENT ON COLUMN data_export_logs.user_id IS '用户ID';
COMMENT ON COLUMN data_export_logs.export_format IS '导出格式: JSON/CSV/PDF';
COMMENT ON COLUMN data_export_logs.export_status IS '导出状态: pending/processing/completed/failed';
COMMENT ON COLUMN data_export_logs.file_size IS '文件大小（字节）';
COMMENT ON COLUMN data_export_logs.file_path IS '文件路径或下载链接';
COMMENT ON COLUMN data_export_logs.data_items IS '导出的数据项统计（JSON格式）';
COMMENT ON COLUMN data_export_logs.error_message IS '错误信息';
COMMENT ON COLUMN data_export_logs.ip_address IS '请求IP地址';
COMMENT ON COLUMN data_export_logs.user_agent IS '用户代理';
COMMENT ON COLUMN data_export_logs.export_reason IS '导出原因';
COMMENT ON COLUMN data_export_logs.created_at IS '创建时间';
COMMENT ON COLUMN data_export_logs.completed_at IS '完成时间';
COMMENT ON COLUMN data_export_logs.expires_at IS '文件过期时间（通常为7天后）';

-- ----------------------------------------------------------------------------
-- 2. 插入示例数据（测试用）
-- ----------------------------------------------------------------------------
-- 注意：生产环境不需要执行此部分

/*
INSERT INTO data_export_logs (user_id, export_format, export_status, file_size, data_items, ip_address) VALUES
(1, 'JSON', 'completed', 1048576, '{"assessments": 10, "chatMessages": 50}', '127.0.0.1'),
(1, 'CSV', 'completed', 524288, '{"assessments": 10}', '127.0.0.1'),
(2, 'PDF', 'failed', NULL, NULL, '127.0.0.1');
*/

-- ----------------------------------------------------------------------------
-- 3. 定时清理过期文件的函数（可选）
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除过期的导出记录（文件已过期超过7天）
    DELETE FROM data_export_logs
    WHERE export_status = 'completed'
      AND expires_at < NOW()
      AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_exports() IS '清理过期的数据导出记录';

-- ----------------------------------------------------------------------------
-- 4. 定时任务（每天执行一次）
-- ----------------------------------------------------------------------------
-- 注意：需要安装 pg_cron 扩展
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

/*
-- 每天凌晨2点执行清理
SELECT cron.schedule('cleanup-expired-exports', '0 2 * * *', $$
    SELECT cleanup_expired_exports();
$$);
*/

-- ----------------------------------------------------------------------------
-- 5. 触发器：自动设置过期时间
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_export_expires_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.export_status = 'completed' AND NEW.expires_at IS NULL THEN
        NEW.expires_at := NEW.completed_at + INTERVAL '7 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_export_expires_at
BEFORE UPDATE ON data_export_logs
FOR EACH ROW
WHEN (NEW.export_status = 'completed')
EXECUTE FUNCTION set_export_expires_at();

COMMENT ON FUNCTION set_export_expires_at() IS '自动设置导出文件过期时间（7天后）';

-- ----------------------------------------------------------------------------
-- 6. 查询视图：用户导出统计
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW user_export_stats AS
SELECT
    user_id,
    COUNT(*) as total_exports,
    COUNT(CASE WHEN export_status = 'completed' THEN 1 END) as successful_exports,
    COUNT(CASE WHEN export_status = 'failed' THEN 1 END) as failed_exports,
    SUM(CASE WHEN export_status = 'completed' THEN file_size ELSE 0 END) as total_bytes_exported,
    MAX(created_at) as last_export_time
FROM data_export_logs
GROUP BY user_id;

COMMENT ON VIEW user_export_stats IS '用户导出统计视图';

-- ============================================================================
-- 迁移完成
-- ============================================================================
-- 验证表创建
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_export_logs') THEN
        RAISE NOTICE '✅ data_export_logs表创建成功';
    ELSE
        RAISE EXCEPTION '❌ data_export_logs表创建失败';
    END IF;
END $$;

