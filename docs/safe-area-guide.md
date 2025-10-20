# Safe Area适配指南

**版本**: v1.0.0  
**最后更新**: 2025-10-20

---

## 📱 什么是Safe Area？

Safe Area（安全区域）是指在各种设备上，不被系统UI（如刘海屏、底部导航栏等）遮挡的可用区域。

### 常见的不安全区域

| 设备 | 不安全区域 | 尺寸 |
|------|----------|------|
| iPhone 12/13 | 刘海屏 | 顶部 ~44px |
| iPhone X/11 | 刘海屏 | 顶部 ~44px |
| iPhone SE | 无 | - |
| Android | 状态栏 | 顶部 ~25px |
| 小程序 | TabBar | 底部 ~50px |
| iPad | 无 | - |

---

## 🎯 Safe Area CSS变量

### 标准CSS环境变量

```css
/* 顶部安全区域（刘海屏、状态栏） */
env(safe-area-inset-top)

/* 底部安全区域（Home指示器、TabBar） */
env(safe-area-inset-bottom)

/* 左侧安全区域（竖屏时通常为0） */
env(safe-area-inset-left)

/* 右侧安全区域（竖屏时通常为0） */
env(safe-area-inset-right)
```

### 常见值

```
iPhone 12/13: top=44px, bottom=34px
iPhone SE: top=20px, bottom=0px
Android: top=25px, bottom=0px
小程序: top=0px, bottom=50px
```

---

## ✅ 最佳实践

### 1. Fixed定位元素

**❌ 错误做法**:
```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: white;
}
```

**✅ 正确做法**:
```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  padding-top: env(safe-area-inset-top);
  background: white;
}
```

或使用calc():
```css
.header {
  position: fixed;
  top: calc(0px + env(safe-area-inset-top));
  left: 0;
  right: 0;
  height: 44px;
  background: white;
}
```

### 2. 页面底部内容

**❌ 错误做法**:
```css
.page {
  padding-bottom: 50px; /* 固定值 */
}
```

**✅ 正确做法**:
```css
.page {
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
}
```

### 3. 自定义导航栏

**✅ 完整示例**:
```vue
<template>
  <view class="custom-nav">
    <view class="nav-content">
      <text>标题</text>
    </view>
  </view>
</template>

<style scoped>
.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  z-index: 999;
}

.nav-content {
  height: 44px;
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  padding-left: 16px;
}
</style>
```

### 4. 页面容器

**✅ 完整示例**:
```vue
<template>
  <view class="page">
    <view class="page-header">
      <!-- 导航栏 -->
    </view>
    
    <scroll-view class="page-content">
      <!-- 页面内容 -->
    </scroll-view>
    
    <view class="page-footer">
      <!-- 底部按钮 -->
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  padding-top: env(safe-area-inset-top);
  background: white;
  z-index: 999;
}

.page-content {
  flex: 1;
  margin-top: calc(44px + env(safe-area-inset-top));
  overflow-y: auto;
}

.page-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background: white;
}
</style>
```

---

## 🔍 检测Safe Area支持

### JavaScript检测

```javascript
// 检测是否支持safe-area-inset
function isSafeAreaSupported() {
  const test = document.createElement('div');
  test.style.paddingTop = 'env(safe-area-inset-top)';
  return test.style.paddingTop !== '';
}

// 获取安全区域值
function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  return {
    top: style.getPropertyValue('--safe-area-inset-top') || '0px',
    bottom: style.getPropertyValue('--safe-area-inset-bottom') || '0px',
    left: style.getPropertyValue('--safe-area-inset-left') || '0px',
    right: style.getPropertyValue('--safe-area-inset-right') || '0px'
  };
}
```

### 在Vue中使用

```javascript
export default {
  data() {
    return {
      safeAreaInsets: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    };
  },
  
  mounted() {
    // 获取系统信息
    uni.getSystemInfo({
      success: (res) => {
        this.safeAreaInsets = res.safeArea || {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        };
      }
    });
  }
};
```

---

## 🧪 测试清单

- [ ] 在iPhone 12/13上测试（刘海屏）
- [ ] 在iPhone SE上测试（无刘海屏）
- [ ] 在Android设备上测试
- [ ] 在小程序上测试（TabBar）
- [ ] 在iPad上测试（大屏）
- [ ] 横屏模式测试
- [ ] 暗黑模式测试

---

## 📚 参考资源

- [MDN: env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env())
- [Apple: Safe Area](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [UniApp: Safe Area](https://uniapp.dcloud.io/tutorial/app-safe-area.html)

