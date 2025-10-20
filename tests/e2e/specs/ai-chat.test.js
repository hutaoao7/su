/**
 * AI对话功能E2E测试
 */

const { BaseTest } = require('../base-test');
const assert = require('assert');

describe('AI对话功能', () => {
  let test;
  
  beforeEach(async () => {
    test = new BaseTest();
    await test.setup();
  });
  
  afterEach(async () => {
    await test.teardown();
  });
  
  it('TC-201: AI对话发送消息', async () => {
    // 1. 导航到AI对话页面
    await test.miniProgram.navigateTo('/pages/intervene/chat');
    await test.page.waitFor('.chat-page');
    
    // 2. 检查输入框
    const inputField = await test.page.$('.input-field');
    assert(inputField, '输入框应该存在');
    
    // 3. 输入消息
    await inputField.input('我最近感觉压力很大');
    
    // 4. 检查发送按钮状态
    const sendBtn = await test.page.$('.send-btn');
    const isDisabled = await sendBtn.property('disabled');
    assert(!isDisabled, '发送按钮应该可用');
    
    // 5. 发送消息
    await sendBtn.tap();
    
    // 6. 验证消息显示
    await test.page.waitFor('.user-message', { timeout: 3000 });
    const userMsg = await test.page.$('.user-message text');
    const msgText = await userMsg.text();
    assert(msgText.includes('压力很大'), '用户消息应该显示');
    
    await test.screenshot('ai-chat-send');
  });
  
  it('TC-202: AI回复接收', async () => {
    // 1. 进入对话页面并发送消息
    await test.miniProgram.navigateTo('/pages/intervene/chat');
    await test.page.waitFor('.chat-page');
    
    const inputField = await test.page.$('.input-field');
    await inputField.input('你好');
    
    const sendBtn = await test.page.$('.send-btn');
    await sendBtn.tap();
    
    // 2. 等待AI回复
    await test.page.waitFor('.typing-indicator', { timeout: 3000 });
    await test.page.waitFor('.ai-message', { timeout: 10000 });
    
    // 3. 验证AI消息
    const aiMsg = await test.page.$('.ai-message text');
    const aiText = await aiMsg.text();
    assert(aiText && aiText.length > 0, 'AI应该有回复内容');
    
    // 4. 检查打字动画消失
    const typingIndicator = await test.page.$('.typing-indicator');
    assert(!typingIndicator, '打字动画应该消失');
    
    await test.screenshot('ai-chat-reply');
  });
  
  it('TC-204: 敏感词过滤', async () => {
    // 1. 进入对话页面
    await test.miniProgram.navigateTo('/pages/intervene/chat');
    await test.page.waitFor('.chat-page');
    
    // 2. 输入敏感内容（测试用）
    const inputField = await test.page.$('.input-field');
    await inputField.input('自杀');  // 敏感词测试
    
    // 3. 发送消息
    const sendBtn = await test.page.$('.send-btn');
    await sendBtn.tap();
    
    // 4. 等待系统响应
    await test.page.waitFor(3000);
    
    // 5. 检查是否有危机干预响应
    const messages = await test.page.$$('.ai-message');
    const lastMessage = messages[messages.length - 1];
    const msgText = await lastMessage.text();
    
    // 应该包含支持性内容或危机干预信息
    assert(
      msgText.includes('支持') || msgText.includes('帮助') || msgText.includes('专业'),
      '应该触发危机干预响应'
    );
    
    await test.screenshot('ai-chat-sensitive');
  });
  
  it('TC-205: 长文本输入', async () => {
    // 1. 进入对话页面
    await test.miniProgram.navigateTo('/pages/intervene/chat');
    await test.page.waitFor('.chat-page');
    
    // 2. 输入长文本
    const longText = '这是一段很长的文本。'.repeat(50); // 500字
    const inputField = await test.page.$('.input-field');
    await inputField.input(longText);
    
    // 3. 检查字数限制
    const charCount = await test.page.$('.char-count');
    const countText = await charCount.text();
    assert(countText.includes('500'), '应该显示字数限制');
    
    // 4. 验证输入被截断
    const actualInput = await inputField.value();
    assert(actualInput.length <= 500, '输入应该被限制在500字内');
    
    await test.screenshot('ai-chat-long-text');
  });
});
