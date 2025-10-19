# WS-M1-W1-003: 同意管理流程 - 详细计划文档

**工作流ID**: WS-M1-W1-003  
**标题**: 实现隐私政策同意、用户协议展示  
**分支**: `feat/WS-M1-W1-003-consent-flow`  
**负责人**: 前端A + 后端A  
**预计工时**: 8h（前端6h + 后端2h）

---

## 一、输入/输出明细

### 1.1 输入

#### 代码输入（来自复用扫描）

1. **pages/login/login.vue**（740行）
   - 已有协议勾选UI（checkbox）
   - 已有协议弹窗展示（u-popup）
   - 协议内容内嵌在data中
   - **问题**: 协议内容简单，无完整隐私政策
   - **复用**: 可参考UI设计风格

2. **static/copy/disclaimer.md**（24行）
   - 已有免责声明内容
   - 包含：评估说明、专业建议、紧急求助、隐私保护
   - **复用**: ✅ 直接复用

3. **utils/route-guard.js**（66行）
   - 已有路由守卫框架
   - 拦截navigateTo/switchTab等
   - 调用checkRouteAccess()
   - **复用**: ⚠️ 小改（添加同意检查）

4. **utils/auth.js**（333行）
   - PROTECTED_ROUTES数组（受保护路由列表）
   - checkRouteAccess()函数
   - **复用**: ⚠️ 小改（集成同意检查）

#### 需求输入（来自基线文档）

来自 `CraneHeart开发周期计划-用户端.md` Week 1 同意管理任务：
- 同意流程UI：8h工时
- 隐私政策展示：包含在8h内
- 负责人：前端A
- 交付物：同意流程、隐私政策、协议展示

#### 合规要求（法规输入）

**GDPR/个保法要求**:
1. ✅ 明确告知收集的数据类型
2. ✅ 说明数据使用目的
3. ✅ 用户有权拒绝（但可能无法使用部分功能）
4. ✅ 用户可随时撤回同意
5. ✅ 协议内容清晰易懂
6. ✅ 重大变更需重新同意

### 1.2 输出

#### 代码产出（4个页面+1个云函数）

**1. pages/consent/consent.vue**（约400行）
   - 功能：同意管理主页，首次启动显示
   - 内容：
     * 品牌介绍
     * 协议概要（用户协议、隐私政策、免责声明）
     * 协议链接（可跳转查看详情）
     * 同意按钮（必须勾选后可点击）
     * 拒绝按钮（可选，退出应用或游客模式）
   - UI：液态玻璃风格，与login.vue一致

**2. pages/consent/privacy-policy.vue**（约300行）
   - 功能：展示完整隐私政策
   - 内容：
     * 收集的信息类型
     * 信息使用目的
     * 信息存储与安全
     * 用户权利
     * Cookie使用
     * 第三方服务
     * 政策更新
     * 联系方式
   - UI：长文本滚动视图

**3. pages/consent/user-agreement.vue**（约300行）
   - 功能：展示完整用户协议
   - 内容：
     * 服务说明
     * 用户责任
     * 账号管理
     * 内容规范
     * 知识产权
     * 免责条款
     * 协议变更
     * 争议解决
   - UI：长文本滚动视图

**4. pages/consent/disclaimer.vue**（约200行）
   - 功能：展示免责声明
   - 内容：复用static/copy/disclaimer.md
   - UI：Markdown渲染或纯文本

**5. uniCloud-aliyun/cloudfunctions/consent-record/index.js**（约120行）
   - 功能：记录用户同意状态到Supabase
   - 逻辑：
     * Token验证
     * 记录同意时间、协议版本、IP
     * 插入consent_records表
     * 返回记录ID

#### 功能产出

1. ✅ 首次启动强制同意流程
2. ✅ 可查看完整协议内容
3. ✅ 同意状态本地持久化
4. ✅ 同意状态云端记录
5. ✅ 路由守卫集成（未同意禁止访问）
6. ✅ 设置页可查看已同意协议
7. ✅ 撤回同意入口（M2完善）

---

## 二、依赖关系详细分析

### 2.1 前置依赖

#### WS-M0-001: UI组件库统一

**依赖内容**:
- consent页面使用u-checkbox、u-button
- 协议页面使用u-scroll-view（可选）

**验证方法**:
```bash
npm run check:ui
```

---

#### WS-M1-W1-001: 微信登录

**依赖内容**:
- 同意状态需要关联用户uid
- 未登录用户的同意状态仅本地存储
- 登录后同步到云端

**集成逻辑**:
```javascript
// 登录成功后检查同意状态
if (已登录 && 本地有同意记录 && 云端无记录) {
  // 同步本地同意记录到云端
  await syncConsentToCloud();
}
```

---

### 2.2 后置影响

#### 所有功能页面

**影响内容**:
- 首次启动必须先同意
- 未同意禁止访问任何功能页面
- 白名单：首页、同意页、协议页、登录页

**路由守卫逻辑**:
```javascript
// utils/route-guard.js 增强
function checkRouteAccess(toPath) {
  // 1. 白名单检查（同意页、协议页不拦截）
  if (isWhitelisted(toPath)) {
    return true;
  }
  
  // 2. 同意状态检查
  if (!hasUserConsent()) {
    // 跳转到同意页
    uni.reLaunch({ url: '/pages/consent/consent' });
    return false;
  }
  
  // 3. 登录态检查（原有逻辑）
  if (isProtected(toPath) && !isAuthed()) {
    // 跳转到登录页
    uni.navigateTo({ url: '/pages/login/login' });
    return false;
  }
  
  return true;
}
```

---

## 三、触点文件精确路径

### 3.1 新建前端文件（4个）

| 文件路径 | 预计行数 | 功能 | 工时 |
|---------|---------|------|------|
| `pages/consent/consent.vue` | ~400 | 同意管理主页 | 2h |
| `pages/consent/privacy-policy.vue` | ~300 | 隐私政策展示 | 1.5h |
| `pages/consent/user-agreement.vue` | ~300 | 用户协议展示 | 1.5h |
| `pages/consent/disclaimer.vue` | ~200 | 免责声明展示 | 1h |

**总计**: 约1200行前端代码

---

### 3.2 新建云函数文件（1个）

| 文件路径 | 预计行数 | 功能 | 工时 |
|---------|---------|------|------|
| `uniCloud-aliyun/cloudfunctions/consent-record/index.js` | ~120 | 记录同意状态 | 1h |
| `uniCloud-aliyun/cloudfunctions/consent-record/package.json` | ~25 | 配置 | 10min |

**总计**: 约145行云函数代码

---

### 3.3 小改文件（3个）

| 文件路径 | 原行数 | 变更 | 说明 | 工时 |
|---------|-------|------|------|------|
| `utils/route-guard.js` | 66 | +50行 | 添加同意检查逻辑 | 30min |
| `utils/auth.js` | 333 | +30行 | 添加同意状态管理函数 | 30min |
| `App.vue` | 45 | +20行 | 首次启动检查同意 | 30min |

---

### 3.4 配置文件修改（1个）

| 文件路径 | 变更 | 说明 |
|---------|------|------|
| `pages.json` | +16行 | 新增4个页面路由配置 |

---

### 3.5 复用文件（1个）

| 文件路径 | 行数 | 用途 | 复用方式 |
|---------|------|------|----------|
| `static/copy/disclaimer.md` | 24 | 免责声明内容源 | 读取并渲染 |

---

## 四、数据流详细设计

### 4.1 首次启动同意流程

```
App.vue (onLaunch)
  ↓
[检查同意状态]
const consent = uni.getStorageSync('user_consent');
  ├─ 无记录: 首次使用
  ├─ 有记录但未同意: 上次拒绝
  └─ 有记录且已同意: 已同意
  ↓
如果未同意 AND 不在白名单页面
  ↓
uni.reLaunch({ url: '/pages/consent/consent' })
  ↓
pages/consent/consent.vue 显示
  ├─ 品牌介绍
  ├─ 协议概要
  ├─ 协议链接（可查看详情）
  ├─ 同意checkbox
  └─ 同意/拒绝按钮
  ↓
用户点击"我已阅读并同意"checkbox
  ↓
用户点击"同意并继续"按钮
  ↓
[保存同意状态 - 本地]
uni.setStorageSync('user_consent', {
  agreed: true,
  agreedAt: Date.now(),
  version: '1.0.0', // 协议版本
  agreements: {
    userAgreement: true,
    privacyPolicy: true,
    disclaimer: true
  }
});
  ↓
[可选：同步到云端]
if (isAuthed()) {
  await callCloudFunction('consent-record', {
    agreed: true,
    version: '1.0.0',
    agreedAt: Date.now()
  });
}
  ↓
[跳转到首页]
uni.reLaunch({ url: '/pages/home/home' })
  ↓
用户可正常使用应用
```

---

### 4.2 查看协议详情流程

```
pages/consent/consent.vue
  ↓
用户点击"《隐私政策》"链接
  ↓
uni.navigateTo({ 
  url: '/pages/consent/privacy-policy' 
})
  ↓
pages/consent/privacy-policy.vue 显示
  ├─ 导航栏（返回按钮 + 标题）
  ├─ 长文本内容（scroll-view）
  └─ 底部按钮（可选：同意按钮）
  ↓
用户阅读完毕
  ↓
点击返回按钮
  ↓
返回 consent.vue
```

---

### 4.3 同意状态记录流程

```
用户点击"同意并继续"
  ↓
[前端：本地记录]
const consentData = {
  agreed: true,
  agreedAt: Date.now(),
  version: '1.0.0',
  agreements: {
    userAgreement: true,
    privacyPolicy: true,
    disclaimer: true
  }
};
uni.setStorageSync('user_consent', consentData);
  ↓
[判断是否已登录]
const authed = isAuthed();
  ↓
if (authed) → 立即同步到云端
  ├─ 调用 consent-record 云函数
  ├─ 云函数：Token验证
  ├─ 云函数：插入 consent_records 表
  │   ├─ user_id: uid
  │   ├─ agreed: true
  │   ├─ version: '1.0.0'
  │   ├─ agreed_at: timestamp
  │   ├─ ip_address: context.IP (可选)
  │   └─ user_agent: context.USER_AGENT (可选)
  ├─ 返回 record_id
  └─ 前端保存 record_id 到本地
else → 暂不同步
  └─ 标记为待同步，登录后自动同步
  ↓
[跳转首页]
uni.reLaunch({ url: '/pages/home/home' })
```

---

### 4.4 登录后同步同意记录

```
用户登录成功
  ↓
[检查本地同意记录]
const localConsent = uni.getStorageSync('user_consent');
if (!localConsent || !localConsent.agreed) {
  // 无同意记录，跳过
  return;
}
  ↓
[检查是否已同步]
if (localConsent.synced || localConsent.recordId) {
  // 已同步，跳过
  return;
}
  ↓
[同步到云端]
await callCloudFunction('consent-record', {
  agreed: true,
  version: localConsent.version,
  agreedAt: localConsent.agreedAt
});
  ↓
[标记为已同步]
localConsent.synced = true;
localConsent.recordId = result.recordId;
uni.setStorageSync('user_consent', localConsent);
  ↓
console.log('[CONSENT] 同意记录已同步到云端');
```

---

## 五、异常与降级策略

### 5.1 异常场景处理

#### 场景1: 用户拒绝同意

**触发条件**: 
- 用户点击"不同意"按钮
- 或关闭同意页面

**处理策略**:

**方案A**: 退出应用（严格）
```javascript
handleDecline() {
  uni.showModal({
    title: '无法继续使用',
    content: '您需要同意相关协议才能使用本应用',
    showCancel: false,
    success: () => {
      // 小程序：返回微信
      // #ifdef MP-WEIXIN
      wx.miniProgram.navigateBack();
      // #endif
      
      // H5：关闭页面
      // #ifdef H5
      window.close();
      // #endif
    }
  });
}
```

**方案B**: 游客模式（宽松，推荐）
```javascript
handleDecline() {
  uni.showModal({
    title: '游客模式',
    content: '未同意协议将以游客身份使用，部分功能受限',
    confirmText: '了解',
    showCancel: false,
    success: () => {
      // 标记为游客模式
      uni.setStorageSync('user_consent', {
        agreed: false,
        guestMode: true,
        timestamp: Date.now()
      });
      
      // 跳转首页（游客模式）
      uni.reLaunch({ url: '/pages/home/home?mode=guest' });
    }
  });
}
```

**本工作流选择**: 方案B（游客模式）

---

#### 场景2: 网络异常，无法同步到云端

**处理策略**:
```javascript
try {
  await callCloudFunction('consent-record', {...});
  console.log('[CONSENT] 已同步到云端');
} catch (error) {
  console.warn('[CONSENT] 同步失败，标记为待同步:', error);
  
  // 不阻塞用户，本地先记录
  const consentData = uni.getStorageSync('user_consent');
  consentData.synced = false;
  consentData.syncError = error.message;
  uni.setStorageSync('user_consent', consentData);
  
  // 允许用户继续使用
  uni.reLaunch({ url: '/pages/home/home' });
  
  // 后台重试同步（App.vue onShow）
}
```

---

#### 场景3: 协议版本更新

**触发条件**:
- 隐私政策或用户协议有重大变更
- 版本号从 1.0.0 → 2.0.0

**处理策略**:
```javascript
// App.vue onLaunch
const localConsent = uni.getStorageSync('user_consent');
const currentVersion = '2.0.0'; // 当前协议版本

if (localConsent.agreed && localConsent.version !== currentVersion) {
  // 协议已更新，需重新同意
  uni.showModal({
    title: '协议已更新',
    content: '我们的隐私政策有重要更新，请重新阅读并同意',
    showCancel: false,
    success: () => {
      uni.reLaunch({ url: '/pages/consent/consent?updated=true' });
    }
  });
}
```

---

### 5.2 降级策略

#### 降级1: 云端记录失败，仅本地存储

**适用场景**: Supabase持续不可用

**实施**:
- ✅ 本地存储同意状态
- ✅ 标记为待同步
- ✅ 定期重试同步（App.vue onShow每次尝试）
- ✅ 用户可正常使用

---

#### 降级2: 简化同意流程

**适用场景**: 完整流程导致用户流失率高

**实施**:
- ✅ 合并协议展示到一个页面
- ✅ 简化文案
- ✅ 默认勾选（需明显提示）
- ❌ 不推荐：违反最佳实践

---

## 六、复用说明

### 6.1 复用文件

#### static/copy/disclaimer.md

**复用策略**: ✅ **直接复用**

**用途**: 作为免责声明内容源

**使用方式**:
```javascript
// pages/consent/disclaimer.vue
import disclaimerContent from '@/static/copy/disclaimer.md';

// 或使用uni.request读取
uni.request({
  url: '/static/copy/disclaimer.md',
  success: (res) => {
    this.content = res.data;
  }
});
```

---

### 6.2 小改文件

#### utils/route-guard.js

**当前功能**:
- 拦截路由跳转
- 调用checkRouteAccess()
- 检查登录态

**需要添加**:
```diff
+// 检查同意状态
+function hasUserConsent() {
+  try {
+    const consent = uni.getStorageSync('user_consent');
+    return consent && consent.agreed === true;
+  } catch (error) {
+    console.error('[ROUTE_GUARD] 获取同意状态失败:', error);
+    return false;
+  }
+}
+
+// 白名单路由（不需要同意即可访问）
+const CONSENT_WHITELIST = [
+  '/pages/home/home', // 首页
+  '/pages/consent/consent', // 同意页
+  '/pages/consent/privacy-policy', // 隐私政策
+  '/pages/consent/user-agreement', // 用户协议
+  '/pages/consent/disclaimer', // 免责声明
+  '/pages/login/login' // 登录页
+];
+
+function isWhitelisted(path) {
+  return CONSENT_WHITELIST.includes(path);
+}

 // 重写uni.navigateTo
 uni.navigateTo = function(options) {
   const url = options.url;
   const path = url.split('?')[0];
   
+  // 1. 白名单检查
+  if (isWhitelisted(path)) {
+    return originalNavigateTo.call(this, options);
+  }
+  
+  // 2. 同意状态检查
+  if (!hasUserConsent()) {
+    console.log('[ROUTE_GUARD] 未同意协议，跳转同意页');
+    uni.showToast({
+      title: '请先阅读并同意相关协议',
+      icon: 'none'
+    });
+    setTimeout(() => {
+      uni.reLaunch({ url: '/pages/consent/consent' });
+    }, 500);
+    return Promise.reject(new Error('未同意协议'));
+  }
+  
+  // 3. 原有登录态检查
   if (checkRouteAccess(path)) {
     return originalNavigateTo.call(this, options);
   } else {
     return Promise.reject(new Error('路由访问被拒绝'));
   }
 };
```

**预计改动**: +80行

---

#### utils/auth.js

**需要添加**:

```javascript
// 同意状态管理函数

/**
 * 检查用户是否已同意协议
 * @returns {boolean}
 */
export function hasConsent() {
  try {
    const consent = uni.getStorageSync('user_consent');
    return consent && consent.agreed === true;
  } catch (error) {
    console.error('[AUTH] 获取同意状态失败:', error);
    return false;
  }
}

/**
 * 保存同意状态
 * @param {Object} consentData
 */
export function saveConsent(consentData) {
  try {
    uni.setStorageSync('user_consent', consentData);
    console.log('[AUTH] 同意状态已保存');
    return true;
  } catch (error) {
    console.error('[AUTH] 保存同意状态失败:', error);
    return false;
  }
}

/**
 * 获取同意数据
 * @returns {Object|null}
 */
export function getConsentData() {
  try {
    return uni.getStorageSync('user_consent');
  } catch (error) {
    console.error('[AUTH] 获取同意数据失败:', error);
    return null;
  }
}

/**
 * 撤回同意
 */
export function revokeConsent() {
  try {
    uni.removeStorageSync('user_consent');
    console.log('[AUTH] 同意已撤回');
    return true;
  } catch (error) {
    console.error('[AUTH] 撤回同意失败:', error);
    return false;
  }
}
```

**预计改动**: +50行

---

#### App.vue

**需要添加**:

```diff
 <script>
+import { hasConsent } from '@/utils/auth.js';
+
 export default {
   onLaunch() {
     console.log('App Launch');
+    
+    // 检查同意状态
+    this.checkConsentStatus();
   },
+  
+  methods: {
+    /**
+     * 检查同意状态
+     */
+    checkConsentStatus() {
+      const hasAgreed = hasConsent();
+      console.log('[APP] 同意状态:', hasAgreed);
+      
+      if (!hasAgreed) {
+        console.log('[APP] 未同意协议，跳转同意页');
+        // 延迟跳转，确保App已加载
+        setTimeout(() => {
+          uni.reLaunch({
+            url: '/pages/consent/consent'
+          });
+        }, 500);
+      }
+    }
+  },
   onShow() {
     console.log('App Show')
   },
   onHide() {
     console.log('App Hide')
   }
 }
 </script>
```

**预计改动**: +25行

---

## 七、Supabase表结构

### consent_records 表（新建）

```sql
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,              -- 用户ID（关联users.id）
  agreed BOOLEAN NOT NULL,            -- 是否同意
  version TEXT NOT NULL,              -- 协议版本
  agreed_at TIMESTAMP NOT NULL,       -- 同意时间
  revoked_at TIMESTAMP,               -- 撤回时间（NULL表示未撤回）
  ip_address TEXT,                    -- IP地址（可选）
  user_agent TEXT,                    -- User Agent（可选）
  platform TEXT,                      -- 平台：mp-weixin/h5/app
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_consent_user ON consent_records(user_id);
CREATE INDEX idx_consent_agreed_at ON consent_records(agreed_at);

-- 外键
ALTER TABLE consent_records
  ADD CONSTRAINT fk_consent_user
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;
```

**RLS策略**:
```sql
-- 用户只能查看自己的同意记录
CREATE POLICY "Users can view own consent records"
ON consent_records FOR SELECT
USING (auth.uid() = user_id);

-- 云函数可插入记录（使用service_role_key）
-- 无需额外策略
```

---

## 八、实施步骤详细拆解

### Step 1: 创建协议页面（4h）

#### 1.1 consent.vue - 同意管理主页（2h）

**页面结构**:
```vue
<template>
  <view class="consent-page">
    <!-- 品牌区 -->
    <view class="brand-section">
      <image src="/static/logo.png" class="logo" />
      <text class="app-name">翎心</text>
      <text class="subtitle">心理健康助手</text>
    </view>
    
    <!-- 欢迎文案 -->
    <view class="welcome-section">
      <text class="welcome-title">欢迎使用翎心</text>
      <text class="welcome-text">
        在开始使用之前，请仔细阅读以下协议。
        我们重视您的隐私和数据安全。
      </text>
    </view>
    
    <!-- 协议列表 -->
    <view class="agreements-section">
      <view class="agreement-item" @tap="showAgreement('privacy')">
        <text class="agreement-title">📄 隐私政策</text>
        <text class="agreement-desc">了解我们如何收集和使用您的信息</text>
        <text class="agreement-arrow">›</text>
      </view>
      
      <view class="agreement-item" @tap="showAgreement('user')">
        <text class="agreement-title">📋 用户协议</text>
        <text class="agreement-desc">使用本应用的服务条款</text>
        <text class="agreement-arrow">›</text>
      </view>
      
      <view class="agreement-item" @tap="showAgreement('disclaimer')">
        <text class="agreement-title">⚠️ 免责声明</text>
        <text class="agreement-desc">重要提示和责任说明</text>
        <text class="agreement-arrow">›</text>
      </view>
    </view>
    
    <!-- 同意checkbox -->
    <view class="consent-checkbox">
      <view class="checkbox" :class="{ checked: agreed }" @tap="toggleAgree">
        <text v-if="agreed" class="check-icon">✓</text>
      </view>
      <text class="checkbox-text">
        我已仔细阅读并同意以上全部协议
      </text>
    </view>
    
    <!-- 按钮区 -->
    <view class="buttons-section">
      <u-button 
        type="primary" 
        :disabled="!agreed"
        @click="handleAgree"
        :custom-style="buttonStyle"
      >
        同意并继续
      </u-button>
      
      <view class="decline-link" @tap="handleDecline">
        <text>不同意</text>
      </view>
    </view>
  </view>
</template>

<script>
import { saveConsent, hasConsent } from '@/utils/auth.js';
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { isAuthed } from '@/utils/auth.js';

export default {
  name: 'ConsentPage',
  
  data() {
    return {
      agreed: false,
      saving: false,
      
      buttonStyle: {
        height: '88rpx',
        borderRadius: '44rpx',
        fontSize: '32rpx'
      }
    };
  },
  
  onLoad(options) {
    console.log('[CONSENT] 页面加载, options:', options);
    
    // 如果已同意，直接跳转首页
    if (hasConsent()) {
      console.log('[CONSENT] 已同意，跳转首页');
      uni.reLaunch({ url: '/pages/home/home' });
      return;
    }
    
    // 如果是协议更新
    if (options.updated) {
      uni.showToast({
        title: '协议已更新，请重新阅读',
        icon: 'none',
        duration: 2000
      });
    }
  },
  
  methods: {
    // 切换同意状态
    toggleAgree() {
      this.agreed = !this.agreed;
    },
    
    // 查看协议
    showAgreement(type) {
      const urls = {
        privacy: '/pages/consent/privacy-policy',
        user: '/pages/consent/user-agreement',
        disclaimer: '/pages/consent/disclaimer'
      };
      
      uni.navigateTo({
        url: urls[type]
      });
    },
    
    // 同意并继续
    async handleAgree() {
      if (!this.agreed || this.saving) {
        return;
      }
      
      try {
        this.saving = true;
        
        // 保存同意状态（本地）
        const consentData = {
          agreed: true,
          agreedAt: Date.now(),
          version: '1.0.0',
          agreements: {
            userAgreement: true,
            privacyPolicy: true,
            disclaimer: true
          },
          synced: false
        };
        
        saveConsent(consentData);
        console.log('[CONSENT] 本地同意状态已保存');
        
        // 如果已登录，同步到云端
        if (isAuthed()) {
          try {
            const result = await callCloudFunction('consent-record', {
              agreed: true,
              version: '1.0.0',
              agreedAt: Date.now()
            }, {
              showLoading: false,
              timeout: 5000
            });
            
            if (result && result.recordId) {
              consentData.synced = true;
              consentData.recordId = result.recordId;
              saveConsent(consentData);
              console.log('[CONSENT] 已同步到云端, recordId:', result.recordId);
            }
          } catch (syncError) {
            console.warn('[CONSENT] 同步失败，稍后重试:', syncError);
            // 不阻塞，继续进入应用
          }
        }
        
        // 跳转首页
        uni.showToast({
          title: '感谢您的同意',
          icon: 'success',
          duration: 1500
        });
        
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/home/home' });
        }, 1500);
        
        this.saving = false;
        
      } catch (error) {
        console.error('[CONSENT] 处理同意失败:', error);
        this.saving = false;
        
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 不同意
    handleDecline() {
      uni.showModal({
        title: '游客模式',
        content: '未同意协议将以游客身份使用，部分功能将受到限制。确定继续吗？',
        confirmText: '以游客身份继续',
        cancelText: '重新考虑',
        success: (res) => {
          if (res.confirm) {
            // 标记为游客模式
            const guestData = {
              agreed: false,
              guestMode: true,
              timestamp: Date.now()
            };
            saveConsent(guestData);
            
            // 跳转首页（游客模式）
            uni.reLaunch({ url: '/pages/home/home?mode=guest' });
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.consent-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
}

.brand-section {
  text-align: center;
  margin-bottom: 80rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  margin-bottom: 32rpx;
}

.app-name {
  display: block;
  font-size: 56rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.welcome-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
}

.welcome-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.welcome-text {
  display: block;
  font-size: 28rpx;
  line-height: 1.6;
  color: #666;
}

.agreements-section {
  margin-bottom: 32rpx;
}

.agreement-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.agreement-item:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 1);
}

.agreement-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  flex: 1;
}

.agreement-desc {
  font-size: 24rpx;
  color: #999;
  flex: 1;
}

.agreement-arrow {
  font-size: 48rpx;
  color: #999;
  margin-left: 16rpx;
}

.consent-checkbox {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.5);
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.checkbox.checked {
  background: #FFFFFF;
  border-color: #FFFFFF;
}

.check-icon {
  font-size: 28rpx;
  color: #667eea;
  font-weight: 600;
}

.checkbox-text {
  flex: 1;
  font-size: 26rpx;
  color: #FFFFFF;
  line-height: 1.5;
}

.buttons-section {
  margin-top: auto;
}

.decline-link {
  text-align: center;
  padding: 32rpx;
}

.decline-link text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: underline;
}
</style>
```

**完整代码**: 约400行

---

#### 1.2 其他协议页面（2h）

**privacy-policy.vue / user-agreement.vue / disclaimer.vue** 结构类似：
- 导航栏（返回按钮）
- 标题
- 长文本内容（scroll-view）
- 底部"我已阅读"按钮（可选）

完整代码见PATCH.md

---

### Step 2: 开发云函数（1h）

见PATCH.md完整实现

---

### Step 3: 修改路由守卫（1h）

见上方route-guard.js修改

---

### Step 4: 测试验证（1h）

见TESTS.md

---

## 九、成功标准

### 功能标准

- [ ] 首次启动显示同意页
- [ ] 必须勾选才能点击同意
- [ ] 可查看3个协议详情
- [ ] 同意后可正常使用
- [ ] 同意状态持久化
- [ ] 已登录用户同意记录到云端
- [ ] 未同意禁止访问功能页面

### 合规标准

- [ ] 协议内容完整（隐私政策/用户协议/免责声明）
- [ ] 明确告知数据收集和使用
- [ ] 用户可自由选择（同意/游客模式）
- [ ] 协议易于理解（无过度专业术语）

---

**文档版本**: v1.0  
**创建日期**: 2025-10-12

