<template>
  <view class="player-page">
    <!-- 顶部导航 -->
    <view class="top-nav">
      <view class="nav-left">
        <view class="back-btn" @click="goBack">
          <text class="iconfont">&#xe670;</text>
        </view>
        <view class="nav-tabs">
          <text class="nav-tab" :class="{ active: activeTab === 'album' }" @click="switchTab('album')">专辑</text>
          <text class="nav-tab" :class="{ active: activeTab === 'playlist' }" @click="switchTab('playlist')">歌单</text>
          <text class="nav-tab" :class="{ active: activeTab === 'lyrics' }" @click="switchTab('lyrics')">歌词</text>
        </view>
      </view>
      <view class="nav-right">
        <text class="iconfont more-btn">&#xe668;</text>
      </view>
    </view>

    <!-- 专辑封面 -->
    <view class="album-section">
      <image 
        class="album-cover" 
        :src="currentSong.cover || '/static/images/default-album.png'"
        mode="aspectFill"
      />
    </view>

    <!-- 歌曲信息 -->
    <view class="song-info">
      <text class="song-title">{{ currentSong.title || '想去海边' }}</text>
      <text class="song-artist">{{ currentSong.artist || '夏日入侵企画' }}</text>
    </view>

    <!-- 播放控制 -->
    <view class="player-controls">
      <!-- 进度条 -->
      <view class="progress-section">
        <view class="progress-bar-wrapper">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
            <view class="progress-dot" :style="{ left: progressPercent + '%' }"></view>
          </view>
        </view>
        <view class="time-display">
          <text class="time-text">{{ formatTime(currentTime) }}</text>
          <text class="time-text">{{ formatTime(duration) }}</text>
        </view>
      </view>

      <!-- 控制按钮 -->
      <view class="control-buttons">
        <view class="control-btn" @click="toggleShuffle">
          <text class="iconfont" :class="{ active: isShuffle }">&#xe66d;</text>
        </view>
        <view class="control-btn" @click="playPrevious">
          <text class="iconfont">&#xe603;</text>
        </view>
        <view class="control-btn main-btn" @click="togglePlay">
          <view class="play-btn-wrapper">
            <text class="iconfont">{{ isPlaying ? '&#xe87c;' : '&#xe696;' }}</text>
          </view>
        </view>
        <view class="control-btn" @click="playNext">
          <text class="iconfont">&#xe602;</text>
        </view>
        <view class="control-btn" @click="toggleRepeat">
          <text class="iconfont" :class="{ active: repeatMode !== 'off' }">&#xe66c;</text>
        </view>
      </view>
    </view>

    <!-- 底部分隔线 -->
    <view class="bottom-divider"></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 'album',
      currentSong: {
        title: '想去海边',
        artist: '夏日入侵企画',
        cover: '',
        url: ''
      },
      isPlaying: false,
      isShuffle: false,
      repeatMode: 'off', // off, single, all
      currentTime: 84, // 秒
      duration: 267, // 秒
      audioContext: null
    }
  },
  computed: {
    progressPercent() {
      if (this.duration === 0) return 0
      return (this.currentTime / this.duration) * 100
    }
  },
  onLoad(options) {
    // 初始化音频上下文
    this.initAudio()
    
    // 如果有传入歌曲信息，更新当前歌曲
    if (options.songId) {
      this.loadSong(options.songId)
    } else {
      // 加载默认音频
      this.loadDefaultSong()
    }
  },
  methods: {
    initAudio() {
      this.audioContext = uni.createInnerAudioContext()
      this.audioContext.onPlay(() => {
        this.isPlaying = true
      })
      this.audioContext.onPause(() => {
        this.isPlaying = false
      })
      this.audioContext.onTimeUpdate(() => {
        this.currentTime = this.audioContext.currentTime
        this.duration = this.audioContext.duration
      })
    },
    goBack() {
      uni.navigateBack()
    },
    switchTab(tab) {
      this.activeTab = tab
    },
    togglePlay() {
      if (this.isPlaying) {
        this.audioContext && this.audioContext.pause()
      } else {
        if (this.audioContext && this.currentSong.url) {
          this.audioContext.play()
        } else {
          uni.showToast({
            title: '暂无音频资源',
            icon: 'none'
          })
        }
      }
    },
    playPrevious() {
      uni.showToast({
        title: '上一首',
        icon: 'none'
      })
    },
    playNext() {
      uni.showToast({
        title: '下一首',
        icon: 'none'
      })
    },
    toggleShuffle() {
      this.isShuffle = !this.isShuffle
      uni.showToast({
        title: this.isShuffle ? '随机播放' : '顺序播放',
        icon: 'none'
      })
    },
    toggleRepeat() {
      const modes = ['off', 'single', 'all']
      const currentIndex = modes.indexOf(this.repeatMode)
      this.repeatMode = modes[(currentIndex + 1) % modes.length]
      
      const modeText = {
        'off': '关闭循环',
        'single': '单曲循环',
        'all': '列表循环'
      }
      uni.showToast({
        title: modeText[this.repeatMode],
        icon: 'none'
      })
    },
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },
    async loadSong(songId) {
      try {
        // 加载音乐数据
        const musicData = require('@/static/music/music_data.json')
        let foundSong = null
        
        // 从所有播放列表中查找歌曲
        for (const playlist of musicData.playlists) {
          const song = playlist.songs.find(s => s.id == songId)
          if (song) {
            foundSong = song
            break
          }
        }
        
        if (foundSong) {
          this.currentSong = foundSong
          // 设置音频源
          if (this.audioContext) {
            this.audioContext.src = foundSong.url
            // 自动播放
            this.audioContext.play()
          }
        } else {
          uni.showToast({
            title: '歌曲未找到',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('[MUSIC] 加载歌曲失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    },
    
    async loadDefaultSong() {
      try {
        // 加载默认音乐数据
        const musicData = require('@/static/music/music_data.json')
        if (musicData.playlists && musicData.playlists[0] && musicData.playlists[0].songs[0]) {
          const defaultSong = musicData.playlists[0].songs[0]
          this.currentSong = defaultSong
          // 设置音频源
          if (this.audioContext) {
            this.audioContext.src = defaultSong.url
          }
        }
      } catch (error) {
        console.error('[MUSIC] 加载默认歌曲失败:', error)
        // 使用备用默认数据
        this.currentSong = {
          title: '呼吸放松',
          artist: '冥想大师',
          cover: '/static/images/meditation-1.jpg',
          url: '/static/audio/relax/breathing.mp3'
        }
      }
    }
  },
  onUnload() {
    // 页面卸载时销毁音频上下文
    if (this.audioContext) {
      this.audioContext.destroy()
    }
  }
}
</script>

<style scoped>
/* 页面容器 */
.player-page {
  display: flex;
  flex-direction: column;
  padding: 131rpx 46rpx 140rpx 65rpx;
  background-color: #f9fbfe;
  border-radius: 107rpx;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4rpx;
}

.nav-left {
  display: flex;
  align-items: center;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn .iconfont {
  font-size: 40rpx;
  color: #98aac2;
}

.nav-tabs {
  display: flex;
  align-items: center;
  margin-left: 56rpx;
}

.nav-tab {
  font-size: 32rpx;
  font-family: SourceHanSansCN;
  color: #98aac2;
  margin-left: 32rpx;
  transition: all 0.3s;
}

.nav-tab:first-child {
  margin-left: 0;
}

.nav-tab.active {
  font-size: 35rpx;
  color: #06306a;
  font-weight: 500;
}

.more-btn {
  font-size: 40rpx;
  color: #98aac2;
  margin-right: 10rpx;
}

/* 专辑封面 */
.album-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 86rpx;
}

.album-cover {
  width: 461rpx;
  height: 461rpx;
  border-radius: 50%;
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.1);
}

/* 歌曲信息 */
.song-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60rpx;
}

.song-title {
  font-size: 35rpx;
  font-weight: 700;
  color: #06306a;
  font-family: SourceHanSansCN;
}

.song-artist {
  color: #afbdcf;
  font-size: 28rpx;
  font-family: SourceHanSansCN;
  margin-top: 20rpx;
}

/* 播放控制 */
.player-controls {
  margin-top: 60rpx;
}

/* 进度条 */
.progress-section {
  margin-bottom: 40rpx;
}

.progress-bar-wrapper {
  padding: 10rpx 0;
  position: relative;
}

.progress-bar {
  background-color: #e5e5e5;
  border-radius: 6rpx;
  height: 44px;
  position: relative;
}

.progress-fill {
  background-color: #4bccfb;
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.3s;
}

.progress-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.25);
}

.time-display {
  display: flex;
  justify-content: space-between;
  margin-top: 11rpx;
}

.time-text {
  font-size: 25rpx;
  font-family: SourceHanSansCN;
  color: #afbdcf;
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 42rpx;
}

.control-btn {
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn .iconfont {
  font-size: 50rpx;
  color: #06306a;
}

.control-btn .iconfont.active {
  color: #4accfa;
}

.main-btn {
  width: auto;
  height: auto;
}

.play-btn-wrapper {
  width: 140rpx;
  height: 140rpx;
  background-color: #4accfa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5rpx 20rpx rgba(74, 204, 250, 0.4);
}

.play-btn-wrapper .iconfont {
  font-size: 60rpx;
  color: white;
}

/* 底部分隔线 */
.bottom-divider {
  margin-top: 88rpx;
  background-color: #e5e5e5;
  height: 44px;
}

/* 图标字体 */
@font-face {
  font-family: 'iconfont';
  src: url('//at.alicdn.com/t/font_2571459_7v6h8d8xrwg.woff2?t=1622275873397') format('woff2'),
       url('//at.alicdn.com/t/font_2571459_7v6h8d8xrwg.woff?t=1622275873397') format('woff'),
       url('//at.alicdn.com/t/font_2571459_7v6h8d8xrwg.ttf?t=1622275873397') format('truetype');
}

.iconfont {
  font-family: "iconfont" !important;
  font-size: 32rpx;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}


/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}

</style>