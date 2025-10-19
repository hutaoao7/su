# WS-M0-001: 回滚方案 (ROLLBACK)

**工作流ID**: WS-M0-001  
**分支**: `feat/WS-M0-001-ui-lib-unify`  
**风险等级**: 低（仅配置和依赖变更，无业务逻辑改动）

---

## 一、回滚触发条件

### 1.1 必须回滚场景（P0）

- [ ] uView与uni-app版本不兼容，导致构建失败
- [ ] 组件样式严重错位，影响核心功能
- [ ] 包体积超标严重（主包>3MB），无法优化
- [ ] 关键组件无法正常工作（u-popup、u-input等）
- [ ] 生产环境崩溃率>1%

### 1.2 可选回滚场景（P1-P2）

- [ ] 包体积增长>500KB但<1MB
- [ ] 个别页面样式微调需要时间
- [ ] 性能下降10%-20%（首屏加载）
- [ ] 团队成员不熟悉uView（可培训解决）

---

## 二、回滚方案概览

### 方案A：完全回滚（推荐）

**适用场景**: uView安装失败或严重不兼容

**回滚内容**:
1. 卸载uView依赖
2. 恢复配置文件
3. 将4个页面的u-组件替换为uni-ui组件

**预计时间**: 2-3h

**风险**: 低（回到初始状态）

---

### 方案B：部分回滚

**适用场景**: 仅个别页面有问题

**回滚内容**:
1. 保留uView安装
2. 仅回滚有问题的页面，使用uni-ui组件
3. 允许短期内uView和uni-ui共存

**预计时间**: 30min-1h

**风险**: 中（组件库混用）

---

### 方案C：降级方案

**适用场景**: 仅性能或包体积问题

**回滚内容**:
1. 保留uView
2. 配置按需引入，减小包体积
3. 调整分包策略

**预计时间**: 1-2h

**风险**: 低

---

## 三、完全回滚步骤（方案A）

### Step 1: 备份当前状态（5min）

```bash
# 创建回滚分支（保留现场）
git checkout -b backup/WS-M0-001-rollback-$(date +%Y%m%d-%H%M)

# 记录当前依赖版本
npm ls > backup-dependencies.txt

# 记录当前包大小
du -h unpackage/dist/ > backup-package-size.txt
```

---

### Step 2: 切换到主分支（1min）

```bash
# 回到工作流开始前的状态
git checkout main

# 或者回到分支创建前的commit
git log --oneline | head -20  # 找到WS-M0-001之前的commit
git checkout <commit-hash>
```

---

### Step 3: 卸载uView（5min）

#### 3.1 package.json

```diff
 {
   "dependencies": {
     "vue": "^2.6.11",
     "vuex": "^3.2.0",
-    "uview-ui": "^2.0.36"
   }
 }
```

#### 3.2 执行卸载

```bash
npm uninstall uview-ui

# 清理node_modules（可选，确保干净）
rm -rf node_modules package-lock.json
npm install
```

---

### Step 4: 恢复配置文件（10min）

#### 4.1 main.js

```diff
 import Vue from 'vue'
 import App from './App'
-import uView from 'uview-ui'
-
-Vue.use(uView)
 
 Vue.config.productionTip = false
 
 App.mpType = 'app'
 
 const app = new Vue({
   ...App
 })
 app.$mount()
```

---

#### 4.2 pages.json

```diff
 {
   "pages": [...],
-  "easycom": {
-    "autoscan": true,
-    "custom": {
-      "^u-(.*)": "uview-ui/components/u-$1/u-$1.vue"
-    }
-  },
   "globalStyle": {...},
   "tabBar": {...}
 }
```

---

#### 4.3 uni.scss

```diff
-/* uView主题变量 */
-@import 'uview-ui/theme.scss';
-
 /* 全局样式变量 */
 $uni-bg-color: #F0F0F5;
 $uni-text-color: #333;
```

---

#### 4.4 App.vue

```diff
 <style>
-@import 'uview-ui/index.scss';
-
 html, body, #app, page { 
   background: #fff !important; 
   height: 100%;
   margin: 0;
   padding: 0;
 }
 ...
 </style>
```

---

### Step 5: 替换页面组件（60-90min）

#### 5.1 pages/user/home.vue

**u-popup → uni-popup**

```diff
+<script>
+import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
+export default {
+  components: { uniPopup },
+  ...
+}
+</script>

 <template>
-  <u-popup v-model="showSubscriptionPopup" mode="bottom" height="60%" border-radius="24">
+  <uni-popup ref="subscriptionPopup" type="bottom" :safe-area="true">
     <view class="popup-content">
       ...
     </view>
-  </u-popup>
+  </uni-popup>
 </template>
```

**u-switch → switch（原生）**

```diff
-<u-switch v-model="subscription.enabled" @change="handleSwitchChange(subscription)"></u-switch>
+<switch :checked="subscription.enabled" @change="handleSwitchChange(subscription)"></switch>
```

**u-button → button（原生）**

```diff
-<u-button type="primary" @click="saveSettings">保存</u-button>
+<button class="btn-primary" @click="saveSettings">保存</button>
```

**补充样式**:

```vue
<style scoped>
.btn-primary {
  background-color: #007AFF;
  color: #fff;
  border-radius: 8px;
  padding: 12px 24px;
  border: none;
}

switch {
  transform: scale(0.9);
}
</style>
```

---

#### 5.2 pages/features/features.vue

**u-icon → uni-icons**

```diff
+<script>
+import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
+export default {
+  components: { uniIcons },
+  ...
+}
+</script>

 <template>
   <view class="card-icon">
-    <u-icon :name="card.icon" size="32" :color="card.iconColor"></u-icon>
+    <uni-icons :type="card.icon" size="32" :color="card.iconColor"></uni-icons>
   </view>
 </template>
```

**图标名称映射**:

```javascript
// data中需要修改图标名称
assessmentCards: [
  {
    icon: 'compose', // 原 file-text
    ...
  },
  {
    icon: 'person', // 原 account
    ...
  },
  {
    icon: 'moon', // 保持不变
    ...
  },
  {
    icon: 'heart', // 保持不变
    ...
  }
]
```

---

#### 5.3 components/scale/ScaleRunner.vue

**u-input → uni-easyinput**

```diff
+<script>
+import uniEasyinput from '@/uni_modules/uni-easyinput/components/uni-easyinput/uni-easyinput.vue';
+export default {
+  components: { uniEasyinput },
+  ...
+}
+</script>

 <template>
-  <u-input 
+  <uni-easyinput 
     v-model="timeInput"
     type="text"
     placeholder="请输入时间，如: 23:30"
     @blur="handleTimeInput"
     class="time-input"
-  />
+  ></uni-easyinput>
 </template>
```

**u-button → button（原生）**

```diff
-<u-button type="primary" @click="handleNext">{{ isLastQuestion ? '提交' : '下一题' }}</u-button>
+<button class="btn-primary" @click="handleNext">{{ isLastQuestion ? '提交' : '下一题' }}</button>
```

---

#### 5.4 pages/cdk/redeem.vue

**同5.3的修改方式**

```diff
+<script>
+import uniEasyinput from '@/uni_modules/uni-easyinput/components/uni-easyinput/uni-easyinput.vue';
+export default {
+  components: { uniEasyinput },
+  ...
+}
+</script>

 <template>
-  <u-input 
+  <uni-easyinput 
     v-model="cdkCode"
     placeholder="请输入16位CDK码"
     maxlength="16"
-  />
+  ></uni-easyinput>
 </template>
```

---

### Step 6: 删除新建文件（5min）

```bash
# 删除检查脚本
rm tools/check-ui-consistency.js

# 删除ESLint配置（如果是新建的）
rm .eslintrc.js
rm .prettierrc.js

# 删除文档
rm docs/ui-component-guide.md

# 删除工作流文档（可选保留作为记录）
# rm -rf docs/workstreams/WS-M0-001-ui-lib-unify/
```

---

### Step 7: 测试验证（30min）

```bash
# 1. 构建测试
npm run build:mp-weixin

# 2. 启动开发环境
npm run dev:mp-weixin

# 3. 逐个页面验证
# - pages/user/home.vue
# - pages/features/features.vue
# - components/scale/ScaleRunner.vue
# - pages/cdk/redeem.vue

# 4. 功能回归测试
# - 登录流程
# - 评估流程
# - 用户中心
```

---

### Step 8: 提交回滚（10min）

```bash
git add .
git commit -m "Revert: WS-M0-001 UI组件库统一

原因: [填写回滚原因]
- uView与uni-app版本不兼容
- 构建失败/组件无法使用
- ...

变更:
- 卸载uView 2.x
- 恢复配置文件
- 4个页面组件替换为uni-ui
- 删除相关工具和文档

测试:
- 构建通过
- 4个页面功能正常
- 回归测试通过"

# 推送到远程
git push origin main
```

---

## 四、部分回滚步骤（方案B）

### 适用场景

仅个别页面有问题，其他页面uView工作正常。

### 回滚步骤

#### Step 1: 保留uView安装和配置

**不执行**:
- ❌ 不卸载uView
- ❌ 不修改main.js、pages.json等配置

#### Step 2: 仅回滚有问题的页面

例如，仅 `pages/user/home.vue` 有问题:

```vue
<script>
// 引入uni-popup
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';

export default {
  components: { uniPopup },
  // ... 其他不变
}
</script>

<template>
  <!-- 使用uni-popup替代u-popup -->
  <uni-popup ref="subscriptionPopup" type="bottom">
    ...
  </uni-popup>
</template>
```

#### Step 3: 更新检查脚本白名单

```javascript
// tools/check-ui-consistency.js
const CONFIG = {
  ...
  whitelist: [
    'uni-app',
    'uni.',
    'pages/user/home.vue', // 临时白名单
  ],
};
```

#### Step 4: 标记技术债

```markdown
## 技术债

- [ ] pages/user/home.vue 使用uni-popup（临时方案）
- [ ] 待uView问题解决后统一替换
- [ ] 跟踪Issue: #123
```

---

## 五、降级方案（方案C）

### 适用场景

uView可用，但包体积或性能问题。

### 优化步骤

#### Step 1: 配置按需引入

修改 `main.js`:

```javascript
// 不使用Vue.use(uView)全量引入
// 改为按需引入
import { Button, Input, Popup, Icon, Switch } from 'uview-ui';

Vue.component('u-button', Button);
Vue.component('u-input', Input);
Vue.component('u-popup', Popup);
Vue.component('u-icon', Icon);
Vue.component('u-switch', Switch);
```

#### Step 2: 调整分包策略

修改 `pages.json`:

```json
{
  "pages": [...],
  "subPackages": [
    {
      "root": "pagesA",
      "pages": [
        { "path": "user/home" },
        { "path": "cdk/redeem" }
      ]
    }
  ],
  "preloadRule": {
    "pages/home/home": {
      "network": "wifi",
      "packages": ["pagesA"]
    }
  }
}
```

#### Step 3: 移除未使用组件

检查并移除项目中未使用的uView组件。

---

## 六、回滚验证清单

### 6.1 构建验证

- [ ] 开发环境构建成功
- [ ] 生产环境构建成功
- [ ] 无构建错误
- [ ] 无Critical Warning

### 6.2 功能验证

- [ ] pages/user/home.vue 功能正常
- [ ] pages/features/features.vue 功能正常
- [ ] components/scale/ScaleRunner.vue 功能正常
- [ ] pages/cdk/redeem.vue 功能正常
- [ ] 登录流程正常
- [ ] 评估流程正常
- [ ] 历史记录查询正常

### 6.3 样式验证

- [ ] 弹窗样式正常
- [ ] 开关样式正常
- [ ] 图标显示正常
- [ ] 输入框样式正常
- [ ] 按钮样式正常

### 6.4 性能验证

- [ ] 首屏加载时间<2s
- [ ] 包体积恢复到回滚前水平
- [ ] 无明显卡顿

---

## 七、回滚后处理

### 7.1 通知相关人员

```markdown
## 回滚通知

**工作流**: WS-M0-001 UI组件库统一  
**回滚原因**: [填写原因]  
**回滚时间**: [时间]  
**回滚人**: [姓名]  
**当前状态**: 已回滚到[commit hash]

**影响范围**:
- uView已卸载，恢复使用uni-ui
- 4个页面组件已替换
- 构建和功能测试通过

**后续计划**:
- [ ] 分析根本原因
- [ ] 制定新方案
- [ ] 重新评估工作流

**相关链接**:
- 回滚PR: #___
- 问题Issue: #___
```

### 7.2 记录回滚原因

在 `docs/retrospectives/WS-M0-001-rollback.md` 记录:

```markdown
# WS-M0-001 回滚复盘

## 基本信息
- 回滚时间: ___
- 回滚原因: ___
- 影响范围: ___

## 问题分析
1. 根本原因: ___
2. 直接原因: ___
3. 触发条件: ___

## 教训总结
1. ___
2. ___

## 改进措施
1. ___
2. ___

## 新方案
- [ ] 方案A: ___
- [ ] 方案B: ___
```

### 7.3 更新任务状态

在项目管理工具（TAPD/Jira）中:
- 将WS-M0-001状态改为 "已回滚"
- 创建新任务（如需要）
- 关联问题Issue

---

## 八、回滚风险评估

| 风险项 | 可能性 | 影响 | 缓解措施 |
|--------|--------|------|----------|
| 回滚后功能异常 | 低 | 高 | 充分回归测试 |
| 样式错位 | 中 | 中 | 手动调整样式 |
| 包体积反弹 | 低 | 低 | uni-ui也轻量 |
| 团队时间浪费 | 低 | 中 | 复盘总结经验 |

---

## 九、预防措施（未来）

### 9.1 技术选型

- [ ] 充分调研组件库兼容性
- [ ] 小范围试点验证
- [ ] 准备多个备选方案

### 9.2 开发流程

- [ ] 新建feature分支验证
- [ ] 提前准备回滚脚本
- [ ] 灰度发布策略

### 9.3 测试策略

- [ ] 完善自动化测试
- [ ] 多环境兼容性测试
- [ ] 性能基准测试

---

## 十、联系人

### 技术支持

- **前端Lead**: _______
- **Tech Lead**: _______

### 紧急联系

- **项目经理**: _______
- **值班电话**: _______

---

**回滚方案状态**: 已准备  
**最后更新**: 2025-10-12  
**审核人**: _______

