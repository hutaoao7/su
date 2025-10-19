# assessment-get-history API文档

## 基本信息

- **云函数名称**: `assessment-get-history`
- **功能描述**: 获取用户的评估历史记录
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多10次请求

---

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| scale_id | String | 否 | null | 量表ID筛选 |
| status | String | 否 | 'completed' | 状态筛选 |
| page | Number | 否 | 1 | 页码 |
| page_size | Number | 否 | 10 | 每页数量 |
| sort_by | String | 否 | 'created_at' | 排序字段 |
| sort_order | String | 否 | 'DESC' | 排序方向 |

### 请求示例

```javascript
// 获取所有已完成的评估
const { result } = await uniCloud.callFunction({
  name: 'assessment-get-history',
  data: {
    status: 'completed',
    page: 1,
    page_size: 20
  }
});

// 获取特定量表的历史
const { result } = await uniCloud.callFunction({
  name: 'assessment-get-history',
  data: {
    scale_id: 'phq9',
    page: 1
  }
});
```

---

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "list": [
      {
        "id": "assessment-id-1",
        "scale_id": "phq9",
        "scale_name": "PHQ-9 抑郁症筛查量表",
        "total_score": 12,
        "level": "中度抑郁",
        "completion_time": 180,
        "completed_at": "2025-10-15T10:30:00Z",
        "created_at": "2025-10-15T10:27:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 15,
      "total_pages": 2
    }
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 处理建议 |
|--------|----------|----------|
| 0 | 查询成功 | - |
| 40301 | 未登录 | 重新登录 |

---

**创建时间**: 2025-10-18


