/**
 * 心理评估量表计分模块
 * 支持各种标准化心理量表的计分逻辑
 */

/**
 * 通用Likert量表求和函数（支持反向计分）
 * @param {Object} params - 参数对象
 * @param {Array} params.answers - 答案数组
 * @param {Array} params.reverseIndex - 反向计分题目索引（从0开始）
 * @param {Array} params.scale - 量表分值范围，如[0,1,2,3,4]
 * @returns {number} 总分
 */
function sumLikert({ answers, reverseIndex = [], scale = [0, 1, 2, 3, 4] }) {
  const maxScore = Math.max(...scale)
  const minScore = Math.min(...scale)
  
  return answers.reduce((sum, answer, index) => {
    let score = answer
    
    // 反向计分：最大值变最小值，最小值变最大值
    if (reverseIndex.includes(index)) {
      score = maxScore + minScore - answer
    }
    
    return sum + score
  }, 0)
}

/**
 * PSS-10 知觉压力量表计分
 * @param {Array} answers - 答案数组（0-4分）
 * @returns {Object} 计分结果
 */
function scorePSS10(answers) {
  // PSS-10 反向计分题目：第4、5、7、8题（索引3、4、6、7）
  const reverseIndex = [3, 4, 6, 7]
  const total = sumLikert({ 
    answers, 
    reverseIndex, 
    scale: [0, 1, 2, 3, 4] 
  })
  
  // 分层标准
  let band = '低压力'
  if (total >= 27) {
    band = '高压力'
  } else if (total >= 14) {
    band = '中等压力'
  }
  
  // 建议内容
  let suggestions = ''
  if (total >= 27) {
    suggestions = '您目前感受到较高的压力水平，建议寻求专业心理咨询师的帮助，学习有效的压力管理技巧。'
  } else if (total >= 14) {
    suggestions = '您目前有一定的压力感受，建议通过运动、冥想、社交支持等方式来缓解压力。'
  } else {
    suggestions = '您目前的压力水平较低，请继续保持良好的生活状态和心理健康习惯。'
  }
  
  return {
    total,
    band,
    suggestions
  }
}

/**
 * Mini-SPIN 社交焦虑快筛计分
 * @param {Array} answers - 答案数组（0-4分）
 * @returns {Object} 计分结果
 */
function scoreMiniSPIN(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  const isPositive = total >= 6
  
  let suggestions = ''
  if (isPositive) {
    suggestions = '快筛结果提示可能存在社交焦虑，建议进行更详细的评估以获得准确结果。'
  } else {
    suggestions = '快筛结果显示社交焦虑程度较低，但如有相关困扰仍建议关注心理健康。'
  }
  
  return {
    total,
    isPositive,
    threshold: 6,
    suggestions
  }
}

/**
 * SPIN-17 社交恐惧症量表计分
 * @param {Array} answers - 答案数组（0-4分）
 * @returns {Object} 计分结果
 */
function scoreSPIN17(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  
  // 经验分层（非官方诊断标准）
  let band = '低风险'
  if (total >= 29) {
    band = '较高风险'
  } else if (total >= 19) {
    band = '轻-中度风险'
  }
  
  let suggestions = ''
  if (total >= 29) {
    suggestions = '评估结果提示较高的社交焦虑水平，强烈建议寻求专业心理健康服务。注意：这是经验分层，非正式诊断。'
  } else if (total >= 19) {
    suggestions = '评估结果提示轻到中度的社交焦虑，建议关注并考虑寻求专业指导。注意：这是经验分层，非正式诊断。'
  } else {
    suggestions = '评估结果显示社交焦虑程度相对较低，请继续保持良好的社交心理状态。'
  }
  
  return {
    total,
    band,
    suggestions
  }
}

/**
 * ESSA-16 学业压力量表计分
 * @param {Array} answers - 答案数组（1-5分）
 * @returns {Object} 计分结果
 */
function scoreESSA16(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  
  // 维度计分（根据题目分组）
  const dimensions = {
    load: { name: '作业/任务负荷', items: [0, 4, 8], score: 0 },
    score: { name: '成绩/考试担忧', items: [1, 5, 9], score: 0 },
    expect: { name: '自我/他人期望', items: [2, 6, 10], score: 0 },
    mood: { name: '情绪低落/紧张', items: [3, 7, 11], score: 0 },
    other: { name: '其他压力源', items: [12, 13, 14, 15], score: 0 }
  }
  
  // 计算各维度得分
  Object.keys(dimensions).forEach(key => {
    const dim = dimensions[key]
    dim.score = dim.items.reduce((sum, itemIndex) => sum + answers[itemIndex], 0)
  })
  
  // 四分位分层（经验值，总分范围16-80）
  let band = '低压力'
  if (total >= 60) {
    band = '高压力'
  } else if (total >= 45) {
    band = '中高压力'
  } else if (total >= 30) {
    band = '中等压力'
  }
  
  let suggestions = ''
  if (total >= 60) {
    suggestions = '您的学业压力水平较高，建议调整学习方法，寻求学业指导，必要时寻求心理支持。'
  } else if (total >= 45) {
    suggestions = '您有一定的学业压力，建议合理安排时间，适当放松，保持学习与生活的平衡。'
  } else if (total >= 30) {
    suggestions = '您的学业压力处于中等水平，注意及时调节，保持积极的学习心态。'
  } else {
    suggestions = '您的学业压力水平较低，请继续保持良好的学习状态和心理健康。'
  }
  
  return {
    total,
    band,
    byDimension: dimensions,
    suggestions
  }
}

/**
 * PSQI-19 匹兹堡睡眠质量指数计分
 * @param {Object} payload - 包含各项睡眠数据的对象
 * @returns {Object} 计分结果
 */
function scorePSQI19(payload) {
  // 解析时间字符串为小时数
  function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours + minutes / 60
  }
  
  // 计算在床时间
  function calculateTimeInBed(bedtime, waketime) {
    const bedHour = parseTime(bedtime)
    const wakeHour = parseTime(waketime)
    
    // 处理跨日情况
    if (wakeHour < bedHour) {
      return (24 - bedHour) + wakeHour
    }
    return wakeHour - bedHour
  }
  
  // 组件1：主观睡眠质量（0-3）
  const c1 = payload.subjective_quality || 0
  
  // 组件2：入睡潜伏期
  const latencyMin = payload.sleep_latency_min || 0
  const latencyFreq = payload.latency_freq || 0
  let c2 = 0
  
  // 入睡时间评分
  if (latencyMin <= 15) c2 += 0
  else if (latencyMin <= 30) c2 += 1
  else if (latencyMin <= 60) c2 += 2
  else c2 += 3
  
  // 入睡困难频次评分
  c2 += latencyFreq
  if (c2 > 3) c2 = 3
  
  // 组件3：睡眠时间（0-3）
  const sleepDuration = payload.sleep_duration_h || 0
  let c3 = 0
  if (sleepDuration >= 7) c3 = 0
  else if (sleepDuration >= 6) c3 = 1
  else if (sleepDuration >= 5) c3 = 2
  else c3 = 3
  
  // 组件4：习惯性睡眠效率（0-3）
  const bedtime = payload.bedtime || '23:00'
  const waketime = payload.waketime || '07:00'
  const timeInBed = calculateTimeInBed(bedtime, waketime)
  const efficiency = timeInBed > 0 ? (sleepDuration / timeInBed) * 100 : 0
  
  let c4 = 0
  if (efficiency >= 85) c4 = 0
  else if (efficiency >= 75) c4 = 1
  else if (efficiency >= 65) c4 = 2
  else c4 = 3
  
  // 组件5：睡眠干扰（0-3）
  const disturbanceSum = payload.disturbances_sum || 0
  let c5 = 0
  if (disturbanceSum === 0) c5 = 0
  else if (disturbanceSum <= 9) c5 = 1
  else if (disturbanceSum <= 18) c5 = 2
  else c5 = 3
  
  // 组件6：助眠药物使用（0-3）
  const c6 = payload.medication_use || 0
  
  // 组件7：日间功能障碍（0-3）
  const daytimeDysfunction = payload.daytime_dysfunction || 0
  let c7 = 0
  if (daytimeDysfunction === 0) c7 = 0
  else if (daytimeDysfunction <= 2) c7 = 1
  else if (daytimeDysfunction <= 4) c7 = 2
  else c7 = 3
  
  // 总分计算
  const total = c1 + c2 + c3 + c4 + c5 + c6 + c7
  
  // 分层
  let band = '良好'
  if (total > 5) {
    band = '可疑/需关注'
  }
  
  let suggestions = ''
  if (total > 5) {
    suggestions = '您的睡眠质量可能存在问题，建议改善睡眠环境和习惯，必要时咨询睡眠专科医生。'
  } else {
    suggestions = '您的睡眠质量总体良好，请继续保持规律的作息和良好的睡眠习惯。'
  }
  
  return {
    total,
    band,
    components: {
      c1_subjective: c1,
      c2_latency: c2,
      c3_duration: c3,
      c4_efficiency: c4,
      c5_disturbance: c5,
      c6_medication: c6,
      c7_daytime: c7
    },
    suggestions
  }
}

/**
 * 统一评分接口
 * @param {string} scaleId - 量表ID
 * @param {Array} answers - 答案数组
 * @param {Object} meta - 可选元数据
 * @returns {Object} 统一格式的评分结果
 */
function scoreUnified(scaleId, answers, meta = {}) {
  switch (scaleId) {
    case 'pss10':
      return scorePSS10(answers)
    case 'phq9':
      return scorePHQ9(answers)
    case 'gad7':
      return scoreGAD7(answers)
    case 'who5':
      return scoreWHO5(answers)
    case 'k6':
      return scoreK6(answers)
    case 'k10':
      return scoreK10(answers)
    case 'asq4':
      return scoreASQ4(answers)
    case 'youth_social_anxiety_6':
      return scoreYouthSocialAnxiety6(answers)
    case 'academic_stress_8':
      return scoreAcademicStress8(answers)
    case 'sleep_health_6':
      return scoreSleepHealth6(answers)
    // 保持向后兼容
    case 'mini_spin3':
      return scoreMiniSPIN(answers)
    case 'spin17':
      return scoreSPIN17(answers)
    case 'essa16':
      return scoreESSA16(answers)
    case 'psqi19':
      return scorePSQI19(answers)
    default:
      throw new Error(`Unknown scale ID: ${scaleId}`)
  }
}

/**
 * PHQ-9 抑郁自评量表计分
 * @param {Array} answers - 答案数组（0-3分）
 * @returns {Object} 计分结果
 */
function scorePHQ9(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  
  let band = '最轻/无'
  if (total >= 20) band = '重度'
  else if (total >= 15) band = '中重度'
  else if (total >= 10) band = '中度'
  else if (total >= 5) band = '轻度'
  
  let suggestions = ''
  let alerts = []
  let followups = []
  
  // 第9题（自伤想法）检查
  if (answers[8] > 0) {
    alerts.push('检测到自伤想法，建议立即寻求专业帮助')
    followups.push('asq4')
  }
  
  if (total >= 15) {
    suggestions = '评估结果提示中重度以上抑郁症状，强烈建议寻求专业心理健康服务。'
  } else if (total >= 10) {
    suggestions = '评估结果提示中度抑郁症状，建议寻求专业心理咨询。'
  } else if (total >= 5) {
    suggestions = '评估结果提示轻度抑郁症状，建议关注心理健康状态。'
  } else {
    suggestions = '评估结果显示抑郁症状较轻，请继续保持良好的心理状态。'
  }
  
  return {
    total,
    band,
    band_label: band,
    alerts,
    followups,
    suggestions
  }
}

/**
 * GAD-7 广泛性焦虑量表计分
 * @param {Array} answers - 答案数组（0-3分）
 * @returns {Object} 计分结果
 */
function scoreGAD7(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  
  let band = '正常'
  if (total >= 15) band = '重度'
  else if (total >= 10) band = '中度'
  else if (total >= 5) band = '轻度'
  
  let suggestions = ''
  let followups = []
  
  if (total >= 10) {
    followups.push('建议进一步评估：PHQ-9/WHO-5')
  }
  
  if (total >= 15) {
    suggestions = '评估结果提示重度焦虑症状，强烈建议寻求专业心理健康服务。'
  } else if (total >= 10) {
    suggestions = '评估结果提示中度焦虑症状，建议寻求专业心理咨询。'
  } else if (total >= 5) {
    suggestions = '评估结果提示轻度焦虑症状，建议关注心理健康状态。'
  } else {
    suggestions = '评估结果显示焦虑症状较轻，请继续保持良好的心理状态。'
  }
  
  return {
    total,
    band,
    band_label: band,
    followups,
    suggestions
  }
}

/**
 * WHO-5 幸福感指数计分
 * @param {Array} answers - 答案数组（0-5分）
 * @returns {Object} 计分结果
 */
function scoreWHO5(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  const transformed = total * 4 // 转换为0-100分
  
  let alerts = []
  if (transformed <= 50) {
    alerts.push('建议进一步评估')
  }
  
  let suggestions = ''
  if (transformed <= 50) {
    suggestions = '您的幸福感指数较低，建议关注心理健康状态，必要时寻求专业帮助。'
  } else {
    suggestions = '您的幸福感指数良好，请继续保持积极的生活态度。'
  }
  
  return {
    total,
    transformed_score: transformed,
    transform_note: '×4→0–100',
    alerts,
    suggestions
  }
}

/**
 * K6 心理痛苦量表计分
 * @param {Array} answers - 答案数组（0-4分）
 * @returns {Object} 计分结果
 */
function scoreK6(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  
  let alerts = []
  if (total >= 13) {
    alerts.push('≥13 常作为严重心理痛苦的参考阈值')
  }
  
  let suggestions = ''
  if (total >= 13) {
    suggestions = '评估结果提示严重心理痛苦，建议寻求专业心理健康服务。'
  } else {
    suggestions = '评估结果显示心理痛苦程度相对较低，请继续关注心理健康。'
  }
  
  return {
    total,
    alerts,
    suggestions
  }
}

/**
 * K10 心理痛苦量表计分
 * @param {Array} answers - 答案数组（0-4分）
 * @returns {Object} 计分结果
 */
function scoreK10(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  
  let band = '可能无明显困扰'
  if (total >= 30) band = '重度'
  else if (total >= 22) band = '中度'
  else if (total >= 16) band = '轻度'
  
  let suggestions = ''
  if (total >= 30) {
    suggestions = '评估结果提示重度心理痛苦，强烈建议寻求专业心理健康服务。'
  } else if (total >= 22) {
    suggestions = '评估结果提示中度心理痛苦，建议寻求专业心理咨询。'
  } else if (total >= 16) {
    suggestions = '评估结果提示轻度心理痛苦，建议关注心理健康状态。'
  } else {
    suggestions = '评估结果显示可能无明显心理困扰，请继续保持良好状态。'
  }
  
  return {
    total,
    band,
    band_label: band,
    suggestions
  }
}

/**
 * ASQ-4 自杀风险筛查计分
 * @param {Array} answers - 答案数组（0-1分）
 * @returns {Object} 计分结果
 */
function scoreASQ4(answers) {
  const hasPositive = answers.some(answer => answer === 1)
  
  let alerts = []
  if (hasPositive) {
    alerts.push('立即启动安全流程与紧急求助指引')
  }
  
  let suggestions = ''
  if (hasPositive) {
    suggestions = '检测到自杀风险，请立即寻求专业帮助或拨打心理危机干预热线：400-161-9995'
  } else {
    suggestions = '未检测到明显自杀风险，但如有相关困扰请及时寻求帮助。'
  }
  
  return {
    total: answers.reduce((sum, answer) => sum + answer, 0),
    isPositive: hasPositive,
    alerts,
    suggestions
  }
}

/**
 * 青少年社交焦虑简表计分
 * @param {Array} answers - 答案数组（0-4分）
 * @returns {Object} 计分结果
 */
function scoreYouthSocialAnxiety6(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  
  let alerts = []
  let followups = []
  
  if (total >= 16) {
    alerts.push('建议尽快寻求专业支持')
    followups.push('建议专业咨询')
  } else if (total >= 12) {
    alerts.push('建议进一步评估')
  }
  
  let suggestions = ''
  if (total >= 16) {
    suggestions = '评估结果提示较高的社交焦虑水平，建议尽快寻求专业心理健康服务。'
  } else if (total >= 12) {
    suggestions = '评估结果提示一定程度的社交焦虑，建议进一步评估和关注。'
  } else {
    suggestions = '评估结果显示社交焦虑程度相对较低，请继续保持良好的社交心理状态。'
  }
  
  return {
    total,
    alerts,
    followups,
    suggestions
  }
}

/**
 * 学业压力简表计分
 * @param {Array} answers - 答案数组（0-4分）
 * @returns {Object} 计分结果
 */
function scoreAcademicStress8(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  
  let alerts = []
  let followups = []
  
  if (total >= 18) {
    alerts.push('建议与老师/家长沟通并尝试干预')
  } else if (total >= 14) {
    alerts.push('建议进一步评估')
  }
  
  let suggestions = ''
  if (total >= 18) {
    suggestions = '评估结果提示较高的学业压力水平，建议与老师或家长沟通，寻求学业指导和心理支持。'
  } else if (total >= 14) {
    suggestions = '评估结果提示一定程度的学业压力，建议调整学习方法，适当放松。'
  } else {
    suggestions = '评估结果显示学业压力程度相对较低，请继续保持良好的学习状态。'
  }
  
  return {
    total,
    alerts,
    followups,
    suggestions
  }
}

/**
 * 睡眠健康简表计分
 * @param {Array} answers - 答案数组（0-4分）
 * @returns {Object} 计分结果
 */
function scoreSleepHealth6(answers) {
  // 反向计分（健康维度转为问题维度）
  const reverseIndex = [0, 1, 2, 3, 4, 5]
  const total = sumLikert({ 
    answers, 
    reverseIndex, 
    scale: [0, 1, 2, 3, 4] 
  })
  
  let alerts = []
  if (total >= 12) {
    alerts.push('可能存在睡眠问题')
  }
  
  let suggestions = ''
  if (total >= 12) {
    suggestions = '评估结果提示可能存在睡眠问题，建议改善睡眠环境和习惯，必要时咨询睡眠专科医生。'
  } else {
    suggestions = '评估结果显示睡眠健康状况良好，请继续保持规律的作息习惯。'
  }
  
  return {
    total,
    transform_note: '条目为健康维度，已反向标准化为问题得分',
    alerts,
    suggestions
  }
}

// 导出所有计分函数
module.exports = {
  sumLikert,
  scoreUnified,
  scorePSS10,
  scorePHQ9,
  scoreGAD7,
  scoreWHO5,
  scoreK6,
  scoreK10,
  scoreASQ4,
  scoreYouthSocialAnxiety6,
  scoreAcademicStress8,
  scoreSleepHealth6,
  // 保持向后兼容
  scoreMiniSPIN,
  scoreSPIN17,
  scoreESSA16,
  scorePSQI19
}