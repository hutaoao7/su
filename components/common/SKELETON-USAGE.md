# SkeletonScreen 骨架屏组件使用指南

## 📋 组件说明

`SkeletonScreen` 是一个通用的骨架屏组件，用于在页面加载数据时显示占位符，提升用户体验。

**位置**: `components/common/SkeletonScreen.vue`  
**版本**: 1.0.0  
**日期**: 2025-11-04

---

## 🎯 功能特性

- ✅ 5种骨架屏类型（default、list、card、form、detail）
- ✅ 流畅的shimmer动画效果
- ✅ 支持暗黑模式
- ✅ 响应式设计（手机/平板/桌面）
- ✅ 自定义行数和头像
- ✅ 零配置开箱即用

---

## 📖 Props参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loading` | Boolean | true | 是否显示骨架屏（可选，由父组件v-if控制） |
| `rows` | Number | 3 | 显示的行数 |
| `avatar` | Boolean | false | 是否显示头像（仅list/default类型） |
| `type` | String | 'default' | 骨架屏类型（见下方类型说明） |

---

## 🎨 骨架屏类型

### 1. default - 默认类型

简单的列表样式，适用于通用场景。

```vue
<skeleton-screen :rows="5" type="default" :avatar="true" />
```

**效果**：
- 圆形头像（可选）
- 单行文本占位符

**适用场景**：
- 简单列表
- 通用加载场景

---

### 2. list - 列表类型

带头像和双行文本的列表样式。

```vue
<skeleton-screen :rows="5" type="list" :avatar="true" />
```

**效果**：
- 圆形头像
- 标题行（60%宽度）
- 内容行（80%宽度）
- 白色卡片背景

**适用场景**：
- 社区话题列表
- 评论列表
- 消息列表
- 用户列表

**已集成页面**：
- `pages/community/index.vue` - 社区话题列表

---

### 3. card - 卡片类型

图片+文字的卡片网格样式。

```vue
<skeleton-screen :rows="4" type="card" />
```

**效果**：
- 矩形图片占位符
- 标题行
- 内容行
- 网格布局（2列）

**适用场景**：
- 音乐专辑列表
- 商品卡片
- 图文卡片
- 推荐内容

**已集成页面**：
- `pages/home/home.vue` - 首页推荐

---

### 4. form - 表单类型

标签+输入框的表单样式。

```vue
<skeleton-screen :rows="5" type="form" />
```

**效果**：
- 标签占位符（120rpx宽）
- 输入框占位符（100%宽，80rpx高）
- 白色卡片背景

**适用场景**：
- 设置页面
- 个人资料编辑
- 表单填写页面

---

### 5. detail - 详情类型

带头部信息和段落文本的详情样式。

```vue
<skeleton-screen :rows="6" type="detail" />
```

**效果**：
- 头部（头像 + 双行信息）
- 多行段落文本
- 最后一行60%宽度（模拟不完整段落）

**适用场景**：
- 文章详情
- 话题详情
- 评估结果详情

---

## 🚀 快速开始

### 1. 导入组件

```vue
<script>
import SkeletonScreen from '@/components/common/SkeletonScreen.vue';

export default {
  components: {
    SkeletonScreen
  },
  data() {
    return {
      loading: true
    };
  }
}
</script>
```

### 2. 使用组件

**方式1：使用 v-if 控制**（推荐）

```vue
<template>
  <view class="page">
    <!-- 骨架屏 -->
    <skeleton-screen v-if="loading" :rows="5" type="list" :avatar="true" />
    
    <!-- 实际内容 -->
    <view v-else>
      <!-- 你的页面内容 -->
    </view>
  </view>
</template>
```

**方式2：使用 loading prop**

```vue
<template>
  <view class="page">
    <!-- 骨架屏会根据loading自动显示/隐藏 -->
    <skeleton-screen :loading="loading" :rows="5" type="list" :avatar="true" />
    
    <!-- 内容始终渲染，但骨架屏会覆盖 -->
    <view>
      <!-- 你的页面内容 -->
    </view>
  </view>
</template>
```

### 3. 控制加载状态

```javascript
export default {
  data() {
    return {
      loading: true,
      dataList: []
    };
  },
  
  onLoad() {
    this.fetchData();
  },
  
  methods: {
    async fetchData() {
      this.loading = true;
      
      try {
        const res = await api.getData();
        this.dataList = res.data;
      } catch (error) {
        console.error('加载失败:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
```

---

## 📱 完整示例

### 示例1：社区话题列表

```vue
<template>
  <view class="community-page">
    <!-- 骨架屏 -->
    <skeleton-screen 
      v-if="loading && page === 1" 
      :rows="5" 
      type="list" 
      :avatar="true" 
    />
    
    <!-- 话题列表 -->
    <view v-else-if="topics.length > 0" class="topic-list">
      <view v-for="topic in topics" :key="topic.id" class="topic-item">
        <!-- 话题内容 -->
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text>暂无话题</text>
    </view>
  </view>
</template>

<script>
import SkeletonScreen from '@/components/common/SkeletonScreen.vue';

export default {
  components: { SkeletonScreen },
  data() {
    return {
      loading: true,
      topics: [],
      page: 1
    };
  },
  
  onLoad() {
    this.loadTopics();
  },
  
  methods: {
    async loadTopics() {
      this.loading = true;
      try {
        const res = await api.getTopics({ page: this.page });
        this.topics = res.data.list;
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
```

### 示例2：首页推荐卡片

```vue
<template>
  <view class="home-page">
    <!-- 骨架屏 -->
    <skeleton-screen v-if="loading" :rows="4" type="card" />
    
    <!-- 推荐内容 -->
    <view v-else class="recommend-grid">
      <view v-for="item in recommendList" :key="item.id" class="card">
        <image :src="item.cover" class="cover"></image>
        <text class="title">{{ item.title }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import SkeletonScreen from '@/components/common/SkeletonScreen.vue';

export default {
  components: { SkeletonScreen },
  data() {
    return {
      loading: true,
      recommendList: []
    };
  },
  
  onLoad() {
    this.loadRecommend();
  },
  
  methods: {
    async loadRecommend() {
      this.loading = true;
      try {
        const res = await api.getRecommend();
        this.recommendList = res.data;
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
```

### 示例3：表单页面

```vue
<template>
  <view class="settings-page">
    <!-- 骨架屏 -->
    <skeleton-screen v-if="loading" :rows="6" type="form" />
    
    <!-- 设置表单 -->
    <view v-else class="form">
      <view class="form-item">
        <text class="label">昵称</text>
        <input v-model="formData.nickname" class="input" />
      </view>
      <!-- 更多表单项... -->
    </view>
  </view>
</template>

<script>
import SkeletonScreen from '@/components/common/SkeletonScreen.vue';

export default {
  components: { SkeletonScreen },
  data() {
    return {
      loading: true,
      formData: {}
    };
  },
  
  onLoad() {
    this.loadUserInfo();
  },
  
  methods: {
    async loadUserInfo() {
      this.loading = true;
      try {
        const res = await api.getUserInfo();
        this.formData = res.data;
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
```

---

## 🎨 自定义样式

如果需要自定义骨架屏样式，可以通过全局样式覆盖：

```scss
// 全局样式文件 (uni.scss 或 App.vue)

// 修改shimmer动画速度
.skeleton-screen {
  .skeleton-circle,
  .skeleton-line {
    animation-duration: 2s !important; // 改为2秒
  }
}

// 修改颜色
.skeleton-line {
  background: linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%) !important;
}

// 修改卡片间距
.skeleton-card {
  gap: 32rpx !important;
}
```

---

## ✅ 已集成页面列表

| 页面路径 | 骨架屏类型 | 集成时间 |
|---------|-----------|---------|
| `pages/home/home.vue` | card (4行) | 2025-11-04 |
| `pages/community/index.vue` | list (5行，有头像) | 2025-11-04 |

---

## 📋 待集成页面建议

以下页面建议添加骨架屏：

### 高优先级

| 页面路径 | 建议类型 | 建议行数 |
|---------|---------|---------|
| `pages/community/detail.vue` | detail | 6 |
| `pages/features/features.vue` | list | 8 |
| `pages/user/home.vue` | 已有自定义骨架屏 | - |
| `pages-sub/assess/result.vue` | detail | 5 |
| `pages-sub/music/index.vue` | list + avatar | 6 |
| `pages-sub/stress/history.vue` | list | 5 |

### 中优先级

| 页面路径 | 建议类型 | 建议行数 |
|---------|---------|---------|
| `pages/intervene/chat.vue` | list | 8 |
| `pages-sub/community/my-topics.vue` | list + avatar | 5 |
| `pages-sub/other/profile.vue` | form | 6 |
| `pages-sub/other/settings/settings.vue` | form | 8 |
| `pages/admin/metrics.vue` | card | 4 |

### 低优先级（静态页面）

| 页面路径 | 说明 |
|---------|------|
| `pages/login/login.vue` | 静态表单，无需骨架屏 |
| `pages-sub/consent/*` | 静态文本页面 |
| `pages-sub/other/about.vue` | 静态内容 |

---

## 🔧 集成步骤模板

对于任何需要添加骨架屏的页面，按以下步骤操作：

### Step 1: 导入组件

```javascript
import SkeletonScreen from '@/components/common/SkeletonScreen.vue';

export default {
  components: {
    SkeletonScreen
  },
  // ...
}
```

### Step 2: 添加 loading 状态

```javascript
data() {
  return {
    loading: true, // 添加这一行
    // 其他数据...
  };
}
```

### Step 3: 在模板中使用

```vue
<template>
  <view class="page">
    <!-- 添加骨架屏 -->
    <skeleton-screen v-if="loading" :rows="5" type="list" :avatar="true" />
    
    <!-- 原有内容包装在v-else中 -->
    <view v-else>
      <!-- 原有的页面内容 -->
    </view>
  </view>
</template>
```

### Step 4: 控制loading状态

```javascript
methods: {
  async loadData() {
    this.loading = true; // 开始加载
    try {
      // 加载数据...
      const res = await api.getData();
      this.dataList = res.data;
    } finally {
      this.loading = false; // 结束加载
    }
  }
}
```

---

## 💡 最佳实践

### 1. 选择合适的类型

- **list**: 带头像的列表（社区、评论、消息）
- **card**: 图片卡片（音乐、商品、推荐）
- **form**: 表单页面（设置、资料编辑）
- **detail**: 详情页面（文章、话题详情）
- **default**: 简单列表或通用场景

### 2. 合理设置行数

- 根据实际内容的常见数量设置
- 建议3-6行（太多会显得冗长）
- 首屏能看到的内容数量

### 3. 首次加载才显示

```javascript
// 仅在第一页加载时显示骨架屏
<skeleton-screen v-if="loading && page === 1" :rows="5" type="list" />
```

### 4. 配合empty-state使用

```vue
<!-- 加载中 -->
<skeleton-screen v-if="loading" :rows="5" type="list" />

<!-- 空状态 -->
<empty-state v-else-if="!loading && dataList.length === 0" />

<!-- 有数据 -->
<view v-else>
  <!-- 内容 -->
</view>
```

### 5. 避免过度使用

- 不是所有页面都需要骨架屏
- 静态页面（关于、协议等）无需骨架屏
- 加载时间<200ms的可以不加

---

## 🐛 常见问题

### Q1: 骨架屏闪烁怎么办？

**A**: 设置最小显示时间

```javascript
async loadData() {
  this.loading = true;
  const startTime = Date.now();
  
  try {
    const res = await api.getData();
    this.dataList = res.data;
  } finally {
    // 确保骨架屏至少显示300ms
    const elapsed = Date.now() - startTime;
    if (elapsed < 300) {
      await new Promise(resolve => setTimeout(resolve, 300 - elapsed));
    }
    this.loading = false;
  }
}
```

### Q2: 骨架屏颜色不对？

**A**: 检查是否受暗黑模式影响，可以在组件内部修改颜色或使用全局样式覆盖。

### Q3: 样式不生效？

**A**: 确保样式是 `scoped`，如需修改组件内部样式，使用 `/deep/` 或 `::v-deep`。

---

## 📞 技术支持

如有问题，请联系：
- GitHub Issues: [项目地址]
- 文档: `components/common/SKELETON-USAGE.md`

---

## 📝 更新日志

### v1.0.0 (2025-11-04)
- ✅ 初始版本
- ✅ 支持5种骨架屏类型
- ✅ shimmer动画效果
- ✅ 暗黑模式支持
- ✅ 响应式设计

