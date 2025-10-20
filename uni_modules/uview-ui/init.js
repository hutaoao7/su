// 在任何uView组件执行前，初始化 uni.$u 以及默认 props
// 注意：此文件需尽早被引入（main.js 顶部）

import config from './libs/config/config.js'
import props from './libs/config/props.js'
import zIndex from './libs/config/zIndex.js'
import color from './libs/config/color.js'

if (typeof uni !== 'undefined') {
    if (!uni.$u) uni.$u = {}
    // 仅在未设置时初始化，避免与后续 Vue.use(uView) 冲突
    uni.$u.config = uni.$u.config || config
    uni.$u.props = uni.$u.props || props
    uni.$u.zIndex = uni.$u.zIndex || zIndex
    uni.$u.color = uni.$u.color || color
}

export default {}
