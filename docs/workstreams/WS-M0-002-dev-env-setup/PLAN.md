# WS-M0-002: 开发环境配置 - 计划文档

**工作流ID**: WS-M0-002  
**分支**: `feat/WS-M0-002-dev-env-setup`  
**负责人**: 前端Lead  
**预计工时**: 10h

---

## 一、输入/输出

### 输入

1. **WS-M0-001 产出**
   - .eslintrc.js（基础配置）
   - .prettierrc.js（基础配置）
   - tools/check-ui-consistency.js（参考）

2. **基线文档**
   - CraneHeart开发周期计划-用户端.md
   - phase0-reuse-mapping.md（工程硬约束）

### 输出

1. ✅ 完善的 ESLint 配置（8项规则组）
2. ✅ Prettier 配置
3. ✅ 3 个检查脚本（engines/ui/supabase）
4. ✅ 开发指南文档（README-DEV.md）
5. ✅ EditorConfig 配置
6. ✅ Git hooks（可选）

---

## 二、依赖关系

### 前置依赖

- **WS-M0-001**: UI组件库统一（已提供.eslintrc.js基础）

### 后置影响

- **所有开发任务**: 必须遵循本工作流建立的规范
- **WS-M1-W1-005**: 请求封装统一（需要ESLint规则）
- **Code Review**: 使用本工作流规范进行审核

---

## 三、风险控制

| 风险项 | 可能性 | 影响 | 缓解措施 | 应急预案 |
|--------|--------|------|----------|----------|
| ESLint规则过严，旧代码报错过多 | 高 | 中 | 1. 配置.eslintignore<br>2. 仅检查新代码 | 放宽规则或关闭部分检查 |
| 检查脚本误报 | 中 | 低 | 1. 充分测试<br>2. 提供白名单配置 | 修复脚本逻辑 |
| Git hooks导致提交变慢 | 中 | 低 | 1. 仅检查staged文件<br>2. 提供--no-verify选项 | 移除hooks，改为CI检查 |
| 团队抗拒新规范 | 中 | 中 | 1. 说明规范价值<br>2. 提供自动修复工具 | 放宽部分规则 |

---

## 四、文件清单

### 4.1 需要完善的文件

#### .eslintrc.js

- **复用策略**: 小改（基于WS-M0-001）
- **变更内容**:
  ```javascript
  // 新增规则组：
  1. 工程硬约束规则（禁止Supabase直连等）
  2. Vue组件规范
  3. 代码质量规则
  4. 命名规范
  5. 注释规范
  6. 安全规则
  7. 性能规则
  8. uni-app特定规则
  ```

#### .eslintignore

- **复用策略**: 新建
- **内容**: 排除不需要检查的文件

### 4.2 需要新建的文件

#### tools/check-engines.js

- **用途**: 检查Node版本、依赖版本
- **功能**:
  1. 检查Node版本 = 16.x
  2. 检查必需依赖已安装
  3. 检查依赖版本兼容性

#### tools/check-supabase-direct.js

- **用途**: 检查前端是否直连Supabase
- **功能**:
  1. 扫描前端代码
  2. 检测createClient、@supabase引用
  3. 报告违规文件

#### tools/check-esm-in-cloudfunctions.js

- **用途**: 检查云函数是否使用ESM
- **功能**:
  1. 扫描云函数目录
  2. 检测import/export语法
  3. 报告违规文件

#### .editorconfig

- **用途**: 统一编辑器配置
- **内容**: 缩进、换行符、编码等

#### .prettierignore

- **用途**: 排除不需要格式化的文件

#### docs/README-DEV.md

- **用途**: 开发指南
- **内容**:
  1. 环境搭建步骤
  2. 开发规范说明
  3. 常用命令
  4. 常见问题
  5. 工具使用

#### package.json scripts

- **变更**: 新增脚本命令
  ```json
  {
    "scripts": {
      "lint": "eslint --ext .js,.vue .",
      "lint:fix": "eslint --ext .js,.vue . --fix",
      "format": "prettier --write \"**/*.{js,vue,json,md}\"",
      "check:engines": "node tools/check-engines.js",
      "check:ui": "node tools/check-ui-consistency.js",
      "check:supabase": "node tools/check-supabase-direct.js",
      "check:esm": "node tools/check-esm-in-cloudfunctions.js",
      "check:all": "npm run check:engines && npm run check:ui && npm run check:supabase && npm run check:esm && npm run lint"
    }
  }
  ```

#### .husky/（可选）

- **用途**: Git hooks
- **文件**:
  - .husky/pre-commit（提交前检查）
  - .husky/commit-msg（提交信息检查）

---

## 五、实施步骤

### Step 1: 完善ESLint配置（3h）

#### 1.1 工程硬约束规则

```javascript
// .eslintrc.js
rules: {
  // 禁止在前端直连Supabase
  'no-restricted-imports': ['error', {
    patterns: ['**/supabase*', '@supabase/*']
  }],
  
  // 禁止前端出现service_role
  'no-restricted-syntax': ['error', {
    selector: "Literal[value=/service_role/i]",
    message: 'service_role只能在云函数中使用'
  }],
  
  // 禁止明文API Key
  'no-restricted-syntax': ['error', {
    selector: "Literal[value=/sk-[a-zA-Z0-9]{20,}/]",
    message: 'API Key必须使用环境变量'
  }]
}
```

#### 1.2 Vue组件规范

```javascript
rules: {
  'vue/component-name-in-template-casing': ['error', 'kebab-case'],
  'vue/component-definition-name-casing': ['error', 'PascalCase'],
  'vue/prop-name-casing': ['error', 'camelCase'],
  'vue/require-default-prop': 'warn',
  'vue/require-prop-types': 'error',
  'vue/no-unused-components': 'warn',
  'vue/no-unused-vars': 'warn'
}
```

#### 1.3 代码质量规则

```javascript
rules: {
  'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'no-undef': 'error',
  'eqeqeq': ['error', 'always'],
  'curly': ['error', 'all'],
  'no-var': 'error',
  'prefer-const': 'error'
}
```

### Step 2: 开发检查脚本（3h）

见文件清单 4.2

### Step 3: 配置EditorConfig（30min）

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{json,yml,yaml}]
indent_size = 2
```

### Step 4: 编写开发指南（2h）

创建 docs/README-DEV.md，包含：
1. 环境搭建（Node 16、HBuilderX）
2. 安装依赖（npm install）
3. 开发规范（命名、注释、提交）
4. 常用命令（lint、build、dev）
5. 工具使用（ESLint、Prettier）
6. 常见问题（FAQ）

### Step 5: 配置package.json scripts（30min）

添加常用命令，见文件清单

### Step 6: 配置Git hooks（1h，可选）

```bash
# 安装husky
npm install --save-dev husky

# 初始化
npx husky install

# pre-commit hook
npx husky add .husky/pre-commit "npm run lint-staged"

# commit-msg hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

---

## 六、验证计划

### 6.1 ESLint规则验证

```bash
# 运行ESLint
npm run lint

# 预期：检测出违规代码
# 测试用例：
# 1. 前端直连Supabase（应报错）
# 2. 使用var声明（应报错）
# 3. 组件命名不规范（应报错）
```

### 6.2 检查脚本验证

```bash
# 检查Node版本
npm run check:engines
# 预期：✅ Node 16.x

# 检查Supabase直连
npm run check:supabase
# 预期：✅ 无直连

# 检查ESM
npm run check:esm
# 预期：✅ 云函数全部CJS

# 全部检查
npm run check:all
# 预期：✅ 所有检查通过
```

### 6.3 格式化验证

```bash
# 格式化代码
npm run format

# 验证格式一致性
npx prettier --check "**/*.{js,vue}"
```

---

## 七、成功标准

- [ ] ESLint配置完善（8项规则组）
- [ ] 3个检查脚本可正常运行
- [ ] 开发指南文档完整
- [ ] package.json scripts配置完成
- [ ] EditorConfig配置完成
- [ ] npm run check:all 通过
- [ ] npm run lint 0 errors（允许旧代码warnings）

---

## 八、回滚方案

### 场景1: ESLint规则过严

**回滚步骤**:
1. 调整规则级别（error → warn）
2. 配置.eslintignore排除旧代码
3. 分阶段引入规则

### 场景2: 检查脚本误报

**回滚步骤**:
1. 修复脚本逻辑
2. 添加白名单配置
3. 提供--skip选项

### 场景3: Git hooks影响效率

**回滚步骤**:
```bash
# 移除hooks
rm -rf .husky

# package.json移除husky配置
```

---

## 九、后续任务

- **WS-M0-003**: 环境变量管理（可并行）
- **WS-M1-W1-***: M1阶段开发（依赖本工作流规范）

---

**计划状态**: ✅ 已完成  
**审核人**: _______  
**批准实施**: [ ] 是  [ ] 否

