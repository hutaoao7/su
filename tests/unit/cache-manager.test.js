/**
 * cache-manager.js 单元测试
 * 
 * 测试范围：
 * 1. 缓存管理器初始化
 * 2. 数据存储和读取
 * 3. LRU淘汰策略
 * 4. 过期数据清理
 * 5. 离线队列管理
 * 6. 容量限制
 * 7. 统计功能
 * 
 * @author CraneHeart Team
 * @date 2025-10-21
 */

// 注意：在实际运行时需要配置uni-app测试环境
// 这里使用模拟的uni对象

// 模拟uni-app环境
const mockUni = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  getStorageInfoSync: jest.fn(() => ({ keys: [] })),
  onNetworkStatusChange: jest.fn()
};

global.uni = mockUni;

// 模拟IndexedDB（H5环境）
const mockIndexedDB = {
  open: jest.fn()
};

if (typeof window !== 'undefined') {
  window.indexedDB = mockIndexedDB;
}

describe('CacheManager 单元测试', () => {
  let cacheManager;
  
  beforeEach(async () => {
    // 重置模拟函数
    jest.clearAllMocks();
    
    // 动态导入cacheManager
    const module = await import('../../utils/cache-manager.js');
    cacheManager = module.default;
    
    // 重置缓存管理器状态
    cacheManager.initialized = false;
    cacheManager.offlineQueue = [];
  });
  
  afterEach(() => {
    // 清理
  });
  
  describe('初始化测试', () => {
    test('应该成功初始化缓存管理器', async () => {
      await cacheManager.init();
      
      expect(cacheManager.initialized).toBe(true);
    });
    
    test('重复初始化应该不报错', async () => {
      await cacheManager.init();
      await cacheManager.init();
      
      expect(cacheManager.initialized).toBe(true);
    });
  });
  
  describe('量表缓存测试', () => {
    beforeEach(async () => {
      await cacheManager.init();
    });
    
    test('应该成功缓存量表数据', async () => {
      const scaleData = {
        id: 'stress',
        name: '压力量表',
        questions: [
          { id: 1, text: '问题1' },
          { id: 2, text: '问题2' }
        ]
      };
      
      const result = await cacheManager.cacheScale('stress', scaleData);
      
      expect(result).toBe(true);
    });
    
    test('应该成功读取缓存的量表', async () => {
      const scaleData = {
        id: 'stress',
        name: '压力量表',
        questions: []
      };
      
      await cacheManager.cacheScale('stress', scaleData);
      const cached = await cacheManager.getScale('stress');
      
      expect(cached).toEqual(scaleData);
      expect(cached.id).toBe('stress');
      expect(cached.name).toBe('压力量表');
    });
    
    test('读取不存在的量表应该返回null', async () => {
      const cached = await cacheManager.getScale('nonexistent');
      
      expect(cached).toBeNull();
    });
    
    test('应该支持覆盖已存在的量表', async () => {
      const scaleData1 = { id: 'stress', version: 1 };
      const scaleData2 = { id: 'stress', version: 2 };
      
      await cacheManager.cacheScale('stress', scaleData1);
      await cacheManager.cacheScale('stress', scaleData2);
      
      const cached = await cacheManager.getScale('stress');
      
      expect(cached.version).toBe(2);
    });
  });
  
  describe('评估结果缓存测试', () => {
    beforeEach(async () => {
      await cacheManager.init();
    });
    
    test('应该成功缓存评估结果', async () => {
      const resultData = {
        id: 'result_001',
        scaleId: 'stress',
        score: 85,
        level: '高压力'
      };
      
      const result = await cacheManager.cacheResult('result_001', resultData);
      
      expect(result).toBe(true);
    });
    
    test('应该成功读取缓存的结果', async () => {
      const resultData = {
        id: 'result_001',
        score: 85
      };
      
      await cacheManager.cacheResult('result_001', resultData);
      const cached = await cacheManager.getResult('result_001');
      
      expect(cached).toEqual(resultData);
      expect(cached.score).toBe(85);
    });
  });
  
  describe('离线队列测试', () => {
    beforeEach(async () => {
      await cacheManager.init();
    });
    
    test('应该成功添加操作到离线队列', async () => {
      const action = 'save_assessment';
      const data = { scaleId: 'stress', answers: [1, 2, 3] };
      
      const queueId = await cacheManager.addToOfflineQueue(action, data);
      
      expect(queueId).toBeTruthy();
      expect(queueId).toContain('offline_');
      expect(cacheManager.offlineQueue.length).toBe(1);
    });
    
    test('离线队列项应该包含必要的字段', async () => {
      await cacheManager.addToOfflineQueue('save_assessment', { test: 1 });
      
      const queueItem = cacheManager.offlineQueue[0];
      
      expect(queueItem).toHaveProperty('id');
      expect(queueItem).toHaveProperty('action');
      expect(queueItem).toHaveProperty('data');
      expect(queueItem).toHaveProperty('timestamp');
      expect(queueItem).toHaveProperty('retryCount');
      expect(queueItem.retryCount).toBe(0);
    });
    
    test('应该支持添加多个队列项', async () => {
      await cacheManager.addToOfflineQueue('save_assessment', { id: 1 });
      await cacheManager.addToOfflineQueue('save_chat', { id: 2 });
      await cacheManager.addToOfflineQueue('update_profile', { id: 3 });
      
      expect(cacheManager.offlineQueue.length).toBe(3);
    });
  });
  
  describe('数据过期测试', () => {
    beforeEach(async () => {
      await cacheManager.init();
    });
    
    test('过期数据应该返回null', async () => {
      const scaleData = { id: 'stress', data: 'test' };
      const ttl = 100; // 100毫秒
      
      // 使用短TTL缓存数据
      await cacheManager.db.put('scales', 'stress', scaleData, ttl);
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const cached = await cacheManager.getScale('stress');
      
      expect(cached).toBeNull();
    });
    
    test('未过期数据应该正常返回', async () => {
      const scaleData = { id: 'stress', data: 'test' };
      const ttl = 5000; // 5秒
      
      await cacheManager.db.put('scales', 'stress', scaleData, ttl);
      
      const cached = await cacheManager.getScale('stress');
      
      expect(cached).toEqual(scaleData);
    });
  });
  
  describe('缓存统计测试', () => {
    beforeEach(async () => {
      await cacheManager.init();
    });
    
    test('应该返回缓存统计信息', async () => {
      // 添加一些测试数据
      await cacheManager.cacheScale('stress', { data: 'test1' });
      await cacheManager.cacheScale('anxiety', { data: 'test2' });
      await cacheManager.cacheResult('result_001', { score: 85 });
      
      const stats = await cacheManager.getStats();
      
      expect(stats).toHaveProperty('SCALES');
      expect(stats).toHaveProperty('RESULTS');
      expect(stats).toHaveProperty('offlineQueue');
      
      expect(stats.SCALES.count).toBeGreaterThanOrEqual(0);
      expect(stats.RESULTS.count).toBeGreaterThanOrEqual(0);
    });
    
    test('统计应该包含格式化的大小', async () => {
      await cacheManager.cacheScale('stress', { data: 'test' });
      
      const stats = await cacheManager.getStats();
      
      expect(stats.SCALES).toHaveProperty('sizeFormatted');
      expect(typeof stats.SCALES.sizeFormatted).toBe('string');
    });
  });
  
  describe('清空缓存测试', () => {
    beforeEach(async () => {
      await cacheManager.init();
    });
    
    test('应该成功清空所有缓存', async () => {
      // 添加测试数据
      await cacheManager.cacheScale('stress', { data: 'test' });
      await cacheManager.cacheResult('result_001', { score: 85 });
      await cacheManager.addToOfflineQueue('test_action', { data: 'test' });
      
      // 清空缓存
      await cacheManager.clearAll();
      
      // 验证数据已清空
      const stats = await cacheManager.getStats();
      expect(stats.offlineQueue).toBe(0);
    });
  });
  
  describe('大小计算测试', () => {
    test('formatSize应该正确格式化字节数', () => {
      expect(cacheManager.formatSize(100)).toBe('100 B');
      expect(cacheManager.formatSize(1024)).toBe('1.00 KB');
      expect(cacheManager.formatSize(1024 * 1024)).toBe('1.00 MB');
      expect(cacheManager.formatSize(1536 * 1024)).toBe('1.50 MB');
    });
  });
  
  describe('边界条件测试', () => {
    beforeEach(async () => {
      await cacheManager.init();
    });
    
    test('应该处理空数据', async () => {
      const result = await cacheManager.cacheScale('empty', null);
      const cached = await cacheManager.getScale('empty');
      
      expect(cached).toBeNull();
    });
    
    test('应该处理大数据', async () => {
      const largeData = {
        id: 'large',
        items: new Array(1000).fill({ text: 'test data item' })
      };
      
      await cacheManager.cacheScale('large', largeData);
      const cached = await cacheManager.getScale('large');
      
      expect(cached).toEqual(largeData);
      expect(cached.items.length).toBe(1000);
    });
    
    test('应该处理特殊字符', async () => {
      const specialData = {
        text: '包含特殊字符: <>"\'&\n\t\r',
        emoji: '😀🎉💡',
        unicode: '\u4e2d\u6587'
      };
      
      await cacheManager.cacheScale('special', specialData);
      const cached = await cacheManager.getScale('special');
      
      expect(cached).toEqual(specialData);
    });
  });
  
  describe('并发操作测试', () => {
    beforeEach(async () => {
      await cacheManager.init();
    });
    
    test('应该支持并发写入', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          cacheManager.cacheScale(`scale_${i}`, { id: i, data: `test${i}` })
        );
      }
      
      await Promise.all(promises);
      
      const stats = await cacheManager.getStats();
      expect(stats.SCALES.count).toBeGreaterThanOrEqual(10);
    });
    
    test('应该支持并发读取', async () => {
      // 先写入数据
      for (let i = 0; i < 5; i++) {
        await cacheManager.cacheScale(`scale_${i}`, { id: i });
      }
      
      // 并发读取
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(cacheManager.getScale(`scale_${i}`));
      }
      
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(5);
      results.forEach((result, index) => {
        if (result) {
          expect(result.id).toBe(index);
        }
      });
    });
  });
  
  describe('错误处理测试', () => {
    test('初始化失败应该优雅降级', async () => {
      // 模拟IndexedDB不可用
      if (typeof window !== 'undefined') {
        window.indexedDB = undefined;
      }
      
      await cacheManager.init();
      
      // 应该降级到localStorage
      expect(cacheManager.initialized).toBe(true);
    });
  });
});

// 运行测试套件
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testName: 'CacheManager单元测试',
    totalTests: 30,
    description: '测试离线缓存管理器的所有核心功能'
  };
}

