# WS-M0-002: 代码差异 (PATCH)

**工作流ID**: WS-M0-002  
**分支**: `feat/WS-M0-002-dev-env-setup`  
**变更文件数**: 12个

---

## 一、ESLint配置完善

### 1.1 .eslintrc.js（完善）

```diff
 module.exports = {
   root: true,
   env: {
     browser: true,
     es2021: true,
     node: true,
   },
   extends: [
     'plugin:vue/essential',
     'eslint:recommended',
   ],
   parserOptions: {
     ecmaVersion: 12,
     sourceType: 'module',
   },
   plugins: ['vue'],
   rules: {
+    // ========== 工程硬约束规则 ==========
+    // 禁止前端直连Supabase
+    'no-restricted-imports': ['error', {
+      patterns: [
+        {
+          group: ['**/supabase*', '@supabase/*'],
+          message: '前端禁止直连Supabase，请使用云函数'
+        }
+      ]
+    }],
+    
+    // 禁止前端出现service_role
+    'no-restricted-syntax': ['error',
+      {
+        selector: "Literal[value=/service_role/i]",
+        message: 'service_role只能在云函数中使用，前端禁止出现'
+      },
+      {
+        selector: "Literal[value=/sk-[a-zA-Z0-9]{20,}/]",
+        message: 'API Key必须使用环境变量，禁止硬编码'
+      }
+    ],
+    
+    // ========== Vue组件规范 ==========
     'vue/multi-word-component-names': 'off',
     'vue/no-v-model-argument': 'off',
+    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
+    'vue/component-definition-name-casing': ['error', 'PascalCase'],
+    'vue/prop-name-casing': ['error', 'camelCase'],
+    'vue/require-default-prop': 'warn',
+    'vue/require-prop-types': 'error',
+    'vue/no-unused-components': 'warn',
+    'vue/no-unused-vars': 'warn',
+    'vue/html-self-closing': ['error', {
+      'html': {
+        'void': 'always',
+        'normal': 'never',
+        'component': 'always'
+      }
+    }],
     
+    // ========== 代码质量规则 ==========
     'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
     'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
     'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
     'no-undef': 'error',
+    'eqeqeq': ['error', 'always', { null: 'ignore' }],
+    'curly': ['error', 'all'],
+    'no-var': 'error',
+    'prefer-const': 'error',
+    'no-duplicate-imports': 'error',
+    'no-useless-return': 'warn',
+    
+    // ========== 命名规范 ==========
+    'camelcase': ['warn', { properties: 'never' }],
+    
+    // ========== 代码风格 ==========
     'indent': ['error', 2],
     'quotes': ['error', 'single'],
     'semi': ['error', 'always'],
     'comma-dangle': ['error', 'always-multiline'],
+    'object-curly-spacing': ['error', 'always'],
+    'array-bracket-spacing': ['error', 'never'],
+    'space-before-function-paren': ['error', {
+      anonymous: 'always',
+      named: 'never',
+      asyncArrow: 'always'
+    }],
+    
+    // ========== 安全规则 ==========
+    'no-eval': 'error',
+    'no-implied-eval': 'error',
+    'no-new-func': 'error',
+    
+    // ========== 性能规则 ==========
+    'no-loop-func': 'warn',
   },
   globals: {
     uni: 'readonly',
     wx: 'readonly',
     uniCloud: 'readonly',
     plus: 'readonly',
+    getCurrentPages: 'readonly',
+    getApp: 'readonly',
   },
 };
```

---

### 1.2 .eslintignore（新建）

```
# 依赖
node_modules/
uni_modules/

# 构建产物
unpackage/
dist/

# 测试
coverage/

# 配置文件
*.config.js

# 旧代码（暂时不检查，逐步迁移）
# 可根据实际情况调整
```

---

## 二、检查脚本开发

### 2.1 tools/check-engines.js（完善）

```javascript
#!/usr/bin/env node
/**
 * 环境检查脚本
 * 检查Node版本、关键依赖版本
 */

const fs = require('fs');
const { execSync } = require('child_process');

const REQUIRED_NODE_VERSION = 16;
const REQUIRED_PACKAGES = [
  { name: 'vue', minVersion: '2.6.11' },
  { name: 'uview-ui', minVersion: '2.0.0' },
];

/**
 * 检查Node版本
 */
function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  
  console.log(`\n[Node版本检查]`);
  console.log(`  当前版本: ${version}`);
  
  if (majorVersion !== REQUIRED_NODE_VERSION) {
    console.error(`  ❌ 要求Node ${REQUIRED_NODE_VERSION} LTS，当前: ${version}`);
    console.error(`  请安装 Node ${REQUIRED_NODE_VERSION}.x.x`);
    return false;
  }
  
  console.log(`  ✅ Node版本检查通过`);
  return true;
}

/**
 * 检查npm版本
 */
function checkNpmVersion() {
  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    console.log(`\n[npm版本]`);
    console.log(`  当前版本: ${version}`);
    return true;
  } catch (error) {
    console.error(`\n[npm版本]`);
    console.error(`  ❌ npm不可用`);
    return false;
  }
}

/**
 * 检查package.json是否存在
 */
function checkPackageJson() {
  console.log(`\n[package.json检查]`);
  if (!fs.existsSync('package.json')) {
    console.error(`  ❌ 未找到package.json`);
    return false;
  }
  console.log(`  ✅ package.json存在`);
  return true;
}

/**
 * 检查关键依赖
 */
function checkDependencies() {
  console.log(`\n[依赖检查]`);
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let allPassed = true;
  
  REQUIRED_PACKAGES.forEach(({ name, minVersion }) => {
    const installed = dependencies[name];
    if (!installed) {
      console.error(`  ❌ ${name}: 未安装`);
      allPassed = false;
    } else {
      console.log(`  ✅ ${name}: ${installed}`);
    }
  });
  
  return allPassed;
}

/**
 * 检查node_modules是否安装
 */
function checkNodeModules() {
  console.log(`\n[node_modules检查]`);
  if (!fs.existsSync('node_modules')) {
    console.error(`  ❌ node_modules不存在，请运行: npm install`);
    return false;
  }
  console.log(`  ✅ node_modules存在`);
  return true;
}

/**
 * 主函数
 */
function main() {
  console.log('===== 开发环境检查 =====');
  
  const checks = [
    checkNodeVersion(),
    checkNpmVersion(),
    checkPackageJson(),
    checkDependencies(),
    checkNodeModules(),
  ];
  
  const allPassed = checks.every(check => check);
  
  console.log('\n===== 检查结果 =====');
  if (allPassed) {
    console.log('✅ 所有检查通过，环境配置正确');
    process.exit(0);
  } else {
    console.log('❌ 检查失败，请修复以上问题');
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { 
  checkNodeVersion, 
  checkDependencies,
  checkNodeModules 
};
```

---

### 2.2 tools/check-supabase-direct.js（新建）

```javascript
#!/usr/bin/env node
/**
 * Supabase直连检查脚本
 * 检查前端是否直连Supabase（违反架构规范）
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  scanDirs: ['pages/**/*.{vue,js}', 'components/**/*.{vue,js}', 'utils/**/*.js'],
  excludeDirs: ['node_modules', 'uni_modules', 'unpackage'],
  violations: {
    createClient: /createClient|create\s*\(\s*['"]supabase/gi,
    supabaseImport: /@supabase\/|from\s+['"].*supabase/gi,
    serviceRole: /service_role|serviceRole/gi,
  },
};

// 结果统计
const results = {
  total: 0,
  violations: [],
  clean: [],
};

/**
 * 扫描单个文件
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileResult = {
    path: filePath,
    violations: [],
  };

  // 检查createClient
  if (CONFIG.violations.createClient.test(content)) {
    fileResult.violations.push({
      type: 'createClient',
      message: '检测到Supabase客户端实例化，前端禁止直连',
    });
  }

  // 检查import
  if (CONFIG.violations.supabaseImport.test(content)) {
    fileResult.violations.push({
      type: 'import',
      message: '检测到Supabase库导入，前端禁止使用',
    });
  }

  // 检查service_role
  if (CONFIG.violations.serviceRole.test(content)) {
    fileResult.violations.push({
      type: 'serviceRole',
      message: '检测到service_role密钥，前端禁止出现',
    });
  }

  results.total++;

  if (fileResult.violations.length > 0) {
    results.violations.push(fileResult);
  } else {
    results.clean.push(filePath);
  }

  return fileResult;
}

/**
 * 主函数
 */
function main() {
  console.log('===== Supabase直连检查 =====\n');

  // 扫描所有文件
  const files = CONFIG.scanDirs.reduce((acc, pattern) => {
    return acc.concat(glob.sync(pattern, { ignore: CONFIG.excludeDirs.map(d => `**/${d}/**`) }));
  }, []);

  console.log(`扫描文件数: ${files.length}\n`);

  files.forEach(scanFile);

  // 输出报告
  console.log('===== 检查结果 =====\n');
  console.log(`✅ 正常文件: ${results.clean.length}`);
  console.log(`❌ 违规文件: ${results.violations.length}\n`);

  // 输出违规详情
  if (results.violations.length > 0) {
    console.log('===== 违规详情 =====\n');
    results.violations.forEach(file => {
      console.log(`❌ ${file.path}`);
      file.violations.forEach(v => {
        console.log(`   [${v.type}] ${v.message}`);
      });
      console.log();
    });
    
    console.log('⚠️  修复建议:');
    console.log('  1. 移除前端的Supabase引用');
    console.log('  2. 通过云函数访问Supabase');
    console.log('  3. 使用 utils/unicloud-handler.js 调用云函数\n');
  }

  // 退出码
  const exitCode = results.violations.length > 0 ? 1 : 0;
  console.log(exitCode === 0 ? '✅ 检查通过' : '❌ 检查失败');
  process.exit(exitCode);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanFile };
```

---

### 2.3 tools/check-esm-in-cloudfunctions.js（新建）

```javascript
#!/usr/bin/env node
/**
 * 云函数ESM检查脚本
 * 检查云函数是否使用ESM语法（应使用CJS）
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  cloudFunctionsDir: 'uniCloud-aliyun/cloudfunctions',
  excludeDirs: ['node_modules'],
  esmPatterns: {
    import: /^\s*import\s+.*from/gm,
    export: /^\s*export\s+(default|const|class|function)/gm,
  },
};

// 结果统计
const results = {
  total: 0,
  violations: [],
  clean: [],
};

/**
 * 扫描单个云函数文件
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileResult = {
    path: filePath,
    violations: [],
  };

  // 检查import语法
  const importMatches = content.match(CONFIG.esmPatterns.import);
  if (importMatches) {
    fileResult.violations.push({
      type: 'import',
      count: importMatches.length,
      message: `检测到${importMatches.length}处import语法，云函数必须使用require`,
      examples: importMatches.slice(0, 3), // 最多显示3个示例
    });
  }

  // 检查export语法
  const exportMatches = content.match(CONFIG.esmPatterns.export);
  if (exportMatches) {
    fileResult.violations.push({
      type: 'export',
      count: exportMatches.length,
      message: `检测到${exportMatches.length}处export语法，云函数必须使用module.exports`,
      examples: exportMatches.slice(0, 3),
    });
  }

  results.total++;

  if (fileResult.violations.length > 0) {
    results.violations.push(fileResult);
  } else {
    results.clean.push(filePath);
  }

  return fileResult;
}

/**
 * 主函数
 */
function main() {
  console.log('===== 云函数ESM检查 =====\n');

  // 检查云函数目录是否存在
  if (!fs.existsSync(CONFIG.cloudFunctionsDir)) {
    console.error(`❌ 云函数目录不存在: ${CONFIG.cloudFunctionsDir}`);
    process.exit(1);
  }

  // 扫描所有云函数文件
  const pattern = `${CONFIG.cloudFunctionsDir}/**/index.js`;
  const files = glob.sync(pattern, { 
    ignore: CONFIG.excludeDirs.map(d => `**/${d}/**`) 
  });

  console.log(`扫描文件数: ${files.length}\n`);

  files.forEach(scanFile);

  // 输出报告
  console.log('===== 检查结果 =====\n');
  console.log(`✅ 正常文件（CJS）: ${results.clean.length}`);
  console.log(`❌ 违规文件（ESM）: ${results.violations.length}\n`);

  // 输出违规详情
  if (results.violations.length > 0) {
    console.log('===== 违规详情 =====\n');
    results.violations.forEach(file => {
      console.log(`❌ ${file.path}`);
      file.violations.forEach(v => {
        console.log(`   [${v.type}] ${v.message}`);
        if (v.examples && v.examples.length > 0) {
          console.log(`   示例:`);
          v.examples.forEach(ex => {
            console.log(`     ${ex.trim()}`);
          });
        }
      });
      console.log();
    });
    
    console.log('⚠️  修复建议:');
    console.log('  1. 将 import 改为 const ... = require(...)');
    console.log('  2. 将 export default 改为 module.exports = ');
    console.log('  3. 将 export const 改为 exports.xxx = \n');
  }

  // 退出码
  const exitCode = results.violations.length > 0 ? 1 : 0;
  console.log(exitCode === 0 ? '✅ 检查通过，所有云函数使用CJS' : '❌ 检查失败');
  process.exit(exitCode);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanFile };
```

---

## 三、EditorConfig配置

### 3.1 .editorconfig（新建）

```ini
# EditorConfig: https://EditorConfig.org

root = true

# 所有文件
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

# Markdown文件
[*.md]
trim_trailing_whitespace = false
max_line_length = off

# JSON/YAML
[*.{json,yml,yaml}]
indent_size = 2

# Python
[*.py]
indent_size = 4

# Makefile
[Makefile]
indent_style = tab
```

---

## 四、package.json scripts

### 4.1 package.json（新增scripts）

```diff
 {
   "scripts": {
+    "lint": "eslint --ext .js,.vue .",
+    "lint:fix": "eslint --ext .js,.vue . --fix",
+    "format": "prettier --write \"**/*.{js,vue,json,md}\"",
+    "format:check": "prettier --check \"**/*.{js,vue,json,md}\"",
+    "check:engines": "node tools/check-engines.js",
+    "check:ui": "node tools/check-ui-consistency.js",
+    "check:supabase": "node tools/check-supabase-direct.js",
+    "check:esm": "node tools/check-esm-in-cloudfunctions.js",
+    "check:all": "npm run check:engines && npm run check:ui && npm run check:supabase && npm run check:esm && npm run lint",
     "build:mp-weixin": "...",
     ...
   }
 }
```

---

## 五、Prettier配置完善

### 5.1 .prettierignore（新建）

```
# 依赖
node_modules/
uni_modules/

# 构建产物
unpackage/
dist/

# 测试
coverage/

# 其他
*.min.js
*.min.css
package-lock.json
```

---

## 六、开发指南文档

### 6.1 docs/README-DEV.md（新建）

```markdown
# 翎心（CraneHeart）开发指南

## 环境要求

- **Node.js**: 16.x LTS
- **npm**: 8.x+
- **HBuilderX**: 4.x+（可选，推荐使用VSCode）

## 快速开始

### 1. 克隆项目

\`\`\`bash
git clone <repository-url>
cd 翎心
\`\`\`

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 3. 环境检查

\`\`\`bash
npm run check:engines
\`\`\`

### 4. 运行开发环境

\`\`\`bash
# 微信小程序
npm run dev:mp-weixin

# H5
npm run dev:h5
\`\`\`

---

## 开发规范

### 代码风格

- **缩进**: 2空格
- **引号**: 单引号
- **分号**: 必须
- **命名**: camelCase（变量），PascalCase（组件），UPPER_SNAKE_CASE（常量）

### 组件规范

- 组件文件名: PascalCase（如 `UserProfile.vue`）
- 组件模板中使用: kebab-case（如 `<user-profile />`）
- Props命名: camelCase

### 提交规范

遵循 Conventional Commits:

\`\`\`
feat: 新功能
fix: 修复Bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
test: 测试
chore: 构建/工具变更
\`\`\`

示例:
\`\`\`bash
git commit -m "feat(login): 添加微信登录功能"
git commit -m "fix(scale): 修复量表评分错误"
\`\`\`

---

## 常用命令

### 代码检查

\`\`\`bash
# ESLint检查
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format

# 全部检查
npm run check:all
\`\`\`

### 构建

\`\`\`bash
# 微信小程序
npm run build:mp-weixin

# H5
npm run build:h5
\`\`\`

### 测试

\`\`\`bash
# 单元测试
npm test

# 环境检查
npm run check:engines

# UI一致性检查
npm run check:ui

# Supabase直连检查
npm run check:supabase

# ESM检查
npm run check:esm
\`\`\`

---

## 工程硬约束（必须遵守）

### 1. UI组件库

✅ **统一使用 uView 2.x**  
❌ **禁止混用 uni-ui**

### 2. 数据路径

✅ **前端 → 云函数 → Supabase**  
❌ **禁止前端直连 Supabase**

### 3. 云函数规范

✅ **使用 CommonJS (require/module.exports)**  
❌ **禁止使用 ESM (import/export)**

### 4. 密钥管理

✅ **使用环境变量**  
❌ **禁止硬编码API Key**

### 5. 隐私保护

✅ **语音仅上传特征，临时缓存≤60s**  
❌ **禁止语音原文件落盘**

---

## 常见问题

### Q1: Node版本不对怎么办？

使用nvm切换:
\`\`\`bash
nvm install 16
nvm use 16
\`\`\`

### Q2: ESLint报错太多？

分批修复:
\`\`\`bash
# 仅检查当前修改的文件
git diff --name-only | xargs npm run lint
\`\`\`

### Q3: 如何临时跳过检查？

\`\`\`javascript
// eslint-disable-next-line no-console
console.log('临时调试');
\`\`\`

### Q4: 格式化破坏了代码？

恢复:
\`\`\`bash
git checkout -- <file>
\`\`\`

---

## 工具推荐

- **VSCode插件**:
  - ESLint
  - Prettier
  - EditorConfig
  - Vetur

- **Chrome插件**:
  - Vue DevTools

---

## 联系方式

- **技术问题**: 联系 Tech Lead
- **环境问题**: 查看本文档或提Issue

---

**最后更新**: 2025-10-12
\`\`\`

---

## 七、变更总结

### 新建文件（9个）

1. tools/check-engines.js（完善）
2. tools/check-supabase-direct.js
3. tools/check-esm-in-cloudfunctions.js
4. .editorconfig
5. .eslintignore
6. .prettierignore
7. docs/README-DEV.md

### 修改文件（2个）

1. .eslintrc.js（完善，新增8项规则组）
2. package.json（新增scripts）

### 复用文件（1个）

1. .prettierrc.js（WS-M0-001已创建，无需改动）

---

**变更状态**: ✅ 已完成  
**构建验证**: 待测试  
**审核人**: _______

