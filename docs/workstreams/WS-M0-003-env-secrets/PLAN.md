# WS-M0-003: 环境变量与密钥管理 - 计划文档

**工作流ID**: WS-M0-003  
**分支**: `feat/WS-M0-003-env-secrets`  
**负责人**: 后端Lead + 安全负责人  
**预计工时**: 4h

---

## 一、输入/输出

### 输入

1. **phase0-reuse-mapping.md 发现**
   - stress-chat/index.js 硬编码 OpenAI API Key
   - common/secrets/supabase.js 需验证

2. **安全要求**
   - 禁止明文密钥
   - 环境变量管理
   - .env文件防泄露

### 输出

1. ✅ OpenAI API Key 迁移完成
2. ✅ Supabase 密钥验证通过
3. ✅ .env.example 模板文件
4. ✅ 部署指南文档
5. ✅ 环境变量验证脚本

---

## 二、依赖关系

### 前置依赖

- **无**（可与WS-M0-002并行）

### 后置影响

- **WS-M1-W3-001**: AI网关（需要OpenAI配置）
- **所有云函数**: 统一密钥管理方式
- **部署流程**: 需要配置环境变量

---

## 三、风险控制

| 风险项 | 可能性 | 影响 | 缓解措施 | 应急预案 |
|--------|--------|------|----------|----------|
| 环境变量配置错误 | 中 | 高 | 1. 详细文档<br>2. 验证脚本<br>3. 本地测试 | 回滚到硬编码 |
| 密钥泄露到Git | 低 | 极高 | 1. .gitignore<br>2. Git hooks<br>3. pre-commit检查 | 立即重置密钥 |
| 云函数环境变量不生效 | 中 | 高 | 1. uniCloud文档<br>2. 云端测试<br>3. 技术支持 | 使用云函数配置中心 |
| 不同环境配置混乱 | 中 | 中 | 1. 环境命名规范<br>2. 配置文档<br>3. 验证脚本 | 统一配置模板 |

---

## 四、文件清单

### 4.1 需要修改的文件

#### uniCloud-aliyun/cloudfunctions/stress-chat/index.js

- **复用策略**: 小改
- **变更内容**:
  ```diff
  - const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY'; // 硬编码
  + const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // 环境变量
  
  + // 验证API Key是否配置
  + if (!OPENAI_API_KEY) {
  +   throw new Error('OPENAI_API_KEY未配置');
  + }
  ```

#### uniCloud-aliyun/cloudfunctions/common/secrets/supabase.js

- **复用策略**: 验证（应该已使用环境变量）
- **检查内容**:
  ```javascript
  // 已有代码，确认使用环境变量
  const rawUrl = process.env.SUPABASE_URL || 'default_url';
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default_key';
  ```
- **如果有默认值，建议移除或仅在开发环境使用**

---

### 4.2 需要新建的文件

#### .env.example（新建）

```env
# OpenAI API配置
OPENAI_API_KEY=sk-your-api-key-here

# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 微信小程序配置
WX_APPID=your-wx-appid
WX_APPSECRET=your-wx-appsecret

# JWT密钥
TOKEN_SECRET=your-random-secret-string

# 可选配置
NODE_ENV=development
LOG_LEVEL=info
```

---

#### .gitignore（更新）

```diff
 # 依赖
 node_modules/
 
 # 构建产物
 unpackage/
 
+# 环境变量（重要！）
+.env
+.env.local
+.env.*.local
+
+# 密钥文件
+*.key
+*.pem
+secrets/
```

---

#### tools/check-env-vars.js（新建）

```javascript
#!/usr/bin/env node
/**
 * 环境变量检查脚本
 * 检查必需的环境变量是否配置
 */

const fs = require('fs');
const path = require('path');

// 必需的环境变量
const REQUIRED_VARS = [
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API密钥',
    pattern: /^sk-[a-zA-Z0-9]{48}$/,
    example: 'sk-...(48个字符)',
  },
  {
    name: 'SUPABASE_URL',
    description: 'Supabase项目URL',
    pattern: /^https:\/\/[a-z0-9]+\.supabase\.co$/,
    example: 'https://xxx.supabase.co',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase服务密钥',
    pattern: /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
    example: 'eyJ...(JWT格式)',
  },
  {
    name: 'WX_APPID',
    description: '微信小程序AppID',
    pattern: /^wx[a-zA-Z0-9]{16}$/,
    example: 'wx...(18位)',
  },
  {
    name: 'WX_APPSECRET',
    description: '微信小程序Secret',
    pattern: /^[a-zA-Z0-9]{32}$/,
    example: '...(32位)',
  },
  {
    name: 'TOKEN_SECRET',
    description: 'JWT签名密钥',
    pattern: /^.{32,}$/,
    example: '至少32位随机字符串',
  },
];

// 可选的环境变量
const OPTIONAL_VARS = [
  { name: 'NODE_ENV', description: '运行环境', default: 'development' },
  { name: 'LOG_LEVEL', description: '日志级别', default: 'info' },
];

/**
 * 加载.env文件
 */
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env文件不存在，将检查系统环境变量');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key] = value;
    }
  });
}

/**
 * 检查单个环境变量
 */
function checkVar(varConfig) {
  const { name, description, pattern, example } = varConfig;
  const value = process.env[name];

  console.log(`\n[${name}]`);
  console.log(`  说明: ${description}`);

  if (!value) {
    console.error(`  ❌ 未配置`);
    console.error(`  示例: ${example}`);
    return false;
  }

  if (pattern && !pattern.test(value)) {
    console.error(`  ❌ 格式不正确`);
    console.error(`  当前值: ${value.substring(0, 10)}...`);
    console.error(`  示例: ${example}`);
    return false;
  }

  console.log(`  ✅ 已配置`);
  console.log(`  值: ${value.substring(0, 10)}...`);
  return true;
}

/**
 * 检查可选变量
 */
function checkOptionalVar(varConfig) {
  const { name, description, default: defaultValue } = varConfig;
  const value = process.env[name];

  console.log(`\n[${name}] (可选)`);
  console.log(`  说明: ${description}`);

  if (!value) {
    console.log(`  ⚠️  未配置，将使用默认值: ${defaultValue}`);
  } else {
    console.log(`  ✅ 已配置: ${value}`);
  }
}

/**
 * 检查.env是否在.gitignore中
 */
function checkGitignore() {
  console.log('\n[.gitignore检查]');
  const gitignorePath = path.join(process.cwd(), '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    console.error('  ❌ .gitignore文件不存在');
    return false;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  if (!gitignoreContent.includes('.env')) {
    console.error('  ❌ .env未加入.gitignore');
    console.error('  警告: .env文件可能被提交到Git！');
    return false;
  }

  console.log('  ✅ .env已加入.gitignore');
  return true;
}

/**
 * 主函数
 */
function main() {
  console.log('===== 环境变量检查 =====');

  // 加载.env
  loadEnv();

  // 检查必需变量
  console.log('\n【必需变量】');
  const requiredResults = REQUIRED_VARS.map(checkVar);
  const requiredPassed = requiredResults.filter(r => r).length;

  // 检查可选变量
  console.log('\n【可选变量】');
  OPTIONAL_VARS.forEach(checkOptionalVar);

  // 检查.gitignore
  const gitignoreOk = checkGitignore();

  // 输出结果
  console.log('\n===== 检查结果 =====');
  console.log(`必需变量: ${requiredPassed}/${REQUIRED_VARS.length} 通过`);
  console.log(`可选变量: 已检查`);
  console.log(`.gitignore: ${gitignoreOk ? '✅' : '❌'}`);

  if (requiredPassed === REQUIRED_VARS.length && gitignoreOk) {
    console.log('\n✅ 所有检查通过');
    process.exit(0);
  } else {
    console.log('\n❌ 检查失败，请修复以上问题');
    console.log('\n参考: docs/env-variables-guide.md');
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { checkVar, checkGitignore };
```

---

#### docs/deployment-guide.md（新建）

```markdown
# 部署指南

## 环境准备

### 1. 环境变量配置

#### 1.1 本地开发环境

复制 `.env.example` 为 `.env`:
\`\`\`bash
cp .env.example .env
\`\`\`

编辑 `.env`，填入实际值:
\`\`\`env
OPENAI_API_KEY=sk-your-actual-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
# ... 其他配置
\`\`\`

#### 1.2 云端环境（uniCloud）

**方法A: 云函数配置中心**（推荐）

1. 打开 HBuilderX
2. 右键云函数目录 → uniCloud → 配置环境变量
3. 添加环境变量:
   - Key: OPENAI_API_KEY
   - Value: sk-your-actual-key
4. 保存并重启云函数

**方法B: package.json配置**

在云函数的 `package.json` 中:
\`\`\`json
{
  "cloudfunction-config": {
    "env": {
      "OPENAI_API_KEY": "加密后的值"
    }
  }
}
\`\`\`

### 2. 验证配置

运行验证脚本:
\`\`\`bash
npm run check:env
\`\`\`

预期输出:
\`\`\`
✅ 所有检查通过
\`\`\`

---

## 部署流程

### 本地开发

\`\`\`bash
# 1. 配置环境变量
cp .env.example .env
vim .env

# 2. 验证配置
npm run check:env

# 3. 启动开发环境
npm run dev:mp-weixin
\`\`\`

### 云端部署

\`\`\`bash
# 1. 配置云端环境变量（见上）

# 2. 构建项目
npm run build:mp-weixin

# 3. 上传云函数
# 使用HBuilderX上传，或使用CLI:
unicloud deploy

# 4. 验证云端配置
# 调用云函数，检查日志
\`\`\`

---

## 常见问题

### Q1: 本地.env不生效？

**A**: 确保:
1. .env在项目根目录
2. 格式正确（KEY=VALUE）
3. 重启开发服务器

### Q2: 云函数报错"API Key未配置"？

**A**: 
1. 检查云端环境变量是否配置
2. 重启云函数
3. 查看云函数日志

### Q3: 密钥泄露怎么办？

**A**: 立即:
1. 重置密钥（OpenAI/Supabase后台）
2. 更新环境变量
3. 检查Git历史，如有泄露则rebase移除

---

## 安全建议

1. ✅ **绝不提交.env到Git**
2. ✅ **定期轮换密钥**
3. ✅ **使用最小权限原则**
4. ✅ **监控API使用量**
5. ✅ **设置使用限额**

---

**最后更新**: 2025-10-12
\`\`\`

---

#### docs/env-variables-guide.md（新建）

详细的环境变量说明文档（见PATCH.md）

---

## 五、实施步骤

### Step 1: 修改云函数（1h）

#### 1.1 stress-chat/index.js

```javascript
// 移除硬编码
- const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

// 从环境变量读取
+ const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
+ 
+ // 验证配置
+ if (!OPENAI_API_KEY) {
+   console.error('[stress-chat] OPENAI_API_KEY未配置');
+   throw new Error('OPENAI_API_KEY未配置，请在云函数环境变量中配置');
+ }
+ 
+ if (!OPENAI_API_KEY.startsWith('sk-')) {
+   console.warn('[stress-chat] OPENAI_API_KEY格式可能不正确');
+ }

// 使用配置
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
```

#### 1.2 验证 common/secrets/supabase.js

检查是否已使用环境变量，如有默认值建议移除：

```javascript
// 建议的写法
const rawUrl = process.env.SUPABASE_URL;
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!rawUrl || !rawKey) {
  throw new Error('Supabase配置未完整设置');
}

module.exports = {
  url: ensureHttps(rawUrl),
  serviceRoleKey: cleanKey(rawKey)
};
```

---

### Step 2: 创建配置文件（30min）

见文件清单 4.2

---

### Step 3: 更新.gitignore（5min）

确保.env不被提交

---

### Step 4: 开发验证脚本（30min）

见文件清单 4.2 的 check-env-vars.js

---

### Step 5: 编写文档（1.5h）

- deployment-guide.md（部署流程）
- env-variables-guide.md（变量说明）

---

### Step 6: 验证与测试（30min）

1. 本地测试
2. 云端测试
3. 验证脚本测试

---

## 六、验证计划

### 6.1 本地验证

```bash
# 1. 创建.env
cp .env.example .env

# 2. 填入测试密钥

# 3. 运行验证
npm run check:env
# 预期: ✅ 所有检查通过

# 4. 启动开发环境
npm run dev:mp-weixin
# 预期: 启动成功，无密钥相关报错
```

---

### 6.2 云端验证

```bash
# 1. 配置云端环境变量

# 2. 上传云函数

# 3. 调用stress-chat
# 预期: 正常返回AI响应

# 4. 查看云函数日志
# 预期: 无"API Key未配置"错误
```

---

### 6.3 安全验证

```bash
# 1. 检查.gitignore
grep -q "^\.env$" .gitignore
# 预期: exit code 0

# 2. 检查Git暂存区
git status
# 预期: .env不在列表中

# 3. 检查代码中无硬编码
npm run lint
# 预期: 无 no-restricted-syntax 错误

# 4. 搜索可能的密钥泄露
git log -S "sk-" --all
# 预期: 无结果或仅在本commit之前
```

---

## 七、成功标准

- [ ] OpenAI API Key 从环境变量读取
- [ ] Supabase 密钥从环境变量读取
- [ ] .env.example 完整准确
- [ ] .env 在 .gitignore 中
- [ ] 验证脚本可运行
- [ ] 部署文档完整
- [ ] 本地测试通过
- [ ] 云端测试通过

---

## 八、回滚方案

### 场景1: 环境变量导致服务不可用

**回滚步骤**:
1. 临时恢复硬编码（仅测试环境）
2. 排查环境变量配置问题
3. 修复后重新部署

### 场景2: 密钥泄露

**应急步骤**:
1. 立即重置OpenAI API Key
2. 立即重置Supabase密钥
3. 更新所有环境变量
4. 检查Git历史，必要时rebase移除
5. 通知团队成员

---

## 九、后续任务

- **WS-M1-W3-001**: AI网关（使用本工作流配置的API Key）
- **所有云函数**: 遵循环境变量管理规范

---

**计划状态**: ✅ 已完成  
**审核人**: _______  
**批准实施**: [ ] 是  [ ] 否

