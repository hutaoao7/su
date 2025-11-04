# 触摸反馈使用指南

## 📋 概述

触摸反馈系统为应用提供统一的触觉和视觉反馈，提升用户交互体验。

**位置**: 
- 工具类: `utils/touch-feedback.js`
- 混入: `mixins/touch-feedback.js`
- 样式: `static/css/touch-feedback.scss`

**版本**: 1.0.0  
**日期**: 2025-11-04

---

## 🎯 核心功能

- ✅ **振动反馈**: 短振动（15ms）、长振动（50ms）
- ✅ **视觉反馈**: 透明度、缩放、背景色变化
- ✅ **长按效果**: 500ms触发，震动+回调
- ✅ **涟漪效果**: Material Design风格（H5平台）
- ✅ **防抖处理**: 避免重复点击
- ✅ **平台适配**: H5/小程序/App

---

## 📖 使用方法

### 方法一：使用Mixin（推荐）

#### 1. 引入Mixin

```javascript
import touchFeedbackMixin from '@/mixins/touch-feedback.js';

export default {
  mixins: [touchFeedbackMixin],
  // ... 其他配置
}
```

#### 2. 按钮点击反馈

```vue
<template>
  <button 
    @tap="handleSubmit"
    class="submit-btn"
    :class="{ 'touch-active': isButtonPressed }"
  >
    提交
  </button>
</template>

<script>
import touchFeedbackMixin from '@/mixins/touch-feedback.js';

export default {
  mixins: [touchFeedbackMixin],
  
  data() {
    return {
      isButtonPressed: false
    };
  },
  
  methods: {
    handleSubmit() {
      this.handleButtonTap(() => {
        // 业务逻辑
        console.log('表单提交');
      }, {
        vibrate: true,    // 启用振动
        debounce: 300     // 防抖300ms
      });
    }
  }
}
</script>
```

#### 3. 列表项点击反馈

```vue
<template>
  <view class="list">
    <view 
      v-for="item in items" 
      :key="item.id"
      class="list-item"
      :class="{ 'list-item-touch-active': isListItemActive(item.id) }"
      @touchstart="handleListItemTouchStart(item.id, $event)"
      @touchend="handleListItemTouchEnd(item.id)"
      @tap="handleItemClick(item)"
    >
      {{ item.title }}
    </view>
  </view>
</template>

<script>
import touchFeedbackMixin from '@/mixins/touch-feedback.js';

export default {
  mixins: [touchFeedbackMixin],
  
  data() {
    return {
      items: [
        { id: 1, title: '选项1' },
        { id: 2, title: '选项2' },
      ]
    };
  },
  
  methods: {
    handleItemClick(item) {
      this.handleListItemTap(item.id, () => {
        console.log('点击了:', item.title);
        // 跳转详情页
        uni.navigateTo({
          url: `/pages/detail?id=${item.id}`
        });
      });
    }
  }
}
</script>
```

#### 4. 长按操作

```vue
<template>
  <view 
    class="delete-btn"
    :class="{ 'long-press-active': isLongPressing }"
    @touchstart="startLongPress"
    @touchend="cancelLongPress"
    @touchcancel="cancelLongPress"
  >
    长按删除
  </view>
</template>

<script>
import touchFeedbackMixin from '@/mixins/touch-feedback.js';

export default {
  mixins: [touchFeedbackMixin],
  
  data() {
    return {
      isLongPressing: false
    };
  },
  
  methods: {
    startLongPress() {
      this.isLongPressing = true;
      this.handleLongPressStart('delete-btn', () => {
        // 长按触发后的回调
        this.showDeleteDialog();
      });
    },
    
    cancelLongPress() {
      this.isLongPressing = false;
      this.handleLongPressCancel('delete-btn');
    },
    
    showDeleteDialog() {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除吗？',
        success: (res) => {
          if (res.confirm) {
            console.log('删除确认');
          }
        }
      });
    }
  }
}
</script>
```

#### 5. 开关切换

```vue
<template>
  <switch 
    :checked="isEnabled"
    @change="handleToggle"
    class="switch-btn"
  />
</template>

<script>
import touchFeedbackMixin from '@/mixins/touch-feedback.js';

export default {
  mixins: [touchFeedbackMixin],
  
  data() {
    return {
      isEnabled: false
    };
  },
  
  methods: {
    handleToggle(e) {
      this.handleSwitchToggle('enabled', this.isEnabled, (newValue) => {
        this.isEnabled = newValue;
        console.log('开关状态:', newValue);
      });
    }
  }
}
</script>
```

#### 6. 标签页切换

```vue
<template>
  <view class="tabs">
    <view 
      v-for="(tab, index) in tabs" 
      :key="index"
      class="tab-item"
      :class="{ 'tab-touch-active': touchingTab === index }"
      @touchstart="touchingTab = index"
      @touchend="touchingTab = null"
      @tap="switchTab(index)"
    >
      {{ tab.name }}
    </view>
  </view>
</template>

<script>
import touchFeedbackMixin from '@/mixins/touch-feedback.js';

export default {
  mixins: [touchFeedbackMixin],
  
  data() {
    return {
      tabs: [
        { name: '推荐' },
        { name: '热门' },
        { name: '最新' }
      ],
      activeTab: 0,
      touchingTab: null
    };
  },
  
  methods: {
    switchTab(index) {
      this.handleTabSwitch(index, (newIndex) => {
        this.activeTab = newIndex;
        console.log('切换到标签:', this.tabs[newIndex].name);
      });
    }
  }
}
</script>
```

---

### 方法二：直接使用工具类

```javascript
import touchFeedback from '@/utils/touch-feedback.js';

export default {
  methods: {
    handleClick() {
      // 按钮点击反馈
      touchFeedback.buttonTap({
        vibrate: true,
        callback: () => {
          console.log('按钮被点击');
        }
      });
    },
    
    handleVibrate() {
      // 触发短振动
      touchFeedback.vibrate('short');
      
      // 触发长振动
      touchFeedback.vibrate('long');
    }
  }
}
```

---

## 🎨 预定义样式类

### 通用激活状态

| 类名 | 效果 | 适用场景 |
|------|------|----------|
| `touch-active` | 透明度0.6 | 通用可点击元素 |
| `button-touch-active` | 透明度0.7 + 缩放0.98 | 按钮 |
| `list-item-touch-active` | 背景色变化 | 列表项 |
| `card-touch-active` | 阴影 + 缩放0.99 | 卡片 |
| `icon-touch-active` | 透明度0.5 + 缩放0.95 | 图标按钮 |

### 长按效果

| 类名 | 效果 | 适用场景 |
|------|------|----------|
| `long-press-active` | 抖动动画 + 阴影 | 长按操作 |
| `long-press-hint` | 脉冲动画 | 长按提示 |

### 涟漪效果（H5）

| 类名 | 效果 | 适用场景 |
|------|------|----------|
| `ripple-container` | 涟漪容器 | 需要涟漪效果的元素 |
| `ripple-effect` | 涟漪动画 | 由JS动态创建 |

### 特殊状态

| 类名 | 效果 | 适用场景 |
|------|------|----------|
| `touch-disabled` | 禁用状态 | 不可点击元素 |
| `touch-loading` | 加载中 | 加载状态 |
| `touch-no-select` | 禁用文本选择 | 避免长按选中 |
| `touch-gpu-accelerate` | GPU加速 | 频繁触摸的元素 |

---

## ⚙️ 配置选项

### 全局配置

```javascript
import touchFeedback from '@/utils/touch-feedback.js';

// 启用/禁用振动
touchFeedback.setVibrationEnabled(true);

// 启用/禁用视觉反馈
touchFeedback.setVisualEnabled(true);

// 更新配置
touchFeedback.updateConfig({
  vibration: {
    enabled: true,
    shortDuration: 15,
    longDuration: 50
  },
  visual: {
    enabled: true,
    activeClass: 'touch-active',
    duration: 200
  },
  longPress: {
    duration: 500
  }
});

// 获取当前配置
const config = touchFeedback.getConfig();
console.log('当前配置:', config);
```

---

## 📱 平台差异

### H5平台

```javascript
// 使用Vibration API
if (navigator.vibrate) {
  navigator.vibrate(15); // 振动15ms
}

// 支持hover效果
.touch-feedback:hover {
  opacity: 0.8;
}

// 支持涟漪效果
this.addRippleEffect(event, target);
```

### 小程序平台

```javascript
// 使用uni.vibrateShort/vibrateLong
uni.vibrateShort({
  success: () => console.log('振动成功')
});

// 视觉反馈更明显
.touch-active {
  opacity: 0.5; // 小程序建议更明显
}
```

### App平台

```javascript
// 最流畅的动画
.touch-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 🎯 最佳实践

### 1. 所有可点击元素都应添加反馈

✅ **推荐**:
```vue
<button @tap="handleTap" class="touch-active">点击</button>
```

❌ **避免**:
```vue
<button @tap="handleTap">点击</button> <!-- 缺少反馈 -->
```

### 2. 列表项使用touchstart/touchend

✅ **推荐**:
```vue
<view 
  @touchstart="handleListItemTouchStart(item.id, $event)"
  @touchend="handleListItemTouchEnd(item.id)"
  @tap="handleTap"
>
```

❌ **避免**:
```vue
<view @tap="handleTap"> <!-- 缺少touch事件 -->
```

### 3. 重要操作使用长按

✅ **推荐**:
```vue
<!-- 删除操作使用长按 -->
<view 
  @touchstart="startLongPress"
  @touchend="cancelLongPress"
>
  长按删除
</view>
```

### 4. 防止重复点击

✅ **推荐**:
```javascript
this.handleButtonTap(handler, {
  debounce: 300 // 300ms防抖
});
```

### 5. 根据网络状况调整振动

```javascript
// 在设置页面提供开关
export default {
  data() {
    return {
      vibrationEnabled: true
    };
  },
  
  watch: {
    vibrationEnabled(val) {
      touchFeedback.setVibrationEnabled(val);
    }
  }
}
```

### 6. 禁用长按默认行为

```vue
<image 
  src="/static/logo.png"
  class="touch-no-callout"
/>
```

---

## 🔧 集成示例

### 完整的列表页示例

```vue
<template>
  <view class="page">
    <view class="list">
      <view 
        v-for="item in topics" 
        :key="item.id"
        class="list-item touch-no-select"
        :class="{ 'list-item-touch-active': isListItemActive(item.id) }"
        @touchstart="handleListItemTouchStart(item.id, $event)"
        @touchend="handleListItemTouchEnd(item.id)"
        @tap="handleItemTap(item)"
      >
        <image :src="item.cover" class="cover touch-no-callout" />
        <view class="content">
          <text class="title">{{ item.title }}</text>
          <text class="desc">{{ item.description }}</text>
        </view>
        
        <!-- 删除按钮（长按） -->
        <view 
          class="delete-btn"
          :class="{ 'long-press-active': longPressing === item.id }"
          @touchstart.stop="startDelete(item.id)"
          @touchend.stop="cancelDelete(item.id)"
          @touchcancel.stop="cancelDelete(item.id)"
        >
          <u-icon name="delete" />
        </view>
      </view>
    </view>
    
    <!-- 提交按钮 -->
    <button 
      class="submit-btn button-touch-active touch-gpu-accelerate"
      @tap="handleSubmit"
      :disabled="submitting"
      :class="{ 'touch-loading': submitting }"
    >
      {{ submitting ? '提交中...' : '提交' }}
    </button>
  </view>
</template>

<script>
import touchFeedbackMixin from '@/mixins/touch-feedback.js';

export default {
  mixins: [touchFeedbackMixin],
  
  data() {
    return {
      topics: [],
      submitting: false,
      longPressing: null
    };
  },
  
  methods: {
    handleItemTap(item) {
      this.handleListItemTap(item.id, () => {
        uni.navigateTo({
          url: `/pages/community/detail?id=${item.id}`
        });
      });
    },
    
    startDelete(itemId) {
      this.longPressing = itemId;
      this.handleLongPressStart(itemId, () => {
        this.confirmDelete(itemId);
      });
    },
    
    cancelDelete(itemId) {
      this.longPressing = null;
      this.handleLongPressCancel(itemId);
    },
    
    confirmDelete(itemId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条话题吗？',
        success: (res) => {
          if (res.confirm) {
            this.deleteItem(itemId);
          }
        }
      });
    },
    
    handleSubmit() {
      this.handleButtonTap(() => {
        this.submitForm();
      }, {
        vibrate: true,
        debounce: 500
      });
    },
    
    async submitForm() {
      this.submitting = true;
      try {
        // 提交逻辑...
        await this.submitData();
        uni.showToast({ title: '提交成功', icon: 'success' });
      } catch (error) {
        uni.showToast({ title: '提交失败', icon: 'none' });
      } finally {
        this.submitting = false;
      }
    }
  }
}
</script>

<style scoped>
.list-item {
  position: relative;
  padding: 20rpx;
  display: flex;
  align-items: center;
}

.delete-btn {
  padding: 10rpx;
}

.submit-btn {
  margin: 40rpx;
  width: calc(100% - 80rpx);
}
</style>
```

---

## 📊 性能优化

### 1. GPU加速

```vue
<!-- 对频繁触摸的元素启用GPU加速 -->
<view class="touch-gpu-accelerate">
```

### 2. 减少重绘

```scss
// 使用transform和opacity，避免触发layout
.touch-active {
  opacity: 0.6;
  transform: scale(0.98);
  // 避免使用width/height等会触发layout的属性
}
```

### 3. 防抖和节流

```javascript
// 使用内置防抖
this.handleButtonTap(handler, { debounce: 300 });
```

---

## 🐛 常见问题

### Q1: 振动不生效？

**A**: 检查平台支持和权限：
```javascript
// 小程序需要用户授权
// App需要在manifest.json中配置权限
```

### Q2: 长按时页面滚动？

**A**: 阻止默认行为：
```vue
<view 
  @touchstart.prevent="startLongPress"
  class="touch-no-callout"
>
```

### Q3: 样式不生效？

**A**: 确保引入了全局样式：
```vue
<!-- App.vue -->
<style lang="scss">
@import '@/static/css/touch-feedback.scss';
</style>
```

---

## 📝 更新日志

### v1.0.0 (2025-11-04)
- ✅ 初始版本
- ✅ 支持振动反馈（短/长振动）
- ✅ 支持视觉反馈（多种样式类）
- ✅ 支持长按操作
- ✅ 提供Vue Mixin
- ✅ 多平台适配

---

## 📞 技术支持

如有问题，请联系：
- GitHub Issues: [项目地址]
- 文档: `docs/TOUCH-FEEDBACK-USAGE.md`
- 邮箱: dev@craneheart.com

