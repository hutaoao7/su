# fn-subscribe API文档

## 基本信息

- **云函数名称**: `fn-subscribe`
- **功能描述**: 管理用户订阅设置（每日提醒、社区通知等）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多10次请求

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 操作类型（daily/stress/community/get） |
| enable | Boolean | 否 | 是否启用（action为daily/stress/community时必填） |

### 支持的操作类型

- `daily`: 每日心理建议订阅
- `stress`: 压力检测提醒订阅
- `community`: 社区动态通知订阅
- `get`: 获取当前订阅设置

### 请求示例

```javascript
// 启用每日心理建议
const { result } = await uniCloud.callFunction({
  name: 'fn-subscribe',
  data: {
    action: 'daily',
    enable: true
  }
});

// 关闭压力检测提醒
const { result } = await uniCloud.callFunction({
  name: 'fn-subscribe',
  data: {
    action: 'stress',
    enable: false
  }
});

// 获取所有订阅设置
const { result } = await uniCloud.callFunction({
  name: 'fn-subscribe',
  data: {
    action: 'get'
  }
});
```

---

## 响应格式

### 成功响应（更新订阅）

```json
{
  "code": 0,
  "msg": "订阅设置已更新",
  "data": {
    "action": "daily",
    "enable": true,
    "updated_at": "2025-10-22T10:00:00Z"
  }
}
```

### 成功响应（获取订阅设置）

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "subscriptions": {
      "daily": {
        "enable": true,
        "updated_at": "2025-10-22T10:00:00Z"
      },
      "stress": {
        "enable": false,
        "updated_at": "2025-10-21T15:30:00Z"
      },
      "community": {
        "enable": true,
        "updated_at": "2025-10-20T08:00:00Z"
      }
    }
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 处理建议 |
|--------|----------|----------|
| 0 | 操作成功 | - |
| 40001 | 缺少必填参数 | 检查action和enable参数 |
| 40002 | 不支持的操作类型 | 使用daily/stress/community/get |
| 40301 | 未登录 | 重新登录获取Token |
| 40302 | Token已过期 | 刷新Token或重新登录 |
| 50001 | 更新失败 | 稍后重试 |
| 50002 | 服务器内部错误 | 联系技术支持 |

---

## 云函数实现示例

```javascript
'use strict';

const db = uniCloud.database();

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
    return { success: true, uid };
  } catch (error) {
    return { success: false, uid: null, message: 'Token解析失败' };
  }
}

exports.main = async (event, context) => {
  try {
    console.log('[FN-SUBSCRIBE] 请求开始');
    
    // 1. 验证Token
    const authResult = verifyToken(context);
    if (!authResult.success) {
      return {
        code: 40301,
        msg: authResult.message,
        data: null
      };
    }
    
    const userId = authResult.uid;
    const { action, enable } = event;
    
    // 2. 参数校验
    if (!action) {
      return {
        code: 40001,
        msg: '缺少操作类型',
        data: null
      };
    }
    
    const validActions = ['daily', 'stress', 'community', 'get'];
    if (!validActions.includes(action)) {
      return {
        code: 40002,
        msg: '不支持的操作类型',
        data: null
      };
    }
    
    // 3. 处理获取订阅设置
    if (action === 'get') {
      return await getSubscriptions(userId);
    }
    
    // 4. 处理更新订阅设置
    if (enable === undefined) {
      return {
        code: 40001,
        msg: 'enable参数必填',
        data: null
      };
    }
    
    return await updateSubscription(userId, action, enable);
    
  } catch (error) {
    console.error('[FN-SUBSCRIBE] 异常:', error);
    return {
      code: 50002,
      msg: '服务器内部错误',
      data: null
    };
  }
};

// 获取订阅设置
async function getSubscriptions(userId) {
  const subscribeCollection = db.collection('user_subscriptions');
  
  const result = await subscribeCollection
    .where({ user_id: userId })
    .get();
  
  const subscriptions = {
    daily: { enable: false, updated_at: null },
    stress: { enable: false, updated_at: null },
    community: { enable: false, updated_at: null }
  };
  
  if (result.data.length > 0) {
    const record = result.data[0];
    subscriptions.daily = {
      enable: record.daily_enable || false,
      updated_at: record.daily_updated_at
    };
    subscriptions.stress = {
      enable: record.stress_enable || false,
      updated_at: record.stress_updated_at
    };
    subscriptions.community = {
      enable: record.community_enable || false,
      updated_at: record.community_updated_at
    };
  }
  
  return {
    code: 0,
    msg: '查询成功',
    data: { subscriptions }
  };
}

// 更新订阅设置
async function updateSubscription(userId, action, enable) {
  const subscribeCollection = db.collection('user_subscriptions');
  const now = new Date();
  
  // 检查是否已存在记录
  const existResult = await subscribeCollection
    .where({ user_id: userId })
    .get();
  
  const updateData = {};
  updateData[`${action}_enable`] = !!enable;
  updateData[`${action}_updated_at`] = now;
  
  if (existResult.data.length > 0) {
    // 更新现有记录
    await subscribeCollection
      .doc(existResult.data[0]._id)
      .update(updateData);
  } else {
    // 创建新记录
    await subscribeCollection.add({
      user_id: userId,
      ...updateData,
      created_at: now
    });
  }
  
  return {
    code: 0,
    msg: '订阅设置已更新',
    data: {
      action,
      enable: !!enable,
      updated_at: now.toISOString()
    }
  };
}
```

---

## 前端集成示例

```javascript
// 在user/home.vue中使用
export default {
  data() {
    return {
      subscriptionSettings: {
        dailyTips: false,
        stressReminder: false,
        communityUpdates: false
      }
    };
  },
  
  methods: {
    // 加载订阅设置
    async loadSubscriptionSettings() {
      try {
        const res = await uniCloud.callFunction({
          name: 'fn-subscribe',
          data: {
            action: 'get'
          }
        });
        
        if (res.result.code === 0) {
          const { subscriptions } = res.result.data;
          this.subscriptionSettings = {
            dailyTips: subscriptions.daily.enable,
            stressReminder: subscriptions.stress.enable,
            communityUpdates: subscriptions.community.enable
          };
        }
      } catch (error) {
        console.error('加载订阅设置失败:', error);
      }
    },
    
    // 更新订阅设置
    async updateSubscription(type, enable) {
      try {
        const actionMap = {
          dailyTips: 'daily',
          stressReminder: 'stress',
          communityUpdates: 'community'
        };
        
        const res = await uniCloud.callFunction({
          name: 'fn-subscribe',
          data: {
            action: actionMap[type],
            enable: enable
          }
        });
        
        if (res.result.code === 0) {
          uni.showToast({
            title: enable ? '已开启' : '已关闭',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: res.result.msg,
            icon: 'none'
          });
          
          // 恢复开关状态
          this.subscriptionSettings[type] = !enable;
        }
      } catch (error) {
        console.error('更新订阅设置失败:', error);
        uni.showToast({
          title: '更新失败',
          icon: 'none'
        });
        
        // 恢复开关状态
        this.subscriptionSettings[type] = !enable;
      }
    },
    
    // 开关变化处理
    handleSwitchChange(type) {
      const enable = this.subscriptionSettings[type];
      this.updateSubscription(type, enable);
    }
  },
  
  onLoad() {
    this.loadSubscriptionSettings();
  }
};
```

---

## 数据库设计

### user_subscriptions表结构

```sql
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 每日心理建议
  daily_enable BOOLEAN NOT NULL DEFAULT false,
  daily_updated_at TIMESTAMP,
  
  -- 压力检测提醒
  stress_enable BOOLEAN NOT NULL DEFAULT false,
  stress_updated_at TIMESTAMP,
  
  -- 社区动态通知
  community_enable BOOLEAN NOT NULL DEFAULT false,
  community_updated_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_daily_enable ON user_subscriptions(daily_enable) WHERE daily_enable = true;
CREATE INDEX idx_user_subscriptions_stress_enable ON user_subscriptions(stress_enable) WHERE stress_enable = true;
CREATE INDEX idx_user_subscriptions_community_enable ON user_subscriptions(community_enable) WHERE community_enable = true;
```

---

## 小程序订阅消息集成

### 订阅消息模板配置

在微信小程序后台配置以下订阅消息模板：

1. **每日心理建议**
   - 模板ID: `daily_tips_template`
   - 内容: 今日建议、温馨提示、查看详情

2. **压力检测提醒**
   - 模板ID: `stress_reminder_template`
   - 内容: 提醒内容、检测时间、立即检测

3. **社区动态通知**
   - 模板ID: `community_update_template`
   - 内容: 动态内容、发布时间、查看详情

### 前端请求订阅权限

```javascript
// 请求订阅消息权限
async requestSubscribeMessage(templateIds) {
  try {
    const res = await uni.requestSubscribeMessage({
      tmplIds: templateIds
    });
    
    console.log('订阅消息授权结果:', res);
    
    // 检查授权结果
    const authorized = templateIds.every(id => res[id] === 'accept');
    
    if (authorized) {
      uni.showToast({
        title: '订阅成功',
        icon: 'success'
      });
    } else {
      uni.showToast({
        title: '部分订阅未授权',
        icon: 'none'
      });
    }
    
    return authorized;
  } catch (error) {
    console.error('请求订阅消息失败:', error);
    return false;
  }
}
```

---

## 最佳实践

1. **权限引导**: 在合适的时机引导用户开启订阅，说明订阅的价值
2. **批量授权**: 一次性请求多个订阅消息模板，减少打扰
3. **状态同步**: 前端开关状态与后端数据保持同步
4. **错误处理**: 更新失败时恢复开关状态，避免误导用户
5. **定时推送**: 后端定时任务根据订阅设置推送消息
6. **推送频率**: 控制推送频率，避免过度打扰用户

---

**创建时间**: 2025-10-22  
**最后更新**: 2025-10-22  
**版本**: v1.0

