'use strict';
function headers(origin){
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type'
  };
}
exports.main = async (event) => {
  const h = (event && event.headers) || {};
  const origin = h.origin || h.Origin || '*';
  const method = (event.httpMethod || event.method || '').toUpperCase();
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: headers(origin), body: '' };
  }
  return { statusCode: 501, headers: headers(origin), body: JSON.stringify({ code:501, message:'此功能暂未上线' }) };
};