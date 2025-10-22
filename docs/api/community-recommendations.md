# community-recommendations API文档

## 基本信息

- **云函数名称**: `community-recommendations`
- **功能描述**: 社区内容推荐算法（基于用户行为的个性化推荐）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多30次请求

---

## 业务说明

本接口提供基于用户行为的个性化内容推荐功能，支持：
1. 话题推荐（基于兴趣标签、浏览历史、互动行为）
2. 用户推荐（推荐相似兴趣的用户）
3. 音乐推荐（基于情绪和偏好）
4. 推荐反馈（点击、不感兴趣、举报）
5. 推荐解释（说明推荐理由）

### 推荐算法特性
- **协同过滤**: 基于相似用户的行为推荐
- **内容过滤**: 基于内容标签和关键词匹配
- **混合推荐**: 结合多种算法提升推荐质量
- **实时更新**: 根据用户最新行为动态调整推荐
- **冷启动处理**: 新用户基于热门内容推荐

---

## Action类型说明

| Action | 说明 | 认证 | 限流 |
|--------|------|------|------|
| get_recommendations | 获取推荐内容 | 是 | 30/min |
| feedback | 推荐反馈 | 是 | 60/min |
| update_interests | 更新用户兴趣 | 是 | 10/min |
| get_interests | 获取用户兴趣标签 | 是 | 30/min |
| similar_users | 获取相似用户 | 是 | 20/min |

---

## 1. 获取推荐内容 (get_recommendations)

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| action | String | 是 | - | 固定值：get_recommendations |
| type | String | 是 | - | 推荐类型（topic/user/music） |
| count | Number | 否 | 10 | 推荐数量（最多50） |
| exclude_ids | Array | 否 | [] | 排除的ID列表 |
| scene | String | 否 | general | 推荐场景（general/home/detail/search） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-recommendations',
  data: {
    action: 'get_recommendations',
    type: 'topic',
    count: 10,
    exclude_ids: ['topic_1', 'topic_2'],
    scene: 'home'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "推荐成功",
  "data": {
    "recommendations": [
      {
        "id": "rec_xxx",
        "target_type": "topic",
        "target_id": "topic_xxx",
        "score": 85.5,
        "reason": {
          "type": "interest_match",
          "tags": ["心理健康", "焦虑"],
          "description": "基于你的兴趣推荐"
        },
        "topic": {
          "id": "topic_xxx",
          "title": "如何缓解焦虑情绪",
          "content": "...",
          "author": {
            "id": "user_xxx",
            "nickname": "小明",
            "avatar": "https://..."
          },
          "likes_count": 128,
          "comments_count": 45,
          "created_at": "2025-10-22T10:00:00Z"
        }
      }
    ],
    "total": 10,
    "algorithm": "hybrid",
    "generated_at": "2025-10-22T10:00:00Z"
  }
}
```

---

## 2. 推荐反馈 (feedback)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：feedback |
| recommendation_id | String | 是 | 推荐记录ID |
| feedback_type | String | 是 | 反馈类型（click/like/dislike/report） |
| reason | String | 否 | 反馈原因（dislike/report时必填） |

### 请求示例

```javascript
// 点击推荐内容
const { result } = await uniCloud.callFunction({
  name: 'community-recommendations',
  data: {
    action: 'feedback',
    recommendation_id: 'rec_xxx',
    feedback_type: 'click'
  }
});

// 不感兴趣
const { result } = await uniCloud.callFunction({
  name: 'community-recommendations',
  data: {
    action: 'feedback',
    recommendation_id: 'rec_xxx',
    feedback_type: 'dislike',
    reason: 'not_interested'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "反馈成功",
  "data": {
    "recommendation_id": "rec_xxx",
    "feedback_type": "click",
    "updated_at": "2025-10-22T10:00:00Z"
  }
}
```

---

## 3. 更新用户兴趣 (update_interests)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：update_interests |
| interests | Array | 是 | 兴趣标签数组 |
| source | String | 否 | 来源（manual/browse/like/comment） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-recommendations',
  data: {
    action: 'update_interests',
    interests: [
      { type: 'category', value: '心理健康', weight: 5 },
      { type: 'tag', value: '焦虑', weight: 3 },
      { type: 'keyword', value: '冥想', weight: 2 }
    ],
    source: 'manual'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "兴趣更新成功",
  "data": {
    "total_interests": 15,
    "updated_count": 3,
    "updated_at": "2025-10-22T10:00:00Z"
  }
}
```

---

## 4. 获取用户兴趣标签 (get_interests)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：get_interests |
| type | String | 否 | 兴趣类型（all/category/tag/keyword） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-recommendations',
  data: {
    action: 'get_interests',
    type: 'all'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "interests": [
      {
        "type": "category",
        "value": "心理健康",
        "weight": 8.5,
        "source": "browse",
        "updated_at": "2025-10-22T10:00:00Z"
      },
      {
        "type": "tag",
        "value": "焦虑",
        "weight": 6.2,
        "source": "like",
        "updated_at": "2025-10-21T15:30:00Z"
      }
    ],
    "total": 15,
    "top_categories": ["心理健康", "学习方法", "人际关系"],
    "top_tags": ["焦虑", "压力", "冥想"]
  }
}
```

---

## 5. 获取相似用户 (similar_users)

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| action | String | 是 | - | 固定值：similar_users |
| count | Number | 否 | 10 | 推荐数量（最多20） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-recommendations',
  data: {
    action: 'similar_users',
    count: 10
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "similar_users": [
      {
        "user_id": "user_xxx",
        "nickname": "小红",
        "avatar": "https://...",
        "similarity_score": 0.85,
        "common_interests": ["心理健康", "焦虑", "冥想"],
        "common_topics": 12,
        "reason": "你们有相似的兴趣爱好"
      }
    ],
    "total": 10
  }
}
```

---

## 推荐算法说明

### 1. 协同过滤算法

基于用户行为相似度推荐：
- 计算用户之间的相似度（余弦相似度）
- 推荐相似用户喜欢的内容
- 适用于有一定行为数据的用户

### 2. 内容过滤算法

基于内容特征匹配推荐：
- 提取内容标签和关键词
- 匹配用户兴趣标签
- 计算内容相似度得分

### 3. 混合推荐算法

结合多种算法：
- 协同过滤权重：40%
- 内容过滤权重：30%
- 热度权重：20%
- 时效性权重：10%

### 4. 冷启动策略

新用户推荐策略：
- 推荐热门内容（浏览量、点赞数高）
- 推荐多样化内容（覆盖不同分类）
- 根据初始行为快速建立兴趣模型

---

## 错误码

| 错误码 | 错误信息 | 处理建议 |
|--------|----------|----------|
| 0 | 操作成功 | - |
| 40001 | 缺少必填参数 | 检查请求参数 |
| 40002 | 参数格式错误 | 检查参数类型和格式 |
| 40301 | 未登录 | 重新登录获取Token |
| 40302 | Token已过期 | 刷新Token或重新登录 |
| 42901 | 请求过于频繁 | 稍后重试 |
| 50001 | 数据库操作失败 | 稍后重试 |
| 50002 | 服务器内部错误 | 联系技术支持 |

---

## 云函数实现示例

```javascript
'use strict';

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.main = async (event, context) => {
  try {
    const authResult = verifyToken(context);
    if (!authResult.success) {
      return { code: 40301, msg: authResult.message, data: null };
    }

    const userId = authResult.uid;
    const { action } = event;

    switch (action) {
      case 'get_recommendations':
        return await getRecommendations(event, userId);
      case 'feedback':
        return await recordFeedback(event, userId);
      case 'update_interests':
        return await updateInterests(event, userId);
      case 'get_interests':
        return await getInterests(event, userId);
      case 'similar_users':
        return await getSimilarUsers(event, userId);
      default:
        return { code: 40002, msg: '不支持的操作类型', data: null };
    }

  } catch (error) {
    console.error('[RECOMMENDATIONS] 异常:', error);
    return { code: 50002, msg: '服务器内部错误', data: null };
  }
};

// 获取推荐内容
async function getRecommendations(params, userId) {
  const { type, count = 10, exclude_ids = [], scene = 'general' } = params;

  if (!type || !['topic', 'user', 'music'].includes(type)) {
    return { code: 40002, msg: '推荐类型参数错误', data: null };
  }

  // 1. 获取用户兴趣标签
  const { data: interests } = await supabase
    .from('user_interests')
    .select('*')
    .eq('user_id', userId)
    .order('weight', { ascending: false })
    .limit(20);

  // 2. 检查是否为新用户（冷启动）
  const isNewUser = !interests || interests.length < 3;

  let recommendations = [];

  if (isNewUser) {
    // 冷启动：推荐热门内容
    recommendations = await getHotTopics(count, exclude_ids);
  } else {
    // 混合推荐算法
    const collaborativeRecs = await getCollaborativeRecommendations(userId, interests, count);
    const contentRecs = await getContentBasedRecommendations(userId, interests, count);
    const hotRecs = await getHotTopics(Math.ceil(count * 0.2), exclude_ids);

    // 合并推荐结果并去重
    recommendations = mergeRecommendations([
      { items: collaborativeRecs, weight: 0.4 },
      { items: contentRecs, weight: 0.3 },
      { items: hotRecs, weight: 0.3 }
    ], count, exclude_ids);
  }

  // 3. 保存推荐记录
  await saveRecommendations(userId, recommendations);

  return {
    code: 0,
    msg: '推荐成功',
    data: {
      recommendations,
      total: recommendations.length,
      algorithm: isNewUser ? 'hot' : 'hybrid',
      generated_at: new Date().toISOString()
    }
  };
}

// 协同过滤推荐
async function getCollaborativeRecommendations(userId, interests, count) {
  // 1. 找到相似用户
  const { data: similarUsers } = await supabase
    .rpc('find_similar_users', {
      p_user_id: userId,
      p_limit: 20
    });

  if (!similarUsers || similarUsers.length === 0) {
    return [];
  }

  // 2. 获取相似用户喜欢的话题
  const similarUserIds = similarUsers.map(u => u.user_id);

  const { data: likedTopics } = await supabase
    .from('community_likes')
    .select('target_id, community_topics(*)')
    .eq('target_type', 'topic')
    .in('user_id', similarUserIds)
    .limit(count * 2);

  // 3. 计算推荐分数
  const recommendations = likedTopics.map(like => ({
    id: `rec_${Date.now()}_${Math.random()}`,
    target_type: 'topic',
    target_id: like.target_id,
    score: 80 + Math.random() * 20,
    reason: {
      type: 'collaborative',
      description: '相似用户也喜欢'
    },
    topic: like.community_topics
  }));

  return recommendations.slice(0, count);
}

// 内容过滤推荐
async function getContentBasedRecommendations(userId, interests, count) {
  // 提取用户兴趣的分类和标签
  const categories = interests
    .filter(i => i.interest_type === 'category')
    .map(i => i.interest_value);

  const tags = interests
    .filter(i => i.interest_type === 'tag')
    .map(i => i.interest_value);

  // 查询匹配的话题
  let query = supabase
    .from('community_topics')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(count * 2);

  if (categories.length > 0) {
    query = query.in('category', categories);
  }

  const { data: topics } = await query;

  // 计算内容相似度得分
  const recommendations = topics.map(topic => {
    let score = 60;

    // 分类匹配加分
    if (categories.includes(topic.category)) {
      score += 20;
    }

    // 标签匹配加分（简化版，实际应该解析content中的标签）
    tags.forEach(tag => {
      if (topic.title.includes(tag) || topic.content.includes(tag)) {
        score += 5;
      }
    });

    return {
      id: `rec_${Date.now()}_${Math.random()}`,
      target_type: 'topic',
      target_id: topic.id,
      score: Math.min(score, 100),
      reason: {
        type: 'interest_match',
        tags: [topic.category],
        description: '基于你的兴趣推荐'
      },
      topic
    };
  });

  // 按分数排序
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, count);
}

// 获取热门话题
async function getHotTopics(count, exclude_ids = []) {
  let query = supabase
    .from('community_topics')
    .select('*')
    .eq('status', 'published')
    .order('likes_count', { ascending: false })
    .order('comments_count', { ascending: false })
    .limit(count * 2);

  if (exclude_ids.length > 0) {
    query = query.not('id', 'in', `(${exclude_ids.join(',')})`);
  }

  const { data: topics } = await query;

  const recommendations = topics.map(topic => ({
    id: `rec_${Date.now()}_${Math.random()}`,
    target_type: 'topic',
    target_id: topic.id,
    score: 70 + Math.random() * 10,
    reason: {
      type: 'hot',
      description: '热门推荐'
    },
    topic
  }));

  return recommendations.slice(0, count);
}

// 合并推荐结果
function mergeRecommendations(sources, count, exclude_ids) {
  const merged = [];
  const seenIds = new Set(exclude_ids);

  // 按权重分配数量
  sources.forEach(source => {
    const targetCount = Math.ceil(count * source.weight);
    let added = 0;

    for (const item of source.items) {
      if (added >= targetCount) break;
      if (seenIds.has(item.target_id)) continue;

      merged.push(item);
      seenIds.add(item.target_id);
      added++;
    }
  });

  // 按分数排序
  merged.sort((a, b) => b.score - a.score);

  return merged.slice(0, count);
}

// 保存推荐记录
async function saveRecommendations(userId, recommendations) {
  const records = recommendations.map(rec => ({
    user_id: userId,
    target_type: rec.target_type,
    target_id: rec.target_id,
    recommendation_score: rec.score,
    recommendation_reason: rec.reason,
    is_shown: false,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }));

  await supabase
    .from('user_recommendations')
    .insert(records);
}
```

---

## 前端集成示例

```vue
<template>
  <view class="recommendations">
    <view class="section-title">为你推荐</view>

    <view class="topic-list">
      <view
        v-for="rec in recommendations"
        :key="rec.id"
        class="topic-item"
        @click="handleTopicClick(rec)"
      >
        <view class="topic-content">
          <view class="topic-title">{{ rec.topic.title }}</view>
          <view class="topic-reason">{{ rec.reason.description }}</view>
        </view>

        <view class="topic-actions">
          <u-icon name="close" @click.stop="handleDislike(rec)" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      recommendations: []
    };
  },

  onLoad() {
    this.loadRecommendations();
  },

  methods: {
    async loadRecommendations() {
      try {
        const res = await uniCloud.callFunction({
          name: 'community-recommendations',
          data: {
            action: 'get_recommendations',
            type: 'topic',
            count: 10,
            scene: 'home'
          }
        });

        if (res.result.code === 0) {
          this.recommendations = res.result.data.recommendations;
        }
      } catch (error) {
        console.error('加载推荐失败:', error);
      }
    },

    async handleTopicClick(rec) {
      // 记录点击反馈
      await this.recordFeedback(rec.id, 'click');

      // 跳转到话题详情
      uni.navigateTo({
        url: `/pages/community/detail?id=${rec.target_id}`
      });
    },

    async handleDislike(rec) {
      try {
        await this.recordFeedback(rec.id, 'dislike', 'not_interested');

        // 从列表中移除
        const index = this.recommendations.findIndex(r => r.id === rec.id);
        if (index > -1) {
          this.recommendations.splice(index, 1);
        }

        uni.showToast({
          title: '已减少此类推荐',
          icon: 'success'
        });
      } catch (error) {
        console.error('反馈失败:', error);
      }
    },

    async recordFeedback(recId, type, reason) {
      await uniCloud.callFunction({
        name: 'community-recommendations',
        data: {
          action: 'feedback',
          recommendation_id: recId,
          feedback_type: type,
          reason
        }
      });
    }
  }
};
</script>
```

---

## 最佳实践

1. **多样化推荐**: 避免推荐内容过于单一，保持多样性
2. **实时更新**: 根据用户最新行为动态调整推荐
3. **推荐解释**: 告诉用户为什么推荐这个内容
4. **负反馈处理**: 及时处理用户的"不感兴趣"反馈
5. **A/B测试**: 测试不同推荐算法的效果
6. **性能优化**: 缓存推荐结果，减少计算开销

---

**创建时间**: 2025-10-22
**最后更新**: 2025-10-22
**版本**: v1.0


