# WS-M0-002: 测试与验证 (TESTS)

**工作流ID**: WS-M0-002  
**测试时间**: 2h

---

## 一、自动化检查脚本测试

### 1.1 check-engines.js

**运行**:
```bash
npm run check:engines
```

**预期输出**:
```
===== 开发环境检查 =====

[Node版本检查]
  当前版本: v16.20.0
  ✅ Node版本检查通过

[npm版本]
  当前版本: 8.19.4

[package.json检查]
  ✅ package.json存在

[依赖检查]
  ✅ vue: ^2.6.11
  ✅ uview-ui: ^2.0.36

[node_modules检查]
  ✅ node_modules存在

===== 检查结果 =====
✅ 所有检查通过，环境配置正确
```

---

### 1.2 check-supabase-direct.js

**运行**:
```bash
npm run check:supabase
```

**预期输出（无违规）**:
```
===== Supabase直连检查 =====

扫描文件数: 45

===== 检查结果 =====

✅ 正常文件: 45
❌ 违规文件: 0

✅ 检查通过
```

**故意制造违规进行测试**:
```javascript
// 在 pages/test.vue 临时添加
import { createClient } from '@supabase/supabase-js';

// 运行检查，预期报错
```

**预期输出（有违规）**:
```
❌ 违规文件: 1

===== 违规详情 =====

❌ pages/test.vue
   [import] 检测到Supabase库导入，前端禁止使用
   [createClient] 检测到Supabase客户端实例化，前端禁止直连

⚠️  修复建议:
  1. 移除前端的Supabase引用
  2. 通过云函数访问Supabase
  3. 使用 utils/unicloud-handler.js 调用云函数

❌ 检查失败
```

---

### 1.3 check-esm-in-cloudfunctions.js

**运行**:
```bash
npm run check:esm
```

**预期输出（无违规）**:
```
===== 云函数ESM检查 =====

扫描文件数: 15

===== 检查结果 =====

✅ 正常文件（CJS）: 15
❌ 违规文件（ESM）: 0

✅ 检查通过，所有云函数使用CJS
```

---

### 1.4 全部检查

**运行**:
```bash
npm run check:all
```

**预期输出**:
```
[check:engines] ✅ 通过
[check:ui] ✅ 通过
[check:supabase] ✅ 通过
[check:esm] ✅ 通过
[lint] ✅ 0 errors, 0 warnings

✅ 所有检查通过
```

---

## 二、ESLint规则测试

### 2.1 工程硬约束规则测试

#### 测试用例1: 禁止Supabase直连

**测试文件**: `test-violations/supabase-direct.js`

```javascript
// 应报错
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
```

**运行检查**:
```bash
npx eslint test-violations/supabase-direct.js
```

**预期结果**:
```
1:1  error  '` @supabase/*' is restricted from being used  no-restricted-imports
```

---

#### 测试用例2: 禁止明文API Key

**测试文件**: `test-violations/hardcoded-key.js`

```javascript
// 应报错
const apiKey = 'sk-1234567890abcdefghijk';
```

**预期结果**:
```
2:17  error  API Key必须使用环境变量，禁止硬编码  no-restricted-syntax
```

---

#### 测试用例3: 禁止service_role

**测试文件**: `test-violations/service-role.js`

```javascript
// 应报错
const key = 'service_role_key';
```

**预期结果**:
```
2:13  error  service_role只能在云函数中使用，前端禁止出现  no-restricted-syntax
```

---

### 2.2 Vue组件规范测试

#### 测试用例4: 组件命名

**测试文件**: `test-violations/component-name.vue`

```vue
<!-- 应报错: 组件名应为PascalCase -->
<script>
export default {
  name: 'user-profile', // 应为 'UserProfile'
}
</script>
```

**预期结果**:
```
3:9  error  Component name "user-profile" is not PascalCase  vue/component-definition-name-casing
```

---

#### 测试用例5: Prop类型

**测试文件**: `test-violations/prop-types.vue`

```vue
<script>
export default {
  props: {
    value: {} // 应报错: 缺少type
  }
}
</script>
```

**预期结果**:
```
4:5  error  Prop "value" should define at least its type  vue/require-prop-types
```

---

### 2.3 代码质量规则测试

#### 测试用例6: 禁止var

**测试文件**: `test-violations/use-var.js`

```javascript
// 应报错
var count = 0;
```

**预期结果**:
```
2:1  error  Unexpected var, use let or const instead  no-var
```

---

#### 测试用例7: 必须使用===

**测试文件**: `test-violations/equality.js`

```javascript
// 应报错
if (value == 0) {}
```

**预期结果**:
```
2:11  error  Expected '===' and instead saw '=='  eqeqeq
```

---

## 三、Prettier格式化测试

### 3.1 格式化测试

**测试文件**: `test-format/unformatted.js`

```javascript
// 格式不规范的代码
const obj={a:1,b:2}
const arr=[1,2,3]
function test(a,b){return a+b}
```

**运行格式化**:
```bash
npx prettier --write test-format/unformatted.js
```

**预期结果**:
```javascript
// 自动格式化后
const obj = { a: 1, b: 2 };
const arr = [1, 2, 3];
function test(a, b) {
  return a + b;
}
```

---

### 3.2 格式化检查

**运行**:
```bash
npm run format:check
```

**预期输出（无问题）**:
```
Checking formatting...
All matched files use Prettier code style!
```

---

## 四、EditorConfig测试

### 4.1 验证EditorConfig生效

**测试方法**:
1. 在支持EditorConfig的编辑器中打开项目
2. 新建`.js`文件
3. 按Tab键

**预期**: 自动插入2个空格（而非Tab字符）

---

## 五、package.json scripts测试

### 5.1 scripts可用性测试

| 命令 | 预期结果 | 状态 |
|------|----------|------|
| `npm run lint` | 运行ESLint检查 | ⬜ 待测 |
| `npm run lint:fix` | 自动修复ESLint问题 | ⬜ 待测 |
| `npm run format` | 格式化所有文件 | ⬜ 待测 |
| `npm run format:check` | 检查格式 | ⬜ 待测 |
| `npm run check:engines` | 检查环境 | ⬜ 待测 |
| `npm run check:ui` | 检查UI一致性 | ⬜ 待测 |
| `npm run check:supabase` | 检查Supabase直连 | ⬜ 待测 |
| `npm run check:esm` | 检查ESM | ⬜ 待测 |
| `npm run check:all` | 运行所有检查 | ⬜ 待测 |

---

## 六、集成测试

### 6.1 完整工作流测试

**步骤**:

1. **安装依赖**
   ```bash
   npm install
   ```

2. **环境检查**
   ```bash
   npm run check:engines
   # 预期: ✅ 通过
   ```

3. **代码检查**
   ```bash
   npm run lint
   # 预期: 0 errors（允许warnings）
   ```

4. **格式化代码**
   ```bash
   npm run format
   # 预期: 代码自动格式化
   ```

5. **运行所有检查**
   ```bash
   npm run check:all
   # 预期: ✅ 所有检查通过
   ```

6. **构建项目**
   ```bash
   npm run build:mp-weixin
   # 预期: 构建成功，0 errors
   ```

---

## 七、一键测试脚本

### test-ws-m0-002.sh

```bash
#!/bin/bash
# WS-M0-002 一键验证脚本

echo "===== WS-M0-002 测试开始 ====="

# 1. 环境检查
echo "\n[1/6] 环境检查..."
npm run check:engines
if [ $? -ne 0 ]; then
  echo "❌ 环境检查失败"
  exit 1
fi

# 2. UI一致性检查
echo "\n[2/6] UI一致性检查..."
npm run check:ui
if [ $? -ne 0 ]; then
  echo "❌ UI检查失败"
  exit 1
fi

# 3. Supabase直连检查
echo "\n[3/6] Supabase直连检查..."
npm run check:supabase
if [ $? -ne 0 ]; then
  echo "❌ Supabase检查失败"
  exit 1
fi

# 4. ESM检查
echo "\n[4/6] 云函数ESM检查..."
npm run check:esm
if [ $? -ne 0 ]; then
  echo "❌ ESM检查失败"
  exit 1
fi

# 5. ESLint检查
echo "\n[5/6] ESLint检查..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint检查失败"
  exit 1
fi

# 6. 构建测试
echo "\n[6/6] 构建测试..."
npm run build:mp-weixin > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ 构建失败"
  exit 1
fi

echo "\n===== 测试完成 ====="
echo "✅ 所有检查通过"
```

**运行**:
```bash
chmod +x test-ws-m0-002.sh
./test-ws-m0-002.sh
```

---

## 八、测试报告模板

```markdown
## WS-M0-002 测试报告

### 测试信息
- 测试人: ___
- 测试日期: ___
- 测试环境: Node 16.x.x

### 测试结果

#### 自动化检查
- check-engines.js: ✅ 通过 / ❌ 失败
- check-supabase-direct.js: ✅ 通过 / ❌ 失败
- check-esm-in-cloudfunctions.js: ✅ 通过 / ❌ 失败

#### ESLint规则
- 工程硬约束: ✅ 通过 / ❌ 失败
- Vue组件规范: ✅ 通过 / ❌ 失败
- 代码质量: ✅ 通过 / ❌ 失败

#### Prettier格式化
- 格式化功能: ✅ 通过 / ❌ 失败
- 格式检查: ✅ 通过 / ❌ 失败

#### Scripts
- 所有scripts可正常运行: ✅ 通过 / ❌ 失败

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

