/**
 * 同意协议内容处理工具
 * 功能：搜索、高亮、导出
 */

/**
 * 重点条款关键词配置
 */
export const HIGHLIGHT_KEYWORDS = {
  // 隐私相关
  privacy: ['个人信息', '隐私保护', '数据加密', '信息收集', '第三方', '敏感数据'],
  // 责任相关
  liability: ['免责', '责任限制', '不承担责任', '风险提示', '法律责任'],
  // 权利相关
  rights: ['您的权利', '访问权', '删除权', '撤回同意', '数据导出'],
  // 重要提示
  important: ['重要', '注意', '必须', '禁止', '紧急']
};

/**
 * 搜索协议内容
 * @param {String} content - 协议内容
 * @param {String} keyword - 搜索关键词
 * @returns {Object} { matches: Array, count: Number }
 */
export function searchContent(content, keyword) {
  if (!keyword || !content) {
    return { matches: [], count: 0 };
  }
  
  const matches = [];
  const regex = new RegExp(escapeRegex(keyword), 'gi');
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      keyword: match[0],
      context: getContext(content, match.index, 50)
    });
  }
  
  return {
    matches,
    count: matches.length
  };
}

/**
 * 高亮文本内容
 * @param {String} content - 原始内容
 * @param {String} searchKeyword - 搜索关键词（可选）
 * @param {Boolean} highlightImportant - 是否高亮重要条款
 * @returns {String} HTML格式的高亮内容
 */
export function highlightContent(content, searchKeyword = '', highlightImportant = true) {
  if (!content) return '';
  
  let result = escapeHtml(content);
  
  // 1. 高亮重要条款（优先级低）
  if (highlightImportant) {
    // 组合所有重点关键词
    const allKeywords = Object.values(HIGHLIGHT_KEYWORDS).flat();
    
    allKeywords.forEach(keyword => {
      const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
      result = result.replace(regex, '<span class="highlight-important">$1</span>');
    });
  }
  
  // 2. 高亮搜索关键词（优先级高，覆盖重要条款高亮）
  if (searchKeyword) {
    const regex = new RegExp(`(${escapeRegex(searchKeyword)})`, 'gi');
    // 先移除可能存在的重点高亮标签
    result = result.replace(/<span class="highlight-important">(.*?)<\/span>/g, '$1');
    // 然后添加搜索高亮
    result = result.replace(regex, '<span class="highlight-search">$1</span>');
  }
  
  // 3. 保留换行符
  result = result.replace(/\n/g, '<br/>');
  
  return result;
}

/**
 * 导出协议为PDF（H5端）
 * @param {String} title - 文档标题
 * @param {String} content - 协议内容
 * @param {Object} options - 导出选项
 */
export async function exportToPDF(title, content, options = {}) {
  // #ifdef H5
  try {
    // 动态加载库（假设已通过CDN或打包引入）
    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
      throw new Error('PDF导出功能需要html2canvas和jspdf库');
    }
    
    // 创建临时DOM
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 800px;
      padding: 40px;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;
    
    tempDiv.innerHTML = `
      <h1 style="font-size: 28px; margin-bottom: 20px; color: #333;">${title}</h1>
      <div style="font-size: 14px; line-height: 1.8; color: #666;">
        ${content.replace(/\n/g, '<br/>')}
      </div>
    `;
    
    document.body.appendChild(tempDiv);
    
    // 转换为Canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // 移除临时DOM
    document.body.removeChild(tempDiv);
    
    // 创建PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4宽度
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // 下载PDF
    const fileName = `${title}_${new Date().getTime()}.pdf`;
    pdf.save(fileName);
    
    return { success: true, fileName };
    
  } catch (error) {
    console.error('[PDF导出] 失败:', error);
    return { success: false, error: error.message };
  }
  // #endif
  
  // #ifndef H5
  return { 
    success: false, 
    error: '小程序暂不支持PDF导出，请使用截图分享功能' 
  };
  // #endif
}

/**
 * 生成分享截图（小程序端替代方案）
 * @param {String} selector - 页面选择器
 */
export async function generateShareImage(selector = '.content') {
  try {
    // 创建Canvas绘图上下文
    const query = uni.createSelectorQuery();
    
    return new Promise((resolve, reject) => {
      query.select(selector).boundingClientRect(rect => {
        if (!rect) {
          reject(new Error('未找到目标元素'));
          return;
        }
        
        // 使用Canvas API绘制
        const ctx = uni.createCanvasContext('shareCanvas');
        
        // 这里需要根据实际内容绘制
        // 小程序端建议使用海报生成库或截图API
        
        uni.showToast({
          title: '请长按截图分享',
          icon: 'none'
        });
        
        resolve({ success: true });
      }).exec();
    });
    
  } catch (error) {
    console.error('[生成分享图] 失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 获取上下文文本
 * @param {String} content - 完整内容
 * @param {Number} index - 匹配位置
 * @param {Number} length - 上下文长度
 * @returns {String}
 */
function getContext(content, index, length = 50) {
  const start = Math.max(0, index - length);
  const end = Math.min(content.length, index + length);
  
  let context = content.substring(start, end);
  
  if (start > 0) context = '...' + context;
  if (end < content.length) context = context + '...';
  
  return context;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 转义HTML特殊字符
 */
function escapeHtml(str) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, match => htmlEscapes[match]);
}

/**
 * 获取完整协议内容（用于导出）
 */
export function getFullAgreementContent(type) {
  const agreements = {
    privacy: `翎心隐私政策

生效日期：2025年10月12日 | 版本：v1.0.0

一、信息收集
我们收集以下信息：
1. 账号信息：微信OpenID、昵称、头像
2. 评估数据：问卷答案、评估结果
3. 使用数据：页面访问、功能使用记录
4. 交互数据：AI对话摘要（不保存完整对话内容）

二、信息使用
您的信息将用于：
1. 提供核心功能服务
2. 改进产品和服务质量
3. 个性化推荐和内容定制
4. 安全保障和风险防范
5. 客户服务和技术支持

三、信息保护
我们采取以下措施保护您的信息：
1. HTTPS传输加密
2. 数据存储加密（AES-256）
3. 严格的访问控制机制
4. 定期安全审计和漏洞扫描
5. 员工保密协议

四、您的权利
您享有以下权利：
1. 访问权：查看我们持有的您的个人信息
2. 更正权：更正不准确或不完整的信息
3. 删除权：要求删除您的个人信息
4. 撤回同意权：随时撤回对信息处理的同意
5. 数据导出权：以结构化格式导出您的数据

五、第三方服务
我们可能使用以下第三方服务：
1. 微信小程序SDK（用户认证）
2. uniCloud云服务（数据存储）
3. OpenAI API（AI对话功能）

第三方服务提供商已签署数据处理协议，承诺保护您的信息安全。

六、未成年人保护
如果您是未成年人（18岁以下），请在监护人同意和指导下使用本应用。

七、政策更新
我们可能会不定期更新本隐私政策。重大变更时，我们会通过应用内通知的方式告知您。

八、联系我们
如有任何疑问或建议，请通过以下方式联系我们：
- 应用内反馈功能
- 邮箱：privacy@craneheart.com

最后更新时间：2025年10月12日`,

    user: `翎心用户协议

生效日期：2025年10月12日 | 版本：v1.0.0

一、服务说明
翎心是一款心理健康辅助应用，提供心理评估、AI对话、放松音乐等功能。

二、用户责任
使用本应用时，您应当：
1. 提供真实、准确的个人信息
2. 不得利用本应用从事违法活动
3. 不得发布违规、有害信息
4. 遵守社区规范和用户公约
5. 保护好您的账号安全

三、服务限制
以下情况可能导致服务受限：
1. 违反用户协议
2. 发布不当内容
3. 恶意攻击系统
4. 其他损害他人权益的行为

四、知识产权
本应用的所有内容（包括但不限于文字、图片、软件、音频）均受知识产权法保护。未经授权，不得复制、修改、传播。

五、免责声明
请参阅《免责声明》文档。

六、协议终止
您可以随时停止使用本应用并注销账号。我们也保留在必要时终止服务的权利。

七、争议解决
因本协议产生的争议，双方应友好协商解决。协商不成的，提交有管辖权的人民法院诉讼解决。

八、其他条款
本协议的解释、效力及纠纷解决，适用中华人民共和国法律。

最后更新时间：2025年10月12日`,

    disclaimer: `翎心免责声明

一、评估结果说明
本应用提供的心理健康评估结果：
1. 仅供参考和初步筛查使用
2. 不能替代专业医疗诊断
3. 不构成医疗建议或治疗方案
4. 评估结果可能因个人差异而有所偏差

二、AI对话说明
AI对话功能：
1. 基于人工智能技术，可能存在理解偏差
2. 提供的建议仅供参考
3. 不能替代专业心理咨询
4. 紧急情况请立即寻求专业帮助

三、专业建议
如果您在心理健康方面遇到困扰，我们建议：
1. 寻求专业心理咨询师或精神科医生帮助
2. 联系当地心理健康服务机构
3. 与信任的朋友、家人交流
4. 拨打心理援助热线

四、紧急求助
如果您有自伤或伤害他人的想法，请立即：
1. 拨打心理危机干预热线：400-161-9995
2. 拨打急救电话：120
3. 前往最近的医院急诊科
4. 联系您的心理治疗师或精神科医生

五、责任限制
在法律允许的最大范围内：
1. 我们不对评估结果的准确性做出保证
2. 不对因使用本应用产生的任何直接或间接损失承担责任
3. 不对第三方服务的可用性和质量负责
4. 不对因不可抗力导致的服务中断负责

六、数据安全
虽然我们采取合理措施保护您的数据，但无法保证绝对安全。建议您：
1. 定期更改密码
2. 不在公共设备上使用
3. 及时退出登录
4. 定期导出备份重要数据

七、内容准确性
本应用提供的信息可能存在以下情况：
1. 内容可能过时或不准确
2. 可能包含技术或编辑错误
3. 我们会尽力保持内容更新，但不做保证

八、第三方链接
本应用可能包含第三方网站链接，我们不对第三方网站的内容和服务负责。

九、法律适用
本声明的解释、效力及纠纷解决，适用中华人民共和国法律。

十、声明更新
我们保留随时修改本声明的权利。重大变更会提前通知用户。

最后更新时间：2025年10月12日

全国心理援助热线：
- 24小时心理援助热线：400-161-9995
- 北京心理危机干预中心：010-82951332
- 希望24热线：400-161-9995

温馨提示：生命宝贵，请珍惜自己，积极寻求帮助！`
  };
  
  return agreements[type] || '';
}

