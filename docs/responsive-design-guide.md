# 响应式设计最佳实践

**版本**: v1.0.0  
**最后更新**: 2025-10-20

---

## 📐 屏幕尺寸分类

### 常见设备尺寸

| 设备类型 | 宽度范围 | 高度范围 | 示例 |
|---------|--------|--------|------|
| 小屏手机 | 320-375px | 568-667px | iPhone SE, iPhone 6/7/8 |
| 中屏手机 | 375-414px | 667-812px | iPhone 12/13, iPhone X |
| 大屏手机 | 414-480px | 812-896px | iPhone 12 Pro Max, Android |
| 平板 | 768-1024px | 1024-1366px | iPad, iPad Air |
| 大屏平板 | 1024px+ | 1366px+ | iPad Pro |

### RPX单位转换

```
rpx = px * (750 / 设备宽度)

示例:
- iPhone SE (375px): 1rpx = 0.5px
- iPhone 12 (390px): 1rpx ≈ 0.52px
- iPad (768px): 1rpx ≈ 1.024px
```

---

## ✅ 响应式布局最佳实践

### 1. 使用Flex布局

**✅ 推荐**:
```css
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.item {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}
```

**❌ 避免**:
```css
.container {
  display: flex;
}

.item {
  width: 300px; /* 固定宽度 */
}
```

### 2. 使用相对单位

**✅ 推荐**:
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 5%;
}

.item {
  width: 100%;
  height: auto;
}
```

**❌ 避免**:
```css
.container {
  width: 1200px; /* 固定宽度 */
  padding: 0 20px; /* 固定padding */
}
```

### 3. 媒体查询

**✅ 完整示例**:
```css
/* 移动优先 */
.container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 横屏 */
@media (orientation: landscape) {
  .container {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### 4. 触摸区域大小

**✅ 最小尺寸**:
```css
/* 最小44px（88rpx） */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
}

.icon-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 5. 字体大小

**✅ 推荐范围**:
```css
/* 正文 */
body {
  font-size: 16px; /* 或 32rpx */
  line-height: 1.5;
}

/* 标题 */
h1 {
  font-size: 28px; /* 或 56rpx */
}

h2 {
  font-size: 24px; /* 或 48rpx */
}

h3 {
  font-size: 20px; /* 或 40rpx */
}

/* 小文本 */
.small {
  font-size: 12px; /* 或 24rpx */
}
```

---

## 🎨 常见布局模式

### 1. 卡片网格

```vue
<template>
  <view class="card-grid">
    <view v-for="item in items" :key="item.id" class="card">
      <image :src="item.image" class="card-image" />
      <view class="card-content">
        <text class="card-title">{{ item.title }}</text>
        <text class="card-desc">{{ item.description }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card-content {
  padding: 16px;
}

@media (max-width: 600px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

### 2. 侧边栏布局

```vue
<template>
  <view class="layout">
    <view class="sidebar">
      <!-- 侧边栏内容 -->
    </view>
    <view class="main">
      <!-- 主要内容 -->
    </view>
  </view>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: #f5f5f5;
  overflow-y: auto;
}

.main {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 200px;
  }
}
</style>
```

### 3. 列表布局

```vue
<template>
  <view class="list">
    <view v-for="item in items" :key="item.id" class="list-item">
      <image :src="item.avatar" class="list-avatar" />
      <view class="list-content">
        <text class="list-title">{{ item.title }}</text>
        <text class="list-desc">{{ item.description }}</text>
      </view>
      <view class="list-action">
        <text class="action-text">{{ item.action }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  gap: 12px;
}

.list-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.list-content {
  flex: 1;
  min-width: 0;
}

.list-title {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}

.list-desc {
  display: block;
  font-size: 14px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-action {
  flex-shrink: 0;
}
</style>
```

---

## 🧪 测试清单

- [ ] 在320px宽度测试
- [ ] 在375px宽度测试
- [ ] 在414px宽度测试
- [ ] 在768px宽度测试（平板）
- [ ] 在1024px宽度测试（大屏）
- [ ] 横屏模式测试
- [ ] 缩放测试（200%、150%、75%）
- [ ] 触摸区域大小验证
- [ ] 文字可读性验证

---

## 📚 参考资源

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google: Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [UniApp: 屏幕适配](https://uniapp.dcloud.io/tutorial/app-safe-area.html)

