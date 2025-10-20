/**
 * 心理评估E2E测试
 * 覆盖四个评估模块的完整流程
 */

const { BaseTest } = require('../base-test');
const assert = require('assert');

describe('心理健康评估', () => {
  let test;
  
  beforeEach(async () => {
    test = new BaseTest();
    await test.setup();
  });
  
  afterEach(async () => {
    await test.teardown();
  });
  
  it('TC-101: 学业压力评估完整流程', async () => {
    // 1. 导航到功能页
    await test.miniProgram.navigateTo('/pages/features/features');
    await test.page.waitFor('.features-page');
    
    // 2. 点击学业压力卡片
    const assessCard = await test.page.$('.assessment-card');
    assert(assessCard, '评估卡片应该存在');
    await assessCard.tap();
    
    // 3. 等待评估页面加载
    await test.page.waitFor('.assessment-page', { timeout: 5000 });
    
    // 4. 开始评估
    const startBtn = await test.page.$('.start-btn');
    await startBtn.tap();
    
    // 5. 回答问题（模拟答题）
    for (let i = 0; i < 10; i++) {
      await test.page.waitFor('.option-item', { timeout: 3000 });
      const options = await test.page.$$('.option-item');
      if (options.length > 0) {
        // 随机选择一个选项
        const randomIndex = Math.floor(Math.random() * options.length);
        await options[randomIndex].tap();
        
        // 等待下一题
        await test.page.waitFor(500);
      }
    }
    
    // 6. 检查结果页面
    await test.page.waitFor('.result-page', { timeout: 5000 });
    const scoreElement = await test.page.$('.score-value');
    assert(scoreElement, '评分应该显示');
    
    // 7. 保存结果
    const saveBtn = await test.page.$('.save-btn');
    if (saveBtn) {
      await saveBtn.tap();
      await test.page.waitFor(1000);
    }
    
    // 截图
    await test.screenshot('academic-stress-result');
  });
  
  it('TC-105: 评估中断恢复', async () => {
    // 1. 开始评估
    await test.miniProgram.navigateTo('/pages/assess/stress/index');
    await test.page.waitFor('.assessment-page');
    
    const startBtn = await test.page.$('.start-btn');
    await startBtn.tap();
    
    // 2. 回答几个问题
    for (let i = 0; i < 3; i++) {
      await test.page.waitFor('.option-item');
      const options = await test.page.$$('.option-item');
      if (options.length > 0) {
        await options[0].tap();
        await test.page.waitFor(500);
      }
    }
    
    // 3. 记录当前进度
    const progressText = await test.page.$('.progress-text');
    const currentProgress = await progressText.text();
    
    // 4. 返回上一页（模拟中断）
    await test.miniProgram.navigateBack();
    await test.page.waitFor(1000);
    
    // 5. 重新进入评估
    await test.miniProgram.navigateTo('/pages/assess/stress/index');
    await test.page.waitFor('.assessment-page');
    
    // 6. 检查是否显示继续按钮
    const continueBtn = await test.page.$('.continue-btn');
    assert(continueBtn, '应该显示继续评估按钮');
    
    // 7. 点击继续
    await continueBtn.tap();
    
    // 8. 验证进度恢复
    const newProgressText = await test.page.$('.progress-text');
    const newProgress = await newProgressText.text();
    assert(currentProgress === newProgress, '进度应该恢复');
    
    await test.screenshot('assessment-resume');
  });
  
  it('TC-107: 评估历史记录', async () => {
    // 1. 导航到用户中心
    await test.miniProgram.navigateTo('/pages/user/home');
    await test.page.waitFor('.user-page');
    
    // 2. 查找历史记录入口
    const historyBtn = await test.page.$('.history-btn');
    assert(historyBtn, '历史记录按钮应该存在');
    await historyBtn.tap();
    
    // 3. 等待历史记录页面
    await test.page.waitFor('.history-page', { timeout: 5000 });
    
    // 4. 检查记录列表
    const historyItems = await test.page.$$('.history-item');
    assert(historyItems.length > 0, '应该有历史记录');
    
    // 5. 点击查看详情
    if (historyItems.length > 0) {
      await historyItems[0].tap();
      await test.page.waitFor('.result-detail', { timeout: 3000 });
      
      // 验证详情显示
      const detailScore = await test.page.$('.detail-score');
      assert(detailScore, '详情分数应该显示');
    }
    
    await test.screenshot('assessment-history');
  });
});
