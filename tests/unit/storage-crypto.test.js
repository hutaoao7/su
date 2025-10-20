/**
 * storage-crypto.js 单元测试
 * 
 * 测试覆盖：
 * 1. 加密/解密基本功能
 * 2. 设置/获取/删除加密存储
 * 3. 数据迁移功能
 * 4. 错误处理
 * 5. 边界条件
 * 
 * 运行命令：
 * node tests/unit/storage-crypto.test.js
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
	getStorageInfoSync: function() {
		return {
			keys: Object.keys(this._storage)
		};
	},
	clearStorageSync: function() {
		this._storage = {};
	},
	arrayBufferToBase64: function(buffer) {
		// 简单实现
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.length; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return Buffer.from(binary, 'binary').toString('base64');
	},
	base64ToArrayBuffer: function(base64) {
		const binary = Buffer.from(base64, 'base64').toString('binary');
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes.buffer;
	},
	_storage: {}
};

// 导入被测试的模块
const storageCrypto = require('../../utils/storage-crypto.js').default;

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

function assertNull(actual, testName) {
	if (actual === null || actual === undefined) {
		console.log(`✅ ${testName}`);
		testsPassed++;
	} else {
		console.error(`❌ ${testName}`);
		console.error(`   期望为空，实际为: ${actual}`);
		testsFailed++;
	}
}

function assertThrows(fn, testName) {
	try {
		fn();
		console.error(`❌ ${testName}`);
		console.error(`   期望抛出错误，但没有`);
		testsFailed++;
	} catch (error) {
		console.log(`✅ ${testName}`);
		testsPassed++;
	}
}

async function assertThrowsAsync(fn, testName) {
	try {
		await fn();
		console.error(`❌ ${testName}`);
		console.error(`   期望抛出错误，但没有`);
		testsFailed++;
	} catch (error) {
		console.log(`✅ ${testName}`);
		testsPassed++;
	}
}

// 测试套件
async function runTests() {
	console.log('🚀 开始运行 storage-crypto.js 单元测试\n');
	
	// 清空storage
	uni.clearStorageSync();
	
	// 测试1：加密和解密基本功能
	console.log('📦 测试组1：加密和解密基本功能');
	try {
		const plaintext = 'Hello, CraneHeart!';
		const encrypted = await storageCrypto.encrypt(plaintext);
		assertNotNull(encrypted, '1.1 加密返回非空结果');
		
		const decrypted = await storageCrypto.decrypt(encrypted);
		assertEqual(decrypted, plaintext, '1.2 解密恢复原始明文');
	} catch (error) {
		console.error('❌ 测试组1失败:', error);
		testsFailed++;
	}
	
	// 测试2：加密存储 - 字符串
	console.log('\n📦 测试组2：加密存储 - 字符串');
	try {
		const key = 'test_string';
		const value = 'secret_token_12345';
		
		await storageCrypto.setSecure(key, value);
		const retrieved = await storageCrypto.getSecure(key);
		
		assertEqual(retrieved, value, '2.1 字符串加密存储和读取');
	} catch (error) {
		console.error('❌ 测试组2失败:', error);
		testsFailed++;
	}
	
	// 测试3：加密存储 - 对象
	console.log('\n📦 测试组3：加密存储 - 对象');
	try {
		const key = 'test_object';
		const value = {
			id: 123,
			name: 'Test User',
			phone: '13800138000',
			sensitive: true
		};
		
		await storageCrypto.setSecure(key, value);
		const retrieved = await storageCrypto.getSecure(key);
		
		assertEqual(retrieved, value, '3.1 对象加密存储和读取');
		assertEqual(retrieved.id, 123, '3.2 对象字段正确 - id');
		assertEqual(retrieved.name, 'Test User', '3.3 对象字段正确 - name');
		assertEqual(retrieved.phone, '13800138000', '3.4 对象字段正确 - phone');
	} catch (error) {
		console.error('❌ 测试组3失败:', error);
		testsFailed++;
	}
	
	// 测试4：加密存储 - 数组
	console.log('\n📦 测试组4：加密存储 - 数组');
	try {
		const key = 'test_array';
		const value = ['item1', 'item2', 'item3'];
		
		await storageCrypto.setSecure(key, value);
		const retrieved = await storageCrypto.getSecure(key);
		
		assertEqual(retrieved, value, '4.1 数组加密存储和读取');
		assertEqual(retrieved.length, 3, '4.2 数组长度正确');
	} catch (error) {
		console.error('❌ 测试组4失败:', error);
		testsFailed++;
	}
	
	// 测试5：加密存储 - 嵌套对象
	console.log('\n📦 测试组5：加密存储 - 嵌套对象');
	try {
		const key = 'test_nested';
		const value = {
			user: {
				id: 456,
				profile: {
					name: 'Nested User',
					settings: {
						privacy: true,
						notifications: ['email', 'sms']
					}
				}
			},
			timestamp: Date.now()
		};
		
		await storageCrypto.setSecure(key, value);
		const retrieved = await storageCrypto.getSecure(key);
		
		assertEqual(retrieved, value, '5.1 嵌套对象加密存储和读取');
		assertEqual(retrieved.user.profile.name, 'Nested User', '5.2 嵌套字段正确');
		assertEqual(retrieved.user.profile.settings.notifications.length, 2, '5.3 嵌套数组长度正确');
	} catch (error) {
		console.error('❌ 测试组5失败:', error);
		testsFailed++;
	}
	
	// 测试6：删除加密存储
	console.log('\n📦 测试组6：删除加密存储');
	try {
		const key = 'test_remove';
		const value = 'to_be_removed';
		
		await storageCrypto.setSecure(key, value);
		const beforeRemove = await storageCrypto.getSecure(key);
		assertEqual(beforeRemove, value, '6.1 删除前数据存在');
		
		await storageCrypto.removeSecure(key);
		const afterRemove = await storageCrypto.getSecure(key);
		assertNull(afterRemove, '6.2 删除后数据为空');
	} catch (error) {
		console.error('❌ 测试组6失败:', error);
		testsFailed++;
	}
	
	// 测试7：获取不存在的键
	console.log('\n📦 测试组7：获取不存在的键');
	try {
		const retrieved = await storageCrypto.getSecure('non_existent_key');
		assertNull(retrieved, '7.1 不存在的键返回null');
	} catch (error) {
		console.error('❌ 测试组7失败:', error);
		testsFailed++;
	}
	
	// 测试8：数据迁移功能
	console.log('\n📦 测试组8：数据迁移功能');
	try {
		const key = 'test_migrate';
		const value = { id: 789, token: 'old_unencrypted_token' };
		
		// 模拟旧的未加密数据
		uni.setStorageSync(key, JSON.stringify(value));
		
		// 迁移到加密存储
		await storageCrypto.migrateToSecure(key);
		
		// 验证迁移后数据正确
		const retrieved = await storageCrypto.getSecure(key);
		assertEqual(retrieved, value, '8.1 迁移后数据正确');
		
		// 验证数据已加密（检查storage中的原始值）
		const rawValue = uni.getStorageSync(key);
		const isEncrypted = rawValue.startsWith('__ENCRYPTED__');
		assertEqual(isEncrypted, true, '8.2 迁移后数据已加密');
	} catch (error) {
		console.error('❌ 测试组8失败:', error);
		testsFailed++;
	}
	
	// 测试9：批量迁移功能
	console.log('\n📦 测试组9：批量迁移功能');
	try {
		const keys = ['migrate1', 'migrate2', 'migrate3'];
		const values = [
			{ id: 1, data: 'data1' },
			{ id: 2, data: 'data2' },
			{ id: 3, data: 'data3' }
		];
		
		// 设置未加密数据
		keys.forEach((key, index) => {
			uni.setStorageSync(key, JSON.stringify(values[index]));
		});
		
		// 批量迁移
		const result = await storageCrypto.batchMigrate(keys);
		assertEqual(result.success, 3, '9.1 批量迁移成功数量正确');
		assertEqual(result.failed, 0, '9.2 批量迁移失败数量为0');
		
		// 验证每个数据都已加密
		for (let i = 0; i < keys.length; i++) {
			const retrieved = await storageCrypto.getSecure(keys[i]);
			assertEqual(retrieved, values[i], `9.${3 + i} 迁移后数据${i + 1}正确`);
		}
	} catch (error) {
		console.error('❌ 测试组9失败:', error);
		testsFailed++;
	}
	
	// 测试10：清空所有加密存储
	console.log('\n📦 测试组10：清空所有加密存储');
	try {
		// 设置一些加密数据
		await storageCrypto.setSecure('clear1', 'value1');
		await storageCrypto.setSecure('clear2', 'value2');
		
		// 设置一些非加密数据（不应被清除）
		uni.setStorageSync('keep1', 'keep_value1');
		
		// 清空加密存储
		await storageCrypto.clearSecure();
		
		// 验证加密数据已清除
		const cleared1 = await storageCrypto.getSecure('clear1');
		const cleared2 = await storageCrypto.getSecure('clear2');
		assertNull(cleared1, '10.1 加密数据1已清除');
		assertNull(cleared2, '10.2 加密数据2已清除');
		
		// 验证非加密数据保留
		const kept = uni.getStorageSync('keep1');
		assertEqual(kept, 'keep_value1', '10.3 非加密数据保留');
	} catch (error) {
		console.error('❌ 测试组10失败:', error);
		testsFailed++;
	}
	
	// 测试11：错误处理 - 空键
	console.log('\n📦 测试组11：错误处理 - 空键');
	await assertThrowsAsync(
		() => storageCrypto.setSecure('', 'value'),
		'11.1 空键抛出错误'
	);
	
	// 测试12：错误处理 - null值
	console.log('\n📦 测试组12：错误处理 - null值');
	try {
		await storageCrypto.setSecure('null_test', null);
		const retrieved = await storageCrypto.getSecure('null_test');
		assertNull(retrieved, '12.1 null值正确处理');
	} catch (error) {
		console.error('❌ 测试组12失败:', error);
		testsFailed++;
	}
	
	// 测试13：特殊字符处理
	console.log('\n📦 测试组13：特殊字符处理');
	try {
		const specialChars = '特殊字符 !@#$%^&*()_+{}|:"<>?[]\\;\',./`~\n\t\r';
		await storageCrypto.setSecure('special_chars', specialChars);
		const retrieved = await storageCrypto.getSecure('special_chars');
		assertEqual(retrieved, specialChars, '13.1 特殊字符正确处理');
	} catch (error) {
		console.error('❌ 测试组13失败:', error);
		testsFailed++;
	}
	
	// 测试14：大数据量处理
	console.log('\n📦 测试组14：大数据量处理');
	try {
		const largeData = {
			messages: Array(100).fill(null).map((_, i) => ({
				id: i,
				content: `Message ${i} with some content`,
				timestamp: Date.now() + i
			}))
		};
		
		await storageCrypto.setSecure('large_data', largeData);
		const retrieved = await storageCrypto.getSecure('large_data');
		
		assertEqual(retrieved.messages.length, 100, '14.1 大数据量长度正确');
		assertEqual(retrieved.messages[0].content, 'Message 0 with some content', '14.2 大数据量内容正确');
	} catch (error) {
		console.error('❌ 测试组14失败:', error);
		testsFailed++;
	}
	
	// 测试15：Unicode字符处理
	console.log('\n📦 测试组15：Unicode字符处理');
	try {
		const unicodeText = '你好世界 🌍 Hello World 🚀 こんにちは 안녕하세요';
		await storageCrypto.setSecure('unicode_test', unicodeText);
		const retrieved = await storageCrypto.getSecure('unicode_test');
		assertEqual(retrieved, unicodeText, '15.1 Unicode字符正确处理');
	} catch (error) {
		console.error('❌ 测试组15失败:', error);
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

// 运行测试
runTests().catch(error => {
	console.error('❌ 测试执行失败:', error);
	process.exit(1);
});

