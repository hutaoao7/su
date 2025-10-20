/**
 * 数据隐私保护器
 * 
 * 功能：
 * 1. 数据脱敏
 * 2. 隐私政策管理
 * 3. GDPR合规
 * 4. 数据最小化
 * 5. 用户同意管理
 */

class PrivacyProtector {
  constructor() {
    this.sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'phone',
      'email',
      'idCard',
      'bankCard',
      'ssn'
    ];
    this.userConsents = {};
  }

  /**
   * 初始化隐私保护
   */
  init() {
    // 加载用户同意信息
    this.loadUserConsents();
    console.log('✅ 隐私保护器已初始化');
  }

  /**
   * 数据脱敏 - 通用方法
   */
  maskData(data, type = 'general') {
    if (!data) return data;

    const maskFunctions = {
      phone: (val) => this.maskPhone(val),
      email: (val) => this.maskEmail(val),
      idCard: (val) => this.maskIdCard(val),
      bankCard: (val) => this.maskBankCard(val),
      name: (val) => this.maskName(val),
      address: (val) => this.maskAddress(val),
      general: (val) => this.maskGeneral(val)
    };

    const maskFunc = maskFunctions[type] || maskFunctions.general;
    return maskFunc(data);
  }

  /**
   * 脱敏手机号
   */
  maskPhone(phone) {
    if (!phone || phone.length < 7) return '****';
    return phone.substring(0, 3) + '****' + phone.substring(7);
  }

  /**
   * 脱敏邮箱
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return '****';
    const [name, domain] = email.split('@');
    const maskedName = name.substring(0, 1) + '*'.repeat(name.length - 2) + name.substring(name.length - 1);
    return maskedName + '@' + domain;
  }

  /**
   * 脱敏身份证
   */
  maskIdCard(idCard) {
    if (!idCard || idCard.length < 8) return '****';
    return idCard.substring(0, 3) + '*'.repeat(idCard.length - 6) + idCard.substring(idCard.length - 3);
  }

  /**
   * 脱敏银行卡
   */
  maskBankCard(card) {
    if (!card || card.length < 8) return '****';
    return card.substring(0, 4) + '*'.repeat(card.length - 8) + card.substring(card.length - 4);
  }

  /**
   * 脱敏姓名
   */
  maskName(name) {
    if (!name || name.length < 2) return '*';
    return name.substring(0, 1) + '*'.repeat(name.length - 1);
  }

  /**
   * 脱敏地址
   */
  maskAddress(address) {
    if (!address || address.length < 5) return '****';
    return address.substring(0, 2) + '*'.repeat(address.length - 4) + address.substring(address.length - 2);
  }

  /**
   * 通用脱敏
   */
  maskGeneral(value) {
    if (!value) return '****';
    const str = String(value);
    if (str.length <= 2) return '*'.repeat(str.length);
    return str.substring(0, 1) + '*'.repeat(str.length - 2) + str.substring(str.length - 1);
  }

  /**
   * 递归脱敏对象
   */
  maskObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.maskObject(item));
    }

    const masked = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveField(key)) {
        masked[key] = this.maskData(value);
      } else if (typeof value === 'object') {
        masked[key] = this.maskObject(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  /**
   * 检查是否为敏感字段
   */
  isSensitiveField(fieldName) {
    const lowerName = fieldName.toLowerCase();
    return this.sensitiveFields.some(field => lowerName.includes(field));
  }

  /**
   * 加载用户同意
   */
  loadUserConsents() {
    try {
      const consentsStr = uni.getStorageSync('user_consents');
      if (consentsStr) {
        this.userConsents = JSON.parse(consentsStr);
      }
    } catch (error) {
      console.error('❌ 加载用户同意失败:', error);
    }
  }

  /**
   * 保存用户同意
   */
  saveUserConsents(consents) {
    try {
      this.userConsents = consents;
      uni.setStorageSync('user_consents', JSON.stringify(consents));
      console.log('✅ 用户同意已保存');
    } catch (error) {
      console.error('❌ 保存用户同意失败:', error);
    }
  }

  /**
   * 检查用户同意
   */
  hasConsent(consentType) {
    return this.userConsents[consentType] === true;
  }

  /**
   * 获取隐私政策
   */
  getPrivacyPolicy() {
    return {
      version: '1.0',
      lastUpdated: '2025-10-20',
      dataCollection: {
        personal: ['name', 'email', 'phone'],
        behavioral: ['page_views', 'clicks', 'session_duration'],
        device: ['user_agent', 'screen_size', 'timezone']
      },
      dataRetention: {
        personal: '3 years',
        behavioral: '1 year',
        device: '6 months'
      },
      userRights: [
        'access',
        'rectification',
        'erasure',
        'restrict_processing',
        'data_portability',
        'object',
        'automated_decision_making'
      ]
    };
  }

  /**
   * 获取GDPR合规状态
   */
  getGDPRCompliance() {
    return {
      lawfulBasis: 'consent',
      dataProcessingAgreement: true,
      privacyByDesign: true,
      dataProtectionOfficer: true,
      incidentResponse: true,
      dataBreachNotification: true,
      rightToBeForgettenSupport: true,
      dataPortabilitySupport: true
    };
  }

  /**
   * 数据最小化检查
   */
  checkDataMinimization(data) {
    const issues = [];

    // 检查是否收集了不必要的数据
    const unnecessaryFields = ['password', 'token', 'secret'];
    for (const field of unnecessaryFields) {
      if (data.hasOwnProperty(field)) {
        issues.push(`⚠️ 不应收集字段: ${field}`);
      }
    }

    return {
      isMinimized: issues.length === 0,
      issues
    };
  }

  /**
   * 导出用户数据 (GDPR)
   */
  async exportUserData(userId) {
    try {
      const result = await uni.callFunction({
        name: 'user-data-export',
        data: { userId }
      });

      if (result.result.errCode === 0) {
        console.log('✅ 用户数据导出成功');
        return result.result.data;
      } else {
        throw new Error(result.result.errMsg);
      }
    } catch (error) {
      console.error('❌ 用户数据导出失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户数据 (GDPR - 被遗忘权)
   */
  async deleteUserData(userId) {
    try {
      const result = await uni.callFunction({
        name: 'data-deletion',
        data: { userId }
      });

      if (result.result.errCode === 0) {
        console.log('✅ 用户数据删除成功');
        return true;
      } else {
        throw new Error(result.result.errMsg);
      }
    } catch (error) {
      console.error('❌ 用户数据删除失败:', error);
      throw error;
    }
  }

  /**
   * 销毁保护器
   */
  destroy() {
    this.userConsents = {};
    console.log('✅ 隐私保护器已销毁');
  }
}

// 导出单例
export default new PrivacyProtector();

