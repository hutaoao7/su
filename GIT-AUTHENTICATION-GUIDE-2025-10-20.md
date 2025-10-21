# 🔐 Git认证指南 - 2025-10-20

## 🔴 当前问题

```
❌ Permission denied: bbssssvs/su.git
   原因: Git认证失败
   
错误信息:
   fatal: unable to access 'https://github.com/bbssssvs/su.git/'
   The requested URL returned error: 403
```

---

## 🎯 解决方案

### 方案1: 使用GitHub Personal Access Token (推荐)

#### 步骤1: 生成Personal Access Token

1. 登录GitHub: https://github.com/login
2. 访问: https://github.com/settings/tokens
3. 点击 **"Generate new token"** → **"Generate new token (classic)"**
4. 填写信息:
   - **Note**: 例如 "Git Push Token"
   - **Expiration**: 选择 "90 days" 或 "No expiration"
   - **Select scopes**: 勾选 **"repo"** (完整仓库访问)
5. 点击 **"Generate token"**
6. **复制token** (只会显示一次！)

#### 步骤2: 配置Git凭证管理器

```bash
# 配置凭证管理器
git config --global credential.helper manager-core

# 或者使用store (不推荐，不安全)
# git config --global credential.helper store
```

#### 步骤3: 推送代码

```bash
# 推送到您的fork
git push origin dev

# 系统会提示输入用户名和密码
# 用户名: bbssssvs
# 密码: 粘贴您的Personal Access Token
```

---

### 方案2: 配置SSH密钥

#### 步骤1: 生成SSH密钥

```bash
# 生成SSH密钥
ssh-keygen -t ed25519 -C "your-email@example.com"

# 或者使用RSA (如果ed25519不支持)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 按Enter接受默认位置
# 输入密码 (可选)
```

#### 步骤2: 添加公钥到GitHub

1. 复制公钥:
```bash
# Windows PowerShell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard

# 或者手动打开文件
# C:\Users\YourUsername\.ssh\id_ed25519.pub
```

2. 在GitHub上添加:
   - 访问: https://github.com/settings/keys
   - 点击 **"New SSH key"**
   - 标题: 例如 "My Windows PC"
   - 粘贴公钥
   - 点击 **"Add SSH key"**

#### 步骤3: 配置Git使用SSH

```bash
# 更新远程地址为SSH
git remote set-url origin git@github.com:bbssssvs/su.git

# 验证
git remote -v

# 推送
git push origin dev
```

---

### 方案3: 使用GitHub CLI

#### 步骤1: 安装GitHub CLI

访问: https://cli.github.com/

选择Windows版本下载安装

#### 步骤2: 认证

```bash
# 启动认证
gh auth login

# 选择:
# ? What is your preferred protocol for Git operations? HTTPS
# ? Authenticate Git with your GitHub credentials? Yes
# ? How would you like to authenticate GitHub CLI? Login with a web browser
```

#### 步骤3: 推送

```bash
# 推送
git push origin dev
```

---

## 📋 推荐步骤 (方案1最简单)

### 第1步: 生成Personal Access Token

1. 访问: https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 "repo" 权限
4. 点击 "Generate token"
5. **复制token**

### 第2步: 配置凭证管理器

```bash
git config --global credential.helper manager-core
```

### 第3步: 推送

```bash
git push origin dev

# 输入:
# 用户名: bbssssvs
# 密码: 粘贴您的token
```

---

## ⚠️ 常见问题

### Q: Token过期了怎么办?
```
A: 重新生成一个新的token，然后重新输入
```

### Q: 忘记了token怎么办?
```
A: 无法恢复，需要生成新的token
```

### Q: 如何删除已保存的凭证?
```bash
# Windows
git credential-manager-core erase https://github.com

# 或者
git config --global --unset credential.helper
```

### Q: 推送还是失败怎么办?
```bash
# 清除缓存的凭证
git credential-manager-core erase https://github.com

# 重新推送，会要求重新输入
git push origin dev
```

---

## 🔧 完整推送流程

```bash
# 1. 配置凭证管理器
git config --global credential.helper manager-core

# 2. 验证远程地址
git remote -v
# 应该显示:
# origin  https://github.com/bbssssvs/su.git (fetch)
# origin  https://github.com/bbssssvs/su.git (push)

# 3. 推送
git push origin dev

# 4. 输入凭证
# 用户名: bbssssvs
# 密码: 您的Personal Access Token
```

---

## ✅ 推送成功的标志

```
Enumerating objects: 13, done.
Counting objects: 100% (13/13), done.
Delta compression using up to 8 threads
Compressing objects: 100% (13/13), done.
Writing objects: 100% (13/13), 50.00 KiB | 1.00 MiB/s, done.
Total 13 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/bbssssvs/su.git
 * [new branch]      dev -> dev
```

---

## 📞 下一步

### 您需要做的:

1. **生成Personal Access Token**
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 勾选 "repo"
   - 复制token

2. **告诉我token已生成**
   - 或者直接在本地执行推送命令

### 推送命令:

```bash
# 配置凭证管理器
git config --global credential.helper manager-core

# 推送
git push origin dev

# 输入用户名: bbssssvs
# 输入密码: 您的Personal Access Token
```

---

**当前状态**: Fork已完成，等待认证配置  
**用户**: bbssssvs  
**目标**: 推送到 https://github.com/bbssssvs/su  
**本地提交**: 13个  


