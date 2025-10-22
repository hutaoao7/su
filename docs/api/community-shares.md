# community-shares API文档

## 基本信息

- **云函数名称**: `community-shares`
- **功能描述**: 社区分享功能（记录分享、生成分享图片、分享统计）
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每分钟最多20次请求

---

## 业务说明

本接口提供社区内容的分享功能，支持：
1. 记录分享行为（微信、朋友圈、QQ、微博等）
2. 生成分享图片（带小程序码）
3. 生成分享链接
4. 查询分享统计
5. 获取热门分享内容

### 功能特性
- 支持多平台分享（微信、朋友圈、QQ、微博等）
- 自动生成精美分享图片
- 分享数据统计和分析
- 分享奖励机制（积分、勋章等）

---

## Action类型说明

| Action | 说明 | 认证 | 限流 |
|--------|------|------|------|
| record | 记录分享行为 | 是 | 20/min |
| generate_image | 生成分享图片 | 是 | 10/min |
| generate_link | 生成分享链接 | 是 | 30/min |
| stats | 查询分享统计 | 是 | 30/min |
| hot_shares | 获取热门分享 | 否 | 60/min |

---

## 1. 记录分享行为 (record)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：record |
| target_type | String | 是 | 分享对象类型（topic/comment） |
| target_id | String | 是 | 分享对象ID |
| share_platform | String | 是 | 分享平台（wechat/moments/qq/weibo/link/image/other） |
| share_method | String | 否 | 分享方式（小程序码/链接/图片等） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-shares',
  data: {
    action: 'record',
    target_type: 'topic',
    target_id: 'topic_xxx',
    share_platform: 'wechat',
    share_method: 'miniprogram'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "分享记录成功",
  "data": {
    "share_id": "share_xxx",
    "target_type": "topic",
    "target_id": "topic_xxx",
    "share_platform": "wechat",
    "reward": {
      "points": 5,
      "message": "分享成功，获得5积分"
    },
    "created_at": "2025-10-22T10:00:00Z"
  }
}
```

---

## 2. 生成分享图片 (generate_image)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：generate_image |
| target_type | String | 是 | 分享对象类型（topic/comment） |
| target_id | String | 是 | 分享对象ID |
| template | String | 否 | 图片模板（default/card/poster） |
| include_qrcode | Boolean | 否 | 是否包含小程序码（默认：true） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-shares',
  data: {
    action: 'generate_image',
    target_type: 'topic',
    target_id: 'topic_xxx',
    template: 'card',
    include_qrcode: true
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "图片生成成功",
  "data": {
    "image_url": "https://cdn.example.com/share/xxx.png",
    "qrcode_url": "https://cdn.example.com/qrcode/xxx.png",
    "expires_at": "2025-10-23T10:00:00Z",
    "template": "card",
    "size": {
      "width": 750,
      "height": 1334
    }
  }
}
```

---

## 3. 生成分享链接 (generate_link)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | 固定值：generate_link |
| target_type | String | 是 | 分享对象类型（topic/comment） |
| target_id | String | 是 | 分享对象ID |
| platform | String | 否 | 目标平台（h5/miniprogram） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-shares',
  data: {
    action: 'generate_link',
    target_type: 'topic',
    target_id: 'topic_xxx',
    platform: 'h5'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "链接生成成功",
  "data": {
    "share_url": "https://app.example.com/community/topic/xxx?from=share",
    "short_url": "https://app.example.com/s/abc123",
    "qrcode_url": "https://cdn.example.com/qrcode/xxx.png",
    "expires_at": "2025-11-22T10:00:00Z"
  }
}
```

---

## 4. 查询分享统计 (stats)

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| action | String | 是 | - | 固定值：stats |
| target_type | String | 否 | all | 分享对象类型（all/topic/comment） |
| target_id | String | 否 | - | 分享对象ID（查询特定内容的分享统计） |
| time_range | String | 否 | all | 时间范围（today/week/month/all） |

### 请求示例

```javascript
// 查询用户总分享统计
const { result } = await uniCloud.callFunction({
  name: 'community-shares',
  data: {
    action: 'stats',
    time_range: 'month'
  }
});

// 查询特定话题的分享统计
const { result } = await uniCloud.callFunction({
  name: 'community-shares',
  data: {
    action: 'stats',
    target_type: 'topic',
    target_id: 'topic_xxx'
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "total_shares": 156,
    "by_platform": {
      "wechat": 68,
      "moments": 45,
      "qq": 23,
      "weibo": 12,
      "link": 8
    },
    "by_type": {
      "topic": 142,
      "comment": 14
    },
    "recent_shares": [
      {
        "share_id": "share_xxx",
        "target_type": "topic",
        "target_id": "topic_xxx",
        "share_platform": "wechat",
        "created_at": "2025-10-22T10:00:00Z"
      }
    ],
    "rewards": {
      "total_points": 780,
      "badges": ["分享达人", "传播者"]
    }
  }
}
```

---

## 5. 获取热门分享 (hot_shares)

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| action | String | 是 | - | 固定值：hot_shares |
| time_range | String | 否 | week | 时间范围（today/week/month） |
| limit | Number | 否 | 10 | 返回数量（最多50） |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'community-shares',
  data: {
    action: 'hot_shares',
    time_range: 'week',
    limit: 10
  }
});
```

### 成功响应

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "hot_topics": [
      {
        "topic_id": "topic_xxx",
        "title": "如何缓解焦虑情绪",
        "shares_count": 245,
        "likes_count": 1280,
        "comments_count": 456,
        "author": {
          "id": "user_xxx",
          "nickname": "小明",
          "avatar": "https://..."
        }
      }
    ],
    "time_range": "week",
    "updated_at": "2025-10-22T10:00:00Z"
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 处理建议 |
|--------|----------|----------|
| 0 | 操作成功 | - |
| 40001 | 缺少必填参数 | 检查请求参数 |
| 40002 | 参数格式错误 | 检查参数类型和格式 |
| 40005 | 分享对象不存在 | 检查target_id是否有效 |
| 40301 | 未登录 | 重新登录获取Token |
| 40302 | Token已过期 | 刷新Token或重新登录 |
| 42901 | 请求过于频繁 | 稍后重试 |
| 50001 | 数据库操作失败 | 稍后重试 |
| 50002 | 服务器内部错误 | 联系技术支持 |
| 50003 | 图片生成失败 | 稍后重试 |

---

## 云函数实现示例

```javascript
'use strict';

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.main = async (event, context) => {
  try {
    const { action } = event;

    // 验证Token（除了hot_shares不需要登录）
    let userId = null;
    if (action !== 'hot_shares') {
      const authResult = verifyToken(context);
      if (!authResult.success) {
        return { code: 40301, msg: authResult.message, data: null };
      }
      userId = authResult.uid;
    }

    // 根据action分发处理
    switch (action) {
      case 'record':
        return await recordShare(event, userId, context);
      case 'generate_image':
        return await generateShareImage(event, userId);
      case 'generate_link':
        return await generateShareLink(event, userId);
      case 'stats':
        return await getShareStats(event, userId);
      case 'hot_shares':
        return await getHotShares(event);
      default:
        return { code: 40002, msg: '不支持的操作类型', data: null };
    }

  } catch (error) {
    console.error('[COMMUNITY-SHARES] 异常:', error);
    return { code: 50002, msg: '服务器内部错误', data: null };
  }
};

// 记录分享行为
async function recordShare(params, userId, context) {
  const { target_type, target_id, share_platform, share_method } = params;

  // 参数校验
  if (!target_type || !target_id || !share_platform) {
    return { code: 40001, msg: '缺少必填参数', data: null };
  }

  const validPlatforms = ['wechat', 'moments', 'qq', 'weibo', 'link', 'image', 'other'];
  if (!validPlatforms.includes(share_platform)) {
    return { code: 40002, msg: '分享平台参数错误', data: null };
  }

  // 检查分享对象是否存在
  const tableName = target_type === 'topic' ? 'community_topics' : 'community_comments';
  const { data: target, error: targetError } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', target_id)
    .single();

  if (targetError || !target) {
    return { code: 40005, msg: '分享对象不存在', data: null };
  }

  // 获取IP和User-Agent
  const ip_address = context.CLIENTIP || '';
  const user_agent = context.CLIENTUA || '';

  // 记录分享
  const now = new Date().toISOString();
  const { data: share, error } = await supabase
    .from('community_shares')
    .insert({
      user_id: userId,
      target_type,
      target_id,
      share_platform,
      share_method,
      ip_address,
      user_agent,
      created_at: now
    })
    .select()
    .single();

  if (error) {
    console.error('[RECORD-SHARE] 数据库错误:', error);
    return { code: 50001, msg: '记录分享失败', data: null };
  }

  // 计算分享奖励（每次分享+5积分，每日最多3次）
  const reward = await calculateShareReward(userId, share_platform);

  return {
    code: 0,
    msg: '分享记录成功',
    data: {
      share_id: share.id,
      target_type: share.target_type,
      target_id: share.target_id,
      share_platform: share.share_platform,
      reward,
      created_at: share.created_at
    }
  };
}

// 计算分享奖励
async function calculateShareReward(userId, platform) {
  // 查询今日分享次数
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayShares, error } = await supabase
    .from('community_shares')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) {
    return { points: 0, message: '分享成功' };
  }

  const shareCount = todayShares.length;

  if (shareCount <= 3) {
    // 前3次分享有积分奖励
    return {
      points: 5,
      message: `分享成功，获得5积分（今日还可获得${3 - shareCount}次奖励）`
    };
  } else {
    return {
      points: 0,
      message: '分享成功（今日分享奖励已达上限）'
    };
  }
}

// 生成分享图片
async function generateShareImage(params, userId) {
  const { target_type, target_id, template = 'default', include_qrcode = true } = params;

  // 参数校验
  if (!target_type || !target_id) {
    return { code: 40001, msg: '缺少必填参数', data: null };
  }

  // 获取分享对象信息
  const tableName = target_type === 'topic' ? 'community_topics' : 'community_comments';
  const { data: target, error: targetError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', target_id)
    .single();

  if (targetError || !target) {
    return { code: 40005, msg: '分享对象不存在', data: null };
  }

  // TODO: 调用图片生成服务（Canvas或第三方服务）
  // 这里返回模拟数据
  const imageUrl = `https://cdn.example.com/share/${target_id}_${Date.now()}.png`;
  const qrcodeUrl = include_qrcode ? `https://cdn.example.com/qrcode/${target_id}.png` : null;

  return {
    code: 0,
    msg: '图片生成成功',
    data: {
      image_url: imageUrl,
      qrcode_url: qrcodeUrl,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      template,
      size: {
        width: 750,
        height: 1334
      }
    }
  };
}

// 生成分享链接
async function generateShareLink(params, userId) {
  const { target_type, target_id, platform = 'h5' } = params;

  // 参数校验
  if (!target_type || !target_id) {
    return { code: 40001, msg: '缺少必填参数', data: null };
  }

  // 生成分享链接
  const baseUrl = platform === 'h5'
    ? 'https://app.example.com'
    : 'pages/community/detail';

  const shareUrl = platform === 'h5'
    ? `${baseUrl}/community/${target_type}/${target_id}?from=share&uid=${userId}`
    : `${baseUrl}?id=${target_id}&from=share`;

  // 生成短链接（可选）
  const shortUrl = `https://app.example.com/s/${generateShortCode(target_id)}`;

  // 生成二维码
  const qrcodeUrl = `https://cdn.example.com/qrcode/${target_id}.png`;

  return {
    code: 0,
    msg: '链接生成成功',
    data: {
      share_url: shareUrl,
      short_url: shortUrl,
      qrcode_url: qrcodeUrl,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
}

// 生成短链接码
function generateShortCode(id) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

---

## 前端集成示例

### 微信小程序分享

```vue
<template>
  <view class="topic-detail">
    <!-- 话题内容 -->
    <view class="topic-content">{{ topic.title }}</view>

    <!-- 分享按钮 -->
    <button open-type="share" class="share-btn">
      <u-icon name="share" />
      <text>分享给好友</text>
    </button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      topic: {
        id: 'topic_xxx',
        title: '如何缓解焦虑情绪',
        content: '...'
      }
    };
  },

  // 微信小程序分享配置
  onShareAppMessage() {
    return {
      title: this.topic.title,
      path: `/pages/community/detail?id=${this.topic.id}&from=share`,
      imageUrl: this.topic.cover_image || '',
      success: async () => {
        // 记录分享行为
        await this.recordShare('wechat');
      }
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: this.topic.title,
      query: `id=${this.topic.id}&from=moments`,
      imageUrl: this.topic.cover_image || '',
      success: async () => {
        // 记录分享行为
        await this.recordShare('moments');
      }
    };
  },

  methods: {
    async recordShare(platform) {
      try {
        const res = await uniCloud.callFunction({
          name: 'community-shares',
          data: {
            action: 'record',
            target_type: 'topic',
            target_id: this.topic.id,
            share_platform: platform,
            share_method: 'miniprogram'
          }
        });

        if (res.result.code === 0 && res.result.data.reward.points > 0) {
          uni.showToast({
            title: res.result.data.reward.message,
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('记录分享失败:', error);
      }
    },

    // 生成分享图片
    async generateShareImage() {
      try {
        uni.showLoading({ title: '生成中...' });

        const res = await uniCloud.callFunction({
          name: 'community-shares',
          data: {
            action: 'generate_image',
            target_type: 'topic',
            target_id: this.topic.id,
            template: 'card',
            include_qrcode: true
          }
        });

        uni.hideLoading();

        if (res.result.code === 0) {
          // 保存图片到相册
          uni.saveImageToPhotosAlbum({
            filePath: res.result.data.image_url,
            success: () => {
              uni.showToast({
                title: '已保存到相册',
                icon: 'success'
              });

              // 记录分享行为
              this.recordShare('image');
            }
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('生成分享图片失败:', error);
        uni.showToast({
          title: '生成失败',
          icon: 'none'
        });
      }
    }
  }
};
</script>
```

---

## 最佳实践

1. **分享奖励**: 设置分享积分奖励，鼓励用户分享优质内容
2. **分享限制**: 限制每日分享奖励次数，防止刷分
3. **分享追踪**: 记录分享来源，分析分享效果
4. **分享图片**: 提供精美的分享图片模板，提升分享转化率
5. **分享统计**: 展示分享数据，激励用户分享
6. **防刷机制**: 检测异常分享行为，防止恶意刷分

---

**创建时间**: 2025-10-22
**最后更新**: 2025-10-22
**版本**: v1.0


