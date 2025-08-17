# 部署指南

## 🚀 uniCloud 部署步骤

### 1. 创建服务空间

1. 登录 [uniCloud 控制台](https://unicloud.dcloud.net.cn/)
2. 点击"创建服务空间"
3. 选择阿里云或腾讯云
4. 填写服务空间名称：`lingxin-auth`
5. 选择地域（建议选择离用户最近的地域）

### 2. 关联项目

#### HBuilderX 方式
1. 在 HBuilderX 中打开项目
2. 右键点击 `uniCloud-aliyun` 目录
3. 选择"关联云服务空间"
4. 选择刚创建的服务空间

#### CLI 方式
```bash
# 安装 uniCloud CLI
npm install -g @dcloudio/unicloud

# 登录
unicloud login

# 在项目根目录执行
cd uniCloud-aliyun
unicloud init
```

### 3. 安装依赖

为每个云函数安装依赖：

```bash
# 进入各云函数目录安装依赖
cd cloudfunctions/auth-register
npm install jsonwebtoken bcryptjs

cd ../auth-login  
npm install jsonwebtoken bcryptjs

cd ../auth-me
npm install jsonwebtoken bcryptjs

cd ../auth-refresh
npm install jsonwebtoken bcryptjs
```

### 4. 配置环境变量

在 uniCloud 控制台为每个云函数配置环境变量：

1. 进入"云函数"页面
2. 点击函数名称进入详情
3. 在"环境变量"标签页添加：

```env
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-replace-this
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_PER_MINUTE=10
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://localhost:3000
NODE_ENV=production
```

**⚠️ 重要：JWT_SECRET 必须是至少32字符的随机字符串，生产环境请使用强密钥！**

### 5. 部署云函数

#### HBuilderX 方式
1. 右键点击各云函数目录
2. 选择"上传并运行"
3. 等待部署完成

#### CLI 方式
```bash
# 部署所有云函数
unicloud deploy

# 或单独部署
unicloud deploy --name auth-register
unicloud deploy --name auth-login
unicloud deploy --name auth-me
unicloud deploy --name auth-refresh
```

### 6. 配置 HTTP 触发器

在 uniCloud 控制台为每个云函数配置 HTTP 触发器：

1. 进入"云函数"页面
2. 点击函数名称
3. 在"触发器"标签页点击"创建触发器"
4. 选择"HTTP触发器"
5. 配置路径：

| 云函数 | 触发器路径 | 请求方法 |
|--------|------------|----------|
| auth-register | /api/auth/register | POST |
| auth-login | /api/auth/login | POST |
| auth-me | /api/auth/me | GET |
| auth-refresh | /api/auth/refresh | POST |

### 7. 初始化数据库

1. 创建临时云函数 `database-init`
2. 上传 `database/init.js` 代码
3. 在控制台运行该函数
4. 确认数据库集合和索引创建成功
5. 删除临时函数

### 8. 测试部署

使用 Postman 或浏览器测试 API：

```bash
# 获取云函数URL（在控制台的触发器页面可以看到）
curl -X POST https://your-function-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "account": "testuser123",
    "password": "test1234", 
    "role": "teen",
    "nickname": "测试用户"
  }'
```

## 🔧 其他平台部署

### 腾讯云 CloudBase

1. **创建环境**
   ```bash
   # 安装 CloudBase CLI
   npm install -g @cloudbase/cli
   
   # 登录
   tcb login
   
   # 创建环境
   tcb env:create lingxin-auth
   ```

2. **部署云函数**
   ```bash
   # 创建 cloudbaserc.json
   {
     "envId": "lingxin-auth",
     "functions": [
       {
         "name": "auth-register",
         "timeout": 5,
         "envVariables": {
           "JWT_SECRET": "your-secret-key"
         },
         "runtime": "Nodejs12.16",
         "handler": "index.main"
       }
     ]
   }
   
   # 部署
   tcb functions:deploy
   ```

3. **配置HTTP访问**
   ```bash
   tcb service:create --path /api/auth/register --name auth-register
   ```

### AWS Lambda

1. **创建 serverless.yml**
   ```yaml
   service: lingxin-auth
   provider:
     name: aws
     runtime: nodejs14.x
     region: ap-southeast-1
     environment:
       JWT_SECRET: ${env:JWT_SECRET}
   
   functions:
     auth-register:
       handler: cloudfunctions/auth-register/index.main
       events:
         - http:
             path: api/auth/register
             method: post
             cors: true
   ```

2. **部署**
   ```bash
   serverless deploy
   ```

### 阿里云函数计算

1. **创建 template.yml**
   ```yaml
   ROSTemplateFormatVersion: '2015-09-01'
   Transform: 'Aliyun::Serverless-2018-04-03'
   Resources:
     lingxin-auth:
       Type: 'Aliyun::Serverless::Service'
       Properties:
         Description: 翎心认证服务
       auth-register:
         Type: 'Aliyun::Serverless::Function'
         Properties:
           Handler: index.main
           Runtime: nodejs12
           CodeUri: ./cloudfunctions/auth-register
           EnvironmentVariables:
             JWT_SECRET: your-secret-key
           Events:
             httpTrigger:
               Type: HTTP
               Properties:
                 AuthType: ANONYMOUS
                 Methods: ['POST']
   ```

2. **部署**
   ```bash
   fun deploy
   ```

## 📱 前端配置

### 更新前端BASE_URL

部署完成后，需要更新前端的API地址：

1. 在 uniCloud 控制台获取云函数的HTTP触发器URL
2. 更新 `utils/http.js` 中的 `BASE_URL`：

```javascript
// utils/http.js
const BASE_URL = 'https://your-actual-cloud-function-url.com';
```

### 微信小程序域名配置

在微信小程序后台配置合法请求域名：

1. 登录微信小程序后台
2. 进入"开发" -> "开发设置"
3. 在"服务器域名"中添加：
   ```
   request合法域名: https://your-cloud-function-domain.com
   ```

### H5跨域配置

确保云函数返回正确的CORS头，已在 `common/response.js` 中处理。

## 🧪 验证部署

### 1. 功能测试

使用提供的 Postman 集合测试所有接口：

1. 导入 `test/postman-collection.json`
2. 设置 `baseUrl` 变量为实际的云函数URL
3. 依次运行测试用例

### 2. 性能测试

```bash
# 使用 ab 工具进行压力测试
ab -n 100 -c 10 -H "Content-Type: application/json" \
   -p register.json \
   https://your-function-url/api/auth/register
```

### 3. 监控配置

在 uniCloud 控制台配置监控告警：

1. 进入"监控告警"页面
2. 设置函数执行时间、错误率等告警规则
3. 配置通知方式（邮件、短信等）

## 🔒 安全检查清单

- [ ] JWT_SECRET 使用强随机密钥（至少32字符）
- [ ] 环境变量已正确配置
- [ ] 数据库索引已创建
- [ ] CORS 配置正确
- [ ] 速率限制已启用
- [ ] 错误日志不包含敏感信息
- [ ] 生产环境 NODE_ENV=production

## 🚨 故障排除

### 常见问题

1. **云函数部署失败**
   - 检查依赖是否正确安装
   - 确认代码语法无误
   - 查看控制台错误日志

2. **数据库连接失败**
   - 确认服务空间已正确关联
   - 检查数据库集合是否存在

3. **JWT验证失败**
   - 检查 JWT_SECRET 环境变量
   - 确认 Token 格式正确

4. **CORS错误**
   - 检查 ALLOWED_ORIGINS 配置
   - 确认前端域名在白名单中

### 日志查看

在 uniCloud 控制台查看函数日志：

1. 进入"云函数"页面
2. 点击函数名称
3. 查看"日志"标签页

## 📞 技术支持

如遇到部署问题，请：

1. 查看控制台错误日志
2. 检查环境变量配置
3. 验证网络连接
4. 联系技术支持团队

---

**部署完成后，请及时测试所有功能，确保系统正常运行！**