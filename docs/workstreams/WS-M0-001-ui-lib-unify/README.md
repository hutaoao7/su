# WS-M0-001: UI组件库统一

**工作流ID**: WS-M0-001  
**标题**: 解决UI组件库混用问题，统一到uView 2.x  
**分支**: `feat/WS-M0-001-ui-lib-unify`  
**阶段**: M0 基线对齐  
**状态**: ✅ 五件套已完成  
**预计工时**: 8h  
**实际工时**: ___h

---

## 快速导航

- [📋 PLAN.md](./PLAN.md) - 详细计划与依赖分析
- [🔧 PATCH.md](./PATCH.md) - 代码差异与变更说明
- [✅ TESTS.md](./TESTS.md) - 测试用例与验证脚本
- [📝 SELF-REVIEW.md](./SELF-REVIEW.md) - 自检清单（9项硬约束）
- [⏮️ ROLLBACK.md](./ROLLBACK.md) - 回滚方案（3种场景）

---

## 工作流概述

### 目标

解决项目中 UI 组件库混用问题，统一到 uView 2.x，确保组件渲染正常。

### 背景问题

从 phase0-reuse-mapping.md 发现：
- ❌ 代码中使用 uView 组件（u-popup, u-icon, u-input）
- ❌ 但 uni_modules 仅安装了 uni-ui
- ❌ 运行时组件无法渲染

### 解决方案

1. ✅ 安装 uView 2.x (^2.0.36)
2. ✅ 配置 easycom 自动引入
3. ✅ 验证 4 个文件组件可用
4. ✅ 开发 UI 一致性检查脚本
5. ✅ 配置 ESLint 规则强制 uView
6. ✅ 编写组件使用指南

---

## 影响范围

### 修改文件（10个）

#### 配置文件（5个）
- `package.json` - 添加 uview-ui 依赖
- `main.js` - 引入并注册 uView
- `pages.json` - 配置 easycom
- `uni.scss` - 引入 uView 主题变量
- `App.vue` - 引入 uView 全局样式

#### 业务文件（0个）
- 无需修改（安装后组件自动可用）

#### 新建文件（4个）
- `tools/check-ui-consistency.js` - UI 一致性检查脚本
- `.eslintrc.js` - ESLint 配置
- `.prettierrc.js` - Prettier 配置
- `docs/ui-component-guide.md` - UI 组件使用指南

#### 验证文件（4个）
- `pages/user/home.vue` - 验证 u-popup, u-switch
- `pages/features/features.vue` - 验证 u-icon
- `components/scale/ScaleRunner.vue` - 验证 u-input
- `pages/cdk/redeem.vue` - 验证 u-input

---

## 依赖关系

### 前置依赖
- **无** (M0 首个任务)

### 后置依赖
- WS-M0-002: 开发环境配置（使用本工作流的 ESLint 规则）
- WS-M1-W1-001: 微信登录验证（依赖 UI 组件正常）
- WS-M1-W1-004: 通用组件库（依赖 uView）
- WS-M1-W2-001: 量表执行器（ScaleRunner 依赖 uView）

---

## 风险提示

### 已识别风险

| 风险项 | 可能性 | 影响度 | 缓解措施 | 应急预案 | 状态 |
|--------|--------|--------|----------|----------|------|
| **uView 与 uni-app 版本不兼容** | 低 | 高 | 1. 查阅官方兼容性文档<br>2. 使用推荐版本 ^2.0.36 | 回滚到 uni-ui（方案A） | ⬜ 待验证 |
| **组件替换后样式错位** | 中 | 中 | 1. 逐个页面测试<br>2. 保留原样式代码作为参考 | 仅回滚有问题页面（方案B） | ⬜ 待验证 |
| **构建后包体积增大** | 中 | 低 | 1. 配置按需引入<br>2. 分包策略优化 | 降级方案（方案C） | ⬜ 待验证 |
| **HBuilderX 插件市场安装失败** | 低 | 中 | 1. 优先使用 npm 安装<br>2. 手动下载源码 | npm install 或本地安装 | ⬜ 待验证 |
| **uView 图标库不包含所需图标** | 中 | 低 | 1. 查阅 uView 图标库<br>2. 映射到相似图标<br>3. 使用自定义图标 | 替换图标名称或使用图片 | ⬜ 待验证 |
| **性能下降（首屏加载变慢）** | 低 | 中 | 1. 按需引入组件<br>2. 懒加载优化<br>3. 分包策略 | 性能优化（方案C）或回滚 | ⬜ 待验证 |
| **团队成员不熟悉 uView** | 中 | 低 | 1. 编写详细文档<br>2. 团队培训<br>3. Code Review | 文档引导 + 逐步熟悉 | ⬜ 待验证 |
| **第三方库依赖 uni-ui** | 低 | 中 | 1. 检查第三方库依赖<br>2. 允许必要的 uni-ui 共存 | 白名单配置 | ⬜ 待验证 |

### 风险监控

**检查频率**: 每日构建时自动检查

**检查命令**:
```bash
# UI 一致性检查
node tools/check-ui-consistency.js

# 包体积检查
npm run build:mp-weixin && du -sk unpackage/dist/build/mp-weixin/

# 性能检查（开发环境）
npm run dev:mp-weixin
# 手动测试首屏加载时间
```

**报告提交**: 发现问题立即上报 Tech Lead

---

## 实施步骤摘要

### Step 1: 安装 uView (1h)
```bash
npm install uview-ui@2.0.36
```

### Step 2: 配置 uView (1h)
- 修改 main.js
- 修改 pages.json
- 修改 uni.scss
- 修改 App.vue

### Step 3: 验证组件 (2h)
- pages/user/home.vue
- pages/features/features.vue
- components/scale/ScaleRunner.vue
- pages/cdk/redeem.vue

### Step 4: 开发检查脚本 (2h)
- tools/check-ui-consistency.js

### Step 5: 配置 ESLint (1h)
- .eslintrc.js

### Step 6: 编写文档 (1h)
- docs/ui-component-guide.md

---

## 验证标准

### 功能验证

- [ ] uView 正确安装（package.json 中存在）
- [ ] 4 个页面组件可正常渲染
- [ ] u-popup 可打开/关闭
- [ ] u-switch 可切换状态
- [ ] u-icon 可正常显示
- [ ] u-input 可正常输入

### 质量验证

- [ ] 构建 0 报错
- [ ] ESLint 0 errors
- [ ] 检查脚本通过
- [ ] 包体积 < 2MB
- [ ] 首屏加载 < 2s

### 文档验证

- [ ] 五件套文档完整
- [ ] UI 组件使用指南清晰
- [ ] 代码注释完整

---

## 测试用例摘要

### 自动化测试

| 测试脚本 | 检查项 | 预期结果 |
|---------|--------|----------|
| check-ui-consistency.js | uView 已安装 | ✅ ^2.0.36 |
| check-ui-consistency.js | 无 uni-ui 混用 | ✅ 无混用 |
| check-engines.js | Node 版本 | ✅ v16.x.x |
| npm run build | 构建成功 | ✅ 无 error |

### 手动测试

| 页面/组件 | 测试项 | 预期结果 |
|----------|--------|----------|
| pages/user/home.vue | u-popup 打开 | 弹窗正常显示 |
| pages/user/home.vue | u-switch 切换 | 状态正常改变 |
| pages/features/features.vue | u-icon 显示 | 图标正常显示 |
| components/scale/ScaleRunner.vue | u-input 输入 | 可正常输入 |
| pages/cdk/redeem.vue | CDK 输入 | 可正常输入 |

### 兼容性测试

| 平台 | 测试结果 | 备注 |
|------|----------|------|
| 微信小程序 | ⬜ 待测 | 主要平台 |
| H5 | ⬜ 待测 | - |
| APP | ⬜ 待测 | 可选 |

---

## 回滚方案摘要

### 方案 A: 完全回滚（推荐）

**适用场景**: uView 安装失败或严重不兼容

**步骤**:
1. 卸载 uView
2. 恢复配置文件
3. 替换 4 个页面组件为 uni-ui

**预计时间**: 2-3h

---

### 方案 B: 部分回滚

**适用场景**: 仅个别页面有问题

**步骤**:
1. 保留 uView
2. 仅回滚有问题页面
3. 临时允许混用

**预计时间**: 30min-1h

---

### 方案 C: 降级方案

**适用场景**: 仅性能或包体积问题

**步骤**:
1. 配置按需引入
2. 调整分包策略
3. 移除未使用组件

**预计时间**: 1-2h

---

## 成功标准

### 必达目标（P0）

- [x] uView 2.x 正确安装并配置
- [ ] 4 个文件组件可正常使用
- [ ] 检查脚本可自动检测混用
- [ ] ESLint 规则强制 uView
- [ ] 文档完整清晰

### 质量目标（P1）

- [ ] 构建 0 报错
- [ ] ESLint 0 errors
- [ ] 所有测试通过
- [ ] 包体积增长 < 500KB
- [ ] 性能无明显下降

### 可选目标（P2）

- [ ] 团队培训完成
- [ ] 最佳实践总结
- [ ] 性能对比报告

---

## 交付清单

### 代码交付

- [ ] package.json 更新
- [ ] main.js 更新
- [ ] pages.json 更新
- [ ] uni.scss 更新
- [ ] App.vue 更新
- [ ] tools/check-ui-consistency.js
- [ ] .eslintrc.js
- [ ] .prettierrc.js

### 文档交付

- [x] PLAN.md
- [x] PATCH.md
- [x] TESTS.md
- [x] SELF-REVIEW.md
- [x] ROLLBACK.md
- [x] README.md（本文档）
- [ ] docs/ui-component-guide.md

### 测试交付

- [ ] 自动化检查脚本
- [ ] 测试报告
- [ ] 兼容性报告

---

## 后续任务

完成本工作流后，立即启动：

1. **WS-M0-002**: 开发环境配置（可并行）
   - 使用本工作流的 ESLint 规则
   - 添加更多检查脚本

2. **WS-M0-003**: 环境变量管理（可并行）
   - 迁移硬编码密钥

3. **WS-M1-W1-001**: 微信登录验证（依赖本工作流）
   - UI 组件必须可用

---

## 时间线

| 时间点 | 事件 | 状态 |
|--------|------|------|
| 2025-10-12 | 创建五件套文档 | ✅ 已完成 |
| 待定 | 开始实施 | ⬜ 待开始 |
| 待定 | 完成开发 | ⬜ 待完成 |
| 待定 | 测试验证 | ⬜ 待测试 |
| 待定 | Code Review | ⬜ 待审核 |
| 待定 | 合并到 main | ⬜ 待合并 |

---

## 联系人

| 角色 | 姓名 | 职责 |
|------|------|------|
| 负责人 | ___ | 开发与测试 |
| Code Review | ___ | 代码审核 |
| Tech Lead | ___ | 技术决策 |

---

## 问题与决策记录

### Q1: 为什么选择 uView 而不是 uni-ui？

**A**: 
1. 代码中已使用 uView 组件
2. uView 组件更丰富，样式更美观
3. 文档更完善，社区更活跃

**决策人**: Tech Lead  
**日期**: 2025-10-12

---

### Q2: 是否需要支持 uni-ui 和 uView 共存？

**A**: 
- **短期**: 不允许混用（本工作流目标）
- **长期**: 如有第三方库依赖，可白名单允许

**决策人**: Tech Lead  
**日期**: 2025-10-12

---

## 参考资料

- [uView 官方文档](https://www.uviewui.com/)
- [uni-app 组件规范](https://uniapp.dcloud.net.cn/component/)
- [phase0-reuse-mapping.md](../../phase0-reuse-mapping.md)
- [phase1-wbs-workstreams.md](../../phase1-wbs-workstreams.md)

---

**文档版本**: v1.0  
**创建日期**: 2025-10-12  
**最后更新**: 2025-10-12  
**维护人**: AI Assistant

