<template>
  <view class="assess-page">
    <view v-if="isQuestionView" class="question-root">
      <ScaleRunner
        scaleId="pss10"
        title="֪��ѹ��������PSS-10��"
        submitText="�������"
      />
    </view>
    <view v-else class="result-root">
      <view v-if="resultData" class="result-card">
        <view class="result-header">
          <text class="result-title">评估结果</text>
        </view>
        <view class="result-metric">
          <text class="metric-label">总分</text>
          <text class="metric-value">{{ resultData.score }}</text>
        </view>
        <view class="result-metric">
          <text class="metric-label">等级</text>
          <text class="metric-value">{{ displayLevelLabel }}</text>
        </view>
        <view class="result-meta">
          <text class="meta-item">scaleId: {{ resultData.scaleId }}</text>
          <text class="meta-item">timestamp: {{ displayTimestamp }}</text>
          <text class="meta-item">level: {{ resultData.level }}</text>
        </view>
      </view>
      <view v-else class="result-card">
        <view class="result-header">
          <text class="result-title">暂无结果数据，请重新评估</text>
        </view>
      </view>
      <view class="footer-actions">
        <view class="nav-button-container">
          <view class="nav-button nav-button-prev" @tap="handleBack">
            <text class="nav-button-text">返回首页</text>
          </view>
          <view class="nav-button nav-button-submit" @tap="handleRedo">
            <text class="nav-button-text">重新评估</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import ScaleRunner from '@/components/scale/ScaleRunner.vue'
import { trackPageView } from '@/utils/analytics.js';

const PAGE_PATH = '/pages/assess/stress/index'

export default {
  name: 'StressAssess',
  components: {
    ScaleRunner
  },
  data() {
    return {
      view: 'question',
      resultData: null,
      payloadLen: 0
    }
  },
  computed: {
    isQuestionView() {
      return this.view !== 'result'
    },
    displayLevelLabel() {
      if (!this.resultData) return ''
      return this.mapLevelLabel(this.resultData.level, this.resultData.levelLabel)
    },
    displayTimestamp() {
      if (!this.resultData || !this.resultData.ts) return ''
      return this.formatTimestamp(this.resultData.ts)
    }
  },
  onLoad(options = {}) {
    console.log('[ASSESS] nav stress')
    this.resolveView(options)
  },
  onShow() {
    console.log(`[ASSESS] onShow view=${this.view}`)
    
    // 页面浏览埋点
    trackPageView(
      '/pages/assess/stress/index',
      '一般压力评估',
      {
        scale_id: 'pss10',
        view: this.view
      }
    );
  },
  methods: {
    handleBack() {
      console.log("[ASSESS] click back -> switchTab('/pages/home/home')")
      uni.switchTab({ url: '/pages/home/home' })
    },
    handleRedo() {
      console.log('[ASSESS] click redo')
      uni.removeStorageSync('assess_result')
      const entry = PAGE_PATH
      uni.reLaunch({ url: entry })
      console.log(`[ASSESS] redo done -> reLaunch(${entry})`)
    },
    resolveView(options) {
      if (options.view === 'result') {
        this.switchToResult(options)
      } else {
        this.view = 'question'
        this.resultData = null
        this.payloadLen = 0
      }
    },
    switchToResult(options = {}) {
      let payloadLen = 0
      let payloadData = null
      const rawPayload = options.payload

      if (rawPayload) {
        try {
          const decoded = decodeURIComponent(rawPayload)
          payloadLen = decoded.length
          payloadData = JSON.parse(decoded)
        } catch (error) {
          console.warn('[ASSESS] result payload decode failed', error)
        }
      }

      if (!payloadData) {
        const stored = uni.getStorageSync('assess_result')
        if (stored) {
          payloadData = stored
          payloadLen = JSON.stringify(stored).length
          uni.removeStorageSync('assess_result')
        }
      }

      this.resultData = payloadData || null
      this.payloadLen = payloadLen
      this.view = 'result'
      console.log(`[ASSESS] result-switch view=result payloadLen=${payloadLen}`)
    },
    formatTimestamp(ts) {
      const value = Number(ts)
      if (!Number.isFinite(value)) {
        return ''
      }
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return ''
      }
      const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
      const yyyy = date.getFullYear()
      const mm = pad(date.getMonth() + 1)
      const dd = pad(date.getDate())
      const hh = pad(date.getHours())
      const mi = pad(date.getMinutes())
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
    },
    mapLevelLabel(level, fallback) {
      const labels = {
        high: '压力偏高',
        medium: '中等压力',
        low: '压力较低',
        critical: '需立即关注',
        unknown: '待评估'
      }
      return labels[level] || fallback || labels.unknown
    }
  }
}
</script>

<style scoped>
.assess-page {
  min-height: 100vh;
  background: #FFFFFF;
}

.question-root {
  min-height: 100vh;
}

.result-root {
  min-height: 100vh;
  background: #FFFFFF;
  padding-bottom: 220rpx;
}

.result-card {
  padding: 32rpx 24rpx;
}

.result-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.result-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.result-metric {
  margin-bottom: 16rpx;
}

.metric-label {
  font-size: 28rpx;
  color: #8E8E93;
  display: block;
  margin-bottom: 8rpx;
}

.metric-value {
  font-size: 48rpx;
  font-weight: 600;
  color: #007AFF;
}

.result-meta {
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #6C6C6C;
  line-height: 1.6;
  word-break: break-all;
}

.meta-item {
  display: block;
}

.footer-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 40rpx;
  padding-bottom: calc(50px + constant(safe-area-inset-bottom));
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  z-index: 10000;
  pointer-events: auto;
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

.nav-button-submit {
  background: linear-gradient(135deg, #34C759 0%, #30D158 100%);
  box-shadow: 0 8rpx 24rpx rgba(52, 199, 89, 0.3);
}

.nav-button-text {
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
}

.nav-button-submit .nav-button-text {
  color: #FFFFFF;
}

.nav-button:active {
  transform: scale(0.95);
}
</style>
