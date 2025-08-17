# 翎心认证后端服务

基于 uniCloud 的无服务器认证后端，为翎心应用提供注册、登录、用户信息获取等功能。

## 🚀 快速开始

### 1. 环境准备

1. 安装 HBuilderX 或 uni-app CLI
2. 创建 uniCloud 服务空间（阿里云或腾讯云）
3. 配置环境变量

### 2. 部署步骤

#### 方式一：HBuilderX 部署

1. 在 HBuilderX 中打开项目
2. 右键点击 `uniCloud-aliyun` 目录
3. 选择"关联云服务空间"
4. 选择已创建的服务空间
5. 右键点击各云函数目录，选择"上传并运行"

#### 方式二：CLI 部署

```bash
# 安装 uniCloud CLI
npm install -g @dcloudio/unicloud

# 登录
unicloud login

# 关联服务空间
unicloud init

# 部署所有云函数
unicloud deploy
```

### 3. 环境变量配置

在 uniCloud 控制台的"云函数"页面，为每个函数配置环境变量：

```env
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_PER_MINUTE=10
ALLOWED_ORIGINS=https://your-frontend-domain.com
NODE_ENV=production
```

### 4. 数据库初始化

1. 在 uniCloud 控制台创建云函数 `database-init`
2. 上传 `database/init.js` 代码
3. 运行该函数初始化数据库集合和索引

### 5. API 网关配置

在 uniCloud 控制台的"云函数"页面，为每个函数配置 HTTP 触发器：

| 云函数 | HTTP 路径 | 请求方法 |
|--------|-----------|----------|
| auth-register | /api/auth/register | POST |
| auth-login | /api/auth/login | POST |
| auth-me | /api/auth/me | GET |
| auth-refresh | /api/auth/refresh | POST |

## 📋 API 接口文档

### 注册接口

**POST** `/api/auth/register`

请求体：
```json
{
  "account": "testuser123",
  "password": "test1234",
  "role": "teen",
  "nickname": "测试用户"
}
```

成功响应：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f1b2c3d4e5f6789abcdef0",
    "nickname": "测试用户",
    "role": "teen"
  }
}
```

### 登录接口

**POST** `/api/auth/login`

请求体：
```json
{
  "account": "testuser123",
  "password": "test1234"
}
```

成功响应：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f1b2c3d4e5f6789abcdef0",
    "nickname": "测试用户",
    "role": "teen"
  }
}
```

### 获取用户信息

**GET** `/api/auth/me`

请求头：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

成功响应：
```json
{
  "user": {
    "id": "60f1b2c3d4e5f6789abcdef0",
    "nickname": "测试用户",
    "role": "teen"
  }
}
```

### 刷新Token

**POST** `/api/auth/refresh`

请求头：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

成功响应：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🔒 安全特性

- **密码加密**：使用 bcrypt 进行单向哈希
- **JWT认证**：HS256算法，7天有效期
- **速率限制**：基于IP+账号的请求频率限制
- **输入验证**：严格的参数校验
- **错误屏蔽**：不泄露内部错误信息
- **登录保护**：失败次数限制和账号锁定

## 🗄️ 数据库结构

### users 集合

```javascript
{
  _id: ObjectId,
  account: String,        // 账号（唯一）
  password_hash: String,  // 密码哈希
  role: String,          // 角色：teen/parent/org
  nickname: String,      // 昵称
  createdAt: Date,       // 创建时间
  updatedAt: Date,       // 更新时间
  lastLoginAt: Date,     // 最后登录时间
  loginFailCount: Number // 登录失败次数
}
```

### 索引

- `account`：唯一索引
- `role`：普通索引
- `createdAt`：普通索引（降序）

## 🧪 测试

### 自验脚本

```javascript
// 在浏览器控制台或Node.js环境中运行
const BASE_URL = 'https://your-cloud-function-url';

async function testAuth() {
  try {
    // 1. 注册
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: 'testuser123',
        password: 'test1234',
        role: 'teen',
        nickname: '测试用户'
      })
    });
    const registerData = await registerRes.json();
    console.log('注册结果:', registerData);
    
    // 2. 登录
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: 'testuser123',
        password: 'test1234'
      })
    });
    const loginData = await loginRes.json();
    console.log('登录结果:', loginData);
    
    // 3. 获取用户信息
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    const meData = await meRes.json();
    console.log('用户信息:', meData);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testAuth();
```

## 🔧 故障排除

### 常见问题

1. **Token验证失败**
   - 检查JWT_SECRET环境变量是否正确设置
   - 确认Token格式为 `Bearer <token>`

2. **数据库连接失败**
   - 确认已正确关联uniCloud服务空间
   - 检查数据库集合是否已创建

3. **CORS错误**
   - 检查ALLOWED_ORIGINS环境变量
   - 确认前端域名在白名单中

4. **速率限制触发**
   - 检查RATE_LIMIT_PER_MINUTE配置
   - 清理速率限制缓存

### 日志查看

在uniCloud控制台的"云函数"页面可以查看函数运行日志，包括：
- 请求参数
- 执行时间
- 错误信息
- 安全事件

## 📱 平台适配说明

### 微信小程序配置

在微信小程序后台配置合法请求域名：
```
https://your-cloud-function-domain.com
```

### H5应用CORS配置

确保云函数返回正确的CORS头：
```javascript
{
  'Access-Control-Allow-Origin': 'https://your-frontend-domain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

## 🔄 其他平台适配

### 腾讯云CloudBase

1. 创建CloudBase环境
2. 部署云函数到CloudBase
3. 配置HTTP触发器
4. 设置环境变量

### AWS Lambda

1. 创建Lambda函数
2. 配置API Gateway
3. 设置环境变量
4. 部署函数代码

### 阿里云函数计算

1. 创建函数计算服务
2. 配置HTTP触发器
3. 设置环境变量
4. 部署函数

## 📞 技术支持

如有问题，请联系开发团队或查看项目文档。