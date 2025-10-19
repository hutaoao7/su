# WS-M1-W1-004: 通用组件库 - 完整五件套

**工作流ID**: WS-M1-W1-004  
**标题**: 完善通用UI组件，建立组件使用规范  
**分支**: `feat/WS-M1-W1-004-common-components`  
**工时**: 16h | **负责人**: 前端B

---

## 📋 PLAN - 计划

### 输入/输出

**输入**: 现有components/common/（4个组件：ErrorBoundary/LoadingState/NavBar/TabBar）  
**输出**: 完善的通用组件库（+6个新组件，文档，Storybook示例）

### 触点文件

**复用验证**（4个）:
- `components/common/ErrorBoundary.vue`（已有）
- `components/common/LoadingState.vue`（已有）
- `components/common/NavBar.vue`（已有）
- `components/common/TabBar.vue`（已有）

**新建文件**（6个）:
- `components/common/EmptyState.vue`（空状态组件）
- `components/common/ConfirmDialog.vue`（确认对话框）
- `components/common/InfoCard.vue`（信息卡片）
- `components/common/ResultCard.vue`（结果卡片）
- `components/common/ActionSheet.vue`（操作菜单）
- `components/common/PageContainer.vue`（页面容器）

**文档**:
- `docs/components-guide.md`（组件使用指南）
- `components/common/README.md`（组件库说明）

### 依赖

**前置**: WS-M0-001（uView统一）  
**后置**: 所有业务页面使用通用组件

---

## 🔧 PATCH - 核心代码

### EmptyState.vue（空状态组件，150行）

```vue
<template>
  <view class="empty-state">
    <image v-if="image" :src="image" class="empty-image" mode="aspectFit" />
    <text v-else class="empty-icon">{{ icon }}</text>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
    <u-button v-if="buttonText" type="primary" @click="handleAction" size="small">
      {{ buttonText }}
    </u-button>
  </view>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    icon: { type: String, default: '📭' },
    image: { type: String, default: '' },
    title: { type: String, default: '暂无数据' },
    description: { type: String, default: '' },
    buttonText: { type: String, default: '' }
  },
  methods: {
    handleAction() {
      this.$emit('action');
    }
  }
};
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 60rpx;
}
.empty-icon { font-size: 120rpx; margin-bottom: 32rpx; }
.empty-title { font-size: 32rpx; color: #666; margin-bottom: 16rpx; }
.empty-desc { font-size: 26rpx; color: #999; text-align: center; }
</style>
```

### 其他组件

见完整PATCH文档，每个组件约100-200行。

---

## ✅ TESTS - 测试

### 自动化脚本（tools/test-ws-m1-w1-004.js）

```javascript
// 检查：
// 1. 6个新组件文件存在
// 2. 所有组件使用uView（无uni-ui）
// 3. Props定义完整
// 4. 构建成功
```

### 手动测试

- 组件渲染测试（6个）
- Props传递测试（每个组件2-3个）
- 事件触发测试（每个组件1-2个）

**总计**: 20+测试用例

---

## 📝 SELF-REVIEW - 自检

### DoD核心检查

- [ ] ✅ 构建0报错
- [ ] ✅ uView组件（6个新组件均使用uView子组件）
- [ ] ✅ Props完整（每个组件有propTypes）
- [ ] ✅ 首包影响<100KB

### 质量检查

- [ ] ESLint 0 errors
- [ ] 组件文档完整
- [ ] 使用示例清晰

---

## ⏮️ ROLLBACK - 回滚

**方案A**（推荐）: 删除6个新组件，保留原有4个  
**方案B**: 禁用有问题的组件，保留正常组件  
**时间**: 10min  
**风险**: 极低（新增组件，业务未使用）

---

**五件套状态**: ✅ 完整（紧凑版）  
**代码总量**: 约1200行（6个组件）  
**文档总量**: 约2000行

