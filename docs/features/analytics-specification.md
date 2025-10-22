# 埋点规范文档

## 文档信息
- **创建日期**: 2025-10-21
- **版本**: 1.0.0
- **状态**: 正式发布
- **适用范围**: 翎心CraneHeart全栈开发

---

## 一、埋点原则

### 1.1 必要性原则

**只埋点真正需要分析的数据**

✅ **应该埋点**：
- 核心业务流程（评估、对话、支付等）
- 关键用户行为（登录、注册、退出等）
- 性能指标（页面加载、API响应等）
- 错误信息（崩溃、异常、失败等）

❌ **不应埋点**：
- 高频低价值事件（鼠标移动、滚动等）
- 非核心功能（装饰性动画等）
- 重复或冗余的数据
- 敏感隐私信息

### 1.2 一致性原则

**命名、格式、属性保持统一**

✅ **统一命名**：
```javascript
// 正确：使用统一的命名风格
track('assessment_complete', {...});
track('assessment_start', {...});
track('assessment_abandon', {...});
```

❌ **混乱命名**：
```javascript
// 错误：命名风格不一致
track('assessmentComplete', {...});  // 驼峰
track('assessment-start', {...});    // 短横线
track('评估放弃', {...});             // 中文
```

### 1.3 简洁性原则

**属性精简，避免冗余**

✅ **精简属性**：
```javascript
track('chat_send_message', {
  event_type: 'custom',
  message_length: 50,
  session_id: 'xxx',
  personality: 'gentle'
});
```

❌ **冗余属性**：
```javascript
track('chat_send_message', {
  event_type: 'custom',
  message: '完整的消息内容...',      // 冗余
  message_length: 50,
  all_messages: [...],               // 冗余
  full_conversation_history: {...}   // 冗余
});
```

### 1.4 隐私保护原则

**不上报敏感信息**

✅ **可上报**：
- 用户ID（加密后）
- 行为数据（点击、浏览等）
- 统计数据（时长、次数等）
- 脱敏后的属性（年龄段、地区等）

❌ **禁止上报**：
- 密码、Token明文
- 身份证号、手机号
- 聊天内容明文
- 量表答案明文

---

## 二、命名规范

### 2.1 事件命名

**格式**: `模块_动作` 或 `对象_动作`

**示例**：
```
user_login          // 用户登录
assessment_complete // 评估完成
chat_send_message   // 聊天发送消息
topic_publish       // 话题发布
music_play          // 音乐播放
```

**规则**：
1. 使用小写字母
2. 使用下划线分隔
3. 动词在后，名词在前
4. 长度建议2-4个单词

**反例**：
```
// ❌ 错误示例
UserLogin           // 驼峰命名
user-login          // 短横线
完成评估             // 中文
assessmentCompletedSuccessfully  // 过长
login               // 过于简单，不明确
```

### 2.2 属性命名

**格式**: `描述性名词` 或 `名词_修饰词`

**示例**：
```javascript
{
  scale_id: 'gad7',           // 量表ID
  score: 12,                   // 分数
  duration: 180,               // 时长
  message_length: 50,          // 消息长度
  is_success: true,            // 是否成功
  error_message: 'xxx',        // 错误信息
  response_time: 1500          // 响应时间
}
```

**规则**：
1. 使用小写字母
2. 使用下划线分隔
3. 布尔值以`is_`、`has_`开头
4. 时间类以`_time`结尾
5. 时长类以`_duration`结尾

### 2.3 值规范

**字符串值**：
- 使用小写
- 使用下划线分隔
- 避免中文

```javascript
// ✅ 正确
{
  login_method: 'wechat',
  personality: 'gentle',
  level: 'medium'
}

// ❌ 错误
{
  login_method: 'WeChat',    // 驼峰
  personality: '温柔',        // 中文
  level: 'MEDIUM'            // 大写
}
```

**数值**：
- 整数：直接使用
- 浮点数：保留2位小数
- 时长：统一使用秒或毫秒

```javascript
// ✅ 正确
{
  score: 12,
  duration: 180,           // 秒
  response_time: 1500,     // 毫秒
  accuracy: 0.85           // 保留2位
}
```

---

## 三、事件分类

### 3.1 页面事件

| 事件名 | 说明 | 何时触发 |
|--------|------|----------|
| `page_view` | 页面浏览 | 页面onShow |
| `page_leave` | 页面离开 | 页面onHide |

### 3.2 用户事件

| 事件名 | 说明 | 何时触发 |
|--------|------|----------|
| `user_login` | 用户登录 | 登录成功 |
| `user_register` | 用户注册 | 注册成功 |
| `user_logout` | 用户登出 | 登出完成 |

### 3.3 评估事件

| 事件名 | 说明 | 何时触发 |
|--------|------|----------|
| `assessment_start` | 开始评估 | 进入量表页面 |
| `assessment_complete` | 完成评估 | 提交答案成功 |
| `assessment_abandon` | 放弃评估 | 中途退出 |

### 3.4 AI对话事件

| 事件名 | 说明 | 何时触发 |
|--------|------|----------|
| `chat_send_message` | 发送消息 | 点击发送 |
| `chat_ai_response` | AI回复 | 收到回复 |
| `chat_session_create` | 创建会话 | 新建会话 |
| `chat_session_switch` | 切换会话 | 切换会话 |

### 3.5 音乐事件

| 事件名 | 说明 | 何时触发 |
|--------|------|----------|
| `music_play` | 播放音乐 | 点击播放 |
| `music_pause` | 暂停音乐 | 点击暂停 |
| `music_favorite` | 收藏音乐 | 点击收藏 |

### 3.6 社区事件

| 事件名 | 说明 | 何时触发 |
|--------|------|----------|
| `topic_publish` | 发布话题 | 发布成功 |
| `topic_comment` | 评论话题 | 评论成功 |
| `topic_like` | 点赞话题 | 点击点赞 |
| `topic_share` | 分享话题 | 点击分享 |

### 3.7 错误事件

| 事件名 | 说明 | 何时触发 |
|--------|------|----------|
| `error_occurred` | 错误发生 | 捕获异常 |
| `api_error` | API错误 | 请求失败 |

---

## 四、属性规范

### 4.1 通用属性

所有事件都应包含以下通用属性（由SDK自动添加）：

```javascript
{
  event_time: 1634567890000,    // 事件时间戳
  user_id: 'xxx',                // 用户ID
  session_id: 'xxx',             // 会话ID
  page_url: '/pages/xxx',        // 页面路径
  device_info: {...},            // 设备信息
  platform: 'mp-weixin',         // 平台
  app_version: '1.0.0',          // 应用版本
  sdk_version: '1.0.0'           // SDK版本
}
```

### 4.2 评估事件属性

```javascript
// assessment_start
{
  event_type: 'custom',
  scale_id: 'gad7',              // 量表ID（必需）
  scale_name: 'GAD-7焦虑量表'    // 量表名称
}

// assessment_complete
{
  event_type: 'custom',
  scale_id: 'gad7',              // 量表ID（必需）
  scale_name: 'GAD-7焦虑量表',   // 量表名称
  score: 12,                     // 总分（必需）
  level: 'medium',               // 等级（必需）
  duration: 180,                 // 耗时秒数（必需）
  question_count: 7,             // 题目数量
  marked_count: 2                // 标记数量
}

// assessment_abandon
{
  event_type: 'custom',
  scale_id: 'gad7',              // 量表ID（必需）
  progress: 0.6,                 // 进度（0-1）
  abandon_reason: 'user_exit'    // 放弃原因
}
```

### 4.3 AI对话事件属性

```javascript
// chat_send_message
{
  event_type: 'custom',
  message_length: 50,            // 消息长度（必需）
  session_id: 'xxx',             // 会话ID
  personality: 'gentle',         // AI人格
  has_sensitive: false,          // 是否含敏感词
  is_crisis: false               // 是否危机信息
}

// chat_ai_response
{
  event_type: 'custom',
  session_id: 'xxx',             // 会话ID
  personality: 'gentle',         // AI人格
  is_success: true,              // 是否成功（必需）
  response_length: 200,          // 回复长度
  response_time: 1500,           // 响应时长（毫秒）
  error_message: ''              // 错误信息（失败时）
}
```

### 4.4 音乐事件属性

```javascript
// music_play
{
  event_type: 'custom',
  track_id: 'xxx',               // 曲目ID（必需）
  track_name: '放松音乐',        // 曲目名称
  category: 'relax',             // 分类
  is_favorite: false             // 是否已收藏
}

// music_favorite
{
  event_type: 'custom',
  track_id: 'xxx',               // 曲目ID（必需）
  is_favorite: true              // 是否收藏（必需）
}
```

### 4.5 社区事件属性

```javascript
// topic_publish
{
  event_type: 'custom',
  topic_id: 'xxx',               // 话题ID（必需）
  has_images: true,              // 是否有图片
  image_count: 3,                // 图片数量
  content_length: 200            // 内容长度
}

// topic_comment
{
  event_type: 'custom',
  topic_id: 'xxx',               // 话题ID（必需）
  comment_id: 'xxx',             // 评论ID（必需）
  comment_length: 50             // 评论长度
}
```

---

## 五、上报策略

### 5.1 立即上报事件

以下事件必须立即上报（`immediate: true`）：

1. **用户事件**
   - `user_login`
   - `user_register`

2. **关键业务事件**
   - `assessment_complete`
   - `payment_success`

3. **错误事件**
   - `error_occurred`
   - `api_error`

**代码示例**：
```javascript
track('assessment_complete', {
  event_type: 'custom',
  scale_id: 'gad7',
  score: 12,
  duration: 180
}, true);  // 第三个参数true表示立即上报
```

### 5.2 批量上报事件

普通事件采用批量上报：

1. **页面事件**
   - `page_view`
   - `page_leave`

2. **交互事件**
   - `button_click`
   - `topic_like`
   - `music_play`

3. **普通业务事件**
   - `assessment_start`
   - `chat_send_message`

---

## 六、代码示例

### 6.1 页面埋点

```javascript
// pages/assess/result.vue
export default {
  data() {
    return {
      scaleId: 'gad7'
    };
  },
  
  onShow() {
    // 页面浏览埋点
    const { trackPageView } = require('@/utils/analytics.js');
    trackPageView(
      '/pages/assess/result',
      '评估结果',
      { scale_id: this.scaleId }
    );
  }
};
```

### 6.2 按钮点击埋点

```javascript
// components/scale/ScaleRunner.vue
methods: {
  submitAnswers() {
    // 记录点击事件
    const { trackClick } = require('@/utils/analytics.js');
    trackClick('submit_assessment', {
      scale_id: this.scaleId,
      question_count: this.questions.length
    });
    
    // 执行业务逻辑
    this.processSubmit();
  }
}
```

### 6.3 业务事件埋点

```javascript
// components/scale/ScaleRunner.vue
methods: {
  navigateToResult(summary) {
    // 评估完成埋点
    const { track } = require('@/utils/analytics.js');
    track('assessment_complete', {
      event_type: 'custom',
      scale_id: this.scaleId,
      score: summary.score,
      level: summary.level,
      duration: this.elapsedTime,
      question_count: this.questions.length
    }, true);  // 立即上报
    
    // 跳转到结果页
    uni.navigateTo({
      url: `/pages/assess/result?...`
    });
  }
}
```

### 6.4 错误埋点

```javascript
// pages/intervene/chat.vue
methods: {
  async sendToAI(messageIndex) {
    try {
      // 调用AI接口
      const res = await uniCloud.callFunction({
        name: 'stress-chat',
        data: {...}
      });
      
      if (res.result && res.result.success) {
        // 成功埋点
        const { track } = require('@/utils/analytics.js');
        track('chat_ai_response', {
          event_type: 'custom',
          is_success: true,
          response_time: Date.now() - startTime
        });
      }
    } catch (error) {
      // 错误埋点
      const { trackError } = require('@/utils/analytics.js');
      trackError(error, {
        component: 'chat.vue',
        method: 'sendToAI'
      });
    }
  }
}
```

---

## 七、质量检查清单

### 7.1 提交前检查

在提交埋点代码前，请确认：

- [ ] 事件命名符合规范（小写+下划线）
- [ ] 属性命名符合规范（小写+下划线）
- [ ] 值格式符合规范（小写，无中文）
- [ ] 必需属性齐全
- [ ] 没有上报敏感信息
- [ ] 立即上报标记正确
- [ ] 代码添加了注释
- [ ] 已在调试模式下测试

### 7.2 Code Review要点

- [ ] 埋点位置合理
- [ ] 埋点时机正确
- [ ] 不影响主业务逻辑
- [ ] 性能影响可控
- [ ] 符合隐私保护要求

---

## 八、FAQ

### Q1: 如何确定是否需要埋点？

**A**: 问自己三个问题：
1. 这个数据对产品分析有价值吗？
2. 这个数据可以帮助改进产品吗？
3. 这个数据的收集频率合理吗？

如果三个问题都是"是"，则应该埋点。

### Q2: 如何避免过度埋点？

**A**: 
- 只埋关键路径和核心功能
- 避免高频低价值事件
- 定期review埋点价值
- 移除不再使用的埋点

### Q3: 如何保证埋点质量？

**A**: 
- 使用统一的命名规范
- 建立埋点文档和字典
- Code Review必须检查埋点
- 定期测试埋点数据

---

## 九、附录

### 9.1 相关文档

- [埋点接入指南](./analytics-integration-guide.md)
- [事件字典](./analytics-event-dictionary.md)
- [API文档](../api/events-track.md)

### 9.2 工具和脚本

- 埋点数据验证脚本（开发中）
- 埋点覆盖率检查工具（开发中）

---

**文档版本**: 1.0.0  
**最后更新**: 2025-10-21  
**维护团队**: CraneHeart 数据组  

📊 **让数据驱动决策！**

