# 问题排查记录

## 问题1: uView引入路径错误

**时间**: 2025-10-12  
**问题**: 编译报错 `Failed to find 'uview-ui/index.scss'`

### 错误现象

```
Error: Failed to find 'uview-ui/index.scss'
文件查找失败: 'uview-ui/components/u-button/u-button.vue'
```

### 根本原因

uview-ui插件安装在 `uni_modules/uview-ui` 目录，但引入路径使用的是 `uview-ui/...`（npm方式），导致找不到文件。

### 解决方案

修正所有uView引入路径为uni_modules方式：

1. **App.vue**:
```diff
-@import 'uview-ui/index.scss';
+@import '@/uni_modules/uview-ui/index.scss';
```

2. **uni.scss**:
```diff
-@import 'uview-ui/theme.scss';
+@import '@/uni_modules/uview-ui/theme.scss';
```

3. **pages.json**:
```diff
"easycom": {
  "custom": {
-   "^u-(.*)": "uview-ui/components/u-$1/u-$1.vue"
+   "^u-(.*)": "@/uni_modules/uview-ui/components/u-$1/u-$1.vue"
  }
}
```

4. **main.js**:
```javascript
// 优先从uni_modules加载
uViewPlugin =
  tryRequire('@/uni_modules/uview-ui/index.js') ||
  tryRequire('@/uni_modules/uview-ui') ||
  tryRequire('uview-ui')
```

### 验证

重新编译后应无此错误。

---

**状态**: ✅ 已修正  
**验证**: 待用户重新编译确认

---

## 问题2: App.vue style标签语法错误

**时间**: 2025-10-12  
**问题**: 编译报错 `SyntaxError: Unknown word` 在 `@for $i from 1 through 5`

### 错误现象

```
SyntaxError
(4:12) Unknown word
  2 | // 采自uView的温馨提示
  3 | @for $i from 1 through 5 {
> 4 |     .u-line-#{$i} {
```

### 根本原因

App.vue的 `<style>` 标签没有指定 `lang="scss"` 属性，导致无法解析SCSS语法（@import uview的scss文件包含@for等SCSS特性）。

### 解决方案

```diff
-<style>
+<style lang="scss">
 @import '@/uni_modules/uview-ui/index.scss';
```

### 说明

uView组件库使用SCSS编写，引入其样式文件时必须指定 `lang="scss"`，否则会被当作普通CSS解析导致语法错误。

**状态**: ✅ 已修正  
**验证**: 待用户重新编译确认

---

## 问题3: u-popup组件props未定义错误

**时间**: 2025-10-12  
**问题**: `TypeError: Cannot read property 'props' of undefined` 在使用u-popup组件时

### 错误现象

```
TypeError: Cannot read property 'props' of undefined
  at Object.<anonymous> (props.js:6)
  at Object.296 (vendor.js:18280)
  at __webpack_require__ (null:91)
  at Object.<anonymous> (u-popup.vue:48)
  at Object.295 (u-popup.js:388)
```

### 根本原因

u-popup组件的props.js文件在模块加载时就尝试访问`uni.$u.props.popup`，但此时uView可能还没有完成初始化，导致`uni.$u.props`未定义。

### 解决方案

1. **创建初始化文件** (`uni_modules/uview-ui/init.js`):
```javascript
// 确保uni.$u.props存在默认值
if (typeof uni !== 'undefined' && !uni.$u) {
    uni.$u = {}
}
if (typeof uni !== 'undefined' && uni.$u && !uni.$u.props) {
    uni.$u.props = {
        popup: { /* 默认配置 */ }
    }
}
```

2. **在main.js中先导入初始化文件**:
```javascript
import '@/uni_modules/uview-ui/init.js'
import uView from '@/uni_modules/uview-ui'
Vue.use(uView)
```

3. **修改u-popup/props.js使用函数式默认值**:
```javascript
// 之前（错误）
default: uni.$u.props.popup.show

// 之后（正确）
default: () => uni.$u?.props?.popup?.show ?? false
```

### 关键修改文件

1. `main.js` - 添加初始化导入
2. `uni_modules/uview-ui/init.js` - 新增初始化文件
3. `uni_modules/uview-ui/components/u-popup/props.js` - 使用安全的函数式默认值

**状态**: ✅ 已修正  
**验证**: 待用户重新编译确认

