# 埋点字典 - CraneHeart心理健康评估平台

**版本**: 1.0  
**更新时间**: 2025-10-20  
**维护者**: 技术团队

---

## 📋 目录

1. [页面事件](#页面事件)
2. [交互事件](#交互事件)
3. [评估事件](#评估事件)
4. [AI对话事件](#ai对话事件)
5. [用户事件](#用户事件)
6. [社区事件](#社区事件)
7. [音乐事件](#音乐事件)
8. [CDK事件](#cdk事件)
9. [错误事件](#错误事件)
10. [性能事件](#性能事件)

---

## 页面事件

### page_view - 页面浏览

**事件名**: `page_view`  
**事件类别**: `page`  
**触发时机**: 用户访问页面时

**必需字段**:
- `page_name` (string) - 页面名称，如 "home", "assessment", "chat"
- `page_path` (string) - 页面路径，如 "/pages/home/home"

**可选字段**:
- `referrer` (string) - 来源页面
- `title` (string) - 页面标题
- `timestamp` (number) - 事件时间戳

**示例**:
```json
{
  "event": "page_view",
  "page_name": "home",
  "page_path": "/pages/home/home",
  "referrer": "/pages/index/index",
  "title": "首页"
}
```

---

## 交互事件

### click - 按钮点击

**事件名**: `click`  
**事件类别**: `interaction`  
**触发时机**: 用户点击按钮或链接时

**必需字段**:
- `element_id` (string) - 元素ID
- `element_name` (string) - 元素名称

**可选字段**:
- `element_type` (string) - 元素类型，如 "button", "link", "tab"
- `page_name` (string) - 所在页面

**示例**:
```json
{
  "event": "click",
  "element_id": "btn_start_assessment",
  "element_name": "开始评估",
  "element_type": "button",
  "page_name": "home"
}
```

---

## 评估事件

### assessment_start - 评估开始

**事件名**: `assessment_start`  
**事件类别**: `assessment`  
**触发时机**: 用户开始评估时

**必需字段**:
- `assessment_type` (string) - 评估类型，如 "stress", "sleep", "social"

**可选字段**:
- `assessment_id` (string) - 评估ID

**示例**:
```json
{
  "event": "assessment_start",
  "assessment_type": "stress",
  "assessment_id": "assess_123"
}
```

### assessment_complete - 评估完成

**事件名**: `assessment_complete`  
**事件类别**: `assessment`  
**触发时机**: 用户完成评估时

**必需字段**:
- `assessment_type` (string) - 评估类型
- `score` (number) - 评估得分

**可选字段**:
- `assessment_id` (string) - 评估ID
- `duration` (number) - 评估耗时（秒）

**示例**:
```json
{
  "event": "assessment_complete",
  "assessment_type": "stress",
  "score": 75,
  "assessment_id": "assess_123",
  "duration": 300
}
```

---

## AI对话事件

### chat_start - AI对话开始

**事件名**: `chat_start`  
**事件类别**: `chat`  
**触发时机**: 用户开始AI对话时

**必需字段**:
- `chat_type` (string) - 对话类型，如 "stress_relief", "sleep_guidance"

**可选字段**:
- `chat_id` (string) - 对话ID

**示例**:
```json
{
  "event": "chat_start",
  "chat_type": "stress_relief",
  "chat_id": "chat_123"
}
```

### chat_message - AI对话消息

**事件名**: `chat_message`  
**事件类别**: `chat`  
**触发时机**: 用户发送或接收消息时

**必需字段**:
- `message_type` (string) - 消息类型，如 "user", "ai"
- `message_length` (number) - 消息长度

**可选字段**:
- `chat_id` (string) - 对话ID
- `response_time` (number) - 响应时间（毫秒）

**示例**:
```json
{
  "event": "chat_message",
  "message_type": "user",
  "message_length": 50,
  "chat_id": "chat_123",
  "response_time": 1200
}
```

### chat_end - AI对话结束

**事件名**: `chat_end`  
**事件类别**: `chat`  
**触发时机**: 用户结束AI对话时

**必需字段**:
- `chat_type` (string) - 对话类型

**可选字段**:
- `chat_id` (string) - 对话ID
- `duration` (number) - 对话耗时（秒）
- `message_count` (number) - 消息数量

**示例**:
```json
{
  "event": "chat_end",
  "chat_type": "stress_relief",
  "chat_id": "chat_123",
  "duration": 600,
  "message_count": 10
}
```

---

## 用户事件

### user_login - 用户登录

**事件名**: `user_login`  
**事件类别**: `user`  
**触发时机**: 用户登录时

**必需字段**:
- `login_method` (string) - 登录方式，如 "phone", "wechat", "qq"

**可选字段**:
- `user_id` (string) - 用户ID

**示例**:
```json
{
  "event": "user_login",
  "login_method": "phone",
  "user_id": "user_123"
}
```

### user_logout - 用户登出

**事件名**: `user_logout`  
**事件类别**: `user`  
**触发时机**: 用户登出时

**可选字段**:
- `user_id` (string) - 用户ID

**示例**:
```json
{
  "event": "user_logout",
  "user_id": "user_123"
}
```

---

## 社区事件

### community_post - 社区发帖

**事件名**: `community_post`  
**事件类别**: `community`  
**触发时机**: 用户发布社区帖子时

**必需字段**:
- `post_type` (string) - 帖子类型，如 "text", "image", "video"

**可选字段**:
- `post_id` (string) - 帖子ID
- `content_length` (number) - 内容长度

**示例**:
```json
{
  "event": "community_post",
  "post_type": "text",
  "post_id": "post_123",
  "content_length": 200
}
```

### community_comment - 社区评论

**事件名**: `community_comment`  
**事件类别**: `community`  
**触发时机**: 用户发布社区评论时

**必需字段**:
- `post_id` (string) - 所属帖子ID

**可选字段**:
- `comment_id` (string) - 评论ID
- `content_length` (number) - 内容长度

**示例**:
```json
{
  "event": "community_comment",
  "post_id": "post_123",
  "comment_id": "comment_456",
  "content_length": 100
}
```

---

## 音乐事件

### music_play - 音乐播放

**事件名**: `music_play`  
**事件类别**: `music`  
**触发时机**: 用户播放音乐时

**必需字段**:
- `music_id` (string) - 音乐ID

**可选字段**:
- `music_name` (string) - 音乐名称
- `duration` (number) - 音乐时长（秒）

**示例**:
```json
{
  "event": "music_play",
  "music_id": "music_123",
  "music_name": "冥想音乐",
  "duration": 600
}
```

### music_favorite - 音乐收藏

**事件名**: `music_favorite`  
**事件类别**: `music`  
**触发时机**: 用户收藏音乐时

**必需字段**:
- `music_id` (string) - 音乐ID

**可选字段**:
- `music_name` (string) - 音乐名称

**示例**:
```json
{
  "event": "music_favorite",
  "music_id": "music_123",
  "music_name": "冥想音乐"
}
```

---

## CDK事件

### cdk_redeem - CDK兑换

**事件名**: `cdk_redeem`  
**事件类别**: `cdk`  
**触发时机**: 用户兑换CDK时

**必需字段**:
- `cdk_code` (string) - CDK代码

**可选字段**:
- `reward_type` (string) - 奖励类型
- `reward_value` (number) - 奖励价值

**示例**:
```json
{
  "event": "cdk_redeem",
  "cdk_code": "CDK123456",
  "reward_type": "coins",
  "reward_value": 100
}
```

---

## 错误事件

### error - 错误事件

**事件名**: `error`  
**事件类别**: `error`  
**触发时机**: 应用发生错误时

**必需字段**:
- `error_type` (string) - 错误类型
- `error_message` (string) - 错误信息

**可选字段**:
- `error_stack` (string) - 错误堆栈
- `page_name` (string) - 所在页面

**示例**:
```json
{
  "event": "error",
  "error_type": "network_error",
  "error_message": "网络请求失败",
  "error_stack": "...",
  "page_name": "home"
}
```

---

## 性能事件

### performance - 性能指标

**事件名**: `performance`  
**事件类别**: `performance`  
**触发时机**: 定期上报性能指标时

**必需字段**:
- `metric_name` (string) - 指标名称
- `metric_value` (number) - 指标值

**可选字段**:
- `page_name` (string) - 所在页面
- `unit` (string) - 单位

**示例**:
```json
{
  "event": "performance",
  "metric_name": "page_load_time",
  "metric_value": 2500,
  "page_name": "home",
  "unit": "ms"
}
```

---

## 📊 事件统计

| 类别 | 事件数 | 说明 |
|------|--------|------|
| page | 1 | 页面事件 |
| interaction | 1 | 交互事件 |
| assessment | 2 | 评估事件 |
| chat | 3 | AI对话事件 |
| user | 2 | 用户事件 |
| community | 2 | 社区事件 |
| music | 2 | 音乐事件 |
| cdk | 1 | CDK事件 |
| error | 1 | 错误事件 |
| performance | 1 | 性能事件 |
| **总计** | **16** | **所有事件** |

---

## 🔧 使用指南

### 埋点SDK初始化

```javascript
import analytics from '@/utils/analytics.js';
import analyticsConfig from '@/utils/analytics-config.js';

// 初始化配置
analyticsConfig.init();

// 初始化SDK
analytics.init();
```

### 记录事件

```javascript
// 记录页面浏览
analytics.trackPageView('home', '/pages/home/home');

// 记录按钮点击
analytics.trackClick('btn_start_assessment', '开始评估');

// 记录评估完成
analytics.trackAssessmentComplete('stress', 75, 300);

// 记录AI对话
analytics.trackChatMessage('user', 50, 1200);
```

---

**维护日期**: 2025-10-20  
**下次更新**: 2025-11-20


