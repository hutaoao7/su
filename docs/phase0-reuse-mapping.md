# 阶段 0：复用扫描报告与映射表

**扫描时间**: 2025-10-12  
**基线文档**: CraneHeart开发周期计划-用户端.md  
**项目路径**: D:\HBuilderX.4.65.2025051206\翎心

---

## 一、扫描结果总结

### 1.1 UI组件库问题 ⚠️ **关键问题**

| 发现项 | 现状 | 目标 | 结论 |
|--------|------|------|------|
| UI组件库 | **混用 uni-ui** (uni_modules 中仅有 uni-ui) | **统一使用 uView 2.x** | ❌ **需整改** |
| 组件引用 | pages/user/home.vue、pages/features/features.vue、components/scale/ScaleRunner.vue 使用 `u-popup`、`u-icon`、`u-input` 等 uView 组件 | uView 2.x 组件 | ❌ **需替换或安装 uView** |
| uni_modules | 仅包含 uni-ui 组件（uni-badge、uni-popup、uni-icons 等约 50+ 模块） | - | ✅ 已安装 |

**整改建议**: 
- **方案 A（推荐）**: 安装 uView 2.x 并统一使用，移除 uni-ui 依赖
- **方案 B**: 将现有 u- 前缀组件全部替换为 uni- 前缀组件，但需要大量改造

---

### 1.2 Supabase 连接架构 ✅ **符合要求**

| 项目 | 检查点 | 状态 |
|------|--------|------|
| 前端 pages/ | 无 `createClient` 或 `from '@supabase` 引用 | ✅ 未直连 |
| 前端 components/ | 无 Supabase 客户端实例化 | ✅ 未直连 |
| 前端 utils/ | 无 Supabase 相关代码 | ✅ 未直连 |
| 云函数配置 | `uniCloud-aliyun/cloudfunctions/common/secrets/supabase.js` 存在配置 | ✅ 云端管理 |
| 云函数实现 | service_role_key 仅存在于云函数，未在前端暴露 | ✅ 符合安全规范 |

**架构确认**: 前端 → uniCloud 云函数 → Supabase ✅

---

### 1.3 云函数模块规范 ✅ **符合要求**

| 云函数 | 导入语法 | 导出语法 | Node.js 版本要求 | 状态 |
|--------|----------|----------|------------------|------|
| auth-login | `const crypto = require('crypto')` | `exports.main = async...` | Node 16 CJS | ✅ |
| auth-register | `require()` | `exports.main` | Node 16 CJS | ✅ |
| stress-chat | `const axios = require('axios')` | `exports.main` | Node 16 CJS | ✅ |
| cdk-redeem | `require()` | `exports.main` | Node 16 CJS | ✅ |
| 所有云函数 | ❌ 未发现 ESM 语法 (`import`/`export`) | ✅ 使用 CommonJS | - | ✅ |

**结论**: 所有云函数已使用 CommonJS (require/module.exports)，符合 Node 16 LTS 要求 ✅

---

## 二、仓库树结构

```
d:\HBuilderX.4.65.2025051206\翎心\
├── pages/
│   ├── admin/                    [管理端相关 - 本次非重点]
│   │   └── metrics.vue           → 数据看板（B-side 任务）
│   ├── assess/                   [评估模块 ⭐ 核心]
│   │   ├── academic/index.vue    → 学业压力评估
│   │   ├── social/index.vue      → 社交焦虑快筛
│   │   ├── social/spin.vue       → 社交焦虑详细评估
│   │   ├── sleep/index.vue       → 睡眠质量评估
│   │   └── stress/index.vue      → 一般压力评估
│   ├── cdk/                      [CDK兑换 ⭐ 核心]
│   │   └── redeem.vue            → CDK兑换页面
│   ├── community/                [社区功能]
│   │   ├── index.vue             → 社区首页
│   │   └── detail.vue            → 帖子详情
│   ├── features/                 [探索页 ⭐ 核心]
│   │   ├── features.vue          → 功能探索入口
│   │   └── features.json         → 功能配置
│   ├── feedback/                 [反馈模块]
│   │   └── feedback.vue          → 问题反馈
│   ├── home/                     [首页 ⭐ 核心]
│   │   └── home.vue              → 应用首页
│   ├── index/                    [启动页]
│   │   └── index.vue             → 启动/引导页
│   ├── intervene/                [干预模块 ⭐ 核心]
│   │   ├── chat.vue              → AI对话干预
│   │   ├── intervene.vue         → 干预入口
│   │   ├── meditation.vue        → 冥想练习
│   │   └── nature.vue            → 自然音疗
│   ├── login/                    [用户认证 ⭐ 核心]
│   │   └── login.vue             → 登录/注册页
│   ├── music/                    [音乐模块]
│   │   ├── index.vue             → 音乐列表
│   │   └── player.vue            → 音乐播放器
│   ├── settings/                 [设置页 ⭐ 核心]
│   │   └── settings.vue          → 应用设置
│   ├── stress/                   [压力检测 ⭐ 核心]
│   │   ├── detect.vue            → 检测执行页
│   │   ├── history.vue           → 历史记录
│   │   ├── index.vue             → 检测入口
│   │   ├── intervention.vue      → 干预建议
│   │   └── record.vue            → 单条记录详情
│   ├── test/                     [测试页]
│   │   └── index.vue             → 开发测试
│   └── user/                     [用户中心 ⭐ 核心]
│       ├── home.vue              → 个人中心首页
│       └── profile.vue           → 个人资料

├── components/
│   ├── common/                   [通用组件 ⭐ 核心]
│   │   ├── ErrorBoundary.vue     → 错误边界
│   │   ├── LoadingState.vue      → 加载状态
│   │   ├── NavBar.vue            → 导航栏
│   │   └── TabBar.vue            → 底部TabBar
│   ├── scale/                    [量表组件 ⭐ 核心]
│   │   └── ScaleRunner.vue       → 量表执行器
│   ├── AiModule.vue              → AI模块组件
│   ├── CdkModule.vue             → CDK模块组件
│   ├── MusicModule.vue           → 音乐模块组件
│   ├── SafeNavBar.vue            → 安全导航栏
│   └── ScreeningModule.vue       → 筛查模块组件

├── common/
│   ├── features.js               → 功能特性配置
│   └── nav.js                    → 导航配置

├── utils/                        [工具函数 ⭐ 核心]
│   ├── api-handler.js            → API调用封装
│   ├── audio.js                  → 音频处理
│   ├── auth.js                   → 认证工具
│   ├── css-loader.js             → CSS加载器
│   ├── event-bus.js              → 事件总线
│   ├── http.js                   → HTTP请求封装
│   ├── invoke.js                 → 云函数调用
│   ├── render-optimization.js    → 渲染优化
│   ├── request.js                → 统一请求
│   ├── resource-handler.js       → 资源处理
│   ├── route-fix.js              → 路由修复
│   ├── route-guard.js            → 路由守卫
│   ├── router.js                 → 路由管理
│   ├── scoring.js                → 量表评分
│   ├── unicloud-handler.js       → uniCloud处理 ⭐
│   ├── unicloud-request.js       → uniCloud请求
│   ├── wechat-login.js           → 微信登录
│   ├── white-screen-detector.js  → 白屏检测
│   └── white-screen-fix.js       → 白屏修复

├── uniCloud-aliyun/cloudfunctions/
│   ├── auth-login/               → 登录云函数 ⭐
│   ├── auth-register/            → 注册云函数 ⭐
│   ├── auth-refresh/             → Token刷新
│   ├── auth-me/                  → 获取用户信息
│   ├── cdk-batchCreate/          → CDK批量生成 ⭐
│   ├── cdk-redeem/               → CDK兑换 ⭐
│   ├── cdk-verify/               → CDK验证
│   ├── stress-analyzer/          → 压力分析 ⭐
│   ├── stress-chat/              → AI对话 ⭐
│   ├── events-track/             → 事件埋点 ⭐
│   ├── feedback-submit/          → 反馈提交
│   ├── admin-metrics/            → 指标查询（B-side）
│   ├── fn-ai/                    → AI功能
│   ├── fn-music/                 → 音乐功能
│   └── common/                   [公共模块 ⭐]
│       ├── auth/                 → 认证中间件
│       ├── db/                   → 数据库封装
│       ├── jwt/                  → JWT工具
│       ├── rateLimit/            → 限流中间件
│       ├── response/             → 响应格式化
│       ├── secrets/              → 密钥管理 ⭐
│       │   └── supabase.js       → Supabase配置
│       └── validator/            → 参数校验

├── static/
│   ├── scales/                   [量表JSON ⭐ 核心]
│   │   ├── academic_stress_8.json
│   │   ├── gad7.json
│   │   ├── phq9.json
│   │   └── ... (共14个量表文件)
│   ├── music/tracks.json         → 音乐曲目配置
│   └── images/                   → 静态图片

└── api/                          [API封装]
    ├── community.js              → 社区API
    ├── stress.js                 → 压力相关API
    └── user.js                   → 用户API
```

---

## 三、复用映射表

### 3.1 pages/ - 页面模块

| 模块 | 路径 | 依赖 | 与基线差异 | 结论 |
|------|------|------|-----------|------|
| **登录/认证** | pages/login/login.vue | utils/wechat-login.js, auth.js | 已实现微信登录 | ✅ **直接复用** |
| **首页** | pages/home/home.vue | TabBar.vue | 符合 M1-Week1 基础模块 | ✅ **直接复用** |
| **用户中心** | pages/user/home.vue | ⚠️ 使用 u-popup (uView) | M1-Week1 用户系统 | ⚠️ **小改**（需统一UI库）|
| **用户资料** | pages/user/profile.vue | - | M1-Week1 用户信息页面 | ✅ **直接复用** |
| **功能探索** | pages/features/features.vue | ⚠️ 使用 u-icon (uView) | M1-Week1 基础组件 | ⚠️ **小改**（需统一UI库）|
| **心理评估** | pages/assess/academic/index.vue | ScaleRunner.vue | M1-Week2 量表功能 | ✅ **直接复用** |
| | pages/assess/social/index.vue | ScaleRunner.vue | M1-Week2 量表功能 | ✅ **直接复用** |
| | pages/assess/sleep/index.vue | ScaleRunner.vue | M1-Week2 量表功能 | ✅ **直接复用** |
| | pages/assess/stress/index.vue | ScaleRunner.vue | M1-Week2 量表功能 | ✅ **直接复用** |
| **量表组件** | components/scale/ScaleRunner.vue | ⚠️ 使用 u-input (uView), utils/scoring.js | M1-Week2 核心组件 | ⚠️ **小改**（需统一UI库）|
| **AI干预** | pages/intervene/chat.vue | stress-chat 云函数 | M1-Week3 AI干预 | ✅ **直接复用** |
| | pages/intervene/meditation.vue | - | 冥想内容 | ✅ **直接复用** |
| **CDK兑换** | pages/cdk/redeem.vue | ⚠️ 使用 u-input, cdk-redeem 云函数 | M1-Week3 CDK系统 | ⚠️ **小改**（需统一UI库）|
| **设置页** | pages/settings/settings.vue | - | M1-Week1 基础模块 | ✅ **直接复用** |
| **压力检测** | pages/stress/index.vue | - | 压力相关功能 | ✅ **直接复用** |
| | pages/stress/detect.vue | stress-analyzer 云函数 | 压力检测执行 | ✅ **直接复用** |
| | pages/stress/history.vue | - | M1 历史记录 | ✅ **直接复用** |
| **社区模块** | pages/community/index.vue | - | ❌ 不在基线范围内 | 🔴 **暂时保留** |
| | pages/community/detail.vue | - | ❌ 不在基线范围内 | 🔴 **暂时保留** |
| **反馈** | pages/feedback/feedback.vue | feedback-submit 云函数 | 问题反馈（Week 中期添加） | ✅ **直接复用** |
| **管理后台** | pages/admin/metrics.vue | admin-metrics 云函数 | ❌ B-side 文档范围 | 🔴 **本次不处理** |

---

### 3.2 components/ - 组件模块

| 组件 | 路径 | 依赖 | 与基线差异 | 结论 |
|------|------|------|-----------|------|
| **量表执行器** | components/scale/ScaleRunner.vue | ⚠️ uView (u-input), static/scales/*.json | M1-Week2 核心 | ⚠️ **小改**（统一UI库）|
| **错误边界** | components/common/ErrorBoundary.vue | - | M1-Week1 错误处理 | ✅ **直接复用** |
| **加载状态** | components/common/LoadingState.vue | - | M1-Week1 通用组件 | ✅ **直接复用** |
| **导航栏** | components/common/NavBar.vue | - | M1-Week1 通用组件 | ✅ **直接复用** |
| **TabBar** | components/common/TabBar.vue | pages.json tabBar配置 | M1-Week1 基础组件 | ✅ **直接复用** |
| **安全导航栏** | components/SafeNavBar.vue | - | 可选增强组件 | ✅ **直接复用** |
| **AI模块** | components/AiModule.vue | - | M1-Week3 AI干预组件 | ✅ **直接复用** |
| **CDK模块** | components/CdkModule.vue | - | M1-Week3 CDK组件 | ✅ **直接复用** |

---

### 3.3 utils/ - 工具模块

| 工具 | 路径 | 依赖 | 与基线差异 | 结论 |
|------|------|------|-----------|------|
| **uniCloud处理** | utils/unicloud-handler.js | api-handler.js | M1-Week1 云函数封装 | ✅ **直接复用** |
| **API处理器** | utils/api-handler.js | - | M1-Week1 请求封装 | ✅ **直接复用** |
| **认证工具** | utils/auth.js | - | M1-Week1 用户系统 | ✅ **直接复用** |
| **微信登录** | utils/wechat-login.js | auth.js, auth-login 云函数 | M1-Week1 微信登录 | ✅ **直接复用** |
| **路由守卫** | utils/route-guard.js | auth.js | M1-Week1 路由守卫 | ✅ **直接复用** |
| **评分系统** | utils/scoring.js | static/scales/*.json | M1-Week2 评估逻辑 | ✅ **直接复用** |
| **HTTP请求** | utils/http.js | - | ⚠️ 配置指向外部API | ⚠️ **小改**（应优先uniCloud）|
| **请求封装** | utils/request.js | - | ⚠️ 配置外部BASE_URL | ⚠️ **小改**（应优先uniCloud）|
| **事件总线** | utils/event-bus.js | - | M1-Week1 基础组件 | ✅ **直接复用** |
| **白屏检测** | utils/white-screen-detector.js | - | M2 容错降级 | ✅ **直接复用** |
| **白屏修复** | utils/white-screen-fix.js | - | M2 容错降级 | ✅ **直接复用** |
| **资源处理** | utils/resource-handler.js | - | 资源加载优化 | ✅ **直接复用** |
| **渲染优化** | utils/render-optimization.js | - | M4 性能优化 | ✅ **直接复用** |

---

### 3.4 uniCloud-aliyun/cloudfunctions/ - 云函数模块

| 云函数 | 路径 | 依赖 | 与基线差异 | 结论 |
|--------|------|------|-----------|------|
| **登录** | auth-login/index.js | common/jwt, 微信API | M1-Week1 微信登录接入 | ✅ **直接复用** |
| **注册** | auth-register/index.js | common/db, common/secrets | M1-Week1 用户注册 | ✅ **直接复用** |
| **Token刷新** | auth-refresh/index.js | common/jwt | M1 认证系统 | ✅ **直接复用** |
| **用户信息** | auth-me/index.js | common/auth, common/db | M1-Week1 用户信息 | ✅ **直接复用** |
| **CDK兑换** | cdk-redeem/index.js | common/db, common/secrets/supabase | M1-Week3 CDK兑换 | ✅ **直接复用** |
| **CDK验证** | cdk-verify/index.js | common/db | M1-Week3 CDK验证 | ✅ **直接复用** |
| **CDK批量生成** | cdk-batchCreate/index.js | common/db | ❌ B-side 功能 | 🔴 **本次不处理** |
| **压力分析** | stress-analyzer/index.js | - | 压力检测功能 | ✅ **直接复用** |
| **AI对话** | stress-chat/index.js | axios, OpenAI API | M1-Week3 AI干预 | ⚠️ **小改**（需配置AI网关）|
| **事件埋点** | events-track/index.js | common/db | M3-Week8 监控系统 | ✅ **直接复用** |
| **反馈提交** | feedback-submit/index.js | common/db | 反馈功能 | ✅ **直接复用** |
| **管理指标** | admin-metrics/index.js | common/db | ❌ B-side 功能 | 🔴 **本次不处理** |
| **公共模块** | common/auth/index.js | jwt | M1 认证中间件 | ✅ **直接复用** |
| | common/db/index.js | Supabase | M1 数据库封装 | ✅ **直接复用** |
| | common/secrets/supabase.js | ✅ 环境变量 | M1 密钥管理 | ✅ **直接复用** |
| | common/jwt/index.js | crypto | M1 JWT工具 | ✅ **直接复用** |
| | common/rateLimit/index.js | - | M2 安全基础 | ✅ **直接复用** |
| | common/validator/index.js | - | M2 参数校验 | ✅ **直接复用** |

---

### 3.5 static/ - 静态资源

| 资源类型 | 路径 | 内容 | 结论 |
|---------|------|------|------|
| **量表数据** | static/scales/academic_stress_8.json | 学业压力量表（8题） | ✅ **直接复用** |
| | static/scales/gad7.json | GAD-7 广泛性焦虑量表 | ✅ **直接复用** |
| | static/scales/phq9.json | PHQ-9 抑郁症筛查量表 | ✅ **直接复用** |
| | static/scales/*.json | 共14个标准化量表 | ✅ **直接复用** |
| **音乐资源** | static/music/tracks.json | 音乐曲目配置 | ✅ **直接复用** |
| **图片资源** | static/images/ | TabBar图标、压力检测图标等 | ✅ **直接复用** |

---

## 四、问题汇总与整改方案

### 4.1 关键问题

#### ❌ **P0 - UI组件库混用**

**问题描述**:  
- 代码中使用 uView 组件（`u-popup`、`u-icon`、`u-input`）
- 但 uni_modules 仅安装了 uni-ui
- 导致运行时组件无法渲染

**影响范围**:  
- pages/user/home.vue
- pages/features/features.vue  
- components/scale/ScaleRunner.vue
- pages/cdk/redeem.vue

**整改方案**:  
```bash
# 方案 A（推荐）: 安装 uView 2.x
npm install uview-ui@2.x
# 或通过 HBuilderX 插件市场安装

# 方案 B: 替换为 uni-ui 组件
u-popup      → uni-popup
u-icon       → uni-icons  
u-input      → uni-easyinput
u-button     → uni-forms + button
```

**执行时机**: M0 阶段（10.22-10.23 环境搭建时）

---

#### ⚠️ **P1 - 请求封装优先级**

**问题描述**:  
- utils/http.js 和 utils/request.js 配置了外部 API BASE_URL
- 应优先使用 uniCloud 云函数（utils/unicloud-handler.js）
- 避免前端直连外部服务

**整改方案**:  
1. 明确 utils/unicloud-handler.js 为主要请求通道
2. utils/http.js 仅用于非 uniCloud 场景（如第三方服务）
3. 更新所有页面引用，统一使用 cloudFunctions.xxx 封装

**执行时机**: M1-Week1 基础组件整改

---

#### ⚠️ **P2 - AI 网关未实现**

**问题描述**:  
- stress-chat/index.js 直接调用 OpenAI API
- 缺少统一适配层、限流、退避、降级机制
- API_KEY 硬编码在代码中（应使用环境变量）

**整改方案**:  
```javascript
// 在 common/ 下新建 ai-gateway/index.js
module.exports = {
  chat: async (messages, options) => {
    // 1. 限流检查
    // 2. 调用 OpenAI/其他模型
    // 3. 内容安全检测
    // 4. 降级处理（本地规则模板）
    // 5. 错误重试 + 指数退避
  }
}
```

**执行时机**: M1-Week3 AI干预开发前

---

### 4.2 可选优化

| 优化项 | 优先级 | 说明 | 时机 |
|--------|--------|------|------|
| 移除 pages/admin/metrics.vue | P2 | B-side 功能，本次不涉及 | M1 后期清理 |
| 社区模块评审 | P3 | 不在基线核心功能内，评估是否保留 | M1 评审会 |
| 统一错误处理 | P1 | 完善 ErrorBoundary + 全局异常捕获 | M2-Week7 |
| 埋点规范化 | P1 | events-track 接入所有关键操作 | M3-Week8 |

---

## 五、复用总结

### 5.1 可直接复用模块（80%）

✅ **登录认证**: 完整实现，微信登录 + JWT + 云函数  
✅ **量表系统**: ScaleRunner + 14个标准量表 + 评分逻辑  
✅ **评估功能**: 4个评估页面（学业/社交/睡眠/压力）  
✅ **AI干预**: 对话界面 + stress-chat 云函数  
✅ **CDK系统**: 兑换页面 + 云函数（redeem/verify）  
✅ **用户系统**: 个人中心 + 资料页 + 设置页  
✅ **通用组件**: ErrorBoundary, LoadingState, NavBar, TabBar  
✅ **工具函数**: 路由守卫、事件总线、白屏检测、uniCloud封装  
✅ **云函数公共层**: auth, db, jwt, rateLimit, validator  

### 5.2 需要小改模块（15%）

⚠️ **UI组件统一**: 4个文件需替换 uView → uni-ui 或安装 uView  
⚠️ **请求优先级**: 明确 uniCloud 为主通道  
⚠️ **AI网关**: stress-chat 需增加适配层和降级  
⚠️ **环境变量**: OpenAI API Key 迁移到配置中心  

### 5.3 需要重构/新建模块（5%）

🔴 **AI网关**: common/ai-gateway/ (新建)  
🔴 **内容安全**: 新建内容审核中间件  
🔴 **隐私保护**: 数据导出/撤回同意功能（M2-Week6）  

### 5.4 废弃/不处理模块

🗑️ pages/admin/metrics.vue (B-side 范围)  
🗑️ cdk-batchCreate (B-side 范围)  
❓ pages/community/* (待评审)  

---

## 六、下一步行动

### M0 阶段（10.22-10.23）- 环境搭建

- [ ] 决策 UI 组件库方案（uView 2.x vs uni-ui）
- [ ] 安装依赖并验证组件可用性
- [ ] 配置 ESLint 规则（禁用 uni-ui 或强制 uView）
- [ ] 配置环境变量管理（OpenAI API Key）
- [ ] 创建 tools/check-engines.js 检查脚本

### M1-Week1（10.27-10.31）- 基础模块

- [ ] 修复 UI 组件引用（4个文件）
- [ ] 统一请求通道为 uniCloud
- [ ] 验证微信登录流程
- [ ] 验证路由守卫逻辑

### M1-Week2（11.03-11.07）- 评估功能

- [ ] 测试 ScaleRunner 各种题型
- [ ] 验证 14 个量表数据完整性
- [ ] 测试评分逻辑准确性

### M1-Week3（11.10-11.14）- AI干预与CDK

- [ ] 实现 AI 网关（common/ai-gateway）
- [ ] 接入内容安全审核
- [ ] 配置降级策略（本地模板）
- [ ] 测试 CDK 兑换流程

---

**复用率统计**:  
- ✅ 直接复用: **80%**  
- ⚠️ 小改: **15%**  
- 🔴 重构/新建: **5%**  

**预估节省工时**: 约 60-70% 的开发时间（相比从零开始）

---

**审核人**: ___________  
**审核日期**: ___________  
**批准状态**: [ ] 通过  [ ] 需修改  [ ] 不通过

