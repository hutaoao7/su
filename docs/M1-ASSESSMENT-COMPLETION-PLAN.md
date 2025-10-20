# M1-评估模块完成计划

**计划日期**: 2025-10-20  
**模块**: M1-评估模块  
**剩余任务**: 10个  
**预计工作量**: 2天  
**优先级**: 🔴 高

---

## 📋 任务清单

### ScaleRunner UI适配（6个任务）

#### 1. 进度条safe-area-inset-top适配
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 添加进度条顶部安全区域适配

```vue
<!-- 修改前 -->
<view class="progress-bar">
  <progress :percent="progress" />
</view>

<!-- 修改后 -->
<view class="progress-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
  <progress :percent="progress" />
</view>

<style>
.progress-bar {
  padding-top: env(safe-area-inset-top);
}
</style>
```

#### 2. 小屏幕设备选项间距优化
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 优化iPhone SE等小屏幕的选项间距

```vue
<style>
.option-item {
  padding: 12rpx 16rpx;
  margin-bottom: 12rpx;
}

@media (max-width: 375px) {
  .option-item {
    padding: 8rpx 12rpx;
    margin-bottom: 8rpx;
  }
}
</style>
```

#### 3. 夜间模式主题切换
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 实现暗黑模式支持

```vue
<style>
.scale-runner {
  background-color: #fff;
  color: #333;
}

@media (prefers-color-scheme: dark) {
  .scale-runner {
    background-color: #1a1a1a;
    color: #fff;
  }
}
</style>
```

#### 4. 题目文字大小调节
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 添加文字大小调节功能（小/中/大）

```vue
<view class="font-size-control">
  <button @click="fontSize = 'small'">小</button>
  <button @click="fontSize = 'medium'">中</button>
  <button @click="fontSize = 'large'">大</button>
</view>

<style>
.question-text {
  font-size: 16px;
}

.question-text.small {
  font-size: 14px;
}

.question-text.large {
  font-size: 18px;
}
</style>
```

#### 5. 横屏模式布局优化
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 优化横屏显示

```vue
<style>
@media (orientation: landscape) {
  .scale-runner {
    display: flex;
    gap: 20px;
  }
  
  .question-section {
    flex: 1;
  }
  
  .options-section {
    flex: 1;
  }
}
</style>
```

#### 6. 输入框触摸区域扩大
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 确保输入框最小44px触摸区域

```vue
<style>
.input-field {
  min-height: 44px;
  padding: 12px;
  border: 1px solid #ddd;
}
</style>
```

---

### ScaleRunner功能增强（4个任务）

#### 7. 答题进度localStorage自动保存
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 实现答题进度自动保存

```javascript
// 保存进度
saveProgress() {
  const progress = {
    scaleId: this.scaleId,
    answers: this.answers,
    currentQuestion: this.currentQuestion,
    timestamp: Date.now()
  };
  uni.setStorageSync(`scale_progress_${this.scaleId}`, progress);
}

// 恢复进度
restoreProgress() {
  const progress = uni.getStorageSync(`scale_progress_${this.scaleId}`);
  if (progress) {
    this.answers = progress.answers;
    this.currentQuestion = progress.currentQuestion;
  }
}
```

#### 8. 答题暂停/继续按钮
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 添加暂停/继续功能

```vue
<view class="control-buttons">
  <button v-if="!isPaused" @click="pauseAssessment">暂停</button>
  <button v-else @click="resumeAssessment">继续</button>
</view>

<script>
pauseAssessment() {
  this.isPaused = true;
  this.saveProgress();
}

resumeAssessment() {
  this.isPaused = false;
}
</script>
```

#### 9. 答题计时器和时长统计
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 添加计时器和时长统计

```javascript
data() {
  return {
    startTime: null,
    elapsedTime: 0,
    timerInterval: null
  };
}

mounted() {
  this.startTime = Date.now();
  this.timerInterval = setInterval(() => {
    this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
  }, 1000);
}

beforeUnmount() {
  clearInterval(this.timerInterval);
}
```

#### 10. 标记题目分析功能
**文件**: `pages/assess/scale-runner.vue`  
**任务**: 实现标记题目和分析功能

```javascript
// 标记题目
markQuestion(questionId) {
  if (!this.markedQuestions.includes(questionId)) {
    this.markedQuestions.push(questionId);
  }
}

// 分析标记的题目
analyzeMarkedQuestions() {
  return this.markedQuestions.map(id => {
    const question = this.questions.find(q => q.id === id);
    return {
      ...question,
      answer: this.answers[id]
    };
  });
}
```

---

## 🔧 实现步骤

### 第一天
1. ✅ 完成UI适配（任务1-6）
   - 进度条safe-area-inset适配
   - 小屏幕优化
   - 夜间模式
   - 文字大小调节
   - 横屏优化
   - 触摸区域

### 第二天
2. ✅ 完成功能增强（任务7-10）
   - 进度保存
   - 暂停/继续
   - 计时器
   - 标记分析

---

## 📊 验收标准

- [ ] 所有UI适配完成
- [ ] 所有功能正常运行
- [ ] 没有编译错误
- [ ] 性能满足要求
- [ ] 文档已更新

---

## 📝 相关文件

- `pages/assess/scale-runner.vue` - 主要实现文件
- `utils/scale-utils.js` - 工具函数
- `docs/assessment-guide.md` - 评估指南

---

**预计完成时间**: 2025-10-22  
**优先级**: 🔴 高  
**状态**: ⏳ 待开始

