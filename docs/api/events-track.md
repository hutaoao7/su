# events-track API文档

## 基本信息

- **云函数名称**: `events-track`
- **功能描述**: 用户行为埋点统计
- **请求方式**: uniCloud.callFunction
- **认证要求**: 可选（建议携带Token）
- **限流策略**: 每用户每分钟最多100次请求

---

## 业务说明

本接口用于收集用户行为数据，支持批量上报，用于产品分析、用户画像和运营决策。

### 埋点策略
- **实时上报**：关键行为（登录、支付、注册等）
- **批量上报**：普通行为（页面浏览、点击等），每30秒或累计10条上报一次
- **离线缓存**：网络异常时本地缓存，恢复后补发

### 数据用途
- 产品功能使用分析
- 用户行为路径分析
- 页面性能监控
- 异常错误追踪
- A/B测试数据收集

---

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| events | Array | 是 | - | 事件列表（最多100条） |
| batch | Boolean | 否 | false | 是否批量上报 |
| app_version | String | 否 | - | 应用版本号 |
| sdk_version | String | 否 | '1.0.0' | SDK版本号 |

### Event对象结构

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| event_name | String | 是 | 事件名称（建议使用下划线命名） |
| event_time | Number | 是 | 事件发生时间戳（毫秒） |
| event_type | String | 否 | 事件类型（page_view/click/form/custom） |
| page_url | String | 否 | 页面路径 |
| page_title | String | 否 | 页面标题 |
| properties | Object | 否 | 事件属性（自定义数据） |
| user_id | String | 否 | 用户ID |
| session_id | String | 否 | 会话ID |
| device_info | Object | 否 | 设备信息 |

### DeviceInfo对象结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| platform | String | 平台（mp-weixin/h5/app） |
| os | String | 操作系统 |
| os_version | String | 系统版本 |
| device_model | String | 设备型号 |
| screen_width | Number | 屏幕宽度 |
| screen_height | Number | 屏幕高度 |
| network_type | String | 网络类型 |

---

## 请求示例

### 1. 单个事件上报

```javascript
const { result } = await uniCloud.callFunction({
  name: 'events-track',
  data: {
    events: [{
      event_name: 'page_view',
      event_type: 'page_view',
      event_time: Date.now(),
      page_url: '/pages/home/home',
      page_title: '首页',
      properties: {
        referrer: '/pages/login/login',
        duration: 5000
      },
      user_id: 'user_123',
      session_id: 'session_456',
      device_info: {
        platform: 'mp-weixin',
        os: 'iOS',
        os_version: '16.0',
        device_model: 'iPhone 14 Pro',
        screen_width: 390,
        screen_height: 844,
        network_type: 'wifi'
      }
    }],
    app_version: '1.0.0',
    sdk_version: '1.0.0'
  }
});
```

### 2. 批量事件上报

```javascript
const { result } = await uniCloud.callFunction({
  name: 'events-track',
  data: {
    events: [
      {
        event_name: 'button_click',
        event_type: 'click',
        event_time: Date.now(),
        page_url: '/pages/home/home',
        properties: {
          button_id: 'start_assess',
          button_text: '开始评估'
        }
      },
      {
        event_name: 'assessment_start',
        event_type: 'custom',
        event_time: Date.now() + 1000,
        properties: {
          scale_id: 'phq9',
          scale_name: 'PHQ-9抑郁症筛查量表'
        }
      },
      {
        event_name: 'assessment_complete',
        event_type: 'custom',
        event_time: Date.now() + 60000,
        properties: {
          scale_id: 'phq9',
          duration: 58,
          score: 12
        }
      }
    ],
    batch: true,
    app_version: '1.0.0'
  }
});
```

### 3. 错误事件上报

```javascript
const { result } = await uniCloud.callFunction({
  name: 'events-track',
  data: {
    events: [{
      event_name: 'error_occurred',
      event_type: 'custom',
      event_time: Date.now(),
      page_url: '/pages/assess/result',
      properties: {
        error_type: 'api_error',
        error_message: 'Network request failed',
        error_stack: '...',
        api_url: '/assessment-result',
        api_status: 500
      }
    }]
  }
});
```

---

## 响应数据

### 成功响应

```javascript
{
  "code": 200,
  "message": "事件上报成功",
  "data": {
    "received_count": 3,
    "processed_count": 3,
    "failed_count": 0,
    "server_time": 1698765432123
  }
}
```

### 部分失败响应

```javascript
{
  "code": 206,
  "message": "部分事件上报失败",
  "data": {
    "received_count": 10,
    "processed_count": 9,
    "failed_count": 1,
    "failed_events": [
      {
        "index": 5,
        "reason": "事件名称不合法"
      }
    ]
  }
}
```

### 错误响应

```javascript
{
  "code": 400,
  "message": "事件列表为空",
  "data": null
}
```

---

## 预定义事件列表

### 页面事件
| 事件名 | 说明 | 必需属性 |
|--------|------|----------|
| page_view | 页面浏览 | page_url, page_title |
| page_leave | 页面离开 | page_url, duration |

### 用户事件
| 事件名 | 说明 | 必需属性 |
|--------|------|----------|
| user_login | 用户登录 | login_method |
| user_register | 用户注册 | register_method |
| user_logout | 用户登出 | - |

### 评估事件
| 事件名 | 说明 | 必需属性 |
|--------|------|----------|
| assessment_start | 开始评估 | scale_id |
| assessment_complete | 完成评估 | scale_id, score, duration |
| assessment_abandon | 放弃评估 | scale_id, progress |

### AI对话事件
| 事件名 | 说明 | 必需属性 |
|--------|------|----------|
| chat_send_message | 发送消息 | message_length |
| chat_receive_message | 收到回复 | response_time |
| chat_session_start | 开始会话 | - |
| chat_session_end | 结束会话 | duration, message_count |

### 音乐事件
| 事件名 | 说明 | 必需属性 |
|--------|------|----------|
| music_play | 播放音乐 | track_id, track_name |
| music_pause | 暂停播放 | track_id, play_time |
| music_complete | 播放完成 | track_id, duration |

### 点击事件
| 事件名 | 说明 | 必需属性 |
|--------|------|----------|
| button_click | 按钮点击 | button_id, button_text |
| link_click | 链接点击 | link_url, link_text |

### 错误事件
| 事件名 | 说明 | 必需属性 |
|--------|------|----------|
| error_occurred | 错误发生 | error_type, error_message |
| api_error | API错误 | api_url, api_status |

---

## 数据库操作

### 相关表

**events表（分区表）**
```sql
CREATE TABLE events (
  id BIGSERIAL,
  event_name VARCHAR(100) NOT NULL,
  event_type VARCHAR(50),
  event_time BIGINT NOT NULL,
  user_id VARCHAR(100),
  session_id VARCHAR(100),
  page_url VARCHAR(500),
  page_title VARCHAR(200),
  properties JSONB,
  device_info JSONB,
  app_version VARCHAR(20),
  sdk_version VARCHAR(20),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 创建分区（按月）
CREATE TABLE events_2025_10 PARTITION OF events
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE events_2025_11 PARTITION OF events
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

### 索引优化
```sql
-- 事件名称索引
CREATE INDEX idx_events_name ON events(event_name);

-- 用户ID索引
CREATE INDEX idx_events_user_id ON events(user_id);

-- 时间范围索引
CREATE INDEX idx_events_time ON events(event_time);

-- 复合索引（用户+时间）
CREATE INDEX idx_events_user_time ON events(user_id, event_time);

-- JSONB索引（属性查询）
CREATE INDEX idx_events_properties ON events USING GIN(properties);
```

---

## 业务逻辑

### 1. 数据验证
```javascript
function validateEvent(event) {
  // 事件名称校验
  if (!event.event_name || !/^[a-z_]+$/.test(event.event_name)) {
    throw new Error('事件名称不合法');
  }
  
  // 事件时间校验
  if (!event.event_time || event.event_time > Date.now() + 60000) {
    throw new Error('事件时间不合法');
  }
  
  // 属性大小限制
  const propsSize = JSON.stringify(event.properties || {}).length;
  if (propsSize > 10240) { // 10KB
    throw new Error('事件属性过大');
  }
  
  return true;
}
```

### 2. 批量插入
```javascript
async function batchInsertEvents(events) {
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < events.length; i += batchSize) {
    batches.push(events.slice(i, i + batchSize));
  }
  
  const results = await Promise.allSettled(
    batches.map(batch => db.collection('events').add(batch))
  );
  
  return results;
}
```

### 3. 数据清洗
```javascript
function cleanEventData(event) {
  return {
    event_name: event.event_name.toLowerCase().trim(),
    event_type: event.event_type || 'custom',
    event_time: parseInt(event.event_time),
    user_id: event.user_id || null,
    session_id: event.session_id || null,
    page_url: sanitizeUrl(event.page_url),
    page_title: sanitizeText(event.page_title),
    properties: filterSensitiveData(event.properties),
    device_info: event.device_info || {},
    ip_address: getClientIP(),
    created_at: new Date()
  };
}
```

---

## 前端SDK封装

### analytics.js

```javascript
/**
 * 埋点SDK
 */
class Analytics {
  constructor() {
    this.queue = [];
    this.maxQueueSize = 10;
    this.flushInterval = 30000; // 30秒
    this.sessionId = this.generateSessionId();
    
    this.startAutoFlush();
  }
  
  /**
   * 追踪事件
   * @param {String} eventName - 事件名称
   * @param {Object} properties - 事件属性
   * @param {Boolean} immediate - 是否立即上报
   */
  track(eventName, properties = {}, immediate = false) {
    const event = {
      event_name: eventName,
      event_time: Date.now(),
      properties,
      session_id: this.sessionId,
      user_id: this.getUserId(),
      device_info: this.getDeviceInfo()
    };
    
    this.queue.push(event);
    
    if (immediate || this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }
  
  /**
   * 追踪页面浏览
   * @param {String} pageUrl - 页面URL
   * @param {String} pageTitle - 页面标题
   */
  trackPageView(pageUrl, pageTitle) {
    this.track('page_view', {
      page_url: pageUrl,
      page_title: pageTitle,
      referrer: this.lastPageUrl || '',
      enter_time: Date.now()
    });
    
    this.lastPageUrl = pageUrl;
    this.pageEnterTime = Date.now();
  }
  
  /**
   * 追踪页面离开
   */
  trackPageLeave() {
    if (this.lastPageUrl && this.pageEnterTime) {
      const duration = Date.now() - this.pageEnterTime;
      this.track('page_leave', {
        page_url: this.lastPageUrl,
        duration
      });
    }
  }
  
  /**
   * 追踪点击事件
   * @param {String} elementId - 元素ID
   * @param {Object} extraProps - 额外属性
   */
  trackClick(elementId, extraProps = {}) {
    this.track('button_click', {
      button_id: elementId,
      page_url: this.lastPageUrl,
      ...extraProps
    });
  }
  
  /**
   * 追踪错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   */
  trackError(error, context = {}) {
    this.track('error_occurred', {
      error_type: error.name,
      error_message: error.message,
      error_stack: error.stack,
      page_url: this.lastPageUrl,
      ...context
    }, true); // 错误立即上报
  }
  
  /**
   * 刷新队列（上报）
   */
  async flush() {
    if (this.queue.length === 0) {
      return;
    }
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      await uniCloud.callFunction({
        name: 'events-track',
        data: {
          events,
          batch: true,
          app_version: this.getAppVersion(),
          sdk_version: '1.0.0'
        }
      });
      
      console.log('[Analytics] 上报成功:', events.length, '个事件');
    } catch (error) {
      console.error('[Analytics] 上报失败:', error);
      // 失败重新加入队列
      this.queue.unshift(...events);
    }
  }
  
  /**
   * 自动刷新
   */
  startAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
    
    // 页面隐藏时刷新
    // #ifdef H5
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
    // #endif
  }
  
  /**
   * 生成会话ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 获取用户ID
   */
  getUserId() {
    try {
      const userInfo = uni.getStorageSync('user_info');
      return userInfo ? userInfo.user_id : null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 获取设备信息
   */
  getDeviceInfo() {
    const systemInfo = uni.getSystemInfoSync();
    return {
      platform: systemInfo.platform,
      os: systemInfo.system,
      os_version: systemInfo.version,
      device_model: systemInfo.model,
      screen_width: systemInfo.screenWidth,
      screen_height: systemInfo.screenHeight,
      network_type: systemInfo.networkType
    };
  }
  
  /**
   * 获取应用版本
   */
  getAppVersion() {
    // 从manifest.json或package.json读取
    return '1.0.0';
  }
}

// 全局单例
let analyticsInstance = null;

export function getAnalytics() {
  if (!analyticsInstance) {
    analyticsInstance = new Analytics();
  }
  return analyticsInstance;
}

export default {
  getAnalytics
};
```

### 使用示例

```javascript
// 1. 在main.js中初始化
import { getAnalytics } from '@/utils/analytics.js';

const analytics = getAnalytics();
Vue.prototype.$analytics = analytics;

// 2. 在页面中使用
export default {
  onShow() {
    this.$analytics.trackPageView('/pages/home/home', '首页');
  },
  
  onHide() {
    this.$analytics.trackPageLeave();
  },
  
  methods: {
    handleStartAssess() {
      this.$analytics.trackClick('start_assess', {
        button_text: '开始评估'
      });
      
      this.$analytics.track('assessment_start', {
        scale_id: 'phq9'
      });
    }
  }
};
```

---

## 性能优化

### 1. 批量上报
- 普通事件30秒或10条上报一次
- 关键事件立即上报
- 错误事件立即上报

### 2. 数据压缩
```javascript
// 使用LZ-String压缩
import LZString from 'lz-string';

const compressed = LZString.compress(JSON.stringify(events));
```

### 3. 离线缓存
```javascript
// 网络异常时缓存到本地
if (!navigator.onLine) {
  const cached = uni.getStorageSync('events_cache') || [];
  cached.push(...events);
  uni.setStorageSync('events_cache', cached);
}

// 网络恢复后补发
uni.onNetworkStatusChange((res) => {
  if (res.isConnected) {
    const cached = uni.getStorageSync('events_cache');
    if (cached && cached.length > 0) {
      sendEvents(cached);
      uni.removeStorageSync('events_cache');
    }
  }
});
```

### 4. 数据采样
```javascript
// 对高频事件进行采样
function shouldSample(eventName) {
  const samplingRates = {
    'page_view': 1.0,      // 100%
    'scroll': 0.1,         // 10%
    'mouse_move': 0.01     // 1%
  };
  
  const rate = samplingRates[eventName] || 1.0;
  return Math.random() < rate;
}
```

---

## 数据分析

### 1. 用户活跃度分析
```sql
-- 日活跃用户
SELECT COUNT(DISTINCT user_id) AS dau
FROM events
WHERE DATE(created_at) = CURRENT_DATE
  AND user_id IS NOT NULL;

-- 月活跃用户
SELECT COUNT(DISTINCT user_id) AS mau
FROM events
WHERE DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)
  AND user_id IS NOT NULL;
```

### 2. 功能使用分析
```sql
-- 评估功能使用次数
SELECT 
  properties->>'scale_id' AS scale_id,
  COUNT(*) AS usage_count
FROM events
WHERE event_name = 'assessment_complete'
  AND DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY properties->>'scale_id'
ORDER BY usage_count DESC;
```

### 3. 用户路径分析
```sql
-- 用户行为路径（会话级别）
WITH user_paths AS (
  SELECT 
    session_id,
    array_agg(event_name ORDER BY event_time) AS path
  FROM events
  WHERE session_id IS NOT NULL
    AND DATE(created_at) = CURRENT_DATE
  GROUP BY session_id
)
SELECT path, COUNT(*) AS count
FROM user_paths
GROUP BY path
ORDER BY count DESC
LIMIT 20;
```

---

## 监控指标

### 1. 关键指标
- 每日事件量：监控数据上报量
- 上报成功率：`成功数 / 总请求数`
- 平均响应时间：`< 200ms`
- 数据丢失率：`丢失数 / 总事件数`

### 2. 告警规则
- 上报成功率 < 95%：触发告警
- 平均响应时间 > 500ms：触发告警
- 5分钟内错误次数 > 100：触发告警

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2025-10-20 | 初始版本 |

---

## 相关文档

- [埋点设计规范](../analytics/event-design-guide.md)
- [数据分析报表](../analytics/dashboard.md)
- [SDK使用指南](../sdk/analytics-sdk.md)

---

**文档维护**: CraneHeart开发团队  
**最后更新**: 2025-10-20

