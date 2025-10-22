# assessment-get-detail API文档

## 基本信息

- **云函数名称**: `assessment-get-detail`
- **功能描述**: 获取单个评估记录的详细信息
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多60次请求

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| assessment_id | String | 是 | 评估记录ID |
| include_answers | Boolean | 否 | 是否包含答案详情（默认false） |
| include_result | Boolean | 否 | 是否包含结果详情（默认true） |

### 请求示例

```javascript
// 基础查询
const { result } = await uniCloud.callFunction({
  name: 'assessment-get-detail',
  data: {
    assessment_id: '550e8400-e29b-41d4-a716-446655440000'
  }
});

// 包含答案详情
const { result } = await uniCloud.callFunction({
  name: 'assessment-get-detail',
  data: {
    assessment_id: '550e8400-e29b-41d4-a716-446655440000',
    include_answers: true,
    include_result: true
  }
});
```

---

## 响应格式

### 成功响应（基础信息）

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "assessment": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user-uuid-xxx",
      "scale_id": "phq9",
      "scale_name": "患者健康问卷-9",
      "total_score": 12,
      "level": "中度抑郁",
      "status": "completed",
      "completion_time": 180,
      "started_at": "2025-10-22T10:00:00Z",
      "completed_at": "2025-10-22T10:03:00Z",
      "created_at": "2025-10-22T10:00:00Z"
    }
  }
}
```

### 成功响应（包含答案和结果）

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "assessment": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user-uuid-xxx",
      "scale_id": "phq9",
      "scale_name": "患者健康问卷-9",
      "total_score": 12,
      "level": "中度抑郁",
      "status": "completed",
      "completion_time": 180,
      "started_at": "2025-10-22T10:00:00Z",
      "completed_at": "2025-10-22T10:03:00Z",
      "created_at": "2025-10-22T10:00:00Z"
    },
    "answers": [
      {
        "question_id": "q1",
        "question_text": "做事时提不起劲或没有兴趣",
        "answer_value": "2",
        "answer_text": "一半以上的时间",
        "answer_score": 2
      },
      {
        "question_id": "q2",
        "question_text": "感到心情低落、沮丧或绝望",
        "answer_value": "1",
        "answer_text": "几天",
        "answer_score": 1
      }
    ],
    "result": {
      "total_score": 12,
      "max_score": 27,
      "score_percentage": 44.44,
      "level": "中度抑郁",
      "level_code": "moderate",
      "level_description": "您的抑郁症状达到中度水平，建议寻求专业帮助。",
      "suggestions": [
        "建议寻求专业心理咨询",
        "保持规律作息，每天至少7-8小时睡眠",
        "适度运动，每周至少3次有氧运动",
        "与亲友保持联系，分享您的感受"
      ],
      "risk_factors": [
        "睡眠质量差",
        "兴趣减退",
        "注意力不集中"
      ],
      "dimensions": [
        {
          "name": "情绪症状",
          "score": 6,
          "max_score": 12,
          "percentage": 50.0
        },
        {
          "name": "躯体症状",
          "score": 4,
          "max_score": 9,
          "percentage": 44.4
        },
        {
          "name": "认知症状",
          "score": 2,
          "max_score": 6,
          "percentage": 33.3
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
| 40001 | 缺少必填参数 | 检查assessment_id参数 |
| 40301 | 未登录 | 重新登录获取Token |
| 40302 | Token已过期 | 刷新Token或重新登录 |
| 40401 | 评估记录不存在 | 检查assessment_id是否正确 |
| 40403 | 无权访问此评估 | 只能查询自己的评估记录 |
| 50001 | 数据库查询失败 | 稍后重试 |
| 50002 | 服务器内部错误 | 联系技术支持 |

---

## 云函数实现示例

```javascript
'use strict';

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[ASSESSMENT-GET-DETAIL]';

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
    console.log(TAG, '请求开始');
    
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
    const { 
      assessment_id, 
      include_answers = false, 
      include_result = true 
    } = event;
    
    // 2. 参数校验
    if (!assessment_id) {
      return {
        code: 40001,
        msg: '缺少评估ID',
        data: null
      };
    }
    
    const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
    
    // 3. 查询评估基本信息
    const { data: assessment, error: assessError } = await supabase
      .from('assessments')
      .select(`
        *,
        assessment_scales(scale_id, name)
      `)
      .eq('id', assessment_id)
      .eq('user_id', userId)
      .single();
    
    if (assessError) {
      console.error(TAG, '查询评估失败:', assessError);
      
      if (assessError.code === 'PGRST116') {
        return {
          code: 40401,
          msg: '评估记录不存在或无权访问',
          data: null
        };
      }
      
      return {
        code: 50001,
        msg: '查询失败',
        data: null
      };
    }
    
    const responseData = {
      assessment: {
        id: assessment.id,
        user_id: assessment.user_id,
        scale_id: assessment.scale_id,
        scale_name: assessment.assessment_scales?.name || '',
        total_score: assessment.total_score,
        level: assessment.level,
        status: assessment.status,
        completion_time: assessment.completion_time,
        started_at: assessment.started_at,
        completed_at: assessment.completed_at,
        created_at: assessment.created_at
      }
    };
    
    // 4. 查询答案详情（如果需要）
    if (include_answers) {
      const { data: answers, error: answersError } = await supabase
        .from('assessment_answers')
        .select('*')
        .eq('assessment_id', assessment_id)
        .order('question_id', { ascending: true });
      
      if (!answersError && answers) {
        responseData.answers = answers;
      }
    }
    
    // 5. 查询结果详情（如果需要）
    if (include_result) {
      const { data: result, error: resultError } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('assessment_id', assessment_id)
        .single();
      
      if (!resultError && result) {
        responseData.result = result;
      }
    }
    
    console.log(TAG, '查询成功');
    
    return {
      code: 0,
      msg: '查询成功',
      data: responseData
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
```

---

## 前端集成示例

```javascript
// 在result.vue中使用
export default {
  data() {
    return {
      assessmentDetail: null,
      loading: false
    };
  },
  
  methods: {
    async loadAssessmentDetail(assessmentId) {
      this.loading = true;
      
      try {
        const res = await uniCloud.callFunction({
          name: 'assessment-get-detail',
          data: {
            assessment_id: assessmentId,
            include_answers: true,
            include_result: true
          }
        });
        
        if (res.result.code === 0) {
          this.assessmentDetail = res.result.data;
          console.log('评估详情:', this.assessmentDetail);
        } else {
          uni.showToast({
            title: res.result.msg,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('获取评估详情失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    }
  }
};
```

---

## 性能优化建议

1. **按需查询**: 根据实际需要设置`include_answers`和`include_result`参数，避免不必要的数据传输
2. **缓存策略**: 前端可缓存评估详情，避免重复请求
3. **数据库索引**: 确保`assessments`表的`id`和`user_id`字段有索引
4. **分页加载**: 如果答案数量很多，考虑分页加载答案详情

---

## 安全性说明

1. **权限控制**: 用户只能查询自己的评估记录
2. **Token验证**: 所有请求必须携带有效Token
3. **数据脱敏**: 敏感信息不返回给前端
4. **SQL注入防护**: 使用参数化查询，防止SQL注入

---

**创建时间**: 2025-10-22  
**最后更新**: 2025-10-22  
**版本**: v1.0

