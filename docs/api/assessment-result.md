# assessment-result API 文档

## 接口概述

**接口名称**: 获取评估结果  
**云函数名**: `assessment-result`  
**版本**: v1.0  
**更新日期**: 2025-10-20

## 功能说明

获取用户的评估结果详情，包括分数、等级、维度数据、建议等完整信息。支持获取单个结果或历史结果列表。

## 接口地址

```
uniCloud.callFunction({
  name: 'assessment-result',
  data: { ... }
})
```

## 请求参数

### 方法1：获取单个结果详情

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：`getDetail` |
| resultId | String | 是 | 结果ID |
| userId | String | 否 | 用户ID（从token获取） |

### 方法2：获取历史结果列表

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：`getHistory` |
| userId | String | 否 | 用户ID（从token获取） |
| scaleId | String | 否 | 量表ID（过滤特定量表） |
| page | Number | 否 | 页码（默认1） |
| pageSize | Number | 否 | 每页数量（默认10，最大50） |

### 方法3：保存评估结果

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：`saveResult` |
| userId | String | 否 | 用户ID（从token获取） |
| scaleId | String | 是 | 量表ID |
| score | Number | 是 | 总分 |
| maxScore | Number | 是 | 最高分 |
| level | String | 是 | 等级（normal/mild/moderate/severe） |
| dimensions | Array | 否 | 维度数据 |
| answers | Array | 是 | 答题记录 |
| duration | Number | 否 | 答题时长（秒） |

#### dimensions 数组结构

```javascript
[
  {
    label: "情绪状态",
    value: 15,
    max: 20,
    color: "#667eea"
  },
  ...
]
```

#### answers 数组结构

```javascript
[
  {
    questionId: "q1",
    answer: 2,
    marked: false
  },
  ...
]
```

### 方法4：删除结果

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：`deleteResult` |
| resultId | String | 是 | 结果ID |
| userId | String | 否 | 用户ID（从token获取） |

## 返回数据

### 获取单个结果详情 - 成功响应

```javascript
{
  "code": 0,
  "message": "success",
  "data": {
    "resultId": "res_1234567890",
    "userId": "user_123",
    "scaleId": "phq9",
    "scaleName": "PHQ-9 抑郁量表",
    "score": 12,
    "maxScore": 27,
    "level": "moderate",
    "levelText": "中度抑郁",
    "levelDescription": "您的抑郁症状处于中度水平，建议咨询专业心理咨询师...",
    "dimensions": [
      {
        "label": "情绪状态",
        "value": 15,
        "max": 20,
        "color": "#667eea",
        "percentage": 75
      }
    ],
    "suggestions": [
      "建议咨询专业心理咨询师",
      "学习压力管理技巧",
      "保持规律的作息时间"
    ],
    "riskFactors": [
      "当前症状可能影响日常生活"
    ],
    "answers": [
      {
        "questionId": "q1",
        "questionText": "感觉悲伤或抑郁",
        "answer": 2,
        "answerText": "一周有几天",
        "marked": false
      }
    ],
    "duration": 180,
    "createdAt": "2025-10-20T10:30:00.000Z",
    "updatedAt": "2025-10-20T10:30:00.000Z"
  }
}
```

### 获取历史结果列表 - 成功响应

```javascript
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "resultId": "res_1234567890",
        "scaleId": "phq9",
        "scaleName": "PHQ-9 抑郁量表",
        "score": 12,
        "maxScore": 27,
        "level": "moderate",
        "levelText": "中度抑郁",
        "createdAt": "2025-10-20T10:30:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

### 保存评估结果 - 成功响应

```javascript
{
  "code": 0,
  "message": "保存成功",
  "data": {
    "resultId": "res_1234567890",
    "score": 12,
    "level": "moderate",
    "createdAt": "2025-10-20T10:30:00.000Z"
  }
}
```

### 删除结果 - 成功响应

```javascript
{
  "code": 0,
  "message": "删除成功",
  "data": {
    "resultId": "res_1234567890",
    "deletedAt": "2025-10-20T10:35:00.000Z"
  }
}
```

## 错误码

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 401 | 未登录或token过期 | 重新登录 |
| 403 | 无权访问该结果 | 只能访问自己的结果 |
| 404 | 结果不存在 | 检查resultId是否正确 |
| 400 | 参数错误 | 检查必填参数 |
| 500 | 服务器错误 | 稍后重试 |

## 使用示例

### 示例1：获取结果详情

```javascript
// 前端调用
try {
  const res = await uniCloud.callFunction({
    name: 'assessment-result',
    data: {
      action: 'getDetail',
      resultId: 'res_1234567890'
    }
  });
  
  if (res.result.code === 0) {
    const result = res.result.data;
    console.log('结果详情:', result);
    
    // 显示结果
    this.score = result.score;
    this.level = result.level;
    this.suggestions = result.suggestions;
  } else {
    uni.showToast({
      title: res.result.message,
      icon: 'none'
    });
  }
} catch (error) {
  console.error('获取结果失败:', error);
  uni.showToast({
    title: '网络错误',
    icon: 'none'
  });
}
```

### 示例2：获取历史列表

```javascript
// 前端调用
const loadHistory = async () => {
  try {
    const res = await uniCloud.callFunction({
      name: 'assessment-result',
      data: {
        action: 'getHistory',
        scaleId: 'phq9', // 可选，过滤特定量表
        page: 1,
        pageSize: 10
      }
    });
    
    if (res.result.code === 0) {
      const { list, total, hasMore } = res.result.data;
      console.log('历史记录:', list);
      
      this.historyList = list;
      this.hasMore = hasMore;
    }
  } catch (error) {
    console.error('获取历史失败:', error);
  }
};
```

### 示例3：保存结果

```javascript
// 前端调用
const saveResult = async () => {
  try {
    const res = await uniCloud.callFunction({
      name: 'assessment-result',
      data: {
        action: 'saveResult',
        scaleId: 'phq9',
        score: 12,
        maxScore: 27,
        level: 'moderate',
        dimensions: [
          {
            label: '情绪状态',
            value: 15,
            max: 20,
            color: '#667eea'
          }
        ],
        answers: [
          {
            questionId: 'q1',
            answer: 2,
            marked: false
          }
        ],
        duration: 180
      }
    });
    
    if (res.result.code === 0) {
      const resultId = res.result.data.resultId;
      console.log('保存成功，结果ID:', resultId);
      
      // 跳转到结果页面
      uni.navigateTo({
        url: `/pages-sub/assess/result?resultId=${resultId}`
      });
    }
  } catch (error) {
    console.error('保存失败:', error);
  }
};
```

## 数据库表结构

### assessment_results 表

| 字段名 | 类型 | 说明 | 索引 |
|--------|------|------|------|
| _id | String | 结果ID（主键） | PRIMARY |
| user_id | String | 用户ID | INDEX |
| scale_id | String | 量表ID | INDEX |
| score | Number | 总分 | - |
| max_score | Number | 最高分 | - |
| level | String | 等级 | INDEX |
| dimensions | Array | 维度数据（JSON） | - |
| suggestions | Array | 建议（JSON） | - |
| risk_factors | Array | 风险因素（JSON） | - |
| duration | Number | 答题时长（秒） | - |
| created_at | Timestamp | 创建时间 | INDEX |
| updated_at | Timestamp | 更新时间 | - |
| deleted_at | Timestamp | 删除时间（软删除） | - |

### assessment_answers 表

| 字段名 | 类型 | 说明 | 索引 |
|--------|------|------|------|
| _id | String | 答案ID（主键） | PRIMARY |
| result_id | String | 结果ID（外键） | INDEX |
| question_id | String | 题目ID | - |
| answer | Mixed | 答案（数字/文本/数组） | - |
| marked | Boolean | 是否标记 | - |
| created_at | Timestamp | 创建时间 | - |

## 性能优化建议

### 1. 数据缓存

```javascript
// 本地缓存结果数据，减少网络请求
const cacheKey = `result_${resultId}`;
let cachedResult = uni.getStorageSync(cacheKey);

if (cachedResult && Date.now() - cachedResult.cachedAt < 3600000) {
  // 缓存未过期（1小时），直接使用
  return cachedResult.data;
} else {
  // 从服务器获取并缓存
  const result = await fetchResultFromServer(resultId);
  uni.setStorageSync(cacheKey, {
    data: result,
    cachedAt: Date.now()
  });
  return result;
}
```

### 2. 分页加载

```javascript
// 使用分页避免一次加载过多数据
const pageSize = 10; // 每页10条
let page = 1;

const loadMore = async () => {
  const res = await uniCloud.callFunction({
    name: 'assessment-result',
    data: {
      action: 'getHistory',
      page: page,
      pageSize: pageSize
    }
  });
  
  if (res.result.code === 0) {
    const { list, hasMore } = res.result.data;
    this.historyList = [...this.historyList, ...list];
    this.hasMore = hasMore;
    page++;
  }
};
```

### 3. 数据预加载

```javascript
// 在用户可能查看详情前预加载数据
const preloadResultDetail = (resultId) => {
  // 后台静默加载
  uniCloud.callFunction({
    name: 'assessment-result',
    data: {
      action: 'getDetail',
      resultId: resultId
    }
  }).then(res => {
    if (res.result.code === 0) {
      // 缓存到本地
      const cacheKey = `result_${resultId}`;
      uni.setStorageSync(cacheKey, {
        data: res.result.data,
        cachedAt: Date.now()
      });
    }
  });
};
```

## 安全性说明

### 1. 权限控制

- 用户只能查看和删除自己的评估结果
- 使用 uni-id 进行身份验证
- 所有接口需要登录后调用

### 2. 数据加密

- 敏感数据（如详细答案）在传输时使用HTTPS
- 本地存储使用加密（参考 `utils/result-cache.js`）

### 3. 数据校验

- 服务端验证所有输入参数
- 防止SQL注入和XSS攻击
- 限制单次查询数量（最大50条）

## 注意事项

1. **结果有效期**：建议设置30天有效期，过期后自动清理
2. **并发控制**：同一用户同一量表不能同时保存多个结果
3. **数据完整性**：删除结果时同时删除关联的答案记录
4. **隐私保护**：不返回其他用户的评估结果
5. **异常处理**：网络错误时提示用户稍后重试

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2025-10-20 | 初始版本，支持基本的CRUD操作 |

## 相关文档

- [评估量表说明](./assessment-scales.md)
- [数据库设计](../database/schema-assessments.md)
- [前端集成指南](./frontend-integration.md)

---

**维护团队**: CraneHeart Team  
**联系方式**: support@craneheart.com  
**文档更新**: 2025-10-20

