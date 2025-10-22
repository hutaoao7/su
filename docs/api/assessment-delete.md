# assessment-delete API文档

## 基本信息

- **云函数名称**: `assessment-delete`
- **功能描述**: 删除评估记录及其关联数据
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多10次删除操作

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| assessment_id | String | 是 | 评估记录ID |
| delete_mode | String | 否 | 删除模式：soft（软删除，默认）/ hard（硬删除） |
| reason | String | 否 | 删除原因（可选） |

### 请求示例

```javascript
// 软删除（默认）
const { result } = await uniCloud.callFunction({
  name: 'assessment-delete',
  data: {
    assessment_id: '550e8400-e29b-41d4-a716-446655440000'
  }
});

// 硬删除（永久删除）
const { result } = await uniCloud.callFunction({
  name: 'assessment-delete',
  data: {
    assessment_id: '550e8400-e29b-41d4-a716-446655440000',
    delete_mode: 'hard',
    reason: '用户主动删除'
  }
});
```

---

## 响应格式

### 成功响应（软删除）

```json
{
  "code": 0,
  "msg": "删除成功",
  "data": {
    "assessment_id": "550e8400-e29b-41d4-a716-446655440000",
    "delete_mode": "soft",
    "deleted_at": "2025-10-22T10:30:00Z",
    "recoverable": true,
    "recovery_deadline": "2025-11-21T10:30:00Z"
  }
}
```

### 成功响应（硬删除）

```json
{
  "code": 0,
  "msg": "永久删除成功",
  "data": {
    "assessment_id": "550e8400-e29b-41d4-a716-446655440000",
    "delete_mode": "hard",
    "deleted_at": "2025-10-22T10:30:00Z",
    "recoverable": false,
    "deleted_records": {
      "assessment": 1,
      "answers": 9,
      "results": 1
    }
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 处理建议 |
|--------|----------|----------|
| 0 | 删除成功 | - |
| 40001 | 缺少必填参数 | 检查assessment_id参数 |
| 40002 | 无效的删除模式 | delete_mode只能是soft或hard |
| 40301 | 未登录 | 重新登录获取Token |
| 40302 | Token已过期 | 刷新Token或重新登录 |
| 40401 | 评估记录不存在 | 检查assessment_id是否正确 |
| 40403 | 无权删除此评估 | 只能删除自己的评估记录 |
| 40901 | 评估已被删除 | 该记录已被删除 |
| 50001 | 删除失败 | 稍后重试 |
| 50002 | 服务器内部错误 | 联系技术支持 |

---

## 云函数实现示例

```javascript
'use strict';

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[ASSESSMENT-DELETE]';

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
      delete_mode = 'soft',
      reason = ''
    } = event;
    
    // 2. 参数校验
    if (!assessment_id) {
      return {
        code: 40001,
        msg: '缺少评估ID',
        data: null
      };
    }
    
    if (!['soft', 'hard'].includes(delete_mode)) {
      return {
        code: 40002,
        msg: '无效的删除模式',
        data: null
      };
    }
    
    const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
    
    // 3. 检查评估是否存在且属于当前用户
    const { data: assessment, error: checkError } = await supabase
      .from('assessments')
      .select('id, user_id, status, deleted_at')
      .eq('id', assessment_id)
      .eq('user_id', userId)
      .single();
    
    if (checkError) {
      console.error(TAG, '查询评估失败:', checkError);
      
      if (checkError.code === 'PGRST116') {
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
    
    // 检查是否已被删除
    if (assessment.deleted_at && delete_mode === 'soft') {
      return {
        code: 40901,
        msg: '评估已被删除',
        data: null
      };
    }
    
    const now = new Date().toISOString();
    
    // 4. 执行删除操作
    if (delete_mode === 'soft') {
      // 软删除：只标记删除状态
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          deleted_at: now,
          delete_reason: reason,
          updated_at: now
        })
        .eq('id', assessment_id);
      
      if (updateError) {
        console.error(TAG, '软删除失败:', updateError);
        return {
          code: 50001,
          msg: '删除失败',
          data: null
        };
      }
      
      // 计算恢复期限（30天）
      const recoveryDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      console.log(TAG, '软删除成功');
      
      return {
        code: 0,
        msg: '删除成功',
        data: {
          assessment_id: assessment_id,
          delete_mode: 'soft',
          deleted_at: now,
          recoverable: true,
          recovery_deadline: recoveryDeadline
        }
      };
      
    } else {
      // 硬删除：永久删除所有关联数据
      let deletedRecords = {
        assessment: 0,
        answers: 0,
        results: 0
      };
      
      // 删除答案记录
      const { error: answersError, count: answersCount } = await supabase
        .from('assessment_answers')
        .delete({ count: 'exact' })
        .eq('assessment_id', assessment_id);
      
      if (!answersError) {
        deletedRecords.answers = answersCount || 0;
      }
      
      // 删除结果记录
      const { error: resultsError, count: resultsCount } = await supabase
        .from('assessment_results')
        .delete({ count: 'exact' })
        .eq('assessment_id', assessment_id);
      
      if (!resultsError) {
        deletedRecords.results = resultsCount || 0;
      }
      
      // 删除评估记录
      const { error: assessError } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessment_id);
      
      if (assessError) {
        console.error(TAG, '硬删除失败:', assessError);
        return {
          code: 50001,
          msg: '删除失败',
          data: null
        };
      }
      
      deletedRecords.assessment = 1;
      
      console.log(TAG, '硬删除成功，删除记录数:', deletedRecords);
      
      return {
        code: 0,
        msg: '永久删除成功',
        data: {
          assessment_id: assessment_id,
          delete_mode: 'hard',
          deleted_at: now,
          recoverable: false,
          deleted_records: deletedRecords
        }
      };
    }
    
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
// 在评估历史页面中使用
export default {
  methods: {
    // 删除评估记录
    async deleteAssessment(assessmentId) {
      // 二次确认
      const confirmResult = await uni.showModal({
        title: '确认删除',
        content: '删除后可在30天内恢复，是否继续？',
        confirmText: '删除',
        confirmColor: '#DC3545'
      });
      
      if (!confirmResult.confirm) {
        return;
      }
      
      uni.showLoading({ title: '删除中...' });
      
      try {
        const res = await uniCloud.callFunction({
          name: 'assessment-delete',
          data: {
            assessment_id: assessmentId,
            delete_mode: 'soft'
          }
        });
        
        uni.hideLoading();
        
        if (res.result.code === 0) {
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 刷新列表
          this.loadAssessmentList();
        } else {
          uni.showToast({
            title: res.result.msg,
            icon: 'none'
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('删除失败:', error);
        uni.showToast({
          title: '删除失败',
          icon: 'none'
        });
      }
    },
    
    // 永久删除（需要额外确认）
    async permanentDelete(assessmentId) {
      const confirmResult = await uni.showModal({
        title: '永久删除',
        content: '此操作不可恢复，确定要永久删除吗？',
        confirmText: '永久删除',
        confirmColor: '#DC3545'
      });
      
      if (!confirmResult.confirm) {
        return;
      }
      
      try {
        const res = await uniCloud.callFunction({
          name: 'assessment-delete',
          data: {
            assessment_id: assessmentId,
            delete_mode: 'hard',
            reason: '用户主动永久删除'
          }
        });
        
        if (res.result.code === 0) {
          uni.showToast({
            title: '已永久删除',
            icon: 'success'
          });
          
          this.loadAssessmentList();
        }
      } catch (error) {
        console.error('永久删除失败:', error);
      }
    }
  }
};
```

---

## 数据库设计建议

### assessments表字段扩展

```sql
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assessments_deleted_at 
ON assessments(deleted_at) WHERE deleted_at IS NOT NULL;
```

### 自动清理触发器（可选）

```sql
-- 创建定时清理函数（删除30天前的软删除记录）
CREATE OR REPLACE FUNCTION clean_deleted_assessments()
RETURNS void AS $$
BEGIN
  DELETE FROM assessments
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 可以通过定时任务调用此函数
```

---

## 安全性说明

1. **权限控制**: 用户只能删除自己的评估记录
2. **软删除优先**: 默认使用软删除，保留30天恢复期
3. **硬删除限制**: 硬删除需要额外确认，防止误操作
4. **审计日志**: 记录删除原因和时间，便于追溯
5. **级联删除**: 硬删除时自动删除关联的答案和结果数据

---

## 最佳实践

1. **默认软删除**: 前端默认使用软删除模式
2. **二次确认**: 删除操作前必须弹窗确认
3. **恢复功能**: 提供恢复入口，允许用户恢复软删除的记录
4. **定期清理**: 后台定时清理超过30天的软删除记录
5. **埋点统计**: 记录删除操作，分析用户行为

---

**创建时间**: 2025-10-22  
**最后更新**: 2025-10-22  
**版本**: v1.0

