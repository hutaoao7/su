# WS-M1-W1-003: 回滚方案

## 完全回滚（方案A）

**步骤**（15min）:
1. 删除pages/consent/目录（4个文件）
2. 删除consent-record云函数
3. 恢复route-guard.js/auth.js/App.vue
4. 恢复pages.json
5. 验证构建和功能

**影响**: 无同意管理功能，应用可直接使用

---

## 部分回滚（方案B）

**场景**: 仅路由守卫有问题

**步骤**（10min）:
1. 保留consent页面
2. 暂时关闭路由守卫的同意检查
3. 用户可选择性查看协议

---

## 功能降级（方案C）

**场景**: 云端记录失败

**步骤**（5min）:
1. 保留所有页面
2. 仅本地存储同意状态
3. 不调用云函数

---

# WS-M1-W1-003: 回滚方案 (ROLLBACK) - 完整版

## 一、回滚触发条件

**P0（立即回滚）**:
- 同意流程导致无法使用应用
- 路由守卫过严，白屏或死循环
- 云函数导致数据错误

**P1-P2（可延后或降级）**:
- 协议内容有误（可热更新）
- UI显示问题
- 云端同步失败率>50%

---

## 二、完全回滚步骤（方案A，15min）

### Step 1: 删除新增文件

```bash
# 删除4个页面
rm -rf pages/consent/

# 删除云函数
rm -rf uniCloud-aliyun/cloudfunctions/consent-record/
```

### Step 2: 恢复小改文件

```bash
git checkout HEAD~1 -- utils/auth.js utils/route-guard.js App.vue pages.json
```

### Step 3: 验证

```bash
npm run build:mp-weixin
# 预期: 构建成功
```

### Step 4: 提交

```bash
git commit -m "Revert: WS-M1-W1-003 同意管理流程

原因: [填写]
影响: 无同意管理，应用可直接使用
"
```

---

## 三、部分回滚（方案B，10min）

### 场景: 仅路由守卫有问题

**步骤**:
1. 保留consent页面
2. 暂时关闭route-guard.js的同意检查:

```diff
-if (!hasConsent()) {
-  // 拦截逻辑
-}
+// 临时关闭同意检查
+// if (!hasConsent()) { ... }
```

---

## 四、功能降级（方案C，5min）

### 场景: 云端同步失败

**步骤**:
1. consent.vue不调用云函数
2. 仅本地存储

```diff
-await callCloudFunction('consent-record', {...});
+// 临时关闭云端同步
+console.log('[CONSENT] 云端同步已关闭');
```

---

**回滚风险**: 低（新增代码，复用文件改动少）  
**回滚时间**: 15min  
**验证**: 构建+功能测试

