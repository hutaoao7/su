# assessment-create API文档

## 基本信息

- **云函数名称**: `assessment-create`
- **功能描述**: 创建新的评估记录
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每小时最多20次评估

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| scale_id | String | 是 | 量表ID（如phq9、gad7） |
| answers | Object | 是 | 答案对象（key为题目ID） |
| completion_time | Number | 否 | 完成时长（秒） |
| session_id | String | 否 | 会话ID |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'assessment-create',
  data: {
    scale_id: 'phq9',
    answers: {
      'q1': 1,
      'q2': 2,
      'q3': 0,
      // ... 更多答案
    },
    completion_time: 180  // 3分钟
  }
});
```

---

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "msg": "评估创建成功",
  "data": {
    "assessment_id": "550e8400-e29b-41d4-a716-446655440000",
    "result": {
      "total_score": 12,
      "max_score": 27,
      "score_percentage": 44.44,
      "level": "中度抑郁",
      "level_description": "您的抑郁症状达到中度水平...",
      "suggestions": [
        "建议寻求专业心理咨询",
        "保持规律作息",
        "适度运动"
      ],
      "risk_factors": [
        "睡眠质量差",
        "兴趣减退"
      ]
    }
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 处理建议 |
|--------|----------|----------|
| 0 | 创建成功 | - |
| 40001 | 缺少必填参数 | 检查scale_id和answers |
| 40002 | 量表不存在 | 检查scale_id是否正确 |
| 40003 | 答案不完整 | 确保所有题目都已回答 |
| 40301 | 未登录 | 重新登录 |

---

**创建时间**: 2025-10-18


