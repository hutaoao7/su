'use strict';

const db = uniCloud.database();
const resp = require('response');
const auth = require('auth');

exports.main = async (event, context) => {
  try {
    const { action, ...payload } = event;
    
    switch (action) {
      case 'daily':
        return await updateDailySubscription(payload, context);
      default:
        return resp.err(40001, '不支持的操作');
    }
  } catch (error) {
    console.error('fn-subscribe error:', error);
    return resp.err(50000, '服务器错误');
  }
};

// 更新每日订阅设置
async function updateDailySubscription({ enable }, context) {
  const userInfo = await auth.getUserInfo(context);
  if (!userInfo) {
    return resp.err(40002, '请先登录');
  }
  
  if (enable === undefined) {
    return resp.err(40001, 'enable参数必填');
  }
  
  const subscribeCollection = db.collection('subscribe_daily');
  
  // 检查是否已存在记录
  const existResult = await subscribeCollection
    .where({
      userId: userInfo.uid
    })
    .get();
  
  const now = new Date();
  
  if (existResult.data.length > 0) {
    // 更新现有记录
    await subscribeCollection.doc(existResult.data[0]._id).update({
      enable: !!enable,
      updatedAt: now
    });
  } else {
    // 创建新记录
    await subscribeCollection.add({
      userId: userInfo.uid,
      enable: !!enable,
      updatedAt: now
    });
  }
  
  return resp.ok(true);
}