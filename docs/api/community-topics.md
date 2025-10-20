# community-topics API文档

## 基本信息

- **云函数名称**: `community-topics`
- **功能描述**: 社区话题的完整CRUD操作（创建、查询、更新、删除、点赞）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 发布、编辑、删除需要Token验证
- **限流策略**: 
  - 发布话题：每用户每小时最多5个
  - 查询列表：每分钟最多30次
  - 点赞操作：每分钟最多20次

---

## 业务说明

本接口提供社区话题的完整生命周期管理，包括：
1. 话题发布与编辑
2. 话题列表查询（支持分类、搜索、排序）
3. 话题详情获取（含作者信息、点赞状态）
4. 话题点赞/取消点赞
5. 话题删除（仅作者和管理员）

### 业务流程
1. 用户登录后可发布话题
2. 话题经过内容审核后发布
3. 其他用户可查看、点赞、评论
4. 作者可编辑或删除自己的话题

---

## Action类型说明

| Action | 说明 | 认证 | 限流 |
|--------|------|------|------|
| list | 获取话题列表 | 否 | 30/min |
| detail | 获取话题详情 | 否 | 60/min |
| create | 创建话题 | 是 | 5/hour |
| update | 更新话题 | 是 | 10/hour |
| delete | 删除话题 | 是 | 10/hour |
| like | 点赞/取消点赞 | 是 | 20/min |

---

## 1. 获取话题列表 (list)

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| action | String | 是 | - | "list" |
| category | String | 否 | all | 分类（mood/experience/question/share/other） |
| sort | String | 否 | latest | 排序方式（latest/hot/pinned） |
| keyword | String | 否 | - | 搜索关键词（标题+内容） |
| page | Number | 否 | 1 | 页码 |
| page_size | Number | 否 | 10 | 每页数量（1-50） |

### 分类说明
- `all`: 全部（默认）
- `mood`: 心情分享
- `experience`: 经验交流
- `question`: 问题求助
- `share`: 资源分享
- `other`: 其他

### 排序说明
- `latest`: 最新发布（默认）
- `hot`: 热门话题（综合浏览、点赞、评论）
- `pinned`: 置顶优先

### 请求示例

```javascript
// 获取最新话题列表
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'list',
    page: 1,
    page_size: 10,
    sort: 'latest'
  }
});

// 获取特定分类的热门话题
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'list',
    category: 'mood',
    sort: 'hot',
    page: 1
  }
});

// 搜索话题
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'list',
    keyword: '压力',
    page: 1
  }
});
```

### 响应数据

```javascript
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [
      {
        "id": "topic-uuid-1",
        "title": "今天心情不错",
        "content": "分享一下我的好心情，阳光明媚的一天...",
        "content_preview": "分享一下我的好心情，阳光明媚的一天...", // 前100字
        "category": "mood",
        "images": [
          "https://cdn.example.com/images/photo1.jpg",
          "https://cdn.example.com/images/photo2.jpg"
        ],
        "author": {
          "user_id": "user-uuid-1",
          "nickname": "小明",
          "avatar_url": "https://cdn.example.com/avatar/user1.jpg"
        },
        "stats": {
          "views_count": 128,
          "likes_count": 15,
          "comments_count": 8
        },
        "is_pinned": false,
        "is_locked": false,
        "is_liked": false, // 当前用户是否点赞（需登录）
        "status": "published",
        "published_at": "2025-10-20T10:00:00Z",
        "created_at": "2025-10-20T09:55:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 156,
      "total_pages": 16,
      "has_more": true
    }
  }
}
```

---

## 2. 获取话题详情 (detail)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | "detail" |
| topic_id | String | 是 | 话题ID |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'detail',
    topic_id: 'topic-uuid-1'
  }
});
```

### 响应数据

```javascript
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": "topic-uuid-1",
    "title": "今天心情不错",
    "content": "完整的话题内容...",
    "category": "mood",
    "images": [
      "https://cdn.example.com/images/photo1.jpg"
    ],
    "author": {
      "user_id": "user-uuid-1",
      "nickname": "小明",
      "avatar_url": "https://cdn.example.com/avatar/user1.jpg",
      "bio": "热爱生活"
    },
    "stats": {
      "views_count": 129, // 自动+1
      "likes_count": 15,
      "comments_count": 8
    },
    "is_pinned": false,
    "is_locked": false,
    "is_liked": false,
    "is_author": false, // 是否是作者本人
    "status": "published",
    "published_at": "2025-10-20T10:00:00Z",
    "created_at": "2025-10-20T09:55:00Z",
    "updated_at": "2025-10-20T10:00:00Z"
  }
}
```

### 业务逻辑
- 查看话题详情时，`views_count` 自动+1
- 每个用户每个话题每天最多计数1次浏览

---

## 3. 创建话题 (create)

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| action | String | 是 | - | "create" |
| title | String | 是 | - | 话题标题（5-200字符） |
| content | String | 是 | - | 话题内容（10-5000字符） |
| category | String | 是 | - | 分类 |
| images | Array | 否 | [] | 图片URL数组（最多9张） |

### 参数校验规则

**title（标题）**
- 长度：5-200个字符
- 不允许包含特殊字符：`<>{}[]`
- 不允许包含敏感词
- 不允许纯数字或纯符号

**content（内容）**
- 长度：10-5000个字符
- 支持换行
- 自动过滤敏感词
- 禁止发布联系方式（手机号、QQ、微信等）

**images（图片）**
- 数组格式，最多9张
- 图片URL必须是HTTPS
- 支持格式：jpg、png、webp
- 建议尺寸：750x750以上

### 请求示例

```javascript
// 发布带图片的话题
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'create',
    title: '今天心情不错',
    content: '分享一下我的好心情，阳光明媚的一天，让我感到无比放松...',
    category: 'mood',
    images: [
      'https://cdn.example.com/images/photo1.jpg',
      'https://cdn.example.com/images/photo2.jpg'
    ]
  }
});

// 发布纯文字话题
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'create',
    title: '如何缓解学习压力？',
    content: '最近学习压力很大，想请教大家有什么好的方法...',
    category: 'question'
  }
});
```

### 响应数据

**成功响应**
```javascript
{
  "code": 200,
  "message": "话题发布成功",
  "data": {
    "topic_id": "topic-uuid-new",
    "title": "今天心情不错",
    "content": "分享一下我的好心情...",
    "category": "mood",
    "images": [...],
    "status": "published", // 或 "pending"（待审核）
    "created_at": "2025-10-20T12:00:00Z"
  }
}
```

### 内容审核
- 敏感词检测：自动替换为 `***`
- 违规内容：状态设为 `pending`，需人工审核
- 频繁发布：触发限流，提示稍后再试

---

## 4. 更新话题 (update)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | "update" |
| topic_id | String | 是 | 话题ID |
| title | String | 否 | 新标题 |
| content | String | 否 | 新内容 |
| category | String | 否 | 新分类 |
| images | Array | 否 | 新图片数组 |

### 权限校验
- 只有作者本人可以编辑
- 发布后2小时内可编辑
- 已被锁定的话题不可编辑

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'update',
    topic_id: 'topic-uuid-1',
    title: '今天心情特别好（更新）',
    content: '更新后的内容...'
  }
});
```

### 响应数据

```javascript
{
  "code": 200,
  "message": "话题更新成功",
  "data": {
    "topic_id": "topic-uuid-1",
    "updated_at": "2025-10-20T13:00:00Z"
  }
}
```

---

## 5. 删除话题 (delete)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | "delete" |
| topic_id | String | 是 | 话题ID |

### 权限校验
- 作者本人可删除
- 管理员可删除任何话题

### 删除逻辑
- 软删除：status 设为 "deleted"
- 关联评论、点赞数据保留
- 不再展示在列表中

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'delete',
    topic_id: 'topic-uuid-1'
  }
});
```

### 响应数据

```javascript
{
  "code": 200,
  "message": "话题已删除",
  "data": {
    "topic_id": "topic-uuid-1",
    "deleted_at": "2025-10-20T14:00:00Z"
  }
}
```

---

## 6. 点赞/取消点赞 (like)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | "like" |
| topic_id | String | 是 | 话题ID |

### 业务逻辑
- 首次调用：点赞
- 再次调用：取消点赞
- 自动切换状态

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'like',
    topic_id: 'topic-uuid-1'
  }
});
```

### 响应数据

```javascript
{
  "code": 200,
  "message": "点赞成功", // 或 "取消点赞"
  "data": {
    "topic_id": "topic-uuid-1",
    "is_liked": true, // 当前点赞状态
    "likes_count": 16 // 最新点赞数
  }
}
```

---

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 参数校验失败 | 检查请求参数格式 |
| 401 | 未登录 | 调用auth-login获取Token |
| 403 | 无权限操作 | 只能操作自己的话题 |
| 404 | 话题不存在 | 检查topic_id是否正确 |
| 409 | 重复操作 | 如重复点赞（已优化为切换） |
| 429 | 请求过于频繁 | 等待限流解除 |
| 500 | 服务器错误 | 稍后重试 |

### 详细错误示例

**1. 参数校验失败**
```javascript
{
  "code": 400,
  "message": "标题长度必须在5-200个字符之间",
  "data": {
    "field": "title",
    "value_length": 3
  }
}
```

**2. 未登录**
```javascript
{
  "code": 401,
  "message": "请先登录",
  "data": null
}
```

**3. 无权限**
```javascript
{
  "code": 403,
  "message": "只能编辑自己的话题",
  "data": {
    "topic_author": "user-uuid-1",
    "current_user": "user-uuid-2"
  }
}
```

**4. 话题不存在**
```javascript
{
  "code": 404,
  "message": "话题不存在或已被删除",
  "data": {
    "topic_id": "invalid-id"
  }
}
```

**5. 频率限制**
```javascript
{
  "code": 429,
  "message": "发布话题过于频繁，请稍后再试",
  "data": {
    "retry_after": 3600, // 秒
    "limit": "5次/小时"
  }
}
```

**6. 内容审核**
```javascript
{
  "code": 451,
  "message": "内容包含敏感词，已提交审核",
  "data": {
    "status": "pending",
    "reason": "sensitive_words"
  }
}
```

---

## 数据库设计

### community_topics表结构

```sql
CREATE TABLE community_topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL, -- 作者ID
  title varchar(200) NOT NULL, -- 标题
  content text NOT NULL, -- 内容
  category varchar(50), -- 分类
  images jsonb DEFAULT '[]'::jsonb, -- 图片数组
  is_pinned boolean DEFAULT false, -- 是否置顶
  is_locked boolean DEFAULT false, -- 是否锁定
  views_count int DEFAULT 0, -- 浏览数
  likes_count int DEFAULT 0, -- 点赞数
  comments_count int DEFAULT 0, -- 评论数
  status varchar(20) DEFAULT 'published', -- 状态
  published_at timestamptz DEFAULT now(), -- 发布时间
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_community_topics_user_id ON community_topics(user_id);
CREATE INDEX idx_community_topics_category ON community_topics(category);
CREATE INDEX idx_community_topics_status ON community_topics(status);
CREATE INDEX idx_community_topics_published_at ON community_topics(published_at DESC);
CREATE INDEX idx_community_topics_content_fts ON community_topics 
  USING GIN (to_tsvector('chinese', title || ' ' || content));
```

### 相关查询SQL

**1. 获取热门话题（综合排序）**
```sql
SELECT t.*, 
  (t.likes_count * 3 + t.comments_count * 2 + t.views_count * 0.1) AS hot_score
FROM community_topics t
WHERE t.status = 'published'
ORDER BY hot_score DESC, t.published_at DESC
LIMIT 10 OFFSET 0;
```

**2. 全文搜索**
```sql
SELECT t.*
FROM community_topics t
WHERE to_tsvector('chinese', t.title || ' ' || t.content) @@ to_tsquery('chinese', '压力')
AND t.status = 'published'
ORDER BY t.published_at DESC;
```

**3. 用户是否点赞**
```sql
SELECT EXISTS (
  SELECT 1 FROM community_likes
  WHERE user_id = $1 AND target_type = 'topic' AND target_id = $2
) AS is_liked;
```

---

## 云函数实现示例

### 基本结构

```javascript
// cloud-functions/community-topics/index.js
'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, ...params } = event;
  
  // Token验证
  const auth = context.UNICLOUD_AUTH_TOKEN;
  
  switch (action) {
    case 'list':
      return await listTopics(params, auth);
    case 'detail':
      return await getTopicDetail(params, auth);
    case 'create':
      return await createTopic(params, auth);
    case 'update':
      return await updateTopic(params, auth);
    case 'delete':
      return await deleteTopic(params, auth);
    case 'like':
      return await toggleLike(params, auth);
    default:
      return { code: 400, message: '无效的action' };
  }
};

// 获取话题列表
async function listTopics(params, auth) {
  const { category, sort, keyword, page = 1, page_size = 10 } = params;
  
  // 参数校验
  if (page_size > 50) {
    return { code: 400, message: '每页最多50条' };
  }
  
  // 构建查询条件
  const where = { status: 'published' };
  
  if (category && category !== 'all') {
    where.category = category;
  }
  
  if (keyword) {
    // 简单的模糊搜索（生产环境使用全文搜索）
    where.$or = [
      { title: new RegExp(keyword, 'i') },
      { content: new RegExp(keyword, 'i') }
    ];
  }
  
  // 排序
  let orderBy = {};
  if (sort === 'hot') {
    orderBy = { likes_count: 'desc', views_count: 'desc' };
  } else {
    orderBy = { is_pinned: 'desc', published_at: 'desc' };
  }
  
  // 查询
  const skip = (page - 1) * page_size;
  const res = await db.collection('community_topics')
    .aggregate()
    .match(where)
    .lookup({
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'author_info'
    })
    .unwind('$author_info')
    .sort(orderBy)
    .skip(skip)
    .limit(page_size)
    .project({
      _id: 0,
      id: '$_id',
      title: 1,
      content: { $substr: ['$content', 0, 100] }, // 截取前100字
      category: 1,
      images: 1,
      'author': {
        user_id: '$author_info._id',
        nickname: '$author_info.nickname',
        avatar_url: '$author_info.avatar_url'
      },
      stats: {
        views_count: '$views_count',
        likes_count: '$likes_count',
        comments_count: '$comments_count'
      },
      is_pinned: 1,
      is_locked: 1,
      published_at: 1,
      created_at: 1
    })
    .end();
  
  // 总数
  const countRes = await db.collection('community_topics')
    .where(where)
    .count();
  
  return {
    code: 200,
    message: '查询成功',
    data: {
      list: res.data,
      pagination: {
        page,
        page_size,
        total: countRes.total,
        total_pages: Math.ceil(countRes.total / page_size),
        has_more: page * page_size < countRes.total
      }
    }
  };
}

// 创建话题
async function createTopic(params, auth) {
  // 权限验证
  if (!auth || !auth.uid) {
    return { code: 401, message: '请先登录' };
  }
  
  const { title, content, category, images = [] } = params;
  
  // 参数校验
  if (!title || title.length < 5 || title.length > 200) {
    return { code: 400, message: '标题长度必须在5-200个字符之间' };
  }
  
  if (!content || content.length < 10 || content.length > 5000) {
    return { code: 400, message: '内容长度必须在10-5000个字符之间' };
  }
  
  if (!category) {
    return { code: 400, message: '请选择分类' };
  }
  
  if (images.length > 9) {
    return { code: 400, message: '最多上传9张图片' };
  }
  
  // 敏感词检测
  const sensitiveResult = checkSensitiveWords(title + content);
  const status = sensitiveResult.hasSensitive ? 'pending' : 'published';
  
  // 插入数据
  const res = await db.collection('community_topics').add({
    user_id: auth.uid,
    title,
    content,
    category,
    images,
    status,
    published_at: new Date()
  });
  
  return {
    code: 200,
    message: status === 'published' ? '话题发布成功' : '话题已提交审核',
    data: {
      topic_id: res.id,
      status
    }
  };
}

// 点赞切换
async function toggleLike(params, auth) {
  if (!auth || !auth.uid) {
    return { code: 401, message: '请先登录' };
  }
  
  const { topic_id } = params;
  
  // 检查是否已点赞
  const existing = await db.collection('community_likes')
    .where({
      user_id: auth.uid,
      target_type: 'topic',
      target_id: topic_id
    })
    .get();
  
  let isLiked;
  
  if (existing.data.length > 0) {
    // 取消点赞
    await db.collection('community_likes').doc(existing.data[0]._id).remove();
    await db.collection('community_topics').doc(topic_id).update({
      likes_count: dbCmd.inc(-1)
    });
    isLiked = false;
  } else {
    // 添加点赞
    await db.collection('community_likes').add({
      user_id: auth.uid,
      target_type: 'topic',
      target_id: topic_id
    });
    await db.collection('community_topics').doc(topic_id).update({
      likes_count: dbCmd.inc(1)
    });
    isLiked = true;
  }
  
  // 获取最新点赞数
  const topic = await db.collection('community_topics')
    .doc(topic_id)
    .field({ likes_count: true })
    .get();
  
  return {
    code: 200,
    message: isLiked ? '点赞成功' : '取消点赞',
    data: {
      topic_id,
      is_liked: isLiked,
      likes_count: topic.data[0].likes_count
    }
  };
}

// 敏感词检测（简化版）
function checkSensitiveWords(text) {
  const sensitiveWords = ['暴力', '色情', '政治', '广告'];
  const hasSensitive = sensitiveWords.some(word => text.includes(word));
  return { hasSensitive };
}
```

---

## 前端集成示例

### Vue组件示例

```vue
<template>
  <view class="topics-list">
    <!-- 分类切换 -->
    <view class="categories">
      <view 
        v-for="cat in categories" 
        :key="cat.value"
        :class="['category-item', { active: category === cat.value }]"
        @click="changeCategory(cat.value)"
      >
        {{ cat.label }}
      </view>
    </view>
    
    <!-- 话题列表 -->
    <view class="topics">
      <view 
        v-for="topic in topicList" 
        :key="topic.id"
        class="topic-card"
        @click="viewDetail(topic.id)"
      >
        <view class="topic-header">
          <image :src="topic.author.avatar_url" class="avatar" />
          <text class="nickname">{{ topic.author.nickname }}</text>
        </view>
        
        <view class="topic-content">
          <text class="title">{{ topic.title }}</text>
          <text class="preview">{{ topic.content_preview }}</text>
          
          <!-- 图片 -->
          <view v-if="topic.images.length" class="images">
            <image 
              v-for="(img, idx) in topic.images.slice(0, 3)" 
              :key="idx"
              :src="img"
              mode="aspectFill"
            />
          </view>
        </view>
        
        <!-- 统计 -->
        <view class="topic-stats">
          <text>👁 {{ topic.stats.views_count }}</text>
          <text>❤️ {{ topic.stats.likes_count }}</text>
          <text>💬 {{ topic.stats.comments_count }}</text>
        </view>
      </view>
    </view>
    
    <!-- 加载更多 -->
    <view class="load-more" @click="loadMore">
      {{ hasMore ? '加载更多' : '没有更多了' }}
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      categories: [
        { label: '全部', value: 'all' },
        { label: '心情', value: 'mood' },
        { label: '经验', value: 'experience' },
        { label: '提问', value: 'question' }
      ],
      category: 'all',
      topicList: [],
      page: 1,
      hasMore: true,
      loading: false
    };
  },
  
  mounted() {
    this.loadTopics();
  },
  
  methods: {
    async loadTopics(isLoadMore = false) {
      if (this.loading) return;
      this.loading = true;
      
      try {
        const { result } = await uniCloud.callFunction({
          name: 'community-topics',
          data: {
            action: 'list',
            category: this.category,
            page: this.page,
            page_size: 10
          }
        });
        
        if (result.code === 200) {
          if (isLoadMore) {
            this.topicList.push(...result.data.list);
          } else {
            this.topicList = result.data.list;
          }
          this.hasMore = result.data.pagination.has_more;
        }
      } catch (err) {
        console.error('加载话题失败', err);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    changeCategory(cat) {
      this.category = cat;
      this.page = 1;
      this.loadTopics();
    },
    
    loadMore() {
      if (!this.hasMore) return;
      this.page++;
      this.loadTopics(true);
    },
    
    viewDetail(topicId) {
      uni.navigateTo({
        url: `/pages/community/detail?id=${topicId}`
      });
    }
  }
};
</script>

<style scoped>
.topics-list {
  padding: 20rpx;
}

.categories {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.category-item {
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
}

.category-item.active {
  background: #007aff;
  color: #fff;
}

.topic-card {
  padding: 20rpx;
  margin-bottom: 20rpx;
  background: #fff;
  border-radius: 16rpx;
}

.topic-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.preview {
  color: #666;
  font-size: 28rpx;
}

.images {
  display: flex;
  gap: 10rpx;
  margin-top: 20rpx;
}

.images image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
}

.topic-stats {
  display: flex;
  gap: 30rpx;
  margin-top: 20rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
```

---

## 性能优化建议

### 1. 数据库优化
- 使用全文搜索索引（GIN）提升搜索性能
- 热门话题榜单使用Redis缓存（1小时）
- 用户点赞状态批量查询

### 2. 接口优化
- 列表接口返回content_preview，不返回完整内容
- 图片URL使用CDN加速
- 分页最大限制50条

### 3. 缓存策略
```javascript
// Redis缓存热门话题
const cacheKey = `topics:hot:${category}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

const topics = await queryHotTopics();
await redis.setex(cacheKey, 3600, JSON.stringify(topics));
```

---

## 安全防护

### 1. SQL注入防护
- 使用参数化查询
- 禁止拼接SQL

### 2. XSS防护
- 前端显示时转义HTML
- 后端存储原始内容

### 3. 频率限制
```javascript
const rateLimit = {
  'create': { limit: 5, window: 3600 }, // 5次/小时
  'like': { limit: 20, window: 60 },    // 20次/分钟
  'list': { limit: 30, window: 60 }     // 30次/分钟
};
```

### 4. 敏感词过滤
- 维护敏感词库
- 实时检测+异步审核
- 违规内容状态设为pending

---

## 监控指标

### 关键指标
- QPS（每秒请求数）
- 响应时间（P50/P95/P99）
- 错误率
- 话题发布成功率
- 内容审核通过率

### 告警规则
- 错误率 > 5%：立即告警
- P95响应时间 > 1s：告警
- 发布失败率 > 10%：告警

---

## 变更日志

### v1.0.0 (2025-10-20)
- ✅ 完整的CRUD操作
- ✅ 话题列表、详情、创建、更新、删除
- ✅ 点赞/取消点赞功能
- ✅ 内容审核机制
- ✅ 全文搜索支持
- ✅ 完整的错误处理
- ✅ 限流保护

---

**文档维护**: 开发团队  
**最后更新**: 2025-10-20  
**文档版本**: v1.0.0
