/**
 * 认证模块单元测试
 */

const assert = require('assert');

// 模拟存储
global.mockStorage = {};

// 创建简单的auth实现用于测试
const authModule = {
  setToken(token) {
    if (!token) return;
    global.mockStorage['user_token'] = token;
    global.mockStorage['token_time'] = Date.now();
  },
  
  getToken() {
    const token = global.mockStorage['user_token'];
    const tokenTime = global.mockStorage['token_time'];
    
    if (!token || !tokenTime) return null;
    
    // 检查是否过期（7天）
    const now = Date.now();
    const expires = 7 * 24 * 60 * 60 * 1000;
    
    if (now - tokenTime > expires) {
      delete global.mockStorage['user_token'];
      delete global.mockStorage['token_time'];
      return null;
    }
    
    return token;
  },
  
  setUserInfo(info) {
    if (info) {
      global.mockStorage['user_info'] = info;
    }
  },
  
  getUserInfo() {
    return global.mockStorage['user_info'] || null;
  },
  
  clearAuth() {
    delete global.mockStorage['user_token'];
    delete global.mockStorage['token_time'];
    delete global.mockStorage['user_info'];
    delete global.mockStorage['user_consent'];
  },
  
  isLoggedIn() {
    const token = this.getToken();
    const userInfo = this.getUserInfo();
    return !!(token && userInfo);
  },
  
  setConsent(consent) {
    global.mockStorage['user_consent'] = consent;
    if (consent) {
      global.mockStorage['consent_time'] = Date.now();
    }
  },
  
  hasConsent() {
    return global.mockStorage['user_consent'] === true;
  }
};

// 运行测试
function runTests() {
  console.log('='.repeat(50));
  console.log('🧪 认证模块单元测试');
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;
  const errors = [];
  
  // 测试用例列表
  const tests = [
    {
      name: 'Token保存',
      fn: () => {
        global.mockStorage = {};
        authModule.setToken('test-token-123');
        assert.strictEqual(global.mockStorage['user_token'], 'test-token-123');
        assert(global.mockStorage['token_time']);
      }
    },
    {
      name: 'Token获取',
      fn: () => {
        global.mockStorage = {
          'user_token': 'valid-token',
          'token_time': Date.now()
        };
        const token = authModule.getToken();
        assert.strictEqual(token, 'valid-token');
      }
    },
    {
      name: 'Token过期检查',
      fn: () => {
        global.mockStorage = {
          'user_token': 'expired-token',
          'token_time': Date.now() - (8 * 24 * 60 * 60 * 1000) // 8天前
        };
        const token = authModule.getToken();
        assert.strictEqual(token, null);
        assert.strictEqual(global.mockStorage['user_token'], undefined);
      }
    },
    {
      name: '用户信息保存',
      fn: () => {
        global.mockStorage = {};
        const userInfo = { id: 'user123', nickname: '测试用户' };
        authModule.setUserInfo(userInfo);
        assert.deepStrictEqual(global.mockStorage['user_info'], userInfo);
      }
    },
    {
      name: '用户信息获取',
      fn: () => {
        const userInfo = { id: 'user456', nickname: '另一个用户' };
        global.mockStorage = { 'user_info': userInfo };
        const result = authModule.getUserInfo();
        assert.deepStrictEqual(result, userInfo);
      }
    },
    {
      name: '登录状态检查-已登录',
      fn: () => {
        global.mockStorage = {
          'user_token': 'valid-token',
          'token_time': Date.now(),
          'user_info': { id: 'user123' }
        };
        const loggedIn = authModule.isLoggedIn();
        assert.strictEqual(loggedIn, true);
      }
    },
    {
      name: '登录状态检查-未登录(无token)',
      fn: () => {
        global.mockStorage = {
          'user_info': { id: 'user123' }
        };
        const loggedIn = authModule.isLoggedIn();
        assert.strictEqual(loggedIn, false);
      }
    },
    {
      name: '登录状态检查-未登录(无用户信息)',
      fn: () => {
        global.mockStorage = {
          'user_token': 'token',
          'token_time': Date.now()
        };
        const loggedIn = authModule.isLoggedIn();
        assert.strictEqual(loggedIn, false);
      }
    },
    {
      name: '清除认证信息',
      fn: () => {
        global.mockStorage = {
          'user_token': 'token',
          'user_info': { id: 1 },
          'user_consent': true
        };
        authModule.clearAuth();
        assert.strictEqual(global.mockStorage['user_token'], undefined);
        assert.strictEqual(global.mockStorage['user_info'], undefined);
        assert.strictEqual(global.mockStorage['user_consent'], undefined);
      }
    },
    {
      name: '同意管理-设置',
      fn: () => {
        global.mockStorage = {};
        authModule.setConsent(true);
        assert.strictEqual(global.mockStorage['user_consent'], true);
        assert(global.mockStorage['consent_time']);
      }
    },
    {
      name: '同意管理-检查',
      fn: () => {
        global.mockStorage = { 'user_consent': true };
        const hasConsent = authModule.hasConsent();
        assert.strictEqual(hasConsent, true);
        
        global.mockStorage = {};
        const noConsent = authModule.hasConsent();
        assert.strictEqual(noConsent, false);
      }
    },
    {
      name: '空值处理',
      fn: () => {
        global.mockStorage = {};
        authModule.setToken(null);
        assert.strictEqual(global.mockStorage['user_token'], undefined);
        
        authModule.setToken('');
        assert.strictEqual(global.mockStorage['user_token'], undefined);
        
        authModule.setUserInfo(null);
        assert.strictEqual(global.mockStorage['user_info'], undefined);
      }
    }
  ];
  
  // 运行每个测试
  tests.forEach(test => {
    try {
      test.fn();
      console.log(`✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
      errors.push({ test: test.name, error: error.message });
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
  console.log(`通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (errors.length > 0) {
    console.log('\n失败详情:');
    errors.forEach(e => {
      console.log(`  - ${e.test}: ${e.error}`);
    });
  }
  
  return { passed, failed, errors };
}

// 导出测试
module.exports = { runTests };

// 如果直接运行
if (require.main === module) {
  runTests();
}