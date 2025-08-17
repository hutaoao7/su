'use strict';

// 与 common 模块的“默认导出”对齐
const v = require('../../common/validator')
const jwtUtil = require('../../common/jwt')
const resp = require('../../common/response')
const rate = require('../../common/rateLimit')
const bcrypt = require('bcryptjs')

function parseBody(e){
  try{ return typeof e.body === 'string' ? JSON.parse(e.body || '{}') : (e.body || {}) }catch(_){ return {} }
}
function origin(e){ return (e.headers && (e.headers.origin || e.headers.Origin)) || '*' }

exports.main = async (event, context) => {
  const o = origin(event)
  const start = Date.now()
  const timeout = () => { if (Date.now() - start > 2000) throw new Error('TIMEOUT') }

  try {
    // 统一从 body 取参
    const { account, password, role, nickname } = parseBody(event)
    timeout()

    // 参数校验（根据你的 validator 实现微调）
    v.assert(v.isAccount ? v.isAccount(account) : !!account, '账号不合法')
    v.assert(v.isPassword ? v.isPassword(password) : !!password, '密码不合法')
    v.assert(v.isRole ? v.isRole(role) : (role==='teen'||role==='parent'||role==='org'), '角色不合法')
    timeout()

    // 简易限流（rateLimit 可先返回 true 的占位）
    const ip = (context && (context.CLIENTIP || context.CLIENT_IP)) || 'unknown'
    const ok = await (rate.check ? rate.check(`register:${ip}:${account}`, 10, 60) : true)
    if (ok && ok.allowed === false) return resp.err(429, '请求过于频繁', o)
    timeout()

    // 使用 uniCloud 原生数据库
    const db = uniCloud.database()
    const users = db.collection('users')

    // 查重
    const existed = await users.where({ account }).get()
    if (existed && existed.data && existed.data.length > 0) {
      return resp.err(409, '账号已存在', o)
    }
    timeout()

    // 哈希密码
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10)
    const passwordHash = await bcrypt.hash(password, saltRounds)
    timeout()

    // 入库
    const now = Date.now()
    const doc = {
      account,
      password_hash: passwordHash,
      role,
      nickname: nickname || account,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      loginFailCount: 0
    }
    const addRes = await users.add(doc)
    timeout()

    // 签发 token
    const token = jwtUtil.sign({ uid: addRes.id, role })
    return resp.ok({ token, user: { id: addRes.id, nickname: doc.nickname, role } }, o)

  } catch (e) {
    if (e && e.message === 'TIMEOUT') return resp.err(504, '服务器繁忙', o)
    return resp.err(500, e && e.message ? e.message : '服务器繁忙', o)
  }
}
