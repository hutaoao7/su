-- ============================================================================
-- 数据库迁移脚本：社区相关表
-- 版本：v1.0.0
-- 创建日期：2025-10-18
-- 描述：创建community_topics、community_comments、community_likes、community_reports表
-- ============================================================================

-- ============================================================================
-- 1. 创建community_topics表（话题）
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title varchar(200) NOT NULL,
  content text NOT NULL,
  category varchar(50),
  images jsonb DEFAULT '[]'::jsonb,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  views_count int DEFAULT 0,
  likes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  status varchar(20) DEFAULT 'published',
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_community_topics_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_community_topics_status CHECK (status IN ('draft', 'published', 'hidden', 'deleted'))
);

COMMENT ON TABLE community_topics IS '社区话题表';
COMMENT ON COLUMN community_topics.is_pinned IS '是否置顶';
COMMENT ON COLUMN community_topics.is_locked IS '是否锁定（禁止评论）';

CREATE INDEX IF NOT EXISTS idx_community_topics_user_id ON community_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_community_topics_category ON community_topics(category);
CREATE INDEX IF NOT EXISTS idx_community_topics_status ON community_topics(status);
CREATE INDEX IF NOT EXISTS idx_community_topics_is_pinned ON community_topics(is_pinned);
CREATE INDEX IF NOT EXISTS idx_community_topics_published_at ON community_topics(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_topics_created_at ON community_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_topics_views_count ON community_topics(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_topics_likes_count ON community_topics(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_topics_content_fts ON community_topics USING GIN (to_tsvector('chinese', title || ' ' || content));

-- ============================================================================
-- 2. 创建community_comments表（评论）
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_comment_id uuid,
  content text NOT NULL,
  likes_count int DEFAULT 0,
  floor_number int,
  status varchar(20) DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_community_comments_topic_id FOREIGN KEY (topic_id) REFERENCES community_topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_community_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_community_comments_parent_comment_id FOREIGN KEY (parent_comment_id) REFERENCES community_comments(id) ON DELETE CASCADE,
  CONSTRAINT check_community_comments_status CHECK (status IN ('published', 'hidden', 'deleted'))
);

COMMENT ON TABLE community_comments IS '社区评论表';
COMMENT ON COLUMN community_comments.floor_number IS '楼层号';
COMMENT ON COLUMN community_comments.parent_comment_id IS '父评论ID（用于嵌套回复）';

CREATE INDEX IF NOT EXISTS idx_community_comments_topic_id ON community_comments(topic_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_comment_id ON community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_status ON community_comments(status);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON community_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_topic_created ON community_comments(topic_id, created_at ASC);

-- ============================================================================
-- 3. 创建community_likes表（点赞）
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  target_type varchar(20) NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_community_likes_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_community_likes_target_type CHECK (target_type IN ('topic', 'comment'))
);

COMMENT ON TABLE community_likes IS '社区点赞表';
COMMENT ON COLUMN community_likes.target_type IS '点赞对象类型（topic/comment）';
COMMENT ON COLUMN community_likes.target_id IS '点赞对象ID';

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_likes_unique ON community_likes(user_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_id ON community_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_target ON community_likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_created_at ON community_likes(created_at DESC);

-- ============================================================================
-- 4. 创建community_reports表（举报）
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  target_type varchar(20) NOT NULL,
  target_id uuid NOT NULL,
  report_reason varchar(50) NOT NULL,
  report_detail text,
  status varchar(20) DEFAULT 'pending',
  handled_by uuid,
  handled_at timestamptz,
  handle_result text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_community_reports_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_community_reports_target_type CHECK (target_type IN ('topic', 'comment')),
  CONSTRAINT check_community_reports_status CHECK (status IN ('pending', 'processing', 'resolved', 'rejected'))
);

COMMENT ON TABLE community_reports IS '社区举报表';
COMMENT ON COLUMN community_reports.report_reason IS '举报原因（spam/inappropriate/harassment/other）';

CREATE INDEX IF NOT EXISTS idx_community_reports_user_id ON community_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_target ON community_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_created_at ON community_reports(created_at DESC);

-- ============================================================================
-- 创建触发器：自动更新话题评论计数
-- ============================================================================

CREATE OR REPLACE FUNCTION update_topic_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE community_topics 
    SET comments_count = comments_count + 1,
        updated_at = now()
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'deleted') THEN
    UPDATE community_topics 
    SET comments_count = GREATEST(comments_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.topic_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_comments ON community_comments;
CREATE TRIGGER trigger_update_topic_comments
AFTER INSERT OR UPDATE OR DELETE ON community_comments
FOR EACH ROW
EXECUTE FUNCTION update_topic_comments_count();

-- ============================================================================
-- 验证数据
-- ============================================================================

SELECT '✅ 社区相关表迁移完成' as status;


