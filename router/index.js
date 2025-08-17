// 简化的路由模块，不依赖uni-simple-router
import { checkRouteAccess } from '@/utils/auth.js';

// 导出空对象，避免main.js报错
export default {
  install() {
    console.log('[路由] 使用原生路由拦截');
  }
};
