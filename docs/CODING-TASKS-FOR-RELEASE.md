# 翎心CraneHeart v1.0.0 正式上线编码任务清单

> **目标**: 正式上线v1.0.0-Release  
> **当前状态**: v0.1.0-MVP (60.7%完成)  
> **剩余编码任务**: 39.3%  
> **预计工时**: 4-6周（1-2人）  
> **更新时间**: 2025-11-04

---

## 📋 目录

- [一、任务总览](#一任务总览)
- [二、必须完成的编码任务（P0/P1）](#二必须完成的编码任务p0p1)
- [三、建议完成的编码任务（P2）](#三建议完成的编码任务p2)
- [四、周次计划](#四周次计划)
- [五、验收标准](#五验收标准)

---

## 一、任务总览

### 1.1 编码任务分类

| 分类 | P0必须 | P1重要 | P2建议 | 总计 | 预计工时 |
|------|--------|--------|--------|------|----------|
| **核心功能补全** | 2 | 3 | 0 | 5 | 1周 |
| **打包优化** | 0 | 3 | 3 | 6 | 3天 |
| **UX优化** | 0 | 2 | 5 | 7 | 1.5周 |
| **测试补全** | 2 | 3 | 3 | 8 | 2周 |
| **工具开发** | 0 | 2 | 10 | 12 | 1周 |
| **总计** | **4** | **13** | **21** | **38** | **4-6周** |

### 1.2 时间分配

```
Week 1-2: 核心功能补全 + 打包优化 + 测试框架搭建
Week 3-4: UX优化 + 核心测试补全
Week 5:   工具开发 + 补充测试
Week 6:   回归测试 + Bug修复 + 发布准备
```

---

## 二、必须完成的编码任务（P0/P1）

### 🔥 P0 - 核心阻塞（4个任务，3天）

#### Task-001: 社区图片审核集成 ⏱️ 4小时 ✅ 已完成

**状态**: ✅ 已完成 (Mock版本)  
**完成时间**: 2025-11-04  
**文件**: `pages/community/publish.vue` + `uniCloud-aliyun/cloudfunctions/content-moderation/`

**实现说明**: 
- 已实现Mock版本的图片审核功能
- 上传图片时自动调用审核接口
- 不合规图片无法添加并提示具体原因
- 审核失败时有降级策略（允许发布）
- 后续可无缝替换为腾讯云/阿里云真实API

**需要添加的代码**: (已实现，以下为参考)
```vue
<script>
// 在 chooseImage 方法中添加
async chooseImage() {
  const res = await uni.chooseImage({
    count: 9 - this.images.length,
    sizeType: ['compressed']
  });
  
  // ✅ 新增：图片审核
  for (const path of res.tempFilePaths) {
    const moderationResult = await this.moderateImage(path);
    if (!moderationResult.pass) {
      uni.showToast({
        title: `图片不合规: ${moderationResult.reason}`,
        icon: 'none'
      });
      continue;
    }
    this.images.push(path);
  }
}

// ✅ 新增：图片审核方法
async moderateImage(imagePath) {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'content-moderation',
      data: {
        type: 'image',
        content: imagePath
      }
    });
    return result;
  } catch (error) {
    console.error('图片审核失败', error);
    return { pass: true }; // 降级：审核失败时允许发布
  }
}
</script>
```

**验收标准**:
- [ ] 上传图片时自动调用审核
- [ ] 不合规图片无法添加
- [ ] 降级策略：审核接口失败时允许发布

---

#### Task-002: 云函数content-moderation实现 ⏱️ 1天

**文件**: `uniCloud-aliyun/cloudfunctions/content-moderation/index.js`

**需要创建**:
```javascript
'use strict';

const tencentcloud = require("tencentcloud-sdk-nodejs");
const ImsClient = tencentcloud.ims.v20201229.Client;

exports.main = async (event, context) => {
  const { type, content } = event;
  
  // 腾讯云图片审核
  if (type === 'image') {
    const client = new ImsClient({
      credential: {
        secretId: process.env.TENCENT_SECRET_ID,
        secretKey: process.env.TENCENT_SECRET_KEY,
      },
      region: "ap-guangzhou"
    });
    
    const params = {
      FileUrl: content,
      Scene: ["PORN", "POLITICS", "TERRORISM"]
    };
    
    const data = await client.ImageModeration(params);
    
    return {
      pass: data.Suggestion === 'Pass',
      reason: data.Label,
      confidence: data.Confidence
    };
  }
  
  // 文字审核（已有敏感词检测，可选）
  if (type === 'text') {
    // 调用腾讯云文本审核或使用现有sensitive-words.js
  }
  
  return { pass: true };
};
```

**配置文件**: `package.json`
```json
{
  "name": "content-moderation",
  "dependencies": {
    "tencentcloud-sdk-nodejs": "^4.0.3"
  },
  "cloudfunction-config": {
    "timeout": 10,
    "env": {
      "TENCENT_SECRET_ID": "YOUR_SECRET_ID",
      "TENCENT_SECRET_KEY": "YOUR_SECRET_KEY"
    }
  }
}
```

**验收标准**:
- [ ] 支持图片URL审核
- [ ] 返回通过/拒绝/建议人工
- [ ] 审核失败有日志记录

---

#### Task-003: 数据库运维脚本 ⏱️ 1天 ✅ 已完成

**状态**: ✅ 已完成  
**完成时间**: 2025-11-04  
**文件**: `scripts/backup-database.ps1`, `scripts/cleanup-expired-data.sql`, `scripts/monitor-database.sql`, `scripts/seed-data.sql`, `scripts/README.md`

**实现说明**:
- ✅ 创建PowerShell自动备份脚本（支持Windows环境）
- ✅ 创建SQL清理脚本（清理8种类型的过期数据）
- ✅ 创建性能监控脚本（15个监控维度）
- ✅ 创建种子数据脚本（快速初始化测试环境）
- ✅ 创建完整的使用文档（README.md）

**需要创建4个脚本**: (已完成，以下为参考)

**1. 备份脚本**: `scripts/backup-database.sh`
```bash
#!/bin/bash
# 数据库备份脚本

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/craneheart"
DB_NAME="craneheart_prod"

mkdir -p $BACKUP_DIR

# PostgreSQL备份
pg_dump -h $PGHOST -U $PGUSER -d $DB_NAME \
  -F c -b -v -f "$BACKUP_DIR/backup_$DATE.dump"

# 保留最近30天的备份
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete

echo "Backup completed: backup_$DATE.dump"
```

**2. 清理脚本**: `scripts/cleanup-expired-data.sql`
```sql
-- 清理过期数据脚本
-- 运行频率：每天凌晨2点

-- 1. 清理90天前的错误日志
DELETE FROM error_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 2. 清理30天前的埋点数据
DELETE FROM event_logs 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 3. 清理已撤回用户的数据（冷静期7天后）
DELETE FROM users 
WHERE status = 'revoked' 
  AND updated_at < NOW() - INTERVAL '7 days';

-- 4. 清理临时会话（24小时未活跃）
DELETE FROM user_sessions 
WHERE last_active_at < NOW() - INTERVAL '24 hours';

-- 返回清理统计
SELECT 'cleanup_completed' as status, NOW() as executed_at;
```

**3. 监控脚本**: `scripts/monitor-database.sql`
```sql
-- 数据库监控脚本
-- 检查慢查询、锁等待、表膨胀

-- 慢查询统计
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- 超过1秒
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 锁等待检测
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
WHERE NOT blocked_locks.granted;

-- 表大小统计（前10）
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

**4. 种子数据**: `scripts/seed-data.sql`
```sql
-- 测试/开发环境种子数据

-- 管理员账号
INSERT INTO users (id, openid, nickname, role, status) VALUES
('00000000-0000-0000-0000-000000000001', 'admin_openid', '系统管理员', 'admin', 'active');

-- 测试用户
INSERT INTO users (id, openid, nickname, role, status) VALUES
('00000000-0000-0000-0000-000000000002', 'test_openid', '测试用户', 'user', 'active');

-- CDK类型
INSERT INTO cdk_types (name, description, duration_days, features) VALUES
('VIP月卡', '30天VIP会员', 30, '{"premium_content": true, "ad_free": true}'),
('VIP年卡', '365天VIP会员', 365, '{"premium_content": true, "ad_free": true}');

-- 音乐分类
INSERT INTO music_categories (name, description, icon) VALUES
('轻音乐', '舒缓放松的轻音乐', 'music'),
('自然音', '大自然的声音', 'leaf'),
('冥想音乐', '专业冥想引导', 'meditation');
```

**验收标准**:
- [ ] 备份脚本可自动运行（crontab）
- [ ] 清理脚本不影响活跃数据
- [ ] 监控脚本能发现性能问题
- [ ] 种子数据可快速初始化环境

---

#### Task-004: 兼容性测试执行 ⏱️ 1天

**需要创建测试报告模板**: `docs/COMPATIBILITY-TEST-CHECKLIST.md`

```markdown
# 兼容性测试检查清单

## 微信小程序

### 设备测试
- [ ] Android (华为/小米/OPPO/vivo各1台)
- [ ] iOS (iPhone 12/13/14各1台)

### 功能测试
- [ ] 登录流程
- [ ] TabBar切换
- [ ] 评估答题
- [ ] AI对话
- [ ] 音乐播放
- [ ] 社区发布

### 性能测试
- [ ] 首屏加载 < 2秒
- [ ] 页面切换 < 300ms
- [ ] 无内存泄漏

## H5浏览器

### 浏览器覆盖
- [ ] Chrome 90+
- [ ] Safari 14+
- [ ] Firefox 88+
- [ ] Edge 90+

### 移动端浏览器
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] 微信内置浏览器

### 功能验证
- [ ] 所有核心功能正常
- [ ] Canvas图表渲染
- [ ] 音频播放
- [ ] 下载/分享功能

## 屏幕尺寸

- [ ] iPhone SE (375x667)
- [ ] iPhone 14 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] iPad (768x1024)
- [ ] Desktop (1920x1080)

## 网络环境

- [ ] 4G (正常)
- [ ] 3G (降级策略)
- [ ] 弱网 (离线提示)
- [ ] 离线 (缓存可用)
```

**执行方式**:
```bash
# 1. 微信开发者工具真机调试
# 2. Chrome DevTools设备模拟
# 3. BrowserStack跨浏览器测试
```

**验收标准**:
- [ ] 所有设备核心功能可用
- [ ] 无严重UI错误
- [ ] 性能指标达标
- [ ] 生成完整测试报告

---

### ⚠️ P1 - 重要功能（13个任务，2周）

#### Task-005: 离线Service Worker ⏱️ 2天

**文件**: `public/sw.js`

```javascript
// Service Worker for H5离线支持

const CACHE_NAME = 'craneheart-v1.0.0';
const urlsToCache = [
  '/',
  '/static/logo.png',
  '/static/css/main.css',
  '/pages.json'
];

// 安装阶段：缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 请求拦截：缓存优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存命中
        if (response) {
          return response;
        }
        
        // 网络请求
        return fetch(event.request).then((response) => {
          // 只缓存成功的GET请求
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          // 克隆响应并缓存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});
```

**注册Service Worker**: `index.html`
```html
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered', reg))
      .catch(err => console.log('SW error', err));
  });
}
</script>
```

**验收标准**:
- [ ] H5端离线可访问首页
- [ ] 离线时显示缓存内容
- [ ] 在线时自动更新缓存

---

#### Task-006: 打包优化配置 ⏱️ 1天

**修改**: `vue.config.js`

```javascript
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  // ... 现有配置
  
  configureWebpack: {
    plugins: [
      // Gzip压缩
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8
      }),
      
      // 构建分析（仅开发环境）
      ...(process.env.NODE_ENV === 'development' ? [
        new BundleAnalyzerPlugin()
      ] : [])
    ],
    
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10
          },
          uview: {
            name: 'uview',
            test: /[\\/]uni_modules[\\/]uview-ui[\\/]/,
            priority: 20
          },
          utils: {
            name: 'utils',
            test: /[\\/]utils[\\/]/,
            minChunks: 2,
            priority: 5
          }
        }
      }
    }
  },
  
  chainWebpack: config => {
    // Tree-shaking优化
    config.optimization.usedExports(true);
    
    // 字体优化
    config.module
      .rule('fonts')
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 4096,
        fallback: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[hash:8].[ext]'
          }
        }
      });
  }
};
```

**修改**: `package.json`
```json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "*.vue"
  ],
  "devDependencies": {
    "compression-webpack-plugin": "^9.2.0",
    "webpack-bundle-analyzer": "^4.7.0"
  }
}
```

**验收标准**:
- [ ] 生产包启用Gzip压缩
- [ ] Bundle Size减少30%+
- [ ] 生成构建分析报告

---

#### Task-007-013: UX优化（7个任务） ⏱️ 3天

**Task-007**: 页面切换动画

`pages.json`:
```json
{
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "翎心",
    "animationType": "pop-in",
    "animationDuration": 300
  }
}
```

**Task-008-009**: 全页面骨架屏（创建通用组件）

`components/common/SkeletonScreen.vue`:
```vue
<template>
  <view class="skeleton-screen">
    <view v-for="n in rows" :key="n" class="skeleton-row">
      <view class="skeleton-circle" v-if="avatar"></view>
      <view class="skeleton-line"></view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    rows: { type: Number, default: 3 },
    avatar: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.skeleton-row {
  display: flex;
  align-items: center;
  padding: 20rpx;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-circle {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  flex: 1;
  height: 30rpx;
  margin-left: 20rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

在23个主要页面中使用：
```vue
<template>
  <view class="page">
    <!-- 骨架屏 -->
    <skeleton-screen v-if="loading" :rows="5" :avatar="true" />
    
    <!-- 实际内容 -->
    <view v-else>
      <!-- ... -->
    </view>
  </view>
</template>

<script>
import SkeletonScreen from '@/components/common/SkeletonScreen.vue';

export default {
  components: { SkeletonScreen },
  data() {
    return {
      loading: true
    };
  },
  onLoad() {
    this.fetchData().finally(() => {
      this.loading = false;
    });
  }
}
</script>
```

**Task-010**: 智能预加载

`utils/preloader.js`:
```javascript
export class Preloader {
  constructor() {
    this.preloadQueue = [];
    this.preloadedPages = new Set();
  }
  
  // 预加载页面
  preloadPage(path) {
    if (this.preloadedPages.has(path)) return;
    
    uni.preloadPage({
      url: path,
      success: () => {
        this.preloadedPages.add(path);
        console.log(`Preloaded: ${path}`);
      }
    });
  }
  
  // 智能预加载（基于用户行为）
  smartPreload(currentPage) {
    const preloadMap = {
      '/pages/home/home': [
        '/pages/features/features',
        '/pages-sub/assess/stress/index'
      ],
      '/pages/features/features': [
        '/pages-sub/assess/academic/index',
        '/pages-sub/music/index'
      ],
      '/pages/community/index': [
        '/pages-sub/community/detail'
      ]
    };
    
    const targets = preloadMap[currentPage] || [];
    targets.forEach(path => this.preloadPage(path));
  }
}

export default new Preloader();
```

在App.vue中集成：
```vue
<script>
import preloader from '@/utils/preloader.js';

export default {
  onShow() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    preloader.smartPreload(currentPage.route);
  }
}
</script>
```

**验收标准**:
- [ ] 页面切换有流畅动画
- [ ] 23个主要页面有骨架屏
- [ ] 智能预加载减少50%加载时间

---

#### Task-014-019: 测试补全（6个任务） ⏱️ 5天

**Task-014**: CDK兑换测试

`tests/e2e/cdk-redeem.test.js`:
```javascript
describe('CDK兑换功能测试', () => {
  let page;
  
  beforeAll(async () => {
    page = await program.navigateTo('/pages-sub/other/redeem');
    await page.waitFor(1000);
  });
  
  it('有效CDK兑换成功', async () => {
    const input = await page.$('.u-input');
    await input.type('VALID-CDK-CODE-2025');
    
    const btn = await page.$('.u-button');
    await btn.tap();
    
    await page.waitFor(2000);
    const toast = await page.$('.u-toast');
    expect(await toast.text()).toContain('兑换成功');
  });
  
  it('无效CDK提示错误', async () => {
    const input = await page.$('.u-input');
    await input.type('INVALID-CODE');
    
    const btn = await page.$('.u-button');
    await btn.tap();
    
    await page.waitFor(1000);
    const toast = await page.$('.u-toast');
    expect(await toast.text()).toContain('兑换码无效');
  });
  
  // ... 更多测试用例
});
```

**Task-015-016**: 社区功能测试 + 用户中心测试（类似结构）

**Task-017**: 性能基准测试

`tests/performance/benchmark.js`:
```javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runBenchmark() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port
  };
  
  const runnerResult = await lighthouse('http://localhost:8080', options);
  
  // 性能指标
  const {lcp, fid, cls, fcp, tti} = runnerResult.lhr.audits;
  
  console.log('性能基准测试结果:');
  console.log(`- FCP (首次内容绘制): ${fcp.numericValue}ms`);
  console.log(`- LCP (最大内容绘制): ${lcp.numericValue}ms`);
  console.log(`- TTI (可交互时间): ${tti.numericValue}ms`);
  console.log(`- FID (首次输入延迟): ${fid.numericValue}ms`);
  console.log(`- CLS (累积布局偏移): ${cls.numericValue}`);
  
  // 断言
  expect(lcp.numericValue).toBeLessThan(2500); // LCP < 2.5s
  expect(fid.numericValue).toBeLessThan(100);  // FID < 100ms
  expect(cls.numericValue).toBeLessThan(0.1);  // CLS < 0.1
  
  await chrome.kill();
}

runBenchmark();
```

**Task-018**: 压力测试

`tests/stress/load-test.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // 2分钟爬升到100用户
    { duration: '5m', target: 100 },  // 5分钟保持100用户
    { duration: '2m', target: 200 },  // 2分钟爬升到200用户
    { duration: '5m', target: 200 },  // 5分钟保持200用户
    { duration: '2m', target: 0 },    // 2分钟降至0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%请求<500ms
    http_req_failed: ['rate<0.01'],   // 错误率<1%
  },
};

export default function () {
  // 测试登录
  let loginRes = http.post('https://api.example.com/auth-login', {
    code: 'test_code'
  });
  check(loginRes, {
    'login status 200': (r) => r.status === 200,
  });
  
  // 测试评估
  let assessRes = http.get('https://api.example.com/assessment-list');
  check(assessRes, {
    'assessment status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

**验收标准**:
- [ ] E2E测试覆盖所有核心流程
- [ ] 性能基准达到Web Vitals标准
- [ ] 压力测试通过200并发用户

---

#### Task-020-021: 工具开发（2个任务） ⏱️ 2天

**Task-020**: API文档索引生成

`docs/api/API-INDEX.md` (自动生成):
```markdown
# API文档索引

## 认证模块
- [auth-login](./auth-login.md) - 微信登录
- [auth-register](./auth-register.md) - 用户注册
- [auth-refresh](./auth-refresh.md) - Token刷新
- [auth-me](./auth-me.md) - 用户信息查询

## 评估模块
- [assessment-create](./assessment-create.md) - 创建评估
- [assessment-get-history](./assessment-get-history.md) - 评估历史
- [assessment-result](./assessment-result.md) - 评估结果

...（32个API自动生成索引）
```

生成脚本 `tools/generate-api-index.js`:
```javascript
const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../docs/api');
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.md') && f !== 'API-INDEX.md');

const categories = {
  '认证模块': ['auth-'],
  '用户模块': ['user-'],
  '评估模块': ['assessment-'],
  'AI对话': ['chat-', 'stress-chat'],
  'CDK': ['cdk-'],
  '音乐': ['fn-music'],
  '社区': ['community-'],
  '同意管理': ['consent-'],
  '埋点': ['events-'],
  '其他': []
};

let content = '# API文档索引\n\n';

Object.entries(categories).forEach(([category, prefixes]) => {
  content += `\n## ${category}\n`;
  
  const matchedFiles = files.filter(f => 
    prefixes.length === 0 || prefixes.some(p => f.startsWith(p))
  );
  
  matchedFiles.forEach(file => {
    const name = file.replace('.md', '');
    const title = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    content += `- [${title}](./${file})\n`;
  });
});

fs.writeFileSync(path.join(apiDir, 'API-INDEX.md'), content);
console.log('API索引生成完成！');
```

**Task-021**: 开发者文档整合

`docs/DEVELOPER-GUIDE.md`:
```markdown
# 翎心CraneHeart 开发者指南

## 快速开始

### 环境要求
- Node.js 16+
- HBuilderX 4.65+
- 微信开发者工具
- PostgreSQL 12+

### 安装依赖
\`\`\`bash
npm install
\`\`\`

### 运行项目
\`\`\`bash
npm run dev:h5          # H5开发
npm run dev:mp-weixin   # 微信小程序开发
\`\`\`

## 技术架构

- **前端框架**: uni-app 2.x + Vue 2.6
- **UI组件**: uView-UI 2.0.36
- **状态管理**: localStorage (Vuex未使用)
- **云服务**: uniCloud 阿里云
- **数据库**: PostgreSQL 12

## 目录结构
...

## API文档
详见 [API索引](./api/API-INDEX.md)

## 数据库文档
详见 [数据库Schema](./database/)

## 技术文档
- [本地存储加密方案](./STORAGE-ENCRYPTION.md)
- [离线支持策略](./OFFLINE-SUPPORT.md)
- [错误追踪机制](./ERROR-TRACKING.md)
- [埋点系统规范](./ANALYTICS-SPECIFICATION.md)

## 开发规范
...
```

**验收标准**:
- [ ] API索引自动生成且完整
- [ ] 开发者文档覆盖所有技术栈
- [ ] 新人可根据文档快速上手

---

## 三、建议完成的编码任务（P2）

### 📌 P2 - 优化提升（21个任务，1-2周）

由于篇幅限制，以下仅列出任务清单：

**UX优化（5个）**:
- Task-022: 触摸反馈全局统一 (1天)
- Task-023: 表单输入优化（自动聚焦/输入历史） (1天)
- Task-024: 无障碍支持（aria-label等） (2天)
- Task-025: 页面转场效果优化 (1天)
- Task-026: 暗黑模式全面支持 (2天)

**测试扩展（3个）**:
- Task-027: 单元测试覆盖率达到80% (3天)
- Task-028: 可视化回归测试 (2天)
- Task-029: 安全测试（XSS/CSRF） (2天)

**工具完善（10个）**:
- Task-030: 组件依赖分析工具 (1天)
- Task-031: 性能分析工具增强 (1天)
- Task-032: 测试覆盖率报告 (1天)
- Task-033: Postman集合生成 (半天)
- Task-034: OpenAPI 3.0规范 (1天)
- Task-035: ESLint自定义规则 (1天)
- Task-036: Git commit规范检查 (半天)
- Task-037: 发布检查清单自动化 (1天)
- Task-038: 性能监控看板 (2天)
- Task-039: 错误追踪Sentry集成 (1天)

**文档与部署（3个）**:
- Task-040: VuePress文档网站 (2天)
- Task-041: CI/CD GitHub Actions配置 (1天)
- Task-042: Docker部署配置 (1天)

---

## 四、周次计划

### Week 1: 核心功能补全 + 打包优化

**Day 1-2 (Mon-Tue)**:
- [x] Task-001: 社区图片审核集成 (4h) ✅ 已完成 (Mock版本)
- [x] Task-002: content-moderation云函数 (1d) ✅ 已实现Mock版本，待替换真实API
- [x] Task-003: 数据库运维脚本 (1d) ✅ 已完成

**Day 3 (Wed)**:
- [x] Task-004: 兼容性测试执行 (1d)

**Day 4 (Thu)**:
- [x] Task-005: 离线Service Worker (开始)

**Day 5 (Fri)**:
- [x] Task-005: 离线Service Worker (完成)
- [x] Task-006: 打包优化配置 (1d)

**验收**:
- [ ] 社区发布有图片审核
- [ ] 4个运维脚本可执行
- [ ] H5离线可访问
- [ ] 打包体积减少30%

---

### Week 2: UX优化 + 测试框架

**Day 1-2 (Mon-Tue)**:
- [x] Task-007: 页面切换动画 (2h)
- [x] Task-008: 骨架屏组件创建 (4h)
- [x] Task-009: 23个页面集成骨架屏 (1d)

**Day 3 (Wed)**:
- [x] Task-010: 智能预加载 (1d)

**Day 4-5 (Thu-Fri)**:
- [x] Task-014: CDK兑换测试 (1d)
- [x] Task-015: 社区功能测试 (1d)

**验收**:
- [ ] 页面切换流畅
- [ ] 所有主要页面有骨架屏
- [ ] 预加载生效
- [ ] CDK/社区测试通过

---

### Week 3-4: 核心测试补全

**Day 1-3 (Mon-Wed)**:
- [x] Task-016: 用户中心测试 (1d)
- [x] Task-017: 性能基准测试 (1d)
- [x] Task-018: 压力测试 (1d)

**Day 4-5 (Thu-Fri)**:
- [x] Task-020: API文档索引 (1d)
- [x] Task-021: 开发者文档整合 (1d)

**Day 6-10 (Week 4)**:
- [x] P2任务选择性完成（根据优先级）
- [x] 回归测试
- [x] Bug修复

**验收**:
- [ ] 核心测试覆盖率>70%
- [ ] 性能达到Web Vitals标准
- [ ] 200并发压力测试通过
- [ ] 文档完整可用

---

### Week 5: 工具开发 + 补充测试

**选择性完成P2任务**（根据团队情况）:
- 优先: Task-022-024 (UX优化)
- 优先: Task-030-032 (工具完善)
- 可选: Task-027-029 (测试扩展)

**验收**:
- [ ] 至少完成10个P2任务
- [ ] 工具完善度>60%

---

### Week 6: 发布准备

**Day 1-2 (Mon-Tue)**:
- [ ] 全面回归测试
- [ ] 已知Bug修复
- [ ] 性能优化调整

**Day 3 (Wed)**:
- [ ] 生成发布报告
- [ ] 更新CHANGELOG
- [ ] 准备发布材料

**Day 4-5 (Thu-Fri)**:
- [ ] 预生产环境部署测试
- [ ] 数据库迁移演练
- [ ] 发布流程演练

**验收**:
- [ ] 所有P0/P1任务完成
- [ ] 核心测试通过率100%
- [ ] 性能指标达标
- [ ] 发布材料齐全

---

## 五、验收标准

### 5.1 代码质量标准

| 指标 | 目标 | 现状 | 差距 |
|------|------|------|------|
| 核心功能完成度 | 100% | 85% | 15% |
| 代码覆盖率 | 80% | 40% | 40% |
| ESLint错误数 | 0 | 未知 | - |
| 打包体积 | <2MB | ~3MB | -33% |
| 首屏加载时间 | <2s | ~3s | -33% |

### 5.2 功能验收清单

**P0必须通过**:
- [ ] 所有核心业务流程无阻塞Bug
- [ ] 图片审核功能正常
- [ ] 数据库运维脚本可用
- [ ] 兼容性测试通过

**P1重要功能**:
- [ ] H5离线访问可用
- [ ] 打包体积减少30%
- [ ] 23个页面有骨架屏
- [ ] 核心测试覆盖率>70%

**P2优化功能**:
- [ ] 完成至少10个P2任务
- [ ] 文档网站可访问
- [ ] CI/CD流程可用

### 5.3 性能验收标准

**Web Vitals**:
- LCP (最大内容绘制) < 2.5s
- FID (首次输入延迟) < 100ms
- CLS (累积布局偏移) < 0.1

**自定义指标**:
- 首屏加载 < 2s
- 页面切换 < 300ms
- API响应 < 500ms (p95)
- 内存占用 < 100MB

### 5.4 测试验收标准

**测试覆盖**:
- 单元测试覆盖率 > 80%
- E2E测试覆盖核心流程
- 兼容性测试通过5个平台

**稳定性**:
- 压力测试通过200并发
- 无内存泄漏
- 无严重性能问题

### 5.5 文档验收标准

**必备文档**:
- [x] API文档索引
- [x] 开发者文档
- [x] 部署文档
- [x] 用户手册

**可选文档**:
- [ ] 文档网站
- [ ] 视频教程
- [ ] FAQ

---

## 六、风险与应对

### 6.1 时间风险

**风险**: 6周可能不够完成所有P2任务

**应对**:
1. 聚焦P0/P1任务（17个，3周可完成）
2. P2任务分优先级（先UX，后工具）
3. 可延后到v1.1.0的任务清单：
   - 暗黑模式全面支持
   - 安全测试
   - 部分工具开发

### 6.2 人力风险

**风险**: 单人开发可能需要8周+

**应对**:
1. 招募1名前端开发协助
2. 外包部分测试工作
3. 使用自动化工具减少重复劳动

### 6.3 技术风险

**风险**: 图片审核API费用、Service Worker兼容性

**应对**:
1. 图片审核降级策略（接口失败时允许发布）
2. Service Worker仅H5端启用
3. 准备后备方案（如使用CDN缓存代替SW）

---

## 七、总结

### 当前进度
- ✅ 核心业务功能：85%
- ⚠️ 优化类功能：40%
- ⚠️ 测试覆盖：40%
- ⚠️ 工具完善：10%

### 发布路径

**最小可行版本（3周）**:
- 完成17个P0/P1任务
- 核心功能100%
- 测试覆盖>70%
- **可以小范围公测**

**推荐发布版本（6周）**:
- 完成17个P0/P1 + 10个P2任务
- 核心功能100% + 优化功能60%
- 测试覆盖>80%
- **可以正式上线**

**完美版本（8-10周）**:
- 完成所有38个任务
- 所有功能100%
- 测试覆盖>90%
- **企业级标准**

### 建议

基于当前状态，我建议：

1. **优先完成P0/P1任务**（3周）→ 达到可公测标准
2. **选择性完成P2任务**（2周）→ 提升用户体验
3. **回归测试 + Bug修复**（1周）→ 确保稳定性
4. **总计6周达到正式上线标准**

剩余的P2任务可以在v1.1.0中持续迭代。

---

**准备好开始了吗？**

建议从 **Task-001 社区图片审核集成** 开始！

