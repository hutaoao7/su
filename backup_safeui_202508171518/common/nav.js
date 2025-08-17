// 导航工具函数
import { getFeatureRoute, isFeatureAvailable } from './features.js'

/**
 * 获取当前路由信息
 * @returns {string} 当前路由路径
 */
export function currentRoute() {
  try {
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const route = currentPage.route || currentPage.__route__
      const options = currentPage.options || {}
      
      // 构建完整路径
      let fullPath = '/' + route
      const queryParams = Object.keys(options)
      if (queryParams.length > 0) {
        const queryString = queryParams.map(key => `${key}=${encodeURIComponent(options[key])}`).join('&')
        fullPath += '?' + queryString
      }
      
      return fullPath
    }
    return '/pages/home/home'
  } catch (e) {
    console.error('获取当前路由失败:', e)
    return '/pages/home/home'
  }
}

/**
 * 统一导航跳转方法
 * @param {string} url 目标URL
 */
export function go(url) {
  if (!url || typeof url !== 'string') {
    console.error('无效的URL:', url)
    return
  }
  
  try {
    // 清理URL，移除多余的斜杠
    url = url.replace(/\/+/g, '/')
    if (!url.startsWith('/')) {
      url = '/' + url
    }
    
    // 判断是否为tabBar页面
    const tabBarPages = [
      '/pages/home/home',
      '/pages/features/features', 
      '/pages/settings/settings'
    ]
    
    const isTabPage = tabBarPages.includes(url.split('?')[0])
    
    if (isTabPage) {
      // tabBar页面使用switchTab
      uni.switchTab({
        url: url.split('?')[0], // switchTab不支持参数
        success: () => {
          console.log('switchTab成功:', url)
        },
        fail: (error) => {
          console.error('switchTab失败:', error)
          // 兜底：使用reLaunch
          uni.reLaunch({
            url: url.split('?')[0]
          })
        }
      })
    } else {
      // 普通页面使用navigateTo
      uni.navigateTo({
        url: url,
        success: () => {
          console.log('navigateTo成功:', url)
        },
        fail: (error) => {
          console.error('navigateTo失败:', error)
          // 兜底：使用reLaunch
          uni.reLaunch({
            url: url,
            fail: (error2) => {
              console.error('reLaunch也失败:', error2)
              uni.showToast({
                title: '跳转失败',
                icon: 'none'
              })
            }
          })
        }
      })
    }
  } catch (e) {
    console.error('导航跳转失败:', e)
    uni.showToast({
      title: '跳转失败',
      icon: 'none'
    })
  }
}

/**
 * 跳转到指定功能页面
 * @param {string} featureKey 功能键
 * @param {string} fromRoute 来源路由（可选）
 */
export function goFeature(featureKey, fromRoute = '') {
  try {
    // 检查功能是否可用
    if (!isFeatureAvailable(featureKey)) {
      uni.showToast({
        title: '功能暂未开放',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 获取功能路由
    const route = getFeatureRoute(featureKey)
    if (!route) {
      uni.showToast({
        title: '页面不存在',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 构建跳转URL
    let url = route
    if (fromRoute) {
      url += (route.includes('?') ? '&' : '?') + 'from=' + encodeURIComponent(fromRoute)
    }
    
    // 使用统一的go方法
    go(url)
  } catch (e) {
    console.error('goFeature执行失败:', e)
    uni.showToast({
      title: '跳转失败',
      icon: 'none'
    })
  }
}

/**
 * 安全返回上一页
 * @param {string} fallbackUrl 回退URL
 */
export function safeNavigateBack(fallbackUrl = '/pages/home/home') {
  try {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
    } else {
      uni.reLaunch({
        url: fallbackUrl
      })
    }
  } catch (e) {
    console.error('返回失败:', e)
    uni.reLaunch({
      url: fallbackUrl
    })
  }
}

/**
 * 跳转到登录页
 * @param {string} fromRoute 来源路由
 */
export function goLogin(fromRoute = '') {
  const from = fromRoute || currentRoute()
  const url = `/pages/auth/login?from=${encodeURIComponent(from)}`
  
  uni.navigateTo({
    url: url,
    fail: (error) => {
      console.error('跳转登录页失败:', error)
      uni.reLaunch({
        url: '/pages/auth/login'
      })
    }
  })
}

/**
 * 退出登录
 */
export function logout() {
  try {
    // 清除本地存储
    uni.removeStorageSync('AUTH_TOKEN')
    uni.removeStorageSync('AUTH_USER') 
    uni.removeStorageSync('AUTH_ROLE')
    uni.removeStorageSync('uni_id_token')
    uni.removeStorageSync('uni_id_token_expired')
    uni.removeStorageSync('userInfo')
    
    uni.showToast({
      title: '已退出登录',
      icon: 'success'
    })
    
    // 跳转到登录页
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/auth/login'
      })
    }, 1500)
  } catch (e) {
    console.error('退出登录失败:', e)
    uni.showToast({
      title: '退出失败',
      icon: 'none'
    })
  }
}