# 全局错误处理功能文档

## 文档信息
- **创建日期**: 2025-10-21
- **版本**: 1.0.0
- **状态**: 已实现

---

## 功能概述

全局错误处理功能是翎心CraneHeart应用的核心基础设施，用于捕获、记录和上报所有类型的错误，帮助开发团队快速发现和解决问题，提升应用的稳定性和用户体验。

## 核心特性

### 1. 多维度错误捕获
- **Vue组件错误**：捕获Vue生命周期和渲染错误
- **Promise Rejection**：捕获未处理的Promise rejection
- **JavaScript错误**：捕获全局JavaScript运行时错误
- **资源加载错误**：捕获图片、脚本等资源加载失败
- **API请求错误**：拦截uni.request失败
- **自定义错误**：支持手动记录错误

### 2. 丰富的上下文信息
- 错误堆栈
- 当前页面和路由
- 用户操作轨迹（Breadcrumbs）
- 系统信息（设备、平台、版本）
- 网络状态
- 用户信息（脱敏）

### 3. 智能错误管理
- **去重机制**：基于错误指纹去重
- **采样控制**：可配置采样率
- **批量上报**：减少网络请求
- **离线缓存**：离线时缓存错误，恢复后上报

### 4. 错误分析
- 错误统计和趋势分析
- 高频错误识别
- 按页面/平台/类型分组
- 致命错误实时告警

---

## 技术实现

### 1. 错误追踪器（error-tracker.js）

#### 初始化

```javascript
import errorTracker from '@/utils/error-tracker.js';

// 在App.vue的onLaunch中初始化
errorTracker.init({
  enabled: true,           // 是否启用
  sampleRate: 1.0,        // 采样率（0-1）
  autoReport: true,       // 自动上报
  reportInterval: 30000,  // 上报间隔（毫秒）
  maxQueueSize: 50,       // 最大队列大小
  includeContext: true    // 包含上下文信息
});
```

#### 错误类型

```javascript
const ErrorType = {
  VUE_ERROR: 'vue_error',              // Vue组件错误
  PROMISE_REJECTION: 'promise_rejection', // Promise rejection
  JS_ERROR: 'js_error',                // JavaScript错误
  RESOURCE_ERROR: 'resource_error',    // 资源加载错误
  API_ERROR: 'api_error',              // API请求错误
  CUSTOM_ERROR: 'custom_error'         // 自定义错误
};
```

#### 错误级别

```javascript
const ErrorLevel = {
  DEBUG: 'debug',      // 调试信息
  INFO: 'info',        // 一般信息
  WARNING: 'warning',  // 警告
  ERROR: 'error',      // 错误
  FATAL: 'fatal'       // 致命错误
};
```

#### 手动记录错误

```javascript
// 记录自定义错误
errorTracker.logError('用户登录失败', {
  userId: 'xxx',
  reason: 'invalid_password'
});

// 记录操作轨迹
errorTracker.addBreadcrumb('user', 'Click login button', {
  timestamp: Date.now()
});
```

### 2. Vue错误处理

#### 全局错误处理器

```javascript
// error-tracker.js中自动设置
Vue.config.errorHandler = (err, vm, info) => {
  errorTracker.captureVueError(err, vm, info);
};

Vue.config.warnHandler = (msg, vm, trace) => {
  errorTracker.captureVueWarning(msg, vm, trace);
};
```

#### 组件内错误处理

```javascript
export default {
  name: 'MyComponent',
  
  methods: {
    async loadData() {
      try {
        const data = await this.fetchData();
        // 处理数据
      } catch (error) {
        // 错误会自动被Vue.errorHandler捕获
        // 也可以手动记录
        errorTracker.logError('加载数据失败', {
          component: 'MyComponent',
          error: error.message
        });
      }
    }
  }
};
```

### 3. Promise Rejection处理

#### 自动捕获

```javascript
// H5平台自动捕获
window.addEventListener('unhandledrejection', (event) => {
  errorTracker.capturePromiseRejection(event.reason, event);
});
```

#### 手动处理

```javascript
async function fetchUserData() {
  try {
    const result = await uni.request({
      url: 'https://api.example.com/user'
    });
    return result.data;
  } catch (error) {
    // Promise rejection会被自动捕获
    throw error;
  }
}
```

### 4. API请求错误拦截

```javascript
// error-tracker.js自动拦截uni.request
const originalRequest = uni.request;
uni.request = (options) => {
  const originalFail = options.fail;
  
  options.fail = (error) => {
    errorTracker.captureError(new Error(`API请求失败: ${options.url}`), {
      type: ErrorType.API_ERROR,
      url: options.url,
      method: options.method || 'GET',
      statusCode: error.statusCode
    });
    
    if (originalFail) {
      originalFail(error);
    }
  };
  
  return originalRequest(options);
};
```

### 5. 用户操作轨迹

#### 记录操作

```javascript
// 页面访问
errorTracker.addBreadcrumb('navigation', 'Navigate to home page');

// 用户操作
errorTracker.addBreadcrumb('user', 'Click submit button', {
  formData: { /* ... */ }
});

// 网络状态变化
errorTracker.addBreadcrumb('network', 'Network offline');

// API调用
errorTracker.addBreadcrumb('api', 'Call login API', {
  url: '/api/login',
  method: 'POST'
});
```

#### 轨迹数据结构

```javascript
{
  timestamp: 1634567890123,
  category: 'user',
  message: 'Click submit button',
  data: {
    formData: { /* ... */ }
  }
}
```

### 6. 错误上报

#### 自动上报

```javascript
// 定时上报（30秒间隔）
errorTracker.startAutoReport();

// 应用隐藏时上报
uni.onAppHide(() => {
  errorTracker.report();
});

// 致命错误立即上报
errorTracker.captureError(fatalError, {
  level: ErrorLevel.FATAL
});
```

#### 手动上报

```javascript
// 立即上报所有错误
await errorTracker.report();

// 获取错误列表
const errors = errorTracker.getErrors();

// 清空错误队列
errorTracker.clearErrors();
```

### 7. 错误去重

#### 指纹生成

```javascript
// 根据错误类型、消息、堆栈生成指纹
function generateFingerprint(error, context) {
  const parts = [
    context.type || '',
    error.message || '',
    error.stack ? error.stack.split('\n')[0] : ''
  ];
  
  return parts.join('|');
}
```

#### 去重逻辑

```javascript
// 检查指纹是否已存在
if (errorFingerprints.has(fingerprint)) {
  console.log('重复错误，已忽略');
  return;
}

// 添加到指纹集合
errorFingerprints.add(fingerprint);
```

---

## 云函数处理

### error-report云函数

#### 请求格式

```javascript
{
  errors: [
    {
      id: 'err_1634567890123_abc123',
      timestamp: 1634567890123,
      type: 'vue_error',
      level: 'error',
      message: 'Cannot read property "xxx" of undefined',
      stack: 'Error: ...\n  at Component.method...',
      context: {
        page: '/pages/home/home',
        route: { path: '/pages/home/home', options: {} },
        platform: 'WeChat',
        systemInfo: { /* ... */ }
      },
      breadcrumbs: [
        { timestamp: ..., category: 'user', message: '...' }
      ],
      fingerprint: 'vue_error|Cannot read property...|Error at...'
    }
  ],
  timestamp: 1634567890123
}
```

#### 响应格式

```javascript
{
  code: 0,
  message: '错误上报成功',
  data: {
    saved: 1,
    ids: ['xxx']
  }
}
```

#### 错误处理

```javascript
exports.main = async (event, context) => {
  const { errors } = event;
  
  // 验证数据
  if (!errors || !Array.isArray(errors)) {
    return {
      code: 400,
      message: '无效的错误数据'
    };
  }
  
  // 保存到数据库
  const errorRecords = errors.map(error => ({
    error_id: error.id,
    error_type: error.type,
    error_level: error.level,
    error_message: error.message,
    error_stack: error.stack,
    fingerprint: error.fingerprint,
    // ... 其他字段
  }));
  
  await db.collection('error_logs').add(errorRecords);
  
  // 致命错误告警
  const fatalErrors = errors.filter(e => e.level === 'fatal');
  if (fatalErrors.length > 0) {
    await sendAlert(fatalErrors);
  }
  
  return {
    code: 0,
    message: '错误上报成功'
  };
};
```

---

## 数据库设计

### error_logs表结构

```sql
CREATE TABLE error_logs (
  id SERIAL PRIMARY KEY,
  
  -- 错误基本信息
  error_id VARCHAR(100) UNIQUE NOT NULL,
  error_type VARCHAR(50) NOT NULL,
  error_level VARCHAR(20) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  fingerprint VARCHAR(255) NOT NULL,
  
  -- 上下文信息
  page VARCHAR(255),
  route JSONB,
  platform VARCHAR(50),
  system_info JSONB,
  user_agent TEXT,
  
  -- 操作轨迹
  breadcrumbs JSONB,
  
  -- 额外上下文
  context JSONB,
  
  -- 客户端信息
  client_ip VARCHAR(50),
  client_ua TEXT,
  
  -- 时间戳
  error_timestamp BIGINT NOT NULL,
  report_timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 处理状态
  status VARCHAR(20) DEFAULT 'pending',
  processed_at TIMESTAMP,
  processed_by VARCHAR(100),
  notes TEXT
);
```

### 索引

```sql
CREATE INDEX idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_level ON error_logs(error_level);
CREATE INDEX idx_error_logs_platform ON error_logs(platform);
CREATE INDEX idx_error_logs_timestamp ON error_logs(error_timestamp DESC);
```

### 统计视图

```sql
-- 错误统计
CREATE VIEW v_error_stats AS
SELECT 
  error_type,
  error_level,
  platform,
  COUNT(*) as total_count,
  COUNT(DISTINCT fingerprint) as unique_count,
  MAX(created_at) as last_occurred
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY error_type, error_level, platform;

-- 高频错误
CREATE VIEW v_frequent_errors AS
SELECT 
  fingerprint,
  error_message,
  error_type,
  COUNT(*) as occurrence_count,
  MAX(created_at) as last_occurred
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY fingerprint, error_message, error_type
HAVING COUNT(*) >= 10
ORDER BY occurrence_count DESC;
```

---

## 错误分析

### 1. 错误趋势分析

```sql
-- 按小时统计错误数
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  error_level,
  COUNT(*) as count
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour, error_level
ORDER BY hour DESC;
```

### 2. 高频错误TOP10

```sql
SELECT 
  fingerprint,
  error_message,
  page,
  COUNT(*) as count
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY fingerprint, error_message, page
ORDER BY count DESC
LIMIT 10;
```

### 3. 按平台统计

```sql
SELECT 
  platform,
  error_type,
  COUNT(*) as count
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY platform, error_type
ORDER BY count DESC;
```

### 4. 致命错误监控

```sql
SELECT *
FROM error_logs
WHERE error_level = 'fatal'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 最佳实践

### 1. 错误边界

```javascript
// 在关键组件外包裹错误边界
export default {
  name: 'ErrorBoundary',
  
  data() {
    return {
      hasError: false,
      errorInfo: null
    };
  },
  
  errorCaptured(err, vm, info) {
    this.hasError = true;
    this.errorInfo = {
      message: err.message,
      info: info
    };
    
    errorTracker.captureVueError(err, vm, info);
    
    return false; // 阻止错误继续传播
  },
  
  render(h) {
    if (this.hasError) {
      return h('view', { class: 'error-boundary' }, [
        h('text', '出错了，请刷新页面重试')
      ]);
    }
    
    return this.$slots.default;
  }
};
```

### 2. API请求错误处理

```javascript
async function fetchData(url) {
  try {
    const res = await uni.request({ url });
    return res.data;
  } catch (error) {
    // 错误会自动被errorTracker捕获
    
    // 用户友好提示
    uni.showToast({
      title: '网络请求失败，请稍后重试',
      icon: 'none'
    });
    
    throw error;
  }
}
```

### 3. 关键操作记录

```javascript
// 登录流程
async function login(username, password) {
  errorTracker.addBreadcrumb('user', 'Start login', { username });
  
  try {
    const result = await callLoginAPI(username, password);
    
    errorTracker.addBreadcrumb('user', 'Login success');
    
    return result;
  } catch (error) {
    errorTracker.addBreadcrumb('user', 'Login failed', {
      error: error.message
    });
    
    throw error;
  }
}
```

### 4. 致命错误处理

```javascript
function handleFatalError(error) {
  // 记录致命错误
  errorTracker.captureError(error, {
    level: ErrorLevel.FATAL,
    context: {
      action: 'critical_operation'
    }
  });
  
  // 立即上报
  errorTracker.report();
  
  // 显示用户友好的错误页面
  uni.reLaunch({
    url: '/pages/error/error?type=fatal'
  });
}
```

---

## 常见问题

### Q1: 错误上报会影响性能吗？
**A**: 不会。错误上报是异步的，批量上报，不会阻塞主线程。

### Q2: 如何减少错误上报量？
**A**: 
- 调整采样率（sampleRate）
- 设置更长的上报间隔
- 过滤低级别错误（info/debug）

### Q3: 重复错误如何处理？
**A**: 系统会自动基于错误指纹去重，同一个错误只记录一次。

### Q4: 如何查看错误详情？
**A**: 登录云开发控制台，查询error_logs表，或使用错误统计视图。

---

## 未来优化

### 短期
- [ ] 错误可视化看板
- [ ] 实时告警（邮件/短信）
- [ ] Source Map支持

### 中期
- [ ] 错误自动分类
- [ ] 智能告警（AI检测异常）
- [ ] 错误回放功能

### 长期
- [ ] 分布式追踪
- [ ] 性能监控集成
- [ ] 用户会话回放

---

## 技术支持

如有问题或建议，请联系开发团队。

**文档版本**: 1.0.0  
**更新日期**: 2025-10-21

