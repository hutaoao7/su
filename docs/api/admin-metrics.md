# admin-metrics API文档

## 基本信息

- **云函数名称**: `admin-metrics`
- **功能描述**: 获取系统运营指标和统计数据（管理员专用）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要管理员Token认证
- **限流策略**: 每管理员每分钟最多30次请求

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| metric_type | String | 是 | 指标类型（overview/users/assessments/ai/errors） |
| time_range | String | 否 | 时间范围（today/week/month/custom，默认today） |
| start_date | String | 否 | 开始日期（time_range=custom时必填） |
| end_date | String | 否 | 结束日期（time_range=custom时必填） |
| group_by | String | 否 | 分组维度（hour/day/week/month，默认day） |

### 请求示例

```javascript
// 获取今日概览
const { result } = await uniCloud.callFunction({
  name: 'admin-metrics',
  data: {
    metric_type: 'overview',
    time_range: 'today'
  }
});

// 获取本周用户统计
const { result } = await uniCloud.callFunction({
  name: 'admin-metrics',
  data: {
    metric_type: 'users',
    time_range: 'week',
    group_by: 'day'
  }
});

// 自定义时间范围
const { result } = await uniCloud.callFunction({
  name: 'admin-metrics',
  data: {
    metric_type: 'assessments',
    time_range: 'custom',
    start_date: '2025-10-01',
    end_date: '2025-10-22',
    group_by: 'week'
  }
});
```

---

## 响应格式

### 1. 概览指标（overview）

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "metric_type": "overview",
    "time_range": "today",
    "generated_at": "2025-10-22T10:00:00Z",
    "metrics": {
      "users": {
        "total": 15234,
        "new_today": 156,
        "active_today": 3421,
        "growth_rate": 2.3
      },
      "assessments": {
        "total": 45678,
        "completed_today": 892,
        "avg_completion_time": 185,
        "popular_scales": [
          { "scale_id": "phq9", "count": 234 },
          { "scale_id": "gad7", "count": 189 }
        ]
      },
      "ai_chat": {
        "total_sessions": 8934,
        "active_sessions_today": 456,
        "total_messages": 123456,
        "messages_today": 2345,
        "avg_response_time": 1.2
      },
      "errors": {
        "total_today": 23,
        "fatal_today": 2,
        "error_rate": 0.12
      },
      "system": {
        "api_calls_today": 45678,
        "avg_response_time": 234,
        "success_rate": 99.88
      }
    }
  }
}
```

### 2. 用户指标（users）

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "metric_type": "users",
    "time_range": "week",
    "metrics": {
      "summary": {
        "total_users": 15234,
        "new_users": 892,
        "active_users": 8456,
        "retention_rate": 67.8
      },
      "daily_stats": [
        {
          "date": "2025-10-16",
          "new_users": 123,
          "active_users": 1234,
          "dau": 1234
        },
        {
          "date": "2025-10-17",
          "new_users": 145,
          "active_users": 1345,
          "dau": 1345
        }
      ],
      "user_distribution": {
        "by_platform": {
          "mp-weixin": 12345,
          "h5": 2345,
          "app": 544
        },
        "by_region": {
          "北京": 2345,
          "上海": 1890,
          "广州": 1567
        }
      }
    }
  }
}
```

### 3. 评估指标（assessments）

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "metric_type": "assessments",
    "time_range": "month",
    "metrics": {
      "summary": {
        "total_assessments": 45678,
        "completed": 43210,
        "abandoned": 2468,
        "completion_rate": 94.6,
        "avg_completion_time": 185
      },
      "by_scale": [
        {
          "scale_id": "phq9",
          "scale_name": "患者健康问卷-9",
          "count": 8934,
          "avg_score": 8.5,
          "level_distribution": {
            "无": 2345,
            "轻度": 3456,
            "中度": 2134,
            "重度": 999
          }
        }
      ],
      "daily_stats": [
        {
          "date": "2025-10-01",
          "count": 234,
          "completed": 221,
          "avg_time": 178
        }
      ]
    }
  }
}
```

### 4. AI对话指标（ai）

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "metric_type": "ai",
    "time_range": "week",
    "metrics": {
      "summary": {
        "total_sessions": 8934,
        "active_sessions": 3456,
        "total_messages": 123456,
        "avg_messages_per_session": 13.8,
        "avg_response_time": 1.2,
        "satisfaction_rate": 87.5
      },
      "by_personality": {
        "empathetic": 5234,
        "professional": 2890,
        "humorous": 810
      },
      "by_scene": {
        "stress": 4567,
        "study": 2345,
        "social": 1234,
        "sleep": 788
      },
      "feedback_stats": {
        "total_feedbacks": 2345,
        "positive": 2050,
        "negative": 295,
        "positive_rate": 87.4
      },
      "daily_stats": [
        {
          "date": "2025-10-16",
          "sessions": 456,
          "messages": 6234,
          "avg_response_time": 1.1
        }
      ]
    }
  }
}
```

### 5. 错误指标（errors）

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "metric_type": "errors",
    "time_range": "today",
    "metrics": {
      "summary": {
        "total_errors": 234,
        "fatal_errors": 12,
        "error_rate": 0.51,
        "affected_users": 89
      },
      "by_type": {
        "api_error": 123,
        "js_error": 67,
        "promise_rejection": 34,
        "resource_error": 10
      },
      "by_level": {
        "fatal": 12,
        "error": 145,
        "warning": 77
      },
      "top_errors": [
        {
          "fingerprint": "TypeError_undefined_xxx",
          "count": 45,
          "message": "Cannot read property 'xxx' of undefined",
          "page": "/pages/assess/result"
        }
      ],
      "hourly_stats": [
        {
          "hour": "00:00",
          "count": 12
        },
        {
          "hour": "01:00",
          "count": 8
        }
      ]
    }
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 处理建议 |
|--------|----------|----------|
| 0 | 查询成功 | - |
| 40001 | 缺少必填参数 | 检查metric_type参数 |
| 40002 | 无效的指标类型 | 使用overview/users/assessments/ai/errors |
| 40003 | 无效的时间范围 | 使用today/week/month/custom |
| 40004 | 自定义时间范围缺少日期 | 提供start_date和end_date |
| 40301 | 未登录 | 重新登录获取Token |
| 40302 | Token已过期 | 刷新Token或重新登录 |
| 40303 | 权限不足 | 需要管理员权限 |
| 50001 | 查询失败 | 稍后重试 |
| 50002 | 服务器内部错误 | 联系技术支持 |

---

## 云函数实现示例

```javascript
'use strict';

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[ADMIN-METRICS]';

// 管理员权限验证
function verifyAdminToken(context) {
  const token = context.UNI_ID_TOKEN || context.TOKEN;
  
  if (!token) {
    return { success: false, uid: null, isAdmin: false, message: '未登录' };
  }
  
  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const uid = payload.sub || payload.uid;
    const role = payload.role || 'user';
    
    return { 
      success: true, 
      uid, 
      isAdmin: role === 'admin',
      message: role === 'admin' ? '' : '权限不足'
    };
  } catch (error) {
    return { success: false, uid: null, isAdmin: false, message: 'Token解析失败' };
  }
}

// 获取时间范围
function getTimeRange(timeRange, startDate, endDate) {
  const now = new Date();
  let start, end;
  
  switch (timeRange) {
    case 'today':
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'week':
      start = new Date(now.setDate(now.getDate() - 7));
      end = new Date();
      break;
    case 'month':
      start = new Date(now.setDate(now.getDate() - 30));
      end = new Date();
      break;
    case 'custom':
      start = new Date(startDate);
      end = new Date(endDate);
      break;
    default:
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
  }
  
  return { start: start.toISOString(), end: end.toISOString() };
}

exports.main = async (event, context) => {
  try {
    console.log(TAG, '请求开始');
    
    // 1. 验证管理员权限
    const authResult = verifyAdminToken(context);
    if (!authResult.success || !authResult.isAdmin) {
      return {
        code: 40303,
        msg: authResult.message || '权限不足',
        data: null
      };
    }
    
    const { 
      metric_type,
      time_range = 'today',
      start_date,
      end_date,
      group_by = 'day'
    } = event;
    
    // 2. 参数校验
    if (!metric_type) {
      return {
        code: 40001,
        msg: '缺少指标类型',
        data: null
      };
    }
    
    const validMetricTypes = ['overview', 'users', 'assessments', 'ai', 'errors'];
    if (!validMetricTypes.includes(metric_type)) {
      return {
        code: 40002,
        msg: '无效的指标类型',
        data: null
      };
    }
    
    if (time_range === 'custom' && (!start_date || !end_date)) {
      return {
        code: 40004,
        msg: '自定义时间范围需要提供开始和结束日期',
        data: null
      };
    }
    
    const timeRange = getTimeRange(time_range, start_date, end_date);
    const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
    
    // 3. 根据指标类型查询数据
    let metrics = {};
    
    switch (metric_type) {
      case 'overview':
        metrics = await getOverviewMetrics(supabase, timeRange);
        break;
      case 'users':
        metrics = await getUserMetrics(supabase, timeRange, group_by);
        break;
      case 'assessments':
        metrics = await getAssessmentMetrics(supabase, timeRange, group_by);
        break;
      case 'ai':
        metrics = await getAIMetrics(supabase, timeRange, group_by);
        break;
      case 'errors':
        metrics = await getErrorMetrics(supabase, timeRange, group_by);
        break;
    }
    
    console.log(TAG, '查询成功');
    
    return {
      code: 0,
      msg: '查询成功',
      data: {
        metric_type,
        time_range,
        generated_at: new Date().toISOString(),
        metrics
      }
    };
    
  } catch (error) {
    console.error(TAG, '异常:', error);
    return {
      code: 50002,
      msg: '服务器内部错误',
      data: null
    };
  }
};

// 获取概览指标（示例实现）
async function getOverviewMetrics(supabase, timeRange) {
  // TODO: 实现具体查询逻辑
  return {
    users: { total: 0, new_today: 0, active_today: 0 },
    assessments: { total: 0, completed_today: 0 },
    ai_chat: { total_sessions: 0, messages_today: 0 },
    errors: { total_today: 0, fatal_today: 0 }
  };
}

// 其他指标查询函数...
```

---

**创建时间**: 2025-10-22  
**最后更新**: 2025-10-22  
**版本**: v1.0（部分完成，需补充具体查询逻辑）

