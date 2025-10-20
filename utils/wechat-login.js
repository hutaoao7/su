// 导入错误处理器
import { handleLoginError, checkNetworkStatus } from './login-error-handler.js';

// 微信登录工具函数
export const wechatLogin = async () => {
  return new Promise((resolve, reject) => {
    console.log('[WX_LOGIN] starting uni.login');
    
    // 检查网络状态
    checkNetworkStatus().then(networkStatus => {
      if (!networkStatus.isConnected) {
        console.error('[WX_LOGIN] 网络未连接');
        const errorInfo = handleLoginError({ code: 'NETWORK_ERROR' });
        uni.showToast({ 
          title: errorInfo.userMessage, 
          icon: 'none',
          duration: 3000
        });
        reject(new Error('NETWORK_ERROR'));
        return;
      }
      
      console.log('[WX_LOGIN] 网络正常，继续登录');
      performLogin();
    });
    
    function performLogin() {
      // 每次都获取新的 code
      uni.login({
        success: ({ code }) => {
          if (!code) {
            console.error('[WX_LOGIN] uni.login success but no code received');
            const errorInfo = handleLoginError({ code: 'NO_CODE' });
            uni.showToast({ 
              title: errorInfo.userMessage, 
              icon: 'none',
              duration: 3000
            });
            reject(new Error('未获取到code'));
            return;
          }
        
          console.log('[WX_LOGIN] got uni.login code:', code.substring(0, 8) + '...');
          
          // 调用云函数
          console.log('[WX_LOGIN] calling auth-login cloud function');
          uniCloud.callFunction({
            name: 'auth-login',
            data: { code },
            timeout: 6000 // 6秒超时
          }).then(({ result }) => {
            console.log('[WX_LOGIN] auth-login raw result:', result);
            
            // 严格判断：errCode必须为数字0，且data存在
            const r = result || {};
            const ok = (r && Number(r.errCode) === 0 && r.data && Object.keys(r.data).length > 0);
            
            if (ok) {
              console.log('[WX_LOGIN] login success, saving tokens');
              const loginData = r.data;
              
              // 登录成功，保存token - 兼容多种数据结构
              const token = loginData.token || (loginData.tokenInfo && loginData.tokenInfo.token);
              const uid = loginData.uid || (loginData.userInfo && loginData.userInfo.uid);
              
              try {
                uni.setStorageSync('uni_id_token', token);
                console.log('[WX_LOGIN] set uni_id_token ok');
              } catch (e) {
                console.error('[WX_LOGIN] set uni_id_token fail:', e);
              }
              
              try {
                const tokenExpired = loginData.tokenExpired || 
                                    loginData.tokenInfo?.tokenExpired || 
                                    (Date.now() + 7 * 24 * 3600 * 1000);
                uni.setStorageSync('uni_id_token_expired', tokenExpired);
                console.log('[WX_LOGIN] set uni_id_token_expired ok');
              } catch (e) {
                console.error('[WX_LOGIN] set uni_id_token_expired fail:', e);
              }
              
              try {
                uni.setStorageSync('uni_id_uid', uid);
                console.log('[WX_LOGIN] set uni_id_uid ok');
              } catch (e) {
                console.error('[WX_LOGIN] set uni_id_uid fail:', e);
              }
              
              try {
                uni.setStorageSync('user_info', loginData.userInfo || loginData);
                console.log('[WX_LOGIN] set user_info ok');
              } catch (e) {
                console.error('[WX_LOGIN] set user_info fail:', e);
              }
              
              // 验证本地存储是否成功
              console.log('[WX_LOGIN] verify storage keys:');
              const savedToken = uni.getStorageSync('uni_id_token');
              const savedExpired = uni.getStorageSync('uni_id_token_expired');
              const savedUserInfo = uni.getStorageSync('user_info');
              
              console.log('[WX_LOGIN] - uni_id_token:', savedToken ? 'exists' : 'missing');
              console.log('[WX_LOGIN] - uni_id_token_expired:', savedExpired ? 'exists' : 'missing');
              console.log('[WX_LOGIN] - user_info:', savedUserInfo ? 'exists' : 'missing');
              
              // 设置uniCloud全局token
              try {
                uniCloud.setToken(token);
                console.log('[WX_LOGIN] uniCloud.setToken ok');
              } catch (e) {
                console.warn('[WX_LOGIN] uniCloud.setToken fail:', e);
              }
              
              uni.showToast({ title: '登录成功' });
              resolve(loginData);
            } else {
              // 登录失败 - errCode !== 0 或缺少 data
              const errorInfo = handleLoginError({ 
                errCode: r.errCode, 
                errMsg: r.errMsg 
              });
              console.error('[WX_LOGIN] login failed:', errorInfo.message);
              uni.showToast({ 
                title: errorInfo.userMessage, 
                icon: 'none',
                duration: 3000
              });
              reject(errorInfo);
            }
          }).catch(err => {
            console.error('[WX_LOGIN] cloud function call error:', err);
            const errorInfo = handleLoginError(err);
            uni.showToast({ 
              title: errorInfo.userMessage, 
              icon: 'none',
              duration: 3000
            });
            reject(err);
          });
        },
        fail: (err) => {
          console.error('[WX_LOGIN] uni.login fail:', err);
          const errorInfo = handleLoginError(err);
          uni.showToast({ 
            title: errorInfo.userMessage || '微信授权失败，请重试', 
            icon: 'none',
            duration: 3000
          });
          reject(err);
        }
      });
    }
  });
};

// 导出带重试能力的版本（可选）
import { withRetry } from './login-error-handler.js';
export const wechatLoginWithRetry = withRetry(wechatLogin, {
  maxRetries: 1,
  delay: 1000,
});

// 检查登录状态
export const checkLoginStatus = () => {
  console.log('[WX_LOGIN] checking login status');
  
  const token = uni.getStorageSync('uni_id_token');
  const expired = uni.getStorageSync('uni_id_token_expired');
  
  console.log('[WX_LOGIN] storage check - token:', token ? 'exists' : 'missing');
  console.log('[WX_LOGIN] storage check - expired:', expired ? 'exists' : 'missing');
  
  if (!token || !expired) {
    console.log('[WX_LOGIN] login status: not logged in (missing token or expired)');
    return false;
  }
  
  // 检查是否过期
  const now = Date.now();
  if (now >= expired) {
    console.log('[WX_LOGIN] token expired, clearing storage');
    // token已过期，清除本地存储
    uni.removeStorageSync('uni_id_token');
    uni.removeStorageSync('uni_id_token_expired');
    uni.removeStorageSync('user_info');
    console.log('[WX_LOGIN] login status: not logged in (token expired)');
    return false;
  }
  
  console.log('[WX_LOGIN] login status: logged in (token valid)');
  return true;
};