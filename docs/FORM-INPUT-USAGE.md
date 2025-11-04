# 表单输入优化使用指南

## 📋 概述

表单输入优化系统提供增强型输入框组件和完善的验证工具，大幅提升表单交互体验。

**位置**:
- 组件: `components/common/EnhancedInput.vue`
- 验证工具: `utils/form-validator.js`

**版本**: 1.0.0  
**日期**: 2025-11-04

---

## 🎯 核心功能

### EnhancedInput 组件

- ✅ **自动聚焦**: 支持页面加载时自动聚焦
- ✅ **实时验证**: 输入时即时反馈错误信息
- ✅ **清空按钮**: 一键清空输入内容
- ✅ **密码切换**: 显示/隐藏密码
- ✅ **字数统计**: 实时显示字数和限制
- ✅ **输入历史**: 自动保存和提示历史输入
- ✅ **前后置图标**: 支持自定义图标
- ✅ **多种类型**: text/number/password/textarea

### FormValidator 工具

- ✅ **20+常用正则**: 手机号、邮箱、身份证等
- ✅ **15+验证规则**: 必填、长度、范围、自定义等
- ✅ **预定义规则集**: 常用字段的验证规则
- ✅ **表单管理器**: 统一管理多字段验证

---

## 📖 使用方法

### 一、基础输入框

```vue
<template>
  <enhanced-input
    v-model="username"
    label="用户名"
    placeholder="请输入用户名"
    :required="true"
    clearable
  />
</template>

<script>
import EnhancedInput from '@/components/common/EnhancedInput.vue';

export default {
  components: { EnhancedInput },
  data() {
    return {
      username: ''
    };
  }
}
</script>
```

---

### 二、带验证的输入框

```vue
<template>
  <enhanced-input
    v-model="mobile"
    label="手机号"
    type="number"
    placeholder="请输入手机号"
    prefix-icon="phone"
    :required="true"
    :rules="mobileRules"
    clearable
  />
</template>

<script>
import EnhancedInput from '@/components/common/EnhancedInput.vue';
import { FormValidator } from '@/utils/form-validator.js';

export default {
  components: { EnhancedInput },
  
  data() {
    return {
      mobile: '',
      mobileRules: [
        FormValidator.required('请输入手机号'),
        FormValidator.mobile()
      ]
    };
  }
}
</script>
```

---

### 三、密码输入框

```vue
<template>
  <view>
    <!-- 密码输入 -->
    <enhanced-input
      v-model="password"
      type="password"
      label="密码"
      placeholder="请输入密码"
      prefix-icon="lock"
      :required="true"
      :rules="passwordRules"
      hint="密码需包含字母和数字，长度6-16位"
    />
    
    <!-- 确认密码 -->
    <enhanced-input
      v-model="confirmPassword"
      type="password"
      label="确认密码"
      placeholder="请再次输入密码"
      prefix-icon="lock"
      :required="true"
      :rules="confirmPasswordRules"
    />
  </view>
</template>

<script>
import EnhancedInput from '@/components/common/EnhancedInput.vue';
import { FormValidator } from '@/utils/form-validator.js';

export default {
  components: { EnhancedInput },
  
  data() {
    return {
      password: '',
      confirmPassword: '',
      passwordRules: [
        FormValidator.required('请输入密码'),
        FormValidator.mediumPassword()
      ],
      confirmPasswordRules: [
        FormValidator.required('请再次输入密码'),
        FormValidator.confirmPassword(() => this.password, '两次密码输入不一致')
      ]
    };
  }
}
</script>
```

---

### 四、带输入历史的搜索框

```vue
<template>
  <enhanced-input
    v-model="keyword"
    label="搜索"
    placeholder="搜索音乐、话题..."
    prefix-icon="search"
    clearable
    show-history
    history-key="music_search"
    :max-history="10"
    @confirm="handleSearch"
  />
</template>

<script>
import EnhancedInput from '@/components/common/EnhancedInput.vue';

export default {
  components: { EnhancedInput },
  
  data() {
    return {
      keyword: ''
    };
  },
  
  methods: {
    handleSearch() {
      if (!this.keyword) return;
      
      console.log('搜索:', this.keyword);
      // 执行搜索逻辑
      this.doSearch(this.keyword);
    }
  }
}
</script>
```

---

### 五、多行文本框

```vue
<template>
  <enhanced-input
    v-model="content"
    label="内容"
    placeholder="请输入内容..."
    is-textarea
    :auto-height="true"
    :maxlength="500"
    :show-word-limit="true"
    :rules="contentRules"
  />
</template>

<script>
import EnhancedInput from '@/components/common/EnhancedInput.vue';
import { FormValidator } from '@/utils/form-validator.js';

export default {
  components: { EnhancedInput },
  
  data() {
    return {
      content: '',
      contentRules: [
        FormValidator.required('请输入内容'),
        FormValidator.minLength(10, '内容至少10个字')
      ]
    };
  }
}
</script>
```

---

### 六、完整的注册表单示例

```vue
<template>
  <view class="register-form">
    <view class="form-title">用户注册</view>
    
    <!-- 用户名 -->
    <enhanced-input
      v-model="formData.username"
      label="用户名"
      placeholder="请输入用户名"
      prefix-icon="account"
      :required="true"
      :rules="rules.username"
      :auto-focus="true"
      clearable
    />
    
    <!-- 手机号 -->
    <enhanced-input
      v-model="formData.mobile"
      label="手机号"
      type="number"
      placeholder="请输入手机号"
      prefix-icon="phone"
      :required="true"
      :rules="rules.mobile"
      clearable
    />
    
    <!-- 验证码 -->
    <view class="code-wrapper">
      <enhanced-input
        v-model="formData.code"
        label="验证码"
        type="number"
        placeholder="请输入验证码"
        prefix-icon="checkmark-circle"
        :required="true"
        :rules="rules.code"
        :maxlength="6"
        clearable
      />
      <button 
        class="send-code-btn"
        @tap="sendCode"
        :disabled="countdown > 0"
      >
        {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
      </button>
    </view>
    
    <!-- 密码 -->
    <enhanced-input
      v-model="formData.password"
      type="password"
      label="密码"
      placeholder="请输入密码"
      prefix-icon="lock"
      :required="true"
      :rules="rules.password"
      hint="密码需包含字母和数字，长度6-16位"
    />
    
    <!-- 确认密码 -->
    <enhanced-input
      v-model="formData.confirmPassword"
      type="password"
      label="确认密码"
      placeholder="请再次输入密码"
      prefix-icon="lock"
      :required="true"
      :rules="rules.confirmPassword"
    />
    
    <!-- 邮箱（可选） -->
    <enhanced-input
      v-model="formData.email"
      label="邮箱"
      type="text"
      placeholder="请输入邮箱（可选）"
      prefix-icon="email"
      :rules="rules.email"
      clearable
    />
    
    <!-- 提交按钮 -->
    <button 
      class="submit-btn"
      @tap="handleSubmit"
      :disabled="submitting"
    >
      {{ submitting ? '注册中...' : '立即注册' }}
    </button>
  </view>
</template>

<script>
import EnhancedInput from '@/components/common/EnhancedInput.vue';
import { FormValidator } from '@/utils/form-validator.js';

export default {
  components: { EnhancedInput },
  
  data() {
    return {
      formData: {
        username: '',
        mobile: '',
        code: '',
        password: '',
        confirmPassword: '',
        email: ''
      },
      
      rules: {
        username: [
          FormValidator.required('请输入用户名'),
          FormValidator.username()
        ],
        mobile: [
          FormValidator.required('请输入手机号'),
          FormValidator.mobile()
        ],
        code: [
          FormValidator.required('请输入验证码'),
          FormValidator.pattern(/^\d{6}$/, '请输入6位验证码')
        ],
        password: [
          FormValidator.required('请输入密码'),
          FormValidator.mediumPassword()
        ],
        confirmPassword: [
          FormValidator.required('请再次输入密码'),
          FormValidator.confirmPassword(() => this.formData.password)
        ],
        email: [
          FormValidator.email() // 可选，但如果填写则必须正确
        ]
      },
      
      submitting: false,
      countdown: 0,
      timer: null
    };
  },
  
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  
  methods: {
    /**
     * 发送验证码
     */
    async sendCode() {
      // 验证手机号
      if (!this.formData.mobile) {
        uni.showToast({ title: '请输入手机号', icon: 'none' });
        return;
      }
      
      if (!/^1[3-9]\d{9}$/.test(this.formData.mobile)) {
        uni.showToast({ title: '手机号格式不正确', icon: 'none' });
        return;
      }
      
      try {
        // 调用发送验证码接口
        await this.sendVerifyCode(this.formData.mobile);
        
        uni.showToast({ title: '验证码已发送', icon: 'success' });
        
        // 开始倒计时
        this.countdown = 60;
        this.timer = setInterval(() => {
          this.countdown--;
          if (this.countdown <= 0) {
            clearInterval(this.timer);
            this.timer = null;
          }
        }, 1000);
        
      } catch (error) {
        uni.showToast({ 
          title: error.message || '发送失败', 
          icon: 'none' 
        });
      }
    },
    
    /**
     * 提交表单
     */
    async handleSubmit() {
      // 验证所有字段
      const fields = this.$children.filter(child => child.$options.name === 'EnhancedInput');
      let isValid = true;
      
      for (const field of fields) {
        if (!field.validate()) {
          isValid = false;
        }
      }
      
      if (!isValid) {
        uni.showToast({ title: '请检查表单填写', icon: 'none' });
        return;
      }
      
      this.submitting = true;
      
      try {
        // 调用注册接口
        await this.register(this.formData);
        
        uni.showToast({ 
          title: '注册成功', 
          icon: 'success',
          duration: 2000
        });
        
        // 跳转到登录页
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/login/login' });
        }, 2000);
        
      } catch (error) {
        uni.showToast({ 
          title: error.message || '注册失败', 
          icon: 'none' 
        });
      } finally {
        this.submitting = false;
      }
    },
    
    /**
     * 发送验证码接口（示例）
     */
    async sendVerifyCode(mobile) {
      // 实际调用云函数
      const { result } = await uniCloud.callFunction({
        name: 'send-verify-code',
        data: { mobile }
      });
      return result;
    },
    
    /**
     * 注册接口（示例）
     */
    async register(data) {
      const { result } = await uniCloud.callFunction({
        name: 'user-register',
        data
      });
      return result;
    }
  }
}
</script>

<style scoped>
.register-form {
  padding: 40rpx;
}

.form-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #303133;
  margin-bottom: 60rpx;
  text-align: center;
}

.code-wrapper {
  position: relative;
}

.send-code-btn {
  position: absolute;
  right: 0;
  top: 60rpx;
  padding: 0 20rpx;
  height: 60rpx;
  line-height: 60rpx;
  background-color: #1989fa;
  color: #fff;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.send-code-btn[disabled] {
  background-color: #c0c4cc;
}

.submit-btn {
  margin-top: 60rpx;
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #1989fa;
  color: #fff;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.submit-btn[disabled] {
  background-color: #c0c4cc;
}
</style>
```

---

## 📚 API 文档

### EnhancedInput Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value / v-model | String/Number | '' | 输入框值 |
| type | String | 'text' | 输入类型：text/number/idcard/digit/password |
| label | String | '' | 标签文本 |
| required | Boolean | false | 是否必填（显示*标记） |
| placeholder | String | '请输入' | 占位符 |
| maxlength | Number | 140 | 最大长度 |
| disabled | Boolean | false | 是否禁用 |
| clearable | Boolean | true | 是否显示清空按钮 |
| showWordLimit | Boolean | false | 是否显示字数统计 |
| autoFocus | Boolean | false | 是否自动聚焦 |
| prefixIcon | String | '' | 前置图标 |
| suffixIcon | String | '' | 后置图标 |
| isTextarea | Boolean | false | 是否为多行文本 |
| autoHeight | Boolean | false | textarea自动高度 |
| rules | Array | [] | 验证规则数组 |
| hint | String | '' | 提示信息 |
| showHistory | Boolean | false | 是否显示输入历史 |
| historyKey | String | '' | 历史记录存储key |
| maxHistory | Number | 5 | 最多保存历史数 |

### EnhancedInput Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| input | value | 输入时触发 |
| change | value | 值改变时触发 |
| focus | - | 聚焦时触发 |
| blur | - | 失焦时触发 |
| confirm | value | 点击完成按钮时触发 |
| clear | - | 点击清空按钮时触发 |

### EnhancedInput Methods

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| validate | - | Boolean | 验证输入 |
| handleClear | - | - | 清空输入 |

---

## 🔧 验证规则

### FormValidator 方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| required | message? | Rule | 必填验证 |
| mobile | message? | Rule | 手机号验证 |
| email | message? | Rule | 邮箱验证 |
| idCard | message? | Rule | 身份证验证 |
| minLength | min, message? | Rule | 最小长度 |
| maxLength | max, message? | Rule | 最大长度 |
| rangeLength | min, max, message? | Rule | 长度范围 |
| strongPassword | message? | Rule | 强密码验证 |
| mediumPassword | message? | Rule | 中等密码验证 |
| username | message? | Rule | 用户名验证 |
| number | message? | Rule | 数字验证 |
| range | min, max, message? | Rule | 数字范围 |
| url | message? | Rule | URL验证 |
| pattern | regex, message? | Rule | 自定义正则 |
| custom | validator, message? | Rule | 自定义函数 |
| confirmPassword | getPassword, message? | Rule | 确认密码 |
| age | min?, max?, message? | Rule | 年龄验证 |

### 常用正则表达式

```javascript
import { patterns } from '@/utils/form-validator.js';

// 手机号
patterns.mobile // /^1[3-9]\d{9}$/

// 邮箱
patterns.email

// 身份证
patterns.idCard

// 强密码
patterns.strongPassword

// 中文
patterns.chinese

// URL
patterns.url

// ... 更多正则
```

### 预定义规则集

```javascript
import { commonRules } from '@/utils/form-validator.js';

// 用户名规则
commonRules.username

// 密码规则
commonRules.password

// 手机号规则
commonRules.mobile

// 邮箱规则
commonRules.email

// 身份证规则
commonRules.idCard

// 真实姓名规则
commonRules.realName

// 昵称规则
commonRules.nickname

// 验证码规则
commonRules.verifyCode

// 年龄规则
commonRules.age
```

---

## 🎯 最佳实践

### 1. 关键字段自动聚焦

```vue
<!-- 登录页面，用户名自动聚焦 -->
<enhanced-input
  v-model="username"
  :auto-focus="true"
/>
```

### 2. 敏感信息禁用输入历史

```vue
<!-- 密码输入框不保存历史 -->
<enhanced-input
  v-model="password"
  type="password"
  :show-history="false"
/>
```

### 3. 长内容使用字数统计

```vue
<!-- 文章内容，显示字数 -->
<enhanced-input
  v-model="content"
  is-textarea
  :maxlength="1000"
  :show-word-limit="true"
/>
```

### 4. 搜索框启用历史记录

```vue
<!-- 搜索框保存历史 -->
<enhanced-input
  v-model="keyword"
  show-history
  history-key="search"
  :max-history="10"
/>
```

### 5. 使用预定义规则

```javascript
import { commonRules, FormValidator } from '@/utils/form-validator.js';

// 使用预定义规则
this.mobileRules = commonRules.mobile;

// 或者组合使用
this.usernameRules = [
  ...commonRules.username,
  FormValidator.custom((value) => {
    // 额外的自定义验证
    return !forbiddenWords.includes(value);
  }, '用户名包含敏感词')
];
```

---

## 📊 性能优化

### 1. 懒加载历史记录

```javascript
// 只在聚焦时加载历史
onFocus() {
  if (!this.historyLoaded) {
    this.loadHistory();
    this.historyLoaded = true;
  }
}
```

### 2. 防抖验证

```javascript
// 输入时延迟验证（默认实现）
handleInput(e) {
  clearTimeout(this.validateTimer);
  this.validateTimer = setTimeout(() => {
    this.validate();
  }, 300);
}
```

### 3. 限制历史记录数量

```vue
<!-- 最多保存5条历史 -->
<enhanced-input
  :max-history="5"
/>
```

---

## 🐛 常见问题

### Q1: 自动聚焦不生效？

**A**: 小程序平台有限制，确保：
```javascript
// 延迟聚焦
setTimeout(() => {
  this.autoFocus = true;
}, 100);
```

### Q2: 输入历史不保存？

**A**: 检查historyKey是否设置：
```vue
<enhanced-input
  show-history
  history-key="unique_key"
/>
```

### Q3: 验证规则不生效？

**A**: 确保传入的是数组：
```javascript
// ✅ 正确
rules: [FormValidator.required()]

// ❌ 错误
rules: FormValidator.required()
```

---

## 📝 更新日志

### v1.0.0 (2025-11-04)
- ✅ 初始版本
- ✅ EnhancedInput组件
- ✅ FormValidator验证工具
- ✅ 20+常用正则表达式
- ✅ 15+验证规则
- ✅ 输入历史功能
- ✅ 密码显示切换
- ✅ 实时验证反馈

---

## 📞 技术支持

如有问题，请联系：
- GitHub Issues: [项目地址]
- 文档: `docs/FORM-INPUT-USAGE.md`
- 邮箱: dev@craneheart.com

