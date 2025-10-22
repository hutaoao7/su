# 埋点事件字典

## 文档信息
- **创建日期**: 2025-10-21
- **版本**: 1.0.0
- **状态**: 正式发布

---

## 一、页面事件

### page_view - 页面浏览

**触发时机**: 页面onShow生命周期

**必需属性**:
```javascript
{
  event_type: 'page_view',
  page_url: '/pages/assess/result',  // 页面路径
  page_title: '评估结果',             // 页面标题
  referrer: '/pages/home/index'      // 来源页面
}
```

**可选属性**:
- `enter_time`: 进入时间戳
- 其他业务属性（如scale_id等）

---

### page_leave - 页面离开

**触发时机**: 页面onHide生命周期

**必需属性**:
```javascript
{
  event_type: 'page_view',
  page_url: '/pages/assess/result',
  duration: 60  // 停留时长（秒）
}
```

---

## 二、用户事件

### user_login - 用户登录

**触发时机**: 登录成功后

**必需属性**:
```javascript
{
  event_type: 'custom',
  login_method: 'wechat'  // 登录方式：wechat/phone/password
}
```

**可选属性**:
- `login_time`: 登录耗时（毫秒）
- `is_auto`: 是否自动登录
- `is_first_login`: 是否首次登录

---

### user_register - 用户注册

**触发时机**: 注册成功后

**必需属性**:
```javascript
{
  event_type: 'custom',
  register_method: 'wechat'  // 注册方式
}
```

**可选属性**:
- `register_time`: 注册耗时（毫秒）
- `source`: 注册来源（invite/search/ad等）

---

### user_logout - 用户登出

**触发时机**: 用户主动登出

**必需属性**:
```javascript
{
  event_type: 'custom'
}
```

**可选属性**:
- `logout_reason`: 登出原因（user_action/session_expire/force_logout）

---

## 三、评估事件

### assessment_start - 开始评估

**触发时机**: 进入量表答题页面

**必需属性**:
```javascript
{
  event_type: 'custom',
  scale_id: 'gad7',              // 量表ID
  scale_name: 'GAD-7焦虑量表'    // 量表名称
}
```

**可选属性**:
- `scale_category`: 量表分类（stress/anxiety/depression等）
- `source`: 进入来源（home/recommend/search）

---

### assessment_complete - 完成评估

**触发时机**: 提交答案成功

**必需属性**:
```javascript
{
  event_type: 'custom',
  scale_id: 'gad7',           // 量表ID
  score: 12,                  // 总分
  level: 'medium',            // 等级：low/medium/high/critical
  duration: 180               // 答题时长（秒）
}
```

**可选属性**:
- `scale_name`: 量表名称
- `question_count`: 题目数量
- `marked_count`: 标记的题目数量
- `is_completed`: 是否完整完成（true/false）
- `completion_rate`: 完成率（0-100）

**level取值说明**:
- `low`: 风险较低
- `medium`: 中等风险
- `high`: 风险偏高
- `critical`: 需立即关注

---

### assessment_abandon - 放弃评估

**触发时机**: 答题中途退出

**必需属性**:
```javascript
{
  event_type: 'custom',
  scale_id: 'gad7',
  progress: 0.6  // 进度（0-1）
}
```

**可选属性**:
- `abandon_reason`: 放弃原因（user_exit/network_error/timeout）
- `answered_count`: 已回答题目数
- `total_count`: 总题目数

---

## 四、AI对话事件

### chat_send_message - 发送消息

**触发时机**: 用户点击发送按钮

**必需属性**:
```javascript
{
  event_type: 'custom',
  message_length: 50  // 消息长度（字符数）
}
```

**可选属性**:
- `session_id`: 会话ID
- `personality`: AI人格（gentle/professional/humorous）
- `has_sensitive`: 是否包含敏感词
- `is_crisis`: 是否危机信息
- `message_count`: 当前会话消息数

---

### chat_ai_response - AI回复

**触发时机**: 收到AI回复

**必需属性**:
```javascript
{
  event_type: 'custom',
  is_success: true  // 是否成功
}
```

**成功时可选属性**:
- `session_id`: 会话ID
- `personality`: AI人格
- `response_length`: 回复长度（字符数）
- `response_time`: 响应时长（毫秒）

**失败时可选属性**:
- `error_type`: 错误类型（network_error/timeout/api_error）
- `error_message`: 错误信息

---

### chat_session_create - 创建会话

**触发时机**: 用户创建新会话

**必需属性**:
```javascript
{
  event_type: 'custom',
  session_id: 'xxx'  // 会话ID
}
```

**可选属性**:
- `session_name`: 会话名称
- `personality`: 初始人格设置

---

### chat_session_switch - 切换会话

**触发时机**: 用户切换到其他会话

**必需属性**:
```javascript
{
  event_type: 'custom',
  from_session_id: 'xxx',  // 源会话ID
  to_session_id: 'yyy'     // 目标会话ID
}
```

---

### chat_personality_change - 切换AI人格

**触发时机**: 用户更改AI人格设置

**必需属性**:
```javascript
{
  event_type: 'custom',
  from_personality: 'gentle',    // 原人格
  to_personality: 'professional' // 新人格
}
```

---

## 五、音乐事件

### music_play - 播放音乐

**触发时机**: 点击播放按钮

**必需属性**:
```javascript
{
  event_type: 'custom',
  track_id: 'xxx'  // 曲目ID
}
```

**可选属性**:
- `track_name`: 曲目名称
- `category`: 分类（relax/sleep/focus等）
- `is_favorite`: 是否已收藏
- `play_source`: 播放来源（list/recommend/search）

---

### music_pause - 暂停音乐

**触发时机**: 点击暂停按钮

**必需属性**:
```javascript
{
  event_type: 'custom',
  track_id: 'xxx'
}
```

**可选属性**:
- `played_duration`: 已播放时长（秒）
- `total_duration`: 曲目总时长（秒）
- `play_progress`: 播放进度（0-1）

---

### music_favorite - 收藏音乐

**触发时机**: 点击收藏按钮

**必需属性**:
```javascript
{
  event_type: 'custom',
  track_id: 'xxx',
  is_favorite: true  // true=收藏，false=取消收藏
}
```

---

### music_speed_change - 调整播放速度

**触发时机**: 用户更改播放速度

**必需属性**:
```javascript
{
  event_type: 'custom',
  track_id: 'xxx',
  speed: 1.5  // 播放速度（0.5-2.0）
}
```

---

## 六、社区事件

### topic_publish - 发布话题

**触发时机**: 发布成功

**必需属性**:
```javascript
{
  event_type: 'custom',
  topic_id: 'xxx'  // 话题ID
}
```

**可选属性**:
- `has_images`: 是否有图片
- `image_count`: 图片数量
- `content_length`: 内容长度（字符数）
- `publish_time`: 发布耗时（毫秒）

---

### topic_comment - 评论话题

**触发时机**: 评论成功

**必需属性**:
```javascript
{
  event_type: 'custom',
  topic_id: 'xxx',      // 话题ID
  comment_id: 'yyy'     // 评论ID
}
```

**可选属性**:
- `comment_length`: 评论长度（字符数）
- `is_reply`: 是否回复评论（true/false）
- `parent_comment_id`: 父评论ID（回复时）

---

### topic_like - 点赞话题

**触发时机**: 点击点赞按钮

**必需属性**:
```javascript
{
  event_type: 'custom',
  topic_id: 'xxx',
  is_like: true  // true=点赞，false=取消点赞
}
```

---

### topic_share - 分享话题

**触发时机**: 点击分享按钮

**必需属性**:
```javascript
{
  event_type: 'custom',
  topic_id: 'xxx',
  share_channel: 'wechat'  // 分享渠道：wechat/moments/copy_link
}
```

---

### topic_report - 举报话题

**触发时机**: 提交举报

**必需属性**:
```javascript
{
  event_type: 'custom',
  topic_id: 'xxx',
  report_type: 'spam'  // 举报类型
}
```

**report_type取值**:
- `spam`: 垃圾信息
- `inappropriate`: 不当内容
- `harassment`: 骚扰行为
- `fake`: 虚假信息
- `sensitive`: 敏感信息
- `copyright`: 侵权内容
- `other`: 其他

---

## 七、CDK事件

### cdk_redeem - 兑换CDK

**触发时机**: 兑换成功

**必需属性**:
```javascript
{
  event_type: 'custom',
  cdk_code: 'xxx',     // CDK码（加密或脱敏）
  cdk_type: 'vip'      // CDK类型
}
```

**可选属性**:
- `reward_type`: 奖励类型（vip/credits/unlock）
- `reward_value`: 奖励价值

---

### cdk_redeem_fail - 兑换失败

**触发时机**: 兑换失败

**必需属性**:
```javascript
{
  event_type: 'custom',
  cdk_code: 'xxx',
  fail_reason: 'expired'  // 失败原因
}
```

**fail_reason取值**:
- `invalid`: 无效的CDK
- `expired`: 已过期
- `used`: 已使用
- `not_started`: 未到使用时间
- `limit_reached`: 达到使用上限

---

## 八、交互事件

### button_click - 按钮点击

**触发时机**: 用户点击按钮

**必需属性**:
```javascript
{
  event_type: 'click',
  button_id: 'submit_button'  // 按钮ID或名称
}
```

**可选属性**:
- `button_text`: 按钮文本
- `button_type`: 按钮类型（primary/default/danger）
- 其他业务属性

---

### form_submit - 表单提交

**触发时机**: 提交表单

**必需属性**:
```javascript
{
  event_type: 'form',
  form_name: 'feedback_form'  // 表单名称
}
```

**可选属性**:
- `form_type`: 表单类型
- `field_count`: 字段数量
- `is_valid`: 是否验证通过

---

### search - 搜索

**触发时机**: 执行搜索

**必需属性**:
```javascript
{
  event_type: 'custom',
  keyword: 'xxx',        // 搜索关键词
  result_count: 10       // 结果数量
}
```

**可选属性**:
- `search_type`: 搜索类型（scale/topic/music）
- `search_time`: 搜索耗时（毫秒）

---

## 九、错误事件

### error_occurred - 错误发生

**触发时机**: 捕获到异常

**必需属性**:
```javascript
{
  event_type: 'custom',
  error_type: 'TypeError',      // 错误类型
  error_message: 'xxx',         // 错误信息
  error_stack: 'xxx'            // 错误堆栈
}
```

**可选属性**:
- `component`: 组件名称
- `method`: 方法名称
- `line`: 错误行号
- `column`: 错误列号

---

### api_error - API错误

**触发时机**: API请求失败

**必需属性**:
```javascript
{
  event_type: 'custom',
  api_url: '/xxx',              // API地址
  api_status: 500,              // HTTP状态码
  error_message: 'xxx'          // 错误信息
}
```

**可选属性**:
- `api_method`: 请求方法（GET/POST）
- `response_time`: 响应时间（毫秒）
- `retry_count`: 重试次数

---

## 十、事件使用统计

### 按模块分类

| 模块 | 事件数量 | 状态 |
|------|---------|------|
| 页面事件 | 2 | ✅ 已实现 |
| 用户事件 | 3 | ✅ 已实现 |
| 评估事件 | 3 | ✅ 已实现 |
| AI对话事件 | 5 | ✅ 已实现 |
| 音乐事件 | 4 | 🚧 部分实现 |
| 社区事件 | 5 | 🚧 部分实现 |
| CDK事件 | 2 | 🚧 待实现 |
| 交互事件 | 3 | ✅ 已实现 |
| 错误事件 | 2 | ✅ 已实现 |

**总计**: 29个预定义事件

---

## 十一、版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2025-10-21 | 初始版本，定义29个核心事件 |

---

## 十二、附录

### 相关文档
- [埋点接入指南](./analytics-integration-guide.md)
- [埋点规范文档](./analytics-specification.md)
- [events-track API文档](../api/events-track.md)

### 快速查询

**按字母顺序**:
- assessment_abandon
- assessment_complete
- assessment_start
- button_click
- cdk_redeem
- cdk_redeem_fail
- chat_ai_response
- chat_personality_change
- chat_send_message
- chat_session_create
- chat_session_switch
- error_occurred
- api_error
- form_submit
- music_favorite
- music_pause
- music_play
- music_speed_change
- page_leave
- page_view
- search
- topic_comment
- topic_like
- topic_publish
- topic_report
- topic_share
- user_login
- user_logout
- user_register

---

**文档版本**: 1.0.0  
**最后更新**: 2025-10-21  
**维护团队**: CraneHeart 数据组  

📚 **完整的事件参考手册！**

