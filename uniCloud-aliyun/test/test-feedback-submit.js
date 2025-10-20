/**
 * 测试 feedback-submit 云函数
 * 用于验证修复效果
 */

const testData = {
  title: "测试反馈标题",
  content: "这是一个测试反馈内容，用于验证 feedback-submit 云函数与 Supabase 的连接是否正常。",
  contact: "test@example.com",
  uid: "test_user_" + Date.now(),
  meta: {
    platform: "mp-weixin",
    appVersion: "1.0.0",
    deviceModel: "test_device"
  }
};

console.log('测试数据:', JSON.stringify(testData, null, 2));
console.log('请在 HBuilderX 中右键点击 feedback-submit 云函数，选择"本地运行"，然后粘贴上述测试数据进行测试。');