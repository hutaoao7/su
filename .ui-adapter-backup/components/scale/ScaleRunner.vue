<template>
  <view class="scale-runner" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部进度条 -->
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
    </view>
    
    <!-- 顶部信息栏 -->
    <view class="top-info-bar" v-if="!loadError">
      <view class="info-item">
        <text class="info-label">进度</text>
        <text class="info-value">{{ currentIndex + 1 }}/{{ questions.length }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">用时</text>
        <text class="info-value">{{ formattedTime }}</text>
      </view>
      <view class="action-group">
        <view class="font-size-btn" @tap="cycleFontSize">
          <text class="font-size-text">{{ fontSizeLabel }}</text>
        </view>
        <view class="theme-btn" @tap="toggleTheme">
          <u-icon :name="isDarkMode ? 'sun' : 'moon'" size="20" :color="isDarkMode ? '#FFD60A' : '#007AFF'"></u-icon>
        </view>
        <view class="pause-btn" @tap="handleTogglePause">
          <u-icon :name="isPaused ? 'play-circle' : 'pause-circle'" size="20" color="#007AFF"></u-icon>
        </view>
        <view class="export-btn" @tap="showExportDialog">
          <u-icon name="download" size="20" color="#007AFF"></u-icon>
        </view>
      </view>
    </view>
    
    <!-- 加载错误提示 -->
    <view class="error-card" v-if="loadError">
      <view class="error-content">
        <text class="error-title">加载失败</text>
        <text class="error-message">量表资源缺失或路径错误({{ scaleId }})</text>
        <u-button type="primary" @click="handleComplete" class="error-button">返回</u-button>
      </view>
    </view>
    
    <!-- 题目卡片 -->
    <view class="question-card" :class="'font-size-' + fontSize" v-if="currentQuestion && !loadError">
      <view class="question-header">
        <view class="header-left">
          <text class="question-number">{{ currentIndex + 1 }}/{{ questions.length }}</text>
          <text class="scale-title">{{ title }}</text>
        </view>
        <view class="header-actions">
          <view 
            class="mark-btn" 
            :class="{ 'marked': isQuestionMarked }"
            @tap="toggleQuestionMark"
          >
            <u-icon :name="isQuestionMarked ? 'star-fill' : 'star'" size="20" :color="isQuestionMarked ? '#FFB800' : '#8E8E93'"></u-icon>
          </view>
          <view 
            v-if="canPrev"
            class="review-btn"
            @tap="toggleReviewMode"
          >
            <u-icon name="list" size="20" color="#8E8E93"></u-icon>
          </view>
        </view>
      </view>
      
      <view class="question-content">
        <text class="question-text">{{ currentQuestion.text }}</text>
      </view>
      
      <!-- 选项列表 - 普通量表题 -->
      <view class="options-list" v-if="!currentQuestion.type || currentQuestion.type === 'select'">
        <view 
          v-for="(option, index) in getQuestionOptions()" 
          :key="index"
          class="option-item"
          :class="{ 'option-selected': answers[currentQuestion.id] === getQuestionValues()[index] }"
          @tap="selectOption(currentQuestion.id, getQuestionValues()[index])"
        >
          <view class="option-radio">
            <view class="radio-dot" v-if="answers[currentQuestion.id] === getQuestionValues()[index]"></view>
          </view>
          <text class="option-text">{{ option }}</text>
        </view>
      </view>
      
      <!-- 特殊输入类型 - 时间输入 -->
      <view class="input-section" v-if="currentQuestion.type === 'time'">
        <u-input 
          v-model="timeInput"
          type="text"
          placeholder="请输入时间，如: 23:30"
          @blur="handleTimeInput"
          class="time-input"
        />
      </view>
      
      <!-- 特殊输入类型 - 数字输入 -->
      <view class="input-section" v-if="currentQuestion.type === 'number'">
        <u-input 
          v-model="numberInput"
          type="number"
          :placeholder="getNumberPlaceholder()"
          @blur="handleNumberInput"
          class="number-input"
        />
      </view>
    </view>
    <!-- 底部操作条 -->
    <view class="bottom-navigation" v-if="!loadError">
      <view class="nav-button-container">
        <view 
          class="nav-button nav-button-prev"
          :class="{ 'nav-button-disabled': !canPrev }"
          @tap="handlePrev"
        >
          <text class="nav-button-text">上一题</text>
        </view>
        
        <view 
          class="nav-button nav-button-next"
          :class="{ 
            'nav-button-disabled': !canNext,
            'nav-button-submit': isLastQuestion && canNext
          }"
          @tap="handleNext"
        >
          <text class="nav-button-text">{{ isLastQuestion ? '提交' : '下一题' }}</text>
        </view>
      </view>
      
      <view class="nav-hint" v-if="!canNext">
        <text class="nav-hint-text">请选择一个选项</text>
      </view>
    </view>
    
    <!-- 导出对话框 -->
    <u-popup v-model="showExport" mode="center" border-radius="20">
      <view class="export-dialog">
        <view class="export-title">导出答题数据</view>
        <view class="export-tips">
          <text class="export-tips-text">可导出当前答题进度和已完成的答案</text>
        </view>
        <view class="export-options">
          <view class="export-option" @tap="handleExport('json')">
            <view class="export-option-icon">
              <u-icon name="file-text" size="40" color="#007AFF"></u-icon>
            </view>
            <text class="export-option-title">JSON格式</text>
            <text class="export-option-desc">适合数据分析和导入</text>
          </view>
          <view class="export-option" @tap="handleExport('csv')">
            <view class="export-option-icon">
              <u-icon name="list" size="40" color="#52C41A"></u-icon>
            </view>
            <text class="export-option-title">CSV格式</text>
            <text class="export-option-desc">可用Excel打开查看</text>
          </view>
        </view>
        <view class="export-actions">
          <u-button type="default" @click="showExport = false">取消</u-button>
        </view>
      </view>
    </u-popup>

  </view>
</template>

<script>
import { scoreUnified } from '@/utils/scoring.js'
import { exportAssessmentData } from '@/utils/assessment-export.js'

export default {
  name: 'ScaleRunner',
  props: {
    scaleId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: '心理评估'
    },
    submitText: {
      type: String,
      default: '提交并查看结果'
    }
  },
  data() {
    return {
      scaleData: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      loadError: false,
      disclaimerText: '本评估结果仅供参考和筛查使用，不能替代专业医疗诊断。如有心理健康问题，请及时寻求专业心理咨询师或医生的帮助。',
      timeInput: '',
      numberInput: '',
      autoAdvanceTimer: null,
      isAdvancing: false,
      // 答题时长统计
      startTime: 0,
      questionStartTime: 0,
      questionTimes: {},  // 记录每题用时
      totalElapsedTime: 0,  // 总用时（秒）
      timerInterval: null,  // 计时器
      // 进度保存
      progressSaveKey: '',
      hasRestoredProgress: false,
      // 暂停功能
      isPaused: false,
      pausedAt: 0,
      // 题目标记
      markedQuestions: [],  // 被标记的题目ID列表
      // 历史回顾模式
      isReviewMode: false,
      // 主题模式
      isDarkMode: false,
      // 字体大小
      fontSize: 'medium',  // small, medium, large
      // 导出对话框
      showExport: false
    }
  },
  computed: {
    currentQuestion() {
      return this.questions[this.currentIndex] || null
    },
    progressPercent() {
      if (!this.questions.length) return 0
      return ((this.currentIndex + 1) / this.questions.length) * 100
    },
    formattedTime() {
      const minutes = Math.floor(this.totalElapsedTime / 60);
      const seconds = this.totalElapsedTime % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    scaleOptions() {
      return this.scaleData?.options || []
    },
    canPrev() {
      return this.currentIndex > 0
    },
    canNext() {
      if (!this.currentQuestion) return false
      if (this.currentQuestion.type === 'time' || this.currentQuestion.type === 'number') {
        return this.answers[this.currentQuestion.field || this.currentQuestion.id] !== undefined
      }
      return this.answers[this.currentQuestion.id] !== undefined
    },
    canProceed() {
      return this.canNext
    },
    isLastQuestion() {
      return this.currentIndex === this.questions.length - 1
    },
    isQuestionMarked() {
      return this.currentQuestion && this.markedQuestions.includes(this.currentQuestion.id)
    },
    fontSizeLabel() {
      const labels = {
        small: '小',
        medium: '中',
        large: '大'
      };
      return labels[this.fontSize] || '中';
    }
  },
  mounted() {
    // 设置进度保存key
    this.progressSaveKey = `scale_progress_${this.scaleId}`;
    
    // 加载主题偏好
    this.loadThemePreference();
    
    // 加载字体大小偏好
    this.loadFontSizePreference();
    
    // 加载量表
    this.loadScale();
    
    // 恢复已保存的答题进度
    this.restoreProgress();
    
    // 预填充输入框
    this.prefillInputs();
    
    // 开始计时
    this.startTime = Date.now();
    this.questionStartTime = Date.now();
    this.startTimer();
    
    // #ifdef H5
    // H5端注册键盘事件
    this.registerKeyboardShortcuts();
    // #endif
    
    console.log(`[ASSESS] nav ${this.scaleId}`);
  },
  
  beforeDestroy() {
    // 清理自动跳题定时器
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    
    // 清理计时器
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // #ifdef H5
    // 移除键盘事件
    this.unregisterKeyboardShortcuts();
    // #endif
  },
  
  methods: {
    /**
     * 加载主题偏好
     */
    loadThemePreference() {
      try {
        const savedTheme = uni.getStorageSync('scale_theme_preference');
        if (savedTheme) {
          this.isDarkMode = savedTheme === 'dark';
        } else {
          // 根据系统时间自动判断（晚上8点到早上7点使用夜间模式）
          const hour = new Date().getHours();
          this.isDarkMode = hour >= 20 || hour < 7;
        }
        console.log(`[THEME] 加载主题偏好: ${this.isDarkMode ? '夜间' : '日间'}模式`);
      } catch (e) {
        console.error('[THEME] 加载主题偏好失败:', e);
        this.isDarkMode = false;
      }
    },
    
    /**
     * 切换主题
     * 任务3: 夜间模式主题切换
     */
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode;

      // 保存主题偏好
      try {
        uni.setStorageSync('scale_theme_preference', this.isDarkMode ? 'dark' : 'light');
        uni.showToast({
          title: this.isDarkMode ? '已切换到夜间模式' : '已切换到日间模式',
          icon: 'none',
          duration: 1500
        });
        console.log(`[THEME] 切换主题: ${this.isDarkMode ? '夜间' : '日间'}模式`);

        // 任务3增强: 记录主题变更事件
        this.$emit('theme-changed', {
          isDarkMode: this.isDarkMode,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error('[THEME] 保存主题偏好失败:', e);
      }
    },
    
    /**
     * 加载字体大小偏好
     */
    loadFontSizePreference() {
      try {
        const savedSize = uni.getStorageSync('scale_font_size_preference');
        if (savedSize && ['small', 'medium', 'large'].includes(savedSize)) {
          this.fontSize = savedSize;
        } else {
          this.fontSize = 'medium';
        }
        console.log(`[FONT] 加载字体大小偏好: ${this.fontSize}`);
      } catch (e) {
        console.error('[FONT] 加载字体大小偏好失败:', e);
        this.fontSize = 'medium';
      }
    },
    
    /**
     * 循环切换字体大小
     * 任务4: 题目文字大小调节（小/中/大）
     */
    cycleFontSize() {
      const sizes = ['small', 'medium', 'large'];
      const currentIndex = sizes.indexOf(this.fontSize);
      const nextIndex = (currentIndex + 1) % sizes.length;
      this.fontSize = sizes[nextIndex];

      // 保存字体大小偏好
      try {
        uni.setStorageSync('scale_font_size_preference', this.fontSize);
        const labels = { small: '小', medium: '中', large: '大' };
        uni.showToast({
          title: `字体大小：${labels[this.fontSize]}`,
          icon: 'none',
          duration: 1500
        });
        console.log(`[FONT] 切换字体大小: ${this.fontSize}`);

        // 任务4增强: 记录字体大小变更事件
        this.$emit('font-size-changed', {
          fontSize: this.fontSize,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error('[FONT] 保存字体大小偏好失败:', e);
      }
    },
    
    /**
     * 启动计时器
     * 任务9: 答题计时器和时长统计
     */
    startTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      this.timerInterval = setInterval(() => {
        if (!this.isPaused) {
          this.totalElapsedTime++;

          // 任务9增强: 每30秒记录一次时长统计
          if (this.totalElapsedTime % 30 === 0) {
            this.$emit('time-milestone', {
              elapsedTime: this.totalElapsedTime,
              currentIndex: this.currentIndex,
              answeredCount: Object.keys(this.answers).length
            });
          }
        }
      }, 1000);
    },
    
    /**
     * 暂停/继续答题
     * 任务8: 答题暂停/继续按钮
     */
    handleTogglePause() {
      this.isPaused = !this.isPaused;

      if (this.isPaused) {
        this.pausedAt = Date.now();
        uni.showToast({
          title: '已暂停答题',
          icon: 'none',
          duration: 1500
        });
        console.log('[ASSESS] 答题已暂停');

        // 任务8增强: 记录暂停事件
        this.$emit('assessment-paused', {
          currentIndex: this.currentIndex,
          pausedAt: this.pausedAt,
          elapsedTime: this.totalElapsedTime
        });
      } else {
        // 继续答题时，调整题目开始时间
        const pauseDuration = Date.now() - this.pausedAt;
        this.questionStartTime += pauseDuration;

        uni.showToast({
          title: '继续答题',
          icon: 'none',
          duration: 1500
        });
        console.log('[ASSESS] 继续答题');

        // 任务8增强: 记录继续事件
        this.$emit('assessment-resumed', {
          currentIndex: this.currentIndex,
          resumedAt: Date.now(),
          pauseDuration: pauseDuration
        });
      }
    },
    
    /**
     * 切换题目标记
     */
    toggleQuestionMark() {
      if (!this.currentQuestion) return;
      
      const questionId = this.currentQuestion.id;
      const index = this.markedQuestions.indexOf(questionId);
      
      if (index > -1) {
        // 取消标记
        this.markedQuestions.splice(index, 1);
        uni.showToast({
          title: '已取消标记',
          icon: 'none',
          duration: 1000
        });
      } else {
        // 添加标记
        this.markedQuestions.push(questionId);
        uni.showToast({
          title: '已标记此题',
          icon: 'none',
          duration: 1000
        });
      }
      
      console.log(`[ASSESS] 题目标记状态: ${questionId}, 已标记: ${this.markedQuestions.length}题`);
    },
    
    /**
     * 切换回顾模式
     */
    toggleReviewMode() {
      this.isReviewMode = !this.isReviewMode;
      
      if (this.isReviewMode) {
        // 显示历史答案回顾界面
        this.showReviewDialog();
      }
    },
    
    /**
     * 显示历史答案回顾对话框
     */
    showReviewDialog() {
      const answeredCount = Object.keys(this.answers).length;
      const markedCount = this.markedQuestions.length;
      
      const content = `
已答题目：${answeredCount}/${this.questions.length}
标记题目：${markedCount}题

提示：
- 使用「上一题」「下一题」按钮浏览
- 点击 ⭐ 可标记需要复查的题目
- 可修改之前的答案
      `.trim();
      
      uni.showModal({
        title: '答题回顾',
        content: content,
        showCancel: true,
        confirmText: '继续答题',
        cancelText: '查看标记',
        success: (res) => {
          if (!res.confirm && markedCount > 0) {
            // 跳转到第一个标记的题目
            this.jumpToMarkedQuestion(0);
          }
        }
      });
    },
    
    /**
     * 跳转到标记的题目
     */
    jumpToMarkedQuestion(markedIndex) {
      if (markedIndex >= this.markedQuestions.length) return;
      
      const markedQuestionId = this.markedQuestions[markedIndex];
      const questionIndex = this.questions.findIndex(q => q.id === markedQuestionId);
      
      if (questionIndex !== -1) {
        this.currentIndex = questionIndex;
        this.prefillInputs();
        
        uni.showToast({
          title: `已跳转到第${questionIndex + 1}题`,
          icon: 'none'
        });
      }
    },
    
    /**
     * 显示标记题目分析（提交前）
     */
    // 任务10: 标记题目分析功能
    showMarkedQuestionsAnalysis() {
      const markedCount = this.markedQuestions.length;
      const markedDetails = this.markedQuestions.map((qid, index) => {
        const questionIndex = this.questions.findIndex(q => q.id === qid);
        return `${index + 1}. 第${questionIndex + 1}题`;
      }).join('\n');

      const content = `
您标记了${markedCount}个需要关注的题目：

${markedDetails}

这些题目可能值得在日常生活中多加关注。是否继续提交评估？
      `.trim();

      uni.showModal({
        title: '📋 标记题目分析',
        content: content,
        confirmText: '提交评估',
        cancelText: '返回修改',
        success: (res) => {
          if (res.confirm) {
            // 用户确认提交
            this.clearProgress();

            // 任务10增强: 记录标记题目分析事件
            this.$emit('marked-questions-analyzed', {
              markedCount: markedCount,
              markedQuestions: this.markedQuestions,
              totalQuestions: this.questions.length,
              timestamp: Date.now()
            });

            this.calculateResult();
          } else {
            // 用户选择返回修改，跳转到第一个标记的题目
            this.jumpToMarkedQuestion(0);
          }
        }
      });

      console.log(`[ASSESS] 显示标记题目分析: ${markedCount}题`);
    },
    
    /**
     * 注册键盘快捷键（仅H5）
     */
    registerKeyboardShortcuts() {
      // #ifdef H5
      this.handleKeyPress = (e) => {
        // 暂停时不响应快捷键
        if (this.isPaused) return;
        
        // 数字键1-5选择选项
        if (e.key >= '1' && e.key <= '5') {
          const optionIndex = parseInt(e.key) - 1;
          const values = this.getQuestionValues();
          
          if (optionIndex < values.length && this.currentQuestion) {
            this.selectOption(this.currentQuestion.id, values[optionIndex]);
          }
        }
        
        // 左箭头：上一题
        if (e.key === 'ArrowLeft' && this.canPrev) {
          this.handlePrev();
        }
        
        // 右箭头：下一题
        if (e.key === 'ArrowRight' && this.canNext) {
          this.handleNext();
        }
        
        // 空格：暂停/继续
        if (e.key === ' ') {
          e.preventDefault();
          this.handleTogglePause();
        }
        
        // M键：标记题目
        if (e.key === 'm' || e.key === 'M') {
          this.toggleQuestionMark();
        }
      };
      
      window.addEventListener('keydown', this.handleKeyPress);
      console.log('[ASSESS] 键盘快捷键已启用');
      // #endif
    },
    
    /**
     * 移除键盘快捷键
     */
    unregisterKeyboardShortcuts() {
      // #ifdef H5
      if (this.handleKeyPress) {
        window.removeEventListener('keydown', this.handleKeyPress);
        console.log('[ASSESS] 键盘快捷键已禁用');
      }
      // #endif
    },
    
    /**
     * 播放答题音效
     */
    playAnswerSound() {
      try {
        // #ifdef H5
        // H5端可以使用Audio API
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUA'; // 简短音效的base64编码
        audio.volume = 0.3;
        audio.play().catch(err => {
          console.log('[ASSESS] 音效播放失败:', err);
        });
        // #endif
        
        // #ifndef H5
        // 小程序端使用震动反馈
        uni.vibrateShort({
          success: () => {
            console.log('[ASSESS] 震动反馈');
          }
        });
        // #endif
      } catch (error) {
        console.warn('[ASSESS] 音效播放失败:', error);
      }
    },
    
    loadScale() {
      try {
        // 本地题库映射表(硬引用确保打包时不被tree-shaking移除)
        const scaleMap = {
          // 新量表
          'pss10': () => require('@/static/scales/pss10.json'),
          'phq9': () => require('@/static/scales/phq9.json'),
          'gad7': () => require('@/static/scales/gad7.json'),
          'who5': () => require('@/static/scales/who5.json'),
          'k6': () => require('@/static/scales/k6.json'),
          'k10': () => require('@/static/scales/k10.json'),
          'asq4': () => require('@/static/scales/asq4.json'),
          'youth_social_anxiety_6': () => require('@/static/scales/youth_social_anxiety_6.json'),
          'academic_stress_8': () => require('@/static/scales/academic_stress_8.json'),
          'sleep_health_6': () => require('@/static/scales/sleep_health_6.json'),
          // 保持向后兼容
          'mini_spin3': () => require('@/static/scales/mini_spin3.json'),
          'spin17': () => require('@/static/scales/spin17.json'),
          'essa16': () => require('@/static/scales/essa16.json'),
          'psqi19': () => require('@/static/scales/psqi19.json')
        }
        
        // 获取对应的题库加载函数
        const loadFunc = scaleMap[this.scaleId]
        if (!loadFunc) {
          throw new Error(`Unknown scale ID: ${this.scaleId}`)
        }
        
        // 加载题库数据
        let scaleData = loadFunc()
        
        // 兼容CJS/ESM差异，处理.default
        if (scaleData.default) {
          scaleData = scaleData.default
        }
        
        this.scaleData = scaleData
        this.questions = this.scaleData.items || []
        
        // 统计题目数量
        const itemCount = this.questions.length || Object.keys(this.scaleData.schema || {}).length
        
        // 自检日志
        console.log(`[ASSESS] scale loaded: ${this.scaleId} items=${itemCount}`)
        
      } catch (error) {
        console.error('Error loading scale:', error)
        this.loadError = true
        uni.showToast({
          title: `量表资源缺失或路径错误(${this.scaleId})`,
          icon: 'none'
        })
      }
    },
    
    selectOption(questionId, value) {
      // 防止答题暂停时选择
      if (this.isPaused) {
        uni.showToast({
          title: '答题已暂停',
          icon: 'none'
        });
        return;
      }
      
      // 防止在自动跳题过程中重复点击
      if (this.isAdvancing) return
      
      // 记录当前题目用时
      const questionTime = Date.now() - this.questionStartTime;
      this.questionTimes[questionId] = questionTime;
      
      this.$set(this.answers, questionId, value)
      console.log(`[ASSESS] answer set q=${this.currentIndex + 1} v=${value} time=${questionTime}ms`)
      
      // 播放答题音效
      this.playAnswerSound();
      
      // 自动保存答题进度
      this.saveProgress();
      
      // 仅对单选题启用自动跳题
      const isSelectType = !this.currentQuestion.type || this.currentQuestion.type === 'select'
      if (isSelectType && !this.isLastQuestion) {
        this.startAutoAdvance()
      }
    },
    
    getQuestionOptions() {
      if (this.currentQuestion && this.currentQuestion.labels) {
        return this.currentQuestion.labels
      }
      return this.scaleData?.options || []
    },
    
    getQuestionValues() {
      if (this.currentQuestion && this.currentQuestion.options) {
        return this.currentQuestion.options
      }
      return this.scaleData?.scale || []
    },
    
    getNumberPlaceholder() {
      if (this.currentQuestion.field === 'sleep_latency_min') {
        return '请输入分钟数，如: 30'
      } else if (this.currentQuestion.field === 'sleep_duration_h') {
        return '请输入小时数，如: 7.5'
      }
      return '请输入数字'
    },
    
    handleTimeInput() {
      if (this.timeInput && this.currentQuestion.field) {
        this.$set(this.answers, this.currentQuestion.field, this.timeInput)
      }
    },
    
    handleNumberInput() {
      if (this.numberInput && this.currentQuestion.field) {
        const value = parseFloat(this.numberInput) || 0
        this.$set(this.answers, this.currentQuestion.field, value)
      }
    },
    
    startAutoAdvance() {
      // 清除之前的定时器
      if (this.autoAdvanceTimer) {
        clearTimeout(this.autoAdvanceTimer)
      }
      
      this.isAdvancing = true
      this.autoAdvanceTimer = setTimeout(() => {
        if (!this.isLastQuestion && this.canNext) {
          this.currentIndex++
          this.prefillInputs()
          console.log(`[ASSESS] auto-advance to q=${this.currentIndex + 1}`)
        }
        this.isAdvancing = false
      }, 250) // 250ms延迟
    },
    
    handlePrev() {
      if (!this.canPrev) return
      
      // 清除自动跳题定时器
      if (this.autoAdvanceTimer) {
        clearTimeout(this.autoAdvanceTimer)
        this.isAdvancing = false
      }
      
      this.currentIndex--
      this.prefillInputs()
      console.log(`[ASSESS] prev to q=${this.currentIndex + 1}`)
    },
    
    handleNext() {
      if (!this.canNext) return
      
      // 清除自动跳题定时器
      if (this.autoAdvanceTimer) {
        clearTimeout(this.autoAdvanceTimer)
        this.isAdvancing = false
      }
      
      // 清空输入框
      this.timeInput = ''
      this.numberInput = ''
      
      if (this.isLastQuestion) {
        console.log(`[ASSESS] submit`)
        // 提交前显示标记题目分析
        if (this.markedQuestions.length > 0) {
          this.showMarkedQuestionsAnalysis();
        } else {
          // 提交时清除保存的进度
          this.clearProgress();
          this.calculateResult();
        }
      } else {
        this.currentIndex++
        this.questionStartTime = Date.now(); // 重置题目计时
        this.prefillInputs()
        console.log(`[ASSESS] next to q=${this.currentIndex + 1}`)
      }
    },
    
    // 保存答题进度到localStorage
    // 任务7: 答题进度localStorage自动保存
    saveProgress() {
      try {
        const progressData = {
          scaleId: this.scaleId,
          currentIndex: this.currentIndex,
          answers: this.answers,
          questionTimes: this.questionTimes,
          startTime: this.startTime,
          savedAt: Date.now(),
          version: '1.0'
        };

        uni.setStorageSync(this.progressSaveKey, JSON.stringify(progressData));
        console.log(`[ASSESS] progress saved: ${this.currentIndex + 1}/${this.questions.length}`);

        // 任务7增强: 记录进度保存事件
        this.$emit('progress-saved', {
          currentIndex: this.currentIndex,
          totalQuestions: this.questions.length,
          answeredCount: Object.keys(this.answers).length,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('[ASSESS] 保存进度失败:', error);
      }
    },
    
    // 恢复答题进度
    restoreProgress() {
      try {
        const savedData = uni.getStorageSync(this.progressSaveKey);
        
        if (!savedData) {
          console.log('[ASSESS] 无已保存的进度');
          return;
        }
        
        const progressData = JSON.parse(savedData);
        
        // 验证数据有效性
        if (progressData.scaleId !== this.scaleId) {
          console.warn('[ASSESS] 量表ID不匹配');
          return;
        }
        
        // 检查保存时间（超过24小时的进度不恢复）
        const savedAge = Date.now() - progressData.savedAt;
        if (savedAge > 24 * 60 * 60 * 1000) {
          console.log('[ASSESS] 进度过期（>24小时），清除');
          this.clearProgress();
          return;
        }
        
        // 询问是否恢复
        if (Object.keys(progressData.answers).length > 0) {
          uni.showModal({
            title: '发现未完成的答题',
            content: `您上次答到第${progressData.currentIndex + 1}题，是否继续？`,
            confirmText: '继续答题',
            cancelText: '重新开始',
            success: (res) => {
              if (res.confirm) {
                // 恢复进度
                this.currentIndex = progressData.currentIndex || 0;
                this.answers = progressData.answers || {};
                this.questionTimes = progressData.questionTimes || {};
                this.startTime = progressData.startTime || Date.now();
                this.questionStartTime = Date.now();
                this.hasRestoredProgress = true;
                
                this.prefillInputs();
                
                console.log(`[ASSESS] 进度已恢复`);
                
                uni.showToast({
                  title: '已恢复答题进度',
                  icon: 'success'
                });
              } else {
                // 清除进度
                this.clearProgress();
              }
            }
          });
        }
        
      } catch (error) {
        console.error('[ASSESS] 恢复进度失败:', error);
      }
    },
    
    // 清除保存的进度
    clearProgress() {
      try {
        uni.removeStorageSync(this.progressSaveKey);
        console.log('[ASSESS] 进度已清除');
      } catch (error) {
        console.error('[ASSESS] 清除进度失败:', error);
      }
    },
    
    prefillInputs() {
      if (this.currentQuestion) {
        if (this.currentQuestion.type === 'time' && this.currentQuestion.field) {
          this.timeInput = this.answers[this.currentQuestion.field] || ''
        } else if (this.currentQuestion.type === 'number' && this.currentQuestion.field) {
          this.numberInput = this.answers[this.currentQuestion.field] ? String(this.answers[this.currentQuestion.field]) : ''
        }
      }
    },
    
    calculateResult() {
      let answersArray, result = null
      
      try {
        // 特殊处理PSQI-19(使用对象格式)
        if (this.scaleId === 'psqi19') {
          result = scoreUnified(this.scaleId, this.answers)
        } else {
          // 标准处理(使用数组格式)
          answersArray = this.questions.map(q => this.answers[q.id])
          result = scoreUnified(this.scaleId, answersArray)
        }
        
        
        // 合规日志记录(一次性脱敏日志)
        console.log(`[ASSESS] ${this.scaleId} submit, score=${result.total}`)
        
        // 保存评估记录到本地(不包含明文答案，仅保存统计信息)
        this.saveAssessmentRecord(result)
        
        // 处理特殊分流逻辑
        this.handleSpecialFlow(result)
        
        const summary = this.buildResultSummary(result)
        console.log('[ASSESS] submit-ok')
        this.navigateToResult(summary)
        
      } catch (error) {
        console.error('Error calculating result:', error)
        uni.showToast({
          title: '计算结果失败',
          icon: 'none'
        })
      }
    },
    
    buildResultSummary(result) {
      const safeResult = result || {}
      const total = typeof safeResult.total === 'number' ? safeResult.total : 0
      const level = this.determineLevel(safeResult, total)
      const levelLabel = this.getLevelLabel(level)

      return {
        score: total,
        level,
        levelLabel,
        scaleId: this.scaleId,
        ts: Date.now()
      }
    },

    determineLevel(result, total) {
      if (result && typeof result.level === 'string' && result.level) {
        return result.level
      }

      switch (this.scaleId) {
        case 'pss10':
          if (total >= 27) return 'high'
          if (total >= 14) return 'medium'
          return 'low'
        case 'academic_stress_8':
          if (total >= 18) return 'high'
          if (total >= 14) return 'medium'
          return 'low'
        case 'youth_social_anxiety_6':
          if (total >= 16) return 'high'
          if (total >= 12) return 'medium'
          return 'low'
        case 'sleep_health_6':
          if (result && Array.isArray(result.alerts) && result.alerts.length) {
            return 'high'
          }
          if (total >= 9) return 'medium'
          return 'low'
        default:
          if (result && (result.band || result.band_label)) {
            return this.mapLabelToLevel(result.band || result.band_label)
          }
          return 'unknown'
      }
    },

    mapLabelToLevel(label) {
      if (!label || typeof label !== 'string') {
        return 'unknown'
      }
      if (/高|重|严/.test(label)) return 'high'
      if (/中|适/.test(label)) return 'medium'
      if (/低|轻|良/.test(label)) return 'low'
      return 'unknown'
    },

    getLevelLabel(level) {
      const labels = {
        high: '风险偏高',
        medium: '中等风险',
        low: '风险较低',
        critical: '需立即关注',
        unknown: '待评估'
      }
      return labels[level] || labels.unknown
    },

    navigateToResult(summary) {
      try {
        const payload = summary || {}
        const raw = JSON.stringify(payload)
        const encoded = encodeURIComponent(raw)
        
        // 统一跳转到result.vue页面
        const resultPath = '/pages-sub/assess/result'
        let url = `${resultPath}?scaleId=${this.scaleId || 'unknown'}`
        
        // 如果payload过大，使用storage传递
        if (encoded.length <= 1800) {
          url = `${url}&payload=${encoded}`
        } else {
          uni.setStorageSync('assess_result', payload)
          console.log(`[ASSESS] result payload too large (${encoded.length}), using storage`)
        }

        console.log(`[ASSESS] navigating to unified result page: ${resultPath}`)
        this.$emit('complete', payload)

        // 保存到历史记录
        try {
          const history = uni.getStorageSync('assessment_history') || []
          history.push({
            scaleId: this.scaleId,
            score: payload.score || payload.total_score || 0,
            level: payload.level || 'unknown',
            timestamp: Date.now()
          })
          // 只保留最近50条记录
          if (history.length > 50) {
            history.splice(0, history.length - 50)
          }
          uni.setStorageSync('assessment_history', history)
        } catch (err) {
          console.warn('[ASSESS] failed to save to history:', err)
        }

        uni.navigateTo({
          url,
          fail: (err) => {
            console.error('[ASSESS] navigate failed, trying redirectTo:', err)
            uni.redirectTo({ 
              url,
              fail: (err2) => {
                console.error('[ASSESS] redirectTo also failed:', err2)
                uni.showToast({
                  title: '页面跳转失败',
                  icon: 'none'
                })
              }
            })
          }
        })
      } catch (error) {
        console.error('[ASSESS] Error navigating to result view:', error)
        this.$emit('complete', summary || {})
        uni.showToast({
          title: '结果加载失败',
          icon: 'none'
        })
      }
    },

    handleSpecialFlow(result) {
      // Mini-SPIN 分流逻辑
      if (this.scaleId === 'mini_spin3' && result.total >= 6) {
        uni.showModal({
          title: '建议进一步评估',
          content: `您的快筛得分为 ${result.total} 分，建议继续完成详细的社交焦虑评估以获得更准确的结果。`,
          confirmText: '继续评估',
          cancelText: '暂不评估',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/assess/social/spin'
              })
            }
          }
        })
      }
      
      // PHQ-9 自伤想法检查
      if (this.scaleId === 'phq9' && result.followups && result.followups.includes('asq4')) {
        uni.showModal({
          title: '安全提示',
          content: '检测到自伤想法，建议立即寻求专业帮助。如有紧急情况，请拨打心理危机干预热线: 400-161-9995',
          confirmText: '了解',
          showCancel: false
        })
      }
      
      // ASQ-4 阳性结果处理
      if (this.scaleId === 'asq4' && result.isPositive) {
        uni.showModal({
          title: '紧急安全提示',
          content: '检测到自杀风险，请立即寻求专业帮助或前往最近医院急诊科。心理危机干预热线: 400-161-9995',
          confirmText: '了解',
          showCancel: false
        })
      }
    },
    

    handleComplete() {
      uni.navigateBack()
    },
    
    saveAssessmentRecord(result) {
      try {
        const record = {
          scaleId: this.scaleId,
          title: this.title,
          timestamp: new Date().toISOString(),
          score: result.total,
          band: result.band || '',
          // 不保存明文答案，仅保存统计摘要
          summary: {
            totalQuestions: this.questions.length,
            completed: true
          }
        }
        
        // 获取现有记录
        const existingRecords = uni.getStorageSync('assessment_history') || []
        existingRecords.push(record)
        
        // 只保留最近50条记录
        if (existingRecords.length > 50) {
          existingRecords.splice(0, existingRecords.length - 50)
        }
        
        uni.setStorageSync('assessment_history', existingRecords)
        console.log(`[ASSESS] ${this.scaleId} record saved (privacy-safe)`)
      } catch (error) {
        console.error('Error saving assessment record:', error)
      }
    },
    
    // 显示导出对话框
    showExportDialog() {
      if (Object.keys(this.answers).length === 0) {
        uni.showToast({
          title: '暂无答题数据可导出',
          icon: 'none'
        });
        return;
      }
      
      this.showExport = true;
    },
    
    // 处理导出
    async handleExport(format) {
      try {
        uni.showLoading({
          title: '正在导出...',
          mask: true
        });
        
        // 准备导出数据
        const exportOptions = {
          scaleId: this.scaleId,
          title: this.title,
          questions: this.questions,
          answers: this.answers,
          questionTimes: this.questionTimes,
          totalTime: this.totalElapsedTime,
          markedQuestions: this.markedQuestions,
          scaleData: this.scaleData,
          result: null  // 未完成时无结果
        };
        
        // 调用导出工具
        const result = await exportAssessmentData(exportOptions, format);
        
        uni.hideLoading();
        
        if (result.success) {
          this.showExport = false;
          
          uni.showToast({
            title: result.message,
            icon: 'success',
            duration: 2000
          });
          
          console.log(`[ASSESS] 数据导出成功: ${format}`, result);
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        uni.hideLoading();
        console.error('[ASSESS] 导出失败:', error);
        
        uni.showToast({
          title: error.message || '导出失败',
          icon: 'none',
          duration: 2000
        });
      }
    }
  }
}
</script>

<style scoped>
.scale-runner {
  min-height: 100vh;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  /* 顶部安全区域 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

/* 进度条 */
.progress-bar {
  height: 44px;
  background: #F2F2F7;
  position: sticky;
  top: 0;
  z-index: 100;
  /* 任务1: 进度条safe-area-inset-top适配 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  /* 确保进度条在安全区域下方 */
  margin-top: constant(safe-area-inset-top);
  margin-top: env(safe-area-inset-top);
}

.progress-fill {
  height: 100%;
  background: #007AFF;
  transition: width 0.3s ease;
}

/* 题目卡片 */
.question-card {
  flex: 1;
  padding: 32rpx 24rpx;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom)); /* 为底部导航条留出空间 */
}

.question-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.header-left {
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-left: 16rpx;
}

.mark-btn,
.review-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #F5F5F7;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.mark-btn:active,
.review-btn:active {
  transform: scale(0.95);
  background: #E5E5EA;
}

.mark-btn.marked {
  background: rgba(255, 184, 0, 0.1);
}

.question-number {
  font-size: 28rpx;
  color: #8E8E93;
  display: block;
  margin-bottom: 8rpx;
}

.scale-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.question-content {
  background: #F9FAFB;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.question-text {
  font-size: 32rpx;
  color: #1D1D1F;
  line-height: 1.6;
}

/* 选项列表 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* 小屏幕优化 */
@media screen and (max-height: 667px) {
  .options-list {
    gap: 12rpx;
  }
  
  .option-item {
    padding: 20rpx 24rpx;
  }
}

.option-item {
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  min-height: 96rpx;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  transition: all 0.2s ease;
  border: 2rpx solid transparent;
}

.option-selected {
  background: rgba(0, 122, 255, 0.1);
  border-color: #007AFF;
}

.option-radio {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2rpx solid #C7C7CC;
  margin-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-selected .option-radio {
  border-color: #007AFF;
}

.radio-dot {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #007AFF;
}

.option-text {
  font-size: 30rpx;
  color: #1D1D1F;
  flex: 1;
}

/* 错误提示卡片 */
.error-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 24rpx;
}

.error-content {
  background: #F9FAFB;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.error-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #DC3545;
  display: block;
  margin-bottom: 16rpx;
}

.error-message {
  font-size: 28rpx;
  color: #6C757D;
  line-height: 1.5;
  display: block;
  margin-bottom: 32rpx;
}

.error-button {
  width: 200rpx;
  height: 72rpx;
  border-radius: 20rpx;
}

/* 输入区域 */
.input-section {
  margin-top: 32rpx;
  padding: 16rpx 0;
}

/* 任务6: 输入框触摸区域扩大（确保最小44px触摸区域） */
.time-input,
.number-input {
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  min-height: 88rpx; /* 确保最小44px触摸区域 */
  font-size: 30rpx;
  border: 2rpx solid #E5E5EA;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.time-input:focus,
.number-input:focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 4rpx rgba(0, 122, 255, 0.1);
  background: #FFFFFF;
}

/* 底部导航条 */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.nav-button-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;
}

.nav-button {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
}

.nav-button-prev {
  background: rgba(0, 0, 0, 0.05);
  border: 1rpx solid rgba(0, 0, 0, 0.1);
}

.nav-button-next {
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.3);
}

.nav-button-submit {
  background: linear-gradient(135deg, #34C759 0%, #30D158 100%);
  box-shadow: 0 8rpx 24rpx rgba(52, 199, 89, 0.3);
}

.nav-button-disabled {
  opacity: 0.4;
  transform: none !important;
  box-shadow: none !important;
}

.nav-button:not(.nav-button-disabled):active {
  transform: scale(0.95);
}

.nav-button-text {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.nav-button-next .nav-button-text,
.nav-button-submit .nav-button-text {
  color: #fff;
}

.nav-button-disabled .nav-button-text {
  color: #999;
}

.nav-hint {
  text-align: center;
  margin-top: 16rpx;
}

.nav-hint-text {
  font-size: 24rpx;
  color: #999;
}

/* 顶部信息栏 */
.top-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx;
  background: #F9FAFB;
  border-bottom: 1rpx solid #E5E5EA;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 22rpx;
  color: #8E8E93;
  margin-bottom: 4rpx;
}

.info-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.font-size-btn,
.theme-btn,
.pause-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(0, 122, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.font-size-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #007AFF;
}

.font-size-btn:active,
.theme-btn:active,
.pause-btn:active {
  transform: scale(0.95);
  background: rgba(0, 122, 255, 0.2);
}

/* ==================== 字体大小调节 ==================== */
/* 小字体 */
.question-card.font-size-small .question-text {
  font-size: 28rpx;
  line-height: 1.6;
}

.question-card.font-size-small .option-text {
  font-size: 26rpx;
}

.question-card.font-size-small .question-number {
  font-size: 22rpx;
}

.question-card.font-size-small .scale-title {
  font-size: 24rpx;
}

/* 中等字体（默认） */
.question-card.font-size-medium .question-text {
  font-size: 32rpx;
  line-height: 1.7;
}

.question-card.font-size-medium .option-text {
  font-size: 28rpx;
}

.question-card.font-size-medium .question-number {
  font-size: 24rpx;
}

.question-card.font-size-medium .scale-title {
  font-size: 26rpx;
}

/* 大字体 */
.question-card.font-size-large .question-text {
  font-size: 36rpx;
  line-height: 1.8;
}

.question-card.font-size-large .option-text {
  font-size: 32rpx;
}

.question-card.font-size-large .question-number {
  font-size: 26rpx;
}

.question-card.font-size-large .scale-title {
  font-size: 28rpx;
}

/* 响应式适配 - 小屏幕 */
@media screen and (max-width: 320px) {
  .question-card {
    padding: 24rpx 16rpx;
  }

  .question-text {
    font-size: 28rpx;
  }

  .option-text {
    font-size: 26rpx;
  }

  /* 任务2: 小屏幕设备选项间距优化 */
  .option-item {
    padding: 12rpx 16rpx;
    margin-bottom: 8rpx;
  }

  .option-radio {
    width: 44px;
    height: 44px;
    margin-right: 16rpx;
  }

  .radio-dot {
    width: 44px;
    height: 44px;
  }
}

/* iPhone SE 及以下小屏幕优化 */
@media screen and (max-width: 375px) {
  .option-item {
    padding: 14rpx 18rpx;
    margin-bottom: 10rpx;
  }

  .nav-button {
    height: 80rpx;
  }

  .nav-button-text {
    font-size: 28rpx;
  }
}

/* 响应式适配 - 横屏模式 */
/* 任务5: 横屏模式布局优化 */
@media screen and (orientation: landscape) {
  .scale-runner {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .question-card {
    margin: 16rpx auto;
    max-width: 1200rpx;
    width: 90%;
  }

  .question-content {
    margin: 20rpx 0;
  }

  .question-text {
    font-size: 28rpx;
    line-height: 1.5;
  }

  .options-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
    margin-top: 20rpx;
  }

  .option-item {
    padding: 20rpx 24rpx;
    margin-bottom: 0;
  }

  .option-text {
    font-size: 26rpx;
  }
  
  .bottom-navigation {
    padding: 16rpx 40rpx;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  }
  
  .nav-button {
    height: 72rpx;
  }
  
  .nav-button-text {
    font-size: 28rpx;
  }
  
  .top-info-bar {
    padding: 12rpx 32rpx;
  }
  
  .info-label {
    font-size: 20rpx;
  }
  
  .info-value {
    font-size: 24rpx;
  }
  
  .font-size-btn,
  .theme-btn,
  .pause-btn {
    width: 56rpx;
    height: 56rpx;
  }
  
  .action-group {
    gap: 12rpx;
  }
}

/* ==================== 夜间模式 ==================== */
.scale-runner.dark-mode {
  background: #1C1C1E;
}

.dark-mode .progress-bar {
  background: rgba(255, 255, 255, 0.1);
}

.dark-mode .progress-fill {
  background: linear-gradient(90deg, #0A84FF 0%, #5E5CE6 100%);
}

.dark-mode .top-info-bar {
  background: #2C2C2E;
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.dark-mode .info-label {
  color: #8E8E93;
}

.dark-mode .info-value {
  color: #F5F5F7;
}

.dark-mode .font-size-btn {
  background: rgba(10, 132, 255, 0.15);
}

.dark-mode .font-size-btn:active {
  background: rgba(10, 132, 255, 0.25);
}

.dark-mode .font-size-text {
  color: #0A84FF;
}

.dark-mode .theme-btn {
  background: rgba(255, 214, 10, 0.15);
}

.dark-mode .theme-btn:active {
  background: rgba(255, 214, 10, 0.25);
}

.dark-mode .pause-btn {
  background: rgba(10, 132, 255, 0.15);
}

.dark-mode .pause-btn:active {
  background: rgba(10, 132, 255, 0.25);
}

.dark-mode .question-card {
  background: #2C2C2E;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.5);
}

.dark-mode .question-number {
  background: rgba(10, 132, 255, 0.2);
  color: #0A84FF;
}

.dark-mode .scale-title {
  color: #8E8E93;
}

.dark-mode .question-text {
  color: #F5F5F7;
}

.dark-mode .option-item {
  background: #3A3A3C;
  border-color: rgba(255, 255, 255, 0.1);
}

.dark-mode .option-item:hover {
  background: #48484A;
}

.dark-mode .option-selected {
  background: rgba(10, 132, 255, 0.2);
  border-color: #0A84FF;
}

.dark-mode .option-radio {
  border-color: rgba(255, 255, 255, 0.3);
}

.dark-mode .option-selected .option-radio {
  border-color: #0A84FF;
  background: #0A84FF;
}

.dark-mode .option-text {
  color: #F5F5F7;
}

.dark-mode .option-selected .option-text {
  color: #0A84FF;
}

.dark-mode .time-input,
.dark-mode .number-input {
  background: #3A3A3C;
  border-color: rgba(255, 255, 255, 0.1);
  color: #F5F5F7;
}

.dark-mode .time-input:focus,
.dark-mode .number-input:focus {
  border-color: #0A84FF;
}

.dark-mode .bottom-navigation {
  background: rgba(44, 44, 46, 0.95);
  border-top-color: rgba(255, 255, 255, 0.05);
}

.dark-mode .nav-button-prev {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

.dark-mode .nav-button-prev .nav-button-text {
  color: #F5F5F7;
}

.dark-mode .nav-button-next {
  background: linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%);
  box-shadow: 0 8rpx 24rpx rgba(10, 132, 255, 0.4);
}

.dark-mode .nav-button-submit {
  background: linear-gradient(135deg, #30D158 0%, #32D74B 100%);
  box-shadow: 0 8rpx 24rpx rgba(48, 209, 88, 0.4);
}

.dark-mode .nav-hint-text {
  color: #8E8E93;
}

.dark-mode .error-title {
  color: #FF453A;
}

.dark-mode .error-message {
  color: #8E8E93;
}

.dark-mode .mark-btn,
.dark-mode .review-btn {
  background: rgba(255, 255, 255, 0.1);
}

.dark-mode .mark-btn.marked {
  background: rgba(255, 184, 0, 0.2);
}

/* ==================== 导出对话框样式 ==================== */
.export-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.export-btn:active {
  opacity: 0.6;
  transform: scale(0.95);
}

.export-dialog {
  width: 560rpx;
  padding: 48rpx 32rpx 32rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
}

.export-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #000000;
  text-align: center;
  margin-bottom: 16rpx;
}

.export-tips {
  margin-bottom: 32rpx;
}

.export-tips-text {
  font-size: 24rpx;
  color: #8E8E93;
  text-align: center;
  display: block;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.export-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
  background: #F7F7F7;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.export-option:active {
  background: #ECECEC;
  transform: scale(0.98);
}

.export-option-icon {
  margin-bottom: 16rpx;
}

.export-option-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8rpx;
}

.export-option-desc {
  font-size: 24rpx;
  color: #8E8E93;
  text-align: center;
}

.export-actions {
  display: flex;
  justify-content: center;
}

.export-actions button {
  width: 200rpx;
}

/* 夜间模式下的导出对话框 */
.dark-mode .export-dialog {
  background: #2C2C2E;
}

.dark-mode .export-title {
  color: #FFFFFF;
}

.dark-mode .export-option {
  background: rgba(255, 255, 255, 0.05);
}

.dark-mode .export-option:active {
  background: rgba(255, 255, 255, 0.1);
}

.dark-mode .export-option-title {
  color: #FFFFFF;
}

.dark-mode .export-btn {
  background: rgba(10, 132, 255, 0.2);
}
</style>