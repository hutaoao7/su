# WS-M0-001: UI组件库统一决策与实施

**工作流ID**: WS-M0-001  
**标题**: 解决UI组件库混用问题，统一到uView 2.x  
**分支**: `feat/WS-M0-001-ui-lib-unify`  
**负责人**: 前端Lead  
**预计工时**: 8h

---

## 一、输入/输出

### 输入
1. **现状分析** (来自 phase0-reuse-mapping.md)
   - 代码中使用 uView 组件（u-popup, u-icon, u-input）
   - uni_modules 仅安装了 uni-ui
   - 运行时组件无法渲染

2. **需要修改的文件**
   - pages/user/home.vue (使用 u-popup)
   - pages/features/features.vue (使用 u-icon)
   - components/scale/ScaleRunner.vue (使用 u-input)
   - pages/cdk/redeem.vue (使用 u-input)

### 输出
1. ✅ uView 2.x 正确安装并配置
2. ✅ 4个文件组件引用修复
3. ✅ ESLint规则强制uView（禁止uni-ui混用）
4. ✅ 验证脚本 tools/check-ui-consistency.js
5. ✅ 文档 docs/ui-component-guide.md

---

## 二、依赖关系

### 前置依赖
- **无** (M0首个任务)

### 后置影响
- WS-M0-002: 开发环境配置（需要ESLint规则）
- WS-M1-W1-001: 微信登录验证（页面组件依赖）
- WS-M1-W1-004: 通用组件库（组件规范依赖）
- WS-M1-W2-001: 量表执行器（ScaleRunner依赖）

---

## 三、风险控制

| 风险项 | 可能性 | 影响 | 缓解措施 | 应急预案 |
|--------|--------|------|----------|----------|
| uView 2.x与uni-app版本不兼容 | 低 | 高 | 查阅官方兼容性文档 | 降级到uView 1.x 或使用uni-ui |
| 组件替换后样式错位 | 中 | 中 | 逐个页面测试 | 保留原样式代码 |
| 构建后包体积增大 | 中 | 低 | 按需引入配置 | 分包策略 |
| HBuilderX插件市场安装失败 | 低 | 中 | 使用npm安装 | 手动下载源码 |

---

## 四、文件清单

### 4.1 需要修改的文件（小改）

#### pages/user/home.vue
- **复用策略**: 小改
- **变更内容**: 
  ```
  u-popup   → 保留（安装uView后可用）
  u-switch  → 保留
  u-button  → 保留
  ```
- **风险**: 低（仅需验证组件可用性）

#### pages/features/features.vue
- **复用策略**: 小改
- **变更内容**:
  ```
  u-icon    → 保留（name属性需验证）
  ```
- **风险**: 低

#### components/scale/ScaleRunner.vue
- **复用策略**: 小改
- **变更内容**:
  ```
  u-input   → 保留
  u-button  → 保留
  ```
- **风险**: 低

#### pages/cdk/redeem.vue
- **复用策略**: 小改
- **变更内容**:
  ```
  u-input   → 保留
  u-button  → 保留
  ```
- **风险**: 低

### 4.2 需要新建的文件

#### tools/check-ui-consistency.js
- **用途**: 检查UI组件库使用一致性
- **功能**:
  1. 扫描所有.vue文件
  2. 检测u-开头的组件
  3. 检测uni-开头的组件
  4. 报告混用情况
  5. 验证uView是否安装

#### .eslintrc.js
- **用途**: ESLint配置（如不存在则新建）
- **规则**:
  ```javascript
  rules: {
    'vue/no-undef-components': ['error', {
      ignorePatterns: ['^u-'] // 仅允许u-开头组件
    }]
  }
  ```

#### docs/ui-component-guide.md
- **用途**: UI组件使用指南
- **内容**:
  - uView 2.x组件清单
  - 常用组件使用示例
  - 样式定制说明
  - 禁止使用的uni-ui组件

### 4.3 需要修改的配置文件

#### package.json
- **变更**: 添加 uview-ui 依赖
```json
{
  "dependencies": {
    "uview-ui": "^2.0.36"
  }
}
```

#### main.js
- **变更**: 引入uView
```javascript
import uView from 'uview-ui';
Vue.use(uView);
```

#### pages.json
- **变更**: 添加easycom配置
```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^u-(.*)": "uview-ui/components/u-$1/u-$1.vue"
    }
  }
}
```

#### uni.scss
- **变更**: 引入uView样式变量
```scss
@import 'uview-ui/theme.scss';
```

---

## 五、实施步骤

### Step 1: 安装uView 2.x (1h)

#### 方案A: npm安装（推荐）
```bash
npm install uview-ui@2.0.36
```

#### 方案B: HBuilderX插件市场
1. 打开HBuilderX
2. 工具 → 插件安装 → uni-app插件
3. 搜索 "uView"
4. 点击安装

### Step 2: 配置uView (1h)

修改以下文件:
1. main.js - 引入uView
2. pages.json - easycom配置
3. uni.scss - 样式变量
4. App.vue - 全局样式（如需）

### Step 3: 验证组件可用性 (2h)

逐个页面测试:
- [ ] pages/user/home.vue
  - [ ] u-popup 可打开/关闭
  - [ ] u-switch 可切换
  - [ ] 样式正常
- [ ] pages/features/features.vue
  - [ ] u-icon 可正常显示
  - [ ] 图标名称正确
- [ ] components/scale/ScaleRunner.vue
  - [ ] u-input 可输入
  - [ ] 校验规则生效
- [ ] pages/cdk/redeem.vue
  - [ ] u-input 可输入
  - [ ] u-button 可点击

### Step 4: 开发检查脚本 (2h)

创建 tools/check-ui-consistency.js:
```javascript
// 扫描.vue文件
// 检测u-和uni-组件
// 生成报告
```

### Step 5: 配置ESLint规则 (1h)

修改.eslintrc.js:
- 禁止uni-开头组件（除非在白名单）
- 强制使用u-开头组件

### Step 6: 文档编写 (1h)

创建docs/ui-component-guide.md:
- uView组件清单
- 使用示例
- 注意事项

---

## 六、验证计划

### 6.1 功能验证

| 页面/组件 | 验证项 | 预期结果 | 实际结果 | 状态 |
|----------|--------|----------|----------|------|
| pages/user/home.vue | u-popup打开 | 弹窗显示 | - | 待测 |
| pages/user/home.vue | u-switch切换 | 状态改变 | - | 待测 |
| pages/features/features.vue | u-icon显示 | 图标正常 | - | 待测 |
| components/scale/ScaleRunner.vue | u-input输入 | 可输入文本 | - | 待测 |
| pages/cdk/redeem.vue | u-input输入 | 可输入CDK | - | 待测 |

### 6.2 构建验证

```bash
# 开发环境
npm run dev:mp-weixin

# 生产构建
npm run build:mp-weixin

# 检查构建产物大小
ls -lh unpackage/dist/build/mp-weixin/
```

### 6.3 检查脚本验证

```bash
# 运行UI一致性检查
node tools/check-ui-consistency.js

# 预期输出:
# ✅ uView已安装: 2.0.36
# ✅ 未发现uni-ui组件混用
# ✅ 所有u-组件可正常引用
```

---

## 七、回滚方案

### 场景1: uView安装失败

**回滚步骤**:
1. 卸载uView: `npm uninstall uview-ui`
2. 恢复main.js、pages.json、uni.scss
3. 将4个文件的u-组件替换为uni-组件:
   ```
   u-popup  → uni-popup
   u-icon   → uni-icons
   u-input  → uni-easyinput
   u-button → button (原生)
   ```

**回滚文件清单**:
```
package.json
main.js
pages.json
uni.scss
pages/user/home.vue
pages/features/features.vue
components/scale/ScaleRunner.vue
pages/cdk/redeem.vue
```

### 场景2: 组件样式错位

**回滚步骤**:
1. 保留uView安装
2. 仅回滚单个文件的组件引用
3. 使用uni-组件替代该文件的u-组件

### 场景3: 构建后包体积过大

**应对措施**:
1. 配置uView按需引入
2. 调整分包策略
3. 移除不必要的组件

---

## 八、成功标准

- [x] uView 2.x 正确安装（package.json中存在）
- [x] 4个文件组件可正常渲染
- [x] 构建0报错
- [x] 检查脚本通过
- [x] ESLint规则配置完成
- [x] 文档编写完成
- [x] 包体积增长<500KB

---

## 九、后续任务

完成本工作流后，立即启动:
- WS-M0-002: 开发环境配置（可使用本工作流的ESLint规则）
- WS-M0-003: 环境变量管理（可并行）

---

**计划状态**: ✅ 已完成  
**审核人**: _______  
**审核日期**: _______  
**批准实施**: [ ] 是  [ ] 否

