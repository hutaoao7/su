# community-comments API文档

## 基本信息

- **云函数名称**: `community-comments`
- **功能描述**: 社区评论功能（发表、查询、删除、点赞）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多20次请求

---

## 业务说明

本接口用于社区话题的评论管理，包括发表评论、查询评论列表、删除评论、点赞评论等功能。

### 功能特性
- 支持多级评论（评论+回复）
- 实时点赞/取消点赞
- 敏感词过滤
- 举报功能
- @提及用户

---

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| action | String | 是 | - | 操作类型 |
| topic_id | String | 否 | - | 话题ID |
| comment_id | String | 否 | - | 评论ID |
| content | String | 否 | - | 评论内容 |
| parent_id | String | 否 | null | 父评论ID（回复时使用） |
| reply_to_user_id | String | 否 | null | 回复的用户ID |
| page | Number | 否 | 1 | 页码 |
| page_size | Number | 否 | 20 | 每页数量 |

### 操作类型（action）

| 操作 | 值 | 说明 | 必需参数 |
|------|------|------|----------|
| 发表评论 | create | 发表新评论 | topic_id, content |
| 回复评论 | reply | 回复某条评论 | topic_id, content, parent_id |
| 查询评论 | list | 获取评论列表 | topic_id |
| 删除评论 | delete | 删除评论 | comment_id |
| 点赞评论 | like | 点赞/取消点赞 | comment_id |
| 举报评论 | report | 举报评论 | comment_id, reason |

---

## 请求示例

### 1. 发表评论

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-comments',
  data: {
    action: 'create',
    topic_id: 'topic_xxx',
    content: '这个话题很有意思！'
  }
});
```

### 2. 回复评论

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-comments',
  data: {
    action: 'reply',
    topic_id: 'topic_xxx',
    content: '@小明 我也这么认为',
    parent_id: 'comment_xxx',
    reply_to_user_id: 'user_123'
  }
});
```

### 3. 查询评论列表

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-comments',
  data: {
    action: 'list',
    topic_id: 'topic_xxx',
    page: 1,
    page_size: 20
  }
});
```

### 4. 删除评论

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-comments',
  data: {
    action: 'delete',
    comment_id: 'comment_xxx'
  }
});
```

### 5. 点赞评论

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-comments',
  data: {
    action: 'like',
    comment_id: 'comment_xxx'
  }
});
```

### 6. 举报评论

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-comments',
  data: {
    action: 'report',
    comment_id: 'comment_xxx',
    reason: 'spam' // spam/offensive/inappropriate/other
  }
});
```

---

## 响应数据

### 成功响应

**1. 发表评论成功**
```javascript
{
  "code": 200,
  "message": "评论发表成功",
  "data": {
    "comment_id": "comment_xxx",
    "topic_id": "topic_xxx",
    "content": "这个话题很有意思！",
    "user": {
      "user_id": "user_123",
      "nickname": "小明",
      "avatar_url": "https://..."
    },
    "like_count": 0,
    "reply_count": 0,
    "is_liked": false,
    "created_at": "2025-10-20T12:00:00Z"
  }
}
```

**2. 查询评论列表成功**
```javascript
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "total": 156,
    "page": 1,
    "page_size": 20,
    "total_pages": 8,
    "comments": [
      {
        "comment_id": "comment_001",
        "content": "很有帮助！",
        "user": {
          "user_id": "user_123",
          "nickname": "小明",
          "avatar_url": "https://..."
        },
        "like_count": 15,
        "reply_count": 3,
        "is_liked": false,
        "replies": [
          {
            "comment_id": "comment_002",
            "content": "@小明 同感",
            "user": { ... },
            "reply_to_user": {
              "user_id": "user_123",
              "nickname": "小明"
            },
            "created_at": "2025-10-20T12:05:00Z"
          }
        ],
        "created_at": "2025-10-20T12:00:00Z"
      }
    ]
  }
}
```

**3. 点赞成功**
```javascript
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "comment_id": "comment_xxx",
    "is_liked": true,
    "like_count": 16
  }
}
```

### 错误响应

**1. 内容为空**
```javascript
{
  "code": 400,
  "message": "评论内容不能为空",
  "data": null
}
```

**2. 内容过长**
```javascript
{
  "code": 400,
  "message": "评论内容不能超过500字符",
  "data": null
}
```

**3. 包含敏感词**
```javascript
{
  "code": 400,
  "message": "评论包含敏感词，请修改后重试",
  "data": {
    "sensitive_words": ["敏感词1", "敏感词2"]
  }
}
```

**4. 评论不存在**
```javascript
{
  "code": 404,
  "message": "评论不存在或已被删除",
  "data": null
}
```

**5. 无权限删除**
```javascript
{
  "code": 403,
  "message": "无权限删除该评论",
  "data": null
}
```

---

## 数据库操作

### 相关表

**community_comments表**
```sql
CREATE TABLE community_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id VARCHAR(100) UNIQUE NOT NULL,
  topic_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  parent_id VARCHAR(100), -- 父评论ID（回复时使用）
  reply_to_user_id VARCHAR(100), -- 回复的用户ID
  like_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (topic_id) REFERENCES community_topics(topic_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (parent_id) REFERENCES community_comments(comment_id)
);

-- 索引
CREATE INDEX idx_comments_topic_id ON community_comments(topic_id);
CREATE INDEX idx_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_comments_parent_id ON community_comments(parent_id);
CREATE INDEX idx_comments_created_at ON community_comments(created_at DESC);
```

**community_comment_likes表**
```sql
CREATE TABLE community_comment_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (comment_id) REFERENCES community_comments(comment_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(comment_id, user_id)
);

-- 索引
CREATE INDEX idx_comment_likes_comment_id ON community_comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON community_comment_likes(user_id);
```

**community_comment_reports表**
```sql
CREATE TABLE community_comment_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id VARCHAR(100) NOT NULL,
  reporter_user_id VARCHAR(100) NOT NULL,
  reason VARCHAR(50) NOT NULL,
  detail TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  handled_by VARCHAR(100),
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (comment_id) REFERENCES community_comments(comment_id),
  FOREIGN KEY (reporter_user_id) REFERENCES users(user_id)
);
```

---

## 业务逻辑

### 1. 发表评论

```javascript
async function createComment(data, userId) {
  // 1. 参数校验
  if (!data.content || data.content.trim() === '') {
    throw new Error('评论内容不能为空');
  }
  
  if (data.content.length > 500) {
    throw new Error('评论内容不能超过500字符');
  }
  
  // 2. 敏感词过滤
  const sensitiveWords = checkSensitiveWords(data.content);
  if (sensitiveWords.length > 0) {
    return {
      code: 400,
      message: '评论包含敏感词，请修改后重试',
      data: { sensitive_words: sensitiveWords }
    };
  }
  
  // 3. 检查话题是否存在
  const topic = await db.collection('community_topics')
    .where({ topic_id: data.topic_id })
    .get();
  
  if (topic.data.length === 0) {
    throw new Error('话题不存在');
  }
  
  // 4. 插入评论
  const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.collection('community_comments').add({
    comment_id: commentId,
    topic_id: data.topic_id,
    user_id: userId,
    content: data.content,
    parent_id: data.parent_id || null,
    reply_to_user_id: data.reply_to_user_id || null,
    created_at: new Date()
  });
  
  // 5. 更新话题评论数
  await db.collection('community_topics')
    .where({ topic_id: data.topic_id })
    .update({
      comment_count: db.command.inc(1),
      updated_at: new Date()
    });
  
  // 6. 更新父评论回复数
  if (data.parent_id) {
    await db.collection('community_comments')
      .where({ comment_id: data.parent_id })
      .update({
        reply_count: db.command.inc(1),
        updated_at: new Date()
      });
  }
  
  // 7. 发送通知（异步）
  if (data.reply_to_user_id) {
    sendNotification(data.reply_to_user_id, 'comment_reply', {
      comment_id: commentId,
      from_user_id: userId
    });
  }
  
  // 8. 返回结果
  const comment = await getCommentDetail(commentId);
  return {
    code: 200,
    message: '评论发表成功',
    data: comment
  };
}
```

### 2. 查询评论列表

```javascript
async function getCommentList(topicId, page, pageSize, userId) {
  const offset = (page - 1) * pageSize;
  
  // 1. 查询顶级评论
  const comments = await db.collection('community_comments')
    .aggregate()
    .match({
      topic_id: topicId,
      parent_id: null,
      is_deleted: false
    })
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(pageSize)
    .lookup({
      from: 'users',
      localField: 'user_id',
      foreignField: 'user_id',
      as: 'user'
    })
    .end();
  
  // 2. 查询每条评论的回复（最多3条）
  for (let comment of comments.list) {
    const replies = await db.collection('community_comments')
      .aggregate()
      .match({
        parent_id: comment.comment_id,
        is_deleted: false
      })
      .sort({ created_at: 1 })
      .limit(3)
      .lookup({
        from: 'users',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'user'
      })
      .end();
    
    comment.replies = replies.list;
  }
  
  // 3. 查询当前用户的点赞状态
  if (userId) {
    const commentIds = comments.list.map(c => c.comment_id);
    const likes = await db.collection('community_comment_likes')
      .where({
        comment_id: db.command.in(commentIds),
        user_id: userId
      })
      .get();
    
    const likedCommentIds = new Set(likes.data.map(l => l.comment_id));
    
    comments.list.forEach(comment => {
      comment.is_liked = likedCommentIds.has(comment.comment_id);
    });
  }
  
  // 4. 统计总数
  const total = await db.collection('community_comments')
    .where({
      topic_id: topicId,
      parent_id: null,
      is_deleted: false
    })
    .count();
  
  return {
    code: 200,
    data: {
      total: total.total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total.total / pageSize),
      comments: comments.list
    }
  };
}
```

### 3. 点赞/取消点赞

```javascript
async function toggleLike(commentId, userId) {
  // 1. 检查是否已点赞
  const existing = await db.collection('community_comment_likes')
    .where({
      comment_id: commentId,
      user_id: userId
    })
    .get();
  
  let isLiked = false;
  let likeCount = 0;
  
  if (existing.data.length > 0) {
    // 取消点赞
    await db.collection('community_comment_likes')
      .where({
        comment_id: commentId,
        user_id: userId
      })
      .remove();
    
    await db.collection('community_comments')
      .where({ comment_id: commentId })
      .update({
        like_count: db.command.inc(-1)
      });
    
    isLiked = false;
  } else {
    // 点赞
    await db.collection('community_comment_likes').add({
      comment_id: commentId,
      user_id: userId,
      created_at: new Date()
    });
    
    await db.collection('community_comments')
      .where({ comment_id: commentId })
      .update({
        like_count: db.command.inc(1)
      });
    
    isLiked = true;
  }
  
  // 获取最新点赞数
  const comment = await db.collection('community_comments')
    .where({ comment_id: commentId })
    .get();
  
  likeCount = comment.data[0].like_count;
  
  return {
    code: 200,
    message: isLiked ? '点赞成功' : '取消点赞成功',
    data: {
      comment_id: commentId,
      is_liked: isLiked,
      like_count: likeCount
    }
  };
}
```

### 4. 删除评论

```javascript
async function deleteComment(commentId, userId) {
  // 1. 查询评论
  const comment = await db.collection('community_comments')
    .where({ comment_id: commentId })
    .get();
  
  if (comment.data.length === 0) {
    throw new Error('评论不存在或已被删除');
  }
  
  // 2. 权限验证（只能删除自己的评论）
  if (comment.data[0].user_id !== userId) {
    throw new Error('无权限删除该评论');
  }
  
  // 3. 软删除
  await db.collection('community_comments')
    .where({ comment_id: commentId })
    .update({
      is_deleted: true,
      deleted_at: new Date()
    });
  
  // 4. 更新话题评论数
  await db.collection('community_topics')
    .where({ topic_id: comment.data[0].topic_id })
    .update({
      comment_count: db.command.inc(-1)
    });
  
  return {
    code: 200,
    message: '删除成功',
    data: null
  };
}
```

---

## 前端集成示例

```vue
<template>
  <view class="comments-section">
    <!-- 评论列表 -->
    <view class="comment-list">
      <view 
        v-for="comment in comments" 
        :key="comment.comment_id"
        class="comment-item"
      >
        <!-- 用户信息 -->
        <view class="comment-header">
          <image :src="comment.user.avatar_url" class="avatar" />
          <text class="nickname">{{ comment.user.nickname }}</text>
          <text class="time">{{ formatTime(comment.created_at) }}</text>
        </view>
        
        <!-- 评论内容 -->
        <view class="comment-content">
          {{ comment.content }}
        </view>
        
        <!-- 操作按钮 -->
        <view class="comment-actions">
          <view @click="handleLike(comment)" class="action-item">
            <u-icon :name="comment.is_liked ? 'heart-fill' : 'heart'" />
            <text>{{ comment.like_count }}</text>
          </view>
          
          <view @click="handleReply(comment)" class="action-item">
            <u-icon name="chat" />
            <text>回复</text>
          </view>
          
          <view 
            v-if="comment.user_id === currentUserId"
            @click="handleDelete(comment)"
            class="action-item"
          >
            <u-icon name="trash" />
            <text>删除</text>
          </view>
        </view>
        
        <!-- 回复列表 -->
        <view v-if="comment.replies && comment.replies.length > 0" class="replies">
          <view 
            v-for="reply in comment.replies"
            :key="reply.comment_id"
            class="reply-item"
          >
            <text class="reply-user">{{ reply.user.nickname }}</text>
            <text v-if="reply.reply_to_user">回复</text>
            <text v-if="reply.reply_to_user" class="reply-to">
              @{{ reply.reply_to_user.nickname }}
            </text>
            <text>：{{ reply.content }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 评论输入框 -->
    <view class="comment-input-wrapper">
      <u-input 
        v-model="commentContent"
        placeholder="发表评论..."
        :maxlength="500"
      />
      <u-button @click="handleSubmit" size="small">发送</u-button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      topicId: '',
      comments: [],
      commentContent: '',
      currentUserId: '',
      replyTo: null, // 回复的评论
      page: 1,
      loading: false
    };
  },
  
  async onLoad(options) {
    this.topicId = options.topicId;
    this.currentUserId = uni.getStorageSync('user_info').user_id;
    await this.loadComments();
  },
  
  methods: {
    // 加载评论列表
    async loadComments() {
      if (this.loading) return;
      this.loading = true;
      
      try {
        const { result } = await uniCloud.callFunction({
          name: 'community-comments',
          data: {
            action: 'list',
            topic_id: this.topicId,
            page: this.page,
            page_size: 20
          }
        });
        
        if (result.code === 200) {
          if (this.page === 1) {
            this.comments = result.data.comments;
          } else {
            this.comments.push(...result.data.comments);
          }
        }
      } catch (error) {
        console.error('加载评论失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 发表评论
    async handleSubmit() {
      if (!this.commentContent.trim()) {
        uni.showToast({ title: '请输入评论内容', icon: 'none' });
        return;
      }
      
      try {
        const data = {
          action: this.replyTo ? 'reply' : 'create',
          topic_id: this.topicId,
          content: this.commentContent
        };
        
        if (this.replyTo) {
          data.parent_id = this.replyTo.comment_id;
          data.reply_to_user_id = this.replyTo.user_id;
        }
        
        const { result } = await uniCloud.callFunction({
          name: 'community-comments',
          data
        });
        
        if (result.code === 200) {
          uni.showToast({ title: '发表成功', icon: 'success' });
          this.commentContent = '';
          this.replyTo = null;
          
          // 重新加载评论
          this.page = 1;
          await this.loadComments();
        } else {
          uni.showToast({ title: result.message, icon: 'none' });
        }
      } catch (error) {
        console.error('发表评论失败:', error);
        uni.showToast({ title: '发表失败', icon: 'none' });
      }
    },
    
    // 点赞
    async handleLike(comment) {
      try {
        const { result } = await uniCloud.callFunction({
          name: 'community-comments',
          data: {
            action: 'like',
            comment_id: comment.comment_id
          }
        });
        
        if (result.code === 200) {
          comment.is_liked = result.data.is_liked;
          comment.like_count = result.data.like_count;
        }
      } catch (error) {
        console.error('点赞失败:', error);
      }
    },
    
    // 回复
    handleReply(comment) {
      this.replyTo = comment;
      this.commentContent = `@${comment.user.nickname} `;
    },
    
    // 删除
    async handleDelete(comment) {
      const confirm = await uni.showModal({
        title: '确认删除',
        content: '确定要删除这条评论吗？'
      });
      
      if (!confirm.confirm) return;
      
      try {
        const { result } = await uniCloud.callFunction({
          name: 'community-comments',
          data: {
            action: 'delete',
            comment_id: comment.comment_id
          }
        });
        
        if (result.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' });
          
          // 从列表中移除
          const index = this.comments.findIndex(c => c.comment_id === comment.comment_id);
          if (index > -1) {
            this.comments.splice(index, 1);
          }
        } else {
          uni.showToast({ title: result.message, icon: 'none' });
        }
      } catch (error) {
        console.error('删除失败:', error);
        uni.showToast({ title: '删除失败', icon: 'none' });
      }
    },
    
    // 格式化时间
    formatTime(time) {
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
      return `${Math.floor(diff / 86400000)}天前`;
    }
  }
};
</script>
```

---

## 性能优化

### 1. 评论列表分页加载
- 首屏加载20条
- 下拉加载更多
- 虚拟滚动优化

### 2. 回复懒加载
- 默认显示前3条回复
- 点击"查看更多"加载全部

### 3. 点赞状态缓存
- Redis缓存用户点赞列表
- 减少数据库查询

---

## 监控指标

- 评论发表成功率
- 平均响应时间
- 敏感词拦截率
- 举报处理效率

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2025-10-20 | 初始版本 |

---

**文档维护**: CraneHeart开发团队  
**最后更新**: 2025-10-20

