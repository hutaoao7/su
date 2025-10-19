# fn-music API文档

## 基本信息

- **云函数名称**: `fn-music`
- **功能描述**: 音乐相关功能（获取列表、播放、收藏等）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 部分功能需要Token
- **限流策略**: 每用户每分钟最多30次请求

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 操作类型（list/detail/fav/history） |
| category | String | 否 | 分类（action=list时） |
| track_id | String | 否 | 曲目ID（action=detail/fav时） |
| page | Number | 否 | 页码 |
| page_size | Number | 否 | 每页数量 |

### 操作类型说明

**1. list - 获取曲目列表**
```javascript
const { result } = await uniCloud.callFunction({
  name: 'fn-music',
  data: {
    action: 'list',
    category: 'meditation',
    page: 1,
    page_size: 20
  }
});
```

**2. detail - 获取曲目详情**
```javascript
const { result } = await uniCloud.callFunction({
  name: 'fn-music',
  data: {
    action: 'detail',
    track_id: 'meditation_breath_01'
  }
});
```

**3. fav - 收藏/取消收藏**
```javascript
const { result } = await uniCloud.callFunction({
  name: 'fn-music',
  data: {
    action: 'fav',
    track_id: 'meditation_breath_01',
    favorite: true  // true=收藏，false=取消收藏
  }
});
```

**4. history - 记录播放历史**
```javascript
const { result } = await uniCloud.callFunction({
  name: 'fn-music',
  data: {
    action: 'history',
    track_id: 'meditation_breath_01',
    play_duration: 300,  // 播放时长（秒）
    completion_rate: 85  // 完成率（%）
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
        "track_id": "meditation_breath_01",
        "title": "深度呼吸练习",
        "category": "meditation",
        "duration": 600,
        "cover_url": "/covers/breath.jpg",
        "audio_url": "/audio/breath.mp3",
        "is_premium": false,
        "is_favorited": false
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 50
    }
  }
}
```

---

**创建时间**: 2025-10-18


