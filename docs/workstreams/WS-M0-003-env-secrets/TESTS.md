# WS-M0-003: 测试与验证 (TESTS)

**工作流ID**: WS-M0-003  
**测试时间**: 1h

---

## 一、环境变量验证脚本测试

### 1.1 check-env-vars.js 正常场景

**前置准备**:
```bash
# 创建完整的.env文件
cp .env.example .env
# 编辑.env，填入格式正确的测试值
```

**运行测试**:
```bash
npm run check:env
```

**预期输出**:
```
===== 环境变量检查 =====

【必需变量】

[OPENAI_API_KEY]
  说明: OpenAI API密钥
  ✅ 已配置
  值: sk-proj123...

[SUPABASE_URL]
  说明: Supabase项目URL
  ✅ 已配置
  值: https://...

[SUPABASE_SERVICE_ROLE_KEY]
  说明: Supabase服务密钥
  ✅ 已配置
  值: eyJhbGciOi...

[WX_APPID]
  说明: 微信小程序AppID
  ✅ 已配置
  值: wx1234...

[WX_APPSECRET]
  说明: 微信小程序Secret
  ✅ 已配置
  值: 01234567...

[TOKEN_SECRET]
  说明: JWT签名密钥
  ✅ 已配置
  值: random_str...

【可选变量】

[NODE_ENV] (可选)
  说明: 运行环境
  ✅ 已配置: development

[LOG_LEVEL] (可选)
  说明: 日志级别
  ⚠️  未配置，将使用默认值: info

[.gitignore检查]
  ✅ .env已加入.gitignore

===== 检查结果 =====
必需变量: 6/6 通过
可选变量: 已检查
.gitignore: ✅

✅ 所有检查通过
```

---

### 1.2 check-env-vars.js 异常场景

#### 测试1: 缺少必需变量

**准备**:
```bash
# .env中删除OPENAI_API_KEY
```

**运行**:
```bash
npm run check:env
```

**预期输出**:
```
[OPENAI_API_KEY]
  说明: OpenAI API密钥
  ❌ 未配置
  示例: sk-...(48个字符)

===== 检查结果 =====
必需变量: 5/6 通过
.gitignore: ✅

❌ 检查失败，请修复以上问题

参考: docs/env-variables-guide.md
```

---

#### 测试2: 格式错误

**准备**:
```bash
# .env中设置错误格式
OPENAI_API_KEY=wrong_format_key
```

**运行**:
```bash
npm run check:env
```

**预期输出**:
```
[OPENAI_API_KEY]
  说明: OpenAI API密钥
  ❌ 格式不正确
  当前值: wrong_form...
  示例: sk-...(48个字符)

❌ 检查失败
```

---

#### 测试3: .env不在.gitignore

**准备**:
```bash
# 临时从.gitignore中移除.env
sed -i '/^\.env$/d' .gitignore
```

**运行**:
```bash
npm run check:env
```

**预期输出**:
```
[.gitignore检查]
  ❌ .env未加入.gitignore
  警告: .env文件可能被提交到Git！

❌ 检查失败
```

**恢复**:
```bash
echo ".env" >> .gitignore
```

---

## 二、云函数代码测试

### 2.1 stress-chat 环境变量读取测试

#### 测试场景1: 正常配置

**准备**:
```bash
# 配置环境变量
export OPENAI_API_KEY=sk-test1234567890abcdefghijklmnopqrstuvwxyz
```

**测试**:
```javascript
// 在stress-chat/index.js中临时添加日志
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
console.log('API Key loaded:', !!process.env.OPENAI_API_KEY);

// 调用云函数
// 观察日志输出
```

**预期日志**:
```
OPENAI_API_KEY: sk-test123...
API Key loaded: true
```

---

#### 测试场景2: 未配置

**准备**:
```bash
# 删除环境变量
unset OPENAI_API_KEY
```

**测试**:
```bash
# 调用stress-chat云函数
```

**预期结果**:
```
错误: OPENAI_API_KEY未配置，请在云函数环境变量中配置。参考: docs/deployment-guide.md
```

---

#### 测试场景3: 格式错误

**准备**:
```bash
export OPENAI_API_KEY=wrong_format
```

**测试**:
调用云函数

**预期日志**:
```
[stress-chat] OPENAI_API_KEY格式可能不正确，应以sk-开头
```

---

### 2.2 Supabase配置测试

**测试**:
```javascript
// 在common/secrets/supabase.js所在云函数中
const supabase = require('../common/secrets/supabase');
console.log('Supabase URL:', supabase.url);
console.log('Service Role Key:', supabase.serviceRoleKey.substring(0, 10) + '...');
```

**预期输出**:
```
Supabase URL: https://xxx.supabase.co
Service Role Key: eyJhbGciOi...
```

---

## 三、Git安全测试

### 3.1 .gitignore 测试

**测试1: .env是否被忽略**

```bash
# 创建.env文件
echo "TEST_KEY=test_value" > .env

# 检查Git状态
git status

# 预期: .env不在未跟踪文件列表中
```

**验证**:
```bash
git check-ignore .env
# 预期输出: .env (表示被忽略)
# 退出码: 0
```

---

**测试2: .env.example是否被跟踪**

```bash
git add .env.example
git status

# 预期: .env.example在暂存区
```

---

### 3.2 防止密钥提交测试

**测试: Git hooks（如已配置）**

```bash
# 尝试暂存.env
echo "SECRET_KEY=secret" > .env
git add .env
git commit -m "test"

# 预期: 
# 1. 如果有pre-commit hook: 被拒绝
# 2. 如果没有: 需要手动检查（不推荐提交）
```

---

## 四、部署流程测试

### 4.1 本地开发环境测试

**步骤**:
```bash
# 1. 创建.env
npm run env:example

# 2. 编辑.env（填入测试值）
vim .env

# 3. 验证
npm run check:env

# 4. 启动开发环境
npm run dev:mp-weixin

# 5. 观察启动日志
# 预期: 无"配置缺失"错误
```

**验证点**:
- [ ] .env 创建成功
- [ ] check:env 通过
- [ ] 开发环境启动成功
- [ ] 无环境变量相关错误

---

### 4.2 云端部署测试

**步骤**:
```bash
# 1. 配置云端环境变量
# （使用HBuilderX或CLI）

# 2. 上传云函数
unicloud deploy --function stress-chat

# 3. 调用云函数测试
# 使用HBuilderX或curl调用

# 4. 查看云函数日志
# 检查是否有配置错误
```

**验证点**:
- [ ] 云端环境变量配置成功
- [ ] 云函数调用成功
- [ ] 日志无"未配置"错误
- [ ] AI响应正常（如测试stress-chat）

---

## 五、文档测试

### 5.1 部署指南测试

**测试方法**: 找一个新成员按照文档操作

**测试步骤**:
1. 阅读 docs/deployment-guide.md
2. 按步骤配置本地环境
3. 按步骤部署云端
4. 记录遇到的问题

**评估标准**:
- [ ] 文档步骤清晰
- [ ] 无遗漏步骤
- [ ] 问题有解答
- [ ] 新成员能独立完成

---

### 5.2 环境变量指南测试

**测试方法**: 查阅文档解决问题

**测试场景**:
1. "OpenAI API Key在哪获取？" → 查文档
2. "格式错误怎么办？" → 查文档
3. "云函数配置在哪？" → 查文档

**评估标准**:
- [ ] 常见问题有答案
- [ ] 配置步骤详细
- [ ] 示例准确

---

## 六、安全测试

### 6.1 密钥泄露检测

**测试1: 代码中无硬编码**

```bash
# 搜索可能的API Key模式
grep -r "sk-[a-zA-Z0-9]\\{48\\}" . --exclude-dir=node_modules --exclude-dir=.git

# 预期: 无结果或仅在.env.example中（示例值）
```

**测试2: Git历史检查**

```bash
# 搜索历史提交中的密钥
git log -S "sk-" --all -- '*.js' '*.json'

# 预期: 无真实密钥，或仅在WS-M0-003之前（已处理）
```

---

### 6.2 ESLint规则测试

**测试**: 创建包含硬编码密钥的文件

```javascript
// test-hardcoded-key.js
const apiKey = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';
```

**运行**:
```bash
npx eslint test-hardcoded-key.js
```

**预期输出**:
```
test-hardcoded-key.js
  1:17  error  API Key必须使用环境变量，禁止硬编码  no-restricted-syntax

✖ 1 problem (1 error, 0 warnings)
```

**清理**:
```bash
rm test-hardcoded-key.js
```

---

## 七、回归测试

### 7.1 原有功能验证

**测试清单**:
- [ ] stress-chat 云函数调用正常
- [ ] AI响应正常
- [ ] Supabase数据库操作正常
- [ ] 微信登录正常

**测试方法**:
1. 调用 stress-chat 云函数
2. 验证返回AI响应
3. 检查数据库操作（如有）
4. 测试微信登录流程

---

### 7.2 构建测试

```bash
# 构建微信小程序
npm run build:mp-weixin

# 预期: 构建成功，0 errors
```

---

## 八、一键测试脚本

### test-ws-m0-003.sh

```bash
#!/bin/bash
# WS-M0-003 一键验证脚本

echo "===== WS-M0-003 测试开始 ====="

# 1. 检查.env.example存在
echo "\n[1/6] 检查.env.example..."
if [ ! -f ".env.example" ]; then
  echo "❌ .env.example不存在"
  exit 1
fi
echo "✅ .env.example存在"

# 2. 检查.gitignore
echo "\n[2/6] 检查.gitignore..."
if ! grep -q "^\.env$" .gitignore; then
  echo "❌ .env未在.gitignore中"
  exit 1
fi
echo "✅ .env已在.gitignore中"

# 3. 检查验证脚本
echo "\n[3/6] 检查验证脚本..."
if [ ! -f "tools/check-env-vars.js" ]; then
  echo "❌ check-env-vars.js不存在"
  exit 1
fi
echo "✅ check-env-vars.js存在"

# 4. 检查文档
echo "\n[4/6] 检查文档..."
if [ ! -f "docs/deployment-guide.md" ] || [ ! -f "docs/env-variables-guide.md" ]; then
  echo "❌ 文档缺失"
  exit 1
fi
echo "✅ 文档完整"

# 5. 检查云函数修改
echo "\n[5/6] 检查云函数..."
if grep -q "YOUR_OPENAI_API_KEY" uniCloud-aliyun/cloudfunctions/stress-chat/index.js; then
  echo "❌ stress-chat仍有硬编码API Key"
  exit 1
fi
echo "✅ 云函数已迁移到环境变量"

# 6. 运行ESLint
echo "\n[6/6] ESLint检查..."
npm run lint > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "⚠️  ESLint有警告/错误（可能是其他文件）"
else
  echo "✅ ESLint检查通过"
fi

echo "\n===== 测试完成 ====="
echo "✅ 基础检查通过"
echo "⚠️  请手动测试:"
echo "  1. npm run check:env（需配置.env）"
echo "  2. 云函数调用测试"
echo "  3. 部署流程测试"
```

**运行**:
```bash
chmod +x test-ws-m0-003.sh
./test-ws-m0-003.sh
```

---

## 九、测试报告模板

```markdown
## WS-M0-003 测试报告

### 测试信息
- 测试人: ___
- 测试日期: ___
- 测试环境: 本地 / 云端

### 测试结果

#### 验证脚本
- check-env-vars.js: ✅ 通过 / ❌ 失败
- 正常场景: ✅ 通过 / ❌ 失败
- 异常场景: ✅ 通过 / ❌ 失败

#### 云函数测试
- stress-chat环境变量读取: ✅ 通过 / ❌ 失败
- Supabase配置: ✅ 通过 / ❌ 失败
- 错误处理: ✅ 通过 / ❌ 失败

#### Git安全
- .gitignore配置: ✅ 通过 / ❌ 失败
- 无密钥泄露: ✅ 通过 / ❌ 失败

#### 部署流程
- 本地环境: ✅ 通过 / ❌ 失败
- 云端部署: ✅ 通过 / ❌ 失败

#### 文档测试
- 部署指南: ✅ 清晰 / ❌ 需改进
- 环境变量指南: ✅ 完整 / ❌ 需补充

#### 安全测试
- 无硬编码密钥: ✅ 通过 / ❌ 失败
- ESLint规则生效: ✅ 通过 / ❌ 失败

### 发现问题
1. [P_] 问题描述...

### 测试结论
- [ ] ✅ 通过，可以合并
- [ ] ⚠️ 有问题，需修复
- [ ] ❌ 失败，需重新开发
```

---

**测试状态**: 待执行  
**测试负责人**: _______  
**预计测试时间**: 1h

