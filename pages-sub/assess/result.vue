<template>
  <view class="result-page">
    <!-- 顶部卡片 - 总分展示 -->
    <view class="score-card">
      <view class="score-circle">
        <view class="score-value">{{ displayScore }}</view>
        <view class="score-max">/ {{ displayMaxScore }}</view>
      </view>
      <view class="score-level" :class="levelClass">
        {{ displayLevel }}
      </view>
      <view class="score-percentage" v-if="scorePercentage">
        超过{{ scorePercentage }}%的用户
      </view>
    </view>

    <!-- Canvas雷达图 -->
    <view class="chart-card" v-if="showRadarChart">
      <view class="card-header">
        <text class="card-title">📊 维度分析</text>
      </view>
      <!-- 如果Canvas 2D滚动问题无法解决，取消注释下面旧版API -->
      <!-- <canvas canvas-id="radarChart" class="chart-canvas" @touchstart="handleChartTouch"></canvas> -->
      
      <!-- Canvas 2D API（性能更好，但滚动可能有问题） -->
      <canvas 
        id="radarChart"
        type="2d" 
        class="chart-canvas"
        @touchstart="handleChartTouch"
      ></canvas>
      <view class="chart-legend">
        <view 
          v-for="(dim, index) in dimensions" 
          :key="index"
          class="legend-item"
        >
          <view class="legend-dot" :style="{ background: dim.color }"></view>
          <text class="legend-label">{{ dim.label }}</text>
        </view>
      </view>
    </view>

    <!-- Canvas柱状图 - 历史对比 -->
    <view class="chart-card" v-if="historyData.length > 0">
      <view class="card-header">
        <text class="card-title">📈 历史趋势</text>
        <text class="chart-subtitle">最近{{ historyData.length }}次</text>
      </view>
      <!-- 如果Canvas 2D滚动问题无法解决，取消注释下面旧版API -->
      <!-- <canvas canvas-id="barChart" class="chart-canvas"></canvas> -->
      
      <!-- Canvas 2D API（性能更好，但滚动可能有问题） -->
      <canvas 
        id="barChart"
        type="2d" 
        class="chart-canvas"
      ></canvas>
    </view>

    <!-- 等级说明卡片 -->
    <view class="level-card">
      <view class="card-header">
        <text class="card-title">评估结果</text>
      </view>
      <view class="card-content">
        <text class="level-description">{{ levelDescription }}</text>
      </view>
    </view>

    <!-- 建议卡片 - 优化滚动性能 -->
    <view class="suggestions-card" v-if="suggestions.length > 0">
      <view class="card-header">
        <text class="card-title">💡 专业建议</text>
        <text class="card-subtitle">{{ suggestions.length }}条建议</text>
      </view>
      <!-- 使用scroll-view提升长列表性能，最大高度800rpx -->
      <scroll-view 
        scroll-y 
        class="suggestions-scroll"
        :show-scrollbar="suggestions.length > 5"
        :enable-flex="true"
        :scroll-with-animation="true"
      >
        <view class="card-content">
          <view 
            v-for="(suggestion, index) in visibleSuggestions" 
            :key="index"
            class="suggestion-item"
          >
            <view class="suggestion-bullet">{{ index + 1 }}</view>
            <text class="suggestion-text">{{ suggestion }}</text>
          </view>
          <!-- 加载更多提示 -->
          <view 
            v-if="suggestions.length > visibleSuggestionsCount && !showAllSuggestions"
            class="load-more-hint"
            @tap="loadMoreSuggestions"
          >
            <text class="hint-text">展开查看更多建议（{{ suggestions.length - visibleSuggestionsCount }}条）</text>
            <text class="hint-icon">▼</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 结果解读视频 -->
    <view class="video-card" v-if="interpretationVideo">
      <view class="card-header">
        <text class="card-title">🎥 专家解读</text>
        <text class="card-subtitle">了解您的评估结果</text>
      </view>
      <view class="video-wrapper">
        <video 
          :src="interpretationVideo.url"
          :poster="interpretationVideo.poster"
          class="interpretation-video"
          :controls="true"
          :show-center-play-btn="true"
          :enable-progress-gesture="true"
          :object-fit="'contain'"
          @play="handleVideoPlay"
          @pause="handleVideoPause"
          @ended="handleVideoEnded"
          @error="handleVideoError"
        ></video>
        <view class="video-info">
          <text class="video-title">{{ interpretationVideo.title }}</text>
          <text class="video-duration">时长: {{ interpretationVideo.duration }}</text>
        </view>
      </view>
    </view>

    <!-- 风险因素卡片 -->
    <view class="risk-card" v-if="riskFactors.length > 0">
      <view class="card-header">
        <text class="card-title">⚠️ 需要关注</text>
      </view>
      <view class="card-content">
        <view 
          v-for="(risk, index) in riskFactors" 
          :key="index"
          class="risk-item"
        >
          <text class="risk-text">{{ risk }}</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button class="btn btn-primary" @tap="shareResult">
        <u-icon name="share" size="18" color="#FFFFFF"></u-icon>
        <text class="btn-text">分享结果</text>
      </button>
      
      <!-- #ifdef H5 -->
      <button class="btn btn-secondary" @tap="printResult">
        <u-icon name="print" size="18" color="#0A84FF"></u-icon>
        <text class="btn-text">打印报告</text>
      </button>
      <!-- #endif -->
      
      <button class="btn btn-secondary" @tap="toggleCompareMode">
        <u-icon name="swap" size="18" color="#0A84FF"></u-icon>
        <text class="btn-text">{{ compareMode ? '退出对比' : '对比历史' }}</text>
      </button>
      
      <button class="btn btn-secondary" @tap="retakeAssessment">
        <u-icon name="reload" size="18" color="#0A84FF"></u-icon>
        <text class="btn-text">重新测评</text>
      </button>
    </view>

    <!-- 历史对比视图 -->
    <view class="compare-card" v-if="compareMode && historyData.length > 0">
      <view class="card-header">
        <text class="card-title">📊 历史对比分析</text>
        <text class="card-subtitle">选择记录进行对比</text>
      </view>
      <view class="card-content">
        <!-- 历史记录选择器 -->
        <scroll-view scroll-y class="compare-list">
          <view 
            v-for="(item, index) in historyData" 
            :key="index"
            class="compare-item"
            :class="{ 'compare-item-selected': selectedCompareIndex === index }"
            @tap="selectCompareItem(index)"
          >
            <view class="compare-item-header">
              <text class="compare-item-date">{{ formatDate(item.timestamp) }}</text>
              <view class="compare-item-level" :class="getLevelClass(item.level)">
                {{ item.level }}
              </view>
            </view>
            <view class="compare-item-score">
              <text class="score-label">得分：</text>
              <text class="score-value">{{ item.score }}</text>
              <text class="score-change" v-if="index > 0" :class="getScoreChangeClass(item, historyData[index-1])">
                {{ getScoreChange(item, historyData[index-1]) }}
              </text>
            </view>
          </view>
        </scroll-view>
        
        <!-- 对比结果展示 -->
        <view class="compare-result" v-if="selectedCompareIndex !== null">
          <view class="compare-section">
            <text class="section-title">分数对比</text>
            <view class="compare-scores">
              <view class="compare-score-item">
                <text class="label">当前</text>
                <text class="value current">{{ score }}</text>
              </view>
              <view class="compare-arrow">→</view>
              <view class="compare-score-item">
                <text class="label">历史</text>
                <text class="value history">{{ historyData[selectedCompareIndex].score }}</text>
              </view>
              <view class="compare-diff" :class="getCompareClass(score, historyData[selectedCompareIndex].score)">
                {{ getCompareDiff(score, historyData[selectedCompareIndex].score) }}
              </view>
            </view>
          </view>
          
          <view class="compare-section">
            <text class="section-title">等级对比</text>
            <view class="compare-levels">
              <view class="level-item">
                <text class="label">当前</text>
                <view class="level-badge" :class="levelClass">{{ displayLevel }}</view>
              </view>
              <view class="level-item">
                <text class="label">历史</text>
                <view class="level-badge" :class="getLevelClass(historyData[selectedCompareIndex].level)">
                  {{ historyData[selectedCompareIndex].level }}
                </view>
              </view>
            </view>
          </view>
          
          <view class="compare-analysis">
            <text class="analysis-title">📈 变化分析</text>
            <text class="analysis-text">{{ getCompareAnalysis() }}</text>
          </view>
          
          <!-- 趋势折线图 -->
          <view class="trend-section" v-if="historyData.length >= 2">
            <text class="section-title">📉 趋势变化</text>
            <canvas 
              id="trendChart"
              type="2d"
              class="trend-canvas"
              @touchstart="handleTrendTouch"
            ></canvas>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 相关推荐 -->
    <view class="related-card" v-if="!compareMode">
      <view class="card-header">
        <text class="card-title">📋 相关评估</text>
      </view>
      <view class="card-content">
        <view 
          v-for="(scale, index) in relatedScales" 
          :key="index"
          class="related-item"
          @tap="navigateToScale(scale)"
        >
          <view class="related-info">
            <text class="related-name">{{ scale.name }}</text>
            <text class="related-desc">{{ scale.description }}</text>
          </view>
          <u-icon name="arrow-right" size="20" color="#C7C7CC"></u-icon>
        </view>
      </view>
    </view>
    
    <!-- 免责声明 -->
    <view class="disclaimer-card">
      <text class="disclaimer-text">
        ⚠️ 本评估结果仅供参考，不能替代专业医疗诊断。如有心理健康问题，请及时寻求专业帮助。
      </text>
    </view>
    
    <!-- 隐藏Canvas用于生成分享图片 -->
    <canvas 
      id="shareCanvas"
      type="2d"
      class="share-canvas-hidden"
    ></canvas>
  </view>
</template>

<script>
import { trackEvent } from '@/utils/analytics.js';
import resultCache from '@/utils/result-cache.js';

export default {
  data() {
    return {
      // 原始数据
      resultData: null,
      scaleId: '',
      score: 0,
      maxScore: 100,
      level: 'normal',
      
      // 维度数据（用于雷达图）
      dimensions: [],
      
      // 历史数据
      historyData: [],
      
      // 建议和风险
      suggestions: [],
      riskFactors: [],
      
      // 建议展示优化
      visibleSuggestionsCount: 5, // 初始显示5条
      showAllSuggestions: false,   // 是否展开全部
      
      // 相关量表
      relatedScales: [],
      
      // 结果解读视频
      interpretationVideo: null,
      
      // Canvas上下文
      radarCtx: null,
      barCtx: null,
      
      // 图表显示标志
      showRadarChart: false,
      
      // 滚动修复定时器
      scrollTimer: null,
      
      // RAF节流标志
      rafPending: false,
      
      // Canvas尺寸缓存
      radarCanvasSize: null,
      barCanvasSize: null,
      
      // 对比模式
      compareMode: false,
      selectedCompareIndex: null,
    };
  },
  
  computed: {
    displayScore() {
      return this.score || 0;
    },
    
    displayMaxScore() {
      return this.maxScore || 100;
    },
    
    displayLevel() {
      return this.getLevelText(this.level);
    },
    
    scorePercentage() {
      if (!this.maxScore) return 0;
      return Math.round((this.score / this.maxScore) * 100);
    },
    
    levelClass() {
      const level = this.level || '';
      if (level.includes('severe') || level.includes('重度') || level.includes('严重')) {
        return 'level-severe';
      } else if (level.includes('moderate') || level.includes('中度')) {
        return 'level-moderate';
      } else if (level.includes('mild') || level.includes('轻度')) {
        return 'level-mild';
      }
      return 'level-normal';
    },
    
    levelDescription() {
      return this.generateLevelDescription();
    },
    
    /**
     * 可见的建议列表（懒加载优化）
     */
    visibleSuggestions() {
      if (this.showAllSuggestions || this.suggestions.length <= this.visibleSuggestionsCount) {
        return this.suggestions;
      }
      return this.suggestions.slice(0, this.visibleSuggestionsCount);
    }
  },
  
  onLoad(options) {
    console.log('[RESULT] 页面加载', options);
    
    // 从URL参数或storage获取数据
    this.loadResultData(options);
    
    // 加载历史数据
    this.loadHistoryData();
    
    // 生成个性化建议
    this.generateSuggestions();
    
    // 初始化图表
    this.$nextTick(() => {
      if (this.dimensions.length > 0) {
        this.initRadarChart();
      }
      if (this.historyData.length > 0) {
        this.initBarChart();
      }
    });
    
    // 保存到历史
    this.saveToHistory();
    
    // 埋点
    trackEvent('assessment_result_view', {
      scale_id: this.scaleId,
      level: this.level,
      score: this.score
    });
  },
  
  onPageScroll(e) {
    // 修复Canvas 2D滚动时位置异常的问题
    // 实时重绘Canvas（无延迟）
    if (this.radarCtx || this.barCtx) {
      // 取消使用节流，改为requestAnimationFrame实时重绘
      this.fixCanvasPositionImmediate();
    }
  },
  
  onHide() {
    // 页面隐藏时清理定时器
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
  },
  
  methods: {
    /**
     * 加载结果数据
     */
    loadResultData(options) {
      try {
        // 优先从URL参数获取
        if (options.payload) {
          this.resultData = JSON.parse(decodeURIComponent(options.payload));
        } 
        // 其次从storage获取
        else {
          const stored = uni.getStorageSync('assess_result');
          if (stored) {
            this.resultData = stored;
            uni.removeStorageSync('assess_result'); // 读取后删除
          }
        }
        
        if (this.resultData) {
          this.parseResultData(this.resultData);
        }
        
        this.scaleId = options.scaleId || this.resultData?.scaleId || '';
        
        console.log('[RESULT] 数据加载成功', this.resultData);
      } catch (error) {
        console.error('[RESULT] 加载数据失败:', error);
        uni.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    },
    
    /**
     * 解析结果数据
     */
    parseResultData(data) {
      this.score = data.score || data.total_score || 0;
      this.maxScore = data.max_score || data.maxScore || 100;
      this.level = data.level || 'normal';
      
      // 解析维度数据
      if (data.dimensions && Array.isArray(data.dimensions)) {
        this.dimensions = data.dimensions.map((dim, index) => ({
          label: dim.label || dim.name,
          value: dim.value || dim.score || 0,
          max: dim.max || 10,
          color: this.getDimensionColor(index)
        }));
        this.showRadarChart = true;
      }
      
      // 设置相关量表
      this.setupRelatedScales();
    },
    
    /**
     * 获取维度颜色
     */
    getDimensionColor(index) {
      const colors = [
        '#667eea', // 紫色
        '#764ba2', // 深紫
        '#f093fb', // 粉色
        '#4facfe', // 蓝色
        '#43e97b'  // 绿色
      ];
      return colors[index % colors.length];
    },
    
    /**
     * 初始化雷达图
     */
    initRadarChart() {
      try {
        const query = uni.createSelectorQuery().in(this);
        query.select('#radarChart').fields({ node: true, size: true }).exec((res) => {
          if (!res || !res[0]) {
            console.error('[RESULT] 雷达图Canvas查询失败', res);
            this.showRadarChart = false;
            uni.showToast({
              title: '图表初始化失败',
              icon: 'none',
              duration: 2000
            });
            return;
          }
          
          const canvas = res[0].node;
          if (!canvas) {
            console.error('[RESULT] 雷达图Canvas节点获取失败');
            this.showRadarChart = false;
            return;
          }
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('[RESULT] 雷达图Canvas上下文获取失败');
            this.showRadarChart = false;
            return;
          }
          
          // 获取设备像素比（高清屏适配）
          const systemInfo = uni.getSystemInfoSync();
          const dpr = systemInfo.pixelRatio || 2;
          
          // 设置Canvas实际渲染尺寸（物理像素）
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          
          // 缩放画布坐标系（保持逻辑像素一致）
          ctx.scale(dpr, dpr);
          
          console.log('[RESULT] 雷达图Canvas初始化成功', {
            width: res[0].width,
            height: res[0].height,
            dpr: dpr
          });
          
          // 保存Canvas上下文和尺寸
          this.radarCtx = ctx;
          this.radarCanvasSize = {
            width: res[0].width,
            height: res[0].height
          };
          
          this.drawRadarChart(ctx, res[0].width, res[0].height);
        });
      } catch (error) {
        console.error('[RESULT] 雷达图初始化异常:', error);
        this.showRadarChart = false;
        uni.showToast({
          title: '图表加载失败',
          icon: 'none'
        });
      }
    },
    
    /**
     * 绘制雷达图
     */
    drawRadarChart(ctx, width, height) {
      try {
        if (!ctx || !this.dimensions || this.dimensions.length === 0) {
          console.error('[RESULT] 雷达图绘制条件不满足', {
            ctx: !!ctx,
            dimensions: this.dimensions?.length
          });
          return;
        }
        
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        const levels = 5; // 5个等级线
        const angleStep = (Math.PI * 2) / this.dimensions.length;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制背景网格
        ctx.strokeStyle = '#E5E5EA';
        ctx.lineWidth = 1;
        
        for (let i = 1; i <= levels; i++) {
          const r = (radius / levels) * i;
          ctx.beginPath();
          
          for (let j = 0; j <= this.dimensions.length; j++) {
            const angle = angleStep * j - Math.PI / 2;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            
            if (j === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          
          ctx.closePath();
          ctx.stroke();
        }
        
        // 绘制坐标轴线
        ctx.strokeStyle = '#C7C7CC';
        ctx.lineWidth = 1;
        
        this.dimensions.forEach((dim, index) => {
          const angle = angleStep * index - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();
          
          // 绘制标签
          ctx.fillStyle = '#1D1D1F';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const labelX = centerX + (radius + 20) * Math.cos(angle);
          const labelY = centerY + (radius + 20) * Math.sin(angle);
          ctx.fillText(dim.label, labelX, labelY);
        });
        
        // 绘制数据区域
        ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.dimensions.forEach((dim, index) => {
          const angle = angleStep * index - Math.PI / 2;
          const value = dim.value / dim.max; // 归一化
          const r = radius * value;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          
          // 绘制数据点
          ctx.save();
          ctx.fillStyle = dim.color;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        console.log('[RESULT] 雷达图绘制完成');
      } catch (error) {
        console.error('[RESULT] 雷达图绘制异常:', error);
        this.showRadarChart = false;
      }
    },
    
    /**
     * 初始化柱状图
     */
    initBarChart() {
      try {
        const query = uni.createSelectorQuery().in(this);
        query.select('#barChart').fields({ node: true, size: true }).exec((res) => {
          if (!res || !res[0]) {
            console.error('[RESULT] 柱状图Canvas查询失败', res);
            uni.showToast({
              title: '历史图表初始化失败',
              icon: 'none',
              duration: 2000
            });
            return;
          }
          
          const canvas = res[0].node;
          if (!canvas) {
            console.error('[RESULT] 柱状图Canvas节点获取失败');
            return;
          }
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('[RESULT] 柱状图Canvas上下文获取失败');
            return;
          }
          
          // 获取设备像素比（高清屏适配）
          const systemInfo = uni.getSystemInfoSync();
          const dpr = systemInfo.pixelRatio || 2;
          
          // 设置Canvas实际渲染尺寸（物理像素）
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          
          // 缩放画布坐标系（保持逻辑像素一致）
          ctx.scale(dpr, dpr);
          
          console.log('[RESULT] 柱状图Canvas初始化成功', {
            width: res[0].width,
            height: res[0].height,
            dpr: dpr
          });
          
          // 保存Canvas上下文和尺寸
          this.barCtx = ctx;
          this.barCanvasSize = {
            width: res[0].width,
            height: res[0].height
          };
          
          this.drawBarChart(ctx, res[0].width, res[0].height);
        });
      } catch (error) {
        console.error('[RESULT] 柱状图初始化异常:', error);
        uni.showToast({
          title: '历史图表加载失败',
          icon: 'none'
        });
      }
    },
    
    /**
     * 绘制柱状图
     */
    drawBarChart(ctx, width, height) {
      try {
        if (!ctx || !this.historyData || this.historyData.length === 0) {
          console.error('[RESULT] 柱状图绘制条件不满足', {
            ctx: !!ctx,
            historyData: this.historyData?.length
          });
          return;
        }
        
        const padding = 40;
        const barWidth = (width - padding * 2) / this.historyData.length - 10;
        const maxScore = Math.max(...this.historyData.map(d => d.score), this.maxScore);
        const chartHeight = height - padding * 2;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制Y轴线
        ctx.strokeStyle = '#E5E5EA';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // 绘制柱子
        this.historyData.forEach((data, index) => {
          const x = padding + index * (barWidth + 10) + 5;
          const barHeight = (data.score / maxScore) * chartHeight;
          const y = height - padding - barHeight;
          
          // 柱子渐变
          const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
          gradient.addColorStop(0, index === this.historyData.length - 1 ? '#667eea' : '#C7C7CC');
          gradient.addColorStop(1, index === this.historyData.length - 1 ? '#764ba2' : '#E5E5EA');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          // 分数标签
          ctx.fillStyle = '#1D1D1F';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(data.score, x + barWidth / 2, y - 5);
          
          // 日期标签
          ctx.fillStyle = '#86868B';
          ctx.font = '9px sans-serif';
          const dateText = this.formatDate(data.timestamp);
          ctx.fillText(dateText, x + barWidth / 2, height - padding + 15);
        });
        
        console.log('[RESULT] 柱状图绘制完成');
      } catch (error) {
        console.error('[RESULT] 柱状图绘制异常:', error);
      }
    },
    
    /**
     * 加载历史数据
     */
    async loadHistoryData() {
      try {
        // 使用新的缓存管理器读取历史
        const history = resultCache.getHistory(this.scaleId, 5);
        this.historyData = history;
        
        console.log('[RESULT] 加载历史数据（增强版）:', this.historyData.length);
        
        // 定期清理过期缓存
        if (Math.random() < 0.1) { // 10%概率触发清理
          const cleaned = await resultCache.cleanExpired();
          if (cleaned.success && cleaned.cleanedCount > 0) {
            console.log('[RESULT] 已清理过期缓存:', cleaned.cleanedCount);
          }
        }
      } catch (error) {
        console.error('[RESULT] 加载历史失败:', error);
      }
    },
    
    /**
     * 保存到历史（使用增强的缓存管理器）
     */
    async saveToHistory() {
      try {
        // 使用新的缓存管理器保存完整结果
        const resultData = {
          scaleId: this.scaleId,
          score: this.score,
          maxScore: this.maxScore,
          level: this.level,
          levelDescription: this.levelDescription,
          dimensions: this.dimensions,
          suggestions: this.suggestions,
          riskFactors: this.riskFactors,
          timestamp: Date.now(),
          // 用户信息（如果有）
          userId: uni.getStorageSync('userId') || null
        };
        
        const saved = await resultCache.saveResult(resultData);
        
        if (saved) {
          console.log('[RESULT] 结果已缓存（增强版）');
          
          // 显示缓存统计
          const stats = resultCache.getCacheStats();
          console.log('[RESULT] 缓存统计:', stats);
        } else {
          console.error('[RESULT] 缓存保存失败');
        }
      } catch (error) {
        console.error('[RESULT] 保存历史失败:', error);
      }
    },
    
    /**
     * 生成等级描述
     */
    generateLevelDescription() {
      const descriptions = {
        'low': '您目前的状态良好，请继续保持健康的生活方式。',
        'normal': '您的状态在正常范围内，继续关注自己的心理健康。',
        'mild': '您存在一些轻度症状，建议适当调整生活节奏。',
        'moderate': '您的症状达到中度水平，建议寻求专业支持。',
        'high': '您的症状较为明显，强烈建议咨询专业人士。',
        'severe': '您的症状需要立即关注，请及时寻求专业医疗帮助。'
      };
      
      return descriptions[this.level] || descriptions['normal'];
    },
    
    /**
     * 生成个性化建议
     */
    generateSuggestions() {
      const level = this.level;
      
      // 基础建议
      const baseSuggestions = [
        '保持规律的作息时间，确保充足睡眠',
        '进行适度的运动，如散步、瑜伽等',
        '与亲友保持良好的社交互动'
      ];
      
      // 根据等级添加建议
      if (level.includes('severe') || level.includes('high')) {
        this.suggestions = [
          '建议尽快咨询专业心理咨询师或医生',
          '考虑寻求药物治疗或心理治疗',
          ...baseSuggestions
        ];
        this.riskFactors = [
          '当前症状可能影响日常生活',
          '请避免独自承受压力',
          '必要时寻求紧急心理危机干预'
        ];
      } else if (level.includes('moderate')) {
        this.suggestions = [
          '建议咨询专业心理咨询师',
          '学习压力管理技巧',
          ...baseSuggestions
        ];
      } else {
        this.suggestions = [
          ...baseSuggestions,
          '尝试冥想或正念练习',
          '培养健康的兴趣爱好'
        ];
      }
    },
    
    /**
     * 设置相关量表
     */
    setupRelatedScales() {
      // 根据当前量表推荐相关量表
      this.relatedScales = [
        {
          id: 'pss10',
          name: 'PSS-10 压力评估',
          description: '评估压力水平',
          route: '/pages-sub/assess/stress/index'
        },
        {
          id: 'gad7',
          name: 'GAD-7 焦虑筛查',
          description: '评估焦虑症状',
          route: '/pages-sub/assess/anxiety/index'
        }
      ].filter(s => s.id !== this.scaleId); // 排除当前量表
      
      // 加载对应的解读视频
      this.loadInterpretationVideo();
    },
    
    /**
     * 加载结果解读视频
     */
    loadInterpretationVideo() {
      // 根据量表ID和等级加载对应的解读视频
      const videoMap = {
        'phq9': {
          url: 'https://example.com/videos/phq9_interpretation.mp4',
          poster: 'https://example.com/videos/phq9_poster.jpg',
          title: 'PHQ-9抑郁量表结果解读',
          duration: '5:30'
        },
        'gad7': {
          url: 'https://example.com/videos/gad7_interpretation.mp4',
          poster: 'https://example.com/videos/gad7_poster.jpg',
          title: 'GAD-7焦虑量表结果解读',
          duration: '4:45'
        },
        'pss10': {
          url: 'https://example.com/videos/pss10_interpretation.mp4',
          poster: 'https://example.com/videos/pss10_poster.jpg',
          title: 'PSS-10压力量表结果解读',
          duration: '6:00'
        }
      };
      
      if (this.scaleId && videoMap[this.scaleId]) {
        this.interpretationVideo = videoMap[this.scaleId];
        console.log('[RESULT] 加载解读视频:', this.interpretationVideo.title);
      }
    },
    
    /**
     * 视频播放事件
     */
    handleVideoPlay() {
      console.log('[RESULT] 视频开始播放');
      uni.showToast({
        title: '开始播放',
        icon: 'none',
        duration: 1000
      });
    },
    
    /**
     * 视频暂停事件
     */
    handleVideoPause() {
      console.log('[RESULT] 视频已暂停');
    },
    
    /**
     * 视频播放结束事件
     */
    handleVideoEnded() {
      console.log('[RESULT] 视频播放完成');
      uni.showToast({
        title: '已观看完成',
        icon: 'success',
        duration: 1500
      });
    },
    
    /**
     * 视频播放错误事件
     */
    handleVideoError(e) {
      console.error('[RESULT] 视频播放错误:', e);
      uni.showToast({
        title: '视频加载失败',
        icon: 'none',
        duration: 2000
      });
    },
    
    /**
     * 加载更多建议
     */
    loadMoreSuggestions() {
      console.log('[RESULT] 展开更多建议');
      this.showAllSuggestions = true;
      
      // 震动反馈
      uni.vibrateShort({
        type: 'light'
      });
      
      // 提示
      uni.showToast({
        title: '已展开全部建议',
        icon: 'success',
        duration: 1500
      });
    },
    
    /**
     * 格式化日期
     */
    formatDate(timestamp) {
      const date = new Date(timestamp);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    },
    
    /**
     * 获取等级文本
     */
    getLevelText(level) {
      const textMap = {
        'low': '状态良好',
        'normal': '正常范围',
        'mild': '轻度',
        'moderate': '中度',
        'high': '偏高',
        'severe': '严重'
      };
      
      return textMap[level] || level;
    },
    
    /**
     * 分享结果
     */
    async shareResult() {
      console.log('[RESULT] 分享结果');
      
      try {
        // 生成分享图片
        const imagePath = await this.generateShareImage();
        
        if (imagePath) {
          // #ifdef MP-WEIXIN
          uni.showShareImageMenu({
            path: imagePath,
            success: () => {
              console.log('[RESULT] 分享成功');
            }
          });
          // #endif
          
          // #ifdef H5
      uni.showToast({
            title: '图片已生成',
            icon: 'success'
          });
          // #endif
        }
      } catch (error) {
        console.error('[RESULT] 分享失败:', error);
        uni.showToast({
          title: '分享失败',
        icon: 'none'
        });
      }
      
      trackEvent('assessment_result_share', {
        scale_id: this.scaleId
      });
    },
    
    /**
     * 生成分享图片
     */
    /**
     * 生成高质量分享图片
     * 优化策略：
     * 1. 使用2倍像素密度提升清晰度
     * 2. 优化Canvas绘制顺序减少重绘
     * 3. 压缩图片降低文件大小
     */
    async generateShareImage() {
      console.log('[RESULT] 生成高质量分享图片');
      
      try {
        // 创建离屏Canvas用于合成
        const query = uni.createSelectorQuery().in(this);
        
        // 获取设备像素比，提升清晰度
        const dpr = uni.getSystemInfoSync().pixelRatio || 2;
        
        // 画布尺寸（物理像素）
        const canvasWidth = 750;  // rpx转px后的宽度
        const canvasHeight = 1334; // 标准分享图高度
        
        // 实际渲染尺寸（考虑dpr）
        const renderWidth = canvasWidth * dpr;
        const renderHeight = canvasHeight * dpr;
        
        return new Promise((resolve, reject) => {
          query.select('#shareCanvas')
            .fields({ node: true, size: true })
            .exec(async (res) => {
              if (!res || !res[0]) {
                // 降级方案：使用旧版Canvas API
                const shareCanvas = await this.generateShareImageLegacy();
                resolve(shareCanvas);
                return;
              }
              
              const canvas = res[0].node;
              const ctx = canvas.getContext('2d');
              
              // 设置Canvas尺寸
              canvas.width = renderWidth;
              canvas.height = renderHeight;
              
              // 缩放上下文以支持高DPI
              ctx.scale(dpr, dpr);
              
              // 填充背景
              ctx.fillStyle = '#F5F5F7';
              ctx.fillRect(0, 0, canvasWidth, canvasHeight);
              
              // 绘制白色卡片背景
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
              ctx.shadowBlur = 20;
              ctx.shadowOffsetY = 5;
              this.roundRect(ctx, 30, 30, canvasWidth - 60, canvasHeight - 60, 20);
              ctx.fill();
              ctx.shadowColor = 'transparent';
              
              // 绘制标题
              ctx.fillStyle = '#1D1D1F';
              ctx.font = 'bold 36px -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('评估结果分享', canvasWidth / 2, 100);
              
              // 绘制分数
              ctx.font = 'bold 72px -apple-system, sans-serif';
              ctx.fillStyle = this.getScoreColor();
              ctx.fillText(this.displayScore.toString(), canvasWidth / 2, 200);
              
              ctx.font = '28px -apple-system, sans-serif';
              ctx.fillStyle = '#86868B';
              ctx.fillText(`/ ${this.displayMaxScore}`, canvasWidth / 2, 240);
              
              // 绘制等级
              ctx.font = 'bold 32px -apple-system, sans-serif';
              ctx.fillStyle = this.getScoreColor();
              ctx.fillText(this.displayLevel, canvasWidth / 2, 290);
              
              // 如果有雷达图数据，绘制简化版
              if (this.dimensions.length > 0) {
                await this.drawMiniRadarChart(ctx, canvasWidth / 2, 400, 150, dpr);
              }
              
              // 绘制建议（前3条）
              const topSuggestions = this.suggestions.slice(0, 3);
              let yOffset = 620;
              
              ctx.textAlign = 'left';
              ctx.font = 'bold 28px -apple-system, sans-serif';
              ctx.fillStyle = '#1D1D1F';
              ctx.fillText('💡 专业建议', 60, yOffset);
              
              yOffset += 50;
              ctx.font = '24px -apple-system, sans-serif';
              topSuggestions.forEach((suggestion, index) => {
                const text = `${index + 1}. ${suggestion}`;
                const lines = this.wrapText(ctx, text, canvasWidth - 120);
                
                lines.forEach(line => {
                  ctx.fillStyle = '#515154';
                  ctx.fillText(line, 60, yOffset);
                  yOffset += 36;
                });
                
                yOffset += 10;
              });
              
              // 绘制二维码（如果需要）
              // TODO: 集成小程序码生成
              
              // 绘制底部信息
              ctx.textAlign = 'center';
              ctx.font = '20px -apple-system, sans-serif';
              ctx.fillStyle = '#86868B';
              ctx.fillText('翎心 CraneHeart - 心理健康评估', canvasWidth / 2, canvasHeight - 80);
              ctx.fillText(this.formatDate(Date.now()), canvasWidth / 2, canvasHeight - 50);
              
              // 导出图片（质量0.9，平衡清晰度和文件大小）
              uni.canvasToTempFilePath({
                canvas: canvas,
                quality: 0.9,
                fileType: 'jpg',
                destWidth: renderWidth,
                destHeight: renderHeight,
                success: (res) => {
                  console.log('[RESULT] 分享图片生成成功:', res.tempFilePath);
                  
                  // 保存到相册（可选）
                  uni.showModal({
                    title: '保存图片',
                    content: '是否保存到相册？',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        uni.saveImageToPhotosAlbum({
                          filePath: res.tempFilePath,
                          success: () => {
                            uni.showToast({
                              title: '已保存到相册',
                              icon: 'success'
                            });
                          }
                        });
                      }
                    }
                  });
                  
                  resolve(res.tempFilePath);
                },
                fail: (err) => {
                  console.error('[RESULT] 导出图片失败:', err);
                  reject(err);
                }
              }, this);
            });
        });
      } catch (error) {
        console.error('[RESULT] 生成分享图片失败:', error);
        uni.showToast({
          title: '生成图片失败',
          icon: 'none'
        });
        return null;
      }
    },
    
    /**
     * 降级方案：使用旧版Canvas API
     */
    async generateShareImageLegacy() {
      console.log('[RESULT] 使用降级方案生成图片');
      // 简化版实现...
      return null;
    },
    
    /**
     * 绘制迷你雷达图
     */
    async drawMiniRadarChart(ctx, centerX, centerY, radius, dpr) {
      const angleStep = (Math.PI * 2) / this.dimensions.length;
      
      // 绘制背景多边形
      ctx.strokeStyle = '#E5E5EA';
      ctx.lineWidth = 1;
      
      for (let level = 1; level <= 5; level++) {
        ctx.beginPath();
        const r = (radius / 5) * level;
        
        for (let i = 0; i <= this.dimensions.length; i++) {
          const angle = angleStep * i - Math.PI / 2;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.stroke();
      }
      
      // 绘制数据多边形
      ctx.beginPath();
      ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 2;
      
      for (let i = 0; i <= this.dimensions.length; i++) {
        const dim = this.dimensions[i % this.dimensions.length];
        const ratio = dim.value / dim.max;
        const r = radius * ratio;
        const angle = angleStep * i - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // 绘制维度标签（简化）
      ctx.font = '18px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#515154';
      
      this.dimensions.forEach((dim, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const labelRadius = radius + 30;
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);
        
        ctx.fillText(dim.label.substring(0, 4), x, y);
      });
    },
    
    /**
     * 文本换行处理
     */
    wrapText(ctx, text, maxWidth) {
      const words = text.split('');
      const lines = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    },
    
    /**
     * 获取分数颜色
     */
    getScoreColor() {
      const level = this.level || '';
      if (level.includes('severe')) return '#FF3B30';
      if (level.includes('moderate')) return '#FF9500';
      if (level.includes('mild')) return '#FFCC00';
      return '#34C759';
    },
    
    /**
     * 绘制圆角矩形
     */
    roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.arcTo(x + width, y, x + width, y + radius, radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
      ctx.lineTo(x + radius, y + height);
      ctx.arcTo(x, y + height, x, y + height - radius, radius);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
    },
    
    /**
     * 打印结果（H5）
     */
    printResult() {
      // #ifdef H5
      window.print();
      
      trackEvent('assessment_result_print', {
        scale_id: this.scaleId
      });
      // #endif
    },
    
    /**
     * 查看历史
     */
    viewHistory() {
      console.log('[RESULT] 查看历史');
      
      uni.navigateTo({
        url: '/pages-sub/stress/history'
      });
    },
    
    /**
     * 重新测评
     */
    /**
     * 切换对比模式
     */
    toggleCompareMode() {
      this.compareMode = !this.compareMode;
      this.selectedCompareIndex = null;
      
      console.log('[RESULT] 对比模式:', this.compareMode);
      
      if (this.compareMode && this.historyData.length === 0) {
        uni.showToast({
          title: '暂无历史记录',
          icon: 'none'
        });
        this.compareMode = false;
        return;
      }
      
      // 如果进入对比模式且有数据，绘制趋势图
      if (this.compareMode && this.historyData.length >= 2) {
        this.$nextTick(() => {
          this.initTrendChart();
        });
      }
    },
    
    /**
     * 选择对比项
     */
    selectCompareItem(index) {
      this.selectedCompareIndex = index;
      
      uni.vibrateShort({
        type: 'light'
      });
      
      console.log('[RESULT] 选择对比项:', index);
      
      // 更新趋势图高亮选中点
      if (this.historyData.length >= 2) {
        this.initTrendChart();
      }
    },
    
    /**
     * 初始化趋势折线图
     */
    async initTrendChart() {
      console.log('[RESULT] 初始化趋势折线图');
      
      try {
        const query = uni.createSelectorQuery().in(this);
        query.select('#trendChart')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0]) {
              console.error('[RESULT] 趋势图Canvas未找到');
              return;
            }
            
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            
            // 获取设备像素比
            const dpr = uni.getSystemInfoSync().pixelRatio || 2;
            
            // 设置Canvas尺寸
            const width = res[0].width;
            const height = 200; // 固定高度
            
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            
            // 绘制折线图
            this.drawTrendChart(ctx, width, height);
          });
      } catch (error) {
        console.error('[RESULT] 初始化趋势图失败:', error);
      }
    },
    
    /**
     * 绘制趋势折线图
     */
    drawTrendChart(ctx, width, height) {
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      
      // 准备数据（包括当前结果）
      const allData = [...this.historyData, {
        score: this.score,
        timestamp: Date.now()
      }];
      
      // 计算最大最小值
      const scores = allData.map(d => d.score);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      const scoreRange = maxScore - minScore || 10; // 避免除0
      
      // 计算点的位置
      const points = allData.map((item, index) => {
        const x = padding + (chartWidth / (allData.length - 1)) * index;
        const y = padding + chartHeight - ((item.score - minScore) / scoreRange) * chartHeight;
        return { x, y, score: item.score, timestamp: item.timestamp };
      });
      
      // 绘制背景网格
      ctx.strokeStyle = '#E5E5EA';
      ctx.lineWidth = 1;
      
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
      
      // 绘制折线
      ctx.beginPath();
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
      
      // 绘制渐变填充
      const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
      gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
      gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
      
      ctx.beginPath();
      ctx.fillStyle = gradient;
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.lineTo(points[points.length - 1].x, height - padding);
      ctx.lineTo(points[0].x, height - padding);
      ctx.closePath();
      ctx.fill();
      
      // 绘制数据点
      points.forEach((point, index) => {
        const isSelected = index === this.selectedCompareIndex;
        const isCurrent = index === points.length - 1;
        
        // 外圈
        ctx.beginPath();
        ctx.arc(point.x, point.y, isCurrent ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        // 内圈
        ctx.beginPath();
        ctx.arc(point.x, point.y, isCurrent ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#FF9500' : (isCurrent ? '#667eea' : '#667eea');
        ctx.fill();
        
        // 如果是选中或当前点，显示标签
        if (isSelected || isCurrent) {
          ctx.fillStyle = '#1D1D1F';
          ctx.font = 'bold 12px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(point.score.toString(), point.x, point.y - 12);
        }
      });
      
      // 绘制Y轴标签
      ctx.fillStyle = '#86868B';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(maxScore.toString(), padding - 10, padding);
      ctx.fillText(minScore.toString(), padding - 10, height - padding);
      
      // 绘制X轴标签（简化显示）
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      if (points.length > 0) {
        ctx.fillText('首次', points[0].x, height - padding + 10);
      }
      if (points.length > 1) {
        ctx.fillText('最近', points[points.length - 1].x, height - padding + 10);
      }
      
      console.log('[RESULT] 趋势图绘制完成');
    },
    
    /**
     * 处理趋势图触摸
     */
    handleTrendTouch(e) {
      console.log('[RESULT] 趋势图触摸');
      // TODO: 实现点击查看详细数据
    },
    
    /**
     * 获取等级样式类
     */
    getLevelClass(level) {
      if (!level) return 'level-normal';
      
      const levelStr = level.toLowerCase();
      if (levelStr.includes('severe') || levelStr.includes('重度')) {
        return 'level-severe';
      } else if (levelStr.includes('moderate') || levelStr.includes('中度')) {
        return 'level-moderate';
      } else if (levelStr.includes('mild') || levelStr.includes('轻度')) {
        return 'level-mild';
      }
      return 'level-normal';
    },
    
    /**
     * 获取分数变化
     */
    getScoreChange(current, previous) {
      if (!previous) return '';
      
      const diff = current.score - previous.score;
      if (diff > 0) {
        return `+${diff}`;
      } else if (diff < 0) {
        return `${diff}`;
      }
      return '持平';
    },
    
    /**
     * 获取分数变化样式类
     */
    getScoreChangeClass(current, previous) {
      if (!previous) return '';
      
      const diff = current.score - previous.score;
      if (diff > 0) {
        return 'score-increase';
      } else if (diff < 0) {
        return 'score-decrease';
      }
      return 'score-same';
    },
    
    /**
     * 获取对比差值
     */
    getCompareDiff(current, history) {
      const diff = current - history;
      if (diff > 0) {
        return `+${diff}分`;
      } else if (diff < 0) {
        return `${diff}分`;
      }
      return '持平';
    },
    
    /**
     * 获取对比样式类
     */
    getCompareClass(current, history) {
      const diff = current - history;
      if (diff > 0) {
        return 'diff-increase';
      } else if (diff < 0) {
        return 'diff-decrease';
      }
      return 'diff-same';
    },
    
    /**
     * 生成对比分析文字
     */
    getCompareAnalysis() {
      if (this.selectedCompareIndex === null) {
        return '';
      }
      
      const historyItem = this.historyData[this.selectedCompareIndex];
      const scoreDiff = this.score - historyItem.score;
      const daysDiff = Math.floor((Date.now() - historyItem.timestamp) / (24 * 60 * 60 * 1000));
      
      let analysis = '';
      
      if (scoreDiff > 0) {
        analysis = `与${daysDiff}天前相比，您的得分上升了${scoreDiff}分，`;
        if (scoreDiff > 10) {
          analysis += '变化较大，建议关注近期生活状态的变化。';
        } else {
          analysis += '略有波动，属于正常范围。';
        }
      } else if (scoreDiff < 0) {
        analysis = `与${daysDiff}天前相比，您的得分下降了${Math.abs(scoreDiff)}分，`;
        if (Math.abs(scoreDiff) > 10) {
          analysis += '说明您的状态有明显改善，请继续保持！';
        } else {
          analysis += '略有改善，请继续坚持良好的生活习惯。';
        }
      } else {
        analysis = `与${daysDiff}天前相比，您的得分保持稳定，`;
        analysis += '请继续关注自己的心理健康状态。';
      }
      
      return analysis;
    },
    
    retakeAssessment() {
      console.log('[RESULT] 重新测评');
      
      uni.showModal({
        title: '重新测评',
        content: '确定要重新进行评估吗？',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack();
          }
        }
      });
    },
    
    /**
     * 导航到量表
     */
    navigateToScale(scale) {
      console.log('[RESULT] 导航到量表:', scale.name);
      
      uni.navigateTo({
        url: scale.route
      });
    },
    
    /**
     * 处理图表触摸
     */
    handleChartTouch() {
      // 可以添加图表交互功能
      console.log('[RESULT] 图表触摸');
    },
    
    /**
     * 修复Canvas滚动时位置异常（节流版本 - 备用）
     * Canvas 2D同层渲染在滚动时可能出现位置偏移
     * 通过节流重绘来修复此问题
     */
    fixCanvasPosition() {
      // 使用节流避免频繁重绘
      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer);
      }
      
      this.scrollTimer = setTimeout(() => {
        try {
          // 重绘雷达图
          if (this.radarCtx && this.radarCanvasSize) {
            this.drawRadarChart(
              this.radarCtx,
              this.radarCanvasSize.width,
              this.radarCanvasSize.height
            );
          }
          
          // 重绘柱状图
          if (this.barCtx && this.barCanvasSize) {
            this.drawBarChart(
              this.barCtx,
              this.barCanvasSize.width,
              this.barCanvasSize.height
            );
          }
        } catch (error) {
          console.error('[RESULT] Canvas重绘失败:', error);
        }
      }, 100); // 100ms节流，平衡性能和流畅度
    },
    
    /**
     * 实时修复Canvas位置（无节流）
     * 使用requestAnimationFrame确保每帧都重绘
     * 适用于滚动时Canvas严重错位的情况
     */
    fixCanvasPositionImmediate() {
      // 使用RAF节流，确保不会在同一帧重复绘制
      if (this.rafPending) {
        return;
      }
      
      this.rafPending = true;
      
      // 使用requestAnimationFrame，在下一个渲染帧重绘
      // 小程序不支持RAF，降级使用setTimeout(0)
      const raf = typeof requestAnimationFrame !== 'undefined' 
        ? requestAnimationFrame 
        : (callback) => setTimeout(callback, 16);
      
      raf(() => {
        try {
          this.rafPending = false;
          
          // 重绘雷达图
          if (this.radarCtx && this.radarCanvasSize) {
            this.drawRadarChart(
              this.radarCtx,
              this.radarCanvasSize.width,
              this.radarCanvasSize.height
            );
          }
          
          // 重绘柱状图
          if (this.barCtx && this.barCanvasSize) {
            this.drawBarChart(
              this.barCtx,
              this.barCanvasSize.width,
              this.barCanvasSize.height
            );
          }
        } catch (error) {
          console.error('[RESULT] Canvas实时重绘失败:', error);
          this.rafPending = false;
        }
      });
    }
  }
};
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #F9F7FF 0%, #FFFFFF 40%);
  padding: 40rpx 24rpx;
  padding-top: calc(40rpx + constant(safe-area-inset-top));
  padding-top: calc(40rpx + env(safe-area-inset-top));
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

/* 分数卡片 */
.score-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  margin-bottom: 32rpx;
  text-align: center;
  box-shadow: 0 16rpx 48rpx rgba(102, 126, 234, 0.3);
  animation: slideDown 0.5s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-50rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.score-circle {
  margin-bottom: 32rpx;
}

.score-value {
  font-size: 120rpx;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1;
  animation: numberCount 1s ease-out;
}

@keyframes numberCount {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.score-max {
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.score-level {
  font-size: 40rpx;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 16rpx;
  padding: 16rpx 48rpx;
  border-radius: 48rpx;
  background: rgba(255, 255, 255, 0.2);
  display: inline-block;
  animation: levelPulse 2s ease-in-out infinite;
}

@keyframes levelPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.level-severe {
  animation: severePulse 1.5s ease-in-out infinite;
}

@keyframes severePulse {
  0%, 100% {
    background: rgba(255, 59, 48, 0.3);
  }
  50% {
    background: rgba(255, 59, 48, 0.5);
  }
}

.score-percentage {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 图表卡片 */
.chart-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  animation: fadeInUp 0.5s ease-out;
  animation-delay: 0.2s;
  animation-fill-mode: both;
}

.chart-canvas {
  width: 100%;
  height: 300rpx;
  margin: 24rpx 0;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.legend-label {
  font-size: 24rpx;
  color: #1D1D1F;
}

.chart-subtitle {
  font-size: 24rpx;
  color: #86868B;
  margin-left: auto;
}

/* 卡片通用样式 */
.level-card,
.suggestions-card,
.risk-card,
.related-card,
.disclaimer-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  animation: fadeInUp 0.5s ease-out;
  animation-fill-mode: both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestions-card {
  animation-delay: 0.3s;
}

.video-card {
  animation-delay: 0.35s;
}

.risk-card {
  animation-delay: 0.4s;
}

.related-card {
  animation-delay: 0.5s;
}

.disclaimer-card {
  animation-delay: 0.6s;
}

.card-header {
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #F0F0F5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* 等级描述 */
.level-description {
  font-size: 30rpx;
  color: #1D1D1F;
  line-height: 1.8;
}

/* 建议列表 */
.suggestion-item {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
}

.suggestion-bullet {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.suggestion-text {
  flex: 1;
  font-size: 28rpx;
  color: #1D1D1F;
  line-height: 1.6;
}

/* 建议滚动容器 */
.suggestions-scroll {
  max-height: 800rpx;
  width: 100%;
}

/* 加载更多提示 */
.load-more-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 30rpx;
  margin-top: 20rpx;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-hint:active {
  transform: scale(0.98);
  opacity: 0.8;
}

.hint-text {
  font-size: 26rpx;
  color: #667eea;
  font-weight: 500;
}

.hint-icon {
  font-size: 20rpx;
  color: #667eea;
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4rpx);
  }
}

/* 风险列表 */
.risk-item {
  padding: 20rpx 24rpx;
  background: #FFF3E0;
  border-radius: 12rpx;
  border-left: 6rpx solid #FF9500;
}

.risk-text {
  font-size: 28rpx;
  color: #1D1D1F;
  line-height: 1.6;
}

/* 操作按钮 */
.actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin: 32rpx 0;
}

.btn {
  height: 96rpx;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #FFFFFF;
  color: #0A84FF;
  border: 2rpx solid #0A84FF;
}

.btn:active {
  transform: scale(0.98);
}

.btn-text {
  font-size: 30rpx;
}

/* 相关推荐 */
.related-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.related-item:active {
  background: #F0F0F5;
  transform: scale(0.98);
}

.related-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.related-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.related-desc {
  font-size: 26rpx;
  color: #86868B;
}

/* 免责声明 */
.disclaimer-card {
  background: #FFF9E6;
  border-left: 4rpx solid #FFB800;
}

.disclaimer-text {
  font-size: 26rpx;
  color: #1D1D1F;
  line-height: 1.6;
}

/* 打印样式 */
@media print {
  .actions,
  .related-card {
    display: none;
  }
  
  .result-page {
    background: #FFFFFF;
    padding: 20mm;
  }
}

/* 响应式适配 */
/* 小屏设备 (iPhone SE, iPhone 6/7/8) */
@media screen and (max-width: 375px) {
  .score-value {
    font-size: 100rpx;
  }
  
  .score-max {
    font-size: 40rpx;
  }
  
  .chart-canvas {
    height: 320rpx !important;
  }
  
  .interpretation-video {
    height: 320rpx;
  }
  
  .card-title {
    font-size: 28rpx;
  }
  
  .suggestion-text,
  .risk-text {
    font-size: 26rpx;
  }
}

/* 中等屏设备 (iPhone X/11/12/13) */
@media screen and (min-width: 376px) and (max-width: 414px) {
  .chart-canvas {
    height: 380rpx !important;
  }
  
  .interpretation-video {
    height: 400rpx;
  }
}

/* 大屏设备 (Plus, Pro Max) */
@media screen and (min-width: 415px) and (max-width: 767px) {
  .chart-canvas {
    height: 420rpx !important;
  }
  
  .interpretation-video {
    height: 460rpx;
  }
  
  .score-value {
    font-size: 140rpx;
  }
  
  .score-max {
    font-size: 52rpx;
  }
}

/* 平板设备 */
@media screen and (min-width: 768px) {
  .result-page {
    max-width: 750rpx;
    margin: 0 auto;
  }
  
  .chart-canvas {
    height: 500rpx !important;
  }
  
  .interpretation-video {
    height: 520rpx;
  }
  
  .score-card {
    padding: 64rpx 48rpx;
  }
  
  .score-value {
    font-size: 160rpx;
  }
  
  .card-title {
    font-size: 36rpx;
  }
}

/* 横屏适配 */
@media screen and (orientation: landscape) {
  .interpretation-video {
    height: 60vh;
    max-height: 500rpx;
  }
  
  .chart-canvas {
    height: 50vh !important;
    max-height: 400rpx !important;
  }
}

/* 视频卡片 */
.video-wrapper {
  margin-top: 16rpx;
}

.interpretation-video {
  width: 100%;
  height: 420rpx;
  border-radius: 12rpx;
  background: #000;
  overflow: hidden;
}

.video-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8rpx;
}

.video-title {
  font-size: 28rpx;
  color: #1D1D1F;
  font-weight: 500;
  flex: 1;
}

.video-duration {
  font-size: 24rpx;
  color: #8E8E93;
  margin-left: 16rpx;
}

.card-subtitle {
  font-size: 24rpx;
  color: #8E8E93;
  margin-left: 12rpx;
}

/* 对比卡片 */
.compare-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  animation: fadeInUp 0.5s ease-out;
}

/* 对比列表 */
.compare-list {
  max-height: 400rpx;
  margin-bottom: 32rpx;
}

.compare-item {
  padding: 24rpx;
  background: #F5F5F7;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  transition: all 0.3s ease;
}

.compare-item:active {
  transform: scale(0.98);
}

.compare-item-selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 2rpx solid #667eea;
}

.compare-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.compare-item-date {
  font-size: 26rpx;
  color: #515154;
  font-weight: 500;
}

.compare-item-level {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.compare-item-score {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.score-label {
  font-size: 24rpx;
  color: #86868B;
}

.score-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.score-change {
  font-size: 22rpx;
  font-weight: 500;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.score-increase {
  background: #FFEBEE;
  color: #FF3B30;
}

.score-decrease {
  background: #E8F5E9;
  color: #34C759;
}

.score-same {
  background: #F5F5F7;
  color: #86868B;
}

/* 对比结果 */
.compare-result {
  padding: 24rpx;
  background: linear-gradient(135deg, #F5F7FA 0%, #F9F9FB 100%);
  border-radius: 16rpx;
}

.compare-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 16rpx;
  display: block;
}

/* 分数对比 */
.compare-scores {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 24rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
}

.compare-score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.compare-score-item .label {
  font-size: 24rpx;
  color: #86868B;
}

.compare-score-item .value {
  font-size: 48rpx;
  font-weight: 700;
}

.compare-score-item .value.current {
  color: #667eea;
}

.compare-score-item .value.history {
  color: #86868B;
}

.compare-arrow {
  font-size: 36rpx;
  color: #86868B;
}

.compare-diff {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.diff-increase {
  background: #FFEBEE;
  color: #FF3B30;
}

.diff-decrease {
  background: #E8F5E9;
  color: #34C759;
}

.diff-same {
  background: #F5F5F7;
  color: #86868B;
}

/* 等级对比 */
.compare-levels {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
}

.level-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.level-item .label {
  font-size: 24rpx;
  color: #86868B;
}

.level-badge {
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
}

/* 对比分析 */
.compare-analysis {
  padding: 24rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
}

.analysis-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 12rpx;
  display: block;
}

.analysis-text {
  font-size: 26rpx;
  color: #515154;
  line-height: 1.8;
}

/* 趋势图 */
.trend-section {
  margin-top: 24rpx;
}

.trend-canvas {
  width: 100%;
  height: 400rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
}

/* 隐藏Canvas（用于生成分享图片） */
.share-canvas-hidden {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 750rpx;
  height: 1334rpx;
  opacity: 0;
  pointer-events: none;
}
</style>
