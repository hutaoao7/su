<template>
  <view class="enhanced-input" :class="{ 'is-focused': isFocused, 'has-error': hasError }">
    <!-- 标签 -->
    <view v-if="label" class="input-label">
      <text class="label-text">{{ label }}</text>
      <text v-if="required" class="required-mark">*</text>
    </view>
    
    <!-- 输入框容器 -->
    <view class="input-wrapper">
      <!-- 前置图标 -->
      <view v-if="prefixIcon" class="prefix-icon">
        <u-icon :name="prefixIcon" size="20" color="#999" />
      </view>
      
      <!-- 输入框 -->
      <input 
        v-if="!isTextarea"
        class="input-field"
        :type="computedType"
        :value="inputValue"
        :placeholder="placeholder"
        :placeholder-style="placeholderStyle"
        :maxlength="maxlength"
        :disabled="disabled"
        :focus="autoFocus"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @confirm="handleConfirm"
      />
      
      <!-- 多行文本框 -->
      <textarea
        v-else
        class="textarea-field"
        :value="inputValue"
        :placeholder="placeholder"
        :placeholder-style="placeholderStyle"
        :maxlength="maxlength"
        :disabled="disabled"
        :auto-height="autoHeight"
        :focus="autoFocus"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      
      <!-- 密码显示/隐藏按钮 -->
      <view 
        v-if="type === 'password' && inputValue"
        class="suffix-icon"
        @tap="togglePasswordVisible"
      >
        <u-icon 
          :name="passwordVisible ? 'eye-fill' : 'eye-off'" 
          size="20" 
          color="#999"
        />
      </view>
      
      <!-- 清空按钮 -->
      <view 
        v-else-if="clearable && inputValue && !disabled && isFocused"
        class="suffix-icon clear-icon"
        @tap="handleClear"
      >
        <u-icon name="close-circle-fill" size="20" color="#c0c4cc" />
      </view>
      
      <!-- 后置图标 -->
      <view v-else-if="suffixIcon" class="suffix-icon">
        <u-icon :name="suffixIcon" size="20" color="#999" />
      </view>
    </view>
    
    <!-- 字数统计 -->
    <view v-if="showWordLimit && maxlength" class="word-limit">
      <text class="current-length">{{ inputValue ? inputValue.length : 0 }}</text>
      <text class="max-length">/{{ maxlength }}</text>
    </view>
    
    <!-- 错误提示 -->
    <view v-if="hasError && errorMessage" class="error-message">
      <u-icon name="info-circle-fill" size="14" color="#f56c6c" />
      <text class="error-text">{{ errorMessage }}</text>
    </view>
    
    <!-- 提示信息 -->
    <view v-else-if="hint" class="hint-message">
      <text class="hint-text">{{ hint }}</text>
    </view>
    
    <!-- 输入历史建议 -->
    <view v-if="showHistory && historyList.length > 0 && isFocused" class="history-suggestions">
      <view 
        v-for="(item, index) in historyList" 
        :key="index"
        class="history-item"
        @tap="selectHistory(item)"
      >
        <u-icon name="clock" size="16" color="#999" />
        <text class="history-text">{{ item }}</text>
        <u-icon 
          name="close" 
          size="14" 
          color="#c0c4cc"
          @tap.stop="removeHistory(index)"
        />
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 增强型输入框组件
 * 功能：
 * - 自动聚焦
 * - 实时验证
 * - 清空按钮
 * - 密码显示/隐藏
 * - 字数统计
 * - 输入历史
 * 
 * @author CraneHeart Team
 * @version 1.0.0
 * @date 2025-11-04
 */
export default {
  name: 'EnhancedInput',
  
  props: {
    // 输入框值
    value: {
      type: [String, Number],
      default: ''
    },
    
    // 输入框类型
    type: {
      type: String,
      default: 'text' // text, number, idcard, digit, password
    },
    
    // 标签
    label: {
      type: String,
      default: ''
    },
    
    // 必填标记
    required: {
      type: Boolean,
      default: false
    },
    
    // 占位符
    placeholder: {
      type: String,
      default: '请输入'
    },
    
    // 占位符样式
    placeholderStyle: {
      type: String,
      default: 'color: #c0c4cc'
    },
    
    // 最大长度
    maxlength: {
      type: Number,
      default: 140
    },
    
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    
    // 是否可清空
    clearable: {
      type: Boolean,
      default: true
    },
    
    // 是否显示字数统计
    showWordLimit: {
      type: Boolean,
      default: false
    },
    
    // 是否自动聚焦
    autoFocus: {
      type: Boolean,
      default: false
    },
    
    // 前置图标
    prefixIcon: {
      type: String,
      default: ''
    },
    
    // 后置图标
    suffixIcon: {
      type: String,
      default: ''
    },
    
    // 是否为textarea
    isTextarea: {
      type: Boolean,
      default: false
    },
    
    // textarea自动高度
    autoHeight: {
      type: Boolean,
      default: false
    },
    
    // 验证规则
    rules: {
      type: Array,
      default: () => []
    },
    
    // 提示信息
    hint: {
      type: String,
      default: ''
    },
    
    // 是否显示输入历史
    showHistory: {
      type: Boolean,
      default: false
    },
    
    // 历史记录存储key
    historyKey: {
      type: String,
      default: ''
    },
    
    // 最多保存历史记录数
    maxHistory: {
      type: Number,
      default: 5
    }
  },
  
  data() {
    return {
      inputValue: '',
      isFocused: false,
      hasError: false,
      errorMessage: '',
      passwordVisible: false,
      historyList: []
    };
  },
  
  computed: {
    /**
     * 计算输入框类型
     */
    computedType() {
      if (this.type === 'password') {
        return this.passwordVisible ? 'text' : 'password';
      }
      return this.type;
    }
  },
  
  watch: {
    value: {
      handler(val) {
        this.inputValue = val;
      },
      immediate: true
    }
  },
  
  mounted() {
    // 加载输入历史
    if (this.showHistory && this.historyKey) {
      this.loadHistory();
    }
  },
  
  methods: {
    /**
     * 输入事件处理
     */
    handleInput(e) {
      const value = e.detail.value;
      this.inputValue = value;
      this.$emit('input', value);
      this.$emit('change', value);
      
      // 实时验证
      if (this.rules.length > 0) {
        this.validate();
      }
    },
    
    /**
     * 聚焦事件
     */
    handleFocus() {
      this.isFocused = true;
      this.$emit('focus');
    },
    
    /**
     * 失焦事件
     */
    handleBlur() {
      this.isFocused = false;
      this.$emit('blur');
      
      // 失焦时验证
      if (this.rules.length > 0) {
        this.validate();
      }
      
      // 保存到历史记录
      if (this.showHistory && this.historyKey && this.inputValue) {
        this.saveHistory(this.inputValue);
      }
    },
    
    /**
     * 确认事件
     */
    handleConfirm() {
      this.$emit('confirm', this.inputValue);
    },
    
    /**
     * 清空输入
     */
    handleClear() {
      this.inputValue = '';
      this.$emit('input', '');
      this.$emit('change', '');
      this.$emit('clear');
      this.hasError = false;
      this.errorMessage = '';
    },
    
    /**
     * 切换密码可见性
     */
    togglePasswordVisible() {
      this.passwordVisible = !this.passwordVisible;
    },
    
    /**
     * 验证输入
     */
    validate() {
      for (let i = 0; i < this.rules.length; i++) {
        const rule = this.rules[i];
        
        // 必填验证
        if (rule.required && !this.inputValue) {
          this.hasError = true;
          this.errorMessage = rule.message || '此项为必填项';
          return false;
        }
        
        // 正则验证
        if (rule.pattern && !rule.pattern.test(this.inputValue)) {
          this.hasError = true;
          this.errorMessage = rule.message || '格式不正确';
          return false;
        }
        
        // 最小长度
        if (rule.min && this.inputValue.length < rule.min) {
          this.hasError = true;
          this.errorMessage = rule.message || `最少输入${rule.min}个字符`;
          return false;
        }
        
        // 最大长度
        if (rule.max && this.inputValue.length > rule.max) {
          this.hasError = true;
          this.errorMessage = rule.message || `最多输入${rule.max}个字符`;
          return false;
        }
        
        // 自定义验证函数
        if (rule.validator && typeof rule.validator === 'function') {
          const result = rule.validator(this.inputValue);
          if (!result) {
            this.hasError = true;
            this.errorMessage = rule.message || '验证失败';
            return false;
          }
        }
      }
      
      // 验证通过
      this.hasError = false;
      this.errorMessage = '';
      return true;
    },
    
    /**
     * 加载输入历史
     */
    loadHistory() {
      try {
        const history = uni.getStorageSync(`input_history_${this.historyKey}`);
        if (history) {
          this.historyList = JSON.parse(history);
        }
      } catch (error) {
        console.error('[EnhancedInput] 加载历史失败:', error);
      }
    },
    
    /**
     * 保存输入历史
     */
    saveHistory(value) {
      try {
        // 去重
        const index = this.historyList.indexOf(value);
        if (index > -1) {
          this.historyList.splice(index, 1);
        }
        
        // 添加到开头
        this.historyList.unshift(value);
        
        // 限制数量
        if (this.historyList.length > this.maxHistory) {
          this.historyList = this.historyList.slice(0, this.maxHistory);
        }
        
        // 保存到本地
        uni.setStorageSync(
          `input_history_${this.historyKey}`,
          JSON.stringify(this.historyList)
        );
      } catch (error) {
        console.error('[EnhancedInput] 保存历史失败:', error);
      }
    },
    
    /**
     * 选择历史记录
     */
    selectHistory(value) {
      this.inputValue = value;
      this.$emit('input', value);
      this.$emit('change', value);
      this.isFocused = false;
    },
    
    /**
     * 移除历史记录
     */
    removeHistory(index) {
      this.historyList.splice(index, 1);
      try {
        uni.setStorageSync(
          `input_history_${this.historyKey}`,
          JSON.stringify(this.historyList)
        );
      } catch (error) {
        console.error('[EnhancedInput] 移除历史失败:', error);
      }
    }
  }
};
</script>

<style scoped lang="scss">
.enhanced-input {
  position: relative;
  margin-bottom: 24rpx;
  
  &.has-error {
    .input-wrapper {
      border-color: #f56c6c;
    }
  }
  
  &.is-focused {
    .input-wrapper {
      border-color: #1989fa;
    }
  }
}

/* 标签 */
.input-label {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  
  .label-text {
    font-size: 28rpx;
    color: #606266;
    font-weight: 500;
  }
  
  .required-mark {
    color: #f56c6c;
    margin-left: 4rpx;
    font-size: 28rpx;
  }
}

/* 输入框容器 */
.input-wrapper {
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  background-color: #f5f7fa;
  border: 1rpx solid #dcdfe6;
  border-radius: 8rpx;
  transition: border-color 0.2s;
  
  .prefix-icon,
  .suffix-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .prefix-icon {
    margin-right: 12rpx;
  }
  
  .suffix-icon {
    margin-left: 12rpx;
    padding: 8rpx;
  }
  
  .clear-icon {
    cursor: pointer;
  }
}

/* 输入框 */
.input-field,
.textarea-field {
  flex: 1;
  height: 80rpx;
  font-size: 28rpx;
  color: #303133;
  background-color: transparent;
  border: none;
}

.textarea-field {
  min-height: 120rpx;
  padding: 20rpx 0;
  line-height: 1.5;
}

/* 字数统计 */
.word-limit {
  text-align: right;
  margin-top: 8rpx;
  font-size: 24rpx;
  
  .current-length {
    color: #909399;
  }
  
  .max-length {
    color: #c0c4cc;
  }
}

/* 错误提示 */
.error-message {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
  
  .error-text {
    margin-left: 8rpx;
    font-size: 24rpx;
    color: #f56c6c;
  }
}

/* 提示信息 */
.hint-message {
  margin-top: 8rpx;
  
  .hint-text {
    font-size: 24rpx;
    color: #909399;
  }
}

/* 输入历史建议 */
.history-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  border: 1rpx solid #dcdfe6;
  border-radius: 8rpx;
  margin-top: 8rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  z-index: 999;
  max-height: 400rpx;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background-color: #f5f7fa;
  }
  
  .history-text {
    flex: 1;
    margin: 0 12rpx;
    font-size: 28rpx;
    color: #606266;
  }
}

/* 禁用状态 */
.enhanced-input {
  &[disabled] {
    opacity: 0.6;
    
    .input-wrapper {
      background-color: #f5f7fa;
      cursor: not-allowed;
    }
  }
}

/* 暗黑模式 */
.dark-mode {
  .input-wrapper {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .input-field,
  .textarea-field {
    color: #fff;
  }
  
  .history-suggestions {
    background-color: #1f1f1f;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .history-item {
    border-bottom-color: rgba(255, 255, 255, 0.05);
    
    &:active {
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    .history-text {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}
</style>

