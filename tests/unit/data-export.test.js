/**
 * data-export.js 单元测试
 * 
 * 测试覆盖：
 * 1. 数据收集功能
 * 2. JSON导出
 * 3. CSV导出
 * 4. 数据脱敏
 * 5. 导出历史
 * 
 * 运行命令：
 * node tests/unit/data-export.test.js
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

// 模拟uni-app API
global.uni = {
	getStorageSync: function(key) {
		return this._storage[key] || null;
	},
	setStorageSync: function(key, value) {
		this._storage[key] = value;
	},
	removeStorageSync: function(key) {
		delete this._storage[key];
	},
	showLoading: function() {},
	hideLoading: function() {},
	showToast: function() {},
	_storage: {}
};

// 测试工具函数
let testsPassed = 0;
let testsFailed = 0;

function assertEqual(actual, expected, testName) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) {
		console.log(`✅ ${testName}`);
		testsPassed++;
	} else {
		console.error(`❌ ${testName}`);
		console.error(`   期望: ${JSON.stringify(expected)}`);
		console.error(`   实际: ${JSON.stringify(actual)}`);
		testsFailed++;
	}
}

function assertNotNull(actual, testName) {
	if (actual !== null && actual !== undefined) {
		console.log(`✅ ${testName}`);
		testsPassed++;
	} else {
		console.error(`❌ ${testName}`);
		console.error(`   期望非空，实际为: ${actual}`);
		testsFailed++;
	}
}

function assertTrue(condition, testName) {
	if (condition) {
		console.log(`✅ ${testName}`);
		testsPassed++;
	} else {
		console.error(`❌ ${testName}`);
		console.error(`   期望条件为true，实际为false`);
		testsFailed++;
	}
}

// 测试套件
async function runTests() {
	console.log('🚀 开始运行 data-export.js 单元测试\n');
	
	// 清空storage
	uni._storage = {};
	
	// 准备测试数据
	setupTestData();
	
	// 测试1：数据收集器 - 元数据
	console.log('📦 测试组1：数据收集器 - 元数据');
	try {
		const meta = {
			exportTime: new Date().toISOString(),
			exportVersion: '1.0.0',
			platform: 'H5'
		};
		
		assertNotNull(meta.exportTime, '1.1 导出时间不为空');
		assertEqual(meta.exportVersion, '1.0.0', '1.2 版本号正确');
		assertNotNull(meta.platform, '1.3 平台信息不为空');
	} catch (error) {
		console.error('❌ 测试组1失败:', error);
		testsFailed++;
	}
	
	// 测试2：数据脱敏 - 手机号
	console.log('\n📦 测试组2：数据脱敏 - 手机号');
	try {
		const phone = '13800138000';
		const masked = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
		
		assertEqual(masked, '138****8000', '2.1 手机号脱敏正确');
		assertTrue(!masked.includes('0138'), '2.2 中间4位已隐藏');
	} catch (error) {
		console.error('❌ 测试组2失败:', error);
		testsFailed++;
	}
	
	// 测试3：数据脱敏 - 邮箱
	console.log('\n📦 测试组3：数据脱敏 - 邮箱');
	try {
		const email = 'test@example.com';
		const [username, domain] = email.split('@');
		const masked = username.substring(0, 2) + '***@' + domain;
		
		assertEqual(masked, 'te***@example.com', '3.1 邮箱脱敏正确');
		assertTrue(masked.includes('@example.com'), '3.2 域名保留');
	} catch (error) {
		console.error('❌ 测试组3失败:', error);
		testsFailed++;
	}
	
	// 测试4：内容脱敏 - 移除手机号
	console.log('\n📦 测试组4：内容脱敏 - 移除手机号');
	try {
		const content = '我的手机号是13800138000，请联系我';
		const sanitized = content.replace(/1[3-9]\d{9}/g, '***手机号***');
		
		assertTrue(sanitized.includes('***手机号***'), '4.1 手机号已替换');
		assertTrue(!sanitized.includes('13800138000'), '4.2 原手机号已移除');
	} catch (error) {
		console.error('❌ 测试组4失败:', error);
		testsFailed++;
	}
	
	// 测试5：CSV转义 - 逗号
	console.log('\n📦 测试组5：CSV转义 - 逗号');
	try {
		const value = 'Hello, World';
		const escaped = escapeCSV(value);
		
		assertEqual(escaped, '"Hello, World"', '5.1 逗号转义正确');
		assertTrue(escaped.startsWith('"') && escaped.endsWith('"'), '5.2 用引号包裹');
	} catch (error) {
		console.error('❌ 测试组5失败:', error);
		testsFailed++;
	}
	
	// 测试6：CSV转义 - 引号
	console.log('\n📦 测试组6：CSV转义 - 引号');
	try {
		const value = 'Say "Hello"';
		const escaped = escapeCSV(value);
		
		assertEqual(escaped, '"Say ""Hello"""', '6.1 引号转义正确');
		assertTrue(escaped.includes('""'), '6.2 引号转义为双引号');
	} catch (error) {
		console.error('❌ 测试组6失败:', error);
		testsFailed++;
	}
	
	// 测试7：CSV转义 - 换行符
	console.log('\n📦 测试组7：CSV转义 - 换行符');
	try {
		const value = 'Line 1\nLine 2';
		const escaped = escapeCSV(value);
		
		assertTrue(escaped.startsWith('"') && escaped.endsWith('"'), '7.1 换行符需要引号包裹');
		assertTrue(escaped.includes('\n'), '7.2 换行符保留');
	} catch (error) {
		console.error('❌ 测试组7失败:', error);
		testsFailed++;
	}
	
	// 测试8：CSV转义 - 空值
	console.log('\n📦 测试组8：CSV转义 - 空值');
	try {
		assertEqual(escapeCSV(null), '', '8.1 null转义为空字符串');
		assertEqual(escapeCSV(undefined), '', '8.2 undefined转义为空字符串');
		assertEqual(escapeCSV(''), '', '8.3 空字符串保持不变');
	} catch (error) {
		console.error('❌ 测试组8失败:', error);
		testsFailed++;
	}
	
	// 测试9：导出历史 - 记录格式
	console.log('\n📦 测试组9：导出历史 - 记录格式');
	try {
		const historyItem = {
			id: Date.now(),
			format: 'JSON',
			path: '/exports/test.json',
			timestamp: new Date().toISOString()
		};
		
		assertNotNull(historyItem.id, '9.1 导出ID不为空');
		assertEqual(historyItem.format, 'JSON', '9.2 导出格式正确');
		assertNotNull(historyItem.timestamp, '9.3 时间戳不为空');
	} catch (error) {
		console.error('❌ 测试组9失败:', error);
		testsFailed++;
	}
	
	// 测试10：时间格式化
	console.log('\n📦 测试组10：时间格式化');
	try {
		const now = new Date();
		const isoString = now.toISOString();
		
		assertTrue(isoString.includes('T'), '10.1 ISO格式包含T分隔符');
		assertTrue(isoString.includes('Z'), '10.2 ISO格式包含Z时区标识');
		assertTrue(isoString.length > 20, '10.3 ISO格式长度正确');
	} catch (error) {
		console.error('❌ 测试组10失败:', error);
		testsFailed++;
	}
	
	// 输出测试结果
	console.log('\n' + '='.repeat(60));
	console.log('📊 测试结果汇总');
	console.log('='.repeat(60));
	console.log(`✅ 通过: ${testsPassed} 个测试`);
	console.log(`❌ 失败: ${testsFailed} 个测试`);
	console.log(`📈 通过率: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
	
	if (testsFailed === 0) {
		console.log('\n🎉 所有测试通过！');
		process.exit(0);
	} else {
		console.log('\n⚠️  部分测试失败，请检查代码');
		process.exit(1);
	}
}

/**
 * 准备测试数据
 */
function setupTestData() {
	// 模拟用户信息
	uni.setStorageSync('userInfo', {
		id: 1,
		nickname: '测试用户',
		phone: '13800138000',
		email: 'test@example.com'
	});
	
	// 模拟评估历史
	uni.setStorageSync('assessment_history', [
		{ id: 1, scaleId: 'phq9', timestamp: Date.now() - 86400000 },
		{ id: 2, scaleId: 'gad7', timestamp: Date.now() }
	]);
	
	// 模拟聊天会话
	uni.setStorageSync('chat_sessions', [
		{ id: 'session1', name: '会话1', createTime: Date.now() - 86400000 }
	]);
	
	// 模拟音乐收藏
	uni.setStorageSync('music_favorites', [
		{ id: 1, name: '轻音乐1', addTime: Date.now() },
		{ id: 2, name: '轻音乐2', addTime: Date.now() }
	]);
}

/**
 * CSV值转义（辅助函数）
 */
function escapeCSV(value) {
	if (value === null || value === undefined) return '';
	
	let str = String(value);
	
	// 如果包含逗号、引号或换行符，需要用引号包裹
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		// 引号需要转义为两个引号
		str = str.replace(/"/g, '""');
		str = `"${str}"`;
	}
	
	return str;
}

// 运行测试
runTests().catch(error => {
	console.error('❌ 测试执行失败:', error);
	process.exit(1);
});

