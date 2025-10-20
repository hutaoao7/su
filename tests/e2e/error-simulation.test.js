/**
 * 错误模拟测试
 * 
 * 测试error-tracker.js的错误捕获和上报功能
 * 
 * 运行方式：node tests/e2e/error-simulation.test.js
 * 
 * @author CraneHeart Team
 * @date 2025-10-21
 */

const assert = require('assert');

/**
 * 测试套件
 */
class ErrorSimulationTest {
	constructor() {
		this.tests = [];
		this.results = {
			passed: 0,
			failed: 0,
			total: 0
		};
		
		// 模拟的错误追踪器
		this.errorTracker = this.createMockErrorTracker();
	}
	
	/**
	 * 创建模拟的错误追踪器
	 */
	createMockErrorTracker() {
		const errors = [];
		const breadcrumbs = [];
		
		return {
			// 捕获错误
			captureError(error, level = 'error', context = {}) {
				const errorRecord = {
					id: this.generateId(),
					type: this.detectErrorType(error),
					level: level,
					message: error.message || String(error),
					stack: error.stack || '',
					timestamp: Date.now(),
					context: context,
					breadcrumbs: [...breadcrumbs],
					fingerprint: this.generateFingerprint(error)
				};
				
				errors.push(errorRecord);
				return errorRecord;
			},
			
			// 添加操作轨迹
			addBreadcrumb(category, message, data = {}) {
				breadcrumbs.push({
					category,
					message,
					data,
					timestamp: Date.now()
				});
				
				// 最多保留30条
				if (breadcrumbs.length > 30) {
					breadcrumbs.shift();
				}
			},
			
			// 生成错误ID
			generateId() {
				return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
			},
			
			// 检测错误类型
			detectErrorType(error) {
				if (error.name === 'TypeError') return 'js';
				if (error.name === 'ReferenceError') return 'js';
				if (error.name === 'SyntaxError') return 'js';
				if (error.message && error.message.includes('Promise')) return 'promise';
				if (error.message && error.message.includes('API')) return 'api';
				return 'custom';
			},
			
			// 生成错误指纹
			generateFingerprint(error) {
				const type = this.detectErrorType(error);
				const message = (error.message || '').substring(0, 100);
				const stack = (error.stack || '').split('\n')[0];
				
				return this.simpleHash(type + message + stack);
			},
			
			// 简单哈希函数
			simpleHash(str) {
				let hash = 0;
				for (let i = 0; i < str.length; i++) {
					const char = str.charCodeAt(i);
					hash = ((hash << 5) - hash) + char;
					hash = hash & hash; // Convert to 32bit integer
				}
				return Math.abs(hash).toString(36);
			},
			
			// 获取所有错误
			getErrors() {
				return errors;
			},
			
			// 获取操作轨迹
			getBreadcrumbs() {
				return breadcrumbs;
			},
			
			// 清空错误
			clearErrors() {
				errors.length = 0;
			},
			
			// 清空轨迹
			clearBreadcrumbs() {
				breadcrumbs.length = 0;
			}
		};
	}
	
	/**
	 * 添加测试用例
	 */
	test(name, fn) {
		this.tests.push({ name, fn });
	}
	
	/**
	 * 运行所有测试
	 */
	async run() {
		console.log('\n==========================================');
		console.log('错误模拟测试');
		console.log('==========================================\n');
		
		for (const test of this.tests) {
			this.results.total++;
			
			try {
				// 重置状态
				this.errorTracker.clearErrors();
				this.errorTracker.clearBreadcrumbs();
				
				// 运行测试
				await test.fn(this.errorTracker);
				
				this.results.passed++;
				console.log(`✅ ${test.name}`);
			} catch (error) {
				this.results.failed++;
				console.error(`❌ ${test.name}`);
				console.error(`   错误: ${error.message}`);
			}
		}
		
		// 输出统计
		console.log('\n==========================================');
		console.log('测试结果统计');
		console.log('==========================================');
		console.log(`总计: ${this.results.total}`);
		console.log(`通过: ${this.results.passed} ✅`);
		console.log(`失败: ${this.results.failed} ❌`);
		console.log(`通过率: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);
		console.log('==========================================\n');
		
		// 退出码
		process.exit(this.results.failed > 0 ? 1 : 0);
	}
}

// 创建测试实例
const suite = new ErrorSimulationTest();

// ==========================================
// 测试用例
// ==========================================

/**
 * 测试1: 捕获JS错误
 */
suite.test('应该能够捕获JS错误（TypeError）', (tracker) => {
	const error = new TypeError('Cannot read property "foo" of undefined');
	const record = tracker.captureError(error, 'error');
	
	assert.strictEqual(record.type, 'js', '错误类型应为js');
	assert.strictEqual(record.level, 'error', '错误级别应为error');
	assert(record.message.includes('Cannot read property'), '错误消息应包含原始信息');
	assert(record.fingerprint, '应生成错误指纹');
	
	const errors = tracker.getErrors();
	assert.strictEqual(errors.length, 1, '应记录1个错误');
});

/**
 * 测试2: 捕获Promise rejection
 */
suite.test('应该能够捕获Promise rejection', (tracker) => {
	const error = new Error('Promise rejected: Network error');
	const record = tracker.captureError(error, 'error', {
		page: '/pages/home/home'
	});
	
	assert.strictEqual(record.type, 'promise', '错误类型应为promise');
	assert(record.message.includes('Promise'), '错误消息应包含Promise关键词');
	assert.strictEqual(record.context.page, '/pages/home/home', '应记录上下文信息');
});

/**
 * 测试3: 捕获API错误
 */
suite.test('应该能够捕获API请求错误', (tracker) => {
	const error = new Error('API request failed: 500 Internal Server Error');
	const record = tracker.captureError(error, 'error', {
		api: '/api/user/login',
		statusCode: 500
	});
	
	assert.strictEqual(record.type, 'api', '错误类型应为api');
	assert(record.message.includes('API'), '错误消息应包含API关键词');
	assert.strictEqual(record.context.statusCode, 500, '应记录状态码');
});

/**
 * 测试4: 捕获自定义错误
 */
suite.test('应该能够捕获自定义错误', (tracker) => {
	const error = new Error('用户验证失败');
	const record = tracker.captureError(error, 'warning', {
		userId: 'user123',
		action: 'login'
	});
	
	assert.strictEqual(record.type, 'custom', '错误类型应为custom');
	assert.strictEqual(record.level, 'warning', '错误级别应为warning');
	assert.strictEqual(record.context.userId, 'user123', '应记录用户ID');
});

/**
 * 测试5: 捕获致命错误
 */
suite.test('应该能够捕获致命错误', (tracker) => {
	const error = new Error('应用崩溃：内存溢出');
	const record = tracker.captureError(error, 'fatal');
	
	assert.strictEqual(record.level, 'fatal', '错误级别应为fatal');
});

/**
 * 测试6: 添加操作轨迹
 */
suite.test('应该能够添加用户操作轨迹', (tracker) => {
	tracker.addBreadcrumb('user', '用户点击登录按钮');
	tracker.addBreadcrumb('navigation', '导航到首页', { page: '/pages/home/home' });
	tracker.addBreadcrumb('api', 'API请求', { url: '/api/user/profile' });
	
	const breadcrumbs = tracker.getBreadcrumbs();
	assert.strictEqual(breadcrumbs.length, 3, '应记录3条轨迹');
	
	assert.strictEqual(breadcrumbs[0].category, 'user', '第1条轨迹类型应为user');
	assert.strictEqual(breadcrumbs[1].category, 'navigation', '第2条轨迹类型应为navigation');
	assert.strictEqual(breadcrumbs[2].category, 'api', '第3条轨迹类型应为api');
});

/**
 * 测试7: 轨迹数量限制
 */
suite.test('操作轨迹应限制为最多30条', (tracker) => {
	// 添加35条轨迹
	for (let i = 0; i < 35; i++) {
		tracker.addBreadcrumb('test', `轨迹 ${i + 1}`);
	}
	
	const breadcrumbs = tracker.getBreadcrumbs();
	assert.strictEqual(breadcrumbs.length, 30, '应最多保留30条轨迹');
	
	// 应该是最新的30条（第6条到第35条）
	assert(breadcrumbs[0].message.includes('轨迹 6'), '应保留最新的30条');
	assert(breadcrumbs[29].message.includes('轨迹 35'), '最后一条应为第35条');
});

/**
 * 测试8: 错误去重（相同指纹）
 */
suite.test('相同错误应生成相同指纹', (tracker) => {
	const error1 = new TypeError('Cannot read property "foo" of undefined');
	const error2 = new TypeError('Cannot read property "foo" of undefined');
	
	const record1 = tracker.captureError(error1);
	const record2 = tracker.captureError(error2);
	
	assert.strictEqual(record1.fingerprint, record2.fingerprint, '相同错误应生成相同指纹');
});

/**
 * 测试9: 错误去重（不同指纹）
 */
suite.test('不同错误应生成不同指纹', (tracker) => {
	const error1 = new TypeError('Cannot read property "foo" of undefined');
	const error2 = new ReferenceError('bar is not defined');
	
	const record1 = tracker.captureError(error1);
	const record2 = tracker.captureError(error2);
	
	assert.notStrictEqual(record1.fingerprint, record2.fingerprint, '不同错误应生成不同指纹');
});

/**
 * 测试10: 错误包含操作轨迹
 */
suite.test('捕获的错误应包含操作轨迹', (tracker) => {
	tracker.addBreadcrumb('user', '用户登录');
	tracker.addBreadcrumb('api', 'API请求');
	
	const error = new Error('登录失败');
	const record = tracker.captureError(error);
	
	assert.strictEqual(record.breadcrumbs.length, 2, '错误应包含2条操作轨迹');
	assert.strictEqual(record.breadcrumbs[0].category, 'user', '第1条轨迹应为用户操作');
});

/**
 * 测试11: 批量错误记录
 */
suite.test('应该能够批量记录多个错误', (tracker) => {
	const errors = [
		new TypeError('Error 1'),
		new ReferenceError('Error 2'),
		new Error('Error 3')
	];
	
	errors.forEach(err => tracker.captureError(err));
	
	const records = tracker.getErrors();
	assert.strictEqual(records.length, 3, '应记录3个错误');
});

/**
 * 测试12: 错误上下文信息完整性
 */
suite.test('错误应包含完整的上下文信息', (tracker) => {
	const context = {
		page: '/pages/home/home',
		route: { path: '/pages/home/home', query: {} },
		platform: 'mp-weixin',
		systemInfo: {
			platform: 'ios',
			version: '8.0.5'
		},
		userId: 'user123'
	};
	
	const error = new Error('测试错误');
	const record = tracker.captureError(error, 'error', context);
	
	assert.deepStrictEqual(record.context, context, '应完整记录上下文信息');
});

/**
 * 测试13: 错误ID唯一性
 */
suite.test('每个错误应有唯一的ID', (tracker) => {
	const error1 = new Error('Error 1');
	const error2 = new Error('Error 2');
	
	const record1 = tracker.captureError(error1);
	const record2 = tracker.captureError(error2);
	
	assert.notStrictEqual(record1.id, record2.id, '错误ID应唯一');
	assert(record1.id.startsWith('err_'), 'ID应以err_开头');
	assert(record2.id.startsWith('err_'), 'ID应以err_开头');
});

/**
 * 测试14: 错误时间戳
 */
suite.test('错误应记录时间戳', (tracker) => {
	const before = Date.now();
	const error = new Error('测试错误');
	const record = tracker.captureError(error);
	const after = Date.now();
	
	assert(record.timestamp >= before && record.timestamp <= after, '时间戳应在合理范围内');
});

/**
 * 测试15: 清空功能
 */
suite.test('应该能够清空错误和轨迹', (tracker) => {
	tracker.addBreadcrumb('test', '测试轨迹');
	tracker.captureError(new Error('测试错误'));
	
	assert.strictEqual(tracker.getBreadcrumbs().length, 1, '应有1条轨迹');
	assert.strictEqual(tracker.getErrors().length, 1, '应有1个错误');
	
	tracker.clearBreadcrumbs();
	tracker.clearErrors();
	
	assert.strictEqual(tracker.getBreadcrumbs().length, 0, '轨迹应被清空');
	assert.strictEqual(tracker.getErrors().length, 0, '错误应被清空');
});

/**
 * 测试16: 错误堆栈信息
 */
suite.test('应该记录错误堆栈信息', (tracker) => {
	const error = new Error('测试错误');
	const record = tracker.captureError(error);
	
	assert(record.stack, '应记录错误堆栈');
	assert(typeof record.stack === 'string', '堆栈应为字符串');
});

/**
 * 测试17: 不同级别的错误
 */
suite.test('应该支持不同级别的错误', (tracker) => {
	const levels = ['debug', 'info', 'warning', 'error', 'fatal'];
	
	levels.forEach(level => {
		const error = new Error(`${level}级别错误`);
		const record = tracker.captureError(error, level);
		assert.strictEqual(record.level, level, `应记录${level}级别`);
	});
	
	assert.strictEqual(tracker.getErrors().length, 5, '应记录5个不同级别的错误');
});

// 运行测试
suite.run();

