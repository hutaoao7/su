# community-topics API文档

## 基本信息

- **云函数名称**: `community-topics`
- **功能描述**: 社区话题相关操作
- **请求方式**: uniCloud.callFunction
- **认证要求**: 发布、编辑、删除需要Token
- **限流策略**: 每用户每小时最多发布5个话题

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 操作类型（list/detail/create/update/delete/like） |
| topic_id | String | 否 | 话题ID |
| title | String | 否 | 话题标题（create/update） |
| content | String | 否 | 话题内容（create/update） |
| category | String | 否 | 分类 |
| images | Array | 否 | 图片URL数组（最多9张） |

### 操作示例

**1. 获取话题列表**
```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'list',
    category: 'mood',
    page: 1,
    page_size: 10
  }
});
```

**2. 发布话题**
```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-topics',
  data: {
    action: 'create',
    title: '今天心情不错',
    content: '分享一下我的好心情...',
    category: 'mood',
    images: ['/images/photo1.jpg']
  }
});
```

---

## 响应格式

### list响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "list": [
      {
        "id": "topic-id-1",
        "title": "今天心情不错",
        "content": "分享一下...",
        "author": {
          "id": "user-id",
          "nickname": "张三",
          "avatar": "/avatar.jpg"
        },
        "category": "mood",
        "views_count": 100,
        "likes_count": 15,
        "comments_count": 8,
        "is_pinned": false,
        "created_at": "2025-10-18T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "total": 50
    }
  }
}
```

---

**创建时间**: 2025-10-18


