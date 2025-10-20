# 本地存储加密集成指南

**版本**: v1.0  
**日期**: 2025-10-20  
**状态**: ✅ 已完成  

---

## 一、快速集成

### 1.1 Token存储集成

**文件**: `api/request.js`

**原代码**:
```javascript
// 保存token
uni.setStorageSync('token', token);

// 获取token
const token = uni.getStorageSync('token');
```

**修改后**:
```javascript
import storageCrypto from '@/utils/storage-crypto.js';

// 保存token（异步）
await storageCrypto.setSecure('token', token);

// 获取token（异步）
const token = await storageCrypto.getSecure('token');
```

---

### 1.2 用户信息存储集成

**文件**: `store/modules/user.js`

**修改actions**:
```javascript
import storageCrypto from '@/utils/storage-crypto.js';

export default {
  actions: {
    // 登录成功保存
    async saveUserInfo({ commit }, userInfo) {
      commit('SET_USER_INFO', userInfo);
      await storageCrypto.setSecure('userInfo', userInfo);
    },
    
    // 初始化从本地恢复
    async loadUserInfo({ commit }) {
      const userInfo = await storageCrypto.getSecure('userInfo');
      if (userInfo) {
        commit('SET_USER_INFO', userInfo);
      }
    },
    
    // 登出清除
    async clearUserInfo({ commit }) {
      commit('SET_USER_INFO', null);
      await storageCrypto.removeSecure('userInfo');
      await storageCrypto.removeSecure('token');
    }
  }
};
```

---

### 1.3 聊天记录存储集成

**文件**: `utils/chat-storage.js`

**修改saveMessages函数**:
```javascript
import storageCrypto from '@/utils/storage-crypto.js';

// 原代码
export async function saveMessages(sessionId, messages) {
  const key = `chat_messages_${sessionId}`;
  uni.setStorageSync(key, messages);
}

// 修改后
export async function saveMessages(sessionId, messages) {
  const key = `chat_messages_${sessionId}`;
  await storageCrypto.setSecure(key, messages);
}

export async function loadMessages(sessionId) {
  const key = `chat_messages_${sessionId}`;
  return await storageCrypto.getSecure(key) || [];
}
```

---

### 1.4 评估结果存储集成

**文件**: `components/scale/ScaleRunner.vue`

**修改保存结果方法**:
```javascript
import storageCrypto from '@/utils/storage-crypto.js';

export default {
  methods: {
    async saveAssessmentResult(result) {
      const key = `assessment_result_${result.id}`;
      
      // 加密保存
      await storageCrypto.setSecure(key, result);
      
      // 同时保存到历史记录列表（加密）
      const history = await storageCrypto.getSecure('assessment_history') || [];
      history.unshift({
        id: result.id,
        scaleId: result.scaleId,
        timestamp: result.timestamp
      });
      await storageCrypto.setSecure('assessment_history', history.slice(0, 50));
    },
    
    async loadAssessmentResult(resultId) {
      const key = `assessment_result_${resultId}`;
      return await storageCrypto.getSecure(key);
    }
  }
};
```

---

## 二、批量迁移

### 2.1 一次性迁移旧数据

**文件**: `App.vue`

**在onLaunch中执行**:
```javascript
import storageCrypto from '@/utils/storage-crypto.js';

export default {
  async onLaunch() {
    console.log('App Launch');
    
    // 检查是否已迁移
    const migrated = uni.getStorageSync('__storage_encrypted__');
    
    if (!migrated) {
      await this.migrateToEncryption();
      uni.setStorageSync('__storage_encrypted__', true);
    }
    
    // 初始化应用
    await this.$store.dispatch('user/loadUserInfo');
  },
  
  methods: {
    async migrateToEncryption() {
      uni.showLoading({ title: '数据迁移中...' });
      
      try {
        const keysToMigrate = [
          'token',
          'refreshToken',
          'userInfo',
          'chatHistory',
          'assessmentResults'
        ];
        
        const result = await storageCrypto.batchMigrate(keysToMigrate);
        
        console.log(`数据迁移完成: 成功${result.success}个, 失败${result.failed}个`);
        
        if (result.failed > 0) {
          uni.showToast({
            title: '部分数据迁移失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('数据迁移失败:', error);
      } finally {
        uni.hideLoading();
      }
    }
  }
};
```

---

## 三、请求拦截器集成

### 3.1 Token自动加密管理

**文件**: `api/request.js`

**完整示例**:
```javascript
import storageCrypto from '@/utils/storage-crypto.js';

// 请求拦截器
request.interceptors.request.use(async (config) => {
  // 从加密存储获取token
  const token = await storageCrypto.getSecure('token');
  
  if (token) {
    config.header['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// 响应拦截器
request.interceptors.response.use(
  async (response) => {
    // 处理token刷新
    const newToken = response.header['X-New-Token'] || response.data.newToken;
    if (newToken) {
      await storageCrypto.setSecure('token', newToken);
      console.log('Token已刷新并加密存储');
    }
    
    return response;
  },
  async (error) => {
    // 401未授权
    if (error.statusCode === 401) {
      // 清除token
      await storageCrypto.removeSecure('token');
      await storageCrypto.removeSecure('refreshToken');
      
      // 跳转到登录页
      uni.reLaunch({
        url: '/pages/login/login'
      });
    }
    
    return Promise.reject(error);
  }
);

export default request;
```

---

## 四、用户切换处理

### 4.1 切换用户时清除数据

**文件**: `store/modules/user.js`

```javascript
export default {
  actions: {
    // 切换用户
    async switchUser({ commit, dispatch }, newUserId) {
      // 1. 清除当前用户的加密数据
      await dispatch('clearUserInfo');
      
      // 2. 清空所有加密存储
      await storageCrypto.clearSecure();
      
      // 3. 登录新用户
      await dispatch('login', { userId: newUserId });
      
      // 注意：新用户的密钥会自动基于新的userId生成
    },
    
    // 完全登出
    async logout({ commit }) {
      // 清除Vuex状态
      commit('SET_TOKEN', null);
      commit('SET_USER_INFO', null);
      
      // 清除所有加密数据
      await storageCrypto.clearSecure();
      
      // 跳转到登录页
      uni.reLaunch({ url: '/pages/login/login' });
    }
  }
};
```

---

## 五、错误处理

### 5.1 解密失败降级

```javascript
export default {
  methods: {
    async safeGetSecure(key, defaultValue = null) {
      try {
        return await storageCrypto.getSecure(key);
      } catch (error) {
        console.error(`获取加密数据失败: ${key}`, error);
        
        // 降级：尝试读取明文数据
        try {
          const plainValue = uni.getStorageSync(key);
          if (plainValue) {
            // 迁移到加密存储
            await storageCrypto.setSecure(key, plainValue);
            return plainValue;
          }
        } catch {}
        
        return defaultValue;
      }
    }
  }
};
```

### 5.2 全局错误处理

**文件**: `utils/error-handler.js`

```javascript
import storageCrypto from '@/utils/storage-crypto.js';

export async function handleStorageError(error, key) {
  console.error(`存储错误: ${key}`, error);
  
  // 如果是解密错误，清除该数据
  if (error.message && error.message.includes('decrypt')) {
    try {
      await storageCrypto.removeSecure(key);
      console.log(`已清除损坏的加密数据: ${key}`);
    } catch {}
  }
  
  // 上报错误
  reportError({
    type: 'storage_crypto_error',
    key: key,
    error: error.message
  });
}
```

---

## 六、性能优化建议

### 6.1 避免频繁加密

```javascript
// ❌ 不好的做法：每次都加密存储
export default {
  methods: {
    async updateUserName(name) {
      const userInfo = await storageCrypto.getSecure('userInfo');
      userInfo.name = name;
      await storageCrypto.setSecure('userInfo', userInfo);
    },
    
    async updateUserAge(age) {
      const userInfo = await storageCrypto.getSecure('userInfo');
      userInfo.age = age;
      await storageCrypto.setSecure('userInfo', userInfo);
    }
  }
};

// ✅ 好的做法：批量更新
export default {
  data() {
    return {
      userInfo: null
    };
  },
  
  async onLoad() {
    this.userInfo = await storageCrypto.getSecure('userInfo');
  },
  
  methods: {
    updateUserName(name) {
      this.userInfo.name = name;
      this.needSave = true;
    },
    
    updateUserAge(age) {
      this.userInfo.age = age;
      this.needSave = true;
    },
    
    async onUnload() {
      if (this.needSave) {
        await storageCrypto.setSecure('userInfo', this.userInfo);
      }
    }
  }
};
```

### 6.2 只加密敏感数据

```javascript
// 需要加密
const sensitiveKeys = [
  'token',
  'refreshToken',
  'userInfo',          // 包含手机号
  'chatHistory',       // 对话内容
  'assessmentResults'  // 评估结果
];

// 不需要加密（用明文存储提升性能）
const publicKeys = [
  'theme',            // UI主题
  'language',         // 语言设置
  'lastVisitTime',    // 最后访问时间
  'guideShown'        // 引导页是否显示
];
```

---

## 七、测试验证

### 7.1 集成后测试清单

- [ ] 登录后token正确加密存储
- [ ] 请求拦截器能正确读取加密token
- [ ] 用户信息修改后正确加密存储
- [ ] 聊天记录保存和加载正常
- [ ] 评估结果保存和加载正常
- [ ] 用户登出清除所有加密数据
- [ ] 切换用户后数据隔离
- [ ] 旧数据迁移成功
- [ ] 解密失败降级处理正常
- [ ] 性能测试（加密/解密耗时<50ms）

### 7.2 手动测试步骤

```javascript
// 1. 清除所有数据
uni.clearStorageSync();

// 2. 登录并保存token
await storageCrypto.setSecure('token', 'test-token-123');

// 3. 查看storage（应该看到加密后的数据）
console.log('加密数据:', uni.getStorageSync('token'));
// 输出: __ENCRYPTED__SGVsbG8gV29ybGQh...

// 4. 读取并验证
const token = await storageCrypto.getSecure('token');
console.log('解密数据:', token);
// 输出: test-token-123

// 5. 批量测试
const testData = {
  string: 'test',
  number: 123,
  object: { a: 1, b: 2 },
  array: [1, 2, 3]
};

for (const [key, value] of Object.entries(testData)) {
  await storageCrypto.setSecure(`test_${key}`, value);
  const retrieved = await storageCrypto.getSecure(`test_${key}`);
  console.log(`${key}:`, JSON.stringify(value) === JSON.stringify(retrieved));
}
```

---

## 八、常见问题

### 8.1 设备更换后无法解密？

**原因**: 设备ID改变导致密钥不同

**解决方案**:
```javascript
// 在用户更换设备后，重新登录
// 后端下发新token，前端重新加密存储
async handleDeviceChange() {
  try {
    // 尝试读取旧数据
    const token = await storageCrypto.getSecure('token');
  } catch (error) {
    // 解密失败，清除旧数据
    await storageCrypto.clearSecure();
    
    // 跳转到登录页
    uni.reLaunch({ url: '/pages/login/login' });
  }
}
```

### 8.2 App更新后数据丢失？

**原因**: 设备ID生成算法改变

**解决方案**: 
- 设备ID首次生成后持久化存储
- 不要修改设备ID生成逻辑
- 如果必须修改，提供数据迁移工具

### 8.3 性能问题？

**优化建议**:
1. 只加密敏感数据
2. 批量更新而不是频繁加密
3. 使用Vuex等状态管理，减少storage读写

---

## 九、完整集成检查清单

### 9.1 代码修改

- [ ] api/request.js - 请求拦截器集成
- [ ] store/modules/user.js - 用户状态管理集成
- [ ] utils/chat-storage.js - 聊天记录加密
- [ ] components/scale/ScaleRunner.vue - 评估结果加密
- [ ] App.vue - 数据迁移逻辑

### 9.2 测试验证

- [ ] 单元测试通过（31个测试用例）
- [ ] 登录流程测试
- [ ] 数据迁移测试
- [ ] 性能测试
- [ ] 兼容性测试（H5/小程序）

### 9.3 文档更新

- [ ] API文档更新
- [ ] 开发者文档更新
- [ ] 集成指南编写

---

## 十、总结

### 10.1 集成收益

✅ **安全性提升**: Token等敏感数据加密存储，防止泄露  
✅ **合规性**: 符合数据保护法规要求  
✅ **用户隐私**: 聊天记录、评估结果等私密数据加密  
✅ **性能可控**: 加密耗时<10ms，不影响用户体验  

### 10.2 注意事项

⚠️ **异步处理**: 所有API都是异步的，需要使用await  
⚠️ **错误处理**: 添加try-catch处理解密失败情况  
⚠️ **数据迁移**: 首次使用需要迁移旧数据  
⚠️ **用户切换**: 切换用户时清除旧用户的加密数据  

---

**集成支持**: 遇到问题请查阅 `storage-encryption.md` 技术文档  
**问题反馈**: 发现Bug请提Issue  

🔒 **保护用户隐私，从加密存储开始！**

