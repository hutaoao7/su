# fn-feedback API文档

## 基本信息

- **云函数名称**: `fn-feedback`
- **功能描述**: 用户反馈功能（意见、建议、Bug报告）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 可选（建议携带Token）
- **限流策略**: 每用户每分钟最多5次请求

---

## 业务说明

本接口用于收集用户反馈，包括功能建议、Bug报告、用户体验反馈等，帮助产品团队改进产品。

### 反馈类型
- **Bug报告**：应用崩溃、功能异常、显示错误等
- **功能建议**：新功能需求、功能改进建议
- **使用问题**：使用过程中遇到的疑问
- **内容反馈**：量表内容、AI回复质量等
- **其他反馈**：其他类型的反馈

---

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| type | String | 是 | - | 反馈类型（bug/feature/question/content/other） |
| title | String | 是 | - | 反馈标题（5-50字符） |
| content | String | 是 | - | 反馈内容（10-2000字符） |
| images | Array | 否 | [] | 截图附件（最多9张） |
| contact | String | 否 | - | 联系方式（手机号/邮箱） |
| page_url | String | 否 | - | 问题发生页面 |
| device_info | Object | 否 | - | 设备信息 |
| app_version | String | 否 | - | 应用版本号 |

### 反馈类型说明

| 类型 | 值 | 说明 | 优先级 |
|------|------|------|--------|
| Bug报告 | bug | 功能异常、崩溃等 | 高 |
| 功能建议 | feature | 新功能需求 | 中 |
| 使用问题 | question | 使用疑问 | 中 |
| 内容反馈 | content | 内容质量反馈 | 低 |
| 其他反馈 | other | 其他 | 低 |

---

## 请求示例

### 1. Bug报告

```javascript
const { result } = await uniCloud.callFunction({
  name: 'fn-feedback',
  data: {
    type: 'bug',
    title: '评估结果页面显示异常',
    content: '完成PHQ-9评估后，点击查看结果时页面空白，无法显示评估结果。重新进入后问题依然存在。',
    images: [
      'https://cdn.example.com/feedback/img1.jpg',
      'https://cdn.example.com/feedback/img2.jpg'
    ],
    contact: '138****8888',
    page_url: '/pages/assess/result',
    device_info: {
      platform: 'mp-weixin',
      os: 'iOS',
      os_version: '16.0',
      device_model: 'iPhone 14 Pro',
      wechat_version: '8.0.40'
    },
    app_version: '1.0.0'
  }
});
```

### 2. 功能建议

```javascript
const { result } = await uniCloud.callFunction({
  name: 'fn-feedback',
  data: {
    type: 'feature',
    title: '希望增加深色模式',
    content: '建议增加深色/夜间模式功能，方便晚上使用时保护眼睛。可以参考微信的深色模式实现。',
    contact: 'user@example.com'
  }
});
```

### 3. 使用问题

```javascript
const { result } = await uniCloud.callFunction({
  name: 'fn-feedback',
  data: {
    type: 'question',
    title: '如何查看历史评估记录',
    content: '我想查看之前做过的评估记录，但是找不到入口。请问在哪里可以查看？',
    page_url: '/pages/user/home'
  }
});
```

### 4. 内容反馈

```javascript
const { result } = await uniCloud.callFunction({
  name: 'fn-feedback',
  data: {
    type: 'content',
    title: 'AI回复质量反馈',
    content: '今天的AI对话回复比较生硬，缺乏共情感，希望能更加温暖和专业。',
    page_url: '/pages/intervene/chat'
  }
});
```

---

## 响应数据

### 成功响应

```javascript
{
  "code": 200,
  "message": "反馈提交成功，感谢您的反馈",
  "data": {
    "feedback_id": "fb_xxx_xxx",
    "created_at": "2025-10-20T12:00:00Z",
    "status": "pending", // 处理状态：pending/processing/resolved/closed
    "ticket_number": "20251020001" // 工单号
  }
}
```

### 错误响应

**1. 参数校验失败**
```javascript
{
  "code": 400,
  "message": "反馈内容长度必须在10-2000字符之间",
  "data": null
}
```

**2. 请求过于频繁**
```javascript
{
  "code": 429,
  "message": "反馈提交过于频繁，请稍后再试",
  "data": {
    "retry_after": 60 // 秒
  }
}
```

**3. 图片数量超限**
```javascript
{
  "code": 400,
  "message": "最多上传9张图片",
  "data": null
}
```

---

## 数据库操作

### 相关表

**feedback表**
```sql
CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(100),
  type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[], -- 图片URL数组
  contact VARCHAR(100),
  page_url VARCHAR(500),
  device_info JSONB,
  app_version VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  priority INT DEFAULT 0, -- 优先级：0普通/1重要/2紧急
  assigned_to VARCHAR(100), -- 处理人
  resolved_at TIMESTAMPTZ,
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE UNIQUE INDEX idx_feedback_ticket_number ON feedback(ticket_number);
```

### 生成工单号
```javascript
function generateTicketNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `${dateStr}${seq}`;
}
```

---

## 业务逻辑

### 1. 参数校验
```javascript
function validateFeedback(data) {
  // 类型校验
  const validTypes = ['bug', 'feature', 'question', 'content', 'other'];
  if (!validTypes.includes(data.type)) {
    throw new Error('无效的反馈类型');
  }
  
  // 标题校验
  if (!data.title || data.title.length < 5 || data.title.length > 50) {
    throw new Error('反馈标题长度必须在5-50字符之间');
  }
  
  // 内容校验
  if (!data.content || data.content.length < 10 || data.content.length > 2000) {
    throw new Error('反馈内容长度必须在10-2000字符之间');
  }
  
  // 图片数量校验
  if (data.images && data.images.length > 9) {
    throw new Error('最多上传9张图片');
  }
  
  // 联系方式校验（可选）
  if (data.contact) {
    const phoneReg = /^1[3-9]\d{9}$/;
    const emailReg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
    
    if (!phoneReg.test(data.contact) && !emailReg.test(data.contact)) {
      throw new Error('联系方式格式不正确');
    }
  }
  
  return true;
}
```

### 2. 自动优先级判定
```javascript
function calculatePriority(feedback) {
  let priority = 0; // 默认普通
  
  // Bug类型默认重要
  if (feedback.type === 'bug') {
    priority = 1;
  }
  
  // 关键词提升优先级
  const urgentKeywords = ['崩溃', '闪退', '无法使用', '丢失', '支付'];
  const hasUrgentKeyword = urgentKeywords.some(keyword => 
    feedback.title.includes(keyword) || feedback.content.includes(keyword)
  );
  
  if (hasUrgentKeyword) {
    priority = 2; // 紧急
  }
  
  return priority;
}
```

### 3. 敏感词过滤
```javascript
function filterSensitiveWords(text) {
  const sensitiveWords = ['政治', '暴力', ...]; // 敏感词列表
  
  let filtered = text;
  sensitiveWords.forEach(word => {
    const regex = new Regex(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  
  return filtered;
}
```

### 4. 通知管理员
```javascript
async function notifyAdmin(feedback) {
  // 紧急反馈实时通知
  if (feedback.priority === 2) {
    await sendNotification({
      title: '紧急反馈提醒',
      content: `${feedback.title} - ${feedback.ticket_number}`,
      receivers: ['admin@example.com']
    });
  }
  
  // 普通反馈每日汇总
  // 通过定时任务实现
}
```

---

## 前端集成示例

### Vue组件中使用

```vue
<template>
  <view class="feedback-page">
    <u-form :model="form" ref="formRef">
      <!-- 反馈类型 -->
      <u-form-item label="反馈类型" required>
        <u-radio-group v-model="form.type">
          <u-radio name="bug">Bug报告</u-radio>
          <u-radio name="feature">功能建议</u-radio>
          <u-radio name="question">使用问题</u-radio>
          <u-radio name="content">内容反馈</u-radio>
          <u-radio name="other">其他</u-radio>
        </u-radio-group>
      </u-form-item>
      
      <!-- 标题 -->
      <u-form-item label="标题" required>
        <u-input 
          v-model="form.title" 
          placeholder="简要描述问题（5-50字符）" 
          maxlength="50"
        />
      </u-form-item>
      
      <!-- 详细描述 -->
      <u-form-item label="详细描述" required>
        <u-textarea 
          v-model="form.content" 
          placeholder="请详细描述您的问题或建议（10-2000字符）"
          maxlength="2000"
          :count="true"
        />
      </u-form-item>
      
      <!-- 截图上传 -->
      <u-form-item label="截图（选填）">
        <u-upload 
          :file-list="form.images"
          @afterRead="handleImageUpload"
          @delete="handleImageDelete"
          :max-count="9"
          multiple
        />
        <text class="tip">最多上传9张图片</text>
      </u-form-item>
      
      <!-- 联系方式 -->
      <u-form-item label="联系方式（选填）">
        <u-input 
          v-model="form.contact" 
          placeholder="手机号或邮箱，方便我们联系您"
        />
      </u-form-item>
      
      <!-- 提交按钮 -->
      <u-button 
        @click="handleSubmit" 
        type="primary" 
        :loading="loading"
        :disabled="!canSubmit"
      >
        提交反馈
      </u-button>
    </u-form>
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: {
        type: 'bug',
        title: '',
        content: '',
        images: [],
        contact: ''
      },
      loading: false
    };
  },
  
  computed: {
    canSubmit() {
      return this.form.title.length >= 5 && 
             this.form.content.length >= 10;
    }
  },
  
  methods: {
    async handleSubmit() {
      // 表单校验
      if (!this.canSubmit) {
        uni.showToast({ title: '请完整填写反馈信息', icon: 'none' });
        return;
      }
      
      this.loading = true;
      
      try {
        // 获取设备信息
        const systemInfo = uni.getSystemInfoSync();
        
        const { result } = await uniCloud.callFunction({
          name: 'fn-feedback',
          data: {
            ...this.form,
            page_url: this.$route.path,
            device_info: {
              platform: systemInfo.platform,
              os: systemInfo.system,
              os_version: systemInfo.version,
              device_model: systemInfo.model,
              wechat_version: systemInfo.version
            },
            app_version: this.getAppVersion()
          }
        });
        
        if (result.code === 200) {
          uni.showModal({
            title: '提交成功',
            content: `感谢您的反馈！工单号：${result.data.ticket_number}`,
            showCancel: false,
            success: () => {
              uni.navigateBack();
            }
          });
        } else {
          uni.showToast({ title: result.message, icon: 'none' });
        }
      } catch (error) {
        console.error('提交反馈失败:', error);
        uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    async handleImageUpload(file) {
      // 上传图片到云存储
      const uploadResult = await this.uploadImage(file.file);
      this.form.images.push(uploadResult.url);
    },
    
    handleImageDelete(event) {
      this.form.images.splice(event.index, 1);
    },
    
    async uploadImage(file) {
      // 上传逻辑
      return { url: 'https://cdn.example.com/image.jpg' };
    },
    
    getAppVersion() {
      // 获取应用版本号
      return '1.0.0';
    }
  }
};
</script>

<style scoped>
.feedback-page {
  padding: 30rpx;
}

.tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}
</style>
```

---

## 管理端功能

### 1. 反馈列表查询

```sql
-- 查询待处理反馈
SELECT 
  id,
  ticket_number,
  type,
  title,
  priority,
  created_at
FROM feedback
WHERE status = 'pending'
ORDER BY priority DESC, created_at DESC
LIMIT 20;
```

### 2. 反馈详情查询

```sql
-- 查询反馈详情
SELECT *
FROM feedback
WHERE id = $feedback_id;
```

### 3. 更新反馈状态

```sql
-- 更新处理状态
UPDATE feedback
SET 
  status = $status,
  assigned_to = $assigned_to,
  updated_at = NOW()
WHERE id = $feedback_id;
```

### 4. 添加管理员回复

```sql
-- 添加回复
UPDATE feedback
SET 
  admin_reply = $reply,
  replied_at = NOW(),
  status = 'resolved',
  updated_at = NOW()
WHERE id = $feedback_id;
```

---

## 统计分析

### 1. 反馈类型分布

```sql
SELECT 
  type,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM feedback
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY type
ORDER BY count DESC;
```

### 2. 反馈趋势

```sql
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS feedback_count
FROM feedback
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

### 3. 处理效率

```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) AS avg_resolve_hours,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count
FROM feedback
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

---

## 性能优化

### 1. 图片压缩
```javascript
// 前端压缩图片后上传
import { compressImage } from '@/utils/image.js';

async function uploadFeedbackImage(file) {
  const compressed = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8
  });
  
  return await uploadToCloud(compressed);
}
```

### 2. 批量查询优化
```sql
-- 使用分页和索引
SELECT *
FROM feedback
WHERE status = 'pending'
ORDER BY priority DESC, created_at DESC
LIMIT 20 OFFSET $offset;
```

---

## 监控指标

### 1. 关键指标
- 反馈提交量：每日/周/月反馈数量
- 反馈类型分布：Bug/功能/问题等占比
- 平均处理时长：从提交到解决的平均时间
- 用户满意度：回访调查结果

### 2. 告警规则
- Bug类型反馈突增（1小时内>10条）：触发告警
- 紧急反馈未及时处理（>2小时）：触发告警
- 平均处理时长>24小时：触发告警

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2025-10-20 | 初始版本 |

---

## 相关文档

- [反馈管理后台](../admin/feedback-management.md)
- [反馈处理流程](../workflow/feedback-workflow.md)

---

**文档维护**: CraneHeart开发团队  
**最后更新**: 2025-10-20

