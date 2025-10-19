# WS-M0-002: 回滚方案 (ROLLBACK)

**工作流ID**: WS-M0-002  
**分支**: `feat/WS-M0-002-dev-env-setup`  
**风险等级**: 低（配置文件和工具脚本，无业务逻辑）

---

## 一、回滚触发条件

### 1.1 必须回滚场景（P0）
- [ ] ESLint规则导致大量旧代码报错，严重阻碍开发
- [ ] 检查脚本误报严重，无法通过CI
- [ ] Git hooks导致无法提交代码

### 1.2 可选回滚场景（P1-P2）
- [ ] 个别ESLint规则过严（可单独调整）
- [ ] 检查脚本有小问题（可修复）
- [ ] 团队适应需要时间（可培训）

---

## 二、回滚方案

### 方案A：完全回滚（不推荐）
**适用场景**: ESLint导致严重问题

**步骤**:
1. 删除新增配置文件
2. 删除检查脚本
3. 恢复package.json

**预计时间**: 30min

---

### 方案B：部分回滚（推荐）
**适用场景**: 仅个别规则有问题

**步骤**:
1. 保留配置文件
2. 调整问题规则
3. 配置.eslintignore排除旧代码

**预计时间**: 15min

---

### 方案C：延迟生效
**适用场景**: 团队需要适应时间

**步骤**:
1. 保留所有配置
2. 规则级别改为warn
3. 逐步提升为error

**预计时间**: 10min

---

## 三、完全回滚步骤（方案A）

### Step 1: 备份当前状态
```bash
git checkout -b backup/WS-M0-002-rollback-$(date +%Y%m%d-%H%M)
```

### Step 2: 删除新增文件
```bash
# 删除检查脚本
rm tools/check-supabase-direct.js
rm tools/check-esm-in-cloudfunctions.js

# 删除配置文件
rm .eslintignore
rm .editorconfig
rm .prettierignore

# 删除文档
rm docs/README-DEV.md
```

### Step 3: 恢复.eslintrc.js
```diff
 module.exports = {
   root: true,
   env: { browser: true, es2021: true, node: true },
   extends: ['plugin:vue/essential', 'eslint:recommended'],
   rules: {
-    // 移除新增的规则
-    'no-restricted-imports': ...
-    'no-restricted-syntax': ...
     // 保留基础规则
     'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
     ...
   }
 };
```

### Step 4: 恢复package.json
```diff
 {
   "scripts": {
-    "lint": ...,
-    "lint:fix": ...,
-    "check:engines": ...,
-    // 移除新增的scripts
   }
 }
```

### Step 5: 提交回滚
```bash
git add .
git commit -m "Revert: WS-M0-002 开发环境配置

原因: [填写回滚原因]

变更:
- 删除检查脚本
- 恢复ESLint配置
- 恢复package.json
"
```

---

## 四、部分回滚步骤（方案B）

### 场景1: ESLint规则过严

**问题**: 旧代码报错太多

**解决**:

#### 方法1: 配置.eslintignore
```
# .eslintignore
node_modules/
unpackage/

# 旧代码（逐步迁移）
pages/old/**
components/old/**
```

#### 方法2: 调整规则级别
```javascript
// .eslintrc.js
rules: {
  // 从 error 改为 warn
  'no-var': 'warn', // 原 'error'
  'prefer-const': 'warn', // 原 'error'
}
```

#### 方法3: 禁用特定规则
```javascript
// .eslintrc.js
rules: {
  // 暂时关闭
  'vue/require-prop-types': 'off',
}
```

---

### 场景2: 检查脚本误报

**问题**: check-supabase-direct.js误报

**解决**:

#### 添加白名单
```javascript
// tools/check-supabase-direct.js
const CONFIG = {
  ...
  whitelist: [
    'utils/supabase-types.d.ts', // 类型定义文件
    'docs/examples/**', // 示例代码
  ],
};
```

#### 修复检测逻辑
```javascript
// 更精确的正则表达式
const supabaseImport = /@supabase\/supabase-js/gi; // 更精确
```

---

### 场景3: Git hooks影响效率

**问题**: pre-commit太慢

**解决**:

#### 移除Git hooks
```bash
rm -rf .husky
```

#### 或优化hooks
```javascript
// .husky/pre-commit
# 仅检查staged文件
npx lint-staged
```

---

## 五、延迟生效步骤（方案C）

### Step 1: 规则降级为warn

```javascript
// .eslintrc.js
rules: {
  // 所有error改为warn
  'no-var': 'warn',
  'prefer-const': 'warn',
  'vue/require-prop-types': 'warn',
  ...
}
```

### Step 2: 通知团队

```markdown
## 规范生效计划

- **Week 1-2**: 所有规则为warn，可提交
- **Week 3-4**: 部分规则升级为error
- **Week 5+**: 所有规则为error

### 当前状态（Week 1）
- 规则级别: warn
- 新代码: 建议遵守规范
- 旧代码: 逐步修复

### 下一步（Week 3）
- 升级为error的规则:
  1. no-var
  2. prefer-const
  3. eqeqeq
```

### Step 3: 逐步升级

```javascript
// Week 3
rules: {
  'no-var': 'error', // warn → error
  'prefer-const': 'error',
  'eqeqeq': ['error', 'always'],
  // 其他保持warn
}

// Week 5
rules: {
  // 全部升级为error
}
```

---

## 六、回滚验证清单

### 6.1 功能验证
- [ ] 代码可正常提交
- [ ] 构建成功
- [ ] 开发流程不受影响

### 6.2 团队验证
- [ ] 团队成员可正常开发
- [ ] 无阻塞性问题

---

## 七、预防措施（未来）

### 7.1 规范制定
- [ ] 规范讨论充分
- [ ] 团队达成共识
- [ ] 分阶段引入

### 7.2 工具开发
- [ ] 充分测试脚本
- [ ] 提供白名单配置
- [ ] 避免误报

### 7.3 团队培训
- [ ] 规范说明会
- [ ] 文档易于理解
- [ ] 及时答疑

---

## 八、联系人

### 技术支持
- **前端Lead**: _______
- **Tech Lead**: _______

### 紧急联系
- **项目经理**: _______

---

**回滚方案状态**: 已准备  
**最后更新**: 2025-10-12  
**审核人**: _______

