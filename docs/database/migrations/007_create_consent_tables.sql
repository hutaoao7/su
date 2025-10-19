-- ============================================================================
-- 数据库迁移脚本：同意管理相关表
-- 版本：v1.0.0
-- 创建日期：2025-10-18
-- 描述：创建consent_records、agreement_versions、consent_revoke_logs表
-- ============================================================================

-- ============================================================================
-- 1. 创建agreement_versions表（协议版本）
-- ============================================================================

CREATE TABLE IF NOT EXISTS agreement_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_type varchar(50) NOT NULL,
  version varchar(20) NOT NULL,
  title varchar(200) NOT NULL,
  content text NOT NULL,
  effective_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT check_agreement_versions_type CHECK (agreement_type IN ('user_agreement', 'privacy_policy', 'disclaimer'))
);

COMMENT ON TABLE agreement_versions IS '协议版本表';
COMMENT ON COLUMN agreement_versions.agreement_type IS '协议类型';
COMMENT ON COLUMN agreement_versions.effective_date IS '生效日期';

CREATE UNIQUE INDEX IF NOT EXISTS idx_agreement_versions_type_version ON agreement_versions(agreement_type, version);
CREATE INDEX IF NOT EXISTS idx_agreement_versions_type ON agreement_versions(agreement_type);
CREATE INDEX IF NOT EXISTS idx_agreement_versions_is_active ON agreement_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_agreement_versions_effective_date ON agreement_versions(effective_date DESC);

-- ============================================================================
-- 2. 创建consent_records表（同意记录）
-- ============================================================================

CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  agreement_type varchar(50) NOT NULL,
  version varchar(20) NOT NULL,
  agreed boolean DEFAULT true,
  agreed_at timestamptz DEFAULT now(),
  ip_address inet,
  device_info jsonb,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_consent_records_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_consent_records_type CHECK (agreement_type IN ('user_agreement', 'privacy_policy', 'disclaimer'))
);

COMMENT ON TABLE consent_records IS '用户同意记录表';
COMMENT ON COLUMN consent_records.agreed_at IS '同意时间';

CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_agreement_type ON consent_records(agreement_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_version ON consent_records(version);
CREATE INDEX IF NOT EXISTS idx_consent_records_created_at ON consent_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_records_user_type ON consent_records(user_id, agreement_type);

-- ============================================================================
-- 3. 创建consent_revoke_logs表（撤回日志）
-- ============================================================================

CREATE TABLE IF NOT EXISTS consent_revoke_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  revoke_reason varchar(100),
  revoke_detail text,
  data_deletion_requested boolean DEFAULT false,
  data_deleted_at timestamptz,
  revoked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_consent_revoke_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE consent_revoke_logs IS '同意撤回日志表';
COMMENT ON COLUMN consent_revoke_logs.data_deletion_requested IS '是否请求删除数据';

CREATE INDEX IF NOT EXISTS idx_consent_revoke_logs_user_id ON consent_revoke_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_revoke_logs_revoked_at ON consent_revoke_logs(revoked_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_revoke_logs_data_deletion_requested ON consent_revoke_logs(data_deletion_requested);

-- ============================================================================
-- 插入协议版本
-- ============================================================================

INSERT INTO agreement_versions (agreement_type, version, title, content, effective_date) VALUES
('user_agreement', '1.0.0', '翎心用户协议', '这里是完整的用户协议内容...', '2025-01-01'),
('privacy_policy', '1.0.0', '翎心隐私政策', '这里是完整的隐私政策内容...', '2025-01-01'),
('disclaimer', '1.0.0', '翎心免责声明', '这里是完整的免责声明内容...', '2025-01-01')
ON CONFLICT (agreement_type, version) DO NOTHING;

-- ============================================================================
-- 验证数据
-- ============================================================================

SELECT '✅ 同意管理相关表迁移完成' as status;

SELECT 
  'agreement_versions' as table_name,
  COUNT(*) as record_count
FROM agreement_versions
UNION ALL
SELECT 
  'consent_records',
  COUNT(*)
FROM consent_records;


