# community-favorites API文档

## 基本信息

- **云函数名称**: `community-favorites`
- **功能描述**: 社区收藏功能（添加收藏、取消收藏、查询收藏列表）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多30次请求

---

## 业务说明

本接口提供社区内容的收藏管理功能，支持：
1. 收藏话题和评论
2. 取消收藏
3. 查询收藏列表（支持分类和搜索）
4. 收藏夹管理（创建、重命名、删除）
5. 批量操作（批量收藏、批量取消）

### 功能特性
- 支持分类收藏（收藏夹）
- 支持添加收藏备注
- 自动更新话题收藏数
- 收藏列表支持排序和筛选

---

## Action类型说明

| Action | 说明 | 认证 | 限流 |
|--------|------|------|------|
| add | 添加收藏 | 是 | 30/min |
| remove | 取消收藏 | 是 | 30/min |
| list | 查询收藏列表 | 是 | 60/min |
| check | 检查是否已收藏 | 是 | 60/min |
| folders | 获取收藏夹列表 | 是 | 30/min |
| batch_add | 批量添加收藏 | 是 | 10/min |
| batch_remove | 批量取消收藏 | 是 | 10/min |

---

## 1. 添加收藏 (add)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：add |
| target_type | String | 是 | 收藏对象类型（topic/comment） |
| target_id | String | 是 | 收藏对象ID |
| folder_name | String | 否 | 收藏夹名称（默认：default） |
| notes | String | 否 | 收藏备注 |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-favorites',
  data: {
    action: 'add',
    target_type: 'topic',
    target_id: 'topic_xxx',
    folder_name: '心理健康',
    notes: '很有帮助的文章'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "收藏成功",
  "data": {
    "favorite_id": "fav_xxx",
    "target_type": "topic",
    "target_id": "topic_xxx",
    "folder_name": "心理健康",
    "created_at": "2025-10-22T10:00:00Z"
  }
}
```

---

## 2. 取消收藏 (remove)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：remove |
| target_type | String | 是 | 收藏对象类型（topic/comment） |
| target_id | String | 是 | 收藏对象ID |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-favorites',
  data: {
    action: 'remove',
    target_type: 'topic',
    target_id: 'topic_xxx'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "已取消收藏",
  "data": {
    "target_type": "topic",
    "target_id": "topic_xxx",
    "removed_at": "2025-10-22T10:05:00Z"
  }
}
```

---

## 3. 查询收藏列表 (list)

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| action | String | 是 | - | 固定值：list |
| target_type | String | 否 | all | 收藏对象类型（all/topic/comment） |
| folder_name | String | 否 | all | 收藏夹名称（all表示全部） |
| page | Number | 否 | 1 | 页码 |
| page_size | Number | 否 | 20 | 每页数量 |
| sort_by | String | 否 | created_at | 排序方式（created_at/updated_at） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-favorites',
  data: {
    action: 'list',
    target_type: 'topic',
    folder_name: '心理健康',
    page: 1,
    page_size: 20
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "favorites": [
      {
        "favorite_id": "fav_xxx",
        "target_type": "topic",
        "target_id": "topic_xxx",
        "folder_name": "心理健康",
        "notes": "很有帮助的文章",
        "created_at": "2025-10-22T10:00:00Z",
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
          "comments_count": 45
        }
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 56,
      "total_pages": 3
    },
    "stats": {
      "total_favorites": 56,
      "topic_favorites": 48,
      "comment_favorites": 8,
      "folder_count": 5
    }
  }
}
```

---

## 4. 检查是否已收藏 (check)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：check |
| target_type | String | 是 | 收藏对象类型（topic/comment） |
| target_ids | Array | 是 | 收藏对象ID数组（最多50个） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-favorites',
  data: {
    action: 'check',
    target_type: 'topic',
    target_ids: ['topic_1', 'topic_2', 'topic_3']
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "favorites": {
      "topic_1": true,
      "topic_2": false,
      "topic_3": true
    }
  }
}
```

---

## 5. 获取收藏夹列表 (folders)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：folders |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-favorites',
  data: {
    action: 'folders'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "folders": [
      {
        "folder_name": "default",
        "display_name": "默认收藏夹",
        "count": 32,
        "last_updated": "2025-10-22T10:00:00Z"
      },
      {
        "folder_name": "心理健康",
        "display_name": "心理健康",
        "count": 15,
        "last_updated": "2025-10-21T15:30:00Z"
      },
      {
        "folder_name": "学习方法",
        "display_name": "学习方法",
        "count": 9,
        "last_updated": "2025-10-20T08:00:00Z"
      }
    ],
    "total_count": 56
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 处理建议 |
|--------|----------|----------|
| 0 | 操作成功 | - |
| 40001 | 缺少必填参数 | 检查请求参数 |
| 40002 | 参数格式错误 | 检查参数类型和格式 |
| 40003 | 已收藏该内容 | 提示用户已收藏 |
| 40004 | 未收藏该内容 | 无法取消收藏 |
| 40005 | 收藏对象不存在 | 检查target_id是否有效 |
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

// Token验证
function verifyToken(context) {
  const token = context.UNI_ID_TOKEN || context.TOKEN;

  if (!token) {
    return { success: false, uid: null, message: '未登录' };
  }

  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const uid = payload.sub || payload.uid;
    return { success: true, uid };
  } catch (error) {
    return { success: false, uid: null, message: 'Token解析失败' };
  }
}

exports.main = async (event, context) => {
  try {
    console.log('[COMMUNITY-FAVORITES] 请求开始');

    // 1. 验证Token
    const authResult = verifyToken(context);
    if (!authResult.success) {
      return {
        code: 40301,
        msg: authResult.message,
        data: null
      };
    }

    const userId = authResult.uid;
    const { action } = event;

    // 2. 根据action分发处理
    switch (action) {
      case 'add':
        return await addFavorite(event, userId);
      case 'remove':
        return await removeFavorite(event, userId);
      case 'list':
        return await listFavorites(event, userId);
      case 'check':
        return await checkFavorites(event, userId);
      case 'folders':
        return await getFolders(userId);
      case 'batch_add':
        return await batchAddFavorites(event, userId);
      case 'batch_remove':
        return await batchRemoveFavorites(event, userId);
      default:
        return {
          code: 40002,
          msg: '不支持的操作类型',
          data: null
        };
    }

  } catch (error) {
    console.error('[COMMUNITY-FAVORITES] 异常:', error);
    return {
      code: 50002,
      msg: '服务器内部错误',
      data: null
    };
  }
};

// 添加收藏
async function addFavorite(params, userId) {
  const { target_type, target_id, folder_name = 'default', notes } = params;

  // 参数校验
  if (!target_type || !target_id) {
    return { code: 40001, msg: '缺少必填参数', data: null };
  }

  if (!['topic', 'comment'].includes(target_type)) {
    return { code: 40002, msg: '收藏对象类型错误', data: null };
  }

  // 检查是否已收藏
  const { data: existing } = await supabase
    .from('community_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .single();

  if (existing) {
    return { code: 40003, msg: '已收藏该内容', data: null };
  }

  // 检查收藏对象是否存在
  const tableName = target_type === 'topic' ? 'community_topics' : 'community_comments';
  const { data: target, error: targetError } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', target_id)
    .single();

  if (targetError || !target) {
    return { code: 40005, msg: '收藏对象不存在', data: null };
  }

  // 添加收藏
  const now = new Date().toISOString();
  const { data: favorite, error } = await supabase
    .from('community_favorites')
    .insert({
      user_id: userId,
      target_type,
      target_id,
      folder_name,
      notes,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();

  if (error) {
    console.error('[ADD-FAVORITE] 数据库错误:', error);
    return { code: 50001, msg: '收藏失败', data: null };
  }

  return {
    code: 0,
    msg: '收藏成功',
    data: {
      favorite_id: favorite.id,
      target_type: favorite.target_type,
      target_id: favorite.target_id,
      folder_name: favorite.folder_name,
      created_at: favorite.created_at
    }
  };
}

// 取消收藏
async function removeFavorite(params, userId) {
  const { target_type, target_id } = params;

  // 参数校验
  if (!target_type || !target_id) {
    return { code: 40001, msg: '缺少必填参数', data: null };
  }

  // 检查是否已收藏
  const { data: existing } = await supabase
    .from('community_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .single();

  if (!existing) {
    return { code: 40004, msg: '未收藏该内容', data: null };
  }

  // 删除收藏
  const { error } = await supabase
    .from('community_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('target_type', target_type)
    .eq('target_id', target_id);

  if (error) {
    console.error('[REMOVE-FAVORITE] 数据库错误:', error);
    return { code: 50001, msg: '取消收藏失败', data: null };
  }

  return {
    code: 0,
    msg: '已取消收藏',
    data: {
      target_type,
      target_id,
      removed_at: new Date().toISOString()
    }
  };
}

// 查询收藏列表
async function listFavorites(params, userId) {
  const {
    target_type = 'all',
    folder_name = 'all',
    page = 1,
    page_size = 20,
    sort_by = 'created_at'
  } = params;

  // 构建查询
  let query = supabase
    .from('community_favorites')
    .select('*, community_topics(*), community_comments(*)', { count: 'exact' })
    .eq('user_id', userId);

  if (target_type !== 'all') {
    query = query.eq('target_type', target_type);
  }

  if (folder_name !== 'all') {
    query = query.eq('folder_name', folder_name);
  }

  // 排序和分页
  query = query
    .order(sort_by, { ascending: false })
    .range((page - 1) * page_size, page * page_size - 1);

  const { data: favorites, error, count } = await query;

  if (error) {
    console.error('[LIST-FAVORITES] 数据库错误:', error);
    return { code: 50001, msg: '查询失败', data: null };
  }

  // 获取统计信息
  const { data: stats } = await supabase
    .rpc('get_user_favorites_stats', { p_user_id: userId });

  return {
    code: 0,
    msg: '查询成功',
    data: {
      favorites: favorites.map(fav => ({
        favorite_id: fav.id,
        target_type: fav.target_type,
        target_id: fav.target_id,
        folder_name: fav.folder_name,
        notes: fav.notes,
        created_at: fav.created_at,
        [fav.target_type]: fav.target_type === 'topic' ? fav.community_topics : fav.community_comments
      })),
      pagination: {
        page,
        page_size,
        total: count,
        total_pages: Math.ceil(count / page_size)
      },
      stats: stats || {}
    }
  };
}

// 检查是否已收藏
async function checkFavorites(params, userId) {
  const { target_type, target_ids } = params;

  if (!target_type || !Array.isArray(target_ids) || target_ids.length === 0) {
    return { code: 40001, msg: '缺少必填参数', data: null };
  }

  if (target_ids.length > 50) {
    return { code: 40002, msg: '最多支持50个ID', data: null };
  }

  const { data: favorites, error } = await supabase
    .from('community_favorites')
    .select('target_id')
    .eq('user_id', userId)
    .eq('target_type', target_type)
    .in('target_id', target_ids);

  if (error) {
    console.error('[CHECK-FAVORITES] 数据库错误:', error);
    return { code: 50001, msg: '查询失败', data: null };
  }

  const favoriteSet = new Set(favorites.map(f => f.target_id));
  const result = {};
  target_ids.forEach(id => {
    result[id] = favoriteSet.has(id);
  });

  return {
    code: 0,
    msg: '查询成功',
    data: { favorites: result }
  };
}

// 获取收藏夹列表
async function getFolders(userId) {
  const { data: folders, error } = await supabase
    .from('community_favorites')
    .select('folder_name, created_at')
    .eq('user_id', userId);

  if (error) {
    console.error('[GET-FOLDERS] 数据库错误:', error);
    return { code: 50001, msg: '查询失败', data: null };
  }

  // 统计每个收藏夹的数量
  const folderMap = {};
  folders.forEach(f => {
    if (!folderMap[f.folder_name]) {
      folderMap[f.folder_name] = {
        folder_name: f.folder_name,
        display_name: f.folder_name === 'default' ? '默认收藏夹' : f.folder_name,
        count: 0,
        last_updated: f.created_at
      };
    }
    folderMap[f.folder_name].count++;
    if (f.created_at > folderMap[f.folder_name].last_updated) {
      folderMap[f.folder_name].last_updated = f.created_at;
    }
  });

  const folderList = Object.values(folderMap);

  return {
    code: 0,
    msg: '查询成功',
    data: {
      folders: folderList,
      total_count: folders.length
    }
  };
}
```

---

## 前端集成示例

### 在社区话题列表中添加收藏按钮

```vue
<template>
  <view class="topic-item">
    <!-- 话题内容 -->
    <view class="topic-content">{{ topic.title }}</view>

    <!-- 操作按钮 -->
    <view class="topic-actions">
      <view class="action-btn" @click="handleLike">
        <u-icon :name="topic.is_liked ? 'heart-fill' : 'heart'" />
        <text>{{ topic.likes_count }}</text>
      </view>

      <view class="action-btn" @click="handleFavorite">
        <u-icon :name="topic.is_favorited ? 'star-fill' : 'star'" color="#FFB800" />
        <text>{{ topic.favorites_count }}</text>
      </view>

      <view class="action-btn" @click="handleShare">
        <u-icon name="share" />
        <text>分享</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      topic: {
        id: 'topic_xxx',
        title: '如何缓解焦虑情绪',
        is_liked: false,
        is_favorited: false,
        likes_count: 128,
        favorites_count: 45
      }
    };
  },

  methods: {
    async handleFavorite() {
      try {
        if (this.topic.is_favorited) {
          // 取消收藏
          const res = await uniCloud.callFunction({
            name: 'community-favorites',
            data: {
              action: 'remove',
              target_type: 'topic',
              target_id: this.topic.id
            }
          });

          if (res.result.code === 0) {
            this.topic.is_favorited = false;
            this.topic.favorites_count--;
            uni.showToast({
              title: '已取消收藏',
              icon: 'success'
            });
          }
        } else {
          // 添加收藏
          const res = await uniCloud.callFunction({
            name: 'community-favorites',
            data: {
              action: 'add',
              target_type: 'topic',
              target_id: this.topic.id,
              folder_name: 'default'
            }
          });

          if (res.result.code === 0) {
            this.topic.is_favorited = true;
            this.topic.favorites_count++;
            uni.showToast({
              title: '收藏成功',
              icon: 'success'
            });
          }
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    }
  }
};
</script>
```

---

## 最佳实践

1. **收藏状态同步**: 在话题列表加载时批量检查收藏状态，避免逐个查询
2. **乐观更新**: 收藏操作立即更新UI，失败时回滚
3. **收藏夹管理**: 提供收藏夹分类功能，方便用户整理收藏内容
4. **收藏备注**: 允许用户添加收藏备注，增强收藏的实用性
5. **收藏统计**: 在用户中心展示收藏统计信息
6. **收藏提醒**: 定期提醒用户查看收藏内容

---

**创建时间**: 2025-10-22
**最后更新**: 2025-10-22
**版本**: v1.0


