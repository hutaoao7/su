# WS-M1-W3-004: CDK兑换 - 完整五件套

**工作流ID**: WS-M1-W3-004 | **工时**: 4h | **复用验证**

**触点文件**: 
- pages/cdk/redeem.vue (已实现)
- cdk-redeem/index.js (云函数，已实现)
- cdk-verify/index.js (云函数，已实现)

**PATCH**: ✅ 无修改（复用验证）

**验证内容**:
1. redeem.vue使用u-input（依赖WS-M0-001）
2. CDK输入验证（16位）
3. 实时校验CDK有效性
4. 兑换成功提示

**TESTS**: 自动化+8个手动用例（正常兑换/无效CDK/已使用CDK/过期CDK）

**DoD**: ✅ 构建0报错, uView组件, 兑换流程完整, 云函数CJS

**ROLLBACK**: 恢复redeem.vue（如有修改）

**状态**: ✅ 完整（复用为主）

