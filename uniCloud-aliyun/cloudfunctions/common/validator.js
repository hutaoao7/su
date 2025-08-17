function isAccount(str) {
  if (typeof str !== 'string') return false;
  return str.length >= 6 && str.length <= 32;
}

function isPassword(str) {
  if (typeof str !== 'string') return false;
  if (str.length < 8 || str.length > 32) return false;
  return /[a-zA-Z]/.test(str) && /[0-9]/.test(str);
}

function isRole(str) {
  return ['teen', 'parent', 'org'].includes(str);
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg || '参数不合法');
  }
}

module.exports = { isAccount, isPassword, isRole, assert };