# chat-session-create API文档

## 基本信息

- **云函数名称**: `chat-session-create`
- **功能描述**: 创建新的AI对话会话
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每小时最多创建50个会话

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| session_name | String | 否 | 会话名称（默认：新会话） |
| personality | String | 否 | AI人格类型（empathetic/professional/humorous，默认empathetic） |
| scene | String | 否 | 应用场景（stress/study/social/sleep，默认stress） |
| metadata | Object | 否 | 会话元数据（自定义字段） |

### 请求示例

```javascript
// 基础创建
const { result } = await uniCloud.callFunction({
  name: 'chat-session-create',
  data: {
    session_name: '工作压力咨询'
  }
});

// 完整参数创建
const { result } = await uniCloud.callFunction({
  name: 'chat-session-create',
  data: {
    session_name: '学业压力咨询',
    personality: 'professional',
    scene: 'study',
    metadata: {
      source: 'assessment_result',
      related_scale: 'academic_stress'
    }
  }
});
```

---

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "msg": "会话创建成功",
  "data": {
    "session": {
      "id": "session_1729584000000",
      "user_id": "user-uuid-xxx",
      "session_name": "工作压力咨询",
      "personality": "empathetic",
      "scene": "stress",
      "status": "active",
      "message_count": 1,
      "created_at": "2025-10-22T10:00:00Z",
      "last_message_at": "2025-10-22T10:00:00Z",
      "metadata": {
        "source": "manual_create"
      }
    },
    "welcome_message": {
      "id": "msg_1729584000001",
      "role": "assistant",
      "content": "您好！我是您的心理支持AI（温柔共情）。无论您遇到什么困扰，都可以和我倾诉。我会认真倾听，并尽我所能给予支持和建议。",
      "timestamp": "2025-10-22T10:00:00Z"
    }
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 处理建议 |
|--------|----------|----------|
| 0 | 创建成功 | - |
| 40001 | 参数格式错误 | 检查参数类型和格式 |
| 40002 | 会话名称过长 | 会话名称不超过50字符 |
| 40003 | 无效的人格类型 | 使用empathetic/professional/humorous |
| 40004 | 无效的场景类型 | 使用stress/study/social/sleep |
| 40301 | 未登录 | 重新登录获取Token |
| 40302 | Token已过期 | 刷新Token或重新登录 |
| 42901 | 会话数量超限 | 每用户最多100个活跃会话 |
| 50001 | 创建失败 | 稍后重试 |
| 50002 | 服务器内部错误 | 联系技术支持 |

---

## 云函数实现示例

```javascript
'use strict';

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[CHAT-SESSION-CREATE]';

// AI人格配置
const PERSONALITY_CONFIG = {
  empathetic: {
    name: '温柔共情',
    welcome: '您好！我是您的心理支持AI（温柔共情）。无论您遇到什么困扰，都可以和我倾诉。'
  },
  professional: {
    name: '专业严谨',
    welcome: '您好！我是您的心理咨询AI（专业严谨）。我将为您提供专业的心理分析和建议。'
  },
  humorous: {
    name: '轻松幽默',
    welcome: '嗨！我是您的AI朋友（轻松幽默）。让我们用轻松的方式聊聊您的烦恼吧！'
  }
};

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
    console.log(TAG, '请求开始');
    
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
    const { 
      session_name = '新会话',
      personality = 'empathetic',
      scene = 'stress',
      metadata = {}
    } = event;
    
    // 2. 参数校验
    if (session_name.length > 50) {
      return {
        code: 40002,
        msg: '会话名称不能超过50个字符',
        data: null
      };
    }
    
    if (!['empathetic', 'professional', 'humorous'].includes(personality)) {
      return {
        code: 40003,
        msg: '无效的人格类型',
        data: null
      };
    }
    
    if (!['stress', 'study', 'social', 'sleep'].includes(scene)) {
      return {
        code: 40004,
        msg: '无效的场景类型',
        data: null
      };
    }
    
    const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
    
    // 3. 检查用户活跃会话数量
    const { count, error: countError } = await supabase
      .from('chat_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (countError) {
      console.error(TAG, '查询会话数量失败:', countError);
    }
    
    if (count >= 100) {
      return {
        code: 42901,
        msg: '活跃会话数量已达上限（100个）',
        data: null
      };
    }
    
    const now = new Date().toISOString();
    const sessionId = `session_${Date.now()}`;
    
    // 4. 创建会话记录
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        session_name: session_name,
        personality: personality,
        scene: scene,
        status: 'active',
        message_count: 1,
        created_at: now,
        last_message_at: now,
        metadata: {
          ...metadata,
          source: metadata.source || 'manual_create'
        }
      })
      .select()
      .single();
    
    if (sessionError || !session) {
      console.error(TAG, '创建会话失败:', sessionError);
      return {
        code: 50001,
        msg: '创建失败',
        data: null
      };
    }
    
    // 5. 创建欢迎消息
    const personalityConfig = PERSONALITY_CONFIG[personality];
    const welcomeContent = personalityConfig.welcome;
    
    const { data: welcomeMessage, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        id: `msg_${Date.now()}`,
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: welcomeContent,
        created_at: now
      })
      .select()
      .single();
    
    if (messageError) {
      console.error(TAG, '创建欢迎消息失败:', messageError);
    }
    
    console.log(TAG, '会话创建成功:', sessionId);
    
    return {
      code: 0,
      msg: '会话创建成功',
      data: {
        session: session,
        welcome_message: welcomeMessage || {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: welcomeContent,
          timestamp: now
        }
      }
    };
    
  } catch (error) {
    console.error(TAG, '异常:', error);
    return {
      code: 50002,
      msg: '服务器内部错误',
      data: null
    };
  }
};
```

---

## 前端集成示例

```javascript
// 在chat.vue中使用
export default {
  data() {
    return {
      sessions: [],
      currentSession: null
    };
  },
  
  methods: {
    // 创建新会话
    async createNewSession() {
      // 弹窗输入会话名称
      const inputResult = await uni.showModal({
        title: '新建会话',
        content: '请输入会话名称',
        placeholderText: '例如：工作压力、学习困扰等...',
        editable: true,
        confirmText: '创建'
      });
      
      if (!inputResult.confirm) {
        return;
      }
      
      const sessionName = inputResult.content?.trim() || '新会话';
      
      uni.showLoading({ title: '创建中...' });
      
      try {
        const res = await uniCloud.callFunction({
          name: 'chat-session-create',
          data: {
            session_name: sessionName,
            personality: this.currentPersonality || 'empathetic',
            scene: 'stress'
          }
        });
        
        uni.hideLoading();
        
        if (res.result.code === 0) {
          const { session, welcome_message } = res.result.data;
          
          // 添加到会话列表
          this.sessions.unshift(session);
          
          // 切换到新会话
          this.currentSession = session;
          this.sessionId = session.id;
          
          // 清空当前消息列表
          this.messages = [];
          
          // 添加欢迎消息
          if (welcome_message) {
            this.messages.push({
              id: welcome_message.id,
              role: 'assistant',
              content: welcome_message.content,
              timestamp: Date.now()
            });
          }
          
          uni.showToast({
            title: '会话创建成功',
            icon: 'success'
          });
          
          console.log('[CHAT] 新会话创建成功:', session);
        } else {
          uni.showToast({
            title: res.result.msg,
            icon: 'none'
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('创建会话失败:', error);
        uni.showToast({
          title: '创建失败',
          icon: 'none'
        });
      }
    },
    
    // 从评估结果创建会话
    async createSessionFromAssessment(scaleId, result) {
      try {
        const res = await uniCloud.callFunction({
          name: 'chat-session-create',
          data: {
            session_name: `${result.scale_name}咨询`,
            personality: 'professional',
            scene: this.getSceneByScaleId(scaleId),
            metadata: {
              source: 'assessment_result',
              related_scale: scaleId,
              assessment_level: result.level
            }
          }
        });
        
        if (res.result.code === 0) {
          // 跳转到聊天页面
          uni.navigateTo({
            url: `/pages/intervene/chat?sessionId=${res.result.data.session.id}`
          });
        }
      } catch (error) {
        console.error('创建会话失败:', error);
      }
    },
    
    // 根据量表ID获取场景
    getSceneByScaleId(scaleId) {
      const sceneMap = {
        'academic_stress': 'study',
        'social_anxiety': 'social',
        'psqi': 'sleep'
      };
      return sceneMap[scaleId] || 'stress';
    }
  }
};
```

---

## 数据库设计

### chat_sessions表结构

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_name VARCHAR(50) NOT NULL DEFAULT '新会话',
  personality VARCHAR(20) NOT NULL DEFAULT 'empathetic',
  scene VARCHAR(20) NOT NULL DEFAULT 'stress',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB,
  CONSTRAINT chk_personality CHECK (personality IN ('empathetic', 'professional', 'humorous')),
  CONSTRAINT chk_scene CHECK (scene IN ('stress', 'study', 'social', 'sleep')),
  CONSTRAINT chk_status CHECK (status IN ('active', 'archived', 'deleted'))
);

-- 创建索引
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);
```

---

## 最佳实践

1. **会话命名**: 引导用户输入有意义的会话名称，便于后续查找
2. **人格选择**: 根据用户偏好或场景自动选择合适的AI人格
3. **场景关联**: 从评估结果创建会话时，自动关联场景和元数据
4. **数量限制**: 限制活跃会话数量，引导用户归档旧会话
5. **欢迎消息**: 创建会话时自动发送欢迎消息，提升用户体验

---

**创建时间**: 2025-10-22  
**最后更新**: 2025-10-22  
**版本**: v1.0

