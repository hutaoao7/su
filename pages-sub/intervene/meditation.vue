<template>
  <view class="meditation-page">
    <!-- 顶部介绍 -->
    <view class="intro-section">
      <view class="intro-icon">
        <u-icon name="play-circle" size="48" color="#AF52DE"></u-icon>
      </view>
      <text class="intro-title">正念冥想</text>
      <text class="intro-subtitle">通过音乐和引导放松身心，缓解压力</text>
    </view>
    
    <!-- 冥想类别 -->
    <view class="category-section">
      <view class="section-header">
        <text class="section-title">选择冥想类型</text>
      </view>
      
      <view class="category-cards">
        <view 
          v-for="(category, index) in categories" 
          :key="index"
          class="category-card"
          :class="{ 'card-pressed': pressedCard === index }"
          @touchstart="handleTouchStart(index)"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchEnd"
          @tap="handleCategoryTap(index)"
        >
          <view class="card-icon" :style="{ background: category.iconBg }">
            <u-icon :name="category.icon" size="32" :color="category.iconColor"></u-icon>
          </view>
          <view class="card-info">
            <text class="card-title">{{ category.title }}</text>
            <text class="card-subtitle">{{ category.subtitle }}</text>
          </view>
          <view class="card-arrow">
            <u-icon name="arrow-right" size="20" color="#C7C7CC"></u-icon>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 推荐音频 -->
    <view class="audio-section">
      <view class="section-header">
        <text class="section-title">推荐音频</text>
      </view>
      
      <view class="audio-list">
        <view 
          v-for="(audio, index) in recommendedAudios" 
          :key="index"
          class="audio-item"
          @tap="playAudio(index)"
        >
          <view class="audio-cover">
            <u-icon name="play-circle-fill" size="24" color="#FFFFFF"></u-icon>
          </view>
          <view class="audio-info">
            <text class="audio-title">{{ audio.title }}</text>
            <text class="audio-duration">{{ audio.duration }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 提示信息 -->
    <view class="tips-section">
      <u-icon name="info-circle" size="20" color="#86868B"></u-icon>
      <text class="tips-text">建议使用耳机，在安静的环境中获得最佳体验</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      pressedCard: null,
      categories: [
        {
          title: '冥想引导',
          subtitle: '跟随语音引导进行冥想练习',
          icon: 'account',
          iconColor: '#5856D6',
          iconBg: 'rgba(88, 86, 214, 0.1)',
          type: 'guided'
        },
        {
          title: '自然音效',
          subtitle: '聆听大自然的声音放松心情',
          icon: 'star',
          iconColor: '#34C759',
          iconBg: 'rgba(52, 199, 89, 0.1)',
          type: 'nature'
        },
        {
          title: '放松音乐',
          subtitle: '舒缓的背景音乐帮助入眠',
          icon: 'volume',
          iconColor: '#FF9500',
          iconBg: 'rgba(255, 149, 0, 0.1)',
          type: 'music'
        }
      ],
      recommendedAudios: [
        {
          title: '深度呼吸练习',
          duration: '10分钟',
          type: 'guided',
          url: ''
        },
        {
          title: '森林漫步',
          duration: '15分钟',
          type: 'nature',
          url: ''
        },
        {
          title: '海浪声',
          duration: '20分钟',
          type: 'nature',
          url: ''
        },
        {
          title: '轻柔钢琴曲',
          duration: '30分钟',
          type: 'music',
          url: ''
        }
      ]
    }
  },
  
  onLoad() {
    console.log('[MEDITATION] 正念冥想页面加载');
  },
  
  methods: {
    // 处理触摸开始
    handleTouchStart(index) {
      this.pressedCard = index;
    },
    
    // 处理触摸结束
    handleTouchEnd() {
      this.pressedCard = null;
    },
    
    // 处理类别点击
    handleCategoryTap(index) {
      const category = this.categories[index];
      console.log('[MEDITATION] 选择类别:', category.title);
      
      // 根据类型跳转到不同页面
      let targetPage = '';
      switch(category.type) {
        case 'guided':
          targetPage = '/pages-sub/music/index?type=guided';
          break;
        case 'nature':
          targetPage = '/pages-sub/intervene/nature';
          break;
        case 'music':
          targetPage = '/pages-sub/music/index?type=music';
          break;
        default:
          uni.showToast({
            title: '功能开发中',
            icon: 'none'
          });
          return;
      }
      
      uni.navigateTo({
        url: targetPage,
        fail: () => {
          uni.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 播放音频
    playAudio(index) {
      const audio = this.recommendedAudios[index];
      console.log('[MEDITATION] 播放音频:', audio.title);
      
      // 跳转到音乐播放器页面
      uni.navigateTo({
        url: '/pages-sub/music/player?title=' + encodeURIComponent(audio.title) + '&duration=' + audio.duration,
        fail: () => {
          uni.showToast({
            title: '播放器加载失败',
            icon: 'none'
          });
        }
      });
    }
  }
}
</script>

<style scoped>
.meditation-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #F9F7FF 0%, #FFFFFF 40%);
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(48rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
}

/* 介绍区域 */
.intro-section {
  padding: 64rpx 48rpx;
  text-align: center;
}

.intro-icon {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 32rpx;
  border-radius: 50%;
  background: rgba(175, 82, 222, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.intro-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}

.intro-subtitle {
  display: block;
  font-size: 28rpx;
  color: #86868B;
  line-height: 1.6;
}

/* 类别区域 */
.category-section {
  padding: 0 24rpx 32rpx;
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.category-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.category-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.category-card:active,
.card-pressed {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.card-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.card-subtitle {
  font-size: 26rpx;
  color: #86868B;
  line-height: 1.4;
}

.card-arrow {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 音频列表区域 */
.audio-section {
  padding: 32rpx 24rpx;
}

.audio-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.audio-item {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.audio-item:active {
  transform: scale(0.98);
  background: #F9FAFB;
}

.audio-cover {
  width: 88rpx;
  height: 88rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.audio-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.audio-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #1D1D1F;
}

.audio-duration {
  font-size: 24rpx;
  color: #86868B;
}

/* 提示区域 */
.tips-section {
  margin: 32rpx 24rpx;
  padding: 24rpx 28rpx;
  background: rgba(255, 149, 0, 0.08);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.tips-text {
  flex: 1;
  font-size: 26rpx;
  color: #86868B;
  line-height: 1.5;
}


/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}

</style>
