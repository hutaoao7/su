-- ============================================================================
-- 社区收藏和分享功能数据库迁移脚本
-- 文件: 012_create_community_favorites_shares.sql
-- 创建时间: 2025-10-22
-- 描述: 创建社区收藏表、分享记录表、用户推荐表
-- ============================================================================

-- ============================================================================
-- 1. 创建community_favorites表（收藏）
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  target_type varchar(20) NOT NULL,
  target_id uuid NOT NULL,
  folder_name varchar(50) DEFAULT 'default',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_community_favorites_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_community_favorites_target_type CHECK (target_type IN ('topic', 'comment'))
);

COMMENT ON TABLE community_favorites IS '社区收藏表';
COMMENT ON COLUMN community_favorites.user_id IS '收藏用户ID';
COMMENT ON COLUMN community_favorites.target_type IS '收藏对象类型（topic/comment）';
COMMENT ON COLUMN community_favorites.target_id IS '收藏对象ID';
COMMENT ON COLUMN community_favorites.folder_name IS '收藏夹名称（支持分类收藏）';
COMMENT ON COLUMN community_favorites.notes IS '收藏备注';

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_favorites_unique ON community_favorites(user_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_favorites_user_id ON community_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_community_favorites_target ON community_favorites(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_favorites_folder ON community_favorites(user_id, folder_name);
CREATE INDEX IF NOT EXISTS idx_community_favorites_created_at ON community_favorites(created_at DESC);

-- ============================================================================
-- 2. 创建community_shares表（分享记录）
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  target_type varchar(20) NOT NULL,
  target_id uuid NOT NULL,
  share_platform varchar(50) NOT NULL,
  share_method varchar(50),
  ip_address varchar(50),
  user_agent text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_community_shares_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_community_shares_target_type CHECK (target_type IN ('topic', 'comment')),
  CONSTRAINT check_community_shares_platform CHECK (share_platform IN ('wechat', 'moments', 'qq', 'weibo', 'link', 'image', 'other'))
);

COMMENT ON TABLE community_shares IS '社区分享记录表';
COMMENT ON COLUMN community_shares.user_id IS '分享用户ID';
COMMENT ON COLUMN community_shares.target_type IS '分享对象类型（topic/comment）';
COMMENT ON COLUMN community_shares.target_id IS '分享对象ID';
COMMENT ON COLUMN community_shares.share_platform IS '分享平台（wechat/moments/qq/weibo/link/image/other）';
COMMENT ON COLUMN community_shares.share_method IS '分享方式（小程序码/链接/图片等）';
COMMENT ON COLUMN community_shares.ip_address IS '分享时的IP地址';
COMMENT ON COLUMN community_shares.user_agent IS '用户代理信息';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_community_shares_user_id ON community_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_community_shares_target ON community_shares(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_shares_platform ON community_shares(share_platform);
CREATE INDEX IF NOT EXISTS idx_community_shares_created_at ON community_shares(created_at DESC);

-- ============================================================================
-- 3. 创建user_recommendations表（用户推荐）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_recommendations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  target_type varchar(20) NOT NULL,
  target_id uuid NOT NULL,
  recommendation_score decimal(5,2) NOT NULL,
  recommendation_reason jsonb DEFAULT '{}'::jsonb,
  is_shown boolean DEFAULT false,
  shown_at timestamptz,
  is_clicked boolean DEFAULT false,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  
  CONSTRAINT fk_user_recommendations_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_user_recommendations_target_type CHECK (target_type IN ('topic', 'user', 'music')),
  CONSTRAINT check_user_recommendations_score CHECK (recommendation_score >= 0 AND recommendation_score <= 100)
);

COMMENT ON TABLE user_recommendations IS '用户推荐表';
COMMENT ON COLUMN user_recommendations.user_id IS '推荐给的用户ID';
COMMENT ON COLUMN user_recommendations.target_type IS '推荐对象类型（topic/user/music）';
COMMENT ON COLUMN user_recommendations.target_id IS '推荐对象ID';
COMMENT ON COLUMN user_recommendations.recommendation_score IS '推荐分数（0-100）';
COMMENT ON COLUMN user_recommendations.recommendation_reason IS '推荐理由（JSON格式，包含标签、相似度等）';
COMMENT ON COLUMN user_recommendations.is_shown IS '是否已展示给用户';
COMMENT ON COLUMN user_recommendations.shown_at IS '展示时间';
COMMENT ON COLUMN user_recommendations.is_clicked IS '是否已点击';
COMMENT ON COLUMN user_recommendations.clicked_at IS '点击时间';
COMMENT ON COLUMN user_recommendations.expires_at IS '推荐过期时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_target ON user_recommendations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_score ON user_recommendations(recommendation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_active ON user_recommendations(user_id, is_shown, expires_at) WHERE is_shown = false AND (expires_at IS NULL OR expires_at > now());
CREATE INDEX IF NOT EXISTS idx_user_recommendations_created_at ON user_recommendations(created_at DESC);

-- ============================================================================
-- 4. 创建user_interests表（用户兴趣标签）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  interest_type varchar(50) NOT NULL,
  interest_value varchar(100) NOT NULL,
  weight decimal(5,2) DEFAULT 1.0,
  source varchar(50),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_user_interests_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_user_interests_type CHECK (interest_type IN ('category', 'tag', 'keyword', 'author', 'music_genre')),
  CONSTRAINT check_user_interests_weight CHECK (weight >= 0 AND weight <= 10)
);

COMMENT ON TABLE user_interests IS '用户兴趣标签表';
COMMENT ON COLUMN user_interests.user_id IS '用户ID';
COMMENT ON COLUMN user_interests.interest_type IS '兴趣类型（category/tag/keyword/author/music_genre）';
COMMENT ON COLUMN user_interests.interest_value IS '兴趣值（具体的分类、标签、关键词等）';
COMMENT ON COLUMN user_interests.weight IS '权重（0-10，越高表示越感兴趣）';
COMMENT ON COLUMN user_interests.source IS '来源（浏览/点赞/收藏/评论/搜索等）';

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_interests_unique ON user_interests(user_id, interest_type, interest_value);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_type ON user_interests(interest_type);
CREATE INDEX IF NOT EXISTS idx_user_interests_weight ON user_interests(weight DESC);
CREATE INDEX IF NOT EXISTS idx_user_interests_updated_at ON user_interests(updated_at DESC);

-- ============================================================================
-- 5. 更新community_topics表（添加收藏数和分享数字段）
-- ============================================================================

ALTER TABLE community_topics ADD COLUMN IF NOT EXISTS favorites_count int DEFAULT 0;
ALTER TABLE community_topics ADD COLUMN IF NOT EXISTS shares_count int DEFAULT 0;

COMMENT ON COLUMN community_topics.favorites_count IS '收藏数';
COMMENT ON COLUMN community_topics.shares_count IS '分享数';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_community_topics_favorites_count ON community_topics(favorites_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_topics_shares_count ON community_topics(shares_count DESC);

-- ============================================================================
-- 6. 创建触发器：自动更新收藏数
-- ============================================================================

CREATE OR REPLACE FUNCTION update_topic_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'topic' THEN
    UPDATE community_topics SET favorites_count = favorites_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'topic' THEN
    UPDATE community_topics SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_favorites_count ON community_favorites;
CREATE TRIGGER trigger_update_topic_favorites_count
AFTER INSERT OR DELETE ON community_favorites
FOR EACH ROW EXECUTE FUNCTION update_topic_favorites_count();

COMMENT ON FUNCTION update_topic_favorites_count() IS '自动更新话题收藏数';

-- ============================================================================
-- 7. 创建触发器：自动更新分享数
-- ============================================================================

CREATE OR REPLACE FUNCTION update_topic_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_type = 'topic' THEN
    UPDATE community_topics SET shares_count = shares_count + 1 WHERE id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_shares_count ON community_shares;
CREATE TRIGGER trigger_update_topic_shares_count
AFTER INSERT ON community_shares
FOR EACH ROW EXECUTE FUNCTION update_topic_shares_count();

COMMENT ON FUNCTION update_topic_shares_count() IS '自动更新话题分享数';

-- ============================================================================
-- 8. 创建触发器：自动更新用户兴趣权重
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_interest_weight()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_interest_weight ON user_interests;
CREATE TRIGGER trigger_update_user_interest_weight
BEFORE UPDATE ON user_interests
FOR EACH ROW EXECUTE FUNCTION update_user_interest_weight();

COMMENT ON FUNCTION update_user_interest_weight() IS '自动更新用户兴趣权重的更新时间';

-- ============================================================================
-- 9. 创建视图：用户收藏统计
-- ============================================================================

CREATE OR REPLACE VIEW v_user_favorites_stats AS
SELECT 
  user_id,
  COUNT(*) as total_favorites,
  COUNT(CASE WHEN target_type = 'topic' THEN 1 END) as topic_favorites,
  COUNT(CASE WHEN target_type = 'comment' THEN 1 END) as comment_favorites,
  COUNT(DISTINCT folder_name) as folder_count,
  MAX(created_at) as last_favorite_at
FROM community_favorites
GROUP BY user_id;

COMMENT ON VIEW v_user_favorites_stats IS '用户收藏统计视图';

-- ============================================================================
-- 10. 创建视图：话题热度排行（综合点赞、评论、收藏、分享）
-- ============================================================================

CREATE OR REPLACE VIEW v_topic_popularity AS
SELECT 
  id,
  title,
  user_id,
  category,
  views_count,
  likes_count,
  comments_count,
  favorites_count,
  shares_count,
  -- 热度分数计算：浏览*0.1 + 点赞*2 + 评论*3 + 收藏*5 + 分享*10
  (views_count * 0.1 + likes_count * 2 + comments_count * 3 + favorites_count * 5 + shares_count * 10) as popularity_score,
  created_at,
  published_at
FROM community_topics
WHERE status = 'published'
ORDER BY popularity_score DESC;

COMMENT ON VIEW v_topic_popularity IS '话题热度排行视图';

-- ============================================================================
-- 完成
-- ============================================================================

-- 输出完成信息
DO $$
BEGIN
  RAISE NOTICE '✅ 社区收藏和分享功能数据库迁移完成';
  RAISE NOTICE '   - community_favorites表（收藏）';
  RAISE NOTICE '   - community_shares表（分享记录）';
  RAISE NOTICE '   - user_recommendations表（用户推荐）';
  RAISE NOTICE '   - user_interests表（用户兴趣标签）';
  RAISE NOTICE '   - 更新community_topics表（添加收藏数和分享数）';
  RAISE NOTICE '   - 创建3个触发器（自动更新计数）';
  RAISE NOTICE '   - 创建2个视图（收藏统计和热度排行）';
END $$;

