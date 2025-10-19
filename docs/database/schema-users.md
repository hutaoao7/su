# 用户相关表设计文档

## 文档信息
- **创建日期**: 2025-10-18
- **版本**: v1.0.0
- **维护人**: 后端开发团队

## 表结构清单

### 1. users - 用户主表

#### 表说明
存储用户基本信息和认证数据。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 用户唯一标识（主键） |
| openid | varchar | 128 | 是 | - | 微信OpenID（唯一） |
| unionid | varchar | 128 | 否 | null | 微信UnionID |
| nickname | varchar | 100 | 否 | null | 用户昵称 |
| avatar | text | - | 否 | null | 头像URL |
| phone | varchar | 20 | 否 | null | 手机号（加密存储） |
| email | varchar | 255 | 否 | null | 邮箱地址 |
| gender | smallint | - | 否 | 0 | 性别（0:未知, 1:男, 2:女） |
| birthday | date | - | 否 | null | 生日 |
| role | varchar | 20 | 否 | 'user' | 用户角色（user/vip/admin） |
| status | varchar | 20 | 否 | 'active' | 账号状态（active/suspended/deleted） |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |
| last_login_at | timestamptz | - | 否 | null | 最后登录时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 唯一索引
CREATE UNIQUE INDEX idx_users_openid ON users(openid);
CREATE UNIQUE INDEX idx_users_unionid ON users(unionid) WHERE unionid IS NOT NULL;
CREATE UNIQUE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- 普通索引
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

#### 约束条件

```sql
-- 检查约束
ALTER TABLE users ADD CONSTRAINT check_gender CHECK (gender IN (0, 1, 2));
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('user', 'vip', 'admin'));
ALTER TABLE users ADD CONSTRAINT check_status CHECK (status IN ('active', 'suspended', 'deleted'));
ALTER TABLE users ADD CONSTRAINT check_nickname_length CHECK (char_length(nickname) >= 2 AND char_length(nickname) <= 100);

-- 外键约束
-- 无（主表）
```

#### 触发器

```sql
-- 自动更新updated_at时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();
```

---

### 2. user_profiles - 用户扩展信息表

#### 表说明
存储用户的详细资料和个性化设置。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| bio | text | - | 否 | null | 个人简介（最多200字） |
| location | varchar | 100 | 否 | null | 所在地 |
| occupation | varchar | 100 | 否 | null | 职业 |
| education | varchar | 50 | 否 | null | 学历 |
| interests | jsonb | - | 否 | '[]'::jsonb | 兴趣爱好（JSON数组） |
| emergency_contact | jsonb | - | 否 | null | 紧急联系人（JSON对象） |
| medical_history | jsonb | - | 否 | null | 病史信息（加密存储） |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 唯一索引
CREATE UNIQUE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- JSONB索引（用于兴趣查询）
CREATE INDEX idx_user_profiles_interests ON user_profiles USING GIN (interests);

-- 普通索引
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 检查约束
ALTER TABLE user_profiles 
ADD CONSTRAINT check_bio_length 
CHECK (char_length(bio) <= 200);
```

---

### 3. user_settings - 用户设置表

#### 表说明
存储用户的应用设置和偏好。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| theme | varchar | 20 | 否 | 'light' | 主题（light/dark/auto） |
| language | varchar | 10 | 否 | 'zh_CN' | 语言设置 |
| notifications_enabled | boolean | - | 否 | true | 是否允许通知 |
| push_stress_reminder | boolean | - | 否 | true | 压力检测提醒 |
| push_daily_tips | boolean | - | 否 | true | 每日心理建议 |
| push_community_updates | boolean | - | 否 | true | 社区动态通知 |
| privacy_show_profile | boolean | - | 否 | true | 是否公开个人资料 |
| privacy_show_activities | boolean | - | 否 | true | 是否公开动态 |
| sound_effects_enabled | boolean | - | 否 | true | 音效开关 |
| vibration_enabled | boolean | - | 否 | true | 震动开关 |
| font_size | varchar | 20 | 否 | 'medium' | 字体大小（small/medium/large） |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 唯一索引
CREATE UNIQUE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE user_settings 
ADD CONSTRAINT fk_user_settings_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 检查约束
ALTER TABLE user_settings 
ADD CONSTRAINT check_theme 
CHECK (theme IN ('light', 'dark', 'auto'));

ALTER TABLE user_settings 
ADD CONSTRAINT check_font_size 
CHECK (font_size IN ('small', 'medium', 'large'));
```

---

### 4. user_login_logs - 登录日志表

#### 表说明
记录用户登录历史，用于安全审计和异常检测。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| login_method | varchar | 20 | 否 | 'wechat' | 登录方式 |
| login_ip | inet | - | 否 | null | 登录IP |
| login_location | varchar | 100 | 否 | null | 登录地点 |
| device_type | varchar | 50 | 否 | null | 设备类型 |
| device_model | varchar | 100 | 否 | null | 设备型号 |
| os_version | varchar | 50 | 否 | null | 操作系统版本 |
| app_version | varchar | 20 | 否 | null | 应用版本 |
| login_status | varchar | 20 | 否 | 'success' | 登录状态（success/failed） |
| failure_reason | text | - | 否 | null | 失败原因 |
| created_at | timestamptz | - | 是 | now() | 登录时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 普通索引
CREATE INDEX idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX idx_user_login_logs_created_at ON user_login_logs(created_at DESC);
CREATE INDEX idx_user_login_logs_login_ip ON user_login_logs(login_ip);
CREATE INDEX idx_user_login_logs_login_status ON user_login_logs(login_status);

-- 复合索引（用于查询特定用户的最近登录记录）
CREATE INDEX idx_user_login_logs_user_created ON user_login_logs(user_id, created_at DESC);
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE user_login_logs 
ADD CONSTRAINT fk_user_login_logs_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 检查约束
ALTER TABLE user_login_logs 
ADD CONSTRAINT check_login_status 
CHECK (login_status IN ('success', 'failed'));
```

#### 分区策略

```sql
-- 按月分区（用于大量登录日志）
CREATE TABLE user_login_logs_2025_10 PARTITION OF user_login_logs
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE user_login_logs_2025_11 PARTITION OF user_login_logs
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- 继续为后续月份创建分区...
```

---

### 5. user_sessions - 用户会话表

#### 表说明
管理用户的登录会话和Token。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| token | text | - | 是 | - | JWT Token（加密存储） |
| refresh_token | text | - | 否 | null | 刷新Token |
| device_id | varchar | 100 | 否 | null | 设备标识 |
| device_info | jsonb | - | 否 | null | 设备信息（JSON） |
| ip_address | inet | - | 否 | null | IP地址 |
| last_activity_at | timestamptz | - | 否 | now() | 最后活动时间 |
| expires_at | timestamptz | - | 是 | - | 过期时间 |
| is_active | boolean | - | 否 | true | 是否活跃 |
| created_at | timestamptz | - | 是 | now() | 创建时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 唯一索引（一个设备只能有一个活跃会话）
CREATE UNIQUE INDEX idx_user_sessions_device_active 
ON user_sessions(user_id, device_id) 
WHERE is_active = true;

-- 普通索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE user_sessions 
ADD CONSTRAINT fk_user_sessions_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;
```

---

## 数据迁移脚本

### 创建表SQL

```sql
-- 1. 创建users表
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
  CONSTRAINT check_gender CHECK (gender IN (0, 1, 2)),
  CONSTRAINT check_role CHECK (role IN ('user', 'vip', 'admin')),
  CONSTRAINT check_status CHECK (status IN ('active', 'suspended', 'deleted')),
  CONSTRAINT check_nickname_length CHECK (char_length(nickname) >= 2 AND char_length(nickname) <= 100)
);

-- 创建索引
CREATE UNIQUE INDEX idx_users_openid ON users(openid);
CREATE UNIQUE INDEX idx_users_unionid ON users(unionid) WHERE unionid IS NOT NULL;
CREATE UNIQUE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 创建触发器
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

-- 2. 创建user_profiles表
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
  CONSTRAINT check_bio_length CHECK (char_length(bio) <= 200)
);

-- 创建索引
CREATE UNIQUE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_interests ON user_profiles USING GIN (interests);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- 3. 创建user_settings表
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
  CONSTRAINT check_theme CHECK (theme IN ('light', 'dark', 'auto')),
  CONSTRAINT check_font_size CHECK (font_size IN ('small', 'medium', 'large'))
);

-- 创建索引
CREATE UNIQUE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- 4. 创建user_login_logs表
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
  CONSTRAINT check_login_status CHECK (login_status IN ('success', 'failed'))
);

-- 创建索引
CREATE INDEX idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX idx_user_login_logs_created_at ON user_login_logs(created_at DESC);
CREATE INDEX idx_user_login_logs_login_ip ON user_login_logs(login_ip);
CREATE INDEX idx_user_login_logs_login_status ON user_login_logs(login_status);
CREATE INDEX idx_user_login_logs_user_created ON user_login_logs(user_id, created_at DESC);

-- 5. 创建user_sessions表
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

-- 创建索引
CREATE UNIQUE INDEX idx_user_sessions_device_active 
ON user_sessions(user_id, device_id) WHERE is_active = true;
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
```

### 种子数据

```sql
-- 插入测试用户
INSERT INTO users (openid, nickname, avatar, role) VALUES
('test_openid_001', '测试用户1', '/static/images/avatar1.png', 'user'),
('test_openid_002', '测试用户2', '/static/images/avatar2.png', 'user'),
('admin_openid_001', '管理员', '/static/images/admin-avatar.png', 'admin');

-- 为测试用户创建profile
INSERT INTO user_profiles (user_id, bio) 
SELECT id, '这是测试用户的个人简介' FROM users WHERE role = 'user';

-- 为测试用户创建settings
INSERT INTO user_settings (user_id) 
SELECT id FROM users;
```

---

## 数据备份与恢复

### 备份命令

```bash
# 备份单个表
pg_dump -h localhost -U postgres -t users -t user_profiles -t user_settings -t user_login_logs -t user_sessions dbname > users_backup.sql

# 备份整个数据库
pg_dump -h localhost -U postgres dbname > full_backup.sql
```

### 恢复命令

```bash
# 恢复数据
psql -h localhost -U postgres dbname < users_backup.sql
```

---

## 最佳实践

### 1. 数据安全
- 手机号、邮箱等敏感信息必须加密存储
- 医疗历史等隐私数据使用JSONB加密
- Token信息不要明文存储

### 2. 性能优化
- 登录日志表使用分区策略
- 合理使用索引，避免过度索引
- JSONB字段使用GIN索引

### 3. 数据一致性
- 使用外键保证数据完整性
- 使用触发器自动更新时间戳
- 使用事务保证原子性

### 4. 数据清理
- 定期清理过期的session记录
- 归档旧的登录日志
- 软删除用户数据（status='deleted'）

---

## 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-18 | 初始版本 | 开发团队 |

---

**维护说明**: 本文档需要随着业务需求变化及时更新，每次变更需要记录版本和变更内容。

