# 翎心（CraneHeart）开发指南

## 环境要求

- **Node.js**: 16.x LTS（⚠️ 当前系统为24.x，需切换）
- **npm**: 8.x+
- **HBuilderX**: 4.x+（可选，推荐使用VSCode）

## 快速开始

### 1. 克隆项目

已在本地，跳过此步

### 2. 切换Node版本（重要）

```powershell
# 如果安装了nvm for Windows
nvm install 16
nvm use 16

# 验证版本
node -v
# 应显示: v16.x.x
```

### 3. 安装依赖

```powershell
npm install
```

### 4. 环境检查

```powershell
npm run check:engines
```

### 5. 运行开发环境

```powershell
# 微信小程序
npm run dev:mp-weixin

# H5
npm run dev:h5
```

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

```
feat: 新功能
fix: 修复Bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
test: 测试
chore: 构建/工具变更
```

示例:
```bash
git commit -m "feat(login): 添加微信登录功能"
git commit -m "fix(scale): 修复量表评分错误"
```

---

## 常用命令

### 代码检查

```powershell
# ESLint检查
npm run lint

# 自动修复
npm run lint:fix

# 全部检查
npm run check:all
```

### 构建

```powershell
# 微信小程序
npm run build:mp-weixin

# H5
npm run build:h5
```

### 测试

```powershell
# 环境检查
npm run check:engines

# UI一致性检查
npm run check:ui

# Supabase直连检查
npm run check:supabase

# ESM检查
npm run check:esm
```

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
```powershell
nvm install 16
nvm use 16
```

### Q2: ESLint报错太多？

分批修复:
```powershell
# 仅检查当前修改的文件
git diff --name-only | ForEach-Object { npx eslint $_ }
```

### Q3: 如何临时跳过检查？

```javascript
// eslint-disable-next-line no-console
console.log('临时调试');
```

---

## 联系方式

- **技术问题**: 联系 Tech Lead
- **环境问题**: 查看本文档或提Issue

---

**最后更新**: 2025-10-12

