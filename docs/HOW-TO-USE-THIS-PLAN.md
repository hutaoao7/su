# 如何使用这份详细规划

## 📚 文档导航

### 快速开始
1. **查看总体规划**: `docs/COMPREHENSIVE-TASK-LIST.md` (570+任务)
2. **查看实施状态**: `docs/IMPLEMENTATION-STATUS.md`
3. **查看工作总结**: `docs/FINAL-WORK-SUMMARY.md`

### 开发团队使用指南

#### 前端工程师
```bash
# 1. 查看UI适配任务
打开 docs/COMPREHENSIVE-TASK-LIST.md
搜索 "UI适配系统化"

# 2. 运行UI适配检测
npm run check:ui-adapter

# 3. 查看检测报告
打开 ui-adapter-report.html

# 4. 根据报告修复问题
参考已完成的页面（login.vue, user/home.vue等）
```

#### 后端工程师
```bash
# 1. 查看数据库设计
ls docs/database/
cat docs/database/schema-users.md

# 2. 执行数据库迁移
psql -h localhost -U postgres dbname < docs/database/migrations/001_create_users_tables.sql

# 3. 验证Schema
npm run check:db-schema

# 4. 查看API文档
ls docs/api/
cat docs/api/auth-login.md

# 5. 生成API文档
npm run generate:api-docs
```

#### 测试工程师
```bash
# 1. 查看测试任务
打开 docs/COMPREHENSIVE-TASK-LIST.md
搜索 "M4-验收阶段"

# 2. 运行单元测试
npm run test:mp-weixin

# 3. 运行E2E测试
node tests/e2e/login-flow.test.js

# 4. 使用Mock数据
import mockData from '@/tests/mock/auth-login-mock.js'
```

#### 项目经理
```bash
# 1. 查看进度
cat docs/IMPLEMENTATION-STATUS.md

# 2. 查看任务分类
cat docs/COMPREHENSIVE-TASK-LIST.md

# 3. 追踪里程碑
# 已完成：M1部分（50个任务）
# 进行中：评估模块、AI对话模块
# 待开始：M2-M4阶段
```

---

## 🎯 任务执行流程

### 方式一：按优先级执行

```markdown
1. 查看 COMPREHENSIVE-TASK-LIST.md
2. 找到标记为 P0（阻塞性）的任务
3. 依次完成每个任务
4. 更新任务状态
5. 进入下一个优先级
```

**P0任务示例**：
- ScaleRunner答题进度保存 ✅ 已完成
- chat.vue聊天记录缓存
- 所有页面safe-area-inset适配
- 核心数据库表迁移脚本

### 方式二：按模块执行

```markdown
1. 选择一个模块（如"评估模块"）
2. 完成该模块的所有任务
3. 运行相关测试
4. 更新文档
5. 进入下一个模块
```

**模块清单**：
- ✅ 登录模块（100%）
- ✅ 用户模块（100%）
- 🔲 评估模块（12%）
- 🔲 AI对话模块（14%）
- 🔲 CDK模块（0%）
- 🔲 音乐模块（0%）
- 🔲 社区模块（0%）

### 方式三：按WS工作流执行

```markdown
1. 打开 docs/phase1-wbs-workstreams.md
2. 按照WS编号顺序执行
3. 每个WS交付五件套
4. 更新 WORKSTREAM-PROGRESS.md
```

---

## 🛠️ 使用自动化工具

### 工具1：UI适配检测

```bash
# 运行检测
npm run check:ui-adapter

# 查看报告
# 会在项目根目录生成 ui-adapter-report.html

# 修复问题
# 参考报告中的建议，修改对应文件

# 再次检测
npm run check:ui-adapter
```

**检测规则**：
- Safe Area适配
- rpx单位使用
- fixed定位检查
- 触摸区域大小
- 响应式布局
- TabBar遮挡
- NavBar遮挡

### 工具2：数据库Schema验证

```bash
# 运行验证
npm run check:db-schema

# 查看报告
# 会在 docs/database/validation/ 生成报告

# 修复问题
# 根据报告修改schema文档
```

**验证内容**：
- 表名/列名命名规范
- 必须字段检查
- 外键索引检查
- 常见查询字段索引

### 工具3：API文档生成

```bash
# 自动生成
npm run generate:api-docs

# 输出位置
# docs/api/ 目录
# docs/api/README.md（索引）
# docs/api/postman-collection.json
# docs/api/openapi.json
```

### 工具4：埋点统计

```javascript
// 在main.js中初始化
import { initAnalytics } from '@/utils/analytics.js';
initAnalytics({ enabled: true });

// 在页面中使用
import { trackEvent, trackClick } from '@/utils/analytics.js';

// 记录事件
trackClick('button_id', { extra: 'data' });
trackEvent('custom_event', { data: 'value' });

// 查看上报
// 事件会批量上报到events-track云函数
```

---

## 📋 任务管理

### 如何添加新任务

1. 打开 `docs/COMPREHENSIVE-TASK-LIST.md`
2. 在对应模块下添加任务
3. 遵循代码块级别粒度
4. 标记优先级（P0/P1/P2/P3）

**示例**：
```markdown
- [ ] 为XXX.vue添加YYY功能（具体操作描述）
  优先级：P1
  预计工时：2小时
  依赖：无
```

### 如何更新进度

1. 完成任务后，在清单中标记 ✅
2. 更新 `docs/IMPLEMENTATION-STATUS.md` 的统计数据
3. 如果完成了一个大模块，更新 `docs/WORKSTREAM-PROGRESS.md`

---

## 🔍 常见问题

### Q1: 任务太多，从哪里开始？
**A**: 按照优先级执行：
1. P0任务（阻塞性）
2. P1任务（重要）
3. P2任务（一般）
4. P3任务（优化）

### Q2: 数据库表如何创建？
**A**: 
1. 查看 `docs/database/schema-*.md` 了解设计
2. 执行 `docs/database/migrations/*.sql` 脚本
3. 验证 `npm run check:db-schema`

### Q3: API文档在哪里？
**A**: 
- 手动编写的：`docs/api/*.md`
- 自动生成的：运行 `npm run generate:api-docs`

### Q4: 如何测试？
**A**: 
- 单元测试：`npm run test:mp-weixin`
- E2E测试：查看 `tests/e2e/` 目录
- Mock数据：使用 `tests/mock/` 目录的mock

### Q5: 如何集成埋点？
**A**: 
```javascript
// 1. 导入SDK
import { trackEvent } from '@/utils/analytics.js';

// 2. 记录事件
trackEvent('event_name', { data: 'value' });

// 3. 查看上报
// 登录云开发控制台查看events-track日志
```

---

## 📊 进度跟踪

### 使用文档
- `docs/COMPREHENSIVE-TASK-LIST.md` - 任务清单
- `docs/IMPLEMENTATION-STATUS.md` - 实施状态
- `docs/WORKSTREAM-PROGRESS.md` - 工作流进度

### 更新频率
- 任务清单：每完成一个任务更新
- 实施状态：每完成50个任务更新
- 工作流进度：每完成一个WS更新

---

## 🎓 最佳实践

### 代码开发
1. ✅ 先查看设计文档
2. ✅ 编写代码实现
3. ✅ 运行检测工具
4. ✅ 修复检测问题
5. ✅ 编写测试用例
6. ✅ 更新任务状态

### 文档维护
1. ✅ 代码变更后更新文档
2. ✅ 定期review文档准确性
3. ✅ 保持文档版本同步

### 团队协作
1. ✅ 每日站会：同步进度
2. ✅ 每周review：检查质量
3. ✅ 里程碑评审：验收交付

---

## 📞 获取帮助

### 技术问题
- 查看 `docs/api/` 目录的API文档
- 查看 `docs/database/` 目录的数据库文档
- 运行自动化工具进行检测

### 任务问题
- 查看 `docs/COMPREHENSIVE-TASK-LIST.md`
- 查看对应模块的详细任务分解
- 参考已完成任务的实现方式

---

**提示**: 这份规划是一个活文档，随着项目进展持续更新和完善。

**开始使用**: 从 `docs/COMPREHENSIVE-TASK-LIST.md` 的P0任务开始！

🚀 **祝开发顺利！**


