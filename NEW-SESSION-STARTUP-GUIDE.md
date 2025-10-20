# 新对话启动指南

**指南版本**: 1.0  
**最后更新**: 2025-10-20  
**适用范围**: 新对话开始时的快速恢复

---

## ⚡ 快速启动 (5分钟)

### 第1步: 了解当前状态 (1分钟)

```bash
# 查看项目进度快照
查看文件: su/PROJECT-PROGRESS-SNAPSHOT.md

# 关键信息:
- 当前进度: 80% (456/570任务)
- 本次完成: 15个任务 (M1-评估10个 + M1-社区5个)
- 代码行数: 620+行
- 下一步: M1-同意管理 (3个任务)
```

### 第2步: 查看任务清单 (2分钟)

```bash
# 查看完整任务清单
查看文件: docs/COMPREHENSIVE-TASK-LIST.md
定位: M1-同意管理模块 (第420-450行)

# 3个待完成任务:
1. 账号注销流程 (0.5天)
2. 数据删除确认 (0.5天)
3. 撤回记录审计 (0.5天)
```

### 第3步: 查看完成报告 (2分钟)

```bash
# 查看最终完成报告
查看文件: FINAL-SESSION-SUMMARY.md

# 了解:
- 完成的具体任务
- 修改的文件清单
- 新增的代码和方法
- 质量评分
```

---

## 📋 M1-同意管理模块详情

### 任务1: 账号注销流程

**文件**: `pages/user/account-deletion.vue` (待创建)  
**工作量**: 0.5天  
**优先级**: 🔴 高

**实现内容**:
- 添加注销确认对话框
- 实现注销前数据备份
- 调用云函数执行注销
- 清除本地数据和token

**关键方法**:
- `initiateAccountDeletion()` - 启动注销流程
- `confirmDeletion()` - 确认注销
- `backupUserData()` - 备份用户数据

**相关文件**:
- 云函数: `uniCloud-aliyun/cloudfunctions/user-deletion/`
- API: `api/user.js`

---

### 任务2: 数据删除确认

**文件**: `pages/user/data-deletion-confirm.vue` (待创建)  
**工作量**: 0.5天  
**优先级**: 🔴 高

**实现内容**:
- 显示将被删除的数据清单
- 实现删除前确认流程
- 添加撤销选项（7天内）
- 记录删除日志

**关键方法**:
- `showDeletionList()` - 显示删除清单
- `confirmDataDeletion()` - 确认删除
- `undoDeletion()` - 撤销删除

**相关文件**:
- 云函数: `uniCloud-aliyun/cloudfunctions/data-deletion/`
- 数据库: `docs/database/migrations/`

---

### 任务3: 撤回记录审计

**文件**: `pages/user/audit-log.vue` (待创建)  
**工作量**: 0.5天  
**优先级**: 🔴 高

**实现内容**:
- 显示用户操作审计日志
- 实现撤回记录查询
- 添加导出审计报告功能
- 支持时间范围筛选

**关键方法**:
- `loadAuditLog()` - 加载审计日志
- `queryAuditRecords()` - 查询审计记录
- `exportAuditReport()` - 导出审计报告

**相关文件**:
- 云函数: `uniCloud-aliyun/cloudfunctions/audit-log/`
- API: `api/audit.js`

---

## 🔑 关键上下文

### 项目信息
- **项目名**: CraneHeart (翎心)
- **类型**: 心理健康评估平台
- **框架**: uni-app (Vue 2)
- **后端**: uniCloud (阿里云)
- **数据库**: MySQL

### 工作目录
```
d:\新建文件夹\su\
├── pages/              # 页面文件
├── components/         # 组件
├── uniCloud-aliyun/    # 云函数
├── utils/              # 工具函数
├── api/                # API接口
└── docs/               # 文档
```

### 重要文件
| 文件 | 用途 |
|------|------|
| `docs/COMPREHENSIVE-TASK-LIST.md` | 完整任务清单 |
| `PROJECT-PROGRESS-SNAPSHOT.md` | 进度快照 |
| `FINAL-SESSION-SUMMARY.md` | 完成报告 |
| `docs/API-DOCUMENTATION.md` | API文档 |
| `docs/database/migrations/` | 数据库迁移 |

---

## ⚙️ 工作规范

### 必须遵守
- ✅ 所有工作仅在本地进行
- ✅ 修改前查询相关代码
- ✅ 修改后检查编译错误
- ✅ 添加清晰的中文注释
- ✅ 更新相关文档

### 禁止操作
- ❌ 不要执行 `git commit`
- ❌ 不要执行 `git push`
- ❌ 不要推送到远程分支
- ❌ 不要创建Pull Request
- ❌ 不要修改API配置

### 代码规范
- 使用中文注释: `// 任务X: 功能描述`
- 添加错误处理: `try-catch`
- 添加埋点统计: `trackEvent()`
- 保持代码格式一致
- 无编译错误

---

## 📊 进度跟踪

### 当前进度
```
总体: 80% (456/570任务)
M1模块: 95% (152/160任务)
├── M1-登录: 100% ✅
├── M1-用户: 100% ✅
├── M1-AI对话: 100% ✅
├── M1-CDK: 100% ✅
├── M1-音乐: 100% ✅
├── M1-评估结果: 100% ✅
├── M1-评估: 100% ✅
├── M1-社区: 100% ✅
└── M1-同意管理: 80% ⏳ (3个任务待完成)
```

### 预计完成时间
- M1-同意管理: 2025-10-21 (1.5天)
- M1模块完成: 2025-10-21 (100%)
- UI适配系统: 2025-10-22 ~ 2025-10-26 (5天)
- 项目完成: 2025-11-12 (预计)

---

## 🚀 执行步骤

### 新对话开始时

1. **加载上下文** (1分钟)
   ```
   查看: PROJECT-PROGRESS-SNAPSHOT.md
   了解: 当前进度和下一步任务
   ```

2. **查看任务详情** (2分钟)
   ```
   查看: docs/COMPREHENSIVE-TASK-LIST.md
   定位: M1-同意管理模块
   ```

3. **开始工作** (按需)
   ```
   创建: pages/user/account-deletion.vue
   创建: pages/user/data-deletion-confirm.vue
   创建: pages/user/audit-log.vue
   ```

### 工作流程

1. **分析需求** - 查看任务清单和相关文件
2. **查询代码** - 使用codebase-retrieval查询相关代码
3. **修改代码** - 使用str-replace-editor进行修改
4. **检查错误** - 使用diagnostics检查编译错误
5. **更新文档** - 更新相关文档和进度

---

## 📞 常见问题

### Q: 如何快速了解项目状态?
A: 查看 `PROJECT-PROGRESS-SNAPSHOT.md` 文件，包含所有关键信息。

### Q: 下一步要做什么?
A: 完成M1-同意管理的3个任务，预计1.5天完成。

### Q: 如何查看任务详情?
A: 查看 `docs/COMPREHENSIVE-TASK-LIST.md` 文件，定位到M1-同意管理模块。

### Q: 代码规范是什么?
A: 查看本文件的"工作规范"部分，严格遵守。

### Q: 如何提交代码?
A: 不要提交！所有工作仅在本地进行，禁止git操作。

---

## ✅ 启动检查清单

- [ ] 查看 `PROJECT-PROGRESS-SNAPSHOT.md`
- [ ] 查看 `FINAL-SESSION-SUMMARY.md`
- [ ] 查看 `docs/COMPREHENSIVE-TASK-LIST.md`
- [ ] 了解M1-同意管理的3个任务
- [ ] 确认工作规范和代码规范
- [ ] 准备开始工作

---

**指南版本**: 1.0  
**最后更新**: 2025-10-20  
**下一步**: 开始M1-同意管理的3个任务

