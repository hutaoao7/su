# WS-M1-W1-002: 用户信息页面完善 - 详细计划文档

**工作流ID**: WS-M1-W1-002  
**标题**: 完善个人中心和个人资料页  
**分支**: `feat/WS-M1-W1-002-user-profile`  
**负责人**: 前端A + 后端A  
**预计工时**: 4h（前端3h + 后端1h）

---

## 一、输入/输出明细

### 1.1 输入

#### 代码输入（来自复用扫描）

1. **pages/user/home.vue**（502行）
   - 状态：✅ 功能完善
   - 内容：用户信息卡片、功能菜单、快捷入口、订阅设置弹窗
   - 依赖组件：u-popup、u-switch（uView，依赖WS-M0-001）
   - 功能完整度：100%
   - 复用策略：✅ 直接复用

2. **pages/user/profile.vue**（17行）
   - 状态：❌ 仅占位页面
   - 内容：两个按钮（登录/注册、编辑资料）
   - 功能完整度：5%
   - 复用策略：🔴 需要完整重构

3. **uniCloud-aliyun/cloudfunctions/auth-me/index.js**（84行）
   - 状态：✅ 功能完整
   - 内容：使用uni-id验证token并返回用户信息
   - 依赖：uni-id、uni-config-center
   - 复用策略：✅ 直接复用

4. **utils/auth.js**（333行）
   - 状态：✅ 功能完整
   - 相关函数：getLoginData(), getUserInfo(), saveLoginData()
   - 复用策略：✅ 直接复用

#### 需求输入（来自基线文档）

来自 `CraneHeart开发周期计划-用户端.md` Week 1 任务：
- 用户信息页面：4h工时
- 负责人：前端A
- 交付物：用户头像、昵称显示，个人资料编辑功能

### 1.2 输出

#### 代码产出

1. **pages/user/profile.vue**（完整实现）
   - 行数：约500行（参考home.vue规模）
   - 功能：
     * 用户信息展示区（头像、昵称、uid、注册时间）
     * 资料编辑表单
     * 头像上传与预览
     * 保存按钮与loading状态
     * 错误处理与提示
   - 使用组件：
     * u-form（表单容器）
     * u-form-item（表单项）
     * u-input（输入框）
     * u-radio-group（性别选择）
     * u-textarea（个人简介）
     * u-upload（头像上传，或自定义）
     * u-button（保存按钮）

2. **uniCloud-aliyun/cloudfunctions/user-update-profile/**（新建）
   - index.js：约150行
   - package.json：依赖配置
   - 功能：
     * Token验证（复用common/auth）
     * 参数校验（复用common/validator）
     * Supabase更新（复用common/db）
     * 返回标准格式（复用common/response）

#### 功能产出

1. ✅ 个人中心页面验证通过（home.vue）
2. ✅ 个人资料完整编辑功能（profile.vue）
3. ✅ 头像上传功能
4. ✅ 数据同步到Supabase
5. ✅ 本地缓存同步更新
6. ✅ 表单验证与错误提示

---

## 二、依赖关系详细分析

### 2.1 前置依赖

#### WS-M0-001: UI组件库统一

**依赖内容**:
- uView 2.x 正确安装
- u-form、u-input、u-button等组件可用
- easycom自动引入配置

**验证方法**:
```bash
npm run check:ui
# 预期: ✅ uView已安装: ^2.0.36
```

**风险**: 如果WS-M0-001未完成，profile.vue无法使用uView组件

---

#### WS-M1-W1-001: 微信登录验证

**依赖内容**:
- 登录流程正常
- Token正确保存到 uni.storage
- isAuthed() 可正确判断登录态
- getLoginData() 可获取用户信息

**验证方法**:
```javascript
// 在profile.vue onLoad中
import { isAuthed, getLoginData } from '@/utils/auth.js';

if (!isAuthed()) {
  // 未登录，跳转登录页
  uni.navigateTo({ url: '/pages/login/login' });
  return;
}

const loginData = getLoginData();
console.log('用户信息:', loginData);
// 预期: { token, uid, userInfo }
```

**风险**: 如果登录功能异常，profile页面无法获取用户信息

---

### 2.2 后置影响

#### WS-M1-W1-006: 路由守卫

**影响内容**:
- profile页面需要添加到PROTECTED_ROUTES
- 未登录自动跳转

**集成点**:
```javascript
// utils/auth.js
const PROTECTED_ROUTES = [
  '/pages/user/profile', // 本工作流添加
  '/pages/user/home',
  ...
];
```

---

#### WS-M2-W5-001: 本地存储加密

**影响内容**:
- 用户信息需要加密存储
- 本工作流先明文存储（M2再加密）

---

### 2.3 并行关系

可与以下任务并行开发：
- WS-M1-W1-003: 同意管理（不同模块）
- WS-M1-W1-004: 通用组件库（不同模块）
- WS-M1-W1-005: 请求封装统一（不同模块）

---

## 三、触点文件精确路径

### 3.1 前端文件

#### 复用验证文件

| 文件路径 | 行数 | 复用策略 | 验证内容 | 风险 |
|---------|------|----------|----------|------|
| `pages/user/home.vue` | 502 | ✅ 直接复用 | 用户信息展示、退出登录、订阅设置 | 低 |
| `utils/auth.js` | 333 | ✅ 直接复用 | getLoginData(), getUserInfo(), saveLoginData() | 低 |
| `utils/unicloud-handler.js` | 392 | ✅ 直接复用 | callCloudFunction(), cloudFunctions.auth.me() | 低 |

#### 重构文件

| 文件路径 | 原行数 | 新行数 | 重构策略 | 工时 |
|---------|-------|--------|----------|------|
| `pages/user/profile.vue` | 17 | ~500 | 🔴 完整重构 | 2h |

#### 新建文件

| 文件路径 | 预计行数 | 功能 | 工时 |
|---------|---------|------|------|
| `uniCloud-aliyun/cloudfunctions/user-update-profile/index.js` | ~150 | 更新用户信息云函数 | 30min |
| `uniCloud-aliyun/cloudfunctions/user-update-profile/package.json` | ~20 | 依赖配置 | 10min |

---

### 3.2 云函数文件

#### 复用云函数

| 文件路径 | 行数 | 功能 | 复用策略 |
|---------|------|------|----------|
| `uniCloud-aliyun/cloudfunctions/auth-me/index.js` | 84 | 获取用户信息（验证token） | ✅ 直接复用 |
| `uniCloud-aliyun/cloudfunctions/common/auth/index.js` | - | 认证中间件 | ✅ 复用 |
| `uniCloud-aliyun/cloudfunctions/common/db/index.js` | - | Supabase操作封装 | ✅ 复用 |
| `uniCloud-aliyun/cloudfunctions/common/response/index.js` | - | 响应格式化 | ✅ 复用 |
| `uniCloud-aliyun/cloudfunctions/common/validator/index.js` | - | 参数校验 | ✅ 复用 |

#### 新建云函数

| 文件路径 | 功能描述 |
|---------|----------|
| `uniCloud-aliyun/cloudfunctions/user-update-profile/` | 更新用户资料云函数目录 |
| `├── index.js` | 主函数（验证token、更新Supabase、返回结果） |
| `├── package.json` | 依赖配置（@supabase/supabase-js等） |
| `└── README.md` | 云函数说明文档 |

---

## 四、数据流详细设计

### 4.1 页面初始化数据流

```
pages/user/home.vue (onShow)
  ↓
[本地数据获取]
getLoginData()
  ├─ 读取 uni.storage['uni_id_token']
  ├─ 读取 uni.storage['uni_id_uid']  
  ├─ 读取 uni.storage['uni_id_user_info'] (JSON字符串)
  └─ 返回 { token, uid, userInfo: { uid, nickname, avatar, ... } }
  ↓
[数据处理]
计算显示名称
  ├─ 优先：userInfo.nickname
  ├─ 其次：userInfo.username
  ├─ 兜底：uid后6位
  └─ 返回 displayName
  ↓
[UI渲染]
this.name = displayName
this.avatar = userInfo.avatar || ''
this.uid = uid
  ↓
[DOM更新]
<image :src="avatar" /> 或 <view>{{ avatarText }}</view>
<text>{{ name }}</text>
<text>{{ statusText }}</text>
```

---

### 4.2 个人资料页面加载数据流

```
pages/user/profile.vue (onLoad)
  ↓
[登录态检查]
isAuthed()
  ├─ token存在？
  ├─ token未过期？
  └─ 返回 true/false
  ↓
如果未登录 → uni.navigateTo('/pages/login/login')
  ↓
[获取本地缓存]
getLoginData()
  ├─ token
  ├─ uid
  └─ userInfo: { nickname, avatar, gender, birthday, bio, ... }
  ↓
[可选：查询最新信息]
调用 auth-me 云函数
  ├─ 参数: { } (token在header中)
  ├─ 云函数验证token（uni-id.checkToken）
  ├─ 返回: { errCode: 0, uid, userInfo }
  └─ 前端合并到本地缓存
  ↓
[UI渲染]
表单数据绑定
  ├─ formData.nickname = userInfo.nickname || ''
  ├─ formData.avatar = userInfo.avatar || ''
  ├─ formData.gender = userInfo.gender || ''
  ├─ formData.birthday = userInfo.birthday || ''
  └─ formData.bio = userInfo.bio || ''
  ↓
显示编辑表单
```

---

### 4.3 保存用户信息数据流

```
用户点击"保存"按钮
  ↓
[前端验证]
validateForm()
  ├─ 昵称长度: 2-20字符
  ├─ 昵称格式: 不含特殊字符
  ├─ 简介长度: ≤200字符
  ├─ 生日格式: YYYY-MM-DD
  └─ 返回 valid: true/false, errors: []
  ↓
如果验证失败 → 显示错误提示 → 结束
  ↓
[显示loading]
this.saving = true
uni.showLoading({ title: '保存中...' })
  ↓
[调用云函数]
cloudFunctions.user.updateProfile({
  nickname: formData.nickname,
  avatar: formData.avatar,
  gender: formData.gender,
  birthday: formData.birthday,
  bio: formData.bio
})
  ↓
云函数: user-update-profile
  ├─ [1] Token验证
  │   ├─ 从context.UNI_ID_TOKEN获取token
  │   ├─ 调用 common/auth 验证
  │   └─ 返回 uid
  ├─ [2] 参数校验
  │   ├─ 调用 common/validator 校验
  │   ├─ 昵称: 2-20字符，无特殊符号
  │   ├─ 简介: ≤200字符
  │   └─ 返回 valid, errors
  ├─ [3] 更新Supabase
  │   ├─ 调用 common/db getSupabaseClient()
  │   ├─ UPDATE users SET ... WHERE id = uid
  │   └─ 返回 updated row
  ├─ [4] 格式化响应
  │   ├─ 调用 common/response format()
  │   └─ 返回 { errCode: 0, data: { ...userInfo } }
  └─ 返回到前端
  ↓
[前端处理响应]
if (result.errCode === 0)
  ├─ 更新本地缓存
  │   ├─ userInfo合并新数据
  │   ├─ uni.setStorageSync('uni_id_user_info', JSON.stringify(userInfo))
  │   └─ 触发 AUTH_CHANGED 事件
  ├─ 显示成功提示
  │   └─ uni.showToast({ title: '保存成功', icon: 'success' })
  ├─ 返回个人中心
  │   └─ uni.navigateBack()
  └─ home.vue接收AUTH_CHANGED事件，刷新显示
else
  ├─ 显示错误提示
  │   └─ uni.showToast({ title: result.errMsg, icon: 'none' })
  └─ 保持在当前页面
  ↓
[隐藏loading]
this.saving = false
uni.hideLoading()
```

---

### 4.4 头像上传数据流

```
用户点击头像区域
  ↓
uni.chooseImage()
  ├─ count: 1（只允许1张）
  ├─ sizeType: ['compressed']（压缩）
  ├─ sourceType: ['album', 'camera']（相册或拍照）
  └─ 返回 tempFilePaths: [localPath]
  ↓
[图片压缩]（如果>500KB）
uni.compressImage({
  src: tempFilePath,
  quality: 80,
  width: 400, // 最大宽度
  height: 400 // 最大高度
})
  ↓
[上传到云存储]
uniCloud.uploadFile({
  filePath: compressedPath,
  cloudPath: `avatars/${uid}_${Date.now()}.jpg`,
  cloudPathAsRealPath: true
})
  ├─ 上传进度: onUploadProgress
  └─ 返回 fileID 或 URL
  ↓
[更新头像字段]
formData.avatar = uploadedURL
  ↓
[自动保存或等待用户点击保存]
选项A: 立即调用 updateProfile({ avatar })
选项B: 仅更新表单，等待用户点击保存
  ↓
[本地缓存更新]
更新 uni_id_user_info.avatar
触发 AUTH_CHANGED
  ↓
[UI更新]
头像预览显示新图片
home.vue 自动刷新显示新头像
```

---

## 五、异常与降级策略

### 5.1 异常场景分析

#### 场景1: 网络异常

**触发条件**: 
- 网络断开
- 云函数超时
- Supabase不可用

**处理策略**:
```javascript
try {
  await cloudFunctions.user.updateProfile(data);
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // 方案A: 仅本地更新，后台同步
    updateLocalCache(data);
    markAsPendingSync(data);
    uni.showToast({ title: '已保存到本地，将在网络恢复后同步', icon: 'none' });
    
    // 方案B: 提示失败，允许重试
    uni.showModal({
      title: '保存失败',
      content: '网络连接失败，是否重试？',
      success: (res) => {
        if (res.confirm) {
          handleSave(); // 重试
        }
      }
    });
  }
}
```

**本工作流选择**: 方案B（提示重试，简单可靠）

---

#### 场景2: Token过期

**触发条件**:
- Token已过期
- 云函数返回errCode=401

**处理策略**:
```javascript
if (result.errCode === 401) {
  // 清除登录态
  clearLoginData();
  
  // 提示重新登录
  uni.showModal({
    title: '登录已过期',
    content: '请重新登录后继续编辑',
    showCancel: false,
    success: () => {
      uni.navigateTo({ url: '/pages/login/login' });
    }
  });
}
```

---

#### 场景3: 头像上传失败

**触发条件**:
- 云存储空间不足
- 图片格式不支持
- 网络上传超时

**处理策略**:
```javascript
try {
  const uploadResult = await uniCloud.uploadFile({...});
} catch (error) {
  console.error('[PROFILE] 头像上传失败:', error);
  
  // 不阻塞其他信息保存
  formData.avatar = oldAvatar; // 恢复原头像
  
  uni.showToast({
    title: '头像上传失败，其他信息已保存',
    icon: 'none',
    duration: 3000
  });
  
  // 继续保存其他信息
  await saveProfileWithoutAvatar();
}
```

---

#### 场景4: 参数校验失败

**触发条件**:
- 昵称格式不正确
- 昵称长度超限
- 必填项为空

**处理策略**:
```javascript
// 前端验证
const errors = validateForm(formData);
if (errors.length > 0) {
  // 显示第一个错误
  uni.showToast({
    title: errors[0].message,
    icon: 'none',
    duration: 2000
  });
  
  // 聚焦到错误字段
  this.$refs[errors[0].field].focus();
  
  return; // 不继续提交
}

// 后端验证（云函数）
if (!isValidNickname(nickname)) {
  return {
    errCode: 400,
    errMsg: '昵称格式不正确：长度2-20字符，不含特殊符号',
    field: 'nickname'
  };
}
```

---

### 5.2 降级策略

#### 降级1: 仅本地更新

**适用场景**: 云端持续不可用

**实施**:
```javascript
// 本地先更新
const newUserInfo = { ...oldUserInfo, ...updates };
uni.setStorageSync('uni_id_user_info', JSON.stringify(newUserInfo));

// 标记为待同步
const pendingSync = uni.getStorageSync('pending_sync') || [];
pendingSync.push({
  type: 'updateProfile',
  data: updates,
  timestamp: Date.now()
});
uni.setStorageSync('pending_sync', pendingSync);

// 后台重试（App.vue onShow或定时）
```

---

#### 降级2: 简化表单

**适用场景**: 头像上传功能异常

**实施**:
```javascript
// 隐藏头像上传入口
this.showAvatarUpload = false;

// 仅保留昵称和简介编辑
<u-form-item label="昵称">
  <u-input v-model="formData.nickname" />
</u-form-item>
<u-form-item label="个人简介">
  <u-textarea v-model="formData.bio" />
</u-form-item>
```

---

## 六、复用说明（复用/小改/重构）

### 6.1 复用文件明细

#### pages/user/home.vue

**复用策略**: ✅ **直接复用**

**理由**:
1. 功能完整：用户信息展示、功能菜单、快捷入口、订阅设置
2. 代码质量高：502行，结构清晰，注释完整
3. UI精美：液态玻璃风格，交互流畅
4. 已使用uView组件：u-popup、u-switch（依赖WS-M0-001）

**验证重点**:
- uView组件是否正常渲染（依赖WS-M0-001）
- 用户信息是否正确显示（依赖WS-M1-W1-001）
- 退出登录是否正常工作
- 订阅设置功能是否正常

**测试方法**:
1. 登录后打开个人中心
2. 验证头像/昵称显示
3. 点击各个菜单项，验证跳转
4. 点击订阅设置，验证弹窗
5. 点击退出登录，验证清理

---

#### utils/auth.js

**复用策略**: ✅ **直接复用**

**使用函数**:
- `getLoginData()`: 获取完整登录数据（token, uid, userInfo）
- `getUserInfo()`: 仅获取用户信息对象
- `saveLoginData(data)`: 保存登录数据，触发AUTH_CHANGED事件
- `isAuthed()`: 判断登录态（检查token和过期时间）
- `clearLoginData()`: 清除登录数据

**关键逻辑**:
```javascript
// saveLoginData 的数据兼容性处理
const token = loginData.token || loginData.tokenInfo?.token;
const uid = loginData.uid || loginData.userInfo?.uid;

// 过期时间转换（秒→毫秒）
if (tokenExpired < 9999999999) {
  tokenExpired = tokenExpired * 1000;
}

// 触发全局事件
uni.$emit('AUTH_CHANGED', { authed: true });
```

---

#### utils/unicloud-handler.js

**复用策略**: ✅ **直接复用**

**使用函数**:
```javascript
// 调用auth-me
cloudFunctions.auth.me()

// 调用user-update-profile（新增）
callCloudFunction('user-update-profile', params, {
  showLoading: true,
  loadingText: '保存中...',
  timeout: 10000
})
```

---

### 6.2 重构文件明细

#### pages/user/profile.vue

**当前状态**（17行）:
```vue
<template>
  <view class="page">
    <view class="card"><text class="text-muted">✅ 个人资料页</text></view>
    <view class="row" style="margin-top:16rpx">
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/login/login'})">登录/注册</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/user/profile'})">编辑资料</button>
    </view>
  </view>
</template>

<script>
export default {}
</script>

<style scoped></style>
```

**重构后目标**（约500行）:

**模块结构**:
1. **Template部分**（约200行）
   - 自定义导航栏（返回按钮 + 标题）
   - 头像编辑区（点击上传，预览）
   - 表单区域
     * 昵称输入框（u-input）
     * 性别选择（u-radio-group）
     * 生日选择（u-datetime-picker）
     * 个人简介（u-textarea）
   - 保存按钮（u-button）
   - 加载状态（loading覆盖层）

2. **Script部分**（约200行）
   - data: formData, originalData, saving, uploading, errors
   - computed: isModified, canSave
   - onLoad: 加载用户数据
   - methods:
     * loadUserInfo() - 加载用户信息
     * handleAvatarClick() - 头像上传入口
     * chooseAndUploadAvatar() - 选择和上传头像
     * validateForm() - 表单验证
     * handleSave() - 保存逻辑
     * updateLocalCache() - 更新本地缓存
     * handleBack() - 返回处理（有修改提示确认）

3. **Style部分**（约100行）
   - 页面布局样式
   - 头像编辑区样式
   - 表单样式（复用home.vue的液态玻璃风格）
   - 按钮样式

**设计原则**:
- 复用home.vue的液态玻璃风格
- 使用uView 2.x表单组件
- 单根节点（template）
- 不破坏全局样式

---

### 6.3 新建文件明细

#### uniCloud-aliyun/cloudfunctions/user-update-profile/index.js

**文件结构**（约150行）:

```javascript
'use strict';

// 导入公共模块
const { verifyToken } = require('../common/auth');
const { getSupabaseClient } = require('../common/db');
const { formatResponse } = require('../common/response');
const { validateParams } = require('../common/validator');

// 参数校验规则
const VALIDATION_RULES = {
  nickname: {
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/,
    message: '昵称长度2-20字符，仅支持中英文、数字、下划线'
  },
  avatar: {
    type: 'string',
    required: false,
    pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
    message: '头像URL格式不正确'
  },
  gender: {
    type: 'string',
    required: false,
    enum: ['male', 'female', 'other', ''],
    message: '性别值不合法'
  },
  birthday: {
    type: 'string',
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: '生日格式应为YYYY-MM-DD'
  },
  bio: {
    type: 'string',
    required: false,
    maxLength: 200,
    message: '个人简介不超过200字'
  }
};

/**
 * 主函数
 */
exports.main = async (event, context) => {
  const TAG = '[USER-UPDATE-PROFILE]';
  
  try {
    console.log(TAG, '请求开始', event);
    
    // 1. Token验证
    const authResult = await verifyToken(context);
    if (!authResult.success) {
      return formatResponse(401, authResult.message);
    }
    const uid = authResult.uid;
    console.log(TAG, '用户验证通过:', uid);
    
    // 2. 参数提取
    const { nickname, avatar, gender, birthday, bio } = event;
    const updates = {};
    
    if (nickname !== undefined) updates.nickname = nickname;
    if (avatar !== undefined) updates.avatar = avatar;
    if (gender !== undefined) updates.gender = gender;
    if (birthday !== undefined) updates.birthday = birthday;
    if (bio !== undefined) updates.bio = bio;
    
    // 至少更新一个字段
    if (Object.keys(updates).length === 0) {
      return formatResponse(400, '未提供任何更新字段');
    }
    
    console.log(TAG, '更新字段:', Object.keys(updates));
    
    // 3. 参数校验
    const validationErrors = [];
    for (const [field, value] of Object.entries(updates)) {
      const rule = VALIDATION_RULES[field];
      if (!rule) continue;
      
      // 类型检查
      if (rule.type && typeof value !== rule.type) {
        validationErrors.push(`${field}类型错误`);
        continue;
      }
      
      // 必填检查
      if (rule.required && !value) {
        validationErrors.push(`${field}不能为空`);
        continue;
      }
      
      // 长度检查
      if (rule.minLength && value.length < rule.minLength) {
        validationErrors.push(`${field}长度不能少于${rule.minLength}字符`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        validationErrors.push(`${field}长度不能超过${rule.maxLength}字符`);
      }
      
      // 格式检查
      if (rule.pattern && !rule.pattern.test(value)) {
        validationErrors.push(rule.message);
      }
      
      // 枚举检查
      if (rule.enum && !rule.enum.includes(value)) {
        validationErrors.push(rule.message);
      }
    }
    
    if (validationErrors.length > 0) {
      console.log(TAG, '参数校验失败:', validationErrors);
      return formatResponse(400, validationErrors[0]);
    }
    
    console.log(TAG, '参数校验通过');
    
    // 4. 更新Supabase
    const supabase = getSupabaseClient();
    
    // 添加更新时间
    updates.updated_at = new Date().toISOString();
    
    console.log(TAG, '更新Supabase users表, uid:', uid);
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', uid)
      .select()
      .single();
    
    if (error) {
      console.error(TAG, 'Supabase更新失败:', error);
      return formatResponse(500, `数据库更新失败: ${error.message}`);
    }
    
    console.log(TAG, 'Supabase更新成功');
    
    // 5. 返回更新后的用户信息
    return formatResponse(0, '更新成功', {
      userInfo: data
    });
    
  } catch (error) {
    console.error(TAG, '异常:', error);
    return formatResponse(500, error.message || String(error));
  }
};
```

**模块依赖**:
- common/auth: verifyToken()
- common/db: getSupabaseClient()
- common/response: formatResponse()
- common/validator: validateParams()（可选使用）

---

## 七、实施步骤详细拆解

### Step 1: 验证home.vue（1h）

#### 1.1 功能测试（30min）

**测试清单**:
- [ ] 登录后打开个人中心
- [ ] 验证用户信息卡片
  - [ ] 头像显示（有头像/无头像占位）
  - [ ] 昵称显示（nickname/username/uid后6位）
  - [ ] 状态文本显示
- [ ] 验证功能菜单
  - [ ] 点击"个人资料"跳转到profile页
  - [ ] 点击"应用设置"跳转到settings页
  - [ ] 点击"订阅设置"打开u-popup弹窗
  - [ ] 点击"问题反馈"跳转到feedback页
- [ ] 验证快捷入口
  - [ ] 点击"检测历史"跳转
  - [ ] 点击"CDK兑换"跳转
  - [ ] 点击"数据指标"（管理员）跳转
  - [ ] 点击"测试页面"跳转
- [ ] 验证订阅设置弹窗
  - [ ] u-popup正常打开（依赖WS-M0-001）
  - [ ] u-switch可切换状态
  - [ ] 保存设置功能
- [ ] 验证退出登录
  - [ ] 点击"退出登录"按钮
  - [ ] 清除登录数据
  - [ ] 跳转到首页
  - [ ] 再次打开个人中心显示"未登录"

**验证命令**:
```bash
# 启动开发环境
npm run dev:mp-weixin

# 手动测试home.vue所有功能
```

---

#### 1.2 代码审查（30min）

**审查内容**:

1. **组件引用**
   ```vue
   <!-- 检查uView组件使用 -->
   <u-popup v-model="showSubscriptionPopup" mode="bottom" height="60%" border-radius="24">
   <u-switch v-model="subscription.enabled" @change="handleSwitchChange"></u-switch>
   ```
   - 确认：依赖WS-M0-001的uView安装

2. **数据获取逻辑**
   ```javascript
   refreshProfile() {
     this.authed = isAuthed();
     const loginData = getLoginData();
     // 计算显示名称
     let displayName = '';
     if (userInfo.nickname) {
       displayName = userInfo.nickname;
     } else if (userInfo.username) {
       displayName = userInfo.username;
     } else if (uid) {
       displayName = uid.substring(uid.length - 6);
     }
   }
   ```
   - 确认：逻辑完善，有优先级，有兜底

3. **事件监听**
   ```javascript
   onLoad() {
     uni.$on('AUTH_CHANGED', this.onAuthChanged);
     this.refreshProfile();
   }
   
   onAuthChanged(data) {
     this.refreshProfile();
   }
   ```
   - 确认：监听AUTH_CHANGED事件，自动刷新

4. **退出登录逻辑**
   ```javascript
   handleLogout() {
     clearLoginData();
     this.refreshProfile();
   }
   ```
   - 确认：清理干净，刷新UI

**审查结论**: ✅ 代码质量高，无需修改

---

### Step 2: 开发profile.vue（2h）

#### 2.1 页面布局设计（30min）

**布局结构**:

```vue
<template>
  <view class="profile-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="nav-left" @tap="handleBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="nav-title">
        <text>个人资料</text>
      </view>
      <view class="nav-right"></view>
    </view>
    
    <!-- 头像编辑区 -->
    <view class="avatar-section">
      <view class="avatar-container" @tap="handleAvatarClick">
        <image v-if="formData.avatar" :src="formData.avatar" class="avatar-image" />
        <view v-else class="avatar-placeholder">
          <text>点击上传头像</text>
        </view>
        <view class="avatar-mask">
          <text class="camera-icon">📷</text>
        </view>
      </view>
      <view class="avatar-tip">
        <text>点击更换头像</text>
      </view>
    </view>
    
    <!-- 表单区域 -->
    <view class="form-section">
      <u-form :model="formData" ref="uForm">
        <!-- 昵称 -->
        <u-form-item label="昵称" prop="nickname" required>
          <u-input 
            v-model="formData.nickname" 
            placeholder="请输入昵称（2-20字符）"
            maxlength="20"
            :disabled="saving"
          />
        </u-form-item>
        
        <!-- 性别 -->
        <u-form-item label="性别" prop="gender">
          <u-radio-group v-model="formData.gender" :disabled="saving">
            <u-radio name="male" label="男"></u-radio>
            <u-radio name="female" label="女"></u-radio>
            <u-radio name="other" label="其他"></u-radio>
          </u-radio-group>
        </u-form-item>
        
        <!-- 生日 -->
        <u-form-item label="生日" prop="birthday">
          <u-input 
            v-model="formData.birthday" 
            placeholder="请选择生日"
            type="select"
            @click="showBirthdayPicker = true"
            :disabled="saving"
          />
        </u-form-item>
        
        <!-- 个人简介 -->
        <u-form-item label="个人简介" prop="bio">
          <u-textarea 
            v-model="formData.bio" 
            placeholder="介绍一下自己吧（最多200字）"
            maxlength="200"
            :disabled="saving"
            count
          />
        </u-form-item>
      </u-form>
    </view>
    
    <!-- 保存按钮 -->
    <view class="save-section">
      <u-button 
        type="primary" 
        :disabled="!canSave || saving"
        :loading="saving"
        @click="handleSave"
      >
        {{ saving ? '保存中...' : '保存' }}
      </u-button>
    </view>
    
    <!-- 生日选择器 -->
    <u-datetime-picker
      v-model="showBirthdayPicker"
      mode="date"
      :value="formData.birthday"
      @confirm="handleBirthdayConfirm"
    ></u-datetime-picker>
    
    <!-- 加载遮罩 -->
    <view v-if="uploading" class="uploading-mask">
      <view class="uploading-content">
        <u-loading mode="circle"></u-loading>
        <text class="uploading-text">上传中...</text>
      </view>
    </view>
  </view>
</template>
```

**设计要点**:
1. 自定义导航栏（与home.vue一致）
2. 头像区域突出显示，点击可上传
3. 表单使用uView组件，风格统一
4. 保存按钮固定在底部
5. 加载状态清晰展示

---

#### 2.2 Script逻辑实现（1h）

**完整Script结构**:

```javascript
<script>
import { 
  isAuthed, 
  getLoginData, 
  saveLoginData,
  getUserInfo 
} from '@/utils/auth.js';
import { callCloudFunction } from '@/utils/unicloud-handler.js';

export default {
  data() {
    return {
      // 导航栏
      statusBarHeight: 0,
      navHeight: 0,
      
      // 表单数据
      formData: {
        nickname: '',
        avatar: '',
        gender: '',
        birthday: '',
        bio: ''
      },
      
      // 原始数据（用于对比是否修改）
      originalData: {},
      
      // 状态
      saving: false,
      uploading: false,
      loading: true,
      
      // UI状态
      showBirthdayPicker: false,
      
      // 用户信息
      uid: '',
    };
  },
  
  computed: {
    // 是否有修改
    isModified() {
      return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
    },
    
    // 是否可以保存
    canSave() {
      return this.isModified && 
             this.formData.nickname && 
             this.formData.nickname.length >= 2;
    }
  },
  
  onLoad() {
    console.log('[PROFILE_EDIT] 页面加载');
    
    // 初始化导航栏
    this.initNavbar();
    
    // 检查登录态
    if (!isAuthed()) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/login/login' });
      }, 500);
      return;
    }
    
    // 加载用户信息
    this.loadUserInfo();
  },
  
  methods: {
    // 初始化导航栏
    initNavbar() {
      try {
        const systemInfo = uni.getSystemInfoSync();
        this.statusBarHeight = systemInfo.statusBarHeight || 20;
        const capsule = uni.getMenuButtonBoundingClientRect();
        this.navHeight = this.statusBarHeight + capsule.height + (capsule.top - this.statusBarHeight) * 2;
      } catch (error) {
        console.error('[PROFILE_EDIT] 导航栏初始化失败:', error);
        this.statusBarHeight = 20;
        this.navHeight = 64;
      }
    },
    
    // 加载用户信息
    async loadUserInfo() {
      try {
        this.loading = true;
        
        // 从本地缓存获取
        const loginData = getLoginData();
        this.uid = loginData.uid || '';
        const userInfo = loginData.userInfo || {};
        
        console.log('[PROFILE_EDIT] 本地用户信息:', userInfo);
        
        // 填充表单
        this.formData = {
          nickname: userInfo.nickname || '',
          avatar: userInfo.avatar || '',
          gender: userInfo.gender || '',
          birthday: userInfo.birthday || '',
          bio: userInfo.bio || ''
        };
        
        // 保存原始数据
        this.originalData = JSON.parse(JSON.stringify(this.formData));
        
        // 可选：调用云函数获取最新数据
        try {
          const result = await callCloudFunction('auth-me', {}, {
            showLoading: false,
            showError: false,
            timeout: 5000
          });
          
          if (result && result.userInfo) {
            console.log('[PROFILE_EDIT] 云端用户信息:', result.userInfo);
            // 合并云端数据
            this.formData = {
              ...this.formData,
              ...result.userInfo
            };
            this.originalData = JSON.parse(JSON.stringify(this.formData));
          }
        } catch (error) {
          console.warn('[PROFILE_EDIT] 获取云端数据失败，使用本地数据:', error);
        }
        
        this.loading = false;
        
      } catch (error) {
        console.error('[PROFILE_EDIT] 加载用户信息失败:', error);
        this.loading = false;
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 头像点击
    handleAvatarClick() {
      if (this.saving || this.uploading) {
        return;
      }
      
      uni.showActionSheet({
        itemList: ['从相册选择', '拍照'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.chooseAndUploadAvatar('album');
          } else if (res.tapIndex === 1) {
            this.chooseAndUploadAvatar('camera');
          }
        }
      });
    },
    
    // 选择并上传头像
    async chooseAndUploadAvatar(sourceType) {
      try {
        this.uploading = true;
        
        // 1. 选择图片
        const chooseResult = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: [sourceType]
        });
        
        const tempFilePath = chooseResult.tempFilePaths[0];
        console.log('[PROFILE_EDIT] 选择图片:', tempFilePath);
        
        // 2. 压缩图片（如果>500KB）
        const fileInfo = await uni.getFileInfo({ filePath: tempFilePath });
        let uploadPath = tempFilePath;
        
        if (fileInfo.size > 500 * 1024) {
          console.log('[PROFILE_EDIT] 图片过大，压缩中...');
          const compressResult = await uni.compressImage({
            src: tempFilePath,
            quality: 80,
            width: 400,
            height: 400
          });
          uploadPath = compressResult.tempFilePath;
        }
        
        // 3. 上传到云存储
        const cloudPath = `avatars/${this.uid}_${Date.now()}.jpg`;
        console.log('[PROFILE_EDIT] 上传到云存储:', cloudPath);
        
        const uploadResult = await uniCloud.uploadFile({
          filePath: uploadPath,
          cloudPath: cloudPath,
          cloudPathAsRealPath: true,
          onUploadProgress: (progress) => {
            console.log('[PROFILE_EDIT] 上传进度:', progress.loaded, '/', progress.total);
          }
        });
        
        console.log('[PROFILE_EDIT] 上传成功:', uploadResult);
        
        // 4. 获取文件URL
        const fileURL = uploadResult.fileID || uploadResult.tempFileURL;
        
        // 5. 更新表单数据
        this.formData.avatar = fileURL;
        
        uni.showToast({
          title: '头像上传成功',
          icon: 'success'
        });
        
        this.uploading = false;
        
      } catch (error) {
        console.error('[PROFILE_EDIT] 头像上传失败:', error);
        this.uploading = false;
        
        uni.showToast({
          title: '头像上传失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 生日确认
    handleBirthdayConfirm(value) {
      this.formData.birthday = value;
      this.showBirthdayPicker = false;
    },
    
    // 表单验证
    validateForm() {
      const errors = [];
      
      // 昵称验证
      if (!this.formData.nickname) {
        errors.push({ field: 'nickname', message: '昵称不能为空' });
      } else if (this.formData.nickname.length < 2) {
        errors.push({ field: 'nickname', message: '昵称至少2个字符' });
      } else if (this.formData.nickname.length > 20) {
        errors.push({ field: 'nickname', message: '昵称最多20个字符' });
      } else if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(this.formData.nickname)) {
        errors.push({ field: 'nickname', message: '昵称仅支持中英文、数字、下划线' });
      }
      
      // 简介验证
      if (this.formData.bio && this.formData.bio.length > 200) {
        errors.push({ field: 'bio', message: '个人简介最多200字' });
      }
      
      // 生日验证
      if (this.formData.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(this.formData.birthday)) {
        errors.push({ field: 'birthday', message: '生日格式应为YYYY-MM-DD' });
      }
      
      return errors;
    },
    
    // 保存
    async handleSave() {
      if (this.saving) {
        return;
      }
      
      // 验证表单
      const errors = this.validateForm();
      if (errors.length > 0) {
        uni.showToast({
          title: errors[0].message,
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      try {
        this.saving = true;
        
        // 调用云函数更新
        console.log('[PROFILE_EDIT] 调用云函数更新:', this.formData);
        const result = await callCloudFunction('user-update-profile', {
          nickname: this.formData.nickname,
          avatar: this.formData.avatar,
          gender: this.formData.gender,
          birthday: this.formData.birthday,
          bio: this.formData.bio
        }, {
          showLoading: true,
          loadingText: '保存中...',
          timeout: 10000
        });
        
        console.log('[PROFILE_EDIT] 云函数返回:', result);
        
        if (result && result.userInfo) {
          // 更新本地缓存
          const loginData = getLoginData();
          const newUserInfo = {
            ...loginData.userInfo,
            ...result.userInfo
          };
          
          uni.setStorageSync('uni_id_user_info', JSON.stringify(newUserInfo));
          console.log('[PROFILE_EDIT] 本地缓存已更新');
          
          // 触发全局事件，通知其他页面刷新
          uni.$emit('AUTH_CHANGED', { authed: true });
          
          // 显示成功提示
          uni.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
          });
          
          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          throw new Error('返回数据格式异常');
        }
        
        this.saving = false;
        
      } catch (error) {
        console.error('[PROFILE_EDIT] 保存失败:', error);
        this.saving = false;
        
        uni.showToast({
          title: error.message || '保存失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 返回处理
    handleBack() {
      if (this.isModified) {
        uni.showModal({
          title: '提示',
          content: '资料已修改，确定放弃保存？',
          success: (res) => {
            if (res.confirm) {
              uni.navigateBack();
            }
          }
        });
      } else {
        uni.navigateBack();
      }
    }
  }
};
</script>
```

**关键逻辑说明**:
1. **登录态检查**: onLoad时检查isAuthed()
2. **数据加载**: 本地缓存 + 云端数据（可选）
3. **表单验证**: 前端验证昵称、简介等
4. **头像上传**: 选择→压缩→上传→更新表单
5. **保存逻辑**: 验证→云函数→本地缓存→返回
6. **返回确认**: 有修改时提示确认

---

#### 2.3 样式实现（30min）

**样式设计原则**:
- 复用home.vue的液态玻璃风格
- 卡片式布局，圆角24rpx
- 统一色调：#007AFF（主色）
- 统一间距：32rpx / 40rpx

**关键样式**:

```css
<style scoped>
.profile-page {
  min-height: 100vh;
  background: #F0F0F5;
}

/* 导航栏（复用home.vue样式） */
.custom-navbar {
  background: #FFFFFF;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
}

/* 头像编辑区 */
.avatar-section {
  padding: 60rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #FFFFFF;
}

.avatar-container {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  position: relative;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #F0F0F5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-icon {
  font-size: 24rpx;
  color: #FFFFFF;
}

/* 表单区域 */
.form-section {
  margin: 32rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

/* 保存按钮区 */
.save-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx;
  background: #FFFFFF;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
}

/* 上传遮罩 */
.uploading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.uploading-content {
  padding: 60rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.uploading-text {
  font-size: 28rpx;
  color: #666;
}
</style>
```

---

### Step 3: 开发云函数（1h）

#### 3.1 创建云函数目录结构（5min）

```bash
mkdir -p uniCloud-aliyun/cloudfunctions/user-update-profile
cd uniCloud-aliyun/cloudfunctions/user-update-profile
touch index.js package.json README.md
```

---

#### 3.2 实现index.js（40min）

完整代码见上方"新建文件明细"部分的详细实现。

**关键点**:
1. 使用CommonJS（module.exports）
2. 复用common模块（auth/db/response/validator）
3. 参数校验完善
4. 错误处理完善
5. 日志记录详细

---

#### 3.3 配置package.json（5min）

```json
{
  "name": "user-update-profile",
  "version": "1.0.0",
  "description": "更新用户资料云函数",
  "main": "index.js",
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0",
    "uni-id": "^3.0.0"
  },
  "cloudfunction-config": {
    "timeout": 10,
    "memorySize": 256
  }
}
```

---

#### 3.4 编写云函数README（10min）

```markdown
# user-update-profile 云函数

## 功能
更新用户个人资料信息到Supabase数据库

## 请求参数
\`\`\`json
{
  "nickname": "string (2-20字符, 可选)",
  "avatar": "string (URL, 可选)",
  "gender": "string (male/female/other, 可选)",
  "birthday": "string (YYYY-MM-DD, 可选)",
  "bio": "string (≤200字, 可选)"
}
\`\`\`

## 响应格式
\`\`\`json
{
  "errCode": 0,
  "errMsg": "更新成功",
  "data": {
    "userInfo": {
      "id": "user_id",
      "nickname": "新昵称",
      "avatar": "新头像URL",
      ...
    }
  }
}
\`\`\`

## 错误码
- 400: 参数错误
- 401: 未授权（token无效）
- 500: 服务器错误

## 依赖
- common/auth: Token验证
- common/db: Supabase操作
- common/response: 响应格式化
- common/validator: 参数校验

## 测试
\`\`\`bash
# 本地测试（需配置环境变量）
node test-local.js
\`\`\`
```

---

### Step 4: 集成测试（30min）

见 TESTS.md

---

## 八、风险控制详细措施

### 8.1 工时风险

**风险**: profile.vue开发量大，4h可能不够

**缓解措施**:

1. **简化首版功能**
   - MVP：仅昵称、头像、简介
   - 延后：性别、生日（可M1后期补充）

2. **复用现有代码**
   - 复用home.vue的导航栏样式
   - 复用home.vue的卡片样式
   - 参考home.vue的布局结构

3. **使用uView组件**
   - u-form自动处理表单逻辑
   - u-input自动处理输入
   - 减少自定义开发

**应急方案**: 延后非核心字段编辑功能

---

### 8.2 头像上传风险

**风险**: 头像上传失败率高

**缓解措施**:

1. **图片压缩**
   ```javascript
   // 限制大小
   if (fileInfo.size > 500 * 1024) {
     await uni.compressImage({
       quality: 80,
       width: 400,
       height: 400
     });
   }
   ```

2. **重试机制**
   ```javascript
   let retryCount = 0;
   while (retryCount < 3) {
     try {
       await uniCloud.uploadFile({...});
       break;
     } catch (error) {
       retryCount++;
       if (retryCount >= 3) throw error;
       await sleep(1000);
     }
   }
   ```

3. **降级方案**
   - 允许保存其他信息，头像保持原样
   - 提示"头像上传失败，其他信息已保存"

---

### 8.3 数据同步风险

**风险**: Supabase更新失败

**缓解措施**:

1. **本地先更新**
   ```javascript
   // 方案A: 先本地，后云端（乐观更新）
   updateLocalCache(formData);
   triggerAuthChanged();
   uni.navigateBack();
   
   // 后台同步
   syncToCloud(formData).catch(error => {
     console.error('后台同步失败:', error);
     // 标记为待同步
   });
   ```

2. **本工作流选择**: 先云端，后本地（更可靠）
   ```javascript
   // 云端成功后再更新本地
   const result = await cloudFunction();
   if (result.errCode === 0) {
     updateLocalCache(result.data.userInfo);
   }
   ```

---

## 九、Supabase表结构假设

### users表结构

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- 用户ID（微信openid）
  nickname TEXT,                    -- 昵称
  username TEXT,                    -- 用户名（可选）
  avatar TEXT,                      -- 头像URL
  gender TEXT,                      -- 性别: male/female/other
  birthday DATE,                    -- 生日
  bio TEXT,                         -- 个人简介
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**索引**:
```sql
CREATE INDEX idx_users_nickname ON users(nickname);
```

**RLS策略**（行级安全）:
```sql
-- 用户只能更新自己的记录
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
```

**注意**: 本工作流假设表结构已存在，由后端团队创建。如不存在，需要先创建表。

---

## 十、成功标准详细定义

### 10.1 功能标准（必达）

- [ ] **pages/user/home.vue验证**
  - [ ] 用户信息正确显示（头像/昵称/uid）
  - [ ] 点击"个人资料"可跳转到profile页
  - [ ] 退出登录功能正常
  - [ ] 订阅设置弹窗正常（u-popup）

- [ ] **pages/user/profile.vue实现**
  - [ ] 页面加载显示当前用户信息
  - [ ] 昵称可编辑（u-input）
  - [ ] 头像可上传（chooseImage + uploadFile）
  - [ ] 性别可选择（u-radio-group）
  - [ ] 生日可选择（u-datetime-picker）
  - [ ] 简介可编辑（u-textarea）
  - [ ] 保存按钮功能正常
  - [ ] 有修改时返回需确认

- [ ] **云函数user-update-profile实现**
  - [ ] Token验证正常
  - [ ] 参数校验完善（昵称/简介/生日格式）
  - [ ] Supabase更新成功
  - [ ] 返回格式规范

- [ ] **数据同步**
  - [ ] 保存后云端数据更新
  - [ ] 保存后本地缓存更新
  - [ ] 返回home.vue显示更新后信息

---

### 10.2 质量标准（必达）

- [ ] **构建检查**
  ```bash
  npm run build:mp-weixin
  # 预期: Build complete. 0 errors
  ```

- [ ] **ESLint检查**
  ```bash
  npm run lint pages/user/profile.vue uniCloud-aliyun/cloudfunctions/user-update-profile/index.js
  # 预期: 0 errors
  ```

- [ ] **云函数CJS检查**
  ```bash
  npm run check:esm
  # 预期: ✅ 所有云函数使用CJS
  ```

- [ ] **uView组件检查**
  ```bash
  npm run check:ui
  # 预期: ✅ 未发现uni-ui混用
  ```

- [ ] **Supabase直连检查**
  ```bash
  npm run check:supabase
  # 预期: ✅ 前端无直连
  ```

---

### 10.3 性能标准（必达）

- [ ] **页面加载时间**
  ```javascript
  // profile.vue onLoad
  const startTime = Date.now();
  await this.loadUserInfo();
  const endTime = Date.now();
  console.log('加载耗时:', endTime - startTime, 'ms');
  // 目标: < 1000ms
  ```

- [ ] **保存响应时间**
  ```javascript
  const startTime = Date.now();
  await handleSave();
  const endTime = Date.now();
  // 目标: < 2000ms
  ```

- [ ] **头像上传时间**
  ```javascript
  // 目标: < 5s (压缩+上传)
  ```

- [ ] **包体积影响**
  ```bash
  # profile.vue约500行，约20KB
  # 云函数约150行，不影响前端包
  # 预计增长: < 50KB
  ```

---

## 十一、验收清单（DoD - Definition of Done）

### 构建检查
- [ ] ✅ npm run build:mp-weixin → 0 errors

### Node16 CJS
- [ ] ✅ user-update-profile使用module.exports
- [ ] ✅ npm run check:esm → 通过

### uView 2.x唯一
- [ ] ✅ profile.vue仅使用u-组件
- [ ] ✅ npm run check:ui → 通过

### 前端禁直连Supabase
- [ ] ✅ profile.vue无createClient
- [ ] ✅ npm run check:supabase → 通过

### 无明文密钥
- [ ] ✅ 代码中无API Key
- [ ] ✅ npm run lint → 无密钥相关error

### 语音不落原音频
- [ ] N/A（本工作流不涉及语音）

### 首包≤2MB
- [ ] ✅ 新增代码<50KB
- [ ] ✅ 构建后主包大小检查

### P95≤800ms
- [ ] ✅ 页面加载<1s
- [ ] ✅ 保存响应<2s

### 端到端回归通过
- [ ] ✅ 完整流程测试通过
- [ ] ✅ 异常场景测试通过

---

**计划状态**: ✅ 已完成  
**审核人**: _______  
**批准实施**: [ ] 是  [ ] 否

