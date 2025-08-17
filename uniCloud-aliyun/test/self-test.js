/**
 * 自验脚本 - 用于验证后端API功能
 * 可在Node.js环境或浏览器控制台中运行
 */

// 配置基础URL（部署后替换为实际URL）
const BASE_URL = 'https://your-cloud-function-url.com';

// 测试用户数据
const testUser = {
  account: 'testuser' + Date.now(),
  password: 'test1234',
  role: 'teen',
  nickname: '自动测试用户'
};

let authToken = '';

/**
 * HTTP请求封装
 */
async function request(url, options = {}) {
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    return {
      status: response.status,
      data: data,
      success: response.ok
    };
  } catch (error) {
    console.error('请求失败:', error);
    return {
      status: 0,
      data: { message: error.message },
      success: false
    };
  }
}

/**
 * 测试注册功能
 */
async function testRegister() {
  console.log('\n🧪 测试注册功能...');
  
  const result = await request(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: testUser
  });
  
  if (result.success && result.data.token && result.data.user) {
    console.log('✅ 注册成功');
    console.log('   Token:', result.data.token.substring(0, 20) + '...');
    console.log('   用户ID:', result.data.user.id);
    console.log('   昵称:', result.data.user.nickname);
    console.log('   角色:', result.data.user.role);
    
    authToken = result.data.token;
    return true;
  } else {
    console.log('❌ 注册失败');
    console.log('   状态码:', result.status);
    console.log('   错误信息:', result.data.message);
    return false;
  }
}

/**
 * 测试重复注册
 */
async function testDuplicateRegister() {
  console.log('\n🧪 测试重复注册...');
  
  const result = await request(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: testUser
  });
  
  if (result.status === 409) {
    console.log('✅ 重复注册正确拒绝');
    console.log('   错误信息:', result.data.message);
    return true;
  } else {
    console.log('❌ 重复注册处理异常');
    console.log('   状态码:', result.status);
    console.log('   响应:', result.data);
    return false;
  }
}

/**
 * 测试登录功能
 */
async function testLogin() {
  console.log('\n🧪 测试登录功能...');
  
  const result = await request(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: {
      account: testUser.account,
      password: testUser.password
    }
  });
  
  if (result.success && result.data.token && result.data.user) {
    console.log('✅ 登录成功');
    console.log('   Token:', result.data.token.substring(0, 20) + '...');
    console.log('   用户信息:', result.data.user);
    
    authToken = result.data.token;
    return true;
  } else {
    console.log('❌ 登录失败');
    console.log('   状态码:', result.status);
    console.log('   错误信息:', result.data.message);
    return false;
  }
}

/**
 * 测试错误密码登录
 */
async function testWrongPassword() {
  console.log('\n🧪 测试错误密码登录...');
  
  const result = await request(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: {
      account: testUser.account,
      password: 'wrongpassword'
    }
  });
  
  if (result.status === 401) {
    console.log('✅ 错误密码正确拒绝');
    console.log('   错误信息:', result.data.message);
    return true;
  } else {
    console.log('❌ 错误密码处理异常');
    console.log('   状态码:', result.status);
    console.log('   响应:', result.data);
    return false;
  }
}

/**
 * 测试获取用户信息
 */
async function testGetUserInfo() {
  console.log('\n🧪 测试获取用户信息...');
  
  const result = await request(`${BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (result.success && result.data.user) {
    console.log('✅ 获取用户信息成功');
    console.log('   用户信息:', result.data.user);
    return true;
  } else {
    console.log('❌ 获取用户信息失败');
    console.log('   状态码:', result.status);
    console.log('   错误信息:', result.data.message);
    return false;
  }
}

/**
 * 测试未授权访问
 */
async function testUnauthorizedAccess() {
  console.log('\n🧪 测试未授权访问...');
  
  const result = await request(`${BASE_URL}/api/auth/me`);
  
  if (result.status === 401) {
    console.log('✅ 未授权访问正确拒绝');
    console.log('   错误信息:', result.data.message);
    return true;
  } else {
    console.log('❌ 未授权访问处理异常');
    console.log('   状态码:', result.status);
    console.log('   响应:', result.data);
    return false;
  }
}

/**
 * 测试无效Token访问
 */
async function testInvalidToken() {
  console.log('\n🧪 测试无效Token访问...');
  
  const result = await request(`${BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': 'Bearer invalid-token-12345'
    }
  });
  
  if (result.status === 401) {
    console.log('✅ 无效Token正确拒绝');
    console.log('   错误信息:', result.data.message);
    return true;
  } else {
    console.log('❌ 无效Token处理异常');
    console.log('   状态码:', result.status);
    console.log('   响应:', result.data);
    return false;
  }
}

/**
 * 测试Token刷新
 */
async function testRefreshToken() {
  console.log('\n🧪 测试Token刷新...');
  
  const result = await request(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (result.success && result.data.token) {
    console.log('✅ Token刷新成功');
    console.log('   新Token:', result.data.token.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ Token刷新失败');
    console.log('   状态码:', result.status);
    console.log('   错误信息:', result.data.message);
    return false;
  }
}

/**
 * 测试参数验证
 */
async function testValidation() {
  console.log('\n🧪 测试参数验证...');
  
  const invalidData = {
    account: 'test', // 太短
    password: '123', // 太短且不符合规则
    role: 'invalid'  // 无效角色
  };
  
  const result = await request(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: invalidData
  });
  
  if (result.status === 400) {
    console.log('✅ 参数验证正确工作');
    console.log('   错误信息:', result.data.message);
    return true;
  } else {
    console.log('❌ 参数验证异常');
    console.log('   状态码:', result.status);
    console.log('   响应:', result.data);
    return false;
  }
}

/**
 * 测试速率限制
 */
async function testRateLimit() {
  console.log('\n🧪 测试速率限制...');
  
  const promises = [];
  const testAccount = 'ratetest' + Date.now();
  
  // 快速发送多个请求
  for (let i = 0; i < 15; i++) {
    promises.push(
      request(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: {
          account: testAccount + i,
          password: 'test1234',
          role: 'teen'
        }
      })
    );
  }
  
  const results = await Promise.all(promises);
  const rateLimited = results.some(r => r.status === 429);
  
  if (rateLimited) {
    console.log('✅ 速率限制正确工作');
    console.log('   部分请求被限制');
    return true;
  } else {
    console.log('⚠️  速率限制可能未生效');
    console.log('   所有请求都通过了');
    return false;
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log('🚀 开始运行后端API自验测试...');
  console.log('📍 测试地址:', BASE_URL);
  console.log('👤 测试用户:', testUser.account);
  
  const tests = [
    { name: '注册功能', fn: testRegister },
    { name: '重复注册', fn: testDuplicateRegister },
    { name: '登录功能', fn: testLogin },
    { name: '错误密码', fn: testWrongPassword },
    { name: '获取用户信息', fn: testGetUserInfo },
    { name: '未授权访问', fn: testUnauthorizedAccess },
    { name: '无效Token', fn: testInvalidToken },
    { name: 'Token刷新', fn: testRefreshToken },
    { name: '参数验证', fn: testValidation },
    { name: '速率限制', fn: testRateLimit }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} 测试异常:`, error.message);
      failed++;
    }
    
    // 测试间隔，避免速率限制
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！后端API工作正常。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查后端配置。');
  }
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
  
  // 如果直接运行此文件
  if (require.main === module) {
    runAllTests().catch(console.error);
  }
}

// 如果在浏览器环境中，可以直接调用
if (typeof window !== 'undefined') {
  window.runAuthTests = runAllTests;
  console.log('💡 在浏览器控制台中运行 runAuthTests() 开始测试');
}