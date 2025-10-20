/**
 * Mock数据适配器
 * 用于开发阶段的数据模拟，生产环境将替换为真实接口
 */

// Mock数据存储
const mockData = {
  // 用户信息
  userInfo: {
    id: 'mock-user-001',
    nickname: '测试用户',
    avatar: '/static/images/default-avatar.png',
    gender: 1,
    birthday: '2000-01-01',
    bio: '这是一个测试用户',
    phone: '138****8888',
    email: 'test@example.com',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 社区话题列表
  communityTopics: [
    {
      id: 'topic-001',
      title: '如何缓解考试焦虑？',
      content: '期末考试快到了，感觉压力很大...',
      author: '小明',
      avatar: '/static/images/avatar1.png',
      likes: 42,
      comments: 15,
      createdAt: '2024-12-01T10:00:00.000Z'
    },
    {
      id: 'topic-002',
      title: '分享一些放松的方法',
      content: '最近发现冥想对缓解压力很有帮助...',
      author: '小红',
      avatar: '/static/images/avatar2.png',
      likes: 38,
      comments: 12,
      createdAt: '2024-12-02T14:30:00.000Z'
    }
  ],
  
  // CDK兑换码
  cdkCodes: {
    'TEST2024': {
      valid: true,
      used: false,
      type: 'premium',
      days: 30,
      description: '测试兑换码 - 30天高级会员'
    },
    'USED2024': {
      valid: true,
      used: true,
      type: 'premium',
      days: 7,
      description: '已使用的兑换码'
    },
    'INVALID': {
      valid: false,
      used: false,
      type: null,
      days: 0,
      description: '无效的兑换码'
    }
  }
};

/**
 * 获取Mock用户信息
 */
export function getMockUserInfo() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        errCode: 0,
        errMsg: 'success',
        data: mockData.userInfo
      });
    }, 500);
  });
}

/**
 * 获取Mock社区话题列表
 */
export function getMockCommunityTopics(page = 1, pageSize = 10) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const topics = mockData.communityTopics.slice(start, end);
      
      resolve({
        errCode: 0,
        errMsg: 'success',
        data: {
          list: topics,
          total: mockData.communityTopics.length,
          page: page,
          pageSize: pageSize
        }
      });
    }, 800);
  });
}

/**
 * 获取Mock话题详情
 */
export function getMockTopicDetail(topicId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const topic = mockData.communityTopics.find(t => t.id === topicId);
      
      if (topic) {
        resolve({
          errCode: 0,
          errMsg: 'success',
          data: {
            ...topic,
            views: Math.floor(Math.random() * 1000) + 100,
            isLiked: false,
            comments: [
              {
                id: 'comment-001',
                content: '说得很有道理，我也有同样的感受',
                author: '路人甲',
                createdAt: '2024-12-03T09:00:00.000Z'
              }
            ]
          }
        });
      } else {
        resolve({
          errCode: -1,
          errMsg: '话题不存在',
          data: null
        });
      }
    }, 600);
  });
}

/**
 * Mock CDK兑换验证
 */
export function mockCDKRedeem(code) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cdkInfo = mockData.cdkCodes[code];
      
      if (!cdkInfo) {
        resolve({
          errCode: 1001,
          errMsg: '兑换码不存在',
          data: null
        });
      } else if (!cdkInfo.valid) {
        resolve({
          errCode: 1002,
          errMsg: '兑换码无效',
          data: null
        });
      } else if (cdkInfo.used) {
        resolve({
          errCode: 1003,
          errMsg: '兑换码已被使用',
          data: null
        });
      } else {
        // 标记为已使用
        cdkInfo.used = true;
        
        resolve({
          errCode: 0,
          errMsg: '兑换成功',
          data: {
            type: cdkInfo.type,
            days: cdkInfo.days,
            description: cdkInfo.description,
            expiresAt: new Date(Date.now() + cdkInfo.days * 24 * 60 * 60 * 1000).toISOString()
          }
        });
      }
    }, 1000);
  });
}

/**
 * Mock提交反馈
 */
export function mockSubmitFeedback(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[Mock] 收到反馈:', data);
      
      resolve({
        errCode: 0,
        errMsg: '反馈提交成功',
        data: {
          feedbackId: 'feedback-' + Date.now(),
          submittedAt: new Date().toISOString()
        }
      });
    }, 800);
  });
}

/**
 * Mock聊天历史
 */
export function getMockChatHistory(userId, page = 1, pageSize = 20) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const history = [
        {
          id: 'chat-001',
          role: 'user',
          content: '我最近压力很大',
          timestamp: '2024-12-01T10:00:00.000Z'
        },
        {
          id: 'chat-002',
          role: 'assistant',
          content: '我理解您的感受。压力确实会让人感到不适。您能具体说说是什么让您感到压力吗？',
          timestamp: '2024-12-01T10:00:30.000Z'
        }
      ];
      
      resolve({
        errCode: 0,
        errMsg: 'success',
        data: {
          list: history,
          total: history.length,
          page: page,
          pageSize: pageSize
        }
      });
    }, 600);
  });
}

// 导出Mock适配器
export default {
  getMockUserInfo,
  getMockCommunityTopics,
  getMockTopicDetail,
  mockCDKRedeem,
  mockSubmitFeedback,
  getMockChatHistory
};
