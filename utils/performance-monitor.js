/**
 * 性能监控模块
 * 用于监控页面性能、API调用性能、资源加载等
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: [],
      apiCalls: [],
      componentRender: [],
      resourceLoad: []
    };
    
    this.thresholds = {
      pageLoad: 2000,      // 页面加载警告阈值（ms）
      apiCall: 1000,       // API调用警告阈值（ms）
      componentRender: 100, // 组件渲染警告阈值（ms）
      resourceLoad: 3000   // 资源加载警告阈值（ms）
    };
    
    this.isEnabled = true;
    this.debugMode = false;
    
    // 初始化时记录启动时间
    this.appStartTime = Date.now();
  }
  
  /**
   * 记录页面加载性能
   */
  recordPageLoad(pageName, duration) {
    if (!this.isEnabled) return;
    
    const metric = {
      page: pageName,
      duration: duration,
      timestamp: Date.now(),
      isWarning: duration > this.thresholds.pageLoad
    };
    
    this.metrics.pageLoad.push(metric);
    
    if (metric.isWarning) {
      console.warn(`[性能警告] 页面 ${pageName} 加载耗时 ${duration}ms，超过阈值 ${this.thresholds.pageLoad}ms`);
    }
    
    if (this.debugMode) {
      console.log(`[性能监控] 页面加载: ${pageName} - ${duration}ms`);
    }
    
    // 保持最近100条记录
    if (this.metrics.pageLoad.length > 100) {
      this.metrics.pageLoad.shift();
    }
    
    return metric;
  }
  
  /**
   * 记录API调用性能
   */
  recordApiCall(apiName, duration, status = 'success') {
    if (!this.isEnabled) return;
    
    const metric = {
      api: apiName,
      duration: duration,
      status: status,
      timestamp: Date.now(),
      isWarning: duration > this.thresholds.apiCall
    };
    
    this.metrics.apiCalls.push(metric);
    
    if (metric.isWarning) {
      console.warn(`[性能警告] API ${apiName} 调用耗时 ${duration}ms，超过阈值 ${this.thresholds.apiCall}ms`);
    }
    
    if (this.debugMode) {
      console.log(`[性能监控] API调用: ${apiName} - ${duration}ms (${status})`);
    }
    
    // 保持最近200条记录
    if (this.metrics.apiCalls.length > 200) {
      this.metrics.apiCalls.shift();
    }
    
    return metric;
  }
  
  /**
   * 记录组件渲染性能
   */
  recordComponentRender(componentName, duration) {
    if (!this.isEnabled) return;
    
    const metric = {
      component: componentName,
      duration: duration,
      timestamp: Date.now(),
      isWarning: duration > this.thresholds.componentRender
    };
    
    this.metrics.componentRender.push(metric);
    
    if (metric.isWarning && this.debugMode) {
      console.warn(`[性能警告] 组件 ${componentName} 渲染耗时 ${duration}ms`);
    }
    
    // 保持最近100条记录
    if (this.metrics.componentRender.length > 100) {
      this.metrics.componentRender.shift();
    }
    
    return metric;
  }
  
  /**
   * 记录资源加载性能
   */
  recordResourceLoad(resourceType, url, duration) {
    if (!this.isEnabled) return;
    
    const metric = {
      type: resourceType,
      url: url,
      duration: duration,
      timestamp: Date.now(),
      isWarning: duration > this.thresholds.resourceLoad
    };
    
    this.metrics.resourceLoad.push(metric);
    
    if (metric.isWarning) {
      console.warn(`[性能警告] ${resourceType} 资源加载耗时 ${duration}ms: ${url}`);
    }
    
    // 保持最近50条记录
    if (this.metrics.resourceLoad.length > 50) {
      this.metrics.resourceLoad.shift();
    }
    
    return metric;
  }
  
  /**
   * 开始计时
   */
  startTimer(label) {
    if (!this.isEnabled) return () => 0;
    
    const startTime = Date.now();
    
    return () => {
      return Date.now() - startTime;
    };
  }
  
  /**
   * 获取性能统计
   */
  getStatistics() {
    const stats = {};
    
    // 页面加载统计
    if (this.metrics.pageLoad.length > 0) {
      const durations = this.metrics.pageLoad.map(m => m.duration);
      stats.pageLoad = {
        count: durations.length,
        avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        min: Math.min(...durations),
        max: Math.max(...durations),
        warnings: this.metrics.pageLoad.filter(m => m.isWarning).length
      };
    }
    
    // API调用统计
    if (this.metrics.apiCalls.length > 0) {
      const durations = this.metrics.apiCalls.map(m => m.duration);
      const successCalls = this.metrics.apiCalls.filter(m => m.status === 'success');
      stats.apiCalls = {
        count: durations.length,
        avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        min: Math.min(...durations),
        max: Math.max(...durations),
        successRate: ((successCalls.length / this.metrics.apiCalls.length) * 100).toFixed(1),
        warnings: this.metrics.apiCalls.filter(m => m.isWarning).length
      };
    }
    
    // 组件渲染统计
    if (this.metrics.componentRender.length > 0) {
      const durations = this.metrics.componentRender.map(m => m.duration);
      stats.componentRender = {
        count: durations.length,
        avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        min: Math.min(...durations),
        max: Math.max(...durations),
        warnings: this.metrics.componentRender.filter(m => m.isWarning).length
      };
    }
    
    // 资源加载统计
    if (this.metrics.resourceLoad.length > 0) {
      const durations = this.metrics.resourceLoad.map(m => m.duration);
      stats.resourceLoad = {
        count: durations.length,
        avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        min: Math.min(...durations),
        max: Math.max(...durations),
        warnings: this.metrics.resourceLoad.filter(m => m.isWarning).length
      };
    }
    
    // 总体统计
    stats.overall = {
      uptime: Date.now() - this.appStartTime,
      totalWarnings: Object.values(stats).reduce((sum, stat) => 
        sum + (stat.warnings || 0), 0
      )
    };
    
    return stats;
  }
  
  /**
   * 获取最近的警告
   */
  getRecentWarnings(limit = 10) {
    const warnings = [];
    
    // 收集所有警告
    this.metrics.pageLoad
      .filter(m => m.isWarning)
      .forEach(m => warnings.push({
        type: 'pageLoad',
        message: `页面 ${m.page} 加载慢 (${m.duration}ms)`,
        timestamp: m.timestamp
      }));
    
    this.metrics.apiCalls
      .filter(m => m.isWarning)
      .forEach(m => warnings.push({
        type: 'apiCall',
        message: `API ${m.api} 响应慢 (${m.duration}ms)`,
        timestamp: m.timestamp
      }));
    
    this.metrics.componentRender
      .filter(m => m.isWarning)
      .forEach(m => warnings.push({
        type: 'componentRender',
        message: `组件 ${m.component} 渲染慢 (${m.duration}ms)`,
        timestamp: m.timestamp
      }));
    
    this.metrics.resourceLoad
      .filter(m => m.isWarning)
      .forEach(m => warnings.push({
        type: 'resourceLoad',
        message: `${m.type} 资源加载慢 (${m.duration}ms)`,
        timestamp: m.timestamp
      }));
    
    // 按时间排序并限制数量
    warnings.sort((a, b) => b.timestamp - a.timestamp);
    
    return warnings.slice(0, limit);
  }
  
  /**
   * 生成性能报告
   */
  generateReport() {
    const stats = this.getStatistics();
    const warnings = this.getRecentWarnings();
    
    const report = {
      generatedAt: new Date().toISOString(),
      uptime: Math.round(stats.overall?.uptime / 1000) + 's',
      statistics: stats,
      recentWarnings: warnings,
      thresholds: this.thresholds
    };
    
    return report;
  }
  
  /**
   * 清除所有指标
   */
  clear() {
    this.metrics = {
      pageLoad: [],
      apiCalls: [],
      componentRender: [],
      resourceLoad: []
    };
  }
  
  /**
   * 设置阈值
   */
  setThreshold(type, value) {
    if (this.thresholds.hasOwnProperty(type)) {
      this.thresholds[type] = value;
    }
  }
  
  /**
   * 启用/禁用监控
   */
  enable(enabled = true) {
    this.isEnabled = enabled;
  }
  
  /**
   * 设置调试模式
   */
  setDebugMode(enabled = false) {
    this.debugMode = enabled;
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor();

// 装饰器：自动记录函数性能
export function measurePerformance(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args) {
    const timer = performanceMonitor.startTimer(`${target.constructor.name}.${propertyKey}`);
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = timer();
      
      // 根据函数名判断类型
      if (propertyKey.includes('Page') || propertyKey.includes('onLoad')) {
        performanceMonitor.recordPageLoad(propertyKey, duration);
      } else if (propertyKey.includes('api') || propertyKey.includes('fetch')) {
        performanceMonitor.recordApiCall(propertyKey, duration);
      } else {
        performanceMonitor.recordComponentRender(propertyKey, duration);
      }
      
      return result;
    } catch (error) {
      const duration = timer();
      performanceMonitor.recordApiCall(propertyKey, duration, 'error');
      throw error;
    }
  };
  
  return descriptor;
}

// 导出
export default performanceMonitor;
export { PerformanceMonitor };

// CommonJS兼容
if (typeof module !== 'undefined' && module.exports) {
  module.exports = performanceMonitor;
  module.exports.PerformanceMonitor = PerformanceMonitor;
  module.exports.measurePerformance = measurePerformance;
}
