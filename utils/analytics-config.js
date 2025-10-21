/**
 * 埋点配置管理
 * 
 * 功能：
 * 1. 埋点事件配置
 * 2. 埋点规则管理
 * 3. 采样率控制
 * 4. 黑名单管理
 */

class AnalyticsConfig {
  constructor() {
    this.events = {};
    this.rules = {};
    this.samplingRate = 1.0; // 100%采样
    this.blacklist = new Set();
    this.whitelist = new Set();
  }

  /**
   * 初始化配置
   */
  init() {
    this.registerEvents();
    this.registerRules();
    console.log('✅ 埋点配置已初始化');
  }

  /**
   * 注册埋点事件
   */
  registerEvents() {
    // 页面事件
    this.events.page_view = {
      name: '页面浏览',
      category: 'page',
      required: ['page_name', 'page_path'],
      optional: ['referrer', 'title']
    };

    // 点击事件
    this.events.click = {
      name: '按钮点击',
      category: 'interaction',
      required: ['element_id', 'element_name'],
      optional: ['element_type', 'page_name']
    };

    // 评估事件
    this.events.assessment_start = {
      name: '评估开始',
      category: 'assessment',
      required: ['assessment_type'],
      optional: ['assessment_id']
    };

    this.events.assessment_complete = {
      name: '评估完成',
      category: 'assessment',
      required: ['assessment_type', 'score'],
      optional: ['assessment_id', 'duration']
    };

    // AI对话事件
    this.events.chat_start = {
      name: 'AI对话开始',
      category: 'chat',
      required: ['chat_type'],
      optional: ['chat_id']
    };

    this.events.chat_message = {
      name: 'AI对话消息',
      category: 'chat',
      required: ['message_type', 'message_length'],
      optional: ['chat_id', 'response_time']
    };

    this.events.chat_end = {
      name: 'AI对话结束',
      category: 'chat',
      required: ['chat_type'],
      optional: ['chat_id', 'duration', 'message_count']
    };

    // 用户事件
    this.events.user_login = {
      name: '用户登录',
      category: 'user',
      required: ['login_method'],
      optional: ['user_id']
    };

    this.events.user_logout = {
      name: '用户登出',
      category: 'user',
      required: [],
      optional: ['user_id']
    };

    // 社区事件
    this.events.community_post = {
      name: '社区发帖',
      category: 'community',
      required: ['post_type'],
      optional: ['post_id', 'content_length']
    };

    this.events.community_comment = {
      name: '社区评论',
      category: 'community',
      required: ['post_id'],
      optional: ['comment_id', 'content_length']
    };

    // 音乐事件
    this.events.music_play = {
      name: '音乐播放',
      category: 'music',
      required: ['music_id'],
      optional: ['music_name', 'duration']
    };

    this.events.music_favorite = {
      name: '音乐收藏',
      category: 'music',
      required: ['music_id'],
      optional: ['music_name']
    };

    // CDK事件
    this.events.cdk_redeem = {
      name: 'CDK兑换',
      category: 'cdk',
      required: ['cdk_code'],
      optional: ['reward_type', 'reward_value']
    };

    // 错误事件
    this.events.error = {
      name: '错误事件',
      category: 'error',
      required: ['error_type', 'error_message'],
      optional: ['error_stack', 'page_name']
    };

    // 性能事件
    this.events.performance = {
      name: '性能指标',
      category: 'performance',
      required: ['metric_name', 'metric_value'],
      optional: ['page_name', 'unit']
    };
  }

  /**
   * 注册埋点规则
   */
  registerRules() {
    // 采样规则
    this.rules.sampling = {
      enabled: true,
      rate: this.samplingRate,
      description: '采样率控制'
    };

    // 黑名单规则
    this.rules.blacklist = {
      enabled: true,
      description: '黑名单过滤'
    };

    // 白名单规则
    this.rules.whitelist = {
      enabled: false,
      description: '白名单过滤'
    };

    // 频率限制规则
    this.rules.rateLimit = {
      enabled: true,
      maxPerSecond: 100,
      description: '频率限制'
    };

    // 数据验证规则
    this.rules.validation = {
      enabled: true,
      description: '数据验证'
    };
  }

  /**
   * 获取事件配置
   */
  getEventConfig(eventName) {
    return this.events[eventName];
  }

  /**
   * 验证事件数据
   */
  validateEventData(eventName, data) {
    const config = this.getEventConfig(eventName);
    
    if (!config) {
      return { valid: false, error: `未知事件: ${eventName}` };
    }

    // 检查必需字段
    for (const field of config.required) {
      if (!data.hasOwnProperty(field)) {
        return { valid: false, error: `缺少必需字段: ${field}` };
      }
    }

    return { valid: true };
  }

  /**
   * 设置采样率
   */
  setSamplingRate(rate) {
    if (rate < 0 || rate > 1) {
      throw new Error('采样率必须在0-1之间');
    }
    this.samplingRate = rate;
    this.rules.sampling.rate = rate;
    console.log(`✅ 采样率已设置为${Math.round(rate * 100)}%`);
  }

  /**
   * 检查是否应该采样
   */
  shouldSample() {
    return Math.random() < this.samplingRate;
  }

  /**
   * 添加到黑名单
   */
  addToBlacklist(item) {
    this.blacklist.add(item);
    console.log(`✅ 已添加到黑名单: ${item}`);
  }

  /**
   * 从黑名单移除
   */
  removeFromBlacklist(item) {
    this.blacklist.delete(item);
    console.log(`✅ 已从黑名单移除: ${item}`);
  }

  /**
   * 检查是否在黑名单中
   */
  isBlacklisted(item) {
    return this.blacklist.has(item);
  }

  /**
   * 添加到白名单
   */
  addToWhitelist(item) {
    this.whitelist.add(item);
    console.log(`✅ 已添加到白名单: ${item}`);
  }

  /**
   * 检查是否在白名单中
   */
  isWhitelisted(item) {
    return this.whitelist.has(item);
  }

  /**
   * 获取所有事件
   */
  getAllEvents() {
    return Object.keys(this.events).map(key => ({
      name: key,
      ...this.events[key]
    }));
  }

  /**
   * 按类别获取事件
   */
  getEventsByCategory(category) {
    return Object.entries(this.events)
      .filter(([_, config]) => config.category === category)
      .map(([name, config]) => ({ name, ...config }));
  }

  /**
   * 获取配置统计
   */
  getStats() {
    return {
      totalEvents: Object.keys(this.events).length,
      categories: [...new Set(Object.values(this.events).map(e => e.category))],
      samplingRate: this.samplingRate,
      blacklistSize: this.blacklist.size,
      whitelistSize: this.whitelist.size
    };
  }

  /**
   * 导出配置
   */
  exportConfig() {
    return {
      events: this.events,
      rules: this.rules,
      samplingRate: this.samplingRate,
      blacklist: Array.from(this.blacklist),
      whitelist: Array.from(this.whitelist)
    };
  }

  /**
   * 导入配置
   */
  importConfig(config) {
    if (config.events) this.events = config.events;
    if (config.rules) this.rules = config.rules;
    if (config.samplingRate) this.samplingRate = config.samplingRate;
    if (config.blacklist) this.blacklist = new Set(config.blacklist);
    if (config.whitelist) this.whitelist = new Set(config.whitelist);
    console.log('✅ 配置已导入');
  }
}

// 导出单例
export default new AnalyticsConfig();

