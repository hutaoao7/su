async function check(key, limitPerMinute, windowSeconds) {
  return { allowed: true };
}

module.exports = { check };