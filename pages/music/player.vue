<template>
   <view class="player-page">
    <!-- 封面区域 -->
    <view class="cover-section">
      <view class="cover-container" :class="{ rotating: isPlaying }">
        <image 
          class="cover-image"
          :src="currentTrack.cover || '/static/images/music-cover.png'"
          mode="aspectFill"
        />
      </view>
    </view>

    <!-- 歌曲信息 -->
    <view class="info-section">
      <text class="track-title">{{ currentTrack.title || '未知曲目' }}</text>
      <text class="track-subtitle">{{ currentTrack.artist || '未知艺术家' }}</text>
    </view>

    <!-- 进度条 -->
    <view class="progress-section">
      <text class="time-text">{{ formatTime(currentTime) }}</text>
      <slider 
        class="progress-slider"
        :value="progressPercent"
        :min="0"
        :max="100"
        block-size="12"
        @changing="onProgressChanging"
        @change="onProgressChange"
      />
      <text class="time-text">{{ formatTime(duration) }}</text>
    </view>

    <!-- 控制按钮 -->
    <view class="controls-section">
      <!-- 播放模式 -->
      <view class="control-btn" @tap="switchPlayMode">
        <u-icon :name="playModeIcon" size="24" color="#1D1D1F"></u-icon>
      </view>
      
      <!-- 上一曲 -->
      <view class="control-btn" @tap="playPrevious">
        <u-icon name="arrow-left" size="28" color="#1D1D1F"></u-icon>
      </view>
      
      <!-- 播放/暂停 -->
      <view class="control-btn control-btn-play" @tap="togglePlay">
        <u-icon 
          :name="isPlaying ? 'pause-circle-fill' : 'play-circle-fill'" 
          size="64" 
          color="#0A84FF"
        ></u-icon>
      </view>
      
      <!-- 下一曲 -->
      <view class="control-btn" @tap="playNext">
        <u-icon name="arrow-right" size="28" color="#1D1D1F"></u-icon>
      </view>
      
      <!-- 收藏 -->
      <view class="control-btn" @tap="toggleFavorite">
        <u-icon 
          :name="isFavorite ? 'star-fill' : 'star'" 
          size="24" 
          :color="isFavorite ? '#FFB74D' : '#1D1D1F'"
        ></u-icon>
      </view>
    </view>

    <!-- 额外功能 -->
    <view class="extra-controls">
      <!-- 播放速度 -->
      <view class="extra-item" @tap="showSpeedPicker">
        <u-icon name="clock" size="20" color="#86868B"></u-icon>
        <text class="extra-text">{{ playSpeed }}x</text>
      </view>
      
      <!-- 定时关闭 -->
      <view class="extra-item" @tap="showTimerPicker">
        <u-icon name="bell" size="20" color="#86868B"></u-icon>
        <text class="extra-text">{{ timerText }}</text>
      </view>
    </view>

    <!-- 音频组件（隐藏） -->
    <audio 
      :id="audioId"
      :src="currentTrack.audio_url"
      :loop="playMode === 'single'"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @error="onError"
      style="display: none;"
    />
  </view>
</template>

<script>
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { trackEvent } from '@/utils/analytics.js';

export default {
  data() {
    return {
      audioId: 'music-player',
      audioContext: null,
      currentTrack: {},
      playlist: [],
      currentIndex: 0,
      
      // 播放状态
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      
      // 播放模式：single（单曲循环）、list（列表循环）、random（随机）
      playMode: 'list',
      
      // 播放速度
      playSpeed: 1.0,
      
      // 定时器
      timer: null,
      timerMinutes: 0,
      
      // 收藏状态
      isFavorite: false,
      
      // 播放开始时间（用于统计）
      playStartTime: 0
    };
  },
  
  computed: {
    progressPercent() {
      if (!this.duration) return 0;
      return (this.currentTime / this.duration) * 100;
    },
    
    playModeIcon() {
      const icons = {
        single: 'reload',
        list: 'list',
        random: 'shuffle'
      };
      return icons[this.playMode] || 'list';
    },
    
    timerText() {
      return this.timerMinutes > 0 ? `${this.timerMinutes}分钟` : '定时';
    }
  },
  
  onLoad(options) {
    if (options.track_id) {
      this.loadTrack(options.track_id);
    }
    
    // 创建音频上下文
    this.audioContext = uni.createInnerAudioContext();
    this.setupAudioListeners();
  },
  
  onUnload() {
    // 记录播放时长
    this.recordPlayHistory();
    
    // 销毁音频上下文
    if (this.audioContext) {
      this.audioContext.destroy();
    }
    
    // 清除定时器
    if (this.timer) {
      clearTimeout(this.timer);
    }
  },
  
  methods: {
    setupAudioListeners() {
      const ctx = this.audioContext;
      
      ctx.onPlay(() => {
        this.isPlaying = true;
        this.playStartTime = Date.now();
      });
      
      ctx.onPause(() => {
        this.isPlaying = false;
      });
      
      ctx.onEnded(() => {
        this.onEnded();
      });
      
      ctx.onTimeUpdate(() => {
        this.currentTime = ctx.currentTime;
        this.duration = ctx.duration;
      });
      
      ctx.onError((error) => {
        console.error('[PLAYER] 播放错误:', error);
        uni.showToast({
          title: '播放失败',
          icon: 'none'
        });
      });
    },
    
    async loadTrack(trackId) {
      try {
        const res = await callCloudFunction('fn-music', {
          action: 'detail',
          track_id: trackId
        });
        
        if (res && res.track) {
          this.currentTrack = res.track;
          this.isFavorite = res.track.is_favorited || false;
          
          // 设置音频源
          this.audioContext.src = this.currentTrack.audio_url;
          this.audioContext.title = this.currentTrack.title;
          
          // 自动播放
          this.play();
          
          // 埋点
          trackEvent('music_play', {
            track_id: trackId,
            title: this.currentTrack.title
          });
        }
      } catch (error) {
        console.error('[PLAYER] 加载曲目失败:', error);
      }
    },
    
    play() {
      this.audioContext.play();
    },
    
    pause() {
      this.audioContext.pause();
    },
    
    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },
    
    playNext() {
      if (this.playMode === 'random') {
        // 随机播放
        this.currentIndex = Math.floor(Math.random() * this.playlist.length);
      } else {
        // 顺序播放
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      }
      
      this.loadTrack(this.playlist[this.currentIndex].track_id);
    },
    
    playPrevious() {
      this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
      this.loadTrack(this.playlist[this.currentIndex].track_id);
    },
    
    onEnded() {
      // 记录播放历史
      this.recordPlayHistory();
      
      // 根据播放模式决定下一步
      if (this.playMode === 'single') {
        // 单曲循环
        this.audioContext.seek(0);
        this.play();
      } else {
        // 播放下一曲
        this.playNext();
      }
    },
    
    switchPlayMode() {
      const modes = ['list', 'single', 'random'];
      const currentModeIndex = modes.indexOf(this.playMode);
      this.playMode = modes[(currentModeIndex + 1) % modes.length];
      
      const modeNames = {
        list: '列表循环',
        single: '单曲循环',
        random: '随机播放'
      };
      
      uni.showToast({
        title: modeNames[this.playMode],
        icon: 'none',
        duration: 1000
      });
    },
    
    async toggleFavorite() {
      this.isFavorite = !this.isFavorite;
      
      try {
        await callCloudFunction('fn-music', {
          action: 'fav',
          track_id: this.currentTrack.track_id,
          favorite: this.isFavorite
        });
        
        uni.showToast({
          title: this.isFavorite ? '已收藏' : '已取消收藏',
          icon: 'success',
          duration: 1000
        });
      } catch (error) {
        // 回滚
        this.isFavorite = !this.isFavorite;
      }
    },
    
    showSpeedPicker() {
      const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
      
      uni.showActionSheet({
        itemList: speeds.map(s => `${s}x`),
        success: (res) => {
          this.playSpeed = speeds[res.tapIndex];
          this.audioContext.playbackRate = this.playSpeed;
          
          uni.showToast({
            title: `播放速度：${this.playSpeed}x`,
            icon: 'none'
          });
        }
      });
    },
    
    showTimerPicker() {
      const timers = [15, 30, 60, 90];
      
      uni.showActionSheet({
        itemList: ['关闭定时', ...timers.map(t => `${t}分钟后`)],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.clearTimer();
          } else {
            this.setTimer(timers[res.tapIndex - 1]);
          }
        }
      });
    },
    
    setTimer(minutes) {
      this.clearTimer();
      
      this.timerMinutes = minutes;
      this.timer = setTimeout(() => {
        this.pause();
        this.timerMinutes = 0;
        
        uni.showToast({
          title: '定时停止播放',
          icon: 'none'
        });
      }, minutes * 60 * 1000);
      
      uni.showToast({
        title: `已设置${minutes}分钟后停止`,
        icon: 'none'
      });
    },
    
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
        this.timerMinutes = 0;
      }
    },
    
    onProgressChanging(e) {
      // 拖动进度条时
      const percent = e.detail.value;
      const time = (percent / 100) * this.duration;
      this.currentTime = time;
    },
    
    onProgressChange(e) {
      // 松开进度条时
      const percent = e.detail.value;
      const time = (percent / 100) * this.duration;
      this.audioContext.seek(time);
    },
    
    recordPlayHistory() {
      if (!this.playStartTime) return;
      
      const playDuration = Math.floor((Date.now() - this.playStartTime) / 1000);
      const completionRate = this.duration > 0 ? (this.currentTime / this.duration * 100) : 0;
      
      // 上报播放历史
      callCloudFunction('fn-music', {
        action: 'history',
        track_id: this.currentTrack.track_id,
        play_duration: playDuration,
        completion_rate: completionRate
      }).catch(err => {
        console.error('[PLAYER] 记录历史失败:', err);
      });
      
      this.playStartTime = 0;
    },
    
    formatTime(seconds) {
      if (!seconds || seconds < 0) return '00:00';
      
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },
    
    onPlay() {
      this.isPlaying = true;
    },
    
    onPause() {
      this.isPlaying = false;
    },
    
    onTimeUpdate() {
      // 更新由audioContext的监听器处理
    },
    
    onError(e) {
      console.error('[PLAYER] 播放错误:', e);
    }
  }
};
</script>

<style scoped>
.player-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #F9F7FF 0%, #FFFFFF 60%);
  padding: 80rpx 40rpx;
  padding-top: calc(80rpx + constant(safe-area-inset-top));
  padding-top: calc(80rpx + env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
}

/* 封面区域 */
.cover-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 60rpx;
}

.cover-container {
  width: 560rpx;
  height: 560rpx;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 24rpx 64rpx rgba(102, 126, 234, 0.3);
  position: relative;
}

.cover-container::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80rpx;
  height: 80rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.cover-container.rotating {
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.cover-image {
  width: 100%;
  height: 100%;
}

/* 歌曲信息 */
.info-section {
  text-align: center;
  margin-bottom: 60rpx;
}

.track-title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}

.track-subtitle {
  display: block;
  font-size: 28rpx;
  color: #86868B;
}

/* 进度条 */
.progress-section {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 60rpx;
}

.time-text {
  font-size: 24rpx;
  color: #86868B;
  width: 80rpx;
  text-align: center;
}

.progress-slider {
  flex: 1;
}

/* 控制按钮 */
.controls-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
  margin-bottom: 48rpx;
}

.control-btn {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn-play {
  width: 120rpx;
  height: 120rpx;
}

/* 额外功能 */
.extra-controls {
  display: flex;
  justify-content: space-around;
  padding: 32rpx 0;
}

.extra-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 48rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.extra-text {
  font-size: 26rpx;
  color: #86868B;
}

/* 响应式适配 */
@media screen and (max-width: 375px) {
  .cover-container {
    width: 480rpx;
    height: 480rpx;
  }
  
  .track-title {
    font-size: 38rpx;
  }
}

@media screen and (min-width: 768px) {
  .player-page {
    max-width: 750rpx;
    margin: 0 auto;
  }
}
</style>
