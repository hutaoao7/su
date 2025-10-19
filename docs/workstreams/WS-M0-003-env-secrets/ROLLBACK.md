# WS-M0-003: 回滚方案 (ROLLBACK)

**工作流ID**: WS-M0-003  
**分支**: `feat/WS-M0-003-env-secrets`  
**风险等级**: 中（涉及密钥管理，但无业务逻辑变更）

---

## 一、回滚触发条件

### 1.1 必须回滚场景（P0）

- [ ] 环境变量配置错误导致所有服务不可用
- [ ] 云函数无法读取环境变量（平台bug）
- [ ] 密钥泄露到Git且无法清理
- [ ] 生产环境服务中断

### 1.2 可选回滚场景（P1-P2）

- [ ] 云端环境变量配置复杂，团队不熟悉
- [ ] 本地开发环境配置困难
- [ ] 验证脚本有误报（可单独修复）

---

## 二、回滚方案

### 方案A：完全回滚（不推荐，仅紧急情况）

**适用场景**: 环境变量方案完全不可行

**步骤**:
1. 恢复硬编码密钥（仅测试环境）
2. 删除环境变量配置
3. 删除验证脚本
4. 删除文档

**预计时间**: 15min

**⚠️ 警告**: 恢复硬编码会带来安全风险，仅作临时方案

---

### 方案B：部分回滚（推荐）

**适用场景**: 仅个别云函数有问题

**步骤**:
1. 保留.env.example和文档
2. 仅回滚有问题的云函数
3. 临时使用兜底值（默认密钥）
4. 排查并修复

**预计时间**: 10min

---

### 方案C：配置修复（最推荐）

**适用场景**: 仅配置问题，方案本身可行

**步骤**:
1. 不回滚代码
2. 修复环境变量配置
3. 重启云函数
4. 验证

**预计时间**: 5min

---

## 三、完全回滚步骤（方案A）

### Step 1: 备份当前状态（5min）

```bash
# 创建回滚分支
git checkout -b backup/WS-M0-003-rollback-$(date +%Y%m%d-%H%M)

# 记录环境变量配置
echo "记录云端环境变量配置:" > rollback-env-backup.txt
# （手动记录云端配置）
```

---

### Step 2: 恢复云函数代码（5min）

#### 2.1 stress-chat/index.js

```diff
 'use strict';
 
 const { Configuration, OpenAIApi } = require('openai');
 
-// 从环境变量读取
-const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
-
-// 验证
-if (!OPENAI_API_KEY) {
-  throw new Error('OPENAI_API_KEY未配置');
-}
+// ⚠️ 临时恢复硬编码（仅开发/测试环境）
+const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';

 const configuration = new Configuration({
   apiKey: OPENAI_API_KEY,
 });
```

**⚠️ 警告**: 
- 此为临时方案，密钥仍需妥善保管
- 生产环境不使用此代码
- 尽快解决环境变量问题

---

#### 2.2 common/secrets/supabase.js

```diff
-const rawUrl = process.env.SUPABASE_URL;
-const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
-
-if (!rawUrl || !rawKey) {
-  throw new Error('Supabase配置缺失');
-}
+// 恢复默认值
+const rawUrl = process.env.SUPABASE_URL || 'https://pigbgzyknweghavrayfb.supabase.co';
+const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bq-w_T8VMQFkc6xATumTRQ_7n5rk-OY';
 
 module.exports = {
   url: ensureHttps(rawUrl),
   serviceRoleKey: cleanKey(rawKey)
 };
```

---

### Step 3: 删除新增文件（3min）

```bash
# 删除配置文件
rm .env.example

# 删除验证脚本
rm tools/check-env-vars.js

# 删除文档
rm docs/deployment-guide.md
rm docs/env-variables-guide.md

# 恢复.gitignore（移除.env相关）
# 手动编辑.gitignore，移除环境变量相关行
```

---

### Step 4: 恢复package.json（2min）

```diff
 {
   "scripts": {
-    "check:env": "node tools/check-env-vars.js",
-    "env:example": "cp .env.example .env && echo '✅ 已创建.env，请编辑填入实际值'",
     ...
   }
 }
```

---

### Step 5: 提交回滚（5min）

```bash
git add .
git commit -m "Revert: WS-M0-003 环境变量管理

原因: [填写回滚原因]
- 环境变量配置不可行
- 恢复临时硬编码（仅开发/测试）

⚠️ 注意:
- 此为临时方案
- 生产环境需其他方案
- 密钥仍需妥善保管
"

git push origin main
```

---

### Step 6: 通知与后续（即时）

**通知内容**:
```markdown
## 紧急通知：WS-M0-003已回滚

**回滚原因**: [具体原因]  
**回滚时间**: [时间]  
**影响范围**: 密钥管理方式

**当前状态**:
- ⚠️ 临时恢复硬编码（开发/测试环境）
- ⚠️ 密钥仍在代码中，请注意安全

**后续计划**:
1. 分析回滚原因
2. 制定新方案
3. [预计时间]重新实施

**联系人**: [Tech Lead]
```

---

## 四、部分回滚步骤（方案B）

### 场景1: 仅stress-chat有问题

**步骤**:

1. **保留大部分变更**
   - .env.example 保留
   - 文档保留
   - 验证脚本保留

2. **仅回滚stress-chat**
   ```diff
   -const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
   -if (!OPENAI_API_KEY) throw new Error('未配置');
   +const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'fallback_key';
   ```

3. **添加TODO注释**
   ```javascript
   // TODO: 修复环境变量配置问题后移除默认值
   const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'fallback_key';
   ```

---

### 场景2: 云端配置不生效

**步骤**:

1. **保留本地开发配置**（.env方案）
2. **云端使用替代方案**
   - package.json cloudfunction-config
   - 或云函数配置中心

3. **代码兼容两种方式**
   ```javascript
   // 兼容本地.env和云端配置
   const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
   
   if (!OPENAI_API_KEY) {
     console.warn('OPENAI_API_KEY未配置，尝试使用备用配置');
     // 尝试从其他来源读取
   }
   ```

---

## 五、配置修复步骤（方案C）

### 场景1: 环境变量格式错误

**问题**: 环境变量配置了但读取不到

**排查**:
```bash
# 1. 检查云函数环境变量配置
# HBuilderX → 右键云函数 → 查看环境变量

# 2. 检查变量名拼写
# OPENAI_API_KEY（正确）
# OPENAI_APIKEY（错误）

# 3. 检查值的格式
# 无多余空格、引号、换行
```

**修复**:
1. 更正环境变量配置
2. 重启云函数
3. 调用云函数测试

---

### 场景2: 云函数未重启

**问题**: 配置了环境变量但不生效

**修复**:
```bash
# HBuilderX中
右键云函数 → 停止 → 启动

# 或重新上传
右键云函数 → 上传部署
```

---

### 场景3: .env文件位置错误

**问题**: 本地开发时读取不到.env

**修复**:
```bash
# 检查.env位置
ls -la .env
# 应该在项目根目录

# 检查内容格式
cat .env
# KEY=VALUE，无空格

# 重启开发服务器
npm run dev:mp-weixin
```

---

## 六、回滚验证清单

### 6.1 功能验证
- [ ] stress-chat 可正常调用
- [ ] AI响应正常
- [ ] Supabase连接正常
- [ ] 其他云函数正常

### 6.2 服务验证
- [ ] 开发环境可启动
- [ ] 云端服务可用
- [ ] 无错误日志

### 6.3 安全验证
- [ ] 密钥妥善保管（即使硬编码）
- [ ] Git提交无密钥
- [ ] 团队成员知晓情况

---

## 七、回滚后处理

### 7.1 根因分析

**问题分类**:
- [ ] 平台问题（uniCloud不支持）
- [ ] 配置问题（配置错误）
- [ ] 代码问题（实现有bug）
- [ ] 团队问题（不熟悉流程）

**分析模板**:
```markdown
## 回滚根因分析

### 问题描述
[详细描述回滚原因]

### 直接原因
[直接导致回滚的技术问题]

### 根本原因
[深层次原因，如架构、流程、团队能力]

### 复现步骤
1. ...
2. ...

### 影响范围
- 受影响服务: ...
- 影响时长: ...

### 改进措施
1. 短期: ...
2. 中期: ...
3. 长期: ...
```

---

### 7.2 新方案制定

**方案选项**:

#### 选项1: 优化环境变量方案
- 改进配置流程
- 提供更详细文档
- 开发配置辅助工具

#### 选项2: 使用云函数配置中心
- 利用uniCloud配置中心
- 图形化配置界面
- 更简单易用

#### 选项3: 混合方案
- 本地开发用.env
- 云端用配置中心
- 代码兼容两种方式

---

### 7.3 团队培训

**培训内容**:
1. 环境变量概念
2. .env文件使用
3. 云函数配置方法
4. 常见问题排查

**培训形式**:
- 文档 + 视频
- 实操演练
- Q&A答疑

---

## 八、预防措施（未来）

### 8.1 充分测试

**测试计划**:
- [ ] 本地环境测试
- [ ] 云端环境测试
- [ ] 多人验证
- [ ] 文档验证

### 8.2 灰度发布

**发布策略**:
1. 单个云函数试点
2. 观察1-2天
3. 逐步推广
4. 全面应用

### 8.3 应急预案

**预案要点**:
- 提前准备回滚脚本
- 明确回滚触发条件
- 指定决策人
- 通知机制

---

## 九、密钥安全注意事项

### 9.1 如果密钥已泄露

**立即执行**:
1. **重置密钥**
   - OpenAI Platform → API Keys → Delete + Create New
   - Supabase → Settings → API → Regenerate

2. **更新所有环境**
   - 本地.env
   - 云端配置
   - CI/CD环境

3. **检查使用记录**
   - 查看API调用日志
   - 检查异常活动
   - 评估损失

4. **通知相关方**
   - 团队成员
   - 安全负责人
   - 必要时通知用户

---

### 9.2 Git历史清理

**如果密钥已提交**:

```bash
# ⚠️ 危险操作，谨慎使用

# 1. 使用BFG清理
# 下载: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt

# 2. 或使用git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# 3. 强制推送（需团队协调）
git push origin --force --all
git push origin --force --tags

# 4. 通知所有成员重新clone
```

**⚠️ 注意**:
- 此操作会改写历史
- 需要所有团队成员重新clone
- 慎用，除非密钥确实泄露

---

## 十、联系人

### 紧急联系

- **Tech Lead**: _______ (手机:_______)
- **安全负责人**: _______ (手机:_______)
- **项目经理**: _______ (手机:_______)

### 技术支持

- **uniCloud技术支持**: https://ask.dcloud.net.cn/
- **OpenAI Support**: https://platform.openai.com/support

---

**回滚方案状态**: 已准备  
**最后更新**: 2025-10-12  
**审核人**: _______  
**特别提醒**: 回滚涉及密钥安全，务必谨慎操作！

