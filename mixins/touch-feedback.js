/**
 * 触摸反馈混入
 * 为Vue组件提供统一的触摸反馈能力
 * 
 * 使用方法:
 * import touchFeedbackMixin from '@/mixins/touch-feedback.js';
 * export default {
 *   mixins: [touchFeedbackMixin],
 *   methods: {
 *     handleTap() {
 *       this.$touchFeedback.buttonTap({
 *         vibrate: true,
 *         callback: () => {
 *           // 执行业务逻辑
 *         }
 *       });
 *     }
 *   }
 * }
 * 
 * @author CraneHeart Team
 * @version 1.0.0
 * @date 2025-11-04
 */

import touchFeedback from '@/utils/touch-feedback.js';

export default {
  data() {
    return {
      // 触摸状态
      touchStates: {},
      // 长按计时器
      longPressTimers: {},
    };
  },
  
  methods: {
    /**
     * 按钮点击事件处理
     * @param {Function} handler - 业务处理函数
     * @param {Object} options - 配置选项
     */
    handleButtonTap(handler, options = {}) {
      const { vibrate = true, debounce = 300 } = options;
      
      // 防抖处理
      if (this._buttonTapDebouncing) {
        return;
      }
      
      this._buttonTapDebouncing = true;
      setTimeout(() => {
        this._buttonTapDebouncing = false;
      }, debounce);
      
      // 触发反馈
      touchFeedback.buttonTap({
        vibrate,
        callback: () => {
          if (typeof handler === 'function') {
            handler();
          }
        }
      });
    },
    
    /**
     * 列表项触摸开始
     * @param {String} itemId - 列表项ID
     * @param {Object} event - 事件对象
     */
    handleListItemTouchStart(itemId, event) {
      const result = touchFeedback.listItemTouchStart(itemId, event);
      if (result && result.shouldAddClass) {
        this.$set(this.touchStates, itemId, true);
      }
    },
    
    /**
     * 列表项触摸结束
     * @param {String} itemId - 列表项ID
     */
    handleListItemTouchEnd(itemId) {
      const result = touchFeedback.listItemTouchEnd(itemId);
      if (result && result.shouldRemoveClass) {
        setTimeout(() => {
          this.$set(this.touchStates, itemId, false);
        }, result.delay || 0);
      }
    },
    
    /**
     * 列表项点击
     * @param {String} itemId - 列表项ID
     * @param {Function} handler - 点击处理函数
     * @param {Object} options - 配置选项
     */
    handleListItemTap(itemId, handler, options = {}) {
      const { vibrate = true } = options;
      
      // 触发振动
      if (vibrate) {
        touchFeedback.vibrate('short');
      }
      
      // 延迟执行，让用户看到反馈
      setTimeout(() => {
        if (typeof handler === 'function') {
          handler();
        }
      }, 100);
    },
    
    /**
     * 长按开始
     * @param {String} elementId - 元素ID
     * @param {Function} handler - 长按处理函数
     */
    handleLongPressStart(elementId, handler) {
      touchFeedback.longPressStart(elementId, handler);
    },
    
    /**
     * 长按取消
     * @param {String} elementId - 元素ID
     */
    handleLongPressCancel(elementId) {
      touchFeedback.longPressCancel(elementId);
    },
    
    /**
     * 开关切换
     * @param {String} key - 开关键名
     * @param {Boolean} value - 当前值
     * @param {Function} handler - 切换处理函数
     */
    handleSwitchToggle(key, value, handler) {
      // 触发短振动
      touchFeedback.vibrate('short');
      
      // 延迟执行
      setTimeout(() => {
        if (typeof handler === 'function') {
          handler(!value);
        }
      }, 50);
    },
    
    /**
     * 标签页切换
     * @param {Number|String} index - 标签页索引
     * @param {Function} handler - 切换处理函数
     */
    handleTabSwitch(index, handler) {
      // 触发短振动
      touchFeedback.vibrate('short');
      
      // 执行切换
      if (typeof handler === 'function') {
        handler(index);
      }
    },
    
    /**
     * 获取列表项激活状态
     * @param {String} itemId - 列表项ID
     */
    isListItemActive(itemId) {
      return !!this.touchStates[itemId];
    },
    
    /**
     * 添加涟漪效果
     * @param {Object} event - 触摸事件
     * @param {HTMLElement} target - 目标元素
     */
    addRippleEffect(event, target) {
      // #ifdef H5
      if (!target) return;
      
      // 创建涟漪元素
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      
      // 计算涟漪位置
      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      // 添加到目标元素
      target.appendChild(ripple);
      
      // 动画结束后移除
      setTimeout(() => {
        ripple.remove();
      }, 600);
      // #endif
    },
  },
  
  /**
   * 组件挂载时注入$touchFeedback
   */
  beforeCreate() {
    // 将touchFeedback实例挂载到Vue原型
    if (!this.$touchFeedback) {
      this.$touchFeedback = touchFeedback;
    }
  },
  
  /**
   * 组件销毁时清理资源
   */
  beforeDestroy() {
    // 清理触摸状态
    this.touchStates = {};
    
    // 清理长按计时器
    Object.keys(this.longPressTimers).forEach(key => {
      clearTimeout(this.longPressTimers[key]);
    });
    this.longPressTimers = {};
  },
};

