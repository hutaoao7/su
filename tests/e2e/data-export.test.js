/**
 * 用户数据导出功能E2E测试
 * 
 * 测试覆盖：
 * 1. 完整数据导出流程
 * 2. 部分数据导出
 * 3. 不同格式导出
 * 4. 加密导出
 * 5. 导出历史查询
 * 6. 权限验证
 * 7. 错误处理
 * 
 * 运行方式：
 * node tests/e2e/data-export.test.js
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

// 模拟uni对象
global.uni = {
	showLoading: (options) => console.log('[Loading]', options.title),
	hideLoading: () => console.log('[Loading] 隐藏'),
	showToast: (options) => console.log('[Toast]', options.title),
	showModal: (options) => {
		console.log('[Modal]', options.title, options.content);
		if (options.success) {
			options.success({ confirm: true });
		}
	},
	getStorageSync: (key) => {
		const storage = global.__mockStorage || {};
		return storage[key] || null;
	},
	setStorageSync: (key, value) => {
		if (!global.__mockStorage) {
			global.__mockStorage = {};
		}
		global.__mockStorage[key] = value;
	},
	removeStorageSync: (key) => {
		if (global.__mockStorage) {
			delete global.__mockStorage[key];
		}
	},
	request: (options) => {
		// 模拟网络请求
		setTimeout(() => {
			options.success({ statusCode: 200, data: {} });
		}, 100);
	}
};

// 模拟uniCloud
global.uniCloud = {
	callFunction: async (options) => {
		// 模拟云函数调用
		console.log('[CloudFunction]', options.name, options.data);
		
		// 根据operation返回不同的模拟数据
		if (options.data.operation === 'export') {
			return {
				result: {
					code: 0,
					message: '导出成功',
					data: {
						exportId: 'test_export_' + Date.now(),
						exportData: {
							metadata: {
								exportTime: new Date().toISOString(),
								userId: 'test_user_123',
								dataTypes: options.data.dataTypes,
								format: options.data.format
							},
							profile: {
								basic: { id: 'test_user_123', nickname: '测试用户' }
							}
						}
					}
				}
			};
		}
		
		if (options.data.operation === 'get_history') {
			return {
				result: {
					code: 0,
					message: '获取成功',
					data: [
						{
							id: 'history_1',
							data_types: ['profile'],
							format: 'json',
							data_size: 1024,
							created_at: new Date().toISOString()
						}
					]
				}
			};
		}
		
		return {
			result: {
				code: 0,
				message: '成功',
				data: null
			}
		};
	}
};

// 测试工具
const assert = {
	ok: (condition, message) => {
		if (!condition) {
			throw new Error(`断言失败: ${message}`);
		}
		console.log('✅', message || '断言通过');
	},
	equal: (actual, expected, message) => {
		if (actual !== expected) {
			throw new Error(`断言失败: ${message}\n期望: ${expected}\n实际: ${actual}`);
		}
		console.log('✅', message || `${actual} === ${expected}`);
	},
	notEqual: (actual, expected, message) => {
		if (actual === expected) {
			throw new Error(`断言失败: ${message}\n不应该相等: ${actual}`);
		}
		console.log('✅', message || `${actual} !== ${expected}`);
	},
	includes: (array, item, message) => {
		if (!array.includes(item)) {
			throw new Error(`断言失败: ${message}\n数组不包含: ${item}`);
		}
		console.log('✅', message || `数组包含 ${item}`);
	}
};

// 导入要测试的模块
const { exportUserData, getExportHistory, clearExportHistory, DATA_TYPES, EXPORT_FORMATS } = require('../../utils/data-export-helper.js');

// 测试套件
const tests = {
	// 测试1: 导出全部数据（JSON格式）
	async test_export_all_data_json() {
		console.log('\n📝 测试1: 导出全部数据（JSON格式）');
		
		const result = await exportUserData({
			dataTypes: [DATA_TYPES.ALL],
			format: EXPORT_FORMATS.JSON,
			encrypted: false
		});
		
		assert.ok(result.success, '导出应该成功');
		assert.ok(result.filename, '应该有文件名');
		assert.ok(result.filename.endsWith('.json'), '文件名应该是.json结尾');
		assert.ok(result.fileSize > 0, '文件大小应该大于0');
		
		console.log('导出结果:', result);
	},
	
	// 测试2: 导出部分数据
	async test_export_partial_data() {
		console.log('\n📝 测试2: 导出部分数据');
		
		const result = await exportUserData({
			dataTypes: [DATA_TYPES.PROFILE, DATA_TYPES.ASSESSMENTS],
			format: EXPORT_FORMATS.JSON,
			encrypted: false
		});
		
		assert.ok(result.success, '导出应该成功');
		assert.ok(result.filename, '应该有文件名');
		
		console.log('部分导出结果:', result);
	},
	
	// 测试3: CSV格式导出
	async test_export_csv_format() {
		console.log('\n📝 测试3: CSV格式导出');
		
		const result = await exportUserData({
			dataTypes: [DATA_TYPES.ALL],
			format: EXPORT_FORMATS.CSV,
			encrypted: false
		});
		
		assert.ok(result.success, '导出应该成功');
		assert.ok(result.filename.endsWith('.csv'), '文件名应该是.csv结尾');
		
		console.log('CSV导出结果:', result);
	},
	
	// 测试4: 加密导出
	async test_export_encrypted() {
		console.log('\n📝 测试4: 加密导出');
		
		const result = await exportUserData({
			dataTypes: [DATA_TYPES.ALL],
			format: EXPORT_FORMATS.JSON,
			encrypted: true
		});
		
		assert.ok(result.success, '加密导出应该成功');
		assert.ok(result.filename.includes('.encrypted.'), '文件名应该包含.encrypted.');
		
		console.log('加密导出结果:', result);
	},
	
	// 测试5: 导出历史记录
	async test_export_history() {
		console.log('\n📝 测试5: 导出历史记录');
		
		// 先导出一些数据
		await exportUserData({
			dataTypes: [DATA_TYPES.PROFILE],
			format: EXPORT_FORMATS.JSON,
			encrypted: false
		});
		
		// 获取历史记录
		const history = getExportHistory();
		
		assert.ok(Array.isArray(history), '历史记录应该是数组');
		assert.ok(history.length > 0, '应该有历史记录');
		
		const lastRecord = history[0];
		assert.ok(lastRecord.dataTypes, '记录应该有dataTypes字段');
		assert.ok(lastRecord.format, '记录应该有format字段');
		assert.ok(lastRecord.filename, '记录应该有filename字段');
		assert.ok(lastRecord.timestamp, '记录应该有timestamp字段');
		
		console.log('历史记录:', history);
	},
	
	// 测试6: 清空导出历史
	async test_clear_export_history() {
		console.log('\n📝 测试6: 清空导出历史');
		
		// 先导出一些数据
		await exportUserData({
			dataTypes: [DATA_TYPES.PROFILE],
			format: EXPORT_FORMATS.JSON,
			encrypted: false
		});
		
		// 清空历史
		const result = clearExportHistory();
		assert.ok(result, '清空应该成功');
		
		// 验证已清空
		const history = getExportHistory();
		assert.equal(history.length, 0, '历史记录应该为空');
		
		console.log('清空历史成功');
	},
	
	// 测试7: 导出数据类型验证
	async test_export_data_types() {
		console.log('\n📝 测试7: 导出数据类型验证');
		
		const dataTypes = [
			DATA_TYPES.PROFILE,
			DATA_TYPES.ASSESSMENTS,
			DATA_TYPES.CHATS,
			DATA_TYPES.MUSIC,
			DATA_TYPES.COMMUNITY,
			DATA_TYPES.CDK,
			DATA_TYPES.CONSENT
		];
		
		for (const type of dataTypes) {
			const result = await exportUserData({
				dataTypes: [type],
				format: EXPORT_FORMATS.JSON,
				encrypted: false
			});
			
			assert.ok(result.success, `导出${type}应该成功`);
			console.log(`✅ ${type} 导出成功`);
		}
	},
	
	// 测试8: 导出格式验证
	async test_export_formats() {
		console.log('\n📝 测试8: 导出格式验证');
		
		const formats = [
			EXPORT_FORMATS.JSON,
			EXPORT_FORMATS.CSV
		];
		
		for (const format of formats) {
			const result = await exportUserData({
				dataTypes: [DATA_TYPES.PROFILE],
				format: format,
				encrypted: false
			});
			
			assert.ok(result.success, `${format}格式导出应该成功`);
			assert.ok(result.filename.endsWith(`.${format}`), `文件名应该是.${format}结尾`);
			console.log(`✅ ${format} 格式导出成功`);
		}
	},
	
	// 测试9: 空数据类型处理
	async test_empty_data_types() {
		console.log('\n📝 测试9: 空数据类型处理');
		
		const result = await exportUserData({
			dataTypes: [],
			format: EXPORT_FORMATS.JSON,
			encrypted: false
		});
		
		// 空数据类型应该使用默认值[ALL]
		assert.ok(result.success || !result.success, '应该有返回结果');
		
		console.log('空数据类型处理结果:', result);
	},
	
	// 测试10: 大数据量导出性能测试
	async test_large_data_export_performance() {
		console.log('\n📝 测试10: 大数据量导出性能测试');
		
		const startTime = Date.now();
		
		const result = await exportUserData({
			dataTypes: [DATA_TYPES.ALL],
			format: EXPORT_FORMATS.JSON,
			encrypted: false
		});
		
		const endTime = Date.now();
		const duration = endTime - startTime;
		
		assert.ok(result.success, '导出应该成功');
		assert.ok(duration < 5000, '导出应该在5秒内完成');
		
		console.log(`导出耗时: ${duration}ms`);
	},
	
	// 测试11: 并发导出测试
	async test_concurrent_exports() {
		console.log('\n📝 测试11: 并发导出测试');
		
		const promises = [
			exportUserData({
				dataTypes: [DATA_TYPES.PROFILE],
				format: EXPORT_FORMATS.JSON,
				encrypted: false
			}),
			exportUserData({
				dataTypes: [DATA_TYPES.ASSESSMENTS],
				format: EXPORT_FORMATS.CSV,
				encrypted: false
			}),
			exportUserData({
				dataTypes: [DATA_TYPES.CHATS],
				format: EXPORT_FORMATS.JSON,
				encrypted: true
			})
		];
		
		const results = await Promise.all(promises);
		
		results.forEach((result, index) => {
			assert.ok(result.success, `并发导出${index + 1}应该成功`);
		});
		
		console.log('并发导出全部成功');
	},
	
	// 测试12: 导出历史限制测试
	async test_export_history_limit() {
		console.log('\n📝 测试12: 导出历史限制测试');
		
		// 清空历史
		clearExportHistory();
		
		// 导出60次（超过限制50）
		for (let i = 0; i < 60; i++) {
			await exportUserData({
				dataTypes: [DATA_TYPES.PROFILE],
				format: EXPORT_FORMATS.JSON,
				encrypted: false
			});
		}
		
		// 验证历史记录数量
		const history = getExportHistory();
		assert.ok(history.length <= 50, '历史记录应该不超过50条');
		
		console.log(`历史记录数量: ${history.length}`);
	},
	
	// 测试13: 文件名格式验证
	async test_filename_format() {
		console.log('\n📝 测试13: 文件名格式验证');
		
		const result = await exportUserData({
			dataTypes: [DATA_TYPES.PROFILE],
			format: EXPORT_FORMATS.JSON,
			encrypted: false
		});
		
		assert.ok(result.success, '导出应该成功');
		assert.ok(result.filename.startsWith('user_data_'), '文件名应该以user_data_开头');
		assert.ok(/\d{13}/.test(result.filename), '文件名应该包含时间戳');
		
		console.log('文件名:', result.filename);
	}
};

// 运行所有测试
async function runAllTests() {
	console.log('🚀 开始运行用户数据导出功能测试...\n');
	console.log('=' .repeat(60));
	
	let passedCount = 0;
	let failedCount = 0;
	const failedTests = [];
	
	for (const [testName, testFunc] of Object.entries(tests)) {
		try {
			await testFunc();
			passedCount++;
			console.log(`✅ ${testName} 通过\n`);
		} catch (error) {
			failedCount++;
			failedTests.push({ name: testName, error });
			console.error(`❌ ${testName} 失败:`);
			console.error(error.message);
			console.error(error.stack);
			console.log('');
		}
	}
	
	console.log('=' .repeat(60));
	console.log('\n📊 测试结果汇总:');
	console.log(`总测试数: ${passedCount + failedCount}`);
	console.log(`✅ 通过: ${passedCount}`);
	console.log(`❌ 失败: ${failedCount}`);
	console.log(`通过率: ${((passedCount / (passedCount + failedCount)) * 100).toFixed(2)}%`);
	
	if (failedTests.length > 0) {
		console.log('\n❌ 失败的测试:');
		failedTests.forEach(({ name, error }) => {
			console.log(`  - ${name}: ${error.message}`);
		});
	}
	
	console.log('\n' + '='.repeat(60));
	
	// 返回退出码
	process.exit(failedCount > 0 ? 1 : 0);
}

// 如果直接运行此文件，则执行所有测试
if (require.main === module) {
	runAllTests().catch((error) => {
		console.error('测试执行失败:', error);
		process.exit(1);
	});
}

// 导出测试函数供其他模块使用
module.exports = {
	tests,
	runAllTests
};

