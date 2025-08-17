/**
 * 获取当前页面路由信息
 * @returns {string} 当前页面的完整路径（包含查询参数）
 */
export function getCurrentRoute() {
  const pages = getCurrentPages()
  if (pages.length === 0) {
    return '/pages/user/home'
  }
  
  const currentPage = pages[pages.length - 1]
  let route = currentPage.route || currentPage.__route__
  
  // 处理查询参数
  const options = currentPage.options || {}
  const queryString = Object.keys(options)
    .map(key => `${key}=${options[key]}`)
    .join('&')
  
  if (queryString) {
    route += `?${queryString}`
  }
  
  return route.startsWith('/') ? route : `/${route}`
}

/**
 * 安全的页面跳转返回
 * @param {string} fallbackUrl 备用跳转地址
 */
export function safeNavigateBack(fallbackUrl = '/pages/index/index') {
  const pages = getCurrentPages()
  
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({
      url: fallbackUrl
    })
  }
}