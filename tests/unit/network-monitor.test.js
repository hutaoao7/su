/**
 * network-monitor.js 单元测试
 * 
 * 测试范围：
 * 1. 网络监测器初始化
 * 2. 网络状态检测
 * 3. 网络类型识别
 * 4. 网络质量评估
 * 5. 事件通知机制
 * 6. Ping测试
 * 
 * @author CraneHeart Team
 * @date 2025-10-21
 */

// 模拟uni-app环境
const mockUni = {
  getNetworkType: jest.fn(),
  onNetworkStatusChange: jest.fn(),
  request: jest.fn()
};

global.uni = mockUni;

describe('NetworkMonitor 单元测试', () => {
  let networkMonitor;
  
  beforeEach(async () => {
    // 重置模拟函数
    jest.clearAllMocks();
    
    // 动态导入networkMonitor
    const module = await import('../../utils/network-monitor.js');
    networkMonitor = module.default;
    
    // 重置网络监测器状态
    networkMonitor.isMonitoring = false;
    networkMonitor.listeners = [];
    networkMonitor.status = 'unknown';
  });
  
  afterEach(() => {
    // 停止监测
    networkMonitor.stop();
  });
  
  describe('初始化测试', () => {
    test('应该成功启动网络监测', () => {
      networkMonitor.start();
      
      expect(networkMonitor.isMonitoring).toBe(true);
    });
    
    test('重复启动应该不报错', () => {
      networkMonitor.start();
      networkMonitor.start();
      
      expect(networkMonitor.isMonitoring).toBe(true);
    });
    
    test('应该成功停止网络监测', () => {
      networkMonitor.start();
      networkMonitor.stop();
      
      expect(networkMonitor.isMonitoring).toBe(false);
    });
  });
  
  describe('网络状态检测测试', () => {
    test('应该检测在线状态', async () => {
      mockUni.getNetworkType.mockResolvedValue({
        networkType: 'wifi'
      });
      
      const result = await networkMonitor.checkNetwork();
      
      expect(result.status).toBe('online');
      expect(result.networkType).toBe('wifi');
      expect(mockUni.getNetworkType).toHaveBeenCalled();
    });
    
    test('应该检测离线状态', async () => {
      mockUni.getNetworkType.mockResolvedValue({
        networkType: 'none'
      });
      
      const result = await networkMonitor.checkNetwork();
      
      expect(result.status).toBe('offline');
      expect(result.quality).toBe('offline');
    });
    
    test('检测失败应该返回未知状态', async () => {
      mockUni.getNetworkType.mockRejectedValue(new Error('Network error'));
      
      const result = await networkMonitor.checkNetwork();
      
      expect(result.status).toBe('unknown');
    });
  });
  
  describe('网络类型识别测试', () => {
    test('应该识别WiFi', async () => {
      mockUni.getNetworkType.mockResolvedValue({
        networkType: 'wifi'
      });
      
      await networkMonitor.checkNetwork();
      
      expect(networkMonitor.networkType).toBe('wifi');
    });
    
    test('应该识别4G', async () => {
      mockUni.getNetworkType.mockResolvedValue({
        networkType: '4g'
      });
      
      await networkMonitor.checkNetwork();
      
      expect(networkMonitor.networkType).toBe('4g');
    });
    
    test('应该识别5G', async () => {
      mockUni.getNetworkType.mockResolvedValue({
        networkType: '5g'
      });
      
      await networkMonitor.checkNetwork();
      
      expect(networkMonitor.networkType).toBe('5g');
    });
    
    test('应该处理未知类型', async () => {
      mockUni.getNetworkType.mockResolvedValue({
        networkType: 'unknown'
      });
      
      await networkMonitor.checkNetwork();
      
      expect(networkMonitor.networkType).toBe('unknown');
    });
  });
  
  describe('网络质量评估测试', () => {
    beforeEach(() => {
      networkMonitor.status = 'online';
    });
    
    test('快速响应应该评为优秀', async () => {
      // 模拟快速响应（100ms）
      mockUni.request = jest.fn((options) => {
        setTimeout(() => options.success(), 100);
      });
      
      await networkMonitor.assessQuality();
      
      expect(networkMonitor.quality).toBe('excellent');
    });
    
    test('中等响应应该评为良好', async () => {
      // 模拟中等响应（300ms）
      mockUni.request = jest.fn((options) => {
        setTimeout(() => options.success(), 300);
      });
      
      await networkMonitor.assessQuality();
      
      expect(['good', 'fair']).toContain(networkMonitor.quality);
    });
    
    test('慢响应应该评为较差', async () => {
      // 模拟慢响应（1500ms）
      mockUni.request = jest.fn((options) => {
        setTimeout(() => options.success(), 1500);
      });
      
      await networkMonitor.assessQuality();
      
      expect(['poor', 'offline']).toContain(networkMonitor.quality);
    });
    
    test('多次失败应该评为离线', async () => {
      mockUni.request = jest.fn((options) => {
        options.fail();
      });
      
      // 模拟3次失败
      await networkMonitor.assessQuality();
      await networkMonitor.assessQuality();
      await networkMonitor.assessQuality();
      
      expect(networkMonitor.quality).toBe('offline');
      expect(networkMonitor.failedChecks).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('事件通知测试', () => {
    test('应该成功添加监听器', () => {
      const callback = jest.fn();
      
      const unsubscribe = networkMonitor.on('change', callback);
      
      expect(networkMonitor.listeners.length).toBe(1);
      expect(typeof unsubscribe).toBe('function');
    });
    
    test('应该触发change事件', () => {
      const callback = jest.fn();
      networkMonitor.on('change', callback);
      
      networkMonitor.notifyListeners('change', { test: 'data' });
      
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith({
        event: 'change',
        data: { test: 'data' },
        timestamp: expect.any(Number)
      });
    });
    
    test('应该支持多个监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      networkMonitor.on('change', callback1);
      networkMonitor.on('change', callback2);
      
      networkMonitor.notifyListeners('change', {});
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
    
    test('应该支持通配符监听器', () => {
      const callback = jest.fn();
      networkMonitor.on('*', callback);
      
      networkMonitor.notifyListeners('change', {});
      networkMonitor.notifyListeners('offline', {});
      
      expect(callback).toHaveBeenCalledTimes(2);
    });
    
    test('应该成功移除监听器', () => {
      const callback = jest.fn();
      const unsubscribe = networkMonitor.on('change', callback);
      
      unsubscribe();
      
      networkMonitor.notifyListeners('change', {});
      
      expect(callback).not.toHaveBeenCalled();
    });
    
    test('应该处理监听器执行错误', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      networkMonitor.on('change', errorCallback);
      
      // 不应该抛出错误
      expect(() => {
        networkMonitor.notifyListeners('change', {});
      }).not.toThrow();
      
      expect(errorCallback).toHaveBeenCalled();
    });
  });
  
  describe('状态查询测试', () => {
    test('getStatus应该返回完整状态', () => {
      networkMonitor.status = 'online';
      networkMonitor.networkType = 'wifi';
      networkMonitor.quality = 'excellent';
      networkMonitor.responseTime = 100;
      
      const status = networkMonitor.getStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('networkType');
      expect(status).toHaveProperty('quality');
      expect(status).toHaveProperty('responseTime');
      expect(status).toHaveProperty('isMonitoring');
      
      expect(status.status).toBe('online');
      expect(status.networkType).toBe('wifi');
      expect(status.quality).toBe('excellent');
    });
    
    test('isOnline应该正确判断在线状态', () => {
      networkMonitor.status = 'online';
      expect(networkMonitor.isOnline()).toBe(true);
      
      networkMonitor.status = 'offline';
      expect(networkMonitor.isOnline()).toBe(false);
    });
    
    test('isOffline应该正确判断离线状态', () => {
      networkMonitor.status = 'offline';
      expect(networkMonitor.isOffline()).toBe(true);
      
      networkMonitor.status = 'online';
      expect(networkMonitor.isOffline()).toBe(false);
    });
    
    test('isWeakNetwork应该正确判断弱网', () => {
      networkMonitor.quality = 'poor';
      expect(networkMonitor.isWeakNetwork()).toBe(true);
      
      networkMonitor.quality = 'fair';
      expect(networkMonitor.isWeakNetwork()).toBe(true);
      
      networkMonitor.quality = 'good';
      expect(networkMonitor.isWeakNetwork()).toBe(false);
      
      networkMonitor.quality = 'excellent';
      expect(networkMonitor.isWeakNetwork()).toBe(false);
    });
  });
  
  describe('网络恢复检测测试', () => {
    test('从离线恢复应该触发recovered事件', () => {
      const callback = jest.fn();
      networkMonitor.on('recovered', callback);
      
      networkMonitor.status = 'offline';
      
      // 模拟网络恢复
      networkMonitor.handleNetworkChange({
        isConnected: true,
        networkType: 'wifi'
      });
      
      expect(callback).toHaveBeenCalled();
      expect(networkMonitor.status).toBe('online');
    });
    
    test('进入离线应该触发offline事件', () => {
      const callback = jest.fn();
      networkMonitor.on('offline', callback);
      
      networkMonitor.status = 'online';
      
      // 模拟网络断开
      networkMonitor.handleNetworkChange({
        isConnected: false,
        networkType: 'none'
      });
      
      expect(callback).toHaveBeenCalled();
      expect(networkMonitor.status).toBe('offline');
    });
    
    test('网络类型变化应该触发type_changed事件', () => {
      const callback = jest.fn();
      networkMonitor.on('type_changed', callback);
      
      networkMonitor.status = 'online';
      networkMonitor.networkType = 'wifi';
      
      // 模拟网络类型变化
      networkMonitor.handleNetworkChange({
        isConnected: true,
        networkType: '4g'
      });
      
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            from: 'wifi',
            to: '4g'
          })
        })
      );
    });
  });
  
  describe('质量描述测试', () => {
    test('应该返回正确的质量描述', () => {
      const descriptions = {
        'excellent': '网络优秀',
        'good': '网络良好',
        'fair': '网络一般',
        'poor': '网络较差',
        'offline': '网络断开'
      };
      
      Object.entries(descriptions).forEach(([quality, expectedDesc]) => {
        networkMonitor.quality = quality;
        const desc = networkMonitor.getQualityDescription();
        expect(desc).toBe(expectedDesc);
      });
    });
    
    test('应该返回正确的使用建议', () => {
      networkMonitor.quality = 'excellent';
      let suggestion = networkMonitor.getSuggestion();
      expect(suggestion).toContain('良好');
      
      networkMonitor.quality = 'poor';
      suggestion = networkMonitor.getSuggestion();
      expect(suggestion).toContain('较差');
      
      networkMonitor.quality = 'offline';
      suggestion = networkMonitor.getSuggestion();
      expect(suggestion).toContain('断开');
    });
  });
  
  describe('边界条件测试', () => {
    test('未启动监测时也应该可以检查状态', async () => {
      mockUni.getNetworkType.mockResolvedValue({
        networkType: 'wifi'
      });
      
      const result = await networkMonitor.checkNetwork();
      
      expect(result.status).toBeTruthy();
    });
    
    test('应该处理无效的回调函数', () => {
      expect(() => {
        networkMonitor.on('change', null);
      }).not.toThrow();
      
      expect(() => {
        networkMonitor.on('change', 'not a function');
      }).not.toThrow();
    });
  });
  
  describe('性能测试', () => {
    test('多次检查网络不应该阻塞', async () => {
      mockUni.getNetworkType.mockResolvedValue({
        networkType: 'wifi'
      });
      
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(networkMonitor.checkNetwork());
      }
      
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result).toHaveProperty('status');
      });
    });
  });
});

// 运行测试套件
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testName: 'NetworkMonitor单元测试',
    totalTests: 30,
    description: '测试网络状态监测工具的所有核心功能'
  };
}

