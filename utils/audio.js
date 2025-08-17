// 音频播放统一封装
class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.currentTrack = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.onStateChange = null;
    this.onProgress = null;
    this.onError = null;
  }

  // 创建音频实例
  createAudio(src) {
    // #ifdef H5
    const audio = new Audio();
    audio.src = src;
    audio.preload = 'metadata';
    return audio;
    // #endif

    // #ifndef H5
    const audio = uni.createInnerAudioContext();
    audio.src = src;
    return audio;
    // #endif
  }

  // 初始化播放器
  init(track, playlist = []) {
    this.stop(); // 停止当前播放
    
    this.currentTrack = track;
    this.playlist = playlist;
    this.currentIndex = playlist.findIndex(t => t.id === track.id);
    
    // 获取缓存路径或使用在线地址
    const audioSrc = this.getCachedPath(track.id) || track.srcUrl;
    this.currentAudio = this.createAudio(audioSrc);
    
    this.bindEvents();
  }

  // 绑定事件
  bindEvents() {
    if (!this.currentAudio) return;

    // #ifdef H5
    this.currentAudio.addEventListener('loadedmetadata', () => {
      this.onStateChange && this.onStateChange('loaded');
    });

    this.currentAudio.addEventListener('timeupdate', () => {
      if (this.onProgress) {
        this.onProgress({
          currentTime: this.currentAudio.currentTime,
          duration: this.currentAudio.duration
        });
      }
    });

    this.currentAudio.addEventListener('ended', () => {
      this.onStateChange && this.onStateChange('ended');
      this.next();
    });

    this.currentAudio.addEventListener('error', (e) => {
      console.error('音频播放错误:', e);
      this.onError && this.onError(e);
    });
    // #endif

    // #ifndef H5
    this.currentAudio.onCanplay(() => {
      this.onStateChange && this.onStateChange('loaded');
    });

    this.currentAudio.onTimeUpdate(() => {
      if (this.onProgress) {
        this.onProgress({
          currentTime: this.currentAudio.currentTime,
          duration: this.currentAudio.duration
        });
      }
    });

    this.currentAudio.onEnded(() => {
      this.onStateChange && this.onStateChange('ended');
      this.next();
    });

    this.currentAudio.onError((e) => {
      console.error('音频播放错误:', e);
      this.onError && this.onError(e);
    });
    // #endif
  }

  // 播放
  play() {
    if (!this.currentAudio) return;

    try {
      // #ifdef H5
      this.currentAudio.play();
      // #endif

      // #ifndef H5
      this.currentAudio.play();
      // #endif

      this.isPlaying = true;
      this.onStateChange && this.onStateChange('playing');
      
      // 记录播放事件
      this.trackEvent('music_play');
    } catch (error) {
      console.error('播放失败:', error);
      this.onError && this.onError(error);
    }
  }

  // 暂停
  pause() {
    if (!this.currentAudio) return;

    // #ifdef H5
    this.currentAudio.pause();
    // #endif

    // #ifndef H5
    this.currentAudio.pause();
    // #endif

    this.isPlaying = false;
    this.onStateChange && this.onStateChange('paused');
  }

  // 停止
  stop() {
    if (!this.currentAudio) return;

    this.pause();
    this.seek(0);
    
    // #ifndef H5
    this.currentAudio.destroy && this.currentAudio.destroy();
    // #endif

    this.currentAudio = null;
    this.isPlaying = false;
    this.onStateChange && this.onStateChange('stopped');
  }

  // 跳转到指定时间
  seek(time) {
    if (!this.currentAudio) return;

    // #ifdef H5
    this.currentAudio.currentTime = time;
    // #endif

    // #ifndef H5
    this.currentAudio.seek(time);
    // #endif
  }

  // 上一首
  prev() {
    if (this.playlist.length === 0) return;

    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    const prevTrack = this.playlist[this.currentIndex];
    this.init(prevTrack, this.playlist);
    this.play();
  }

  // 下一首
  next() {
    if (this.playlist.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    const nextTrack = this.playlist[this.currentIndex];
    this.init(nextTrack, this.playlist);
    this.play();
  }

  // 获取缓存路径
  getCachedPath(trackId) {
    try {
      const cacheIndex = uni.getStorageSync('MUSIC_CACHE_INDEX') || {};
      return cacheIndex[trackId] || null;
    } catch (error) {
      console.error('获取缓存路径失败:', error);
      return null;
    }
  }

  // 缓存音频文件
  async cacheTrack(track) {
    // #ifdef H5
    // H5端由浏览器自动缓存，无需手动处理
    return track.srcUrl;
    // #endif

    // #ifndef H5
    try {
      const cachedPath = this.getCachedPath(track.id);
      if (cachedPath) {
        // 检查文件是否存在
        const fileInfo = await uni.getFileInfo({ filePath: cachedPath });
        if (fileInfo.size > 0) {
          return cachedPath;
        }
      }

      // 下载文件
      const downloadResult = await uni.downloadFile({
        url: track.srcUrl,
        timeout: 30000
      });

      if (downloadResult.statusCode === 200) {
        // 保存到缓存索引
        const cacheIndex = uni.getStorageSync('MUSIC_CACHE_INDEX') || {};
        cacheIndex[track.id] = downloadResult.tempFilePath;
        uni.setStorageSync('MUSIC_CACHE_INDEX', cacheIndex);
        
        return downloadResult.tempFilePath;
      }
      
      throw new Error('下载失败');
    } catch (error) {
      console.error('缓存音频失败:', error);
      return track.srcUrl; // 降级为在线播放
    }
    // #endif
  }

  // 记录播放事件
  trackEvent(type) {
    if (!this.currentTrack) return;

    try {
      // 这里调用事件追踪API
      const { apiEvents, safeInvokeApi } = require('./request.js');
      safeInvokeApi(() => apiEvents.track({
        type,
        detail: {
          trackId: this.currentTrack.id,
          category: this.currentTrack.category,
          title: this.currentTrack.title
        }
      })).catch(error => {
        console.error('事件追踪失败:', error);
      });
    } catch (error) {
      console.error('事件追踪失败:', error);
    }
  }

  // 保存最近播放
  saveLastPlayed() {
    if (!this.currentTrack) return;

    try {
      const lastPlayed = {
        track: this.currentTrack,
        playlist: this.playlist,
        currentIndex: this.currentIndex,
        timestamp: Date.now()
      };
      uni.setStorageSync('MUSIC_LAST_PLAYED', lastPlayed);
    } catch (error) {
      console.error('保存最近播放失败:', error);
    }
  }

  // 获取最近播放
  getLastPlayed() {
    try {
      return uni.getStorageSync('MUSIC_LAST_PLAYED') || null;
    } catch (error) {
      console.error('获取最近播放失败:', error);
      return null;
    }
  }

  // 销毁播放器
  destroy() {
    this.stop();
    this.saveLastPlayed();
    this.currentTrack = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.onStateChange = null;
    this.onProgress = null;
    this.onError = null;
  }
}

export default AudioManager;