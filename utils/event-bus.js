// 全局事件总线
class EventBus {
  constructor() {
    this.events = {};
  }

  // 注册事件监听
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    console.log(`[EVENT_BUS] 注册事件监听: ${eventName}`);
  }

  // 移除事件监听
  off(eventName, callback) {
    if (!this.events[eventName]) return;
    
    if (callback) {
      // 移除特定回调
      const index = this.events[eventName].indexOf(callback);
      if (index > -1) {
        this.events[eventName].splice(index, 1);
      }
    } else {
      // 移除所有回调
      this.events[eventName] = [];
    }
    console.log(`[EVENT_BUS] 移除事件监听: ${eventName}`);
  }

  // 触发事件
  emit(eventName, data) {
    console.log(`[EVENT_BUS] 触发事件: ${eventName}`, data);
    
    if (!this.events[eventName]) return;
    
    this.events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EVENT_BUS] 事件回调执行失败: ${eventName}`, error);
      }
    });
  }

  // 一次性事件监听
  once(eventName, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(eventName, onceCallback);
    };
    this.on(eventName, onceCallback);
  }
}

// 事件名称常量
export const EVENTS = {
  AUTH_CHANGED: 'AUTH_CHANGED',
  USER_LOGOUT: 'USER_LOGOUT'
};

// 创建全局实例
const eventBus = new EventBus();

export default eventBus;