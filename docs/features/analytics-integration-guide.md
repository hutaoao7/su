# 埋点系统接入指南

## 文档信息
- **创建日期**: 2025-10-21
- **版本**: 1.0.0
- **适用范围**: 翎心CraneHeart前端开发

---

## 一、快速开始

### 1.1 SDK初始化

在`main.js`中初始化埋点SDK：

```javascript
import { initAnalytics } from '@/utils/analytics.js';

// 初始化埋点SDK
initAnalytics({
  enabled: true,        // 是否启用埋点
  debug: false,         // 是否开启调试模式（生产环境请设为false）
  maxQueueSize: 10,     // 队列最大长度（达到后立即上报）
  flushInterval: 30000  // 自动上报间隔（毫秒）
});
```

### 1.2 设置用户信息

用户登录后设置用户信息：

```javascript
import { setUser } from '@/utils/analytics.js';

// 登录成功后
setUser(userId, {
  nickname: '用户昵称',
  gender: 'male',
  age: 25
});
```

用户登出时清除信息：

```javascript
import { clearUser } from '@/utils/analytics.js';

// 登出时
clearUser();
```

---

## 二、页面埋点

### 2.1 页面浏览埋点

在页面的`onShow`生命周期中添加：

```javascript
import { trackPageView } from '@/utils/analytics.js';

export default {
  onShow() {
    trackPageView(
      '/pages/assess/result',  // 页面路径
      '评估结果',               // 页面标题
      {                        // 额外属性（可选）
        scale_id: this.scaleId
      }
    );
  }
}
```

### 2.2 页面离开埋点

SDK会自动追踪页面停留时长，无需手动调用。

---

## 三、事件埋点

### 3.1 按钮点击埋点

```javascript
import { trackClick } from '@/utils/analytics.js';

methods: {
  handleButtonClick() {
    // 记录点击事件
    trackClick('submit_button', {
      form_type: 'assessment',
      button_text: '提交'
    });
    
    // 执行业务逻辑
    this.submitForm();
  }
}
```

### 3.2 自定义事件埋点

```javascript
import { track } from '@/utils/analytics.js';

// 评估完成
track('assessment_complete', {
  event_type: 'custom',
  scale_id: 'gad7',
  score: 12,
  level: 'medium',
  duration: 180  // 秒
}, true); // 第三个参数true表示立即上报

// AI对话发送消息
track('chat_send_message', {
  event_type: 'custom',
  message_length: 50,
  session_id: 'xxx',
  personality: 'gentle'
});
```

---

## 四、预定义事件

### 4.1 用户事件

| 事件名 | 说明 | 必需属性 | 可选属性 |
|--------|------|----------|----------|
| `user_login` | 用户登录 | `login_method` | `login_time` |
| `user_register` | 用户注册 | `register_method` | - |
| `user_logout` | 用户登出 | - | - |

**示例**：
```javascript
track('user_login', {
  event_type: 'custom',
  login_method: 'wechat',
  login_time: Date.now()
}, true);
```

### 4.2 评估事件

| 事件名 | 说明 | 必需属性 | 可选属性 |
|--------|------|----------|----------|
| `assessment_start` | 开始评估 | `scale_id` | `scale_name` |
| `assessment_complete` | 完成评估 | `scale_id`, `score`, `duration` | `level`, `marked_count` |
| `assessment_abandon` | 放弃评估 | `scale_id`, `progress` | `abandon_reason` |

**示例**：
```javascript
// 开始评估
track('assessment_start', {
  event_type: 'custom',
  scale_id: 'phq9',
  scale_name: 'PHQ-9抑郁症筛查量表'
});

// 完成评估
track('assessment_complete', {
  event_type: 'custom',
  scale_id: 'phq9',
  score: 15,
  level: 'medium',
  duration: 240,
  question_count: 9,
  marked_count: 2
}, true);
```

### 4.3 AI对话事件

| 事件名 | 说明 | 必需属性 | 可选属性 |
|--------|------|----------|----------|
| `chat_send_message` | 发送消息 | `message_length` | `session_id`, `personality` |
| `chat_ai_response` | AI回复 | `is_success` | `response_length`, `response_time`, `error_message` |
| `chat_session_create` | 创建会话 | `session_id` | - |

**示例**：
```javascript
// 发送消息
track('chat_send_message', {
  event_type: 'custom',
  message_length: 50,
  session_id: 'session_123',
  personality: 'gentle'
});

// AI回复成功
track('chat_ai_response', {
  event_type: 'custom',
  session_id: 'session_123',
  personality: 'gentle',
  is_success: true,
  response_length: 200,
  response_time: 1500
});
```

### 4.4 音乐事件

| 事件名 | 说明 | 必需属性 | 可选属性 |
|--------|------|----------|----------|
| `music_play` | 播放音乐 | `track_id` | `track_name`, `category` |
| `music_pause` | 暂停音乐 | `track_id` | `played_duration` |
| `music_favorite` | 收藏音乐 | `track_id` | `is_favorite` |

### 4.5 社区事件

| 事件名 | 说明 | 必需属性 | 可选属性 |
|--------|------|----------|----------|
| `topic_publish` | 发布话题 | `topic_id` | `has_images`, `content_length` |
| `topic_comment` | 评论话题 | `topic_id`, `comment_id` | `comment_length` |
| `topic_like` | 点赞话题 | `topic_id` | `is_like` |

---

## 五、错误追踪

### 5.1 捕获并记录错误

```javascript
import { trackError } from '@/utils/analytics.js';

try {
  // 业务代码
  this.doSomething();
} catch (error) {
  // 记录错误
  trackError(error, {
    component: 'ScaleRunner',
    method: 'submitAnswers'
  });
}
```

### 5.2 API错误追踪

SDK会自动拦截uni.request，无需手动调用。

---

## 六、数据上报策略

### 6.1 立即上报

以下事件会立即上报（不等待批量）：

- `user_login` - 用户登录
- `user_register` - 用户注册
- `error_occurred` - 错误发生
- `api_error` - API错误
- `assessment_complete` - 评估完成（关键事件）

### 6.2 批量上报

普通事件会累积到队列中，满足以下条件之一时上报：

1. 队列达到最大长度（默认10条）
2. 定时上报（默认30秒）
3. 页面隐藏时（H5端）

### 6.3 离线缓存

网络异常时，事件会自动缓存到本地（最多1000条），网络恢复后自动上报。

---

## 七、调试模式

### 7.1 开启调试

```javascript
initAnalytics({
  enabled: true,
  debug: true  // 开启调试模式
});
```

调试模式下会在控制台输出详细日志：

```
[Analytics] Analytics SDK initialized
[Analytics] Event tracked: {event_name: "page_view", ...}
[Analytics] Events flushed successfully: 5
```

### 7.2 关闭调试

生产环境请务必关闭调试模式：

```javascript
initAnalytics({
  enabled: true,
  debug: false  // 关闭调试
});
```

---

## 八、性能优化

### 8.1 减少上报次数

对于高频事件（如滚动、拖动），建议使用防抖/节流：

```javascript
import { debounce } from '@/utils/common.js';
import { track } from '@/utils/analytics.js';

methods: {
  onScroll: debounce(function(e) {
    track('page_scroll', {
      event_type: 'custom',
      scroll_top: e.scrollTop
    });
  }, 1000) // 1秒内最多触发1次
}
```

### 8.2 控制属性大小

事件属性应尽量精简，避免传递大对象：

```javascript
// ❌ 不推荐
track('assessment_complete', {
  event_type: 'custom',
  full_answers: this.allAnswers,  // 可能很大
  full_questions: this.allQuestions
});

// ✅ 推荐
track('assessment_complete', {
  event_type: 'custom',
  scale_id: this.scaleId,
  score: this.totalScore,
  question_count: this.questions.length
});
```

---

## 九、常见问题

### Q1: 埋点数据何时上报？

**A**: 
- 关键事件立即上报
- 普通事件批量上报（10条或30秒）
- 离线时缓存，网络恢复后上报

### Q2: 如何验证埋点是否成功？

**A**: 
1. 开启调试模式查看控制台日志
2. 登录uniCloud控制台查看events集合
3. 使用`云函数日志`查看上报记录

### Q3: 埋点会影响性能吗？

**A**: 
- SDK采用批量上报，减少网络请求
- 埋点代码包裹在try-catch中，不影响主业务
- 建议关闭调试模式以减少日志输出

### Q4: 如何自定义上报策略？

**A**: 
```javascript
initAnalytics({
  maxQueueSize: 20,      // 增大队列长度
  flushInterval: 60000,  // 延长上报间隔到1分钟
  immediateEvents: [     // 自定义立即上报事件
    'user_login',
    'user_register',
    'payment_success'
  ]
});
```

### Q5: 埋点数据如何分析？

**A**: 
1. 使用uniCloud控制台的数据分析功能
2. 导出数据到Excel/CSV
3. 使用SQL查询events集合
4. 接入第三方分析平台（如友盟、神策）

---

## 十、最佳实践

### 10.1 命名规范

- **事件名**: 使用小写+下划线，如`assessment_complete`
- **属性名**: 使用小写+下划线，如`scale_id`
- **避免**: 使用中文、特殊字符、驼峰命名

### 10.2 属性一致性

相同事件的属性应保持一致：

```javascript
// ✅ 好的做法
track('assessment_complete', {
  event_type: 'custom',
  scale_id: 'gad7',
  score: 12,
  duration: 180
});

track('assessment_complete', {
  event_type: 'custom',
  scale_id: 'phq9',
  score: 15,
  duration: 240
});

// ❌ 不好的做法（属性不一致）
track('assessment_complete', {
  event_type: 'custom',
  scaleId: 'gad7',  // 驼峰命名
  totalScore: 12,   // 属性名不一致
  time: 180         // 属性名不一致
});
```

### 10.3 必要性原则

只埋点真正需要分析的事件，避免过度埋点：

```javascript
// ✅ 必要的埋点
track('assessment_complete', {...});  // 核心业务
track('chat_send_message', {...});    // 核心业务

// ❌ 不必要的埋点
track('button_hover', {...});         // 价值不大
track('input_focus', {...});          // 高频低价值
```

### 10.4 隐私保护

避免上报敏感信息：

```javascript
// ❌ 不要上报
track('user_login', {
  event_type: 'custom',
  password: '123456',     // 密码
  id_card: 'xxx',         // 身份证号
  phone: '13800138000'    // 手机号明文
});

// ✅ 可以上报
track('user_login', {
  event_type: 'custom',
  login_method: 'wechat',
  user_type: 'student',
  age_range: '18-25'  // 脱敏后的信息
});
```

---

## 十一、附录

### 11.1 完整的事件字典

见 `docs/features/analytics-event-dictionary.md`

### 11.2 云函数接口文档

见 `docs/api/events-track.md`

### 11.3 数据库表设计

见 `docs/database/migrations/008_create_events_tables.sql`

---

**文档版本**: 1.0.0  
**最后更新**: 2025-10-21  
**维护团队**: CraneHeart 前端组  

🎉 **祝你埋点愉快！**

