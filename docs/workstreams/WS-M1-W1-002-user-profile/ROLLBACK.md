# WS-M1-W1-002: 回滚方案 (ROLLBACK) - 完整版

**工作流ID**: WS-M1-W1-002  
**分支**: `feat/WS-M1-W1-002-user-profile`  
**风险等级**: 低（新增代码，复用文件未改动，回滚简单）

---

## 一、回滚触发条件

### 1.1 必须回滚场景（P0 - 立即回滚）

- [ ] **profile.vue严重bug导致页面崩溃**
  - 白屏无法访问
  - 影响其他页面
  - 用户无法使用个人中心

- [ ] **云函数导致数据损坏**
  - 错误更新用户数据
  - 数据丢失
  - 影响多个用户

- [ ] **性能严重下降**
  - 保存时间>30s
  - 页面加载>10s
  - 导致应用卡死

- [ ] **安全问题**
  - 密钥泄露
  - 用户数据泄露
  - 权限绕过

---

### 1.2 可选回滚场景（P1-P2 - 评估后决定）

- [ ] **头像上传失败率>50%**
  - 可降级：禁用头像上传功能
  - 保留其他编辑功能

- [ ] **云函数偶发错误**
  - 错误率<10%
  - 可临时关闭功能
  - 排查修复后重新上线

- [ ] **UI显示问题**
  - 个别设备样式错位
  - 可用性不受影响
  - 可后续修复

---

## 二、回滚方案选择

### 方案A：完全回滚（推荐，风险最低）

**适用场景**: P0问题，需要立即回滚

**回滚内容**:
1. 删除 profile.vue
2. 删除 user-update-profile 云函数
3. 恢复 profile.vue 为占位页
4. 验证原有功能

**预计时间**: 10min  
**风险**: 极低（回到已知稳定状态）  
**影响**: 个人资料编辑功能不可用，其他功能正常

---

### 方案B：部分回滚（保留部分功能）

**适用场景**: 仅个别功能有问题

**回滚内容**:
1. 保留 profile.vue 基本展示
2. 禁用有问题的功能（如头像上传）
3. 保留昵称编辑等正常功能

**预计时间**: 15min  
**风险**: 低  
**影响**: 部分功能不可用

---

### 方案C：功能降级（最小影响）

**适用场景**: 仅性能或体验问题

**回滚内容**:
1. 保留所有代码
2. 添加功能开关（可通过配置控制）
3. 临时禁用问题功能

**预计时间**: 5min  
**风险**: 低  
**影响**: 最小

---

## 三、完全回滚详细步骤（方案A）

### Step 1: 准备回滚（5min）

#### 1.1 创建回滚分支（备份当前状态）

```bash
# 创建回滚备份分支
git checkout -b backup/WS-M1-W1-002-rollback-$(date +%Y%m%d-%H%M%S)

# 记录回滚原因
cat > rollback-reason.txt << EOF
回滚工作流: WS-M1-W1-002
回滚时间: $(date)
回滚原因: [填写具体原因]
影响范围: 个人资料编辑功能
回滚方案: 方案A - 完全回滚
EOF

# 提交备份
git add rollback-reason.txt
git commit -m "backup: WS-M1-W1-002回滚前备份"
```

---

#### 1.2 切换回主分支

```bash
# 切换到main分支
git checkout main

# 或者切换到工作流开始前的commit
git log --oneline | grep "WS-M1-W1-002" -B 5
# 找到WS-M1-W1-002之前的commit hash
git checkout <commit-hash>
```

---

### Step 2: 删除新增文件（3min）

#### 2.1 删除前端文件

```bash
# 删除profile.vue（如果已创建新版本）
# 注意：保留原占位版本或删除后恢复
rm pages/user/profile.vue
```

---

#### 2.2 恢复profile.vue占位页

```bash
# 恢复为简单占位页
cat > pages/user/profile.vue << 'EOF'
<template>
  <view class="page">
    <view class="card">
      <text class="text-muted">个人资料</text>
    </view>
    <view class="info-text">
      <text>个人资料编辑功能开发中...</text>
    </view>
    <view class="row" style="margin-top: 32rpx;">
      <button class="btn-secondary" @click="handleBack">返回</button>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    handleBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.page {
  padding: 32rpx;
}

.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
}

.text-muted {
  font-size: 32rpx;
  color: #666;
}

.info-text {
  text-align: center;
  padding: 60rpx 0;
}

.info-text text {
  font-size: 28rpx;
  color: #999;
}

.row {
  display: flex;
  justify-content: center;
}

.btn-secondary {
  background: #E3E3E8;
  color: #333;
  border: none;
  border-radius: 8rpx;
  padding: 24rpx 48rpx;
  font-size: 28rpx;
}
</style>
EOF

echo "✅ 已恢复profile.vue为占位页"
```

---

#### 2.3 删除云函数目录

```bash
# 删除整个云函数目录
rm -rf uniCloud-aliyun/cloudfunctions/user-update-profile

echo "✅ 已删除user-update-profile云函数"
```

---

### Step 3: 验证回滚（5min）

#### 3.1 验证文件状态

```bash
# 1. 检查profile.vue已恢复
cat pages/user/profile.vue | head -20
# 预期: 显示占位页内容

# 2. 检查云函数已删除
ls uniCloud-aliyun/cloudfunctions/user-update-profile
# 预期: No such file or directory

# 3. 检查复用文件未改动
git diff pages/user/home.vue
git diff utils/auth.js
# 预期: 无diff（未修改）
```

---

#### 3.2 验证构建

```bash
# 构建测试
npm run build:mp-weixin

# 预期: 构建成功，无error
```

---

#### 3.3 验证功能

**手动测试**:
1. 启动开发环境: `npm run dev:mp-weixin`
2. 登录后打开个人中心: ✅ 正常
3. 点击"个人资料": 显示占位页"功能开发中"
4. 点击"返回": 返回个人中心
5. 测试其他功能: ✅ 正常

**验证清单**:
- [ ] home.vue功能正常
- [ ] profile.vue显示占位页
- [ ] 退出登录正常
- [ ] 其他功能不受影响

---

### Step 4: 提交回滚（2min）

```bash
# 添加变更
git add pages/user/profile.vue
git add uniCloud-aliyun/cloudfunctions/

# 提交回滚
git commit -m "Revert: WS-M1-W1-002 个人资料编辑功能

回滚原因: [填写具体原因]

变更内容:
- 删除profile.vue完整实现（520行）
- 恢复profile.vue为占位页（约100行）
- 删除user-update-profile云函数（180行）

验证:
- 构建成功
- home.vue功能正常
- profile.vue显示占位页
- 其他功能不受影响

影响:
- 个人资料编辑功能暂时不可用
- 其他功能正常

后续计划:
- 分析回滚原因
- 修复问题
- 重新实施

Related: #WS-M1-W1-002
"

# 推送到远程（如需要）
git push origin main
# 或
git push origin feat/WS-M1-W1-002-user-profile-rollback
```

---

### Step 5: 通知与跟进（即时）

#### 5.1 通知团队

**通知模板**:
```markdown
## 🔴 回滚通知：WS-M1-W1-002

**工作流**: WS-M1-W1-002 个人资料编辑功能  
**回滚时间**: [时间]  
**回滚人**: [姓名]  
**回滚方案**: 方案A - 完全回滚

### 回滚原因
[详细描述问题]

### 当前状态
- ❌ 个人资料编辑功能已回滚
- ✅ 个人中心显示正常
- ✅ 其他功能正常
- ✅ profile页面显示"功能开发中"占位页

### 影响范围
- **用户影响**: 无法编辑个人资料（临时）
- **功能影响**: 个人中心其他功能正常
- **数据影响**: 无（未上线，无用户数据）

### 后续计划
1. 根因分析会议: [时间]
2. 修复问题: [预计时间]
3. 重新测试: [预计时间]
4. 重新上线: [预计时间]

### 联系人
- 技术负责人: [姓名] [电话]
- 项目经理: [姓名] [电话]

**链接**:
- 回滚PR: #___
- 问题Issue: #___
- 回滚分析: docs/retrospectives/WS-M1-W1-002-rollback-analysis.md
```

发送到：
- [ ] 团队群
- [ ] 项目经理
- [ ] Tech Lead

---

#### 5.2 创建问题Issue

```markdown
## Issue: WS-M1-W1-002回滚

### 问题描述
[详细描述导致回滚的问题]

### 重现步骤
1. ...
2. ...
3. ...

### 预期行为
[应该怎样]

### 实际行为
[实际发生了什么]

### 环境信息
- 平台: 微信小程序 vX.X.X
- 设备: iPhone 12 / 小米XX
- Node: 16.x.x
- 分支: feat/WS-M1-W1-002-user-profile

### 日志/截图
[附上相关日志或截图]

### 优先级
- [ ] P0 - 严重问题
- [ ] P1 - 需修复
- [ ] P2 - 可延后

### 负责人
- 开发: 前端A
- 跟进: Tech Lead

### 相关链接
- 回滚PR: #___
- 回滚分析: docs/retrospectives/WS-M1-W1-002-rollback-analysis.md
```

---

#### 5.3 根因分析文档

创建 `docs/retrospectives/WS-M1-W1-002-rollback-analysis.md`:

```markdown
# WS-M1-W1-002 回滚根因分析

## 基本信息

- **工作流**: WS-M1-W1-002 个人资料编辑功能
- **回滚时间**: [时间]
- **回滚方案**: 方案A - 完全回滚
- **影响范围**: 个人资料编辑功能不可用

---

## 问题现象

### 问题描述
[详细描述回滚的直接原因]

### 问题发现时间
[什么时候发现的问题]

### 问题影响
- 用户影响: ___
- 功能影响: ___
- 数据影响: ___

---

## 根因分析（5 Whys）

### Why 1: 为什么发生这个问题？
[第一层原因]

### Why 2: 为什么会有这个原因？
[第二层原因]

### Why 3: 为什么会导致第二层原因？
[第三层原因]

### Why 4: 为什么会有这个深层原因？
[第四层原因]

### Why 5: 根本原因是什么？
[根本原因]

---

## 问题分类

- [ ] **代码bug** - 代码逻辑错误
- [ ] **测试不足** - 测试覆盖不完整
- [ ] **环境问题** - 开发/测试/生产环境差异
- [ ] **依赖问题** - 第三方库或依赖版本问题
- [ ] **设计缺陷** - 方案设计不合理
- [ ] **沟通问题** - 需求理解偏差

---

## 改进措施

### 短期措施（立即执行）

1. **代码修复**
   - [ ] 修复具体bug
   - [ ] 增加边界检查
   - [ ] 补充错误处理

2. **测试补充**
   - [ ] 添加遗漏的测试用例
   - [ ] 增加异常场景测试
   - [ ] 多设备测试

---

### 中期措施（1-2周内）

1. **流程改进**
   - [ ] Code Review更严格
   - [ ] 测试标准提升
   - [ ] 增加集成测试

2. **工具支持**
   - [ ] 自动化测试覆盖率监控
   - [ ] 性能监控
   - [ ] 错误追踪系统

---

### 长期措施（持续改进）

1. **技术提升**
   - [ ] 团队技术培训
   - [ ] 最佳实践分享
   - [ ] 代码质量标准

2. **流程优化**
   - [ ] 发布流程优化
   - [ ] 灰度发布策略
   - [ ] 快速回滚机制

---

## 经验教训

### 做得好的地方
1. ___
2. ___

### 需要改进的地方
1. ___
2. ___

### 避免再次发生
1. ___
2. ___

---

## 新方案

### 方案选项

#### 选项1: 修复后重新实施（推荐）

**步骤**:
1. 修复bug
2. 补充测试
3. Code Review
4. 小范围试点
5. 全面上线

**预计时间**: ___

---

#### 选项2: 简化方案

**步骤**:
1. 简化profile.vue功能（仅昵称编辑）
2. 暂不实现头像上传
3. 延后其他字段编辑

**预计时间**: ___

---

#### 选项3: 延后实施

**步骤**:
1. 暂不实施个人资料编辑
2. M1阶段完成后再考虑
3. M2阶段重新设计

**预计时间**: ___

---

### 决策

- [ ] 选项1: 修复后重新实施
- [ ] 选项2: 简化方案
- [ ] 选项3: 延后实施

**决策人**: _______  
**决策时间**: _______

---

## 附录: 问题详情

[附上详细的日志、截图、错误堆栈等]
```

---

## 四、部分回滚详细步骤（方案B）

### 场景1: 仅头像上传有问题

**保留功能**:
- ✅ 昵称编辑
- ✅ 性别选择
- ✅ 生日选择
- ✅ 简介编辑

**禁用功能**:
- ❌ 头像上传

**实施步骤**:

#### Step 1: 修改profile.vue（5min）

```diff
 <template>
   <view class="profile-page">
     <!-- 头像编辑区 -->
-    <view class="avatar-section">
-      <view class="avatar-container" @tap="handleAvatarClick">
-        ...
-      </view>
-    </view>
+    <!-- 头像上传功能暂时关闭 -->
+    <view class="avatar-section">
+      <view class="avatar-container">
+        <image v-if="formData.avatar" :src="formData.avatar" class="avatar-image" />
+        <view v-else class="avatar-placeholder">
+          <text>暂不支持修改头像</text>
+        </view>
+      </view>
+      <view class="avatar-tip">
+        <text class="tip-text">头像上传功能维护中...</text>
+      </view>
+    </view>
     
     <!-- 表单区域 - 保持不变 -->
     ...
   </view>
 </template>
 
 <script>
 export default {
   methods: {
-    handleAvatarClick() {
-      // 头像上传逻辑
-    },
-    
-    async chooseAndUploadAvatar(sourceType) {
-      // 头像上传逻辑
-    },
+    // 头像上传方法已禁用
     
     // 其他方法保持不变
   }
 };
 </script>
```

---

#### Step 2: 修改云函数（可选，5min）

```diff
 // user-update-profile/index.js
 
 exports.main = async (event, context) => {
   try {
     // Token验证...
     
     const { nickname, avatar, gender, birthday, bio } = event;
     const updates = {};
     
     if (nickname !== undefined) updates.nickname = nickname;
-    if (avatar !== undefined) updates.avatar = avatar;
+    // 头像更新暂时禁用
+    // if (avatar !== undefined) updates.avatar = avatar;
     if (gender !== undefined) updates.gender = gender;
     if (birthday !== undefined) updates.birthday = birthday;
     if (bio !== undefined) updates.bio = bio;
     
     // 其他逻辑保持不变...
   }
 };
```

---

#### Step 3: 提交部分回滚（2min）

```bash
git add pages/user/profile.vue
git add uniCloud-aliyun/cloudfunctions/user-update-profile/index.js

git commit -m "fix: 临时禁用头像上传功能

原因: 头像上传失败率高，暂时关闭

变更:
- 禁用profile.vue头像上传入口
- 云函数不处理avatar字段
- 保留其他编辑功能

后续:
- 排查头像上传问题
- 修复后重新启用

Related: #WS-M1-W1-002
"
```

---

### 场景2: 仅云函数有问题

**保留功能**:
- ✅ profile.vue UI正常
- ✅ 表单输入正常

**禁用功能**:
- ❌ 保存到云端
- ✅ 临时：仅本地更新

**实施步骤**:

#### Step 1: 修改profile.vue保存逻辑（10min）

```diff
 async handleSave() {
   // 表单验证...
   
   try {
     this.saving = true;
     
-    // 调用云函数更新
-    const result = await callCloudFunction('user-update-profile', {...});
-    
-    if (result && result.userInfo) {
-      // 更新本地缓存
-      this.updateLocalCache(result.userInfo);
-      // ...
-    }
+    // 临时方案：仅本地更新（云函数维护中）
+    console.warn('[PROFILE_EDIT] 云函数维护中，仅本地更新');
+    
+    // 直接更新本地缓存
+    this.updateLocalCache(this.formData);
+    
+    // 标记为待同步
+    const pendingSync = uni.getStorageSync('pending_sync') || [];
+    pendingSync.push({
+      type: 'updateProfile',
+      data: this.formData,
+      timestamp: Date.now()
+    });
+    uni.setStorageSync('pending_sync', pendingSync);
+    
+    // 提示用户
+    uni.showToast({
+      title: '已保存到本地，将在服务恢复后同步',
+      icon: 'none',
+      duration: 3000
+    });
     
     this.saving = false;
     
     // 返回上一页
     setTimeout(() => {
       uni.navigateBack();
     }, 1500);
     
   } catch (error) {
     // 错误处理...
   }
 }
```

---

#### Step 2: 提交降级方案（2min）

```bash
git add pages/user/profile.vue

git commit -m "fix: 个人资料编辑降级为本地更新

原因: 云函数user-update-profile暂时不可用

变更:
- 保存时仅更新本地缓存
- 标记为待同步（pending_sync）
- 提示用户将稍后同步

后续:
- 修复云函数
- 实现后台自动同步

Related: #WS-M1-W1-002
"
```

---

## 五、功能降级步骤（方案C）

### 场景: 功能可用但需要开关控制

**实施步骤**:

#### Step 1: 添加功能开关（5min）

**创建配置文件**: `common/feature-flags.js`

```javascript
/**
 * 功能开关配置
 */
export default {
  // 个人资料编辑功能
  enableProfileEdit: false, // 临时关闭
  
  // 头像上传功能
  enableAvatarUpload: false, // 临时关闭
  
  // 其他功能...
};
```

---

#### Step 2: 在代码中使用开关（5min）

```diff
 // profile.vue
+import featureFlags from '@/common/feature-flags.js';
+
 export default {
   onLoad() {
+    // 检查功能开关
+    if (!featureFlags.enableProfileEdit) {
+      uni.showModal({
+        title: '功能维护中',
+        content: '个人资料编辑功能暂时维护，请稍后再试',
+        showCancel: false,
+        success: () => {
+          uni.navigateBack();
+        }
+      });
+      return;
+    }
+    
     // 原有逻辑...
   },
   
   methods: {
     handleAvatarClick() {
+      if (!featureFlags.enableAvatarUpload) {
+        uni.showToast({
+          title: '头像上传功能维护中',
+          icon: 'none'
+        });
+        return;
+      }
+      
       // 原有逻辑...
     }
   }
 };
```

---

#### Step 3: 提交功能开关（2min）

```bash
git add common/feature-flags.js
git add pages/user/profile.vue

git commit -m "feat: 添加功能开关，临时关闭个人资料编辑

原因: 发现问题，需要修复

变更:
- 新增common/feature-flags.js
- profile.vue检查功能开关
- 功能关闭时显示维护提示

优势:
- 代码保留，问题修复后可快速启用
- 用户体验友好（有维护提示）
- 不影响其他功能

开关配置:
- enableProfileEdit: false
- enableAvatarUpload: false

Related: #WS-M1-W1-002
"
```

---

## 六、回滚验证清单

### 6.1 功能验证

- [ ] **个人中心（home.vue）**
  - 用户信息显示: ⬜ 正常
  - 点击"个人资料": ⬜ 跳转正常
  - 退出登录: ⬜ 正常
  - 其他功能: ⬜ 正常

- [ ] **个人资料页（profile.vue）**
  - 方案A: ⬜ 显示占位页
  - 方案B: ⬜ 部分功能禁用
  - 方案C: ⬜ 显示维护提示

- [ ] **其他页面**
  - 登录: ⬜ 正常
  - 首页: ⬜ 正常
  - 评估: ⬜ 正常

---

### 6.2 数据验证

- [ ] **本地数据**
  - uni_id_token: ⬜ 正常
  - uni_id_user_info: ⬜ 正常
  - 无脏数据: ⬜ 是

- [ ] **云端数据**
  - Supabase users表: ⬜ 无异常数据
  - 无数据损坏: ⬜ 是

---

### 6.3 构建验证

- [ ] **构建成功**
  ```bash
  npm run build:mp-weixin
  # 预期: 成功
  ```

- [ ] **包体积**
  ```bash
  du -sh unpackage/dist/build/mp-weixin/
  # 预期: 回到回滚前大小
  ```

---

## 七、回滚后恢复流程（当问题修复后）

### Step 1: 问题修复（时间视情况而定）

1. 根据根因分析修复bug
2. 补充测试用例
3. 本地验证修复效果
4. Code Review

---

### Step 2: 恢复代码（10min）

#### 方案A回滚的恢复

```bash
# 从备份分支恢复
git checkout backup/WS-M1-W1-002-rollback-YYYYMMDD-HHMMSS

# 或者重新checkout工作流分支
git checkout feat/WS-M1-W1-002-user-profile

# 应用bug修复
git cherry-pick <fix-commit-hash>

# 合并到main
git checkout main
git merge feat/WS-M1-W1-002-user-profile
```

---

#### 方案B/C回滚的恢复

```bash
# 启用功能开关
# 修改common/feature-flags.js
enableProfileEdit: true
enableAvatarUpload: true

# 或删除禁用代码
# 恢复原有逻辑
```

---

### Step 3: 测试验证（1h）

1. 运行完整测试套件
   ```bash
   ./test-ws-m1-w1-002-complete.sh
   ```

2. 手动回归测试（所有用例）

3. 性能测试

4. 多设备测试

---

### Step 4: 灰度发布（建议）

```
Day 1: 开发团队内部使用（5人）
Day 2: 扩大到10%用户
Day 3: 无问题，扩大到50%
Day 5: 无问题，全量发布
```

---

### Step 5: 监控（持续）

```javascript
// 添加监控埋点
handleSave() {
  // 记录保存成功/失败
  analytics.track('profile_save', {
    success: true/false,
    error: errorMessage,
    duration: saveDuration
  });
}
```

---

## 八、预防措施（未来）

### 8.1 开发阶段

- [ ] **需求确认**
  - 需求评审充分
  - 边界场景考虑
  - 技术方案review

- [ ] **开发规范**
  - 遵循coding guidelines
  - 使用TypeScript（可选）
  - 代码注释完整

- [ ] **单元测试**
  - 关键逻辑覆盖
  - 边界条件测试
  - Mock外部依赖

---

### 8.2 测试阶段

- [ ] **测试策略**
  - 测试用例全面
  - 异常场景覆盖
  - 性能测试
  - 兼容性测试

- [ ] **测试环境**
  - 环境与生产一致
  - 数据真实性
  - 多设备测试

---

### 8.3 发布阶段

- [ ] **发布策略**
  - 灰度发布
  - 监控指标
  - 快速回滚准备

- [ ] **应急预案**
  - 回滚方案ready
  - 联系人明确
  - 决策流程清晰

---

## 九、联系人

### 紧急联系（24h）

- **Tech Lead**: _______ (手机: _______)
- **项目经理**: _______ (手机: _______)
- **值班开发**: _______ (手机: _______)

### 技术支持

- **前端团队**: frontend-team@example.com
- **后端团队**: backend-team@example.com
- **运维团队**: devops-team@example.com

### 第三方支持

- **uniCloud技术支持**: https://ask.dcloud.net.cn/
- **Supabase Support**: https://supabase.com/support

---

## 十、回滚演练（建议定期进行）

### 演练目的

1. 验证回滚方案可行性
2. 熟悉回滚流程
3. 测试回滚时间
4. 发现潜在问题

### 演练步骤

1. **准备**（10min）
   - 选择非生产环境
   - 通知团队成员
   - 准备回滚脚本

2. **执行回滚**（10min）
   - 按方案A步骤执行
   - 记录每步耗时
   - 记录遇到的问题

3. **验证**（10min）
   - 功能验证
   - 数据验证
   - 构建验证

4. **总结**（10min）
   - 回滚耗时
   - 发现的问题
   - 改进建议

### 演练频率

- 建议：每季度一次
- 重要功能发布前必须演练

---

**回滚方案状态**: ✅ 已完成  
**最后更新**: 2025-10-12  
**审核人**: _______  
**特别提醒**: 本工作流回滚简单（新增代码，复用文件未改动），回滚风险极低

