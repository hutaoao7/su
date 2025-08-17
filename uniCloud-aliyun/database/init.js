'use strict';

/**
 * 数据库初始化脚本
 * 在uniCloud控制台的云函数中运行此脚本来初始化数据库
 */

const { initDatabase } = require('../common/db');

exports.main = async (event, context) => {
  console.log('开始初始化数据库...');
  
  try {
    // 初始化数据库集合和索引
    const result = await initDatabase();
    
    if (result.success) {
      console.log('数据库初始化成功');
      return {
        success: true,
        message: '数据库初始化完成',
        timestamp: new Date().toISOString()
      };
    } else {
      console.error('数据库初始化失败:', result.message);
      return {
        success: false,
        message: result.message,
        error: result.error,
        timestamp: new Date().toISOString()
      };
    }
    
  } catch (error) {
    console.error('数据库初始化异常:', error);
    return {
      success: false,
      message: '数据库初始化异常',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};