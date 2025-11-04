/**
 * 表单验证工具
 * 提供常用的验证规则和验证函数
 * 
 * @author CraneHeart Team
 * @version 1.0.0
 * @date 2025-11-04
 */

/**
 * 常用正则表达式
 */
export const patterns = {
  // 手机号（中国大陆）
  mobile: /^1[3-9]\d{9}$/,
  
  // 邮箱
  email: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/,
  
  // 身份证号（18位）
  idCard: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
  
  // 网址
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  
  // 中文
  chinese: /^[\u4e00-\u9fa5]+$/,
  
  // 英文
  english: /^[A-Za-z]+$/,
  
  // 数字
  number: /^\d+$/,
  
  // 整数
  integer: /^-?\d+$/,
  
  // 小数
  decimal: /^-?\d+\.\d+$/,
  
  // 密码强度（至少包含大小写字母、数字，8-16位）
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/,
  
  // 密码中等强度（至少包含字母和数字，6-16位）
  mediumPassword: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,16}$/,
  
  // 用户名（字母开头，允许字母数字下划线，4-16位）
  username: /^[a-zA-Z][a-zA-Z0-9_]{3,15}$/,
  
  // 邮政编码
  postalCode: /^\d{6}$/,
  
  // QQ号
  qq: /^[1-9]\d{4,10}$/,
  
  // 微信号
  wechat: /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/,
  
  // 车牌号
  carNumber: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/,
  
  // IP地址
  ip: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/,
  
  // 日期（YYYY-MM-DD）
  date: /^\d{4}-\d{2}-\d{2}$/,
  
  // 时间（HH:mm:ss）
  time: /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
};

/**
 * 验证规则类
 */
export class FormValidator {
  /**
   * 必填验证
   */
  static required(message = '此项为必填项') {
    return {
      required: true,
      message
    };
  }
  
  /**
   * 手机号验证
   */
  static mobile(message = '请输入正确的手机号') {
    return {
      pattern: patterns.mobile,
      message
    };
  }
  
  /**
   * 邮箱验证
   */
  static email(message = '请输入正确的邮箱地址') {
    return {
      pattern: patterns.email,
      message
    };
  }
  
  /**
   * 身份证验证
   */
  static idCard(message = '请输入正确的身份证号') {
    return {
      pattern: patterns.idCard,
      message,
      validator: (value) => {
        if (!patterns.idCard.test(value)) {
          return false;
        }
        // 验证校验码
        return FormValidator.validateIdCardChecksum(value);
      }
    };
  }
  
  /**
   * 最小长度验证
   */
  static minLength(min, message) {
    return {
      min,
      message: message || `最少输入${min}个字符`
    };
  }
  
  /**
   * 最大长度验证
   */
  static maxLength(max, message) {
    return {
      max,
      message: message || `最多输入${max}个字符`
    };
  }
  
  /**
   * 长度范围验证
   */
  static rangeLength(min, max, message) {
    return {
      validator: (value) => {
        return value.length >= min && value.length <= max;
      },
      message: message || `请输入${min}-${max}个字符`
    };
  }
  
  /**
   * 密码强度验证
   */
  static strongPassword(message = '密码必须包含大小写字母和数字，长度8-16位') {
    return {
      pattern: patterns.strongPassword,
      message
    };
  }
  
  /**
   * 中等密码验证
   */
  static mediumPassword(message = '密码必须包含字母和数字，长度6-16位') {
    return {
      pattern: patterns.mediumPassword,
      message
    };
  }
  
  /**
   * 用户名验证
   */
  static username(message = '用户名必须以字母开头，4-16位字母数字下划线') {
    return {
      pattern: patterns.username,
      message
    };
  }
  
  /**
   * 数字验证
   */
  static number(message = '请输入数字') {
    return {
      pattern: patterns.number,
      message
    };
  }
  
  /**
   * 数字范围验证
   */
  static range(min, max, message) {
    return {
      validator: (value) => {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
      },
      message: message || `请输入${min}-${max}之间的数字`
    };
  }
  
  /**
   * URL验证
   */
  static url(message = '请输入正确的网址') {
    return {
      pattern: patterns.url,
      message
    };
  }
  
  /**
   * 自定义正则验证
   */
  static pattern(regex, message = '格式不正确') {
    return {
      pattern: regex,
      message
    };
  }
  
  /**
   * 自定义验证函数
   */
  static custom(validator, message = '验证失败') {
    return {
      validator,
      message
    };
  }
  
  /**
   * 确认密码验证（需要比较两个字段）
   */
  static confirmPassword(getOriginalPassword, message = '两次密码输入不一致') {
    return {
      validator: (value) => {
        return value === getOriginalPassword();
      },
      message
    };
  }
  
  /**
   * 年龄验证
   */
  static age(min = 0, max = 150, message) {
    return {
      validator: (value) => {
        const age = Number(value);
        return !isNaN(age) && age >= min && age <= max;
      },
      message: message || `年龄必须在${min}-${max}岁之间`
    };
  }
  
  /**
   * 身份证校验码验证
   * @private
   */
  static validateIdCardChecksum(idCard) {
    const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * factors[i];
    }
    
    const checkCode = checkCodes[sum % 11];
    return checkCode === idCard[17].toUpperCase();
  }
}

/**
 * 预定义验证规则集
 */
export const commonRules = {
  // 用户名
  username: [
    FormValidator.required('请输入用户名'),
    FormValidator.username()
  ],
  
  // 密码
  password: [
    FormValidator.required('请输入密码'),
    FormValidator.mediumPassword()
  ],
  
  // 强密码
  strongPassword: [
    FormValidator.required('请输入密码'),
    FormValidator.strongPassword()
  ],
  
  // 手机号
  mobile: [
    FormValidator.required('请输入手机号'),
    FormValidator.mobile()
  ],
  
  // 邮箱
  email: [
    FormValidator.required('请输入邮箱'),
    FormValidator.email()
  ],
  
  // 身份证
  idCard: [
    FormValidator.required('请输入身份证号'),
    FormValidator.idCard()
  ],
  
  // 真实姓名
  realName: [
    FormValidator.required('请输入真实姓名'),
    FormValidator.pattern(patterns.chinese, '请输入中文姓名'),
    FormValidator.rangeLength(2, 10, '姓名长度为2-10个字')
  ],
  
  // 昵称
  nickname: [
    FormValidator.required('请输入昵称'),
    FormValidator.rangeLength(2, 20, '昵称长度为2-20个字')
  ],
  
  // 验证码（6位数字）
  verifyCode: [
    FormValidator.required('请输入验证码'),
    FormValidator.pattern(/^\d{6}$/, '请输入6位验证码')
  ],
  
  // 年龄
  age: [
    FormValidator.required('请输入年龄'),
    FormValidator.age(1, 120)
  ],
};

/**
 * 表单验证器
 */
export class Form {
  constructor() {
    this.fields = {};
  }
  
  /**
   * 添加字段
   */
  addField(name, rules) {
    this.fields[name] = {
      rules,
      value: '',
      error: '',
      hasError: false
    };
  }
  
  /**
   * 设置字段值
   */
  setValue(name, value) {
    if (this.fields[name]) {
      this.fields[name].value = value;
    }
  }
  
  /**
   * 获取字段值
   */
  getValue(name) {
    return this.fields[name] ? this.fields[name].value : '';
  }
  
  /**
   * 验证单个字段
   */
  validateField(name) {
    const field = this.fields[name];
    if (!field) {
      return true;
    }
    
    const { rules, value } = field;
    
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      
      // 必填验证
      if (rule.required && !value) {
        field.hasError = true;
        field.error = rule.message;
        return false;
      }
      
      // 跳过空值的非必填验证
      if (!value && !rule.required) {
        continue;
      }
      
      // 正则验证
      if (rule.pattern && !rule.pattern.test(value)) {
        field.hasError = true;
        field.error = rule.message;
        return false;
      }
      
      // 最小长度
      if (rule.min && value.length < rule.min) {
        field.hasError = true;
        field.error = rule.message;
        return false;
      }
      
      // 最大长度
      if (rule.max && value.length > rule.max) {
        field.hasError = true;
        field.error = rule.message;
        return false;
      }
      
      // 自定义验证
      if (rule.validator) {
        const result = rule.validator(value);
        if (!result) {
          field.hasError = true;
          field.error = rule.message;
          return false;
        }
      }
    }
    
    // 验证通过
    field.hasError = false;
    field.error = '';
    return true;
  }
  
  /**
   * 验证所有字段
   */
  validate() {
    let isValid = true;
    
    Object.keys(this.fields).forEach(name => {
      if (!this.validateField(name)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  /**
   * 获取错误信息
   */
  getErrors() {
    const errors = {};
    
    Object.keys(this.fields).forEach(name => {
      const field = this.fields[name];
      if (field.hasError) {
        errors[name] = field.error;
      }
    });
    
    return errors;
  }
  
  /**
   * 重置表单
   */
  reset() {
    Object.keys(this.fields).forEach(name => {
      this.fields[name].value = '';
      this.fields[name].error = '';
      this.fields[name].hasError = false;
    });
  }
  
  /**
   * 获取表单数据
   */
  getData() {
    const data = {};
    
    Object.keys(this.fields).forEach(name => {
      data[name] = this.fields[name].value;
    });
    
    return data;
  }
}

/**
 * 导出默认实例
 */
export default FormValidator;

