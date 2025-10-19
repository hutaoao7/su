# WS-M0-001: 代码差异 (PATCH)

**工作流ID**: WS-M0-001  
**分支**: `feat/WS-M0-001-ui-lib-unify`  
**变更文件数**: 10个

---

## 一、依赖安装

### 1.1 package.json

```diff
{
  "name": "liquid-glass-app",
  "version": "1.0.0",
  "dependencies": {
    "@dcloudio/uni-app": "^2.0.2",
    "core-js": "^3.8.3",
    "vue": "^2.6.11",
-   "vuex": "^3.2.0"
+   "vuex": "^3.2.0",
+   "uview-ui": "^2.0.36"
  }
}
```

**说明**: 添加 uView 2.x 依赖

---

## 二、配置文件修改

### 2.1 main.js

```diff
 import Vue from 'vue'
 import App from './App'
+import uView from 'uview-ui'
+
+Vue.use(uView)
 
 Vue.config.productionTip = false
 
 App.mpType = 'app'
 
 const app = new Vue({
   ...App
 })
 app.$mount()
```

**说明**: 引入并注册 uView

---

### 2.2 pages.json

```diff
 {
   "pages": [
     { "path": "pages/home/home", "style": { "navigationStyle": "default", "navigationBarTitleText": "首页" } },
     ...
   ],
+  "easycom": {
+    "autoscan": true,
+    "custom": {
+      "^u-(.*)": "uview-ui/components/u-$1/u-$1.vue"
+    }
+  },
   "globalStyle": {
     "navigationBarTextStyle": "black",
     "navigationBarTitleText": "翎心",
     "navigationBarBackgroundColor": "#F8F8F8",
     "backgroundColor": "#F0F0F5"
   },
   "tabBar": {
     ...
   }
 }
```

**说明**: 配置 easycom 自动引入 uView 组件

---

### 2.3 uni.scss

```diff
+/* uView主题变量 */
+@import 'uview-ui/theme.scss';
+
 /* 全局样式变量 */
 $uni-bg-color: #F0F0F5;
 $uni-text-color: #333;
```

**说明**: 引入 uView 样式变量

---

### 2.4 App.vue

```diff
 <template>
   <view id="app">
     <router-view />
   </view>
 </template>
 
 <script>
 export default {
   onLaunch() {
     console.log('App Launch')
   },
   onShow() {
     console.log('App Show')
   },
   onHide() {
     console.log('App Hide')
   }
 }
 </script>
 
 <style>
+@import 'uview-ui/index.scss';
+
 html, body, #app, page { 
   background: #fff !important; 
   height: 100%;
   margin: 0;
   padding: 0;
 }
 
 #app {
   height: 100%;
   display: flex;
   flex-direction: column;
 }
 
 * {
   box-sizing: border-box;
 }
 
 .mask, .overlay, .loading-mask {
   display: none !important;
 }
 </style>
```

**说明**: 引入 uView 全局样式

---

## 三、页面文件修改（验证无需改动）

### 3.1 pages/user/home.vue

**当前状态**: 已使用 u-popup, u-switch, u-button  
**变更**: ✅ **无需修改**（安装uView后组件自动可用）

```vue
<!-- 原有代码保持不变 -->
<u-popup v-model="showSubscriptionPopup" mode="bottom" height="60%" border-radius="24">
  ...
</u-popup>
```

**验证点**:
- [ ] u-popup 可正常打开/关闭
- [ ] u-switch 可正常切换状态
- [ ] 样式保持一致

---

### 3.2 pages/features/features.vue

**当前状态**: 已使用 u-icon  
**变更**: ✅ **无需修改**

```vue
<!-- 原有代码保持不变 -->
<u-icon :name="card.icon" size="32" :color="card.iconColor"></u-icon>
```

**验证点**:
- [ ] u-icon 可正常显示
- [ ] 图标名称需验证是否在uView图标库中

**潜在风险**: 如果使用的图标名称不在uView图标库，需要替换或使用自定义图标

---

### 3.3 components/scale/ScaleRunner.vue

**当前状态**: 已使用 u-input, u-button  
**变更**: ✅ **无需修改**

```vue
<!-- 原有代码保持不变 -->
<u-input 
  v-model="timeInput"
  type="text"
  placeholder="请输入时间，如: 23:30"
  @blur="handleTimeInput"
  class="time-input"
/>
```

**验证点**:
- [ ] u-input 可正常输入
- [ ] 输入验证逻辑正常
- [ ] u-button 点击事件正常

---

### 3.4 pages/cdk/redeem.vue

**当前状态**: 已使用 u-input, u-button  
**变更**: ✅ **无需修改**

**验证点**:
- [ ] CDK输入框正常
- [ ] 兑换按钮正常

---

## 四、新建文件

### 4.1 tools/check-ui-consistency.js

```javascript
#!/usr/bin/env node
/**
 * UI组件库一致性检查脚本
 * 用途: 检测项目中是否混用uni-ui和uView组件
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  scanDirs: ['pages/**/*.vue', 'components/**/*.vue'],
  allowedPrefixes: ['u-'], // 允许的组件前缀
  bannedPrefixes: ['uni-'], // 禁止的组件前缀（除非在白名单）
  whitelist: ['uni-app', 'uni.'], // 白名单（API调用等）
};

// 结果统计
const results = {
  total: 0,
  uViewComponents: new Set(),
  uniUIComponents: new Set(),
  files: {
    clean: [],
    warning: [],
    error: [],
  },
};

/**
 * 扫描单个文件
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileResult = {
    path: filePath,
    uViewComponents: [],
    uniUIComponents: [],
    issues: [],
  };

  // 检测 u- 组件
  const uViewPattern = /<u-([a-z-]+)/g;
  let match;
  while ((match = uViewPattern.exec(content)) !== null) {
    const componentName = `u-${match[1]}`;
    fileResult.uViewComponents.push(componentName);
    results.uViewComponents.add(componentName);
  }

  // 检测 uni- 组件
  const uniUIPattern = /<uni-([a-z-]+)/g;
  while ((match = uniUIPattern.exec(content)) !== null) {
    const componentName = `uni-${match[1]}`;
    // 检查是否在白名单
    const isWhitelisted = CONFIG.whitelist.some(item => content.includes(item));
    if (!isWhitelisted) {
      fileResult.uniUIComponents.push(componentName);
      results.uniUIComponents.add(componentName);
      fileResult.issues.push({
        type: 'error',
        message: `发现uni-ui组件: ${componentName}，应使用uView组件替代`,
      });
    }
  }

  results.total++;

  // 分类文件
  if (fileResult.issues.length > 0) {
    results.files.error.push(fileResult);
  } else if (fileResult.uViewComponents.length > 0) {
    results.files.clean.push(fileResult);
  }

  return fileResult;
}

/**
 * 检查uView是否安装
 */
function checkUViewInstalled() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ 未找到package.json');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const hasUView = packageJson.dependencies && packageJson.dependencies['uview-ui'];
  
  if (!hasUView) {
    console.error('❌ uView未安装，请运行: npm install uview-ui');
    return false;
  }

  console.log(`✅ uView已安装: ${packageJson.dependencies['uview-ui']}`);
  return true;
}

/**
 * 主函数
 */
function main() {
  console.log('===== UI组件库一致性检查 =====\n');

  // 检查uView是否安装
  if (!checkUViewInstalled()) {
    process.exit(1);
  }

  // 扫描所有.vue文件
  const files = CONFIG.scanDirs.reduce((acc, pattern) => {
    return acc.concat(glob.sync(pattern));
  }, []);

  console.log(`扫描文件数: ${files.length}\n`);

  files.forEach(scanFile);

  // 输出报告
  console.log('===== 检查结果 =====\n');
  console.log(`✅ 正常文件: ${results.files.clean.length}`);
  console.log(`⚠️  警告文件: ${results.files.warning.length}`);
  console.log(`❌ 错误文件: ${results.files.error.length}\n`);

  if (results.uViewComponents.size > 0) {
    console.log(`uView组件 (${results.uViewComponents.size}个):`);
    Array.from(results.uViewComponents).sort().forEach(comp => {
      console.log(`  - ${comp}`);
    });
    console.log();
  }

  if (results.uniUIComponents.size > 0) {
    console.log(`⚠️  uni-ui组件 (${results.uniUIComponents.size}个，需替换):`);
    Array.from(results.uniUIComponents).sort().forEach(comp => {
      console.log(`  - ${comp}`);
    });
    console.log();
  }

  // 输出错误详情
  if (results.files.error.length > 0) {
    console.log('===== 错误详情 =====\n');
    results.files.error.forEach(file => {
      console.log(`❌ ${file.path}`);
      file.issues.forEach(issue => {
        console.log(`   ${issue.message}`);
      });
      console.log();
    });
  }

  // 退出码
  const exitCode = results.files.error.length > 0 ? 1 : 0;
  console.log(exitCode === 0 ? '✅ 检查通过' : '❌ 检查失败');
  process.exit(exitCode);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanFile, checkUViewInstalled };
```

**说明**: 自动化检查脚本，扫描项目中的组件使用情况

---

### 4.2 .eslintrc.js

```javascript
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
    // Vue规则
    'vue/multi-word-component-names': 'off',
    'vue/no-v-model-argument': 'off',
    
    // 强制使用uView组件（禁止uni-ui）
    'vue/no-undef-components': ['error', {
      ignorePatterns: [
        '^u-', // 允许u-开头的uView组件
        '^router-', // 允许router-view等
      ],
    }],
    
    // 代码质量
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    
    // 代码风格
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
  },
  globals: {
    uni: 'readonly',
    wx: 'readonly',
    uniCloud: 'readonly',
    plus: 'readonly',
  },
};
```

**说明**: ESLint配置，强制使用uView组件

---

### 4.3 .prettierrc.js

```javascript
module.exports = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  vueIndentScriptAndStyle: false,
};
```

**说明**: Prettier代码格式化配置

---

### 4.4 docs/ui-component-guide.md

```markdown
# UI组件使用指南

## 概述

本项目统一使用 **uView 2.x** 作为UI组件库，禁止混用uni-ui组件。

## 为什么选择uView？

1. **组件丰富**: 80+ 精美组件
2. **文档完善**: 详细的API文档和示例
3. **样式美观**: 现代化设计风格
4. **Vue 2兼容**: 完美支持uni-app + Vue 2
5. **社区活跃**: 持续维护更新

## 安装与配置

已在项目中完成配置，无需额外操作。

### 引入方式（easycom自动引入）

```vue
<template>
  <u-button type="primary">按钮</u-button>
</template>

<!-- 无需import，自动引入 -->
```

## 常用组件清单

### 基础组件

| 组件 | 用途 | 示例 |
|------|------|------|
| u-button | 按钮 | `<u-button type="primary">按钮</u-button>` |
| u-icon | 图标 | `<u-icon name="home" size="32"></u-icon>` |
| u-image | 图片 | `<u-image :src="url" mode="aspectFill"></u-image>` |
| u-text | 文本 | `<u-text text="内容"></u-text>` |

### 表单组件

| 组件 | 用途 | 示例 |
|------|------|------|
| u-input | 输入框 | `<u-input v-model="value" placeholder="请输入"></u-input>` |
| u-textarea | 文本域 | `<u-textarea v-model="content"></u-textarea>` |
| u-checkbox | 复选框 | `<u-checkbox v-model="checked"></u-checkbox>` |
| u-radio | 单选框 | `<u-radio v-model="value"></u-radio>` |
| u-switch | 开关 | `<u-switch v-model="enabled"></u-switch>` |

### 反馈组件

| 组件 | 用途 | 示例 |
|------|------|------|
| u-toast | 轻提示 | `this.$u.toast('提示信息')` |
| u-modal | 模态框 | `<u-modal v-model="show"></u-modal>` |
| u-popup | 弹出层 | `<u-popup v-model="show"></u-popup>` |
| u-loading | 加载中 | `<u-loading mode="circle"></u-loading>` |

### 展示组件

| 组件 | 用途 | 示例 |
|------|------|------|
| u-avatar | 头像 | `<u-avatar :src="url" size="80"></u-avatar>` |
| u-badge | 徽标 | `<u-badge count="99"></u-badge>` |
| u-card | 卡片 | `<u-card title="标题"></u-card>` |
| u-tag | 标签 | `<u-tag text="标签"></u-tag>` |

## 样式定制

### 主题变量

在 `uni.scss` 中可覆盖uView主题变量:

```scss
/* 主色调 */
$u-primary: #007AFF;
$u-success: #19be6b;
$u-warning: #ff9900;
$u-error: #fa3534;

/* 文本颜色 */
$u-main-color: #303133;
$u-content-color: #606266;
$u-tips-color: #909399;
```

### 自定义样式

```vue
<u-button class="custom-button">按钮</u-button>

<style scoped>
.custom-button {
  /* 自定义样式 */
}
</style>
```

## 禁止使用的组件

以下uni-ui组件**禁止使用**，请使用uView替代:

| 禁止 | 替代 | 原因 |
|------|------|------|
| uni-popup | u-popup | uView功能更强 |
| uni-icon | u-icon | uView图标库更丰富 |
| uni-input | u-input | uView样式更美观 |
| uni-button | u-button | uView类型更多 |

## 常见问题

### Q: 如何使用自定义图标？

```vue
<u-icon :custom-style="{backgroundImage: 'url(...)'}" size="32"></u-icon>
```

### Q: 如何调整组件样式？

1. 使用组件的props（推荐）
2. 使用custom-style属性
3. 使用scoped样式覆盖

### Q: 检查脚本如何运行？

```bash
node tools/check-ui-consistency.js
```

## 参考资料

- [uView官方文档](https://www.uviewui.com/)
- [uView组件库](https://www.uviewui.com/components/intro.html)
- [uView更新日志](https://www.uviewui.com/components/changelog.html)

---

**更新日期**: 2025-10-12  
**维护人**: 前端团队
```

**说明**: UI组件使用文档，供团队参考

---

## 五、变更总结

### 修改文件统计

- **配置文件**: 5个 (package.json, main.js, pages.json, uni.scss, App.vue)
- **业务文件**: 0个 (无需修改，仅验证)
- **新建文件**: 4个 (check-ui-consistency.js, .eslintrc.js, .prettierrc.js, ui-component-guide.md)
- **工具脚本**: 1个

### 代码行数统计

- **新增代码**: ~400行
- **修改代码**: ~20行
- **删除代码**: 0行

---

## 六、构建验证

### 安装依赖

```bash
npm install
```

### 运行检查脚本

```bash
node tools/check-ui-consistency.js
```

**预期输出**:
```
===== UI组件库一致性检查 =====

✅ uView已安装: ^2.0.36
扫描文件数: 45

===== 检查结果 =====

✅ 正常文件: 45
⚠️  警告文件: 0
❌ 错误文件: 0

uView组件 (5个):
  - u-button
  - u-icon
  - u-input
  - u-popup
  - u-switch

✅ 检查通过
```

### 开发环境启动

```bash
npm run dev:mp-weixin
```

### 生产构建

```bash
npm run build:mp-weixin
```

---

**变更状态**: ✅ 已完成  
**测试状态**: 待测试  
**审核人**: _______

