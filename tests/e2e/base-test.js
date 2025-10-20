/**
 * E2E测试基础脚本
 * 使用微信小程序自动化测试
 */

const automator = require('miniprogram-automator');
const path = require('path');

// 测试配置
const config = {
  projectPath: path.join(__dirname, '../..'), // 小程序项目路径
  port: 9420, // 调试端口
};

// 启动小程序
async function launchMiniProgram() {
  const miniProgram = await automator.launch({
    projectPath: config.projectPath,
    port: config.port,
  });
  
  return miniProgram;
}

// 等待页面加载
async function waitForPage(page, selector, timeout = 5000) {
  await page.waitFor(selector, { timeout });
}

// 基础测试类
class BaseTest {
  constructor() {
    this.miniProgram = null;
    this.page = null;
  }
  
  async setup() {
    this.miniProgram = await launchMiniProgram();
    this.page = await this.miniProgram.currentPage();
  }
  
  async teardown() {
    if (this.miniProgram) {
      await this.miniProgram.close();
    }
  }
  
  async screenshot(name) {
    await this.page.screenshot({
      path: path.join(__dirname, 'screenshots', `${name}.png`)
    });
  }
}

module.exports = {
  launchMiniProgram,
  waitForPage,
  BaseTest
};
