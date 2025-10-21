# 🔐 GitHub凭证修复指南 - 2025-10-20

## 🔴 当前问题

```
❌ Permission to bbssssvs/su.git denied to achsbk
   原因: Git用户名是 achsbk，但GitHub用户名是 bbssssvs
   
错误信息:
   fatal: unable to access 'https://github.com/bbssssvs/su.git/'
   The requested URL returned error: 403
```

---

## 🎯 根本原因

您的Git全局配置中的用户名是 `achsbk`，但您的GitHub账户是 `bbssssvs`。

GitHub认为您在尝试用错误的账户推送代码。

---

## ✅ 解决方案

### 方案1: 使用Personal Access Token (推荐)

#### 步骤1: 生成Personal Access Token

1. 打开浏览器
2. 访问: https://github.com/settings/tokens
3. 点击 **"Generate new token (classic)"**
4. 填写:
   - **Note**: "Git Push Token"
   - **Expiration**: "90 days"
   - **Select scopes**: 勾选 **"repo"** ✅
5. 点击 **"Generate token"**
6. **复制token** (只会显示一次！)

#### 步骤2: 在PowerShell中运行以下命令

```powershell
# 进入项目目录
cd d:\新建文件夹\su

# 配置Git用户名和邮箱
git config --global user.name "bbssssvs"
git config --global user.email "your-email@example.com"

# 配置凭证管理器
git config --global credential.helper manager-core

# 推送
git push origin dev

# 系统会弹出凭证输入框
# 用户名: bbssssvs
# 密码: 粘贴您的Personal Access Token
```

---

### 方案2: 使用HTTPS URL编码凭证

```powershell
# 进入项目目录
cd d:\新建文件夹\su

# 配置Git用户名
git config --global user.name "bbssssvs"
git config --global user.email "your-email@example.com"

# 使用token推送 (替换YOUR_TOKEN为您的token)
git push https://bbssssvs:YOUR_TOKEN@github.com/bbssssvs/su.git dev
```

---

### 方案3: 使用GitHub CLI

#### 步骤1: 安装GitHub CLI

访问: https://cli.github.com/

下载Windows版本并安装

#### 步骤2: 认证

```powershell
gh auth login

# 选择:
# ? What is your preferred protocol for Git operations? HTTPS
# ? Authenticate Git with your GitHub credentials? Yes
# ? How would you like to authenticate GitHub CLI? Login with a web browser
```

#### 步骤3: 推送

```powershell
cd d:\新建文件夹\su
git push origin dev
```

---

## 📋 完整步骤 (推荐方案1)

### 第1步: 生成Personal Access Token

访问: https://github.com/settings/tokens

1. 点击 "Generate new token (classic)"
2. 勾选 "repo"
3. 点击 "Generate token"
4. 复制token

### 第2步: 在PowerShell中运行

```powershell
# 进入项目目录
cd d:\新建文件夹\su

# 配置用户名
git config --global user.name "bbssssvs"
git config --global user.email "your-email@example.com"

# 配置凭证管理器
git config --global credential.helper manager-core

# 推送
git push origin dev
```

### 第3步: 输入凭证

系统会弹出凭证输入框:
- **用户名**: `bbssssvs`
- **密码**: 粘贴您的Personal Access Token

---

## ⚠️ 常见问题

### Q: 为什么显示 "Permission denied to achsbk"?
```
A: 因为您的Git用户名是achsbk，但GitHub账户是bbssssvs
   需要配置正确的用户名: git config --global user.name "bbssssvs"
```

### Q: 如何查看当前Git用户名?
```bash
git config --global user.name
git config --global user.email
```

### Q: 如何修改Git用户名?
```bash
git config --global user.name "bbssssvs"
git config --global user.email "your-email@example.com"
```

### Q: Personal Access Token过期了怎么办?
```
A: 重新生成一个新的token
   访问: https://github.com/settings/tokens
```

### Q: 如何删除已保存的凭证?
```bash
# 删除GitHub的凭证
git credential reject https://github.com
```

---

## 🔧 验证配置

```powershell
# 查看Git配置
git config --global --list | findstr user

# 应该显示:
# user.name=bbssssvs
# user.email=your-email@example.com

# 查看远程地址
git remote -v

# 应该显示:
# origin  https://github.com/bbssssvs/su.git (fetch)
# origin  https://github.com/bbssssvs/su.git (push)
# upstream  https://github.com/hutaoao7/su.git (fetch)
# upstream  https://github.com/hutaoao7/su.git (push)
```

---

## ✅ 推送成功的标志

```
Enumerating objects: 14, done.
Counting objects: 100% (14/14), done.
Delta compression using up to 8 threads
Compressing objects: 100% (14/14), done.
Writing objects: 100% (14/14), 50.00 KiB | 1.00 MiB/s, done.
Total 14 (delta 0), reused 0 (delta 0), pack-reused 0
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

2. **在PowerShell中运行**:
   ```powershell
   cd d:\新建文件夹\su
   git config --global user.name "bbssssvs"
   git config --global user.email "your-email@example.com"
   git config --global credential.helper manager-core
   git push origin dev
   ```

3. **输入凭证**:
   - 用户名: `bbssssvs`
   - 密码: 您的Personal Access Token

---

**当前状态**: Git用户名已配置为 bbssssvs，等待Personal Access Token  
**用户**: bbssssvs  
**目标**: 推送到 https://github.com/bbssssvs/su  
**本地提交**: 14个  


