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

    <!-- 建议卡片 -->
    <view class="suggestions-card" v-if="suggestions.length > 0">
      <view class="card-header">
        <text class="card-title">💡 专业建议</text>
      </view>
      <view class="card-content">
        <view 
          v-for="(suggestion, index) in suggestions" 
          :key="index"
          class="suggestion-item"
        >
          <view class="suggestion-bullet">{{ index + 1 }}</view>
          <text class="suggestion-text">{{ suggestion }}</text>
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
      
      <button class="btn btn-secondary" @tap="viewHistory">
        <u-icon name="clock" size="18" color="#0A84FF"></u-icon>
        <text class="btn-text">查看历史</text>
      </button>
      
      <button class="btn btn-secondary" @tap="retakeAssessment">
        <u-icon name="reload" size="18" color="#0A84FF"></u-icon>
        <text class="btn-text">重新测评</text>
      </button>
    </view>

    <!-- 相关推荐 -->
    <view class="related-card">
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
  </view>
</template>

<script>
import { trackEvent } from '@/utils/analytics.js';

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
      
      // 相关量表
      relatedScales: [],
      
      // Canvas上下文
      radarCtx: null,
      barCtx: null,
      
      // 图表显示标志
      showRadarChart: false,
      
      // 滚动修复定时器
      scrollTimer: null,
      
      // Canvas尺寸缓存
      radarCanvasSize: null,
      barCanvasSize: null,
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
    // 通过强制重绘来同步Canvas位置
    if (this.radarCtx || this.barCtx) {
      this.fixCanvasPosition();
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
    loadHistoryData() {
      try {
        const history = uni.getStorageSync('assessment_history') || [];
        // 过滤当前量表的历史
        this.historyData = history
          .filter(h => h.scaleId === this.scaleId)
          .slice(-5); // 最近5次
        
        console.log('[RESULT] 加载历史数据:', this.historyData.length);
      } catch (error) {
        console.error('[RESULT] 加载历史失败:', error);
      }
    },
    
    /**
     * 保存到历史
     */
    saveToHistory() {
      try {
        const history = uni.getStorageSync('assessment_history') || [];
        
        history.push({
          scaleId: this.scaleId,
          score: this.score,
          level: this.level,
          timestamp: Date.now()
        });
        
        // 只保留最近50条
        if (history.length > 50) {
          history.splice(0, history.length - 50);
        }
        
        uni.setStorageSync('assessment_history', history);
        console.log('[RESULT] 已保存到历史');
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
    async generateShareImage() {
      // TODO: 使用Canvas生成包含图表的分享图片
      console.log('[RESULT] 生成分享图片');
      return null;
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
     * 修复Canvas滚动时位置异常
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
@media screen and (max-width: 375px) {
  .score-value {
    font-size: 100rpx;
  }
  
  .score-max {
    font-size: 40rpx;
  }
}

@media screen and (min-width: 768px) {
  .result-page {
    max-width: 750rpx;
    margin: 0 auto;
  }
}
</style>
