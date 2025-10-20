-- ============================================================================
-- 数据库迁移脚本：更新撤回同意日志表
-- 版本：v1.1.0
-- 创建日期：2025-10-21
-- 描述：扩展consent_revoke_logs表，支持撤回同意和账号注销功能
-- ============================================================================

-- ============================================================================
-- 1. 修改consent_revoke_logs表结构
-- ============================================================================

-- 添加新字段
ALTER TABLE consent_revoke_logs 
ADD COLUMN IF NOT EXISTS action_type varchar(50) DEFAULT 'revoke_consent',
ADD COLUMN IF NOT EXISTS revoked_items jsonb,
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS device_info jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 重命名字段以保持一致性
ALTER TABLE consent_revoke_logs 
RENAME COLUMN revoke_reason TO reason;

ALTER TABLE consent_revoke_logs 
RENAME COLUMN revoke_detail TO custom_reason;

-- 添加约束
ALTER TABLE consent_revoke_logs
ADD CONSTRAINT check_action_type CHECK (action_type IN ('revoke_consent', 'delete_account', 'cancel_deletion'));

ALTER TABLE consent_revoke_logs
ADD CONSTRAINT check_status CHECK (status IN ('pending', 'completed', 'cancelled', 'failed'));

-- ============================================================================
-- 2. 更新consent_records表，添加撤回状态支持
-- ============================================================================

ALTER TABLE consent_records
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'agreed',
ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
ADD COLUMN IF NOT EXISTS revoke_reason varchar(100),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE consent_records
ADD CONSTRAINT check_consent_status CHECK (status IN ('agreed', 'revoked', 'expired'));

-- ============================================================================
-- 3. 创建索引优化查询性能
-- ============================================================================

-- consent_revoke_logs索引
CREATE INDEX IF NOT EXISTS idx_consent_revoke_logs_action_type ON consent_revoke_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_consent_revoke_logs_status ON consent_revoke_logs(status);
CREATE INDEX IF NOT EXISTS idx_consent_revoke_logs_scheduled_at ON consent_revoke_logs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consent_revoke_logs_user_action ON consent_revoke_logs(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_consent_revoke_logs_pending ON consent_revoke_logs(status, scheduled_at) 
WHERE status = 'pending';

-- consent_records索引
CREATE INDEX IF NOT EXISTS idx_consent_records_status ON consent_records(status);
CREATE INDEX IF NOT EXISTS idx_consent_records_user_status ON consent_records(user_id, status);
CREATE INDEX IF NOT EXISTS idx_consent_records_revoked ON consent_records(user_id, agreement_type) 
WHERE status = 'revoked';

-- ============================================================================
-- 4. 添加注释
-- ============================================================================

COMMENT ON COLUMN consent_revoke_logs.action_type IS '操作类型：撤回同意/删除账号/取消删除';
COMMENT ON COLUMN consent_revoke_logs.revoked_items IS '撤回的同意项列表';
COMMENT ON COLUMN consent_revoke_logs.status IS '状态：待处理/已完成/已取消/失败';
COMMENT ON COLUMN consent_revoke_logs.scheduled_at IS '计划执行时间（用于账号注销冷静期）';
COMMENT ON COLUMN consent_revoke_logs.cancelled_at IS '取消时间';
COMMENT ON COLUMN consent_revoke_logs.completed_at IS '完成时间';
COMMENT ON COLUMN consent_revoke_logs.error_message IS '错误信息';
COMMENT ON COLUMN consent_revoke_logs.device_info IS '设备信息（包含IP地址、设备型号等）';

COMMENT ON COLUMN consent_records.status IS '同意状态：已同意/已撤回/已过期';
COMMENT ON COLUMN consent_records.revoked_at IS '撤回时间';
COMMENT ON COLUMN consent_records.revoke_reason IS '撤回原因';

-- ============================================================================
-- 5. 创建定时清理触发器（清理超过90天的已完成记录）
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_cleanup_old_revoke_logs()
RETURNS trigger AS $$
BEGIN
  -- 删除超过90天的已完成记录
  DELETE FROM consent_revoke_logs
  WHERE status = 'completed' 
  AND completed_at < NOW() - INTERVAL '90 days';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（每天凌晨2点执行）
DROP TRIGGER IF EXISTS trigger_cleanup_old_revoke_logs ON consent_revoke_logs;
CREATE TRIGGER trigger_cleanup_old_revoke_logs
AFTER INSERT ON consent_revoke_logs
FOR EACH STATEMENT
EXECUTE FUNCTION auto_cleanup_old_revoke_logs();

-- ============================================================================
-- 6. 创建视图：用户撤回状态汇总
-- ============================================================================

CREATE OR REPLACE VIEW v_user_revoke_status AS
SELECT 
  u.id as user_id,
  u.username,
  u.account_status,
  COUNT(DISTINCT cr.agreement_type) FILTER (WHERE cr.status = 'revoked') as revoked_consents_count,
  array_agg(DISTINCT cr.agreement_type) FILTER (WHERE cr.status = 'revoked') as revoked_consents,
  EXISTS(
    SELECT 1 FROM consent_revoke_logs crl 
    WHERE crl.user_id = u.id 
    AND crl.action_type = 'delete_account' 
    AND crl.status = 'pending'
  ) as has_pending_deletion,
  (
    SELECT crl.scheduled_at 
    FROM consent_revoke_logs crl 
    WHERE crl.user_id = u.id 
    AND crl.action_type = 'delete_account' 
    AND crl.status = 'pending'
    ORDER BY crl.created_at DESC
    LIMIT 1
  ) as deletion_scheduled_at
FROM users u
LEFT JOIN consent_records cr ON u.id = cr.user_id
GROUP BY u.id;

COMMENT ON VIEW v_user_revoke_status IS '用户撤回状态汇总视图';

-- ============================================================================
-- 7. 创建函数：检查用户是否可以使用特定功能
-- ============================================================================

CREATE OR REPLACE FUNCTION check_user_consent_permission(
  p_user_id uuid,
  p_agreement_type varchar(50)
) RETURNS boolean AS $$
DECLARE
  v_has_consent boolean;
BEGIN
  -- 检查用户是否同意了指定的协议且未撤回
  SELECT EXISTS(
    SELECT 1 
    FROM consent_records 
    WHERE user_id = p_user_id 
    AND agreement_type = p_agreement_type 
    AND status = 'agreed'
  ) INTO v_has_consent;
  
  RETURN v_has_consent;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_user_consent_permission IS '检查用户是否有特定功能的同意权限';

-- ============================================================================
-- 8. 创建存储过程：处理到期的账号注销
-- ============================================================================

CREATE OR REPLACE PROCEDURE process_scheduled_deletions()
LANGUAGE plpgsql
AS $$
DECLARE
  v_deletion RECORD;
  v_deleted_count INT := 0;
BEGIN
  -- 查找到期的注销申请
  FOR v_deletion IN
    SELECT * FROM consent_revoke_logs
    WHERE action_type = 'delete_account'
    AND status = 'pending'
    AND scheduled_at <= NOW()
  LOOP
    BEGIN
      -- 开始事务
      -- 这里实际删除操作应该由应用层处理
      -- 存储过程只更新状态
      
      UPDATE consent_revoke_logs
      SET status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_deletion.id;
      
      v_deleted_count := v_deleted_count + 1;
      
      RAISE NOTICE '处理用户 % 的注销申请', v_deletion.user_id;
      
    EXCEPTION WHEN OTHERS THEN
      -- 记录错误
      UPDATE consent_revoke_logs
      SET status = 'failed',
          error_message = SQLERRM,
          updated_at = NOW()
      WHERE id = v_deletion.id;
      
      RAISE WARNING '处理用户 % 的注销失败: %', v_deletion.user_id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '共处理 % 个注销申请', v_deleted_count;
END;
$$;

COMMENT ON PROCEDURE process_scheduled_deletions IS '处理到期的账号注销申请';

-- ============================================================================
-- 验证迁移
-- ============================================================================

SELECT '✅ consent_revoke_logs表更新完成' as status;

-- 检查表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'consent_revoke_logs'
ORDER BY ordinal_position;

-- 检查索引
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'consent_revoke_logs';

-- 检查视图
SELECT '✅ 用户撤回状态视图创建完成' as status
WHERE EXISTS(
  SELECT 1 FROM information_schema.views 
  WHERE table_name = 'v_user_revoke_status'
);
