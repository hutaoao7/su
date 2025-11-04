/**
 * 触摸反馈工具类
 * 提供全局统一的触摸反馈效果
 * 
 * 功能:
 * - 按钮点击反馈
 * - 列表项触摸高亮
 * - 长按效果
 * - 触觉反馈（振动）
 * 
 * @author CraneHeart Team
 * @version 1.0.0
 * @date 2025-11-04
 */

class TouchFeedback {
  constructor() {
    // 配置参数
    this.config = {
      // 振动反馈
      vibration: {
        enabled: true,           // 是否启用振动
        shortDuration: 15,       // 短振动时长（ms）
        longDuration: 50,        // 长振动时长（ms）
      },
      
      // 视觉反馈
      visual: {
        enabled: true,           // 是否启用视觉反馈
        activeClass: 'touch-active',  // 激活状态CSS类
        duration: 200,           // 反馈持续时间（ms）
      },
      
      // 长按配置
      longPress: {
        duration: 500,           // 长按触发时长（ms）
      },
      
      // 平台差异
      platform: this.detectPlatform(),
    };
    
    // 长按计时器存储
    this.longPressTimers = new Map();
    
    // 触摸状态存储
    this.touchStates = new Map();
  }
  
  /**
   * 检测平台
   */
  detectPlatform() {
    // #ifdef H5
    return 'h5';
    // #endif
    
    // #ifdef MP-WEIXIN
    return 'mp-weixin';
    // #endif
    
    // #ifdef APP-PLUS
    return 'app-plus';
    // #endif
    
    return 'unknown';
  }
  
  /**
   * 触发振动反馈
   * @param {String} type - 振动类型: 'short' | 'long'
   */
  vibrate(type = 'short') {
    if (!this.config.vibration.enabled) {
      return;
    }
    
    try {
      // #ifdef MP-WEIXIN || APP-PLUS
      if (type === 'short') {
        // 轻量级振动
        uni.vibrateShort({
          success: () => {
            console.log('[TouchFeedback] 短振动成功');
          },
          fail: (err) => {
            console.warn('[TouchFeedback] 短振动失败:', err);
          }
        });
      } else if (type === 'long') {
        // 长振动
        uni.vibrateLong({
          success: () => {
            console.log('[TouchFeedback] 长振动成功');
          },
          fail: (err) => {
            console.warn('[TouchFeedback] 长振动失败:', err);
          }
        });
      }
      // #endif
      
      // #ifdef H5
      // H5平台使用Vibration API
      if (navigator.vibrate) {
        const duration = type === 'short' ? this.config.vibration.shortDuration : this.config.vibration.longDuration;
        navigator.vibrate(duration);
      }
      // #endif
    } catch (error) {
      console.error('[TouchFeedback] 振动失败:', error);
    }
  }
  
  /**
   * 按钮点击反馈
   * @param {Object} options - 配置选项
   * @param {Boolean} options.vibrate - 是否振动
   * @param {Function} options.callback - 回调函数
   */
  buttonTap(options = {}) {
    const { vibrate = true, callback } = options;
    
    // 触发振动
    if (vibrate) {
      this.vibrate('short');
    }
    
    // 执行回调
    if (typeof callback === 'function') {
      // 延迟执行，让用户感知到反馈
      setTimeout(callback, 50);
    }
  }
  
  /**
   * 列表项触摸开始
   * @param {String} itemId - 列表项ID
   * @param {Object} event - 事件对象
   */
  listItemTouchStart(itemId, event) {
    if (!this.config.visual.enabled) {
      return;
    }
    
    // 记录触摸状态
    this.touchStates.set(itemId, {
      startTime: Date.now(),
      target: event?.target || event?.currentTarget,
    });
    
    // 添加激活样式（通过事件传递给组件）
    return {
      shouldAddClass: true,
      className: this.config.visual.activeClass,
    };
  }
  
  /**
   * 列表项触摸结束
   * @param {String} itemId - 列表项ID
   */
  listItemTouchEnd(itemId) {
    if (!this.config.visual.enabled) {
      return;
    }
    
    // 获取触摸状态
    const state = this.touchStates.get(itemId);
    if (!state) {
      return;
    }
    
    // 计算触摸时长
    const duration = Date.now() - state.startTime;
    
    // 如果触摸时长太短，延迟移除样式（确保用户能看到反馈）
    const delay = Math.max(0, this.config.visual.duration - duration);
    
    setTimeout(() => {
      this.touchStates.delete(itemId);
    }, delay);
    
    return {
      shouldRemoveClass: true,
      className: this.config.visual.activeClass,
      delay,
    };
  }
  
  /**
   * 长按开始
   * @param {String} elementId - 元素ID
   * @param {Function} callback - 长按触发的回调
   */
  longPressStart(elementId, callback) {
    // 清除已有的计时器
    this.longPressCancel(elementId);
    
    // 创建新计时器
    const timer = setTimeout(() => {
      // 触发长振动
      this.vibrate('long');
      
      // 执行回调
      if (typeof callback === 'function') {
        callback();
      }
      
      // 清除计时器引用
      this.longPressTimers.delete(elementId);
    }, this.config.longPress.duration);
    
    // 存储计时器
    this.longPressTimers.set(elementId, timer);
  }
  
  /**
   * 取消长按
   * @param {String} elementId - 元素ID
   */
  longPressCancel(elementId) {
    const timer = this.longPressTimers.get(elementId);
    if (timer) {
      clearTimeout(timer);
      this.longPressTimers.delete(elementId);
    }
  }
  
  /**
   * 设置振动开关
   * @param {Boolean} enabled - 是否启用
   */
  setVibrationEnabled(enabled) {
    this.config.vibration.enabled = enabled;
    console.log(`[TouchFeedback] 振动反馈已${enabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 设置视觉反馈开关
   * @param {Boolean} enabled - 是否启用
   */
  setVisualEnabled(enabled) {
    this.config.visual.enabled = enabled;
    console.log(`[TouchFeedback] 视觉反馈已${enabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 获取配置
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    console.log('[TouchFeedback] 配置已更新:', this.config);
  }
  
  /**
   * 清理资源
   */
  destroy() {
    // 清除所有长按计时器
    this.longPressTimers.forEach(timer => clearTimeout(timer));
    this.longPressTimers.clear();
    
    // 清除触摸状态
    this.touchStates.clear();
    
    console.log('[TouchFeedback] 资源已清理');
  }
}

// 导出单例
export default new TouchFeedback();

