<template>
  <view class="screening-module">
    <!-- 入口选择 -->
    <view v-if="currentStep === 'select'" class="step-select">
      <view class="select-header">
        <text class="module-title">轻量筛查</text>
        <text class="module-desc">选择您想要评估的方面</text>
      </view>
      
      <view class="type-buttons">
        <button 
          v-for="type in screeningTypes" 
          :key="type.key"
          class="type-button"
          @tap="startScreening(type.key)"
        >
          <view class="type-icon">{{ type.icon }}</view>
          <text class="type-name">{{ type.name }}</text>
          <text class="type-desc">{{ type.desc }}</text>
        </button>
      </view>
    </view>

    <!-- 答题界面 -->
    <view v-if="currentStep === 'answering'" class="step-answering">
      <view class="progress-header">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="progress-text">{{ currentQuestionIndex + 1 }} / {{ questions.length }}</text>
      </view>

      <view class="question-card">
        <text class="question-text">{{ currentQuestion.text }}</text>
        
        <view class="options">
          <button 
            v-for="(option, index) in currentQuestion.scale" 
            :key="index"
            class="option-button"
            :class="{ selected: selectedAnswer === index }"
            @tap="selectAnswer(index)"
          >
            {{ getOptionText(index) }}
          </button>
        </view>
      </view>

      <view class="answer-actions">
        <button 
          v-if="currentQuestionIndex > 0"
          class="btn-prev" 
          @tap="prevQuestion"
        >
          上一题
        </button>
        <button 
          class="btn-next" 
          :disabled="selectedAnswer === null"
          @tap="nextQuestion"
        >
          {{ isLastQuestion ? '提交' : '下一题' }}
        </button>
      </view>
    </view>

    <!-- 结果展示 -->
    <view v-if="currentStep === 'result'" class="step-result">
      <view class="result-header">
        <view class="result-level" :class="'level-' + result.level">
          {{ getLevelText(result.level) }}
        </view>
        <text class="result-title">评估完成</text>
      </view>

      <view class="result-content">
        <text class="result-tips">{{ result.tips }}</text>
      </view>

      <view class="result-actions">
        <button class="btn-ai" @tap="enterAI">进入 AI 干预</button>
        <button class="btn-restart" @tap="restart">重新测试</button>
      </view>
    </view>
  </view>
</template>

<script>
import { screeningAPI } from '@/utils/unicloud-request.js';

export default {
  data() {
    return {
      currentStep: 'select', // select, answering, result
      currentType: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      selectedAnswer: null,
      result: null,
      startTime: null,
      screeningTypes: [
        {
          key: 'study',
          name: '学业压力',
          desc: '评估学习相关的压力水平',
          icon: '📚'
        },
        {
          key: 'social',
          name: '社交焦虑',
          desc: '评估人际交往中的焦虑程度',
          icon: '👥'
        },
        {
          key: 'sleep',
          name: '睡眠质量',
          desc: '评估睡眠状况和相关问题',
          icon: '😴'
        }
      ]
    }
  },
  computed: {
    progressPercent() {
      if (this.questions.length === 0) return 0;
      return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
    },
    currentQuestion() {
      return this.questions[this.currentQuestionIndex] || {};
    },
    isLastQuestion() {
      return this.currentQuestionIndex === this.questions.length - 1;
    }
  },
  methods: {
    // 开始筛查
    async startScreening(type) {
      this.currentType = type;
      this.startTime = Date.now();
      
      try {
        const result = await screeningAPI.questions(type);
        if (result.code === 0) {
          this.questions = result.data.items || [];
          this.answers = new Array(this.questions.length).fill(null);
          this.currentQuestionIndex = 0;
          this.selectedAnswer = null;
          this.currentStep = 'answering';
        }
      } catch (error) {
        console.error('加载题目失败:', error);
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    },

    // 选择答案
    selectAnswer(index) {
      this.selectedAnswer = index;
      this.answers[this.currentQuestionIndex] = index;
    },

    // 下一题
    nextQuestion() {
      if (this.selectedAnswer === null) return;
      
      if (this.isLastQuestion) {
        this.submitAnswers();
      } else {
        this.currentQuestionIndex++;
        this.selectedAnswer = this.answers[this.currentQuestionIndex];
      }
    },

    // 上一题
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.selectedAnswer = this.answers[this.currentQuestionIndex];
      }
    },

    // 提交答案
    async submitAnswers() {
      const timeMs = Date.now() - this.startTime;
      const formattedAnswers = this.answers.map((score, index) => ({
        qid: this.questions[index].qid,
        score
      }));

      try {
        const result = await screeningAPI.submit(this.currentType, formattedAnswers, timeMs);
        if (result.code === 0) {
          this.result = result.data;
          this.currentStep = 'result';
        }
      } catch (error) {
        console.error('提交答案失败:', error);
        uni.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        });
      }
    },

    // 进入AI干预
    enterAI() {
      this.$emit('switch-to', 'ai', { scene: this.currentType });
    },

    // 重新开始
    restart() {
      this.currentStep = 'select';
      this.currentType = null;
      this.questions = [];
      this.answers = [];
      this.result = null;
      this.selectedAnswer = null;
      this.currentQuestionIndex = 0;
    },

    // 获取选项文本
    getOptionText(index) {
      const texts = ['从不', '偶尔', '经常', '总是'];
      return texts[index] || index.toString();
    },

    // 获取等级文本
    getLevelText(level) {
      const texts = {
        low: '低风险',
        mid: '中等风险',
        high: '高风险'
      };
      return texts[level] || level;
    }
  }
}
</script>

<style scoped>
.screening-module {
  padding: 32rpx;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 选择界面 */
.step-select {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.select-header {
  text-align: center;
  margin-bottom: 48rpx;
}

.module-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 12rpx;
}

.module-desc {
  display: block;
  font-size: 24rpx;
  color: #86868B;
  line-height: 1.4;
}

.type-buttons {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.type-button {
  padding: 32rpx 24rpx;
  background: rgba(74, 172, 234, 0.1);
  border-radius: 16rpx;
  border: none;
  text-align: center;
  transition: all 0.3s ease;
}

.type-button:active {
  transform: scale(0.98);
  background: rgba(74, 172, 234, 0.2);
}

.type-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.type-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 8rpx;
}

.type-desc {
  display: block;
  font-size: 22rpx;
  color: #86868B;
  line-height: 1.4;
}

/* 答题界面 */
.step-answering {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.progress-header {
  margin-bottom: 32rpx;
}

.progress-bar {
  height: 8rpx;
  background: rgba(74, 172, 234, 0.2);
  border-radius: 4rpx;
  margin-bottom: 12rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4AACEA;
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 24rpx;
  color: #86868B;
  text-align: center;
}

.question-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48rpx 24rpx;
  background: rgba(74, 172, 234, 0.05);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.question-text {
  font-size: 28rpx;
  color: #1D1D1F;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 48rpx;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.option-button {
  padding: 24rpx;
  background: #FFFFFF;
  border: 2rpx solid #E5E5EA;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #1D1D1F;
  transition: all 0.3s ease;
}

.option-button.selected {
  background: #4AACEA;
  border-color: #4AACEA;
  color: #FFFFFF;
}

.option-button:active {
  transform: scale(0.98);
}

.answer-actions {
  display: flex;
  gap: 16rpx;
}

.btn-prev, .btn-next {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;
}

.btn-prev {
  background: #F2F2F7;
  color: #86868B;
}

.btn-next {
  background: #4AACEA;
  color: #FFFFFF;
}

.btn-next:disabled {
  opacity: 0.5;
  background: #C7C7CC;
}

/* 结果界面 */
.step-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.result-header {
  margin-bottom: 48rpx;
}

.result-level {
  display: inline-block;
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.level-low {
  background: #34C759;
  color: #FFFFFF;
}

.level-mid {
  background: #FF9500;
  color: #FFFFFF;
}

.level-high {
  background: #FF3B30;
  color: #FFFFFF;
}

.result-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.result-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx 24rpx;
  background: rgba(74, 172, 234, 0.05);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.result-tips {
  font-size: 26rpx;
  color: #1D1D1F;
  line-height: 1.6;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.btn-ai, .btn-restart {
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;
}

.btn-ai {
  background: #4AACEA;
  color: #FFFFFF;
}

.btn-restart {
  background: #F2F2F7;
  color: #86868B;
}
</style>