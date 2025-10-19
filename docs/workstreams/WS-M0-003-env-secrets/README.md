# WS-M0-003: 环境变量与密钥管理

**工作流ID**: WS-M0-003  
**标题**: 迁移硬编码密钥到配置中心  
**分支**: `feat/WS-M0-003-env-secrets`  
**阶段**: M0 基线对齐  
**状态**: 📝 五件套准备中  
**预计工时**: 4h

---

## 快速导航

- [📋 PLAN.md](./PLAN.md) - 详细计划
- [🔧 PATCH.md](./PATCH.md) - 代码差异
- [✅ TESTS.md](./TESTS.md) - 测试验证
- [📝 SELF-REVIEW.md](./SELF-REVIEW.md) - 自检清单
- [⏮️ ROLLBACK.md](./ROLLBACK.md) - 回滚方案

---

## 工作流概述

### 目标

移除代码中的明文密钥，统一使用环境变量管理，确保安全合规。

### 背景问题

从 phase0-reuse-mapping.md 发现：
- ❌ `stress-chat/index.js` 中硬编码 OpenAI API Key
- ⚠️ `common/secrets/supabase.js` 需确认使用环境变量
- ❌ 缺少环境变量配置示例文档

### 解决方案

1. ✅ OpenAI API Key 迁移到环境变量
2. ✅ 验证 Supabase 密钥使用环境变量
3. ✅ 创建 .env.example 模板
4. ✅ 编写部署指南文档
5. ✅ 配置 ESLint 规则检测硬编码密钥

---

## 影响范围

### 修改文件（2个）

#### 云函数文件
- `uniCloud-aliyun/cloudfunctions/stress-chat/index.js` - 移除硬编码API Key
- `uniCloud-aliyun/cloudfunctions/common/secrets/supabase.js` - 确认环境变量

### 新建文件（3个）

- `.env.example` - 环境变量模板
- `docs/deployment-guide.md` - 部署指南
- `docs/env-variables-guide.md` - 环境变量说明

---

## 依赖关系

### 前置依赖
- **无**（可与WS-M0-002并行）

### 后置依赖
- **WS-M1-W3-001**: AI网关（需要配置OpenAI API Key）
- **所有云函数**: 统一使用环境变量获取密钥

---

## 风险提示

### 已识别风险

| 风险项 | 可能性 | 影响度 | 缓解措施 | 应急预案 | 状态 |
|--------|--------|--------|----------|----------|------|
| **环境变量配置错误导致服务不可用** | 中 | 高 | 1. 提供详细配置文档<br>2. 配置验证脚本<br>3. 充分测试 | 回滚到硬编码（临时） | ⬜ 待验证 |
| **密钥泄露（.env文件误提交）** | 低 | 极高 | 1. .env加入.gitignore<br>2. 提供.env.example<br>3. Git hooks检查 | 立即重置密钥 | ⬜ 待验证 |
| **不同环境配置混乱** | 中 | 中 | 1. 明确区分开发/测试/生产<br>2. 配置命名规范<br>3. 文档说明 | 环境变量文档 | ⬜ 待验证 |
| **云函数环境变量配置不生效** | 中 | 高 | 1. 查阅uniCloud文档<br>2. 云端配置验证<br>3. 本地测试验证 | 联系uniCloud技术支持 | ⬜ 待验证 |
| **Supabase密钥暴露** | 低 | 极高 | 1. 仅云函数使用service_role<br>2. 前端使用anon key<br>3. Row Level Security | 立即重置密钥 | ⬜ 待验证 |
| **OpenAI API Key额度耗尽** | 中 | 中 | 1. 设置使用限额<br>2. 监控API调用量<br>3. 实现降级策略 | 切换备用Key | ⬜ 待验证 |
| **本地开发环境配置困难** | 中 | 低 | 1. 提供详细步骤<br>2. 一键配置脚本<br>3. 团队培训 | 技术支持 | ⬜ 待验证 |

### 风险监控

**检查频率**: 每次部署前

**检查命令**:
```bash
# 检查.env文件是否在.gitignore中
grep -q "^\.env$" .gitignore && echo "✅ .env已忽略" || echo "❌ .env未忽略"

# 检查代码中是否有硬编码密钥
npm run lint  # ESLint规则会检测

# 验证环境变量加载
node tools/check-env-vars.js
```

**报告提交**: 发现密钥泄露立即上报

---

## 实施步骤摘要

### Step 1: 修改云函数（1h）
- 移除 stress-chat 中的硬编码 API Key
- 使用 process.env.OPENAI_API_KEY

### Step 2: 验证 Supabase 配置（30min）
- 确认 common/secrets/supabase.js 使用环境变量
- 验证密钥不在代码中

### Step 3: 创建配置模板（30min）
- 创建 .env.example
- 列出所有必需的环境变量

### Step 4: 编写文档（1.5h）
- deployment-guide.md（部署指南）
- env-variables-guide.md（环境变量说明）

### Step 5: 配置验证脚本（30min）
- tools/check-env-vars.js

---

## 验证标准

### 功能验证

- [ ] OpenAI API Key 从环境变量读取
- [ ] Supabase 密钥从环境变量读取
- [ ] .env.example 完整准确
- [ ] 部署文档清晰易懂
- [ ] 验证脚本可正常运行

### 安全验证

- [ ] 代码中无明文密钥
- [ ] .env 在 .gitignore 中
- [ ] ESLint 可检测硬编码密钥
- [ ] Git history 无密钥泄露

### 文档验证

- [ ] 环境变量说明完整
- [ ] 部署步骤清晰
- [ ] 常见问题有解答

---

## 测试用例摘要

### 自动化测试

| 测试脚本 | 检查项 | 预期结果 |
|---------|--------|----------|
| check-env-vars.js | 所有必需变量已定义 | ✅ 全部存在 |
| npm run lint | 无硬编码密钥 | ✅ 0 errors |
| Git hooks | .env不在暂存区 | ✅ 被拒绝 |

### 手动测试

| 场景 | 测试步骤 | 预期结果 |
|------|----------|----------|
| 本地开发 | 配置.env → 运行dev | ✅ 服务正常 |
| 云端部署 | 配置云端环境变量 → 发布 | ✅ 云函数正常 |
| API调用 | 调用stress-chat | ✅ OpenAI响应正常 |

---

## 回滚方案摘要

### 方案A: 完全回滚

**适用场景**: 环境变量方案导致严重问题

**步骤**:
1. 恢复硬编码密钥（仅开发/测试环境）
2. 删除环境变量配置
3. 暂时关闭ESLint相关规则

**预计时间**: 15min

---

### 方案B: 混合方案

**适用场景**: 仅云端有问题

**步骤**:
1. 本地继续使用.env
2. 云端使用云函数环境变量配置
3. 代码兼容两种方式

**预计时间**: 30min

---

## 成功标准

### 必达目标（P0）

- [x] OpenAI API Key 迁移到环境变量
- [x] Supabase 密钥确认使用环境变量
- [x] .env.example 创建完成
- [x] 部署文档完成
- [x] 验证脚本开发完成

### 质量目标（P1）

- [ ] 代码中无明文密钥
- [ ] .env 已加入 .gitignore
- [ ] ESLint 可检测硬编码
- [ ] 文档清晰完整

### 可选目标（P2）

- [ ] 一键配置脚本
- [ ] 密钥管理最佳实践文档
- [ ] 密钥轮换策略

---

## 交付清单

### 代码交付

- [ ] stress-chat/index.js 修改
- [ ] common/secrets/supabase.js 确认
- [ ] .env.example 创建
- [ ] tools/check-env-vars.js 创建

### 文档交付

- [x] PLAN.md
- [x] PATCH.md
- [x] TESTS.md
- [x] SELF-REVIEW.md
- [x] ROLLBACK.md
- [x] README.md（本文档）
- [ ] docs/deployment-guide.md
- [ ] docs/env-variables-guide.md

---

## 后续任务

完成本工作流后：

1. **M0阶段完成** ✅
   - 可以开始M1阶段开发

2. **WS-M1-W3-001**: AI网关
   - 依赖本工作流的OpenAI API Key配置

---

## 环境变量清单

### 必需变量

| 变量名 | 用途 | 示例值 | 环境 |
|--------|------|--------|------|
| OPENAI_API_KEY | OpenAI API调用 | sk-... | 云函数 |
| SUPABASE_URL | Supabase连接 | https://xxx.supabase.co | 云函数 |
| SUPABASE_SERVICE_ROLE_KEY | Supabase管理密钥 | sb_secret_... | 云函数 |
| WX_APPID | 微信小程序AppID | wx... | 云函数 |
| WX_APPSECRET | 微信小程序Secret | ... | 云函数 |
| TOKEN_SECRET | JWT签名密钥 | random_string | 云函数 |

### 可选变量

| 变量名 | 用途 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| LOG_LEVEL | 日志级别 | info |

---

## 时间线

| 时间点 | 事件 | 状态 |
|--------|------|------|
| 2025-10-12 | 创建五件套文档 | ✅ 已完成 |
| 待定 | 开始实施 | ⬜ 待开始 |
| 待定 | 完成开发 | ⬜ 待完成 |
| 待定 | 测试验证 | ⬜ 待测试 |
| 待定 | M0阶段完成 | ⬜ 待完成 |

---

## 联系人

| 角色 | 姓名 | 职责 |
|------|------|------|
| 负责人 | ___ | 开发与测试 |
| 安全审核 | ___ | 密钥安全审查 |
| Tech Lead | ___ | 技术决策 |

---

## 参考资料

- [uniCloud环境变量文档](https://uniapp.dcloud.net.cn/uniCloud/cf-functions.html#env)
- [OpenAI API文档](https://platform.openai.com/docs/api-reference)
- [Supabase安全最佳实践](https://supabase.com/docs/guides/auth)
- [phase0-reuse-mapping.md](../../phase0-reuse-mapping.md)

---

**文档版本**: v1.0  
**创建日期**: 2025-10-12  
**最后更新**: 2025-10-12  
**维护人**: AI Assistant
