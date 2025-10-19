-- ============================================================================
-- 数据库迁移脚本：音乐相关表
-- 版本：v1.0.0
-- 创建日期：2025-10-18
-- 描述：创建music_categories、music_tracks、music_playlists、user_music_favorites、user_music_history表
-- ============================================================================

-- ============================================================================
-- 1. 创建music_categories表（音乐分类）
-- ============================================================================

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

COMMENT ON TABLE music_categories IS '音乐分类表';

CREATE UNIQUE INDEX IF NOT EXISTS idx_music_categories_code ON music_categories(category_code);
CREATE INDEX IF NOT EXISTS idx_music_categories_sort_order ON music_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_music_categories_is_active ON music_categories(is_active);

-- ============================================================================
-- 2. 创建music_tracks表（音频曲目）
-- ============================================================================

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

COMMENT ON TABLE music_tracks IS '音频曲目表';
COMMENT ON COLUMN music_tracks.duration IS '时长（秒）';

CREATE UNIQUE INDEX IF NOT EXISTS idx_music_tracks_track_id ON music_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_music_tracks_category ON music_tracks(category_code);
CREATE INDEX IF NOT EXISTS idx_music_tracks_is_premium ON music_tracks(is_premium);
CREATE INDEX IF NOT EXISTS idx_music_tracks_is_active ON music_tracks(is_active);
CREATE INDEX IF NOT EXISTS idx_music_tracks_play_count ON music_tracks(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_music_tracks_tags ON music_tracks USING GIN (tags);

-- ============================================================================
-- 3. 创建music_playlists表（播放列表）
-- ============================================================================

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

COMMENT ON TABLE music_playlists IS '播放列表表';

CREATE INDEX IF NOT EXISTS idx_music_playlists_user_id ON music_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_music_playlists_is_public ON music_playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_music_playlists_track_ids ON music_playlists USING GIN (track_ids);
CREATE INDEX IF NOT EXISTS idx_music_playlists_created_at ON music_playlists(created_at DESC);

-- ============================================================================
-- 4. 创建user_music_favorites表（用户收藏）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_music_favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  track_id varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_user_music_favorites_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_music_favorites_track_id FOREIGN KEY (track_id) REFERENCES music_tracks(track_id) ON DELETE CASCADE
);

COMMENT ON TABLE user_music_favorites IS '用户收藏表';

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_music_favorites_unique ON user_music_favorites(user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_user_music_favorites_user_id ON user_music_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_music_favorites_track_id ON user_music_favorites(track_id);
CREATE INDEX IF NOT EXISTS idx_user_music_favorites_created_at ON user_music_favorites(created_at DESC);

-- ============================================================================
-- 5. 创建user_music_history表（播放历史）
-- ============================================================================

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

COMMENT ON TABLE user_music_history IS '播放历史表';

CREATE INDEX IF NOT EXISTS idx_user_music_history_user_id ON user_music_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_music_history_track_id ON user_music_history(track_id);
CREATE INDEX IF NOT EXISTS idx_user_music_history_created_at ON user_music_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_music_history_user_created ON user_music_history(user_id, created_at DESC);

-- ============================================================================
-- 创建触发器：更新收藏计数
-- ============================================================================

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

DROP TRIGGER IF EXISTS trigger_update_favorite_count ON user_music_favorites;
CREATE TRIGGER trigger_update_favorite_count
AFTER INSERT OR DELETE ON user_music_favorites
FOR EACH ROW
EXECUTE FUNCTION update_track_favorite_count();

-- ============================================================================
-- 插入音乐分类
-- ============================================================================

INSERT INTO music_categories (category_code, category_name, description, sort_order) VALUES
('meditation', '冥想引导', '专业的冥想引导音频', 1),
('nature', '自然音效', '大自然的声音，帮助放松', 2),
('music', '放松音乐', '舒缓的背景音乐', 3),
('sleep', '助眠音乐', '帮助入睡的专门音乐', 4),
('focus', '专注音乐', '提升专注力的背景音乐', 5)
ON CONFLICT (category_code) DO NOTHING;

-- 插入示例音频曲目
INSERT INTO music_tracks (track_id, title, category_code, duration, audio_url, description) VALUES
('meditation_breath_01', '深度呼吸练习', 'meditation', 600, '/audio/meditation/breath_01.mp3', '通过引导进行深度呼吸，缓解紧张'),
('nature_forest_01', '森林漫步', 'nature', 900, '/audio/nature/forest_01.mp3', '森林中的鸟鸣和风声'),
('nature_ocean_01', '海浪声', 'nature', 1200, '/audio/nature/ocean_01.mp3', '平静的海浪拍打声'),
('music_piano_01', '轻柔钢琴曲', 'music', 1800, '/audio/music/piano_01.mp3', '舒缓的钢琴演奏'),
('sleep_white_noise', '白噪音', 'sleep', 3600, '/audio/sleep/white_noise.mp3', '有助于入睡的白噪音')
ON CONFLICT (track_id) DO NOTHING;

-- ============================================================================
-- 验证数据
-- ============================================================================

SELECT '✅ 音乐相关表迁移完成' as status;

SELECT 
  'music_categories' as table_name,
  COUNT(*) as record_count
FROM music_categories
UNION ALL
SELECT 
  'music_tracks',
  COUNT(*)
FROM music_tracks;


