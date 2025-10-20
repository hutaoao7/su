/**
 * 登录流程E2E测试
 * TC-001: 微信登录成功
 */

const { BaseTest } = require('../base-test');
const assert = require('assert');

describe('登录注册流程', () => {
  let test;
  
  beforeEach(async () => {
    test = new BaseTest();
    await test.setup();
  });
  
  afterEach(async () => {
    await test.teardown();
  });
  
  it('TC-001: 微信登录成功', async () => {
    // 1. 检查登录页面
    const loginBtn = await test.page.$('.login-btn');
    assert(loginBtn, '登录按钮应该存在');
    
    // 2. 点击登录
    await loginBtn.tap();
    
    // 3. 等待授权弹窗（模拟环境可能需要mock）
    await test.page.waitFor(1000);
    
    // 4. 检查跳转到首页
    await test.page.waitFor('.home-page', { timeout: 5000 });
    
    // 5. 验证登录状态
    const userInfo = await test.page.$('.user-info');
    assert(userInfo, '用户信息应该显示');
    
    // 截图
    await test.screenshot('login-success');
  });
  
  it('TC-003: 用户协议同意流程', async () => {
    // 1. 导航到同意页面
    await test.miniProgram.navigateTo('/pages/consent/consent');
    
    // 2. 等待页面加载
    await test.page.waitFor('.consent-page');
    
    // 3. 检查协议内容
    const agreementLink = await test.page.$('.agreement-link');
    assert(agreementLink, '用户协议链接应该存在');
    
    // 4. 勾选同意
    const checkbox = await test.page.$('.consent-checkbox');
    await checkbox.tap();
    
    // 5. 点击同意按钮
    const agreeBtn = await test.page.$('.agree-btn');
    await agreeBtn.tap();
    
    // 6. 验证跳转
    await test.page.waitFor('.home-page', { timeout: 5000 });
    
    await test.screenshot('consent-agreed');
  });
});
