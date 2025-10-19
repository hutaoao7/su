# 翎心CraneHeart 开发者指南

## 🎯 快速开始

### 环境要求
- Node.js >= 16.0.0 LTS
- HBuilderX >= 3.0
- 微信开发者工具
- PostgreSQL（Supabase账号）

### 克隆项目
```bash
git clone <repository-url>
cd 翎心
```

### 安装依赖
```bash
npm install
```

### 配置环境变量
```bash
# 创建.env文件（参考.env.example）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

---

## 📁 项目结构

```
翎心/
├── api/                    # API接口层
├── components/             # 组件目录
│   ├── common/            # 通用组件
│   ├── scale/             # 量表组件
│   └── custom-tabbar/     # 自定义TabBar
├── pages/                  # 主包页面
├── pages-sub/              # 分包页面
│   ├── assess/            # 评估模块
│   ├── intervene/         # 干预模块
│   ├── consent/           # 同意管理
│   └── other/             # 其他页面
├── store/                  # Vuex状态管理
│   ├── index.js
│   └── modules/
├── utils/                  # 工具函数
├── uniCloud-aliyun/        # 云函数
│   └── cloudfunctions/
├── tools/                  # 开发工具
├── tests/                  # 测试文件
├── docs/                   # 项目文档
└── static/                 # 静态资源
```

---

## 🗄️ 数据库架构

### 数据库选择
**⚠️ 重要**: 项目**只使用Supabase PostgreSQL**

### 数据库迁移
```bash
# 1. 连接Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# 2. 执行迁移脚本（按顺序）
\i docs/database/migrations/001_create_users_tables.sql
\i docs/database/migrations/002_create_assessments_tables.sql
# ... 继续执行其他6个脚本

# 3. 验证
npm run check:db-schema
```

### 表设计文档
- [用户相关表](./database/schema-users.md) - 5个表
- [评估相关表](./database/schema-assessments.md) - 4个表
- [AI对话相关表](./database/schema-chat.md) - 4个表
- [CDK和音乐表](./database/schema-cdk-music.md) - 8个表

---

## 🔌 云函数开发

### 云函数规范

**必须遵守**：
1. ✅ 使用CommonJS（require/module.exports）
2. ✅ 使用Supabase PostgreSQL连接数据库
3. ✅ 统一响应格式：`{ errCode, errMsg, data }`
4. ✅ 添加详细的日志输出
5. ✅ 实现Token验证

### Supabase连接示例

```javascript
'use strict';

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[YOUR-FUNCTION]';

// 创建Supabase客户端
function getSupabaseClient() {
  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
}

// Token验证
function verifyToken(context) {
  const token = context.UNI_ID_TOKEN || context.TOKEN;
  
  if (!token) {
    return { success: false, uid: null, message: '未登录' };
  }
  
  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const uid = payload.sub || payload.uid;
    
    if (!uid) {
      return { success: false, uid: null, message: 'Token无效' };
    }
    
    // 检查过期
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { success: false, uid: null, message: 'Token已过期' };
    }
    
    return { success: true, uid: uid, message: 'ok' };
  } catch (error) {
    console.error(TAG, 'Token解析失败:', error);
    return { success: false, uid: null, message: 'Token解析失败' };
  }
}

exports.main = async (event, context) => {
  try {
    console.log(TAG, '请求开始');
    
    // 1. Token验证
    const authResult = verifyToken(context);
    if (!authResult.success) {
      return {
        errCode: 401,
        errMsg: authResult.message,
        data: null
      };
    }
    
    const userId = authResult.uid;
    
    // 2. 参数校验
    const { param1, param2 } = event;
    
    // 3. 业务逻辑
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error(TAG, '数据库查询失败:', error);
      return {
        errCode: 500,
        errMsg: '查询失败',
        data: null
      };
    }
    
    // 4. 返回结果
    return {
      errCode: 0,
      errMsg: '成功',
      data: data
    };
    
  } catch (error) {
    console.error(TAG, '异常:', error);
    return {
      errCode: 500,
      errMsg: '服务器错误',
      data: null
    };
  }
};
```

### 参考示例
查看这些云函数的完整实现：
- `user-update-profile/` - 更新资料
- `assessment-create/` - 创建评估
- `chat-history/` - 聊天历史
- `consent-record/` - 同意记录

---

## 🎨 前端开发

### 页面开发规范

**safe-area-inset适配**（必须）：
```vue
<style scoped>
.page {
  min-height: 100vh;
  /* 顶部安全区域 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  /* 底部安全区域 */
  padding-bottom: calc(50px + constant(safe-area-inset-bottom));
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
}
</style>
```

**响应式布局**：
```css
/* 小屏幕 */
@media screen and (max-width: 375px) {
  .container {
    padding: 16rpx;
  }
}

/* 大屏幕 */
@media screen and (min-width: 768px) {
  .container {
    max-width: 750rpx;
    margin: 0 auto;
  }
}
```

### 使用Vuex
```javascript
// 在页面中使用
import { mapState, mapActions } from 'vuex';

export default {
  computed: {
    ...mapState('user', ['userInfo']),
    ...mapState('auth', ['isAuthenticated'])
  },
  
  methods: {
    ...mapActions('user', ['loadUserInfo']),
    
    async loadData() {
      await this.loadUserInfo();
    }
  }
};
```

### 使用工具函数
```javascript
// 日志
import logger from '@/utils/logger.js';
logger.info('TAG', '日志消息', { data: 'value' });

// 错误追踪
import { captureError } from '@/utils/error-tracker.js';
captureError({ type: 'api_error', error: err });

// 缓存
import cacheManager from '@/utils/cache-manager.js';
await cacheManager.set('key', data, 60000); // 1分钟缓存
const cached = await cacheManager.get('key');

// 埋点
import { trackEvent } from '@/utils/analytics.js';
trackEvent('button_click', { button_id: 'submit' });
```

---

## 🧪 测试

### 运行测试
```bash
# 单元测试
npm run test:mp-weixin

# E2E测试
# 查看 tests/e2e/ 目录

# 覆盖率报告
npm run analyze:coverage
```

### 编写测试
参考 `tests/` 目录中的示例：
- `auth-login.test.js` - 单元测试
- `login-flow.test.js` - E2E测试
- `auth-login-mock.js` - Mock数据

---

## 🛠️ 开发工具

### 代码检查
```bash
npm run lint              # ESLint检查
npm run lint:fix          # 自动修复
npm run check:all         # 运行所有检查
```

### UI适配检测
```bash
npm run check:ui-adapter
# 生成报告：ui-adapter-report.html
```

### 组件分析
```bash
npm run analyze:components
# 检测循环依赖、未使用组件
```

### 性能分析
```bash
npm run analyze:performance
npm run analyze:bundle
```

---

## 📖 API文档

### 查看API文档
所有API文档位于 `docs/api/` 目录：
- [auth-login](./api/auth-login.md) - 登录
- [user-update-profile](./api/user-update-profile.md) - 更新资料
- [stress-chat](./api/stress-chat.md) - AI对话
- 等等...

### 生成API文档
```bash
npm run generate:api-docs
# 自动扫描云函数，生成Markdown文档
```

---

## 🚀 部署

### 构建
```bash
# 微信小程序
npm run build:mp-weixin

# H5
npm run build:h5

# APP
npm run build:app-plus
```

### 云函数部署
1. 在HBuilderX中右键云函数目录
2. 选择"上传部署"
3. 选择要部署的云函数
4. 等待部署完成

### 发布前检查
```bash
npm run check:release
# 自动检查Git状态、版本号、测试等
```

---

## 🐛 调试技巧

### 云函数调试
```javascript
// 添加详细日志
console.log('[TAG] 描述', data);

// 使用HBuilderX云函数日志
// 运行 → 运行到内置浏览器 → 云函数日志
```

### 前端调试
```javascript
// 使用logger
import logger from '@/utils/logger.js';
logger.debug('TAG', 'debug信息');

// 微信开发者工具Console
console.log('[DEBUG]', data);
```

---

## 📝 代码规范

### 命名规范
- 文件名：kebab-case（user-profile.vue）
- 组件名：PascalCase（UserProfile）
- 方法名：camelCase（getUserInfo）
- 常量名：UPPER_SNAKE_CASE（MAX_COUNT）

### Git提交规范
```bash
# 格式
<type>(<scope>): <subject>

# 示例
feat(login): 添加游客模式
fix(assess): 修复进度保存bug
docs(api): 更新API文档
```

---

## 🔒 安全注意事项

### 1. 不要在前端直连数据库
❌ 错误：
```javascript
// 前端直接使用Supabase
import { createClient } from '@supabase/supabase-js';
```

✅ 正确：
```javascript
// 通过云函数访问
await uniCloud.callFunction({
  name: 'your-function',
  data: { ... }
});
```

### 2. 敏感信息处理
- 密钥存储在云函数环境变量
- 用户数据加密存储
- 不在日志中输出敏感信息

---

## 📚 参考资料

### 官方文档
- [uni-app文档](https://uniapp.dcloud.io/)
- [uView 2.0文档](https://www.uviewui.com/)
- [Supabase文档](https://supabase.com/docs)

### 项目文档
- [架构计划](./CraneHeart架构计划.md)
- [开发周期计划](./CraneHeart开发周期计划-用户端.md)
- [任务清单](./COMPREHENSIVE-TASK-LIST.md)

---

**维护人**: 开发团队  
**最后更新**: 2025-10-18  
**适用版本**: v0.2.0+

