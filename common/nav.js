export function go(url){
  if(!url || typeof url!=='string') return
  try{
    const tab = new Set(['/pages/home/home','/pages/features/features','/pages/settings/settings','/pages/user/home'])
    tab.has(url) ? uni.switchTab({ url }) : uni.navigateTo({ url })
  }catch(e){ uni.reLaunch({ url }) }
}
export function currentRoute(){
  const ps=getCurrentPages(); if(!ps.length) return '/pages/home/home'
  const c=ps[ps.length-1]; const q=c.options?Object.keys(c.options).map(k=>`${k}=${c.options[k]}`).join('&'):''
  return '/'+c.route+(q?('?'+q):'')
}