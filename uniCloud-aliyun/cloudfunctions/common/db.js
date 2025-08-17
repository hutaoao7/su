'use strict';

// 数据库连接管理
let dbInstance = null;

/**
 * 获取数据库实例
 */
function getDB() {
  if (!dbInstance) {
    dbInstance = uniCloud.database();
  }
  return dbInstance;
}

/**
 * 初始化数据库集合和索引
 */
async function initDatabase() {
  const db = getDB();
  
  try {
    // 创建users集合
    const usersCollection = db.collection('users');
    
    // 创建唯一索引：account
    await usersCollection.createIndex({
      name: 'account_unique',
      unique: true,
      fields: [{ name: 'account', direction: 1 }]
    });
    
    // 创建普通索引：role
    await usersCollection.createIndex({
      name: 'role_index',
      fields: [{ name: 'role', direction: 1 }]
    });
    
    // 创建索引：createdAt（用于排序）
    await usersCollection.createIndex({
      name: 'createdAt_index',
      fields: [{ name: 'createdAt', direction: -1 }]
    });
    
    console.log('数据库初始化完成');
    return { success: true, message: '数据库初始化完成' };
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return { success: false, message: '数据库初始化失败', error: error.message };
  }
}

/**
 * 检查集合是否存在
 */
async function checkCollectionExists(collectionName) {
  try {
    const db = getDB();
    const result = await db.collection(collectionName).limit(1).get();
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getDB,
  initDatabase,
  checkCollectionExists
};