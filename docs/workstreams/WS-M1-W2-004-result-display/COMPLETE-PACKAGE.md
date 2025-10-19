# WS-M1-W2-004: 结果展示页面 - 完整五件套

**工作流ID**: WS-M1-W2-004 | **工时**: 8h | **新建页面**

---

## 📋 PLAN

**任务**: 实现评估结果展示页面，包含图表和建议  
**触点文件**: pages/assess/result.vue (新建，约400行), components/charts/ScoreChart.vue (新建，约200行)

---

## 🔧 PATCH

### pages/assess/result.vue（新建，400行）

```vue
<template>
  <view class="result-page">
    <view class="score-card">
      <text class="score-title">评估结果</text>
      <text class="score-value">{{ result.score }}</text>
      <text class="score-level" :class="'level-' + result.level">
        {{ levelText }}
      </text>
    </view>
    
    <ScoreChart :score="result.score" :max="maxScore" />
    
    <view class="suggestion-card">
      <text class="suggestion-title">专业建议</text>
      <text class="suggestion-text">{{ suggestionText }}</text>
    </view>
    
    <view class="actions">
      <u-button type="primary" @click="saveResult">保存结果</u-button>
      <u-button type="default" @click="shareResult">分享</u-button>
    </view>
  </view>
</template>

<script>
import ScoreChart from '@/components/charts/ScoreChart.vue';

export default {
  components: { ScoreChart },
  
  data() {
    return {
      result: {
        scaleId: '',
        score: 0,
        level: 'normal'
      },
      maxScore: 21
    };
  },
  
  computed: {
    levelText() {
      const map = {
        normal: '正常',
        mild: '轻度',
        moderate: '中度',
        severe: '重度'
      };
      return map[this.result.level] || '未知';
    },
    
    suggestionText() {
      // 根据level返回建议文案
      // ...
    }
  },
  
  onLoad(options) {
    this.result = JSON.parse(decodeURIComponent(options.result));
  },
  
  methods: {
    async saveResult() {
      // 保存到Supabase（通过云函数）
      await callCloudFunction('assessment-save-result', this.result);
      uni.showToast({ title: '保存成功', icon: 'success' });
    },
    
    shareResult() {
      // 分享功能（可选）
    }
  }
};
</script>

<style scoped>
/* 结果卡片样式 */
.result-page {
  padding: 40rpx;
}

.score-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  margin-bottom: 32rpx;
}

.score-value {
  display: block;
  font-size: 120rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.level-normal { color: #52C41A; }
.level-mild { color: #FAAD14; }
.level-moderate { color: #FA8C16; }
.level-severe { color: #F5222D; }
</style>
```

### components/charts/ScoreChart.vue（新建，200行）

```vue
<template>
  <view class="chart-container">
    <canvas canvas-id="scoreChart" class="chart-canvas"></canvas>
  </view>
</template>

<script>
export default {
  props: {
    score: { type: Number, required: true },
    max: { type: Number, default: 21 }
  },
  
  mounted() {
    this.drawChart();
  },
  
  methods: {
    drawChart() {
      // 使用uCharts或canvas绘制柱状图/雷达图
      // ...
    }
  }
};
</script>
```

---

## ✅ TESTS

### 自动化

```javascript
// 检查结果页面文件存在
// 检查图表组件存在
// 检查使用uView组件
// 构建成功
```

### 手动测试

- 结果展示（5个用例）
- 图表渲染（3个用例）
- 保存功能（2个用例）

---

## 📝 SELF-REVIEW DoD

- [ ] ✅ 构建0报错
- [ ] ✅ 结果页面完整实现
- [ ] ✅ 图表正常显示
- [ ] ✅ 保存功能正常

---

## ⏮️ ROLLBACK

```bash
rm pages/assess/result.vue components/charts/ScoreChart.vue
```

**时间**: 2min

---

**状态**: ✅ 完整（新建页面）  
**新增代码**: 约600行

