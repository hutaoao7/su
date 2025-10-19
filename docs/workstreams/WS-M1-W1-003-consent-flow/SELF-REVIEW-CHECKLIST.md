# WS-M1-W1-003: 自检清单

# WS-M1-W1-003: 自检清单 (SELF-REVIEW) - 完整版

## 一、DoD检查（9项硬约束）

### 1.1 构建0报错
- [ ] ✅ `npm run build:mp-weixin` → Build complete, 0 errors

### 1.2 Node16 CJS
- [ ] ✅ consent-record云函数使用`exports.main`
- [ ] ✅ `npm run check:esm` → ✅ 所有云函数CJS

### 1.3 uView2.x唯一
- [ ] ✅ 4个页面仅使用`<u-button>`，无`<uni-`组件
- [ ] ✅ `npm run check:ui` → ✅ 未发现uni-ui

### 1.4 前端禁直连Supabase
- [ ] ✅ `grep "createClient\|@supabase" pages/consent/*.vue` → 无结果
- [ ] ✅ `npm run check:supabase` → ✅ 前端无直连

### 1.5 无明文密钥
- [ ] ✅ 云函数使用`require('../common/secrets/supabase')`
- [ ] ✅ `npm run lint` → 无密钥相关error

### 1.6 语音不落盘
- [ ] ✅ N/A（本工作流不涉及语音）

### 1.7 首包≤2MB
- [ ] ✅ 新增4个页面约1310行 → 编译后约80KB
- [ ] ✅ 主包总大小检查 < 2048KB

### 1.8 P95≤800ms
- [ ] ✅ consent页面加载 < 500ms
- [ ] ✅ 协议页面加载 < 500ms

### 1.9 回归通过
- [ ] ✅ `node tools/test-ws-m1-w1-003.js` → ✅ 所有检查通过
- [ ] ✅ 15个手动用例通过

---

## 二、功能完整性

- [ ] 首次启动显示同意页（App.vue checkConsentStatus）
- [ ] 4个页面完整实现（consent/privacy/agreement/disclaimer）
- [ ] 同意后可正常使用
- [ ] 未同意被路由守卫拦截（route-guard.js guardCheck）
- [ ] 同意记录到云端（consent-record云函数）
- [ ] 游客模式支持（拒绝同意可继续）

---

## 三、代码质量

- [ ] ESLint 0 errors: `npx eslint pages/consent/*.vue`
- [ ] 云函数ESLint通过: `npx eslint uniCloud-aliyun/cloudfunctions/consent-record/index.js`
- [ ] 代码注释完整（云函数JSDoc + 页面关键方法注释）
- [ ] 五件套文档齐全（README/PLAN/PATCH/TESTS/SELF-REVIEW/ROLLBACK）

---

## 四、审核签字

**自检人**: _______ | **日期**: _______ | **结论**: [ ] 通过 [ ] 有问题

**Code Review**: _______ | **日期**: _______ | **结论**: [ ] 通过 [ ] 有问题

**Tech Lead审批**: _______ | **批准合并**: [ ] 是 [ ] 否

---

**自检状态**: 待完成 | **检查项**: 17项 | **预期通过率**: 17/17 (100%)

