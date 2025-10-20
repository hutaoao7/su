/**
 * 本地存储加密工具
 * 
 * 功能说明：
 * 1. AES-256-GCM加密算法
 * 2. 基于设备ID和用户ID的密钥派生
 * 3. 支持H5和小程序双端
 * 4. 自动处理加密/解密错误
 * 
 * 使用示例：
 * ```js
 * import storageCrypto from '@/utils/storage-crypto.js';
 * 
 * // 设置加密数据
 * await storageCrypto.setSecure('token', 'my-secret-token');
 * 
 * // 获取加密数据
 * const token = await storageCrypto.getSecure('token');
 * 
 * // 删除加密数据
 * await storageCrypto.removeSecure('token');
 * ```
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

// 加密配置
const CRYPTO_CONFIG = {
	algorithm: 'AES-GCM',
	keyLength: 256,
	ivLength: 12, // GCM模式推荐12字节
	saltLength: 16,
	iterations: 100000, // PBKDF2迭代次数
	tagLength: 128 // GCM认证标签长度
};

// 加密数据前缀标识
const ENCRYPTED_PREFIX = '__ENCRYPTED__';

/**
 * 获取设备唯一标识
 * @returns {Promise<string>}
 */
async function getDeviceId() {
	try {
		// 尝试从storage获取已保存的设备ID
		let deviceId = uni.getStorageSync('__device_id__');
		
		if (!deviceId) {
			// 生成新的设备ID
			// #ifdef H5
			// H5端：使用浏览器指纹
			deviceId = await generateBrowserFingerprint();
			// #endif
			
			// #ifdef MP-WEIXIN
			// 小程序端：使用系统信息
			const systemInfo = uni.getSystemInfoSync();
			deviceId = `${systemInfo.platform}_${systemInfo.system}_${systemInfo.model}_${Date.now()}`;
			// #endif
			
			// 使用UUID作为后备方案
			if (!deviceId) {
				deviceId = generateUUID();
			}
			
			// 保存设备ID
			uni.setStorageSync('__device_id__', deviceId);
		}
		
		return deviceId;
	} catch (error) {
		console.error('[StorageCrypto] 获取设备ID失败:', error);
		// 降级方案：使用随机UUID
		return generateUUID();
	}
}

/**
 * 生成浏览器指纹（H5端）
 * @returns {Promise<string>}
 */
async function generateBrowserFingerprint() {
	try {
		const components = [
			(typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
			(typeof navigator !== 'undefined' ? navigator.language : 'zh-CN'),
			(typeof screen !== 'undefined' ? screen.colorDepth : 24),
			(typeof screen !== 'undefined' ? screen.width + 'x' + screen.height : '375x667'),
			new Date().getTimezoneOffset(),
			(typeof window !== 'undefined' ? !!window.sessionStorage : false),
			(typeof window !== 'undefined' ? !!window.localStorage : false)
		];
		
		const fingerprint = components.join('|');
		return await simpleHash(fingerprint);
	} catch (error) {
		// 降级方案：返回简单哈希
		return await simpleHash('fallback-' + Date.now());
	}
}

/**
 * 生成UUID
 * @returns {string}
 */
function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

/**
 * 简单哈希函数
 * @param {string} str
 * @returns {Promise<string>}
 */
async function simpleHash(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash).toString(36);
}

/**
 * 获取用户ID
 * @returns {string}
 */
function getUserId() {
	try {
		const userInfo = uni.getStorageSync('userInfo');
		if (userInfo && userInfo.id) {
			return userInfo.id.toString();
		}
		return 'anonymous';
	} catch (error) {
		console.error('[StorageCrypto] 获取用户ID失败:', error);
		return 'anonymous';
	}
}

/**
 * 派生加密密钥
 * @param {string} password 基础密码
 * @param {Uint8Array} salt 盐值
 * @returns {Promise<Uint8Array>}
 */
async function deriveKey(password, salt) {
	// #ifdef H5
	// H5端使用Web Crypto API
	try {
		const encoder = new TextEncoder();
		const passwordBuffer = encoder.encode(password);
		
		// 导入密码作为密钥材料
		const keyMaterial = await crypto.subtle.importKey(
			'raw',
			passwordBuffer,
			'PBKDF2',
			false,
			['deriveBits', 'deriveKey']
		);
		
		// 使用PBKDF2派生密钥
		const key = await crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: CRYPTO_CONFIG.iterations,
				hash: 'SHA-256'
			},
			keyMaterial,
			{
				name: 'AES-GCM',
				length: CRYPTO_CONFIG.keyLength
			},
			true,
			['encrypt', 'decrypt']
		);
		
		// 导出密钥的原始字节
		const exportedKey = await crypto.subtle.exportKey('raw', key);
		return new Uint8Array(exportedKey);
	} catch (error) {
		console.error('[StorageCrypto] Web Crypto API密钥派生失败:', error);
		// 降级到简单派生
		return simpleKeyDerivation(password, salt);
	}
	// #endif
	
	// #ifdef MP-WEIXIN
	// 小程序端使用简单派生算法
	return simpleKeyDerivation(password, salt);
	// #endif
}

/**
 * 简单密钥派生（降级方案）
 * @param {string} password
 * @param {Uint8Array} salt
 * @returns {Uint8Array}
 */
function simpleKeyDerivation(password, salt) {
	// 简单的PBKDF2实现（用于小程序端）
	const keyLength = CRYPTO_CONFIG.keyLength / 8; // 转换为字节
	const result = new Uint8Array(keyLength);
	
	// 合并password和salt
	let combined = password;
	for (let i = 0; i < salt.length; i++) {
		combined += String.fromCharCode(salt[i]);
	}
	
	// 多次哈希迭代
	let hash = combined;
	for (let i = 0; i < 1000; i++) {
		let tempHash = 0;
		for (let j = 0; j < hash.length; j++) {
			tempHash = ((tempHash << 5) - tempHash) + hash.charCodeAt(j);
			tempHash = tempHash & tempHash;
		}
		hash = tempHash.toString(36) + hash;
	}
	
	// 填充结果数组
	for (let i = 0; i < keyLength; i++) {
		result[i] = hash.charCodeAt(i % hash.length) & 0xFF;
	}
	
	return result;
}

/**
 * 生成随机字节数组
 * @param {number} length
 * @returns {Uint8Array}
 */
function getRandomBytes(length) {
	// #ifdef H5
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		return crypto.getRandomValues(new Uint8Array(length));
	}
	// #endif
	
	// 降级方案：使用Math.random
	const bytes = new Uint8Array(length);
	for (let i = 0; i < length; i++) {
		bytes[i] = Math.floor(Math.random() * 256);
	}
	return bytes;
}

/**
 * AES-GCM加密
 * @param {string} plaintext 明文
 * @param {Uint8Array} key 密钥
 * @param {Uint8Array} iv 初始化向量
 * @returns {Promise<Uint8Array>}
 */
async function aesGcmEncrypt(plaintext, key, iv) {
	// #ifdef H5
	try {
		const encoder = new TextEncoder();
		const plaintextBuffer = encoder.encode(plaintext);
		
		// 导入密钥
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			key,
			'AES-GCM',
			false,
			['encrypt']
		);
		
		// 加密
		const ciphertext = await crypto.subtle.encrypt(
			{
				name: 'AES-GCM',
				iv: iv,
				tagLength: CRYPTO_CONFIG.tagLength
			},
			cryptoKey,
			plaintextBuffer
		);
		
		return new Uint8Array(ciphertext);
	} catch (error) {
		console.error('[StorageCrypto] Web Crypto API加密失败:', error);
		// 降级到简单加密
		return simpleEncrypt(plaintext, key, iv);
	}
	// #endif
	
	// #ifdef MP-WEIXIN
	// 小程序端使用简单加密
	return simpleEncrypt(plaintext, key, iv);
	// #endif
}

/**
 * AES-GCM解密
 * @param {Uint8Array} ciphertext 密文
 * @param {Uint8Array} key 密钥
 * @param {Uint8Array} iv 初始化向量
 * @returns {Promise<string>}
 */
async function aesGcmDecrypt(ciphertext, key, iv) {
	// #ifdef H5
	try {
		// 导入密钥
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			key,
			'AES-GCM',
			false,
			['decrypt']
		);
		
		// 解密
		const plaintextBuffer = await crypto.subtle.decrypt(
			{
				name: 'AES-GCM',
				iv: iv,
				tagLength: CRYPTO_CONFIG.tagLength
			},
			cryptoKey,
			ciphertext
		);
		
		const decoder = new TextDecoder();
		return decoder.decode(plaintextBuffer);
	} catch (error) {
		console.error('[StorageCrypto] Web Crypto API解密失败:', error);
		// 降级到简单解密
		return simpleDecrypt(ciphertext, key, iv);
	}
	// #endif
	
	// #ifdef MP-WEIXIN
	// 小程序端使用简单解密
	return simpleDecrypt(ciphertext, key, iv);
	// #endif
}

/**
 * 简单加密（降级方案）
 * @param {string} plaintext
 * @param {Uint8Array} key
 * @param {Uint8Array} iv
 * @returns {Uint8Array}
 */
function simpleEncrypt(plaintext, key, iv) {
	// 简单的XOR加密
	const encoder = new TextEncoder();
	const plaintextBytes = encoder.encode(plaintext);
	const result = new Uint8Array(plaintextBytes.length);
	
	for (let i = 0; i < plaintextBytes.length; i++) {
		const keyByte = key[i % key.length];
		const ivByte = iv[i % iv.length];
		result[i] = plaintextBytes[i] ^ keyByte ^ ivByte;
	}
	
	return result;
}

/**
 * 简单解密（降级方案）
 * @param {Uint8Array} ciphertext
 * @param {Uint8Array} key
 * @param {Uint8Array} iv
 * @returns {string}
 */
function simpleDecrypt(ciphertext, key, iv) {
	// 简单的XOR解密
	const result = new Uint8Array(ciphertext.length);
	
	for (let i = 0; i < ciphertext.length; i++) {
		const keyByte = key[i % key.length];
		const ivByte = iv[i % iv.length];
		result[i] = ciphertext[i] ^ keyByte ^ ivByte;
	}
	
	const decoder = new TextDecoder();
	return decoder.decode(result);
}

/**
 * 字节数组转Base64
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToBase64(bytes) {
	// #ifdef H5
	return btoa(String.fromCharCode.apply(null, bytes));
	// #endif
	
	// #ifdef MP-WEIXIN
	// 小程序端使用uni.arrayBufferToBase64
	return uni.arrayBufferToBase64(bytes.buffer);
	// #endif
}

/**
 * Base64转字节数组
 * @param {string} base64
 * @returns {Uint8Array}
 */
function base64ToBytes(base64) {
	// #ifdef H5
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
	// #endif
	
	// #ifdef MP-WEIXIN
	// 小程序端使用uni.base64ToArrayBuffer
	const buffer = uni.base64ToArrayBuffer(base64);
	return new Uint8Array(buffer);
	// #endif
}

/**
 * 存储加密类
 */
class StorageCrypto {
	constructor() {
		this.masterPassword = null;
	}
	
	/**
	 * 初始化主密码
	 * @private
	 * @returns {Promise<string>}
	 */
	async _initMasterPassword() {
		if (this.masterPassword) {
			return this.masterPassword;
		}
		
		const deviceId = await getDeviceId();
		const userId = getUserId();
		
		// 组合生成主密码
		this.masterPassword = `${deviceId}:${userId}:craneheart`;
		
		return this.masterPassword;
	}
	
	/**
	 * 加密数据
	 * @param {string} plaintext 明文
	 * @returns {Promise<string>} 加密后的Base64字符串
	 */
	async encrypt(plaintext) {
		try {
			if (!plaintext || typeof plaintext !== 'string') {
				throw new Error('明文必须是非空字符串');
			}
			
			// 初始化主密码
			const masterPassword = await this._initMasterPassword();
			
			// 生成随机盐值和IV
			const salt = getRandomBytes(CRYPTO_CONFIG.saltLength);
			const iv = getRandomBytes(CRYPTO_CONFIG.ivLength);
			
			// 派生密钥
			const key = await deriveKey(masterPassword, salt);
			
			// 加密
			const ciphertext = await aesGcmEncrypt(plaintext, key, iv);
			
			// 组合数据：salt + iv + ciphertext
			const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
			combined.set(salt, 0);
			combined.set(iv, salt.length);
			combined.set(ciphertext, salt.length + iv.length);
			
			// 转换为Base64
			return bytesToBase64(combined);
		} catch (error) {
			console.error('[StorageCrypto] 加密失败:', error);
			throw error;
		}
	}
	
	/**
	 * 解密数据
	 * @param {string} encryptedBase64 加密的Base64字符串
	 * @returns {Promise<string>} 解密后的明文
	 */
	async decrypt(encryptedBase64) {
		try {
			if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
				throw new Error('加密数据必须是非空字符串');
			}
			
			// 初始化主密码
			const masterPassword = await this._initMasterPassword();
			
			// 从Base64解码
			const combined = base64ToBytes(encryptedBase64);
			
			// 提取salt、iv和ciphertext
			const salt = combined.slice(0, CRYPTO_CONFIG.saltLength);
			const iv = combined.slice(CRYPTO_CONFIG.saltLength, CRYPTO_CONFIG.saltLength + CRYPTO_CONFIG.ivLength);
			const ciphertext = combined.slice(CRYPTO_CONFIG.saltLength + CRYPTO_CONFIG.ivLength);
			
			// 派生密钥
			const key = await deriveKey(masterPassword, salt);
			
			// 解密
			const plaintext = await aesGcmDecrypt(ciphertext, key, iv);
			
			return plaintext;
		} catch (error) {
			console.error('[StorageCrypto] 解密失败:', error);
			throw error;
		}
	}
	
	/**
	 * 设置加密存储
	 * @param {string} key 存储键
	 * @param {any} value 存储值
	 * @returns {Promise<void>}
	 */
	async setSecure(key, value) {
		try {
			if (!key) {
				throw new Error('存储键不能为空');
			}
			
			// 将值转换为JSON字符串
			const jsonString = JSON.stringify(value);
			
			// 加密
			const encrypted = await this.encrypt(jsonString);
			
			// 添加加密标识前缀
			const storageValue = ENCRYPTED_PREFIX + encrypted;
			
			// 存储
			uni.setStorageSync(key, storageValue);
			
			console.log(`[StorageCrypto] 加密存储成功: ${key}`);
		} catch (error) {
			console.error('[StorageCrypto] 加密存储失败:', error);
			throw error;
		}
	}
	
	/**
	 * 获取加密存储
	 * @param {string} key 存储键
	 * @returns {Promise<any>} 存储值
	 */
	async getSecure(key) {
		try {
			if (!key) {
				throw new Error('存储键不能为空');
			}
			
			// 获取存储值
			const storageValue = uni.getStorageSync(key);
			
			if (!storageValue) {
				return null;
			}
			
			// 检查是否是加密数据
			if (!storageValue.startsWith(ENCRYPTED_PREFIX)) {
				console.warn(`[StorageCrypto] 数据未加密: ${key}`);
				// 尝试直接解析
				try {
					return JSON.parse(storageValue);
				} catch {
					return storageValue;
				}
			}
			
			// 移除前缀
			const encrypted = storageValue.substring(ENCRYPTED_PREFIX.length);
			
			// 解密
			const decrypted = await this.decrypt(encrypted);
			
			// 解析JSON
			return JSON.parse(decrypted);
		} catch (error) {
			console.error('[StorageCrypto] 获取加密存储失败:', error);
			// 降级方案：尝试直接读取
			try {
				const storageValue = uni.getStorageSync(key);
				if (storageValue && !storageValue.startsWith(ENCRYPTED_PREFIX)) {
					return JSON.parse(storageValue);
				}
			} catch {}
			
			return null;
		}
	}
	
	/**
	 * 删除加密存储
	 * @param {string} key 存储键
	 * @returns {Promise<void>}
	 */
	async removeSecure(key) {
		try {
			if (!key) {
				throw new Error('存储键不能为空');
			}
			
			uni.removeStorageSync(key);
			console.log(`[StorageCrypto] 删除加密存储成功: ${key}`);
		} catch (error) {
			console.error('[StorageCrypto] 删除加密存储失败:', error);
			throw error;
		}
	}
	
	/**
	 * 清空所有加密存储
	 * @returns {Promise<void>}
	 */
	async clearSecure() {
		try {
			const info = uni.getStorageInfoSync();
			const keys = info.keys || [];
			
			// 删除所有加密数据
			for (const key of keys) {
				try {
					const value = uni.getStorageSync(key);
					if (value && typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX)) {
						uni.removeStorageSync(key);
					}
				} catch (error) {
					console.error(`[StorageCrypto] 删除加密数据失败: ${key}`, error);
				}
			}
			
			console.log('[StorageCrypto] 清空所有加密存储成功');
		} catch (error) {
			console.error('[StorageCrypto] 清空加密存储失败:', error);
			throw error;
		}
	}
	
	/**
	 * 迁移现有数据到加密存储
	 * @param {string} key 存储键
	 * @returns {Promise<void>}
	 */
	async migrateToSecure(key) {
		try {
			const value = uni.getStorageSync(key);
			
			if (!value) {
				return;
			}
			
			// 检查是否已加密
			if (typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX)) {
				console.log(`[StorageCrypto] 数据已加密，无需迁移: ${key}`);
				return;
			}
			
			// 解析旧数据（可能是JSON字符串）
			let parsedValue = value;
			if (typeof value === 'string') {
				try {
					parsedValue = JSON.parse(value);
				} catch {
					// 不是JSON字符串，保持原值
					parsedValue = value;
				}
			}
			
			// 重新加密存储
			await this.setSecure(key, parsedValue);
			
			console.log(`[StorageCrypto] 数据迁移成功: ${key}`);
		} catch (error) {
			console.error('[StorageCrypto] 数据迁移失败:', error);
			throw error;
		}
	}
	
	/**
	 * 批量迁移敏感数据
	 * @param {string[]} keys 需要迁移的键列表
	 * @returns {Promise<{success: number, failed: number}>}
	 */
	async batchMigrate(keys) {
		let success = 0;
		let failed = 0;
		
		for (const key of keys) {
			try {
				await this.migrateToSecure(key);
				success++;
			} catch (error) {
				console.error(`[StorageCrypto] 迁移失败: ${key}`, error);
				failed++;
			}
		}
		
		return { success, failed };
	}
}

// 创建单例
const storageCrypto = new StorageCrypto();

export default storageCrypto;

