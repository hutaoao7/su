/**
 * 安全审计器
 * 
 * 功能：
 * 1. 安全日志记录
 * 2. 审计追踪
 * 3. 漏洞扫描
 * 4. 安全事件检测
 * 5. 合规性检查
 */

class SecurityAuditor {
  constructor() {
    this.auditLogs = [];
    this.maxLogs = 1000;
    this.securityEvents = [];
    this.vulnerabilities = [];
  }

  /**
   * 初始化安全审计
   */
  init() {
    console.log('✅ 安全审计器已初始化');
  }

  /**
   * 记录审计日志
   */
  logAudit(action, details = {}) {
    const log = {
      id: this.generateId(),
      action,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    };

    this.auditLogs.push(log);

    // 保持日志大小
    if (this.auditLogs.length > this.maxLogs) {
      this.auditLogs.shift();
    }

    console.log(`📝 审计日志: ${action}`);
    return log;
  }

  /**
   * 记录登录事件
   */
  logLogin(userId, success = true, reason = '') {
    return this.logAudit('LOGIN', {
      userId,
      success,
      reason,
      timestamp: Date.now()
    });
  }

  /**
   * 记录登出事件
   */
  logLogout(userId) {
    return this.logAudit('LOGOUT', {
      userId,
      timestamp: Date.now()
    });
  }

  /**
   * 记录数据访问
   */
  logDataAccess(userId, dataType, action = 'read') {
    return this.logAudit('DATA_ACCESS', {
      userId,
      dataType,
      action,
      timestamp: Date.now()
    });
  }

  /**
   * 记录数据修改
   */
  logDataModification(userId, dataType, changes = {}) {
    return this.logAudit('DATA_MODIFICATION', {
      userId,
      dataType,
      changes,
      timestamp: Date.now()
    });
  }

  /**
   * 记录数据删除
   */
  logDataDeletion(userId, dataType, reason = '') {
    return this.logAudit('DATA_DELETION', {
      userId,
      dataType,
      reason,
      timestamp: Date.now()
    });
  }

  /**
   * 记录权限变更
   */
  logPermissionChange(userId, permission, granted = true) {
    return this.logAudit('PERMISSION_CHANGE', {
      userId,
      permission,
      granted,
      timestamp: Date.now()
    });
  }

  /**
   * 记录安全事件
   */
  logSecurityEvent(eventType, severity = 'medium', details = {}) {
    const event = {
      id: this.generateId(),
      eventType,
      severity,
      details,
      timestamp: Date.now(),
      userId: this.getUserId()
    };

    this.securityEvents.push(event);

    console.warn(`⚠️ 安全事件: ${eventType} (${severity})`);

    // 高严重性事件立即上报
    if (severity === 'critical' || severity === 'high') {
      this.reportSecurityEvent(event);
    }

    return event;
  }

  /**
   * 检测异常登录
   */
  detectAnomalousLogin(userId, location, device) {
    // 简单的异常检测逻辑
    const lastLogin = this.getLastLogin(userId);
    
    if (lastLogin) {
      const timeDiff = Date.now() - lastLogin.timestamp;
      const locationChanged = lastLogin.location !== location;
      const deviceChanged = lastLogin.device !== device;

      if (locationChanged || deviceChanged) {
        this.logSecurityEvent('ANOMALOUS_LOGIN', 'medium', {
          userId,
          location,
          device,
          lastLocation: lastLogin.location,
          lastDevice: lastLogin.device
        });

        return true;
      }
    }

    return false;
  }

  /**
   * 检测暴力破解
   */
  detectBruteForce(userId, attempts = 0) {
    const threshold = 5; // 5次失败尝试
    
    if (attempts >= threshold) {
      this.logSecurityEvent('BRUTE_FORCE_ATTEMPT', 'high', {
        userId,
        attempts
      });

      return true;
    }

    return false;
  }

  /**
   * 检测SQL注入
   */
  detectSQLInjection(input) {
    const sqlPatterns = [
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /(-{2}|\/\*|\*\/|;)/,
      /(OR|AND)\s+1\s*=\s*1/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        this.logSecurityEvent('SQL_INJECTION_ATTEMPT', 'critical', {
          input: input.substring(0, 100)
        });

        return true;
      }
    }

    return false;
  }

  /**
   * 检测XSS攻击
   */
  detectXSS(input) {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        this.logSecurityEvent('XSS_ATTEMPT', 'critical', {
          input: input.substring(0, 100)
        });

        return true;
      }
    }

    return false;
  }

  /**
   * 获取最后一次登录
   */
  getLastLogin(userId) {
    const logins = this.auditLogs.filter(log => 
      log.action === 'LOGIN' && log.details.userId === userId && log.details.success
    );
    return logins[logins.length - 1];
  }

  /**
   * 获取审计日志
   */
  getAuditLogs(filter = {}) {
    let logs = this.auditLogs;

    if (filter.action) {
      logs = logs.filter(log => log.action === filter.action);
    }

    if (filter.userId) {
      logs = logs.filter(log => log.userId === filter.userId);
    }

    if (filter.startTime && filter.endTime) {
      logs = logs.filter(log => 
        log.timestamp >= filter.startTime && log.timestamp <= filter.endTime
      );
    }

    return logs;
  }

  /**
   * 获取安全事件
   */
  getSecurityEvents(severity = null) {
    if (severity) {
      return this.securityEvents.filter(event => event.severity === severity);
    }
    return this.securityEvents;
  }

  /**
   * 上报安全事件
   */
  async reportSecurityEvent(event) {
    try {
      const result = await uni.callFunction({
        name: 'audit-log',
        data: {
          type: 'security_event',
          event
        }
      });

      if (result.result.errCode === 0) {
        console.log('✅ 安全事件已上报');
      }
    } catch (error) {
      console.error('❌ 安全事件上报失败:', error);
    }
  }

  /**
   * 生成审计报告
   */
  generateAuditReport(startTime, endTime) {
    const logs = this.getAuditLogs({ startTime, endTime });
    const events = this.securityEvents.filter(e => 
      e.timestamp >= startTime && e.timestamp <= endTime
    );

    return {
      period: { startTime, endTime },
      totalLogs: logs.length,
      totalEvents: events.length,
      eventsBySeverity: {
        critical: events.filter(e => e.severity === 'critical').length,
        high: events.filter(e => e.severity === 'high').length,
        medium: events.filter(e => e.severity === 'medium').length,
        low: events.filter(e => e.severity === 'low').length
      },
      logs,
      events
    };
  }

  /**
   * 生成ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取用户ID
   */
  getUserId() {
    try {
      const userStr = uni.getStorageSync('user_info');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch (error) {
      console.error('❌ 获取用户ID失败:', error);
    }
    return 'unknown';
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.auditLogs = [];
    this.securityEvents = [];
    console.log('✅ 审计日志已清空');
  }

  /**
   * 销毁审计器
   */
  destroy() {
    this.clearLogs();
    console.log('✅ 安全审计器已销毁');
  }
}

// 导出单例
export default new SecurityAuditor();

