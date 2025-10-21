-- 创建user_mentions表 - 用户@提醒记录表
-- 用于记录评论中的@提醒，支持提醒查询、标记已读等功能

CREATE TABLE IF NOT EXISTS user_mentions (
  id BIGSERIAL PRIMARY KEY,
  
  -- 评论信息
  comment_id BIGINT NOT NULL,
  topic_id BIGINT NOT NULL,
  
  -- @用户信息
  mentioned_user_id VARCHAR(50) NOT NULL,
  mentioned_by_user_id VARCHAR(50) NOT NULL,
  mentioned_by_user_name VARCHAR(100),
  mentioned_by_avatar VARCHAR(500),
  
  -- 评论内容（用于通知显示）
  comment_content TEXT,
  comment_preview VARCHAR(200),
  topic_title VARCHAR(200),
  
  -- 提醒状态
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_mentions_user_read 
  ON user_mentions(mentioned_user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_mentions_comment 
  ON user_mentions(comment_id);

CREATE INDEX IF NOT EXISTS idx_user_mentions_topic 
  ON user_mentions(topic_id);

CREATE INDEX IF NOT EXISTS idx_user_mentions_created 
  ON user_mentions(created_at DESC);

-- 添加表注释
COMMENT ON TABLE user_mentions IS '用户@提醒记录表';
COMMENT ON COLUMN user_mentions.id IS '提醒ID';
COMMENT ON COLUMN user_mentions.comment_id IS '评论ID';
COMMENT ON COLUMN user_mentions.topic_id IS '话题ID';
COMMENT ON COLUMN user_mentions.mentioned_user_id IS '被@的用户ID';
COMMENT ON COLUMN user_mentions.mentioned_by_user_id IS '@发起人ID';
COMMENT ON COLUMN user_mentions.mentioned_by_user_name IS '@发起人昵称';
COMMENT ON COLUMN user_mentions.mentioned_by_avatar IS '@发起人头像';
COMMENT ON COLUMN user_mentions.comment_content IS '评论完整内容';
COMMENT ON COLUMN user_mentions.comment_preview IS '评论内容预览（前200字符）';
COMMENT ON COLUMN user_mentions.topic_title IS '话题标题';
COMMENT ON COLUMN user_mentions.is_read IS '是否已读';
COMMENT ON COLUMN user_mentions.read_at IS '标记已读的时间';
COMMENT ON COLUMN user_mentions.created_at IS '提醒创建时间';
COMMENT ON COLUMN user_mentions.updated_at IS '提醒更新时间';

