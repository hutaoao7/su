'use strict';

const db = uniCloud.database();
const resp = require('common/response');
const auth = require('common/auth');

exports.main = async (event, context) => {
  try {
    const { action, ...payload } = event;
    
    switch (action) {
      case 'categories':
        return await getCategories();
      case 'list':
        return await getMusicList(payload);
      case 'detail':
        return await getMusicDetail(payload, context);
      case 'progress':
        return await updateProgress(payload, context);
      case 'fav':
        return await toggleFavorite(payload, context);
      default:
        return resp.err(40001, '不支持的操作');
    }
  } catch (error) {
    console.error('fn-music error:', error);
    return resp.err(50000, '服务器错误');
  }
};

// 获取音乐分类
async function getCategories() {
  return resp.ok(['relax', 'focus', 'sleep']);
}

// 获取音乐列表
async function getMusicList({ category, page = 1, pageSize = 20 }) {
  if (!category) {
    return resp.err(40001, '分类参数必填');
  }
  
  const skip = (page - 1) * pageSize;
  
  const musicCollection = db.collection('music');
  
  // 获取总数
  const countResult = await musicCollection.where({
    category: category
  }).count();
  
  // 获取列表
  const listResult = await musicCollection
    .where({
      category: category
    })
    .skip(skip)
    .limit(pageSize)
    .orderBy('createdAt', 'desc')
    .field({
      _id: true,
      title: true,
      duration: true,
      cover: true,
      trialUrl: true,
      fullUrl: true,
      isFree: true
    })
    .get();
  
  // 处理锁定状态
  const list = listResult.data.map(item => ({
    ...item,
    locked: !item.isFree // 简化逻辑，后续可根据用户权限判断
  }));
  
  return resp.ok({
    list,
    total: countResult.total
  });
}

// 获取音乐详情
async function getMusicDetail({ id }, context) {
  if (!id) {
    return resp.err(40001, 'ID参数必填');
  }
  
  const musicCollection = db.collection('music');
  const musicResult = await musicCollection.doc(id).get();
  
  if (musicResult.data.length === 0) {
    return resp.err(41001, '音乐不存在');
  }
  
  const music = musicResult.data[0];
  
  // 检查用户登录状态
  const userInfo = await auth.getUserInfo(context);
  let isFav = false;
  let progressSec = 0;
  
  if (userInfo) {
    // 检查收藏状态
    const favResult = await db.collection('music_fav')
      .where({
        userId: userInfo.uid,
        musicId: id
      })
      .get();
    isFav = favResult.data.length > 0;
    
    // 获取播放进度
    const progressResult = await db.collection('music_progress')
      .where({
        userId: userInfo.uid,
        musicId: id
      })
      .get();
    if (progressResult.data.length > 0) {
      progressSec = progressResult.data[0].sec || 0;
    }
  }
  
  return resp.ok({
    _id: music._id,
    title: music.title,
    intro: music.intro || '',
    scenes: music.scenes || [],
    progressSec,
    isFav,
    fullUrl: music.fullUrl,
    cover: music.cover,
    duration: music.duration
  });
}

// 更新播放进度
async function updateProgress({ id, sec }, context) {
  const userInfo = await auth.getUserInfo(context);
  if (!userInfo) {
    return resp.err(40002, '请先登录');
  }
  
  if (!id || sec === undefined) {
    return resp.err(40001, '参数不完整');
  }
  
  const progressCollection = db.collection('music_progress');
  
  // 检查是否存在记录
  const existResult = await progressCollection
    .where({
      userId: userInfo.uid,
      musicId: id
    })
    .get();
  
  const now = new Date();
  
  if (existResult.data.length > 0) {
    // 更新现有记录
    const existing = existResult.data[0];
    
    // 节流：小于上次+5秒不更新
    if (sec < existing.sec + 5) {
      return resp.ok(true);
    }
    
    await progressCollection.doc(existing._id).update({
      sec: sec,
      updatedAt: now
    });
  } else {
    // 创建新记录
    await progressCollection.add({
      userId: userInfo.uid,
      musicId: id,
      sec: sec,
      updatedAt: now
    });
  }
  
  return resp.ok(true);
}

// 切换收藏状态
async function toggleFavorite({ id, fav }, context) {
  const userInfo = await auth.getUserInfo(context);
  if (!userInfo) {
    return resp.err(40002, '请先登录');
  }
  
  if (!id || fav === undefined) {
    return resp.err(40001, '参数不完整');
  }
  
  const favCollection = db.collection('music_fav');
  
  if (fav) {
    // 添加收藏
    try {
      await favCollection.add({
        userId: userInfo.uid,
        musicId: id,
        createdAt: new Date()
      });
    } catch (error) {
      // 可能已存在，忽略错误
      if (!error.message.includes('duplicate')) {
        throw error;
      }
    }
  } else {
    // 取消收藏
    await favCollection
      .where({
        userId: userInfo.uid,
        musicId: id
      })
      .remove();
  }
  
  return resp.ok(true);
}