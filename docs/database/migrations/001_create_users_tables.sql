-- ============================================================================
-- 数据库迁移脚本：用户相关表
-- 版本：v1.0.0
-- 创建日期：2025-10-18
-- 描述：创建users、user_profiles、user_settings、user_login_logs、user_sessions表
-- ============================================================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. 创建users表（用户主表）
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  openid varchar(128) NOT NULL,
  unionid varchar(128),
  nickname varchar(100),
  avatar text,
  phone varchar(20),
  email varchar(255),
  gender smallint DEFAULT 0,
  birthday date,
  role varchar(20) DEFAULT 'user',
  status varchar(20) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  
  -- 约束
  CONSTRAINT check_users_gender CHECK (gender IN (0, 1, 2)),
  CONSTRAINT check_users_role CHECK (role IN ('user', 'vip', 'admin')),
  CONSTRAINT check_users_status CHECK (status IN ('active', 'suspended', 'deleted')),
  CONSTRAINT check_users_nickname_length CHECK (char_length(nickname) >= 2 AND char_length(nickname) <= 100)
);

-- 创建注释
COMMENT ON TABLE users IS '用户主表';
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.openid IS '微信OpenID';
COMMENT ON COLUMN users.unionid IS '微信UnionID';
COMMENT ON COLUMN users.nickname IS '用户昵称';
COMMENT ON COLUMN users.avatar IS '头像URL';
COMMENT ON COLUMN users.phone IS '手机号（加密）';
COMMENT ON COLUMN users.email IS '邮箱';
COMMENT ON COLUMN users.gender IS '性别（0:未知, 1:男, 2:女）';
COMMENT ON COLUMN users.birthday IS '生日';
COMMENT ON COLUMN users.role IS '角色（user/vip/admin）';
COMMENT ON COLUMN users.status IS '状态（active/suspended/deleted）';

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unionid ON users(unionid) WHERE unionid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at DESC);

-- ============================================================================
-- 2. 创建user_profiles表（用户扩展信息）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  bio text,
  location varchar(100),
  occupation varchar(100),
  education varchar(50),
  interests jsonb DEFAULT '[]'::jsonb,
  emergency_contact jsonb,
  medical_history jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- 约束
  CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_user_profiles_bio_length CHECK (char_length(bio) <= 200)
);

-- 创建注释
COMMENT ON TABLE user_profiles IS '用户扩展信息表';
COMMENT ON COLUMN user_profiles.bio IS '个人简介（最多200字）';
COMMENT ON COLUMN user_profiles.interests IS '兴趣爱好（JSON数组）';
COMMENT ON COLUMN user_profiles.emergency_contact IS '紧急联系人（JSON对象）';
COMMENT ON COLUMN user_profiles.medical_history IS '病史信息（加密）';

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_interests ON user_profiles USING GIN (interests);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- ============================================================================
-- 3. 创建user_settings表（用户设置）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  theme varchar(20) DEFAULT 'light',
  language varchar(10) DEFAULT 'zh_CN',
  notifications_enabled boolean DEFAULT true,
  push_stress_reminder boolean DEFAULT true,
  push_daily_tips boolean DEFAULT true,
  push_community_updates boolean DEFAULT true,
  privacy_show_profile boolean DEFAULT true,
  privacy_show_activities boolean DEFAULT true,
  sound_effects_enabled boolean DEFAULT true,
  vibration_enabled boolean DEFAULT true,
  font_size varchar(20) DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- 约束
  CONSTRAINT fk_user_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_user_settings_theme CHECK (theme IN ('light', 'dark', 'auto')),
  CONSTRAINT check_user_settings_font_size CHECK (font_size IN ('small', 'medium', 'large'))
);

-- 创建注释
COMMENT ON TABLE user_settings IS '用户设置表';
COMMENT ON COLUMN user_settings.theme IS '主题（light/dark/auto）';
COMMENT ON COLUMN user_settings.font_size IS '字体大小（small/medium/large）';

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- 4. 创建user_login_logs表（登录日志）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_login_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  login_method varchar(20) DEFAULT 'wechat',
  login_ip inet,
  login_location varchar(100),
  device_type varchar(50),
  device_model varchar(100),
  os_version varchar(50),
  app_version varchar(20),
  login_status varchar(20) DEFAULT 'success',
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  
  -- 约束
  CONSTRAINT fk_user_login_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_user_login_logs_status CHECK (login_status IN ('success', 'failed'))
);

-- 创建注释
COMMENT ON TABLE user_login_logs IS '用户登录日志表';
COMMENT ON COLUMN user_login_logs.login_ip IS '登录IP地址';
COMMENT ON COLUMN user_login_logs.login_status IS '登录状态（success/failed）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_created_at ON user_login_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_login_ip ON user_login_logs(login_ip);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_login_status ON user_login_logs(login_status);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_created ON user_login_logs(user_id, created_at DESC);

-- ============================================================================
-- 5. 创建user_sessions表（用户会话）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  refresh_token text,
  device_id varchar(100),
  device_info jsonb,
  ip_address inet,
  last_activity_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  -- 约束
  CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建注释
COMMENT ON TABLE user_sessions IS '用户会话表';
COMMENT ON COLUMN user_sessions.token IS 'JWT Token';
COMMENT ON COLUMN user_sessions.expires_at IS 'Token过期时间';

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_device_active 
ON user_sessions(user_id, device_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- ============================================================================
-- 创建触发器函数：自动更新updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 为users表创建触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

-- 为user_profiles表创建触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON user_profiles 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

-- 为user_settings表创建触发器
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at 
BEFORE UPDATE ON user_settings 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 插入种子数据（测试环境）
-- ============================================================================

-- 插入测试用户
INSERT INTO users (openid, nickname, avatar, role, gender) VALUES
('test_openid_001', '测试用户1', '/static/images/avatar1.png', 'user', 1),
('test_openid_002', '测试用户2', '/static/images/avatar2.png', 'user', 2),
('admin_openid_001', '系统管理员', '/static/images/admin-avatar.png', 'admin', 1)
ON CONFLICT (openid) DO NOTHING;

-- 为测试用户创建profile
INSERT INTO user_profiles (user_id, bio) 
SELECT id, '这是一个测试用户的个人简介' 
FROM users 
WHERE openid LIKE 'test_openid_%'
ON CONFLICT (user_id) DO NOTHING;

-- 为所有用户创建默认settings
INSERT INTO user_settings (user_id) 
SELECT id FROM users 
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 验证数据
-- ============================================================================

-- 检查表是否创建成功
SELECT 
  'users' as table_name,
  COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
  'user_profiles',
  COUNT(*)
FROM user_profiles
UNION ALL
SELECT 
  'user_settings',
  COUNT(*)
FROM user_settings;

-- ============================================================================
-- 回滚脚本（如需要）
-- ============================================================================

/*
-- 警告：以下操作将删除所有用户数据！
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_login_logs CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
*/

-- ============================================================================
-- 迁移完成
-- ============================================================================

SELECT '✅ 用户相关表迁移完成' as status;

