# CDK与音乐相关表设计文档

## 文档信息
- **创建日期**: 2025-10-18
- **版本**: v1.0.0
- **维护人**: 后端开发团队

---

## 第一部分：CDK相关表

### 1. cdk_types - CDK类型配置表

#### 表说明
定义不同类型CDK的配置和权益。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| type_code | varchar | 50 | 是 | - | 类型代码（如vip_month、credits_100） |
| type_name | varchar | 100 | 是 | - | 类型名称 |
| description | text | - | 否 | null | 类型描述 |
| benefit_type | varchar | 50 | 是 | - | 权益类型（vip/credits/feature） |
| benefit_value | int | - | 是 | - | 权益数值 |
| benefit_unit | varchar | 20 | 否 | null | 权益单位（天/次/积分） |
| validity_days | int | - | 否 | 0 | 有效期（天，0表示永久） |
| max_usage_count | int | - | 否 | 1 | 最大使用次数 |
| is_active | boolean | - | 否 | true | 是否启用 |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
PRIMARY KEY (id)
CREATE UNIQUE INDEX idx_cdk_types_type_code ON cdk_types(type_code);
CREATE INDEX idx_cdk_types_benefit_type ON cdk_types(benefit_type);
CREATE INDEX idx_cdk_types_is_active ON cdk_types(is_active);
```

---

### 2. cdk_codes - CDK兑换码表

#### 表说明
存储所有生成的CDK兑换码及其状态。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| code | varchar | 50 | 是 | - | 兑换码（唯一） |
| type_code | varchar | 50 | 是 | - | CDK类型（外键） |
| batch_id | varchar | 100 | 否 | null | 批次ID |
| status | varchar | 20 | 否 | 'unused' | 状态（unused/used/expired/disabled） |
| max_redeem_count | int | - | 否 | 1 | 最大兑换次数 |
| current_redeem_count | int | - | 否 | 0 | 当前兑换次数 |
| expires_at | timestamptz | - | 否 | null | 过期时间 |
| created_by | uuid | - | 否 | null | 创建者ID |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
PRIMARY KEY (id)
CREATE UNIQUE INDEX idx_cdk_codes_code ON cdk_codes(code);
CREATE INDEX idx_cdk_codes_type_code ON cdk_codes(type_code);
CREATE INDEX idx_cdk_codes_batch_id ON cdk_codes(batch_id);
CREATE INDEX idx_cdk_codes_status ON cdk_codes(status);
CREATE INDEX idx_cdk_codes_expires_at ON cdk_codes(expires_at);
CREATE INDEX idx_cdk_codes_created_at ON cdk_codes(created_at DESC);
```

#### 约束条件

```sql
ALTER TABLE cdk_codes 
ADD CONSTRAINT fk_cdk_codes_type_code 
FOREIGN KEY (type_code) 
REFERENCES cdk_types(type_code) 
ON DELETE RESTRICT;

ALTER TABLE cdk_codes 
ADD CONSTRAINT check_status 
CHECK (status IN ('unused', 'used', 'expired', 'disabled'));

ALTER TABLE cdk_codes 
ADD CONSTRAINT check_redeem_counts 
CHECK (max_redeem_count > 0 AND current_redeem_count >= 0 AND current_redeem_count <= max_redeem_count);
```

---

### 3. cdk_redeem_records - CDK兑换记录表

#### 表说明
记录所有CDK兑换操作。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| code_id | uuid | - | 是 | - | CDK ID（外键） |
| code | varchar | 50 | 是 | - | 兑换码（冗余，便于查询） |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| type_code | varchar | 50 | 是 | - | CDK类型（冗余） |
| benefit_granted | jsonb | - | 否 | null | 发放的权益（JSON） |
| redeem_ip | inet | - | 否 | null | 兑换IP |
| redeem_device | jsonb | - | 否 | null | 兑换设备信息 |
| status | varchar | 20 | 否 | 'success' | 兑换状态（success/failed/revoked） |
| failure_reason | text | - | 否 | null | 失败原因 |
| created_at | timestamptz | - | 是 | now() | 兑换时间 |

#### 索引策略

```sql
PRIMARY KEY (id)
CREATE INDEX idx_cdk_redeem_records_code_id ON cdk_redeem_records(code_id);
CREATE INDEX idx_cdk_redeem_records_code ON cdk_redeem_records(code);
CREATE INDEX idx_cdk_redeem_records_user_id ON cdk_redeem_records(user_id);
CREATE INDEX idx_cdk_redeem_records_created_at ON cdk_redeem_records(created_at DESC);
CREATE INDEX idx_cdk_redeem_records_user_created ON cdk_redeem_records(user_id, created_at DESC);
```

#### 约束条件

```sql
ALTER TABLE cdk_redeem_records 
ADD CONSTRAINT fk_cdk_redeem_records_code_id 
FOREIGN KEY (code_id) 
REFERENCES cdk_codes(id) 
ON DELETE CASCADE;

ALTER TABLE cdk_redeem_records 
ADD CONSTRAINT fk_cdk_redeem_records_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE cdk_redeem_records 
ADD CONSTRAINT check_status 
CHECK (status IN ('success', 'failed', 'revoked'));
```

---

## 第二部分：音乐相关表

### 4. music_categories - 音乐分类表

#### 表说明
定义音乐的分类体系。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| category_code | varchar | 50 | 是 | - | 分类代码（如meditation、nature） |
| category_name | varchar | 100 | 是 | - | 分类名称 |
| description | text | - | 否 | null | 分类描述 |
| icon | varchar | 255 | 否 | null | 分类图标URL |
| sort_order | int | - | 否 | 0 | 排序顺序 |
| is_active | boolean | - | 否 | true | 是否启用 |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
PRIMARY KEY (id)
CREATE UNIQUE INDEX idx_music_categories_code ON music_categories(category_code);
CREATE INDEX idx_music_categories_sort_order ON music_categories(sort_order);
CREATE INDEX idx_music_categories_is_active ON music_categories(is_active);
```

---

### 5. music_tracks - 音频曲目表

#### 表说明
存储所有音频曲目的元数据。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| track_id | varchar | 50 | 是 | - | 曲目标识符 |
| title | varchar | 200 | 是 | - | 曲目标题 |
| subtitle | varchar | 200 | 否 | null | 副标题 |
| category_code | varchar | 50 | 是 | - | 分类（外键） |
| artist | varchar | 100 | 否 | null | 艺术家/制作者 |
| duration | int | - | 是 | - | 时长（秒） |
| cover_url | text | - | 否 | null | 封面图URL |
| audio_url | text | - | 是 | - | 音频文件URL（CDN） |
| audio_format | varchar | 10 | 否 | 'mp3' | 音频格式（mp3/m4a/wav） |
| file_size | bigint | - | 否 | null | 文件大小（字节） |
| bitrate | int | - | 否 | null | 比特率（kbps） |
| description | text | - | 否 | null | 曲目描述 |
| tags | jsonb | - | 否 | '[]'::jsonb | 标签（JSON数组） |
| is_premium | boolean | - | 否 | false | 是否VIP专属 |
| is_active | boolean | - | 否 | true | 是否启用 |
| play_count | int | - | 否 | 0 | 播放次数 |
| favorite_count | int | - | 否 | 0 | 收藏次数 |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
PRIMARY KEY (id)
CREATE UNIQUE INDEX idx_music_tracks_track_id ON music_tracks(track_id);
CREATE INDEX idx_music_tracks_category ON music_tracks(category_code);
CREATE INDEX idx_music_tracks_is_premium ON music_tracks(is_premium);
CREATE INDEX idx_music_tracks_is_active ON music_tracks(is_active);
CREATE INDEX idx_music_tracks_play_count ON music_tracks(play_count DESC);
CREATE INDEX idx_music_tracks_tags ON music_tracks USING GIN (tags);
```

---

### 6. music_playlists - 播放列表表

#### 表说明
存储用户创建的播放列表。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| playlist_name | varchar | 200 | 是 | - | 播放列表名称 |
| description | text | - | 否 | null | 描述 |
| cover_url | text | - | 否 | null | 封面图 |
| track_ids | jsonb | - | 否 | '[]'::jsonb | 曲目ID列表（JSON数组） |
| track_count | int | - | 否 | 0 | 曲目数量 |
| total_duration | int | - | 否 | 0 | 总时长（秒） |
| is_public | boolean | - | 否 | false | 是否公开 |
| play_count | int | - | 否 | 0 | 播放次数 |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
PRIMARY KEY (id)
CREATE INDEX idx_music_playlists_user_id ON music_playlists(user_id);
CREATE INDEX idx_music_playlists_is_public ON music_playlists(is_public);
CREATE INDEX idx_music_playlists_track_ids ON music_playlists USING GIN (track_ids);
CREATE INDEX idx_music_playlists_created_at ON music_playlists(created_at DESC);
```

---

### 7. user_music_favorites - 用户收藏表

#### 表说明
记录用户收藏的音频曲目。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| track_id | varchar | 50 | 是 | - | 曲目ID（外键） |
| created_at | timestamptz | - | 是 | now() | 收藏时间 |

#### 索引策略

```sql
PRIMARY KEY (id)
CREATE UNIQUE INDEX idx_user_music_favorites_unique ON user_music_favorites(user_id, track_id);
CREATE INDEX idx_user_music_favorites_user_id ON user_music_favorites(user_id);
CREATE INDEX idx_user_music_favorites_track_id ON user_music_favorites(track_id);
CREATE INDEX idx_user_music_favorites_created_at ON user_music_favorites(created_at DESC);
```

---

### 8. user_music_history - 播放历史表

#### 表说明
记录用户的音频播放历史。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| track_id | varchar | 50 | 是 | - | 曲目ID（外键） |
| play_duration | int | - | 否 | 0 | 播放时长（秒） |
| completion_rate | decimal | 5,2 | 否 | 0 | 完成率（%） |
| play_source | varchar | 50 | 否 | 'app' | 播放来源（app/web/share） |
| device_type | varchar | 50 | 否 | null | 设备类型 |
| created_at | timestamptz | - | 是 | now() | 播放时间 |

#### 索引策略

```sql
PRIMARY KEY (id)
CREATE INDEX idx_user_music_history_user_id ON user_music_history(user_id);
CREATE INDEX idx_user_music_history_track_id ON user_music_history(track_id);
CREATE INDEX idx_user_music_history_created_at ON user_music_history(created_at DESC);
CREATE INDEX idx_user_music_history_user_created ON user_music_history(user_id, created_at DESC);
```

---

## 数据迁移脚本

```sql
-- 1. 创建cdk_types表
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

CREATE UNIQUE INDEX idx_cdk_types_type_code ON cdk_types(type_code);
CREATE INDEX idx_cdk_types_benefit_type ON cdk_types(benefit_type);
CREATE INDEX idx_cdk_types_is_active ON cdk_types(is_active);

-- 2. 创建cdk_codes表
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
  CONSTRAINT check_status CHECK (status IN ('unused', 'used', 'expired', 'disabled')),
  CONSTRAINT check_redeem_counts CHECK (max_redeem_count > 0 AND current_redeem_count >= 0 AND current_redeem_count <= max_redeem_count)
);

CREATE UNIQUE INDEX idx_cdk_codes_code ON cdk_codes(code);
CREATE INDEX idx_cdk_codes_type_code ON cdk_codes(type_code);
CREATE INDEX idx_cdk_codes_batch_id ON cdk_codes(batch_id);
CREATE INDEX idx_cdk_codes_status ON cdk_codes(status);
CREATE INDEX idx_cdk_codes_expires_at ON cdk_codes(expires_at);
CREATE INDEX idx_cdk_codes_created_at ON cdk_codes(created_at DESC);

-- 3. 创建cdk_redeem_records表
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
  CONSTRAINT check_status CHECK (status IN ('success', 'failed', 'revoked'))
);

CREATE INDEX idx_cdk_redeem_records_code_id ON cdk_redeem_records(code_id);
CREATE INDEX idx_cdk_redeem_records_code ON cdk_redeem_records(code);
CREATE INDEX idx_cdk_redeem_records_user_id ON cdk_redeem_records(user_id);
CREATE INDEX idx_cdk_redeem_records_created_at ON cdk_redeem_records(created_at DESC);
CREATE INDEX idx_cdk_redeem_records_user_created ON cdk_redeem_records(user_id, created_at DESC);

-- 4. 创建music_categories表
CREATE TABLE IF NOT EXISTS music_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_code varchar(50) NOT NULL,
  category_name varchar(100) NOT NULL,
  description text,
  icon varchar(255),
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_music_categories_code ON music_categories(category_code);
CREATE INDEX idx_music_categories_sort_order ON music_categories(sort_order);
CREATE INDEX idx_music_categories_is_active ON music_categories(is_active);

-- 5. 创建music_tracks表
CREATE TABLE IF NOT EXISTS music_tracks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id varchar(50) NOT NULL,
  title varchar(200) NOT NULL,
  subtitle varchar(200),
  category_code varchar(50) NOT NULL,
  artist varchar(100),
  duration int NOT NULL,
  cover_url text,
  audio_url text NOT NULL,
  audio_format varchar(10) DEFAULT 'mp3',
  file_size bigint,
  bitrate int,
  description text,
  tags jsonb DEFAULT '[]'::jsonb,
  is_premium boolean DEFAULT false,
  is_active boolean DEFAULT true,
  play_count int DEFAULT 0,
  favorite_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_music_tracks_category FOREIGN KEY (category_code) REFERENCES music_categories(category_code) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_music_tracks_track_id ON music_tracks(track_id);
CREATE INDEX idx_music_tracks_category ON music_tracks(category_code);
CREATE INDEX idx_music_tracks_is_premium ON music_tracks(is_premium);
CREATE INDEX idx_music_tracks_is_active ON music_tracks(is_active);
CREATE INDEX idx_music_tracks_play_count ON music_tracks(play_count DESC);
CREATE INDEX idx_music_tracks_tags ON music_tracks USING GIN (tags);

-- 6. 创建music_playlists表
CREATE TABLE IF NOT EXISTS music_playlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  playlist_name varchar(200) NOT NULL,
  description text,
  cover_url text,
  track_ids jsonb DEFAULT '[]'::jsonb,
  track_count int DEFAULT 0,
  total_duration int DEFAULT 0,
  is_public boolean DEFAULT false,
  play_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_music_playlists_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_music_playlists_user_id ON music_playlists(user_id);
CREATE INDEX idx_music_playlists_is_public ON music_playlists(is_public);
CREATE INDEX idx_music_playlists_track_ids ON music_playlists USING GIN (track_ids);
CREATE INDEX idx_music_playlists_created_at ON music_playlists(created_at DESC);

-- 7. 创建user_music_favorites表
CREATE TABLE IF NOT EXISTS user_music_favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  track_id varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_user_music_favorites_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_music_favorites_track_id FOREIGN KEY (track_id) REFERENCES music_tracks(track_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_user_music_favorites_unique ON user_music_favorites(user_id, track_id);
CREATE INDEX idx_user_music_favorites_user_id ON user_music_favorites(user_id);
CREATE INDEX idx_user_music_favorites_track_id ON user_music_favorites(track_id);
CREATE INDEX idx_user_music_favorites_created_at ON user_music_favorites(created_at DESC);

-- 8. 创建user_music_history表
CREATE TABLE IF NOT EXISTS user_music_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  track_id varchar(50) NOT NULL,
  play_duration int DEFAULT 0,
  completion_rate decimal(5,2) DEFAULT 0,
  play_source varchar(50) DEFAULT 'app',
  device_type varchar(50),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_user_music_history_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_music_history_track_id FOREIGN KEY (track_id) REFERENCES music_tracks(track_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_music_history_user_id ON user_music_history(user_id);
CREATE INDEX idx_user_music_history_track_id ON user_music_history(track_id);
CREATE INDEX idx_user_music_history_created_at ON user_music_history(created_at DESC);
CREATE INDEX idx_user_music_history_user_created ON user_music_history(user_id, created_at DESC);
```

---

## 种子数据

### CDK类型配置

```sql
INSERT INTO cdk_types (type_code, type_name, description, benefit_type, benefit_value, benefit_unit, validity_days) VALUES
('vip_week', 'VIP周卡', '享受7天VIP会员权益', 'vip', 7, '天', 7),
('vip_month', 'VIP月卡', '享受30天VIP会员权益', 'vip', 30, '天', 30),
('vip_year', 'VIP年卡', '享受365天VIP会员权益', 'vip', 365, '天', 365),
('credits_100', '积分100', '获得100积分', 'credits', 100, '积分', 0),
('credits_500', '积分500', '获得500积分', 'credits', 500, '积分', 0),
('feature_ai_premium', 'AI高级功能', '解锁GPT-4对话权限', 'feature', 1, '项', 30);
```

### 音乐分类

```sql
INSERT INTO music_categories (category_code, category_name, description, sort_order) VALUES
('meditation', '冥想引导', '专业的冥想引导音频', 1),
('nature', '自然音效', '大自然的声音，帮助放松', 2),
('music', '放松音乐', '舒缓的背景音乐', 3),
('sleep', '助眠音乐', '帮助入睡的专门音乐', 4),
('focus', '专注音乐', '提升专注力的背景音乐', 5);
```

### 示例音频曲目

```sql
INSERT INTO music_tracks (track_id, title, category_code, duration, audio_url, description) VALUES
('meditation_breath_01', '深度呼吸练习', 'meditation', 600, '/audio/meditation/breath_01.mp3', '通过引导进行深度呼吸，缓解紧张'),
('nature_forest_01', '森林漫步', 'nature', 900, '/audio/nature/forest_01.mp3', '森林中的鸟鸣和风声'),
('nature_ocean_01', '海浪声', 'nature', 1200, '/audio/nature/ocean_01.mp3', '平静的海浪拍打声'),
('music_piano_01', '轻柔钢琴曲', 'music', 1800, '/audio/music/piano_01.mp3', '舒缓的钢琴演奏'),
('sleep_white_noise', '白噪音', 'sleep', 3600, '/audio/sleep/white_noise.mp3', '有助于入睡的白噪音');
```

---

## 触发器

### 更新收藏计数

```sql
-- 当用户收藏时，更新曲目的收藏计数
CREATE OR REPLACE FUNCTION update_track_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE music_tracks 
    SET favorite_count = favorite_count + 1,
        updated_at = now()
    WHERE track_id = NEW.track_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE music_tracks 
    SET favorite_count = favorite_count - 1,
        updated_at = now()
    WHERE track_id = OLD.track_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_favorite_count
AFTER INSERT OR DELETE ON user_music_favorites
FOR EACH ROW
EXECUTE FUNCTION update_track_favorite_count();
```

### 更新播放计数

```sql
-- 当记录播放历史时，更新曲目播放计数
CREATE OR REPLACE FUNCTION update_track_play_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 只统计完成率>50%的播放
  IF NEW.completion_rate >= 50 THEN
    UPDATE music_tracks 
    SET play_count = play_count + 1,
        updated_at = now()
    WHERE track_id = NEW.track_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_play_count
AFTER INSERT ON user_music_history
FOR EACH ROW
EXECUTE FUNCTION update_track_play_count();
```

---

## 业务逻辑

### CDK兑换流程

```javascript
// 伪代码：CDK兑换逻辑
async function redeemCDK(code, userId) {
  // 1. 查询CDK信息
  const cdk = await queryCDKByCode(code);
  
  // 2. 验证CDK
  if (!cdk) throw new Error('兑换码不存在');
  if (cdk.status !== 'unused') throw new Error('兑换码已使用或已过期');
  if (cdk.expires_at && cdk.expires_at < new Date()) throw new Error('兑换码已过期');
  if (cdk.current_redeem_count >= cdk.max_redeem_count) throw new Error('兑换次数已达上限');
  
  // 3. 检查用户是否已兑换过
  const hasRedeemed = await checkUserRedeemed(userId, code);
  if (hasRedeemed) throw new Error('您已兑换过此码');
  
  // 4. 查询CDK类型配置
  const cdkType = await getCDKType(cdk.type_code);
  
  // 5. 发放权益
  const benefit = await grantBenefit(userId, cdkType);
  
  // 6. 更新CDK状态
  await updateCDKStatus(cdk.id, {
    current_redeem_count: cdk.current_redeem_count + 1,
    status: (cdk.current_redeem_count + 1) >= cdk.max_redeem_count ? 'used' : 'unused'
  });
  
  // 7. 记录兑换记录
  await createRedeemRecord({
    code_id: cdk.id,
    code: code,
    user_id: userId,
    type_code: cdk.type_code,
    benefit_granted: benefit,
    status: 'success'
  });
  
  return { success: true, benefit };
}
```

---

## 统计查询示例

### 1. CDK使用率统计

```sql
SELECT 
  t.type_code,
  t.type_name,
  COUNT(c.id) as total_generated,
  COUNT(c.id) FILTER (WHERE c.status = 'used') as used_count,
  COUNT(c.id) FILTER (WHERE c.status = 'expired') as expired_count,
  ROUND(COUNT(c.id) FILTER (WHERE c.status = 'used')::decimal / NULLIF(COUNT(c.id), 0) * 100, 2) as usage_rate
FROM cdk_types t
LEFT JOIN cdk_codes c ON c.type_code = t.type_code
GROUP BY t.type_code, t.type_name
ORDER BY total_generated DESC;
```

### 2. 热门音乐排行

```sql
SELECT 
  t.track_id,
  t.title,
  c.category_name,
  t.play_count,
  t.favorite_count,
  ROUND(t.favorite_count::decimal / NULLIF(t.play_count, 0) * 100, 2) as favorite_rate
FROM music_tracks t
JOIN music_categories c ON c.category_code = t.category_code
WHERE t.is_active = true
ORDER BY t.play_count DESC
LIMIT 20;
```

### 3. 用户音乐偏好分析

```sql
SELECT 
  u.id,
  u.nickname,
  c.category_name,
  COUNT(h.id) as play_count,
  SUM(h.play_duration) as total_duration,
  AVG(h.completion_rate) as avg_completion
FROM users u
JOIN user_music_history h ON h.user_id = u.id
JOIN music_tracks t ON t.track_id = h.track_id
JOIN music_categories c ON c.category_code = t.category_code
WHERE h.created_at >= now() - interval '30 days'
GROUP BY u.id, u.nickname, c.category_name
ORDER BY play_count DESC;
```

---

## CDN配置说明

### 音频文件CDN配置

```yaml
# CDN配置示例
cdn:
  provider: aliyun_oss  # 阿里云OSS
  bucket: craneheart-audio
  region: oss-cn-hangzhou
  domain: https://audio.craneheart.com
  
  # 音频文件路径规则
  paths:
    meditation: /audio/meditation/{track_id}.mp3
    nature: /audio/nature/{track_id}.mp3
    music: /audio/music/{track_id}.mp3
    sleep: /audio/sleep/{track_id}.mp3
  
  # 缓存策略
  cache:
    max_age: 2592000  # 30天
    
  # 防盗链
  referer:
    allow_empty: false
    whitelist:
      - https://craneheart.com
      - https://*.craneheart.com
```

### 音频文件命名规范

```
格式：{category}_{type}_{number}.{format}
示例：
  - meditation_breath_01.mp3  # 冥想-呼吸练习-01
  - nature_forest_01.mp3      # 自然-森林-01
  - music_piano_01.mp3        # 音乐-钢琴-01
```

---

## 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-18 | 初始版本，包含8个表（CDK 3个 + 音乐 5个） | 开发团队 |

---

**维护说明**: 
- CDK码定期检查过期状态
- 音频文件CDN配置需要定期优化
- 播放历史数据定期归档

