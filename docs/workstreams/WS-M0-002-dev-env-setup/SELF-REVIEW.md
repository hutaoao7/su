# WS-M0-002: 自检清单 (SELF-REVIEW)

**工作流ID**: WS-M0-002  
**审核人**: _______  
**审核日期**: _______

---

## 一、工程硬约束检查（必须全部✅）

### 1.1 构建检查
- [ ] ✅ **构建 0 报错**
  ```bash
  npm run build:mp-weixin
  # 预期: Build complete. 无error
  ```

### 1.2 UI组件库统一
- [ ] ✅ **uView 2.x 唯一**
  ```bash
  npm run check:ui
  # 预期: ✅ 检查通过
  ```

### 1.3 Node环境检查
- [ ] ✅ **Node 16 CJS**
  ```bash
  npm run check:engines
  # 预期: ✅ Node 16.x.x
  ```
  ```bash
  npm run check:esm
  # 预期: ✅ 所有云函数使用CJS
  ```

### 1.4 数据路径检查
- [ ] ✅ **前端不直连 Supabase**
  ```bash
  npm run check:supabase
  # 预期: ✅ 无直连
  ```

### 1.5 密钥安全检查
- [ ] ✅ **无明文密钥**
  ```bash
  npm run lint
  # 预期: 无 no-restricted-syntax 关于 API Key 的error
  ```

### 1.6-1.9 其他约束
- [ ] ✅ 语音不落盘：N/A（本工作流不涉及）
- [ ] ✅ 首包 ≤2MB：构建后验证
- [ ] ✅ 关键路径 P95 ≤800ms：N/A（本工作流不影响性能）
- [ ] ✅ 回归脚本通过
  ```bash
  ./test-ws-m0-002.sh
  # 预期: ✅ 所有检查通过
  ```

---

## 二、代码质量检查

### 2.1 ESLint规则
- [ ] **ESLint检查通过**
  ```bash
  npm run lint
  ```
  - 0 errors: ⬜ 是
  - Warnings < 20: ⬜ 是（旧代码warnings可接受）

### 2.2 规则完整性
- [ ] **工程硬约束规则**
  - 禁止Supabase直连: ⬜ 已配置
  - 禁止service_role: ⬜ 已配置
  - 禁止明文API Key: ⬜ 已配置

- [ ] **Vue组件规范**
  - 组件命名: ⬜ 已配置
  - Prop规范: ⬜ 已配置
  - 未使用组件警告: ⬜ 已配置

- [ ] **代码质量规则**
  - 禁止var: ⬜ 已配置
  - 必须===: ⬜ 已配置
  - prefer-const: ⬜ 已配置

### 2.3 检查脚本
- [ ] **check-engines.js**
  - 可正常运行: ⬜ 是
  - 检查Node版本: ⬜ 是
  - 检查依赖: ⬜ 是

- [ ] **check-supabase-direct.js**
  - 可正常运行: ⬜ 是
  - 正确识别违规: ⬜ 是
  - 无误报: ⬜ 是

- [ ] **check-esm-in-cloudfunctions.js**
  - 可正常运行: ⬜ 是
  - 正确识别ESM: ⬜ 是
  - 无误报: ⬜ 是

### 2.4 格式化
- [ ] **Prettier配置**
  - 配置正确: ⬜ 是
  - 可正常格式化: ⬜ 是
  - .prettierignore正确: ⬜ 是

### 2.5 EditorConfig
- [ ] **EditorConfig配置**
  - 配置正确: ⬜ 是
  - 编辑器生效: ⬜ 是

---

## 三、功能完整性检查

### 3.1 配置文件
- [ ] **.eslintrc.js完善**
  - 8项规则组完整: ⬜ 是
  - 工程硬约束规则: ⬜ 是
  - Vue组件规范: ⬜ 是
  - 代码质量规则: ⬜ 是

- [ ] **.eslintignore创建**
  - 排除node_modules: ⬜ 是
  - 排除构建产物: ⬜ 是

- [ ] **.editorconfig创建**
  - 配置完整: ⬜ 是

- [ ] **.prettierignore创建**
  - 配置完整: ⬜ 是

### 3.2 检查脚本
- [ ] **3个检查脚本完成**
  - check-engines.js: ⬜ 完成
  - check-supabase-direct.js: ⬜ 完成
  - check-esm-in-cloudfunctions.js: ⬜ 完成

### 3.3 package.json scripts
- [ ] **9个命令添加**
  - lint: ⬜ 是
  - lint:fix: ⬜ 是
  - format: ⬜ 是
  - format:check: ⬜ 是
  - check:engines: ⬜ 是
  - check:ui: ⬜ 是
  - check:supabase: ⬜ 是
  - check:esm: ⬜ 是
  - check:all: ⬜ 是

### 3.4 文档
- [ ] **docs/README-DEV.md创建**
  - 环境搭建: ⬜ 完整
  - 开发规范: ⬜ 完整
  - 常用命令: ⬜ 完整
  - 常见问题: ⬜ 完整

---

## 四、测试覆盖检查

### 4.1 ESLint规则测试
- [ ] **工程硬约束测试**
  - 禁止Supabase直连: ⬜ 已测试
  - 禁止service_role: ⬜ 已测试
  - 禁止明文API Key: ⬜ 已测试

- [ ] **Vue组件规范测试**
  - 组件命名: ⬜ 已测试
  - Prop类型: ⬜ 已测试

- [ ] **代码质量测试**
  - 禁止var: ⬜ 已测试
  - 必须===: ⬜ 已测试

### 4.2 检查脚本测试
- [ ] **check-engines.js测试**
  - 正常场景: ⬜ 通过
  - 异常场景: ⬜ 正确报错

- [ ] **check-supabase-direct.js测试**
  - 无违规: ⬜ 通过
  - 有违规: ⬜ 正确报错

- [ ] **check-esm-in-cloudfunctions.js测试**
  - 全部CJS: ⬜ 通过
  - 存在ESM: ⬜ 正确报错

### 4.3 集成测试
- [ ] **完整工作流测试**
  - 所有命令可运行: ⬜ 是
  - check:all通过: ⬜ 是
  - 构建成功: ⬜ 是

---

## 五、文档完整性检查

### 5.1 五件套文档
- [ ] **README.md**: ⬜ 完整
- [ ] **PLAN.md**: ⬜ 完整
- [ ] **PATCH.md**: ⬜ 完整
- [ ] **TESTS.md**: ⬜ 完整
- [ ] **SELF-REVIEW.md**（本文档）: ⬜ 完整
- [ ] **ROLLBACK.md**: ⬜ 待创建

### 5.2 开发文档
- [ ] **docs/README-DEV.md**: ⬜ 完整清晰

### 5.3 代码注释
- [ ] **检查脚本注释**: ⬜ 完整
- [ ] **ESLint规则注释**: ⬜ 完整

---

## 六、Git提交检查

### 6.1 分支管理
- [ ] **分支命名正确**
  - 分支名: ⬜ `feat/WS-M0-002-dev-env-setup`

### 6.2 提交信息
- [ ] **Commit信息规范**
  ```
  feat(WS-M0-002): 完善开发环境配置与规范
  
  - 完善ESLint配置（8项规则组）
  - 新增3个检查脚本
  - 配置EditorConfig和Prettier
  - 添加package.json scripts
  - 编写开发指南文档
  ```

### 6.3 文件变更
- [ ] **变更文件合理**
  - 无多余文件: ⬜ 是
  - 无调试代码: ⬜ 是
  - 无console.log（除检查脚本）: ⬜ 是

---

## 七、验收标准（最终确认）

### 7.1 核心目标
- [ ] ✅ ESLint配置完善（8项规则组）
- [ ] ✅ 3个检查脚本可运行
- [ ] ✅ 开发指南文档完整
- [ ] ✅ package.json scripts配置
- [ ] ✅ EditorConfig配置

### 7.2 质量标准
- [ ] ✅ npm run check:all 通过
- [ ] ✅ npm run lint 0 errors
- [ ] ✅ 构建 0 报错
- [ ] ✅ 文档清晰完整

### 7.3 团队准备
- [ ] ✅ 团队可理解规范
- [ ] ✅ 文档易于查阅
- [ ] ✅ 工具易于使用

---

## 八、自检结论

### 8.1 检查结果
**工程硬约束（9项）**: ___ / 9 ✅  
**代码质量**: ___ / 5 ✅  
**功能完整性**: ___ / 4 ✅  
**测试覆盖**: ___ / 3 ✅  
**文档完整性**: ___ / 3 ✅  

**总计**: ___ / 24 ✅

### 8.2 最终结论
- [ ] ✅ **通过** - 可以提交PR
- [ ] ⚠️ **有问题** - 需修复
- [ ] ❌ **不通过** - 需重新开发

### 8.3 发现问题清单
| 编号 | 问题描述 | 优先级 | 状态 |
|------|----------|--------|------|
| 1 | | P_ | 待修复 |

---

## 九、审核签字

### 自检人
- **姓名**: _______
- **日期**: _______
- **结论**: [ ] 通过  [ ] 有问题

### Code Review人
- **姓名**: _______
- **日期**: _______
- **结论**: [ ] 通过  [ ] 有问题

### Tech Lead审批
- **姓名**: _______
- **日期**: _______
- **批准合并**: [ ] 是  [ ] 否

---

**自检状态**: 待完成  
**最后更新**: _______

