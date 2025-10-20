/**
 * 音乐播放器管理工具
 * 
 * 功能：
 * 1. 音频预加载机制
 * 2. 播放速度调节（0.5x-2x）
 * 3. 定时关闭功能
 * 4. 循环播放模式切换
 * 5. 后台播放功能
 * 6. 播放历史记录
 * 7. 收藏功能
 * 8. 播放时长统计
 * 
 * @author CraneHeart Team
 * @version 1.0.0
 */

class MusicPlayer {
  constructor() {
    // 音频上下文
    this.audioContext = null;
    this.currentTrack = null;
    this.playbackState = 'stopped'; // stopped, playing, paused
    
    // 播放配置
    this.config = {
      playbackRate: 1.0, // 播放速度（0.5-2.0）
      loopMode: 'none', // 循环模式：none, single, list
      volume: 1.0, // 音量（0-1）
      autoplay: false,
      preloadCount: 3 // 预加载曲目数量
    };
    
    // 定时器
    this.sleepTimer = null; // 定时关闭定时器
    this.statsTimer = null; // 统计定时器
    
    // 播放统计
    this.stats = {
      currentPlayTime: 0, // 当前曲目播放时长（秒）
      totalPlayTime: 0, // 总播放时长（秒）
      playCount: 0 // 播放次数
    };
    
    // 预加载缓存
    this.preloadCache = new Map();
    
    // 播放历史（最多保存100条）
    this.playHistory = [];
    this.maxHistorySize = 100;
    
    // 收藏列表
    this.favorites = new Set();
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化播放器
   */
  init() {
    // 创建音频上下文
    // #ifdef H5
    this.audioContext = uni.createInnerAudioContext();
    // #endif
    
    // #ifdef MP-WEIXIN
    this.audioContext = uni.createInnerAudioContext();
    // #endif
    
    if (this.audioContext) {
      // 监听播放事件
      this.audioContext.onPlay(() => {
        this.playbackState = 'playing';
        this.startStatsTimer();
        this.emit('play', this.currentTrack);
      });
      
      // 监听暂停事件
      this.audioContext.onPause(() => {
        this.playbackState = 'paused';
        this.stopStatsTimer();
        this.emit('pause', this.currentTrack);
      });
      
      // 监听停止事件
      this.audioContext.onStop(() => {
        this.playbackState = 'stopped';
        this.stopStatsTimer();
        this.savePlayStats();
        this.emit('stop', this.currentTrack);
      });
      
      // 监听播放完成
      this.audioContext.onEnded(() => {
        this.handlePlayEnded();
      });
      
      // 监听错误
      this.audioContext.onError((err) => {
        console.error('[MusicPlayer] 播放错误:', err);
        this.emit('error', err);
      });
      
      // 启用后台播放
      // #ifdef MP-WEIXIN
      this.audioContext.obeyMuteSwitch = false; // 不遵循静音开关
      // #endif
    }
    
    // 加载本地数据
    this.loadLocalData();
  }
  
  /**
   * 加载本地数据
   */
  loadLocalData() {
    try {
      // 加载播放历史
      const history = uni.getStorageSync('music_play_history');
      if (history) {
        this.playHistory = JSON.parse(history);
      }
      
      // 加载收藏列表
      const favorites = uni.getStorageSync('music_favorites');
      if (favorites) {
        this.favorites = new Set(JSON.parse(favorites));
      }
      
      // 加载统计数据
      const stats = uni.getStorageSync('music_play_stats');
      if (stats) {
        this.stats = { ...this.stats, ...JSON.parse(stats) };
      }
      
      // 加载配置
      const config = uni.getStorageSync('music_player_config');
      if (config) {
        this.config = { ...this.config, ...JSON.parse(config) };
      }
    } catch (error) {
      console.error('[MusicPlayer] 加载本地数据失败:', error);
    }
  }
  
  /**
   * 保存本地数据
   */
  saveLocalData() {
    try {
      // 保存播放历史
      uni.setStorageSync('music_play_history', JSON.stringify(this.playHistory));
      
      // 保存收藏列表
      uni.setStorageSync('music_favorites', JSON.stringify([...this.favorites]));
      
      // 保存统计数据
      uni.setStorageSync('music_play_stats', JSON.stringify(this.stats));
      
      // 保存配置
      uni.setStorageSync('music_player_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('[MusicPlayer] 保存本地数据失败:', error);
    }
  }
  
  /**
   * 播放音乐
   * @param {Object} track - 曲目信息
   * @param {Boolean} autoPreload - 是否自动预加载下一首
   */
  async play(track, autoPreload = true) {
    if (!track || !track.audio_url) {
      console.error('[MusicPlayer] 无效的曲目信息');
      return false;
    }
    
    try {
      // 如果正在播放，先停止
      if (this.playbackState !== 'stopped') {
        this.stop();
      }
      
      // 设置当前曲目
      this.currentTrack = track;
      
      // 设置音频源
      this.audioContext.src = track.audio_url;
      
      // 设置播放速度
      // #ifdef MP-WEIXIN
      if (this.audioContext.playbackRate !== undefined) {
        this.audioContext.playbackRate = this.config.playbackRate;
      }
      // #endif
      
      // 设置音量
      this.audioContext.volume = this.config.volume;
      
      // 设置循环（单曲循环）
      this.audioContext.loop = this.config.loopMode === 'single';
      
      // 开始播放
      this.audioContext.play();
      
      // 添加到播放历史
      this.addToHistory(track);
      
      // 更新播放次数
      this.stats.playCount++;
      
      // 预加载下一首
      if (autoPreload) {
        this.preloadNext(track);
      }
      
      // 保存数据
      this.saveLocalData();
      
      return true;
    } catch (error) {
      console.error('[MusicPlayer] 播放失败:', error);
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * 暂停播放
   */
  pause() {
    if (this.audioContext && this.playbackState === 'playing') {
      this.audioContext.pause();
    }
  }
  
  /**
   * 继续播放
   */
  resume() {
    if (this.audioContext && this.playbackState === 'paused') {
      this.audioContext.play();
    }
  }
  
  /**
   * 停止播放
   */
  stop() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.playbackState = 'stopped';
      this.stopStatsTimer();
      this.savePlayStats();
    }
  }
  
  /**
   * 设置播放速度
   * @param {Number} rate - 播放速度（0.5-2.0）
   */
  setPlaybackRate(rate) {
    if (rate < 0.5 || rate > 2.0) {
      console.warn('[MusicPlayer] 播放速度超出范围（0.5-2.0）');
      return false;
    }
    
    this.config.playbackRate = rate;
    
    // #ifdef MP-WEIXIN
    if (this.audioContext && this.audioContext.playbackRate !== undefined) {
      this.audioContext.playbackRate = rate;
    }
    // #endif
    
    this.saveLocalData();
    this.emit('rateChange', rate);
    return true;
  }
  
  /**
   * 设置循环模式
   * @param {String} mode - 循环模式：none, single, list
   */
  setLoopMode(mode) {
    const validModes = ['none', 'single', 'list'];
    if (!validModes.includes(mode)) {
      console.warn('[MusicPlayer] 无效的循环模式');
      return false;
    }
    
    this.config.loopMode = mode;
    
    if (this.audioContext) {
      this.audioContext.loop = mode === 'single';
    }
    
    this.saveLocalData();
    this.emit('loopModeChange', mode);
    return true;
  }
  
  /**
   * 设置音量
   * @param {Number} volume - 音量（0-1）
   */
  setVolume(volume) {
    if (volume < 0 || volume > 1) {
      console.warn('[MusicPlayer] 音量超出范围（0-1）');
      return false;
    }
    
    this.config.volume = volume;
    
    if (this.audioContext) {
      this.audioContext.volume = volume;
    }
    
    this.saveLocalData();
    this.emit('volumeChange', volume);
    return true;
  }
  
  /**
   * 设置定时关闭
   * @param {Number} minutes - 分钟数（0表示取消）
   */
  setSleepTimer(minutes) {
    // 清除已有定时器
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }
    
    if (minutes > 0) {
      const milliseconds = minutes * 60 * 1000;
      this.sleepTimer = setTimeout(() => {
        this.stop();
        this.emit('sleepTimerEnd');
        uni.showToast({
          title: '定时关闭已触发',
          icon: 'none'
        });
      }, milliseconds);
      
      this.emit('sleepTimerSet', minutes);
      return true;
    }
    
    return false;
  }
  
  /**
   * 跳转到指定位置
   * @param {Number} position - 位置（秒）
   */
  seek(position) {
    if (this.audioContext && position >= 0) {
      this.audioContext.seek(position);
      this.emit('seek', position);
      return true;
    }
    return false;
  }
  
  /**
   * 获取当前播放位置
   * @returns {Number} 当前位置（秒）
   */
  getCurrentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }
  
  /**
   * 获取音频总时长
   * @returns {Number} 总时长（秒）
   */
  getDuration() {
    return this.audioContext ? this.audioContext.duration : 0;
  }
  
  /**
   * 预加载音频
   * @param {String} url - 音频URL
   */
  preloadAudio(url) {
    if (!url || this.preloadCache.has(url)) {
      return;
    }
    
    try {
      // 创建预加载音频对象
      const audio = uni.createInnerAudioContext();
      audio.src = url;
      audio.volume = 0; // 静音预加载
      
      audio.onCanplay(() => {
        console.log('[MusicPlayer] 预加载完成:', url);
        this.preloadCache.set(url, true);
        audio.destroy();
      });
      
      audio.onError(() => {
        console.warn('[MusicPlayer] 预加载失败:', url);
        audio.destroy();
      });
    } catch (error) {
      console.error('[MusicPlayer] 预加载错误:', error);
    }
  }
  
  /**
   * 预加载下一首
   * @param {Object} currentTrack - 当前曲目
   */
  preloadNext(currentTrack) {
    // 这里需要结合播放列表逻辑
    // 暂时简单实现，实际使用时需要传入播放列表
    this.emit('preloadNext', currentTrack);
  }
  
  /**
   * 添加到播放历史
   * @param {Object} track - 曲目信息
   */
  addToHistory(track) {
    const historyItem = {
      ...track,
      playedAt: new Date().toISOString(),
      playTime: 0
    };
    
    // 移除重复项
    this.playHistory = this.playHistory.filter(item => item.id !== track.id);
    
    // 添加到开头
    this.playHistory.unshift(historyItem);
    
    // 限制历史记录数量
    if (this.playHistory.length > this.maxHistorySize) {
      this.playHistory = this.playHistory.slice(0, this.maxHistorySize);
    }
    
    this.saveLocalData();
    this.emit('historyUpdate', this.playHistory);
  }
  
  /**
   * 获取播放历史
   * @param {Number} limit - 限制数量
   * @returns {Array} 播放历史列表
   */
  getHistory(limit = 20) {
    return this.playHistory.slice(0, limit);
  }
  
  /**
   * 清空播放历史
   */
  clearHistory() {
    this.playHistory = [];
    this.saveLocalData();
    this.emit('historyClear');
  }
  
  /**
   * 添加/取消收藏
   * @param {String} trackId - 曲目ID
   * @returns {Boolean} 是否已收藏
   */
  toggleFavorite(trackId) {
    if (this.favorites.has(trackId)) {
      this.favorites.delete(trackId);
      this.saveLocalData();
      this.emit('favoriteRemove', trackId);
      return false;
    } else {
      this.favorites.add(trackId);
      this.saveLocalData();
      this.emit('favoriteAdd', trackId);
      return true;
    }
  }
  
  /**
   * 检查是否已收藏
   * @param {String} trackId - 曲目ID
   * @returns {Boolean}
   */
  isFavorite(trackId) {
    return this.favorites.has(trackId);
  }
  
  /**
   * 获取收藏列表
   * @returns {Array} 收藏列表
   */
  getFavorites() {
    return [...this.favorites];
  }
  
  /**
   * 开始统计计时器
   */
  startStatsTimer() {
    if (this.statsTimer) {
      return;
    }
    
    const startTime = Date.now();
    this.statsTimer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      this.stats.currentPlayTime = elapsedSeconds;
      this.stats.totalPlayTime++;
      
      // 每10秒保存一次
      if (this.stats.totalPlayTime % 10 === 0) {
        this.saveLocalData();
      }
      
      this.emit('statsUpdate', this.stats);
    }, 1000);
  }
  
  /**
   * 停止统计计时器
   */
  stopStatsTimer() {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  }
  
  /**
   * 保存播放统计
   */
  savePlayStats() {
    if (this.currentTrack && this.stats.currentPlayTime > 0) {
      // 更新历史记录中的播放时长
      const historyItem = this.playHistory.find(item => item.id === this.currentTrack.id);
      if (historyItem) {
        historyItem.playTime = this.stats.currentPlayTime;
      }
      
      // 重置当前播放时长
      this.stats.currentPlayTime = 0;
      
      // 保存到本地
      this.saveLocalData();
      
      // 上报到服务器（可选）
      this.reportPlayStats(this.currentTrack, this.stats.currentPlayTime);
    }
  }
  
  /**
   * 上报播放统计到服务器
   * @param {Object} track - 曲目信息
   * @param {Number} playTime - 播放时长（秒）
   */
  async reportPlayStats(track, playTime) {
    try {
      await uniCloud.callFunction({
        name: 'fn-music',
        data: {
          action: 'report_stats',
          track_id: track.id,
          play_time: playTime
        }
      });
    } catch (error) {
      console.error('[MusicPlayer] 上报统计失败:', error);
    }
  }
  
  /**
   * 处理播放结束
   */
  handlePlayEnded() {
    this.savePlayStats();
    
    // 根据循环模式处理
    if (this.config.loopMode === 'single') {
      // 单曲循环（已由audioContext.loop处理）
      return;
    } else if (this.config.loopMode === 'list') {
      // 列表循环，播放下一首
      this.emit('playNext');
    } else {
      // 不循环，停止播放
      this.playbackState = 'stopped';
      this.emit('ended', this.currentTrack);
    }
  }
  
  /**
   * 获取播放状态
   * @returns {Object} 播放状态
   */
  getState() {
    return {
      playbackState: this.playbackState,
      currentTrack: this.currentTrack,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      config: this.config,
      stats: this.stats
    };
  }
  
  /**
   * 事件监听器
   */
  listeners = {};
  
  /**
   * 监听事件
   * @param {String} event - 事件名
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  
  /**
   * 取消监听事件
   * @param {String} event - 事件名
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
  
  /**
   * 触发事件
   * @param {String} event - 事件名
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[MusicPlayer] 事件回调错误:', error);
        }
      });
    }
  }
  
  /**
   * 销毁播放器
   */
  destroy() {
    // 停止播放
    this.stop();
    
    // 清除定时器
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
    }
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
    }
    
    // 销毁音频上下文
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
    
    // 清空缓存
    this.preloadCache.clear();
    
    // 清空监听器
    this.listeners = {};
    
    // 保存数据
    this.saveLocalData();
  }
}

// 单例模式
let musicPlayerInstance = null;

/**
 * 获取音乐播放器实例
 * @returns {MusicPlayer}
 */
export function getMusicPlayer() {
  if (!musicPlayerInstance) {
    musicPlayerInstance = new MusicPlayer();
  }
  return musicPlayerInstance;
}

/**
 * 销毁音乐播放器实例
 */
export function destroyMusicPlayer() {
  if (musicPlayerInstance) {
    musicPlayerInstance.destroy();
    musicPlayerInstance = null;
  }
}

export default {
  getMusicPlayer,
  destroyMusicPlayer
};

