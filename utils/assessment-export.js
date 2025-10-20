/**
 * 评估答题数据导出工具
 * 支持JSON和CSV格式导出
 * @module utils/assessment-export
 */

/**
 * 将答题数据导出为JSON格式
 * @param {Object} options - 导出选项
 * @param {String} options.scaleId - 量表ID
 * @param {String} options.title - 量表标题
 * @param {Array} options.questions - 题目列表
 * @param {Object} options.answers - 答案对象 { questionId: value }
 * @param {Object} options.questionTimes - 每题用时 { questionId: timeMs }
 * @param {Number} options.totalTime - 总用时（秒）
 * @param {Array} options.markedQuestions - 标记的题目ID列表
 * @param {Object} options.result - 评估结果
 * @returns {String} JSON字符串
 */
export function exportToJSON(options) {
  const {
    scaleId,
    title,
    questions,
    answers,
    questionTimes = {},
    totalTime = 0,
    markedQuestions = [],
    result = null
  } = options;

  // 构建导出数据结构
  const exportData = {
    metadata: {
      scaleId,
      title,
      exportTime: new Date().toISOString(),
      totalQuestions: questions.length,
      answeredQuestions: Object.keys(answers).length,
      totalTimeSeconds: totalTime,
      version: '1.0'
    },
    answers: [],
    statistics: {
      averageTimePerQuestion: totalTime / questions.length || 0,
      markedCount: markedQuestions.length,
      completionRate: (Object.keys(answers).length / questions.length * 100).toFixed(2) + '%'
    }
  };

  // 添加结果信息（如果存在）
  if (result) {
    exportData.result = {
      score: result.score || result.total_score || 0,
      level: result.level || 'unknown',
      suggestions: result.suggestions || []
    };
  }

  // 添加详细的答题数据
  questions.forEach((question, index) => {
    const questionId = question.id;
    const answer = answers[questionId];
    const timeMs = questionTimes[questionId] || 0;
    const isMarked = markedQuestions.includes(questionId);

    exportData.answers.push({
      questionNumber: index + 1,
      questionId,
      questionText: question.text,
      answerValue: answer !== undefined ? answer : null,
      answerLabel: getAnswerLabel(question, answer, options),
      timeSpent: {
        milliseconds: timeMs,
        seconds: (timeMs / 1000).toFixed(2)
      },
      isMarked,
      isAnswered: answer !== undefined
    });
  });

  return JSON.stringify(exportData, null, 2);
}

/**
 * 将答题数据导出为CSV格式
 * @param {Object} options - 导出选项（同exportToJSON）
 * @returns {String} CSV字符串
 */
export function exportToCSV(options) {
  const {
    scaleId,
    title,
    questions,
    answers,
    questionTimes = {},
    markedQuestions = []
  } = options;

  // CSV头部
  const headers = [
    '题号',
    '题目ID',
    '题目内容',
    '答案值',
    '答案标签',
    '用时(秒)',
    '是否标记',
    '是否作答'
  ];

  // CSV行数据
  const rows = questions.map((question, index) => {
    const questionId = question.id;
    const answer = answers[questionId];
    const timeMs = questionTimes[questionId] || 0;
    const isMarked = markedQuestions.includes(questionId);

    return [
      index + 1,
      questionId,
      escapeCSV(question.text),
      answer !== undefined ? answer : '',
      escapeCSV(getAnswerLabel(question, answer, options)),
      (timeMs / 1000).toFixed(2),
      isMarked ? '是' : '否',
      answer !== undefined ? '是' : '否'
    ];
  });

  // 添加元数据行
  const metadataRows = [
    ['量表ID', scaleId],
    ['量表标题', title],
    ['导出时间', new Date().toLocaleString('zh-CN')],
    ['总题数', questions.length],
    ['已答题数', Object.keys(answers).length],
    ['完成率', (Object.keys(answers).length / questions.length * 100).toFixed(2) + '%'],
    [''], // 空行分隔
    headers
  ];

  // 合并所有行
  const allRows = [...metadataRows, ...rows];

  // 转换为CSV字符串
  return allRows.map(row => row.join(',')).join('\n');
}

/**
 * 获取答案标签
 * @private
 */
function getAnswerLabel(question, answerValue, options) {
  if (answerValue === undefined || answerValue === null) {
    return '未作答';
  }

  // 如果题目有自定义labels
  if (question.labels && question.options) {
    const valueIndex = question.options.indexOf(answerValue);
    if (valueIndex !== -1 && question.labels[valueIndex]) {
      return question.labels[valueIndex];
    }
  }

  // 使用全局量表选项
  if (options.scaleData) {
    const scale = options.scaleData.scale || [];
    const labels = options.scaleData.options || [];
    const valueIndex = scale.indexOf(answerValue);
    if (valueIndex !== -1 && labels[valueIndex]) {
      return labels[valueIndex];
    }
  }

  // 特殊类型处理
  if (question.type === 'time' || question.type === 'number') {
    return String(answerValue);
  }

  return String(answerValue);
}

/**
 * 转义CSV特殊字符
 * @private
 */
function escapeCSV(text) {
  if (text === null || text === undefined) {
    return '';
  }
  
  const str = String(text);
  
  // 如果包含逗号、引号或换行符，需要用引号包裹
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    // 将内部的引号转义为两个引号
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

/**
 * 下载文件（H5平台）
 * @param {String} content - 文件内容
 * @param {String} filename - 文件名
 * @param {String} mimeType - MIME类型
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  // #ifdef H5
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('下载失败:', error);
    return false;
  }
  // #endif
  
  // #ifndef H5
  return false;
  // #endif
}

/**
 * 保存文件到本地（小程序平台）
 * @param {String} content - 文件内容
 * @param {String} filename - 文件名
 * @returns {Promise<String>} 文件路径
 */
export function saveFileLocal(content, filename) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    try {
      const fs = uni.getFileSystemManager();
      const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;
      
      fs.writeFile({
        filePath,
        data: content,
        encoding: 'utf8',
        success: () => {
          resolve(filePath);
        },
        fail: (error) => {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
    // #endif
    
    // #ifndef MP-WEIXIN
    reject(new Error('仅支持微信小程序'));
    // #endif
  });
}

/**
 * 分享文件（小程序平台）
 * @param {String} filePath - 文件路径
 */
export function shareFile(filePath) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.shareFileMessage({
      filePath,
      success: () => {
        resolve();
      },
      fail: (error) => {
        reject(error);
      }
    });
    // #endif
    
    // #ifndef MP-WEIXIN
    reject(new Error('仅支持微信小程序'));
    // #endif
  });
}

/**
 * 导出答题数据（统一接口）
 * @param {Object} options - 导出选项
 * @param {String} format - 导出格式 'json' | 'csv'
 * @returns {Promise<Object>} 导出结果 { success, message, filePath? }
 */
export async function exportAssessmentData(options, format = 'json') {
  try {
    // 生成文件内容
    let content, filename, mimeType;
    
    if (format === 'json') {
      content = exportToJSON(options);
      filename = `assessment_${options.scaleId}_${Date.now()}.json`;
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = exportToCSV(options);
      filename = `assessment_${options.scaleId}_${Date.now()}.csv`;
      mimeType = 'text/csv';
    } else {
      throw new Error('不支持的导出格式');
    }

    // 根据平台选择导出方式
    // #ifdef H5
    const success = downloadFile(content, filename, mimeType);
    if (success) {
      return {
        success: true,
        message: '导出成功',
        filename
      };
    } else {
      throw new Error('下载失败');
    }
    // #endif

    // #ifdef MP-WEIXIN
    const filePath = await saveFileLocal(content, filename);
    
    // 提示用户
    uni.showModal({
      title: '导出成功',
      content: '文件已保存，是否分享到微信？',
      confirmText: '分享',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          shareFile(filePath).catch((error) => {
            console.error('分享失败:', error);
            uni.showToast({
              title: '分享失败',
              icon: 'none'
            });
          });
        }
      }
    });
    
    return {
      success: true,
      message: '导出成功',
      filePath,
      filename
    };
    // #endif

    // #ifndef H5
    // #ifndef MP-WEIXIN
    throw new Error('当前平台暂不支持导出功能');
    // #endif
    // #endif
  } catch (error) {
    console.error('导出失败:', error);
    return {
      success: false,
      message: error.message || '导出失败'
    };
  }
}

/**
 * 从localStorage恢复并导出进度数据
 * @param {String} scaleId - 量表ID
 * @param {String} format - 导出格式
 * @returns {Promise<Object>} 导出结果
 */
export async function exportProgressData(scaleId, format = 'json') {
  try {
    const progressKey = `assess_progress_${scaleId}`;
    const progressStr = uni.getStorageSync(progressKey);
    
    if (!progressStr) {
      throw new Error('未找到答题进度数据');
    }

    const progressData = JSON.parse(progressStr);
    
    // 需要加载量表数据来获取题目详情
    const scaleData = await loadScaleData(scaleId);
    
    const exportOptions = {
      scaleId: progressData.scaleId,
      title: scaleData.title || scaleId,
      questions: scaleData.questions || [],
      answers: progressData.answers,
      questionTimes: progressData.questionTimes,
      totalTime: (Date.now() - progressData.startTime) / 1000,
      markedQuestions: [],
      scaleData
    };

    return await exportAssessmentData(exportOptions, format);
  } catch (error) {
    console.error('导出进度数据失败:', error);
    return {
      success: false,
      message: error.message || '导出失败'
    };
  }
}

/**
 * 加载量表数据
 * @private
 */
async function loadScaleData(scaleId) {
  const scaleMap = {
    'phq9': '/static/scales/phq9.json',
    'gad7': '/static/scales/gad7.json',
    'psqi': '/static/scales/psqi.json',
    'pss': '/static/scales/pss.json',
    'ces-d': '/static/scales/ces-d.json',
    'mbi': '/static/scales/mbi.json',
    'wemwbs': '/static/scales/wemwbs.json',
    'swls': '/static/scales/swls.json',
    'resilience': '/static/scales/resilience.json',
    'loneliness': '/static/scales/loneliness.json',
    'social-support': '/static/scales/social-support.json',
    'self-esteem': '/static/scales/self-esteem.json',
    'academic': '/static/scales/academic.json',
    'sleep': '/static/scales/sleep.json'
  };

  const scalePath = scaleMap[scaleId];
  if (!scalePath) {
    throw new Error(`未找到量表: ${scaleId}`);
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: scalePath,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          resolve(res.data);
        } else {
          reject(new Error('加载量表数据失败'));
        }
      },
      fail: reject
    });
  });
}

export default {
  exportToJSON,
  exportToCSV,
  exportAssessmentData,
  exportProgressData,
  downloadFile,
  saveFileLocal,
  shareFile
};

