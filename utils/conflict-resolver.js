/**
 * 冲突处理工具
 * 
 * 功能：
 * 1. 检测数据冲突
 * 2. 应用不同的解决策略
 * 3. 合并冲突数据
 * 4. 用户交互选择
 * 
 * @author CraneHeart Team
 * @date 2025-10-21
 */

/**
 * 冲突解决策略枚举
 */
const ConflictStrategy = {
  TIMESTAMP: 'timestamp',      // 时间戳优先
  MERGE: 'merge',              // 合并数据
  LOCAL_FIRST: 'local_first',  // 本地优先
  REMOTE_FIRST: 'remote_first',// 远程优先
  USER_CHOICE: 'user_choice'   // 用户选择
};

/**
 * 冲突解决器类
 */
class ConflictResolver {
  constructor() {
    this.conflictLog = [];
  }
  
  /**
   * 检测并解决冲突
   * 
   * @param {Object} localData - 本地数据
   * @param {Object} remoteData - 远程数据
   * @param {String} dataType - 数据类型
   * @param {String} strategy - 解决策略
   * @returns {Promise<Object>} 解决结果
   */
  async resolve(localData, remoteData, dataType, strategy) {
    console.log('[ConflictResolver] 检测冲突:', dataType);
    
    // 如果没有冲突，直接返回
    if (!this.hasConflict(localData, remoteData)) {
      return {
        hasConflict: false,
        action: 'no_conflict',
        data: remoteData || localData
      };
    }
    
    // 根据策略解决冲突
    let result;
    
    switch (strategy) {
      case ConflictStrategy.TIMESTAMP:
        result = await this.resolveByTimestamp(localData, remoteData);
        break;
        
      case ConflictStrategy.MERGE:
        result = await this.resolveByMerge(localData, remoteData, dataType);
        break;
        
      case ConflictStrategy.LOCAL_FIRST:
        result = this.resolveByLocalFirst(localData, remoteData);
        break;
        
      case ConflictStrategy.REMOTE_FIRST:
        result = this.resolveByRemoteFirst(localData, remoteData);
        break;
        
      case ConflictStrategy.USER_CHOICE:
        result = await this.resolveByUserChoice(localData, remoteData, dataType);
        break;
        
      default:
        // 默认使用时间戳策略
        result = await this.resolveByTimestamp(localData, remoteData);
    }
    
    // 记录冲突日志
    this.logConflict({
      dataType,
      strategy,
      result: result.action,
      timestamp: new Date()
    });
    
    return {
      hasConflict: true,
      ...result
    };
  }
  
  /**
   * 检测是否有冲突
   */
  hasConflict(localData, remoteData) {
    // 如果只有一方有数据，没有冲突
    if (!localData || !remoteData) {
      return false;
    }
    
    // 如果数据相同，没有冲突
    if (JSON.stringify(localData) === JSON.stringify(remoteData)) {
      return false;
    }
    
    // 如果更新时间相同，但内容不同，有冲突
    return true;
  }
  
  /**
   * 策略1：时间戳优先
   */
  async resolveByTimestamp(localData, remoteData) {
    const localTime = this.getTimestamp(localData);
    const remoteTime = this.getTimestamp(remoteData);
    
    if (localTime > remoteTime) {
      return {
        action: 'use_local',
        data: localData,
        reason: '本地数据更新'
      };
    } else if (remoteTime > localTime) {
      return {
        action: 'use_remote',
        data: remoteData,
        reason: '远程数据更新'
      };
    } else {
      // 时间相同，默认使用远程
      return {
        action: 'use_remote',
        data: remoteData,
        reason: '时间相同，使用远程数据'
      };
    }
  }
  
  /**
   * 策略2：合并数据
   */
  async resolveByMerge(localData, remoteData, dataType) {
    let mergedData;
    
    switch (dataType) {
      case 'messages':
        mergedData = this.mergeMessages(localData, remoteData);
        break;
        
      case 'assessment_answers':
        mergedData = this.mergeAnswers(localData, remoteData);
        break;
        
      case 'user_profile':
        mergedData = this.mergeProfile(localData, remoteData);
        break;
        
      default:
        // 默认简单合并
        mergedData = { ...remoteData, ...localData };
    }
    
    return {
      action: 'merge',
      data: mergedData,
      reason: '数据已合并'
    };
  }
  
  /**
   * 策略3：本地优先
   */
  resolveByLocalFirst(localData, remoteData) {
    return {
      action: 'use_local',
      data: localData,
      reason: '本地优先策略'
    };
  }
  
  /**
   * 策略4：远程优先
   */
  resolveByRemoteFirst(localData, remoteData) {
    return {
      action: 'use_remote',
      data: remoteData,
      reason: '远程优先策略'
    };
  }
  
  /**
   * 策略5：用户选择
   */
  async resolveByUserChoice(localData, remoteData, dataType) {
    return new Promise((resolve) => {
      const localPreview = this.formatDataPreview(localData, dataType);
      const remotePreview = this.formatDataPreview(remoteData, dataType);
      
      uni.showModal({
        title: '数据冲突',
        content: `检测到${dataType}数据冲突\n\n本地: ${localPreview}\n\n云端: ${remotePreview}\n\n请选择保留哪个版本`,
        confirmText: '保留本地',
        cancelText: '保留云端',
        success: (res) => {
          if (res.confirm) {
            resolve({
              action: 'use_local',
              data: localData,
              reason: '用户选择本地数据'
            });
          } else {
            resolve({
              action: 'use_remote',
              data: remoteData,
              reason: '用户选择远程数据'
            });
          }
        },
        fail: () => {
          // 用户取消，默认使用远程
          resolve({
            action: 'use_remote',
            data: remoteData,
            reason: '用户取消选择，默认使用远程数据'
          });
        }
      });
    });
  }
  
  /**
   * 合并聊天消息
   */
  mergeMessages(localMessages, remoteMessages) {
    const allMessages = [...(localMessages || []), ...(remoteMessages || [])];
    
    // 去重（根据timestamp或id）
    const uniqueMessages = [];
    const seen = new Set();
    
    for (const msg of allMessages) {
      const key = msg.id || msg.timestamp;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMessages.push(msg);
      }
    }
    
    // 按时间排序
    uniqueMessages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    return uniqueMessages;
  }
  
  /**
   * 合并评估答案
   */
  mergeAnswers(localAnswers, remoteAnswers) {
    const answerMap = new Map();
    
    // 先添加远程答案
    (remoteAnswers || []).forEach(answer => {
      answerMap.set(answer.questionId, answer);
    });
    
    // 用本地答案覆盖（本地优先）
    (localAnswers || []).forEach(answer => {
      answerMap.set(answer.questionId, answer);
    });
    
    return Array.from(answerMap.values());
  }
  
  /**
   * 合并用户资料
   */
  mergeProfile(localProfile, remoteProfile) {
    const merged = { ...remoteProfile };
    
    // 对于每个字段，使用最新的值
    const fields = ['nickname', 'avatar', 'gender', 'birthDate', 'bio'];
    
    fields.forEach(field => {
      const localValue = localProfile[field];
      const remoteValue = remoteProfile[field];
      const localUpdated = localProfile[`${field}UpdatedAt`];
      const remoteUpdated = remoteProfile[`${field}UpdatedAt`];
      
      if (localUpdated && remoteUpdated) {
        // 比较更新时间
        if (new Date(localUpdated) > new Date(remoteUpdated)) {
          merged[field] = localValue;
          merged[`${field}UpdatedAt`] = localUpdated;
        }
      } else if (localValue !== undefined && localValue !== null) {
        // 如果本地有值，远程没有，使用本地
        merged[field] = localValue;
      }
    });
    
    return merged;
  }
  
  /**
   * 获取数据的时间戳
   */
  getTimestamp(data) {
    if (!data) return 0;
    
    // 尝试多个可能的时间字段
    const timeFields = [
      'updatedAt',
      'updated_at',
      'modifiedAt',
      'modified_at',
      'timestamp',
      'createdAt',
      'created_at'
    ];
    
    for (const field of timeFields) {
      if (data[field]) {
        return new Date(data[field]).getTime();
      }
    }
    
    // 如果没有时间字段，返回0
    return 0;
  }
  
  /**
   * 格式化数据预览
   */
  formatDataPreview(data, dataType) {
    if (!data) return '无数据';
    
    switch (dataType) {
      case 'user_profile':
        return `昵称: ${data.nickname || '未设置'}`;
        
      case 'messages':
        return `${Array.isArray(data) ? data.length : 0}条消息`;
        
      case 'assessment_answers':
        return `${Array.isArray(data) ? data.length : 0}个答案`;
        
      default:
        return JSON.stringify(data).substring(0, 50) + '...';
    }
  }
  
  /**
   * 记录冲突日志
   */
  logConflict(log) {
    this.conflictLog.push(log);
    
    // 保持最多100条日志
    if (this.conflictLog.length > 100) {
      this.conflictLog.shift();
    }
    
    console.log('[ConflictResolver] 冲突已解决:', log);
  }
  
  /**
   * 获取冲突日志
   */
  getConflictLog() {
    return this.conflictLog;
  }
  
  /**
   * 清空冲突日志
   */
  clearConflictLog() {
    this.conflictLog = [];
  }
  
  /**
   * 获取冲突统计
   */
  getConflictStats() {
    const stats = {
      total: this.conflictLog.length,
      byType: {},
      byStrategy: {},
      byResult: {}
    };
    
    this.conflictLog.forEach(log => {
      // 按数据类型统计
      stats.byType[log.dataType] = (stats.byType[log.dataType] || 0) + 1;
      
      // 按策略统计
      stats.byStrategy[log.strategy] = (stats.byStrategy[log.strategy] || 0) + 1;
      
      // 按结果统计
      stats.byResult[log.result] = (stats.byResult[log.result] || 0) + 1;
    });
    
    return stats;
  }
}

// 导出单例
const conflictResolver = new ConflictResolver();

export default conflictResolver;
export { ConflictStrategy };

