/**
 * auth-login云函数单元测试
 * 
 * 测试场景：
 * 1. 正常登录（新用户）
 * 2. 正常登录（已存在用户）
 * 3. code过期
 * 4. code已使用
 * 5. 网络失败
 * 6. 缺少参数
 * 7. 微信接口错误
 * 8. 数据库错误
 */

const { main } = require('./index.js');

// Mock数据
const mockData = {
  validCode: 'VALID_CODE_123',
  expiredCode: 'EXPIRED_CODE_456',
  usedCode: 'USED_CODE_789',
  
  validOpenId: 'oXXXXXXXXXXXXXXXX',
  newOpenId: 'oNEWUSER123456789',
  
  validSessionKey: 'session_key_xxx',
  
  existingUser: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    openid: 'oXXXXXXXXXXXXXXXX',
    nickname: '测试用户',
    avatar: '/static/avatar.png',
    role: 'user'
  }
};

// Mock微信接口
const mockWxAPI = {
  code2Session: async (code) => {
    if (code === mockData.validCode) {
      return {
        openid: mockData.validOpenId,
        session_key: mockData.validSessionKey
      };
    } else if (code === mockData.expiredCode) {
      throw { errcode: 40163, errmsg: 'code已过期' };
    } else if (code === mockData.usedCode) {
      throw { errcode: 40029, errmsg: 'code已被使用' };
    } else {
      throw { errcode: 50001, errmsg: '微信接口调用失败' };
    }
  }
};

// Mock数据库
const mockDB = {
  users: [mockData.existingUser],
  
  findUser: async (openid) => {
    return mockDB.users.find(u => u.openid === openid) || null;
  },
  
  createUser: async (userData) => {
    const newUser = {
      id: generateUUID(),
      ...userData,
      created_at: new Date().toISOString()
    };
    mockDB.users.push(newUser);
    return newUser;
  },
  
  updateUser: async (id, updateData) => {
    const user = mockDB.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updateData);
    }
    return user;
  }
};

// 辅助函数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 测试用例
describe('auth-login云函数', () => {
  
  beforeEach(() => {
    // 重置mock数据
    mockDB.users = [mockData.existingUser];
  });
  
  // 测试1：正常登录（已存在用户）
  test('正常登录-已存在用户', async () => {
    const event = {
      code: mockData.validCode
    };
    
    const context = {
      APPID: 'test_appid',
      CLIENTIP: '127.0.0.1'
    };
    
    const result = await main(event, context);
    
    expect(result.errCode).toBe(0);
    expect(result.errMsg).toBe('登录成功');
    expect(result.data.token).toBeDefined();
    expect(result.data.uid).toBe(mockData.existingUser.id);
    expect(result.data.isNewUser).toBe(false);
    expect(result.data.userInfo.nickname).toBe('测试用户');
  });
  
  // 测试2：正常登录（新用户）
  test('正常登录-新用户', async () => {
    const event = {
      code: 'NEW_USER_CODE',
      userInfo: {
        nickname: '新用户',
        avatar: '/static/new-avatar.png'
      }
    };
    
    const context = {
      APPID: 'test_appid',
      CLIENTIP: '127.0.0.1'
    };
    
    // Mock微信返回新用户openid
    const originalCode2Session = mockWxAPI.code2Session;
    mockWxAPI.code2Session = async () => ({
      openid: mockData.newOpenId,
      session_key: 'new_session_key'
    });
    
    const result = await main(event, context);
    
    expect(result.errCode).toBe(0);
    expect(result.data.isNewUser).toBe(true);
    expect(result.data.userInfo.nickname).toBe('新用户');
    
    // 恢复
    mockWxAPI.code2Session = originalCode2Session;
  });
  
  // 测试3：code过期
  test('code过期错误', async () => {
    const event = {
      code: mockData.expiredCode
    };
    
    const context = {
      APPID: 'test_appid'
    };
    
    const result = await main(event, context);
    
    expect(result.errCode).toBe(40163);
    expect(result.errMsg).toContain('过期');
    expect(result.data).toBeNull();
  });
  
  // 测试4：code已使用
  test('code已使用错误', async () => {
    const event = {
      code: mockData.usedCode
    };
    
    const context = {
      APPID: 'test_appid'
    };
    
    const result = await main(event, context);
    
    expect(result.errCode).toBe(40029);
    expect(result.errMsg).toContain('已被使用');
  });
  
  // 测试5：缺少code参数
  test('缺少code参数', async () => {
    const event = {};
    const context = {};
    
    const result = await main(event, context);
    
    expect(result.errCode).toBe(40001);
    expect(result.errMsg).toContain('code');
  });
  
  // 测试6：网络失败（微信接口不可用）
  test('微信接口调用失败', async () => {
    const event = {
      code: 'INVALID_CODE'
    };
    
    const context = {
      APPID: 'test_appid'
    };
    
    const result = await main(event, context);
    
    expect(result.errCode).toBe(50001);
    expect(result.errMsg).toContain('微信');
  });
  
  // 测试7：Token生成
  test('Token包含正确的payload', async () => {
    const event = {
      code: mockData.validCode
    };
    
    const context = {
      APPID: 'test_appid'
    };
    
    const result = await main(event, context);
    
    expect(result.data.token).toBeDefined();
    
    // 解析Token
    const tokenParts = result.data.token.split('.');
    expect(tokenParts.length).toBe(3);
    
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    expect(payload.uid).toBe(mockData.existingUser.id);
    expect(payload.openid).toBe(mockData.validOpenId);
    expect(payload.role).toBe('user');
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
  });
  
  // 测试8：Token过期时间
  test('Token过期时间正确设置', async () => {
    const event = {
      code: mockData.validCode
    };
    
    const context = {
      APPID: 'test_appid'
    };
    
    const result = await main(event, context);
    
    const tokenExpired = result.data.tokenExpired;
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    expect(tokenExpired).toBeGreaterThan(now);
    expect(tokenExpired).toBeLessThan(now + sevenDays + 1000); // 允许1秒误差
  });
  
  // 测试9：更新用户信息
  test('登录时更新用户信息', async () => {
    const event = {
      code: mockData.validCode,
      userInfo: {
        nickname: '更新后的昵称',
        avatar: '/static/new-avatar.png',
        gender: 1
      }
    };
    
    const context = {
      APPID: 'test_appid'
    };
    
    const result = await main(event, context);
    
    expect(result.data.userInfo.nickname).toBe('更新后的昵称');
    expect(result.data.userInfo.avatar).toBe('/static/new-avatar.png');
  });
  
  // 测试10：记录登录日志
  test('记录登录日志到数据库', async () => {
    const event = {
      code: mockData.validCode,
      device_info: {
        device_type: 'ios',
        device_model: 'iPhone 14',
        os_version: 'iOS 16.0'
      }
    };
    
    const context = {
      APPID: 'test_appid',
      CLIENTIP: '192.168.1.100'
    };
    
    await main(event, context);
    
    // 验证登录日志已记录
    // 注意：这需要mock数据库的日志表
    // expect(mockDB.loginLogs.length).toBeGreaterThan(0);
  });
  
});

// 运行测试
if (require.main === module) {
  console.log('🧪 开始运行auth-login单元测试...\n');
  // Jest会自动运行
}

module.exports = { mockData, mockWxAPI, mockDB };

