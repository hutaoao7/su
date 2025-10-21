<template>
  <view class="ai-module">
    <!-- 阶段进度条 -->
    <view class="phase-progress">
      <view 
        v-for="(phase, index) in phases" 
        :key="phase.key"
        class="phase-item"
        :class="{ 
          active: currentPhaseIndex === index,
          completed: currentPhaseIndex > index 
        }"
      >
        <view class="phase-dot"></view>
        <text class="phase-name">{{ phase.name }}</text>
      </view>
    </view>

    <!-- 聊天区域 -->
    <view class="chat-area" ref="chatArea">
      <scroll-view 
        class="message-list" 
        scroll-y 
        :scroll-top="scrollTop"
        scroll-with-animation
      >
        <view 
          v-for="(message, index) in messages" 
          :key="index"
          class="message-item"
          :class="'message-' + message.role"
        >
          <view class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
          </view>
          <view class="message-content">
            <text class="message-text">{{ message.text }}</text>
            <text class="message-time">{{ formatTime(message.ts) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 练习区域（仅在exercise阶段显示） -->
    <view v-if="currentPhase === 'exercise'" class="exercise-area">
      <view class="exercise-tabs">
        <view 
          v-for="exercise in exercises" 
          :key="exercise.key"
          class="exercise-tab"
          :class="{ active: currentExercise === exercise.key }"
          @tap="switchExercise(exercise.key)"
        >
          {{ exercise.name }}
        </view>
      </view>
      
      <view class="exercise-content">
        <!-- 呼吸练习 -->
        <view v-if="currentExercise === 'breathing'" class="breathing-exercise">
          <view class="breathing-circle" :class="{ breathing: isBreathing }">
            <text class="breathing-text">{{ breathingText }}</text>
          </view>
          <button class="btn-breathing" @tap="toggleBreathing">
            {{ isBreathing ? '停止' : '开始' }}呼吸练习
          </button>
        </view>

        <!-- 睡前引导 -->
        <view v-if="currentExercise === 'sleep'" class="sleep-guide">
          <text class="guide-text">{{ sleepGuideText }}</text>
          <button class="btn-guide" @tap="startSleepGuide">
            {{ isSleepGuiding ? '停止引导' : '开始睡前引导' }}
          </button>
        </view>

        <!-- 番茄钟 -->
        <view v-if="currentExercise === 'pomodoro'" class="pomodoro-timer">
          <view class="timer-display">
            <text class="timer-text">{{ formatTimer(pomodoroTime) }}</text>
            <text class="timer-label">{{ pomodoroPhase }}</text>
          </view>
          <view class="timer-controls">
            <button class="btn-timer" @tap="startPomodoro">
              {{ isPomodoroRunning ? '暂停' : '开始' }}
            </button>
            <button class="btn-reset" @tap="resetPomodoro">重置</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 输入区域 -->
    <view class="input-area">
      <view class="input-container">
        <textarea 
          v-model="inputText" 
          class="message-input" 
          placeholder="请输入您的想法..."
          :maxlength="500"
          auto-height
          @input="handleInput"
        />
        <button 
          class="btn-send" 
          :disabled="!inputText.trim() || isSending"
          @tap="sendMessage"
        >
          {{ isSending ? '发送中' : '发送' }}
        </button>
      </view>
    </view>

    <!-- 敏感词提示弹窗 -->
    <view v-if="showSensitiveAlert" class="sensitive-alert" @tap="hideSensitiveAlert">
      <view class="alert-content" @tap.stop>
        <text class="alert-title">温馨提示</text>
        <text class="alert-text">
          我们注意到您可能正在经历困难。如果您有自伤或伤害他人的想法，请立即寻求专业帮助：
          <br/>• 心理危机干预热线：400-161-9995
          <br/>• 全国24小时心理援助热线：400-161-9995
        </text>
        <button class="btn-alert" @tap="hideSensitiveAlert">我知道了</button>
      </view>
    </view>
  </view>
</template>

<script>
import { aiAPI } from '@/utils/unicloud-request.js';

export default {
  props: {
    scene: {
      type: String,
      default: 'general'
    }
  },
  data() {
    return {
      sessionId: null,
      currentPhaseIndex: 0,
      messages: [],
      inputText: '',
      isSending: false,
      scrollTop: 0,
      showSensitiveAlert: false,
      
      // 练习相关
      currentExercise: 'breathing',
      isBreathing: false,
      breathingText: '准备开始',
      breathingTimer: null,
      
      isSleepGuiding: false,
      sleepGuideText: '点击开始睡前放松引导',
      sleepGuideTimer: null,
      
      isPomodoroRunning: false,
      pomodoroTime: 25 * 60, // 25分钟
      pomodoroPhase: '工作时间',
      pomodoroTimer: null,
      
      phases: [
        { key: 'accept', name: '接纳' },
        { key: 'assess', name: '评估' },
        { key: 'plan', name: '策略' },
        { key: 'exercise', name: '练习' },
        { key: 'summary', name: '总结' }
      ],
      exercises: [
        { key: 'breathing', name: '呼吸练习' },
        { key: 'sleep', name: '睡前引导' },
        { key: 'pomodoro', name: '番茄钟' }
      ],
      sensitiveWords: ['自杀', '轻生', '伤害自己', '不想活', '死了算了']
    }
  },
  computed: {
    currentPhase() {
      return this.phases[this.currentPhaseIndex]?.key || 'accept';
    }
  },
  mounted() {
    this.startSession();
  },
  beforeDestroy() {
    this.clearAllTimers();
  },
  methods: {
    // 开始会话
    async startSession() {
      try {
        const result = await aiAPI.sessionStart(this.scene);
        if (result.code === 0) {
          this.sessionId = result.data.sessionId;
          
          // 添加欢迎消息
          this.addMessage('assistant', this.getWelcomeMessage());
        }
      } catch (error) {
        console.error('启动AI会话失败:', error);
        this.addMessage('assistant', '很抱歉，AI服务暂时不可用，请稍后再试。');
      }
    },

    // 获取欢迎消息
    getWelcomeMessage() {
      const welcomeMessages = {
        study: '你好，我是你的AI心理助手。我了解学业压力可能让你感到困扰，让我们一起来聊聊，找到适合你的应对方式。',
        social: '你好，我注意到你可能在社交方面有些困扰。这很正常，让我们慢慢聊聊你的感受。',
        sleep: '你好，睡眠问题确实会影响我们的生活质量。让我来帮助你找到更好的睡眠方法。',
        general: '你好，我是你的AI心理助手。无论你遇到什么困扰，我都会耐心倾听并提供支持。'
      };
      return welcomeMessages[this.scene] || welcomeMessages.general;
    },

    // 发送消息
    async sendMessage() {
      const text = this.inputText.trim();
      if (!text || this.isSending) return;

      // 敏感词检测
      if (this.checkSensitiveWords(text)) {
        this.showSensitiveAlert = true;
        // 不阻断会话，继续发送
      }

      this.addMessage('user', text);
      this.inputText = '';
      this.isSending = true;

      try {
        const result = await aiAPI.message(this.sessionId, text);
        if (result.code === 0) {
          // 添加AI回复
          result.data.replies.forEach(reply => {
            this.addMessage('assistant', reply.text);
          });
          
          // 更新阶段
          if (result.data.next) {
            this.updatePhase(result.data.next);
          }
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        this.addMessage('assistant', '抱歉，我暂时无法回复，请稍后再试。');
      } finally {
        this.isSending = false;
      }
    },

    // 添加消息
    addMessage(role, text) {
      this.messages.push({
        role,
        text,
        ts: Date.now()
      });
      
      // 滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },

    // 滚动到底部
    scrollToBottom() {
      this.scrollTop = this.scrollTop === 0 ? 1 : 0;
      setTimeout(() => {
        this.scrollTop = 999999;
      }, 100);
    },

    // 更新阶段
    updatePhase(nextPhase) {
      const phaseIndex = this.phases.findIndex(p => p.key === nextPhase);
      if (phaseIndex !== -1) {
        this.currentPhaseIndex = phaseIndex;
      }
    },

    // 敏感词检测
    checkSensitiveWords(text) {
      return this.sensitiveWords.some(word => text.includes(word));
    },

    // 隐藏敏感词提示
    hideSensitiveAlert() {
      this.showSensitiveAlert = false;
    },

    // 切换练习
    switchExercise(exerciseKey) {
      this.currentExercise = exerciseKey;
      this.stopAllExercises();
    },

    // 停止所有练习
    stopAllExercises() {
      this.isBreathing = false;
      this.isSleepGuiding = false;
      this.isPomodoroRunning = false;
      this.clearAllTimers();
    },

    // 清除所有计时器
    clearAllTimers() {
      if (this.breathingTimer) {
        clearInterval(this.breathingTimer);
        this.breathingTimer = null;
      }
      if (this.sleepGuideTimer) {
        clearInterval(this.sleepGuideTimer);
        this.sleepGuideTimer = null;
      }
      if (this.pomodoroTimer) {
        clearInterval(this.pomodoroTimer);
        this.pomodoroTimer = null;
      }
    },

    // 呼吸练习
    toggleBreathing() {
      this.isBreathing = !this.isBreathing;
      
      if (this.isBreathing) {
        this.startBreathingCycle();
      } else {
        this.clearAllTimers();
        this.breathingText = '准备开始';
      }
    },

    startBreathingCycle() {
      let phase = 0; // 0: 吸气, 1: 保持, 2: 呼气
      let count = 0;
      const phases = ['吸气', '保持', '呼气'];
      const durations = [4, 2, 6]; // 4-2-6呼吸法
      
      this.breathingTimer = setInterval(() => {
        if (!this.isBreathing) return;
        
        this.breathingText = `${phases[phase]} ${durations[phase] - count}`;
        count++;
        
        if (count >= durations[phase]) {
          phase = (phase + 1) % 3;
          count = 0;
        }
      }, 1000);
    },

    // 睡前引导
    startSleepGuide() {
      this.isSleepGuiding = !this.isSleepGuiding;
      
      if (this.isSleepGuiding) {
        const guides = [
          '请找一个舒适的姿势躺下...',
          '闭上眼睛，深呼吸三次...',
          '感受身体的重量，让肌肉放松...',
          '从头部开始，逐渐放松每一个部位...',
          '想象一个宁静的场景...',
          '让思绪慢慢平静下来...'
        ];
        
        let index = 0;
        this.sleepGuideText = guides[0];
        
        this.sleepGuideTimer = setInterval(() => {
          if (!this.isSleepGuiding) return;
          
          index = (index + 1) % guides.length;
          this.sleepGuideText = guides[index];
        }, 10000); // 每10秒切换
      } else {
        this.clearAllTimers();
        this.sleepGuideText = '点击开始睡前放松引导';
      }
    },

    // 番茄钟
    startPomodoro() {
      this.isPomodoroRunning = !this.isPomodoroRunning;
      
      if (this.isPomodoroRunning) {
        this.pomodoroTimer = setInterval(() => {
          if (this.pomodoroTime > 0) {
            this.pomodoroTime--;
          } else {
            // 时间到，切换阶段
            if (this.pomodoroPhase === '工作时间') {
              this.pomodoroPhase = '休息时间';
              this.pomodoroTime = 5 * 60; // 5分钟休息
            } else {
              this.pomodoroPhase = '工作时间';
              this.pomodoroTime = 25 * 60; // 25分钟工作
            }
            
            uni.showToast({
              title: `${this.pomodoroPhase}开始！`,
              icon: 'success'
            });
          }
        }, 1000);
      } else {
        this.clearAllTimers();
      }
    },

    // 重置番茄钟
    resetPomodoro() {
      this.isPomodoroRunning = false;
      this.pomodoroTime = 25 * 60;
      this.pomodoroPhase = '工作时间';
      this.clearAllTimers();
    },

    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    // 格式化计时器
    formatTimer(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // 输入处理
    handleInput(e) {
      this.inputText = e.detail.value;
    }
  }
}
</script>

<style scoped>
.ai-module {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
}

/* 阶段进度条 */
.phase-progress {
  display: flex;
  justify-content: space-between;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.1);
}

.phase-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.phase-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 12rpx;
  right: -50%;
  width: 100%;
  height: 2rpx;
  background: rgba(255, 255, 255, 0.3);
}

.phase-item.completed::after {
  background: rgba(255, 255, 255, 0.8);
}

.phase-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.3);
  margin-bottom: 8rpx;
}

.phase-item.active .phase-dot {
  background: #FFFFFF;
}

.phase-item.completed .phase-dot {
  background: rgba(255, 255, 255, 0.8);
}

.phase-name {
  font-size: 20rpx;
  opacity: 0.7;
}

.phase-item.active .phase-name {
  opacity: 1;
  font-weight: 500;
}

/* 聊天区域 */
.chat-area {
  flex: 1;
  padding: 0 24rpx;
}

.message-list {
  height: 100%;
}

.message-item {
  display: flex;
  margin-bottom: 24rpx;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  margin: 0 16rpx;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-text {
  display: block;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  font-size: 26rpx;
  line-height: 1.5;
  margin-bottom: 8rpx;
}

.message-user .message-text {
  background: rgba(255, 255, 255, 0.2);
}

.message-time {
  font-size: 20rpx;
  opacity: 0.6;
  margin-left: 20rpx;
}

/* 练习区域 */
.exercise-area {
  background: rgba(255, 255, 255, 0.1);
  margin: 0 24rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.exercise-tabs {
  display: flex;
  margin-bottom: 24rpx;
}

.exercise-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.1);
  margin-right: 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.exercise-tab:last-child {
  margin-right: 0;
}

.exercise-tab.active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: 500;
}

.exercise-content {
  text-align: center;
}

/* 呼吸练习 */
.breathing-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 100rpx;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
  transition: transform 1s ease-in-out;
}

.breathing-circle.breathing {
  animation: breathe 12s infinite;
}

@keyframes breathe {
  0%, 33% { transform: scale(1); }
  16% { transform: scale(1.2); }
  50%, 100% { transform: scale(1); }
}

.breathing-text {
  font-size: 24rpx;
  font-weight: 500;
}

/* 睡前引导 */
.sleep-guide {
  padding: 32rpx;
}

.guide-text {
  display: block;
  font-size: 26rpx;
  line-height: 1.6;
  margin-bottom: 32rpx;
  min-height: 100rpx;
}

/* 番茄钟 */
.pomodoro-timer {
  padding: 32rpx;
}

.timer-display {
  margin-bottom: 32rpx;
}

.timer-text {
  display: block;
  font-size: 48rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.timer-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.timer-controls {
  display: flex;
  gap: 16rpx;
  justify-content: center;
}

.btn-breathing, .btn-guide, .btn-timer, .btn-reset {
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8rpx;
  color: #FFFFFF;
  font-size: 24rpx;
}

/* 输入区域 */
.input-area {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.1);
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
}

.message-input {
  flex: 1;
  min-height: 80rpx;
  max-height: 200rpx;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  color: #FFFFFF;
  font-size: 26rpx;
  border: none;
}

.message-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.btn-send {
  width: 120rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 12rpx;
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: 500;
}

.btn-send:disabled {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.1);
}

/* 敏感词提示 */
.sensitive-alert {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.alert-content {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin: 48rpx;
  color: #1D1D1F;
}

.alert-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  text-align: center;
}

.alert-text {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.btn-alert {
  width: 100%;
  height: 80rpx;
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
}
</style>