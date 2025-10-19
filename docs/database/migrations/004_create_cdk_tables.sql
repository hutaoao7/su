-- ============================================================================
-- 数据库迁移脚本：CDK相关表
-- 版本：v1.0.0
-- 创建日期：2025-10-18
-- 描述：创建cdk_types、cdk_codes、cdk_redeem_records表
-- ============================================================================

-- ============================================================================
-- 1. 创建cdk_types表（CDK类型配置）
-- ============================================================================

CREATE TABLE IF NOT EXISTS cdk_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_code varchar(50) NOT NULL,
  type_name varchar(100) NOT NULL,
  description text,
  benefit_type varchar(50) NOT NULL,
  benefit_value int NOT NULL,
  benefit_unit varchar(20),
  validity_days int DEFAULT 0,
  max_usage_count int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE cdk_types IS 'CDK类型配置表';
COMMENT ON COLUMN cdk_types.benefit_type IS '权益类型（vip/credits/feature）';
COMMENT ON COLUMN cdk_types.validity_days IS '有效期（天，0表示永久）';

CREATE UNIQUE INDEX IF NOT EXISTS idx_cdk_types_type_code ON cdk_types(type_code);
CREATE INDEX IF NOT EXISTS idx_cdk_types_benefit_type ON cdk_types(benefit_type);
CREATE INDEX IF NOT EXISTS idx_cdk_types_is_active ON cdk_types(is_active);

-- ============================================================================
-- 2. 创建cdk_codes表（兑换码）
-- ============================================================================

CREATE TABLE IF NOT EXISTS cdk_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(50) NOT NULL,
  type_code varchar(50) NOT NULL,
  batch_id varchar(100),
  status varchar(20) DEFAULT 'unused',
  max_redeem_count int DEFAULT 1,
  current_redeem_count int DEFAULT 0,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_cdk_codes_type_code FOREIGN KEY (type_code) REFERENCES cdk_types(type_code) ON DELETE RESTRICT,
  CONSTRAINT check_cdk_codes_status CHECK (status IN ('unused', 'used', 'expired', 'disabled')),
  CONSTRAINT check_cdk_codes_redeem_counts CHECK (max_redeem_count > 0 AND current_redeem_count >= 0 AND current_redeem_count <= max_redeem_count)
);

COMMENT ON TABLE cdk_codes IS 'CDK兑换码表';
COMMENT ON COLUMN cdk_codes.code IS '兑换码（唯一）';
COMMENT ON COLUMN cdk_codes.status IS '状态（unused/used/expired/disabled）';

CREATE UNIQUE INDEX IF NOT EXISTS idx_cdk_codes_code ON cdk_codes(code);
CREATE INDEX IF NOT EXISTS idx_cdk_codes_type_code ON cdk_codes(type_code);
CREATE INDEX IF NOT EXISTS idx_cdk_codes_batch_id ON cdk_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_cdk_codes_status ON cdk_codes(status);
CREATE INDEX IF NOT EXISTS idx_cdk_codes_expires_at ON cdk_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_cdk_codes_created_at ON cdk_codes(created_at DESC);

-- ============================================================================
-- 3. 创建cdk_redeem_records表（兑换记录）
-- ============================================================================

CREATE TABLE IF NOT EXISTS cdk_redeem_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id uuid NOT NULL,
  code varchar(50) NOT NULL,
  user_id uuid NOT NULL,
  type_code varchar(50) NOT NULL,
  benefit_granted jsonb,
  redeem_ip inet,
  redeem_device jsonb,
  status varchar(20) DEFAULT 'success',
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_cdk_redeem_records_code_id FOREIGN KEY (code_id) REFERENCES cdk_codes(id) ON DELETE CASCADE,
  CONSTRAINT fk_cdk_redeem_records_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_cdk_redeem_records_status CHECK (status IN ('success', 'failed', 'revoked'))
);

COMMENT ON TABLE cdk_redeem_records IS 'CDK兑换记录表';

CREATE INDEX IF NOT EXISTS idx_cdk_redeem_records_code_id ON cdk_redeem_records(code_id);
CREATE INDEX IF NOT EXISTS idx_cdk_redeem_records_code ON cdk_redeem_records(code);
CREATE INDEX IF NOT EXISTS idx_cdk_redeem_records_user_id ON cdk_redeem_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cdk_redeem_records_created_at ON cdk_redeem_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cdk_redeem_records_user_created ON cdk_redeem_records(user_id, created_at DESC);

-- ============================================================================
-- 插入CDK类型配置
-- ============================================================================

INSERT INTO cdk_types (type_code, type_name, description, benefit_type, benefit_value, benefit_unit, validity_days) VALUES
('vip_week', 'VIP周卡', '享受7天VIP会员权益', 'vip', 7, '天', 7),
('vip_month', 'VIP月卡', '享受30天VIP会员权益', 'vip', 30, '天', 30),
('vip_year', 'VIP年卡', '享受365天VIP会员权益', 'vip', 365, '天', 365),
('credits_100', '积分100', '获得100积分', 'credits', 100, '积分', 0),
('credits_500', '积分500', '获得500积分', 'credits', 500, '积分', 0),
('feature_ai_premium', 'AI高级功能', '解锁GPT-4对话权限', 'feature', 1, '项', 30)
ON CONFLICT (type_code) DO NOTHING;

-- ============================================================================
-- 验证数据
-- ============================================================================

SELECT '✅ CDK相关表迁移完成' as status;


