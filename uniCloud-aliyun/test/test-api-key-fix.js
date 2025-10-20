/**
 * 测试 API Key 修复效果的验证脚本
 * 用于确认 Supabase URL 使用 https 且 API Key 无空格/换行
 */

console.log('=== API Key 修复验证测试 ===');

// 测试数据
const testFeedbackData = {
  title: "API Key 修复测试",
  content: "这是一个测试反馈内容，用于验证修复 Invalid API key 错误后，feedback-submit 云函数与 Supabase 的连接是否正常。URL 应该使用 https，API Key 应该清洗掉空格和换行。",
  contact: "test@example.com", 
  uid: "test_user_apikey_" + Date.now(),
  meta: {
    platform: "mp-weixin",
    appVersion: "1.0.0",
    deviceModel: "test_device"
  }
};

console.log('测试数据:');
console.log(JSON.stringify(testFeedbackData, null, 2));

console.log('\n=== 验证步骤 ===');
console.log('1. 在 HBuilderX 中右键点击 feedback-submit 云函数');
console.log('2. 选择"本地运行"或"云端调试"');
console.log('3. 粘贴上述测试数据');
console.log('4. 检查日志输出是否包含以下关键信息：');
console.log('   - [DIAG] node_modules list contains secrets: true');
console.log('   - [SECRETS] supabase.url starts with https: true');
console.log('   - [DIAG] supabase url uses https: true');
console.log('   - [SECRETS] supabase.url: https***(42) key.len: 180');
console.log('   - 无 "Invalid API key" 错误');
console.log('5. 确认返回结果格式：{ errCode: 0, errMsg: "ok", data: { rid: ... } }');

console.log('\n=== 预期日志关键行 ===');
console.log('[DIAG] node_modules list contains secrets: true');
console.log('[SECRETS] supabase.url: http***(42) key.len: 180');
console.log('[SECRETS] supabase.url starts with https: true');
console.log('[DIAG] supabase url uses https: true');
console.log('[FEEDBACK_FN] supabase ok rid=12345');

console.log('\n=== 修复内容 ===');
console.log('1. URL 强制使用 https://');
console.log('2. API Key 清洗空格和换行');
console.log('3. 添加 https 协议检查日志');
console.log('4. 保持原有业务逻辑不变');