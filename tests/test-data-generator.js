/**
 * 测试数据生成器 - CraneHeart心理健康评估平台
 * 
 * 功能：
 * 1. 生成用户测试数据
 * 2. 生成评估测试数据
 * 3. 生成聊天测试数据
 * 4. 生成社区测试数据
 * 5. 生成CDK测试数据
 */

const testDataGenerator = {
  /**
   * 生成随机用户ID
   */
  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * 生成随机邮箱
   */
  generateEmail() {
    const random = Math.random().toString(36).substr(2, 9);
    return `test_${random}@example.com`;
  },

  /**
   * 生成随机昵称
   */
  generateNickname() {
    const names = ['小明', '小红', '小刚', '小芳', '小王', '小李', '小张', '小陈'];
    const random = Math.floor(Math.random() * names.length);
    return names[random] + Math.floor(Math.random() * 1000);
  },

  /**
   * 生成随机电话
   */
  generatePhone() {
    const prefix = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139'];
    const p = prefix[Math.floor(Math.random() * prefix.length)];
    const num = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return p + num;
  },

  /**
   * 生成用户测试数据
   */
  generateUserData(count = 10) {
    console.log(`📝 生成${count}条用户测试数据...`);
    
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        user_id: this.generateUserId(),
        email: this.generateEmail(),
        phone: this.generatePhone(),
        nickname: this.generateNickname(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        gender: Math.random() > 0.5 ? 'male' : 'female',
        birthday: new Date(1990 + Math.floor(Math.random() * 30), 
                          Math.floor(Math.random() * 12), 
                          Math.floor(Math.random() * 28)).toISOString(),
        bio: '这是一个测试用户',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ 生成了${users.length}条用户数据`);
    return users;
  },

  /**
   * 生成评估测试数据
   */
  generateAssessmentData(count = 20) {
    console.log(`📝 生成${count}条评估测试数据...`);
    
    const assessmentTypes = ['stress', 'sleep', 'social', 'mood', 'anxiety'];
    const assessments = [];
    
    for (let i = 0; i < count; i++) {
      const type = assessmentTypes[Math.floor(Math.random() * assessmentTypes.length)];
      assessments.push({
        assessment_id: `assess_${Date.now()}_${i}`,
        user_id: this.generateUserId(),
        assessment_type: type,
        score: Math.floor(Math.random() * 100),
        level: Math.random() > 0.5 ? 'high' : 'low',
        answers: Array(10).fill(0).map(() => Math.floor(Math.random() * 5) + 1),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ 生成了${assessments.length}条评估数据`);
    return assessments;
  },

  /**
   * 生成聊天测试数据
   */
  generateChatData(count = 50) {
    console.log(`📝 生成${count}条聊天测试数据...`);
    
    const messages = [
      '我最近压力很大',
      '睡眠质量不好',
      '社交焦虑',
      '心情不好',
      '需要帮助',
      '谢谢你的建议',
      '很有帮助',
      '继续加油'
    ];
    
    const chats = [];
    for (let i = 0; i < count; i++) {
      const isUser = Math.random() > 0.5;
      chats.push({
        message_id: `msg_${Date.now()}_${i}`,
        chat_id: `chat_${Math.floor(i / 10)}`,
        user_id: this.generateUserId(),
        message_type: isUser ? 'user' : 'ai',
        content: messages[Math.floor(Math.random() * messages.length)],
        rating: isUser ? null : Math.floor(Math.random() * 5) + 1,
        created_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ 生成了${chats.length}条聊天数据`);
    return chats;
  },

  /**
   * 生成社区测试数据
   */
  generateCommunityData(count = 30) {
    console.log(`📝 生成${count}条社区测试数据...`);
    
    const titles = [
      '分享我的心理健康故事',
      '如何应对压力',
      '睡眠改善建议',
      '社交焦虑的克服方法',
      '心理健康的重要性'
    ];
    
    const contents = [
      '这是一个很好的话题，我想分享我的经验...',
      '我最近尝试了一些新的方法，效果很好...',
      '感谢大家的支持和鼓励...',
      '希望这些建议对大家有帮助...',
      '欢迎大家分享自己的故事...'
    ];
    
    const posts = [];
    for (let i = 0; i < count; i++) {
      posts.push({
        post_id: `post_${Date.now()}_${i}`,
        user_id: this.generateUserId(),
        title: titles[Math.floor(Math.random() * titles.length)],
        content: contents[Math.floor(Math.random() * contents.length)],
        type: 'text',
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 50),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ 生成了${posts.length}条社区数据`);
    return posts;
  },

  /**
   * 生成CDK测试数据
   */
  generateCDKData(count = 20) {
    console.log(`📝 生成${count}条CDK测试数据...`);
    
    const cdks = [];
    for (let i = 0; i < count; i++) {
      const code = `CDK${Date.now()}${i}`.substr(0, 16);
      cdks.push({
        cdk_id: `cdk_${Date.now()}_${i}`,
        cdk_code: code,
        reward_type: Math.random() > 0.5 ? 'coins' : 'premium',
        reward_value: Math.random() > 0.5 ? 100 : 500,
        status: Math.random() > 0.5 ? 'active' : 'used',
        redeemed_by: Math.random() > 0.5 ? this.generateUserId() : null,
        redeemed_at: Math.random() > 0.5 ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        expired_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    console.log(`✅ 生成了${cdks.length}条CDK数据`);
    return cdks;
  },

  /**
   * 生成所有测试数据
   */
  generateAllTestData() {
    console.log('🚀 开始生成所有测试数据...\n');
    
    const testData = {
      users: this.generateUserData(10),
      assessments: this.generateAssessmentData(20),
      chats: this.generateChatData(50),
      community: this.generateCommunityData(30),
      cdks: this.generateCDKData(20)
    };
    
    console.log('\n✅ 所有测试数据生成完成！');
    console.log(`总数据条数: ${
      testData.users.length + 
      testData.assessments.length + 
      testData.chats.length + 
      testData.community.length + 
      testData.cdks.length
    }`);
    
    return testData;
  },

  /**
   * 导出测试数据为JSON
   */
  exportToJSON(testData) {
    const json = JSON.stringify(testData, null, 2);
    console.log('\n📄 测试数据JSON:');
    console.log(json);
    return json;
  },

  /**
   * 导出测试数据为CSV
   */
  exportToCSV(testData) {
    let csv = '';
    
    // 用户数据
    csv += '用户数据\n';
    csv += 'user_id,email,phone,nickname,gender\n';
    testData.users.forEach(user => {
      csv += `${user.user_id},${user.email},${user.phone},${user.nickname},${user.gender}\n`;
    });
    
    csv += '\n评估数据\n';
    csv += 'assessment_id,user_id,assessment_type,score,level\n';
    testData.assessments.forEach(assessment => {
      csv += `${assessment.assessment_id},${assessment.user_id},${assessment.assessment_type},${assessment.score},${assessment.level}\n`;
    });
    
    console.log('\n📊 测试数据CSV:');
    console.log(csv);
    return csv;
  }
};

// 导出
export default testDataGenerator;

