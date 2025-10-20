/**
 * 登录流程E2E测试
 * 
 * 测试完整的用户登录流程：
 * 1. 打开登录页面
 * 2. 同意协议
 * 3. 点击登录按钮
 * 4. 微信授权
 * 5. 验证跳转到首页
 * 6. 验证登录状态
 */

describe('登录流程E2E测试', () => {
  let page;
  
  beforeAll(async () => {
    // 初始化测试环境
    page = await program.currentPage();
    await page.waitFor(500);
  });
  
  beforeEach(async () => {
    // 清除登录状态
    await page.callMethod('clearLoginData');
    
    // 导航到登录页
    await page.navigateTo('/pages/login/login');
    await page.waitFor(1000);
  });
  
  // 测试1：完整登录流程
  test('完整登录流程', async () => {
    // 1. 验证页面加载
    const loginPage = await program.currentPage();
    expect(loginPage.path).toBe('pages/login/login');
    
    // 2. 检查初始状态
    const agreedMainTerms = await loginPage.data('agreedMainTerms');
    const agreedDisclaimer = await loginPage.data('agreedDisclaimer');
    expect(agreedMainTerms).toBe(false);
    expect(agreedDisclaimer).toBe(false);
    
    // 3. 同意主要协议
    await loginPage.callMethod('toggleMainAgreement');
    await page.waitFor(200);
    const agreedMainAfter = await loginPage.data('agreedMainTerms');
    expect(agreedMainAfter).toBe(true);
    
    // 4. 同意免责声明
    await loginPage.callMethod('toggleDisclaimerAgreement');
    await page.waitFor(200);
    const agreedDisclaimerAfter = await loginPage.data('agreedDisclaimer');
    expect(agreedDisclaimerAfter).toBe(true);
    
    // 5. 验证登录按钮可点击
    const allAgreed = await loginPage.data('allAgreed');
    expect(allAgreed).toBe(true);
    
    // 6. 点击登录按钮
    await loginPage.callMethod('handleWxLogin');
    await page.waitFor(500);
    
    // 7. 验证loading状态
    const loginLoading = await loginPage.data('loginLoading');
    expect(loginLoading).toBe(true);
    
    // 8. 等待登录完成（模拟）
    await page.waitFor(3000);
    
    // 9. 验证跳转到首页或个人中心
    const currentPage = await program.currentPage();
    expect(['pages/home/home', 'pages/user/home']).toContain(currentPage.path);
    
    // 10. 验证登录状态已保存
    const token = await page.getStorageSync('uni_id_token');
    const uid = await page.getStorageSync('uni_id_uid');
    expect(token).toBeTruthy();
    expect(uid).toBeTruthy();
    
    console.log('✅ 完整登录流程测试通过');
  });
  
  // 测试2：未同意协议时点击登录
  test('未同意协议时不允许登录', async () => {
    const loginPage = await program.currentPage();
    
    // 直接点击登录按钮（未同意协议）
    await loginPage.callMethod('handleWxLogin');
    await page.waitFor(1000);
    
    // 验证仍在登录页
    const currentPage = await program.currentPage();
    expect(currentPage.path).toBe('pages/login/login');
    
    // 验证没有token
    const token = await page.getStorageSync('uni_id_token');
    expect(token).toBeFalsy();
  });
  
  // 测试3：协议跳转
  test('点击协议链接能正确跳转', async () => {
    const loginPage = await program.currentPage();
    
    // 点击用户协议
    await loginPage.callMethod('navigateToAgreement', 'user');
    await page.waitFor(1000);
    
    const currentPage = await program.currentPage();
    expect(currentPage.path).toBe('pages-sub/consent/user-agreement');
    
    // 返回登录页
    await page.navigateBack();
    await page.waitFor(500);
    
    const backPage = await program.currentPage();
    expect(backPage.path).toBe('pages/login/login');
  });
  
  // 测试4：自动登录功能
  test('已登录用户自动跳转首页', async () => {
    // 1. 先设置登录状态
    await page.setStorageSync('uni_id_token', 'mock_valid_token');
    await page.setStorageSync('uni_id_uid', 'mock_uid_123');
    await page.setStorageSync('uni_id_token_expired', Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // 2. 打开登录页
    await page.navigateTo('/pages/login/login');
    await page.waitFor(2000);
    
    // 3. 应该自动跳转到首页
    const currentPage = await program.currentPage();
    expect(currentPage.path).toBe('pages/home/home');
    
    console.log('✅ 自动登录测试通过');
  });
  
  // 测试5：游客模式
  test('游客模式功能', async () => {
    const loginPage = await program.currentPage();
    
    // 点击游客模式
    await loginPage.callMethod('handleGuestMode');
    await page.waitFor(500);
    
    // 在弹出的modal中点击确定
    // 注意：这需要模拟uni.showModal的行为
    await page.waitFor(1000);
    
    // 验证游客模式标记已设置
    const guestMode = await page.getStorageSync('guest_mode');
    expect(guestMode).toBe(true);
  });
  
  // 测试6：loading状态
  test('登录过程中显示loading', async () => {
    const loginPage = await program.currentPage();
    
    // 同意协议
    await loginPage.callMethod('toggleMainAgreement');
    await loginPage.callMethod('toggleDisclaimerAgreement');
    await page.waitFor(200);
    
    // 点击登录
    await loginPage.callMethod('handleWxLogin');
    
    // 立即检查loading状态
    const loginLoading = await loginPage.data('loginLoading');
    expect(loginLoading).toBe(true);
    
    // 等待登录完成
    await page.waitFor(3000);
    
    // 检查loading已结束
    const loginLoadingAfter = await loginPage.data('loginLoading');
    expect(loginLoadingAfter).toBe(false);
  });
  
  // 测试7：重试机制
  test('登录失败时自动重试', async () => {
    const loginPage = await program.currentPage();
    
    // Mock一个会失败的code
    const mockFailCode = 'FAIL_CODE_RETRY';
    
    // 同意协议
    await loginPage.callMethod('toggleMainAgreement');
    await loginPage.callMethod('toggleDisclaimerAgreement');
    
    // 点击登录（会触发重试）
    await loginPage.callMethod('handleWxLogin');
    await page.waitFor(5000); // 等待重试完成
    
    // 检查重试次数
    const retryCount = await loginPage.data('retryCount');
    expect(retryCount).toBeGreaterThan(0);
  });
  
  // 测试8：错误提示显示
  test('登录失败显示错误提示', async () => {
    const loginPage = await program.currentPage();
    
    // Mock失败的code
    const mockExpiredCode = mockData.expiredCode;
    
    // 同意协议并登录
    await loginPage.callMethod('toggleMainAgreement');
    await loginPage.callMethod('toggleDisclaimerAgreement');
    await loginPage.callMethod('handleWxLogin');
    
    await page.waitFor(3000);
    
    // 验证仍在登录页（登录失败）
    const currentPage = await program.currentPage();
    expect(currentPage.path).toBe('pages/login/login');
  });
  
  afterAll(async () => {
    // 清理测试环境
    await page.callMethod('clearLoginData');
  });
  
});

// 辅助：清除登录数据
function clearLoginData() {
  uni.removeStorageSync('uni_id_token');
  uni.removeStorageSync('uni_id_uid');
  uni.removeStorageSync('uni_id_token_expired');
  uni.removeStorageSync('uni_id_user_info');
  uni.removeStorageSync('guest_mode');
  uni.removeStorageSync('userAgreement');
}

// 导出测试配置
module.exports = {
  timeout: 30000, // 测试超时时间
  mockData: mockData
};

