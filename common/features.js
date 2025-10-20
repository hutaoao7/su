// 功能注册表 - 统一管理所有功能的可用性
export const FEATURES = [
  // 核心功能 - 已完成
  { key: 'home', name: '首页', route: '/pages/home/home', enabled: true },
  { key: 'stress-detect', name: '压力检测', route: '/pages-sub/stress/index', enabled: true },
  { key: 'stress-history', name: '检测历史', route: '/pages-sub/stress/history', enabled: true },
  { key: 'intervene', name: '心理干预', route: '/pages-sub/intervene/intervene', enabled: true },
  { key: 'intervene-chat', name: 'AI倾诉', route: '/pages/intervene/chat', enabled: true },
  { key: 'intervene-meditation', name: '正念冥想', route: '/pages-sub/intervene/meditation', enabled: true },
  { key: 'intervene-nature', name: '自然音疗', route: '/pages-sub/intervene/nature', enabled: true },
  { key: 'music', name: '音乐播放', route: '/pages-sub/music/index', enabled: true },
  { key: 'music-player', name: '音乐播放器', route: '/pages-sub/music/player', enabled: true },
  { key: 'user-center', name: '个人中心', route: '/pages/user/home', enabled: true },
  { key: 'user-profile', name: '个人资料', route: '/pages-sub/other/profile', enabled: true },
  { key: 'community', name: '社区交流', route: '/pages/community/index', enabled: true },
  { key: 'settings', name: '设置', route: '/pages-sub/other/settings/settings', enabled: true },
  { key: 'auth-login', name: '登录', route: '/pages/login/login', enabled: true },
  { key: 'cdk-redeem', name: 'CDK兑换', route: '/pages-sub/other/redeem', enabled: true },
  
  // 管理功能 - 已完成
  { key: 'admin-metrics', name: '数据指标', route: '/pages-sub/other/metrics', enabled: true },
  { key: 'cdk-admin', name: 'CDK管理', route: '/pages/cdk/admin-batch', enabled: false },
  
  // 未完成功能 - 禁用
  { key: 'features', name: '功能中心', route: '/pages/features/features', enabled: true },
  { key: 'user-notifications', name: '通知设置', route: '/pages/user/notifications', enabled: false },
  { key: 'user-privacy', name: '隐私设置', route: '/pages/user/privacy', enabled: false },
  { key: 'user-about', name: '关于应用', route: '/pages/user/about', enabled: false },
  { key: 'user-feedback', name: '意见反馈', route: '/pages-sub/other/feedback', enabled: true },
  { key: 'stress-intervention', name: '压力干预', route: '/pages-sub/stress/intervention', enabled: true },
  { key: 'community-detail', name: '社区详情', route: '/pages-sub/community/detail', enabled: true }
]

/**
 * 检查路由是否存在
 * @param {string} path 路由路径
 * @returns {boolean} 路由是否存在
 */
export function routeExists(path) {
  try {
    // 从 pages.json 获取所有页面路径
    const pages = require('../pages.json')
    const mainPages = pages.pages?.map(p => '/' + p.path) || []
    const subPages = (pages.subPackages || []).flatMap(sp => 
      (sp.pages || []).map(p => `/${sp.root}/${p.path}`)
    )
    const allPages = mainPages.concat(subPages)
    return allPages.includes(path)
  } catch (e) {
    console.warn('无法解析 pages.json，默认允许路由:', path)
    return true // 兜底：无法解析则不拦截
  }
}

/**
 * 检查功能是否可用
 * @param {string} key 功能键
 * @returns {boolean} 功能是否可用
 */
export function isFeatureAvailable(key) {
  const feature = FEATURES.find(f => f.key === key)
  return !!(feature && feature.enabled && routeExists(feature.route))
}

/**
 * 获取功能对应的路由
 * @param {string} key 功能键
 * @returns {string} 路由路径
 */
export function getFeatureRoute(key) {
  const feature = FEATURES.find(f => f.key === key)
  return feature ? feature.route : ''
}

/**
 * 获取功能名称
 * @param {string} key 功能键
 * @returns {string} 功能名称
 */
export function getFeatureName(key) {
  const feature = FEATURES.find(f => f.key === key)
  return feature ? feature.name : ''
}

/**
 * 获取所有可用功能
 * @returns {Array} 可用功能列表
 */
export function getAvailableFeatures() {
  return FEATURES.filter(f => isFeatureAvailable(f.key))
}

/**
 * 获取指定类型的功能
 * @param {string} type 功能类型前缀
 * @returns {Array} 匹配的功能列表
 */
export function getFeaturesByType(type) {
  return FEATURES.filter(f => f.key.startsWith(type) && isFeatureAvailable(f.key))
}