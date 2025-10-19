# 阶段 1：WBS 工作流规划

**基线文档**: CraneHeart开发周期计划-用户端.md  
**复用基础**: docs/phase0-reuse-mapping.md  
**规划日期**: 2025-10-12

---

## 一、总体架构

### 1.1 工作流编号规则

```
WS-<Phase>-<Week>-<Sequence>-<slug>
例：WS-M1-W1-001-ui-lib-unify
```

### 1.2 分支命名规则

```
feat/WS-<ID>-<slug>
例：feat/WS-M1-W1-001-ui-lib-unify
```

### 1.3 交付五件套标准

每个工作流必须包含：

1. **Plan** (计划文档)
   - 输入/输出明细
   - 依赖关系图
   - 风控检查点
   - 文件清单（精确到路径）
   - 复用策略（复用/小改/重构）

2. **Patch** (代码差异)
   - 所有文件变更
   - 遵循工程硬约束
   - 代码注释清晰

3. **Tests/Checks** (测试验证)
   - 最小可运行用例
   - 自动化检查脚本
   - 构建验证命令

4. **Self-Review** (自检清单)
   - 9项必查项逐条勾选
   - 回归脚本通过证明

5. **Rollback** (回滚方案)
   - 涉及文件列表
   - 回滚步骤说明
   - 数据回退策略（如有）

---

## 二、M0 基线对齐阶段（10.20-10.24）

### WS-M0-001：UI组件库统一决策与实施

**ID**: WS-M0-001  
**标题**: 解决UI组件库混用问题，统一到uView 2.x  
**目标**: 确保所有组件使用一致的UI库，避免运行时组件渲染失败  
**依赖**: 无  
**分支**: `feat/WS-M0-001-ui-lib-unify`

#### 触点文件
```
package.json
pages/user/home.vue
pages/features/features.vue
components/scale/ScaleRunner.vue
pages/cdk/redeem.vue
uni_modules/ (可能需要清理)
```

#### 预计产出
- uView 2.x 安装完成
- 4个文件组件引用修复
- ESLint规则配置（强制uView）
- 验证脚本 tools/check-ui-consistency.js

#### 工时估算
- 环境配置: 2h
- 文件修改: 4h
- 测试验证: 2h
- **总计: 8h**

---

### WS-M0-002：开发环境配置与规范制定

**ID**: WS-M0-002  
**标题**: 完成开发环境搭建、代码规范配置  
**目标**: 建立统一的开发环境和代码风格  
**依赖**: 无  
**分支**: `feat/WS-M0-002-dev-env-setup`

#### 触点文件
```
.eslintrc.js (新建)
.prettierrc.js (新建)
.editorconfig (新建)
tools/check-engines.js (新建)
tools/check-ui-consistency.js (新建)
tools/check-supabase-direct.js (新建)
README-DEV.md (新建)
```

#### 预计产出
- ESLint配置（禁止前端直连Supabase、强制uView）
- Prettier代码格式化规则
- Node 16 LTS检查脚本
- 开发指南文档

#### 工时估算
- 配置编写: 4h
- 脚本开发: 4h
- 文档编写: 2h
- **总计: 10h**

---

### WS-M0-003：环境变量与密钥管理

**ID**: WS-M0-003  
**标题**: 迁移硬编码密钥到配置中心  
**目标**: 移除代码中的明文API Key，使用环境变量  
**依赖**: 无  
**分支**: `feat/WS-M0-003-env-secrets`

#### 触点文件
```
uniCloud-aliyun/cloudfunctions/stress-chat/index.js
uniCloud-aliyun/cloudfunctions/common/secrets/supabase.js
.env.example (新建)
docs/deployment-guide.md (新建)
```

#### 预计产出
- OpenAI API Key移到环境变量
- Supabase密钥确认使用环境变量
- .env.example模板文件
- 部署指南文档

#### 工时估算
- 代码修改: 2h
- 文档编写: 2h
- **总计: 4h**

---

## 三、M1-Week1 基础模块（10.27-10.31）

### WS-M1-W1-001：微信登录流程验证与优化

**ID**: WS-M1-W1-001  
**标题**: 验证现有微信登录，补充错误处理和用户提示  
**目标**: 确保登录流程健壮，符合M1交付标准  
**依赖**: WS-M0-001（UI组件统一）  
**分支**: `feat/WS-M1-W1-001-wechat-login-enhance`

#### 触点文件
```
pages/login/login.vue (小改)
utils/wechat-login.js (小改)
utils/auth.js (复用)
uniCloud-aliyun/cloudfunctions/auth-login/index.js (复用)
```

#### 预计产出
- 登录异常情况处理（网络失败、code过期）
- 用户友好的错误提示
- Token过期自动刷新
- 登录状态持久化验证

#### 工时估算: **8h**

---

### WS-M1-W1-002：用户信息页面完善

**ID**: WS-M1-W1-002  
**标题**: 完善个人中心和个人资料页  
**目标**: 实现用户信息展示、编辑功能  
**依赖**: WS-M1-W1-001（登录完成）  
**分支**: `feat/WS-M1-W1-002-user-profile`

#### 触点文件
```
pages/user/home.vue (小改 - UI统一)
pages/user/profile.vue (复用)
uniCloud-aliyun/cloudfunctions/auth-me/index.js (复用)
utils/unicloud-handler.js (复用)
```

#### 预计产出
- 用户头像、昵称显示
- 个人资料编辑功能
- 数据同步到Supabase
- 退出登录功能

#### 工时估算: **4h**

---

### WS-M1-W1-003：同意管理流程实现

**ID**: WS-M1-W1-003  
**标题**: 实现隐私政策同意、用户协议展示  
**目标**: 符合合规要求，首次使用必须同意  
**依赖**: WS-M1-W1-001  
**分支**: `feat/WS-M1-W1-003-consent-flow`

#### 触点文件
```
pages/consent/ (新建目录)
  ├── consent.vue (新建)
  ├── privacy-policy.vue (新建)
  └── user-agreement.vue (新建)
static/copy/disclaimer.md (复用)
utils/route-guard.js (小改)
uniCloud-aliyun/cloudfunctions/common/db/index.js (复用)
```

#### 预计产出
- 首次启动同意弹窗
- 隐私政策完整展示
- 同意状态持久化
- 撤回同意功能入口（M2完善）

#### 工时估算: **8h**

---

### WS-M1-W1-004：通用UI组件库搭建

**ID**: WS-M1-W1-004  
**标题**: 完善通用组件，建立组件使用规范  
**目标**: 提供统一的UI组件供业务使用  
**依赖**: WS-M0-001（UI库统一）  
**分支**: `feat/WS-M1-W1-004-common-components`

#### 触点文件
```
components/common/ErrorBoundary.vue (复用)
components/common/LoadingState.vue (复用)
components/common/NavBar.vue (复用)
components/common/TabBar.vue (复用)
components/common/EmptyState.vue (新建)
components/common/ConfirmDialog.vue (新建)
docs/components-guide.md (新建)
```

#### 预计产出
- 空状态组件
- 确认对话框组件
- 组件使用文档
- Storybook示例（可选）

#### 工时估算: **16h**

---

### WS-M1-W1-005：请求封装与错误处理

**ID**: WS-M1-W1-005  
**标题**: 统一请求通道为uniCloud，完善错误处理  
**目标**: 确保所有请求走云函数，避免前端直连  
**依赖**: 无  
**分支**: `feat/WS-M1-W1-005-request-unify`

#### 触点文件
```
utils/unicloud-handler.js (复用)
utils/api-handler.js (复用)
utils/http.js (小改 - 降级为备用)
utils/request.js (小改 - 标记为deprecated)
api/user.js (小改)
api/stress.js (小改)
api/community.js (小改)
```

#### 预计产出
- 明确unicloud-handler为主通道
- http.js仅用于第三方服务
- 全局错误拦截器
- 网络异常重试机制

#### 工时估算: **8h**

---

### WS-M1-W1-006：路由守卫与导航管理

**ID**: WS-M1-W1-006  
**标题**: 完善路由守卫，实现权限控制  
**目标**: 保护需要登录的页面，优化页面跳转  
**依赖**: WS-M1-W1-001（登录完成）  
**分支**: `feat/WS-M1-W1-006-route-guard`

#### 触点文件
```
utils/route-guard.js (复用)
utils/router.js (复用)
utils/auth.js (复用)
common/nav.js (复用)
App.vue (小改)
```

#### 预计产出
- 登录状态检查
- 未登录自动跳转登录页
- 登录后返回原页面
- 页面跳转拦截日志

#### 工时估算: **4h**

---

## 四、M1-Week2 评估功能（11.03-11.07）

### WS-M1-W2-001：量表执行器组件完善

**ID**: WS-M1-W2-001  
**标题**: 完善ScaleRunner组件，支持所有题型  
**目标**: 提供稳定的量表执行核心组件  
**依赖**: WS-M0-001（UI统一）  
**分支**: `feat/WS-M1-W2-001-scale-runner`

#### 触点文件
```
components/scale/ScaleRunner.vue (小改 - UI统一)
utils/scoring.js (复用)
static/scales/*.json (复用 - 14个文件)
```

#### 预计产出
- 支持select、time、number等题型
- 进度保存与恢复
- 答题导航（上一题/下一题）
- 答题数据本地缓存

#### 工时估算: **8h**

---

### WS-M1-W2-002：评估页面集成与测试

**ID**: WS-M1-W2-002  
**标题**: 集成4个评估页面，验证量表流程  
**目标**: 确保所有评估页面正常工作  
**依赖**: WS-M1-W2-001  
**分支**: `feat/WS-M1-W2-002-assess-pages`

#### 触点文件
```
pages/assess/academic/index.vue (复用)
pages/assess/social/index.vue (复用)
pages/assess/sleep/index.vue (复用)
pages/assess/stress/index.vue (复用)
pages/features/features.vue (小改 - 导航入口)
```

#### 预计产出
- 4个评估页面可正常答题
- 提交后正确跳转结果页
- 结果数据正确保存
- 历史记录查询

#### 工时估算: **8h**

---

### WS-M1-W2-003：评分逻辑验证与优化

**ID**: WS-M1-W2-003  
**标题**: 验证14个量表评分逻辑正确性  
**目标**: 确保评分算法符合心理学标准  
**依赖**: WS-M1-W2-001  
**分支**: `feat/WS-M1-W2-003-scoring-validate`

#### 触点文件
```
utils/scoring.js (复用)
static/scales/*.json (复用)
tests/scoring.test.js (新建)
docs/scales-scoring-guide.md (新建)
```

#### 预计产出
- 单元测试覆盖所有量表
- 边界值测试（最高分/最低分）
- 评分文档说明
- 评分错误日志记录

#### 工时估算: **4h**

---

### WS-M1-W2-004：结果展示页面实现

**ID**: WS-M1-W2-004  
**标题**: 实现评估结果页面，包含图表和建议  
**目标**: 可视化展示评估结果  
**依赖**: WS-M1-W2-002  
**分支**: `feat/WS-M1-W2-004-result-display`

#### 触点文件
```
pages/assess/result.vue (新建)
components/charts/ScoreChart.vue (新建)
components/results/SuggestionCard.vue (新建)
utils/chart-helper.js (新建)
```

#### 预计产出
- 分数雷达图/柱状图
- 等级标签（轻度/中度/重度）
- 个性化建议文案
- 分享结果功能（可选）

#### 工时估算: **8h**

---

### WS-M1-W2-005：历史记录与数据持久化

**ID**: WS-M1-W2-005  
**标题**: 实现评估历史记录查询与管理  
**目标**: 用户可查看过往评估结果  
**依赖**: WS-M1-W2-002  
**分支**: `feat/WS-M1-W2-005-history-records`

#### 触点文件
```
pages/stress/history.vue (复用)
uniCloud-aliyun/cloudfunctions/common/db/index.js (复用)
api/stress.js (小改)
utils/unicloud-handler.js (复用)
```

#### 预计产出
- 历史记录列表展示
- 按时间倒序排列
- 点击查看详情
- 数据分页加载

#### 工时估算: **4h**

---

## 五、M1-Week3 AI干预与CDK（11.10-11.14）

### WS-M1-W3-001：AI网关统一适配层

**ID**: WS-M1-W3-001  
**标题**: 构建AI调用网关，支持限流、降级、内容安全  
**目标**: 统一AI服务调用接口，增强稳定性  
**依赖**: WS-M0-003（环境变量）  
**分支**: `feat/WS-M1-W3-001-ai-gateway`

#### 触点文件
```
uniCloud-aliyun/cloudfunctions/common/ai-gateway/ (新建目录)
  ├── index.js (新建)
  ├── openai-adapter.js (新建)
  ├── content-safety.js (新建)
  ├── rate-limiter.js (新建)
  └── fallback-templates.js (新建)
uniCloud-aliyun/cloudfunctions/stress-chat/index.js (重构)
```

#### 预计产出
- OpenAI适配器（支持GPT-3.5/GPT-4）
- 请求限流（按用户ID）
- 指数退避重试
- 内容安全检测
- 降级本地模板（5条+）

#### 工时估算: **12h**

---

### WS-M1-W3-002：AI对话界面优化

**ID**: WS-M1-W3-002  
**标题**: 完善AI对话UI，支持流式输出和消息历史  
**目标**: 提供流畅的对话体验  
**依赖**: WS-M1-W3-001  
**分支**: `feat/WS-M1-W3-002-chat-ui`

#### 触点文件
```
pages/intervene/chat.vue (复用)
components/chat/MessageList.vue (新建)
components/chat/InputBox.vue (新建)
components/chat/TypingIndicator.vue (新建)
utils/event-bus.js (复用)
```

#### 预计产出
- 消息气泡样式
- 打字动画效果
- 消息历史记录
- 重新生成回复功能

#### 工时估算: **8h**

---

### WS-M1-W3-003：危机干预处理流程

**ID**: WS-M1-W3-003  
**标题**: 实现紧急求助入口和资源展示  
**目标**: 识别危机情况，提供即时帮助  
**依赖**: WS-M1-W3-001  
**分支**: `feat/WS-M1-W3-003-crisis-intervention`

#### 触点文件
```
pages/intervene/crisis.vue (新建)
components/crisis/HotlineCard.vue (新建)
utils/crisis-detector.js (新建)
static/crisis-resources.json (新建)
```

#### 预计产出
- 危机关键词检测
- 自动弹出紧急求助
- 心理热线展示
- 紧急联系人功能

#### 工时估算: **4h**

---

### WS-M1-W3-004：CDK兑换功能完善

**ID**: WS-M1-W3-004  
**标题**: 完善CDK兑换页面和云函数  
**目标**: 用户可通过CDK兑换服务  
**依赖**: WS-M1-W1-001（登录）  
**分支**: `feat/WS-M1-W3-004-cdk-redeem`

#### 触点文件
```
pages/cdk/redeem.vue (小改 - UI统一)
uniCloud-aliyun/cloudfunctions/cdk-redeem/index.js (复用)
uniCloud-aliyun/cloudfunctions/cdk-verify/index.js (复用)
components/CdkModule.vue (复用)
```

#### 预计产出
- CDK输入验证
- 实时校验CDK有效性
- 兑换成功提示
- 兑换记录查询

#### 工时估算: **4h**

---

### WS-M1-W3-005：冥想与音疗内容接入

**ID**: WS-M1-W3-005  
**标题**: 接入冥想练习和自然音疗内容  
**目标**: 提供多样化干预方式  
**依赖**: 无  
**分支**: `feat/WS-M1-W3-005-meditation-content`

#### 触点文件
```
pages/intervene/meditation.vue (复用)
pages/intervene/nature.vue (复用)
pages/music/index.vue (复用)
pages/music/player.vue (复用)
static/music/tracks.json (复用)
utils/audio.js (复用)
```

#### 预计产出
- 冥想引导音频播放
- 自然音效播放
- 播放进度控制
- 收藏功能

#### 工时估算: **4h**

---

## 六、M1-Week4 集成测试（11.17-11.21）

### WS-M1-W4-001：端到端功能测试

**ID**: WS-M1-W4-001  
**标题**: 全流程测试，验证MVP功能完整性  
**目标**: 确保所有核心功能可用  
**依赖**: WS-M1-W3-* 全部完成  
**分支**: `test/WS-M1-W4-001-e2e-test`

#### 测试范围
```
1. 登录注册流程
2. 4个评估完整流程（答题→结果→保存）
3. AI对话交互
4. CDK兑换流程
5. 冥想/音疗播放
6. 历史记录查询
7. 个人中心功能
```

#### 预计产出
- 测试用例文档（50+ cases）
- Bug清单（按优先级分类）
- 自动化测试脚本（Cypress）
- 测试报告

#### 工时估算: **16h**

---

### WS-M1-W4-002：性能优化与首屏加载

**ID**: WS-M1-W4-002  
**标题**: 优化首屏加载时间，实现懒加载  
**目标**: 首屏加载 <2s  
**依赖**: WS-M1-W4-001  
**分支**: `feat/WS-M1-W4-002-performance`

#### 触点文件
```
main.js (小改)
pages.json (配置优化)
utils/render-optimization.js (复用)
utils/resource-handler.js (复用)
components/** (按需加载)
```

#### 预计产出
- 分包配置（主包<2MB）
- 图片懒加载
- 组件异步加载
- 性能测试报告

#### 工时估算: **8h**

---

### WS-M1-W4-003：接口联调与Mock数据清理

**ID**: WS-M1-W4-003  
**标题**: 完成前后端联调，移除Mock数据  
**目标**: 所有接口真实调用  
**依赖**: WS-M1-W4-001  
**分支**: `feat/WS-M1-W4-003-api-integration`

#### 触点文件
```
所有pages/**/*.vue
所有api/*.js
uniCloud-aliyun/cloudfunctions/** (联调测试)
```

#### 预计产出
- 接口联调清单（逐个验证）
- Mock数据清理
- 错误码统一
- 联调问题修复

#### 工时估算: **8h**

---

### WS-M1-W4-004：Bug修复与代码优化

**ID**: WS-M1-W4-004  
**标题**: 修复测试发现的所有P0/P1 Bug  
**目标**: P0/P1清零，P2尽量修复  
**依赖**: WS-M1-W4-001（测试完成）  
**分支**: `fix/WS-M1-W4-004-bug-fixes`

#### 预计产出
- Bug修复清单（按优先级）
- 回归测试验证
- 代码质量报告
- 已知问题文档

#### 工时估算: **16h**

---

## 七、M2 合规与安全（11.24-12.12）

### WS-M2-W5-001：本地存储加密实现

**ID**: WS-M2-W5-001  
**标题**: 敏感数据本地加密存储  
**目标**: Token、用户信息加密保存  
**依赖**: 无  
**分支**: `feat/WS-M2-W5-001-local-encryption`

#### 触点文件
```
utils/storage-crypto.js (新建)
utils/auth.js (小改)
utils/wechat-login.js (小改)
pages/user/home.vue (小改)
```

#### 预计产出
- AES加密工具函数
- Token加密存储
- 用户信息加密
- 安全测试报告

#### 工时估算: **8h**

---

### WS-M2-W6-001：数据导出功能实现

**ID**: WS-M2-W6-001  
**标题**: 用户数据导出，符合GDPR要求  
**目标**: 用户可导出个人数据  
**依赖**: 无  
**分支**: `feat/WS-M2-W6-001-data-export`

#### 触点文件
```
pages/settings/data-export.vue (新建)
uniCloud-aliyun/cloudfunctions/user-data-export/index.js (新建)
utils/file-export.js (新建)
```

#### 预计产出
- 数据导出页面
- JSON/CSV格式导出
- 导出历史记录
- 导出数据加密

#### 工时估算: **8h**

---

### WS-M2-W6-002：撤回同意功能

**ID**: WS-M2-W6-002  
**标题**: 用户可撤回隐私同意，停止数据处理  
**目标**: 符合隐私保护法规  
**依赖**: WS-M1-W1-003（同意管理）  
**分支**: `feat/WS-M2-W6-002-consent-revoke`

#### 触点文件
```
pages/consent/revoke.vue (新建)
pages/settings/settings.vue (小改)
uniCloud-aliyun/cloudfunctions/consent-revoke/index.js (新建)
```

#### 预计产出
- 撤回同意页面
- 撤回确认流程
- 数据处理停止
- 撤回记录日志

#### 工时估算: **8h**

---

### WS-M2-W7-001：离线功能支持

**ID**: WS-M2-W7-001  
**标题**: 实现关键功能离线可用  
**目标**: 网络异常时仍可答题和查看历史  
**依赖**: 无  
**分支**: `feat/WS-M2-W7-001-offline-support`

#### 触点文件
```
utils/cache-manager.js (新建)
utils/offline-detector.js (新建)
pages/assess/**/*.vue (小改)
service-worker.js (新建 - H5)
```

#### 预计产出
- 量表数据离线缓存
- 答题结果本地缓存
- 网络恢复自动同步
- 离线提示UI

#### 工时估算: **12h**

---

### WS-M2-W7-002：全局异常捕获与上报

**ID**: WS-M2-W7-002  
**标题**: 实现全局错误捕获和上报机制  
**目标**: 及时发现和定位线上问题  
**依赖**: 无  
**分支**: `feat/WS-M2-W7-002-error-tracking`

#### 触点文件
```
App.vue (小改)
utils/error-tracker.js (新建)
utils/logger.js (新建)
uniCloud-aliyun/cloudfunctions/error-report/index.js (新建)
```

#### 预计产出
- Vue errorHandler配置
- Promise unhandledRejection捕获
- 错误堆栈收集
- 错误上报云函数

#### 工时估算: **8h**

---

## 八、M3 运维与看板（12.15-01.09）

### WS-M3-W8-001：埋点系统接入

**ID**: WS-M3-W8-001  
**标题**: 接入事件埋点，采集用户行为数据  
**目标**: 为数据分析提供基础  
**依赖**: 无  
**分支**: `feat/WS-M3-W8-001-analytics`

#### 触点文件
```
utils/analytics.js (新建)
utils/event-bus.js (复用)
uniCloud-aliyun/cloudfunctions/events-track/index.js (复用)
所有pages/**/*.vue (埋点接入)
```

#### 预计产出
- 页面访问埋点
- 按钮点击埋点
- 评估完成埋点
- AI对话埋点
- 埋点文档

#### 工时估算: **12h**

---

### WS-M3-W11-001：前端打包优化

**ID**: WS-M3-W11-001  
**标题**: 优化构建配置，减小包体积  
**目标**: 主包 <2MB，总包 <5MB  
**依赖**: 无  
**分支**: `feat/WS-M3-W11-001-build-optimize`

#### 触点文件
```
manifest.json (优化配置)
pages.json (分包配置)
vue.config.js (新建)
.gitignore (更新)
```

#### 预计产出
- Tree-shaking配置
- 代码压缩优化
- 图片压缩
- 分包策略优化

#### 工时估算: **8h**

---

### WS-M3-W11-002：用户体验细节优化

**ID**: WS-M3-W11-002  
**标题**: 优化交互细节，提升用户体验  
**目标**: 流畅的操作体验  
**依赖**: 无  
**分支**: `feat/WS-M3-W11-002-ux-polish`

#### 触点文件
```
所有pages/**/*.vue (交互优化)
components/**/*.vue (动画优化)
static/css/theme.css (主题优化)
```

#### 预计产出
- 页面切换动画
- 加载状态优化
- 触摸反馈优化
- 空状态优化

#### 工时估算: **8h**

---

## 九、M4 GA验收阶段（01.12-01.23）

### WS-M4-W12-001：全功能回归测试

**ID**: WS-M4-W12-001  
**标题**: 全功能回归测试，确保稳定性  
**目标**: 功能测试通过率100%  
**依赖**: 所有开发任务完成  
**分支**: `test/WS-M4-W12-001-regression`

#### 测试范围
```
全部功能模块逐一验证
```

#### 预计产出
- 回归测试报告
- Bug清单（P0必须清零）
- 性能测试报告
- 兼容性测试报告

#### 工时估算: **16h**

---

### WS-M4-W12-002：兼容性测试

**ID**: WS-M4-W12-002  
**标题**: 多平台兼容性测试  
**目标**: 微信小程序、H5、APP全平台可用  
**依赖**: WS-M4-W12-001  
**分支**: `test/WS-M4-W12-002-compatibility`

#### 测试范围
```
- 微信小程序（多版本）
- H5（多浏览器）
- APP（Android/iOS）
- 不同屏幕尺寸
```

#### 预计产出
- 兼容性问题清单
- 平台差异处理方案
- 兼容性测试报告

#### 工时估算: **8h**

---

### WS-M4-W13-001：P0/P1 Bug清零

**ID**: WS-M4-W13-001  
**标题**: 修复所有P0/P1优先级Bug  
**目标**: 确保上线质量  
**依赖**: WS-M4-W12-*  
**分支**: `fix/WS-M4-W13-001-critical-bugs`

#### 预计产出
- Bug修复清单
- 回归验证
- 修复日志

#### 工时估算: **16h**

---

### WS-M4-W13-002：性能最终优化

**ID**: WS-M4-W13-002  
**标题**: 关键路径性能优化  
**目标**: 首屏<2s，关键操作<800ms  
**依赖**: WS-M4-W12-001  
**分支**: `feat/WS-M4-W13-002-final-perf`

#### 预计产出
- 性能瓶颈分析
- 优化实施
- 性能测试报告
- 性能监控配置

#### 工时估算: **8h**

---

### WS-M4-W13-003：文档完善与交付

**ID**: WS-M4-W13-003  
**标题**: 完善用户手册和开发文档  
**目标**: 完整的文档体系  
**依赖**: 所有功能完成  
**分支**: `docs/WS-M4-W13-003-final-docs`

#### 预计产出
- 用户使用手册
- 开发者文档
- 部署指南
- 运维手册
- API文档

#### 工时估算: **4h**

---

## 十、工作流总览表

| ID | 标题 | 阶段 | 工时 | 依赖 | 状态 |
|----|------|------|------|------|------|
| WS-M0-001 | UI组件库统一 | M0 | 8h | - | 待开始 |
| WS-M0-002 | 开发环境配置 | M0 | 10h | - | 待开始 |
| WS-M0-003 | 环境变量管理 | M0 | 4h | - | 待开始 |
| WS-M1-W1-001 | 微信登录验证 | M1-W1 | 8h | M0-001 | 待开始 |
| WS-M1-W1-002 | 用户信息页面 | M1-W1 | 4h | M1-W1-001 | 待开始 |
| WS-M1-W1-003 | 同意管理流程 | M1-W1 | 8h | M1-W1-001 | 待开始 |
| WS-M1-W1-004 | 通用组件库 | M1-W1 | 16h | M0-001 | 待开始 |
| WS-M1-W1-005 | 请求封装统一 | M1-W1 | 8h | - | 待开始 |
| WS-M1-W1-006 | 路由守卫 | M1-W1 | 4h | M1-W1-001 | 待开始 |
| WS-M1-W2-001 | 量表执行器 | M1-W2 | 8h | M0-001 | 待开始 |
| WS-M1-W2-002 | 评估页面集成 | M1-W2 | 8h | M1-W2-001 | 待开始 |
| WS-M1-W2-003 | 评分逻辑验证 | M1-W2 | 4h | M1-W2-001 | 待开始 |
| WS-M1-W2-004 | 结果展示页面 | M1-W2 | 8h | M1-W2-002 | 待开始 |
| WS-M1-W2-005 | 历史记录 | M1-W2 | 4h | M1-W2-002 | 待开始 |
| WS-M1-W3-001 | AI网关 | M1-W3 | 12h | M0-003 | 待开始 |
| WS-M1-W3-002 | AI对话UI | M1-W3 | 8h | M1-W3-001 | 待开始 |
| WS-M1-W3-003 | 危机干预 | M1-W3 | 4h | M1-W3-001 | 待开始 |
| WS-M1-W3-004 | CDK兑换 | M1-W3 | 4h | M1-W1-001 | 待开始 |
| WS-M1-W3-005 | 冥想音疗 | M1-W3 | 4h | - | 待开始 |
| WS-M1-W4-001 | 端到端测试 | M1-W4 | 16h | M1-W3-* | 待开始 |
| WS-M1-W4-002 | 性能优化 | M1-W4 | 8h | M1-W4-001 | 待开始 |
| WS-M1-W4-003 | 接口联调 | M1-W4 | 8h | M1-W4-001 | 待开始 |
| WS-M1-W4-004 | Bug修复 | M1-W4 | 16h | M1-W4-001 | 待开始 |
| WS-M2-W5-001 | 本地加密 | M2-W5 | 8h | - | 待开始 |
| WS-M2-W6-001 | 数据导出 | M2-W6 | 8h | - | 待开始 |
| WS-M2-W6-002 | 撤回同意 | M2-W6 | 8h | M1-W1-003 | 待开始 |
| WS-M2-W7-001 | 离线支持 | M2-W7 | 12h | - | 待开始 |
| WS-M2-W7-002 | 异常捕获 | M2-W7 | 8h | - | 待开始 |
| WS-M3-W8-001 | 埋点接入 | M3-W8 | 12h | - | 待开始 |
| WS-M3-W11-001 | 打包优化 | M3-W11 | 8h | - | 待开始 |
| WS-M3-W11-002 | UX优化 | M3-W11 | 8h | - | 待开始 |
| WS-M4-W12-001 | 回归测试 | M4-W12 | 16h | ALL | 待开始 |
| WS-M4-W12-002 | 兼容性测试 | M4-W12 | 8h | M4-W12-001 | 待开始 |
| WS-M4-W13-001 | Bug清零 | M4-W13 | 16h | M4-W12-* | 待开始 |
| WS-M4-W13-002 | 最终性能优化 | M4-W13 | 8h | M4-W12-001 | 待开始 |
| WS-M4-W13-003 | 文档交付 | M4-W13 | 4h | ALL | 待开始 |

**总工时**: 约 320h (按2人前端计算，约 8周)

---

## 十一、自检清单模板

每个工作流的 Self-Review 必须包含以下检查项：

```markdown
### Self-Review Checklist

- [ ] ✅ 构建 0 报错（npm run build / dev 无error）
- [ ] ✅ uView 2.x 唯一（或 uni-ui 唯一，无混用）
- [ ] ✅ Node 16 CJS（云函数使用 require/module.exports）
- [ ] ✅ 前端不直连 Supabase（grep检查通过）
- [ ] ✅ 无明文密钥（API_KEY使用环境变量）
- [ ] ✅ 语音不落盘原音频（仅上传特征）
- [ ] ✅ 首包 ≤2MB（manifest.json 分包配置）
- [ ] ✅ 关键路径 P95 ≤800ms（性能测试报告）
- [ ] ✅ 回归脚本通过（npm run test）

### Additional Checks
- [ ] 代码符合ESLint规则
- [ ] 组件PropTypes完整
- [ ] 错误处理完善
- [ ] 日志记录规范
- [ ] 注释清晰完整
```

---

## 十二、下一步行动

1. ✅ 阶段0完成：复用扫描与映射
2. ✅ 阶段1完成：WBS工作流规划
3. **阶段2开始**：按工作流顺序并发实现

**立即启动**: WS-M0-001（UI组件库统一）

---

**文档状态**: ✅ 已完成  
**审核人**: _______  
**审核日期**: _______

