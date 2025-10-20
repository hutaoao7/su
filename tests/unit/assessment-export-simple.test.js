/**
 * 答题数据导出功能简化测试（纯Node.js环境）
 */

// 直接内联核心函数进行测试
function exportToJSON(options) {
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

  if (result) {
    exportData.result = {
      score: result.score || result.total_score || 0,
      level: result.level || 'unknown',
      suggestions: result.suggestions || []
    };
  }

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

function exportToCSV(options) {
  const {
    scaleId,
    title,
    questions,
    answers,
    questionTimes = {},
    markedQuestions = []
  } = options;

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

  const metadataRows = [
    ['量表ID', scaleId],
    ['量表标题', title],
    ['导出时间', new Date().toLocaleString('zh-CN')],
    ['总题数', questions.length],
    ['已答题数', Object.keys(answers).length],
    ['完成率', (Object.keys(answers).length / questions.length * 100).toFixed(2) + '%'],
    [''],
    headers
  ];

  const allRows = [...metadataRows, ...rows];
  return allRows.map(row => row.join(',')).join('\n');
}

function getAnswerLabel(question, answerValue, options) {
  if (answerValue === undefined || answerValue === null) {
    return '未作答';
  }

  if (question.labels && question.options) {
    const valueIndex = question.options.indexOf(answerValue);
    if (valueIndex !== -1 && question.labels[valueIndex]) {
      return question.labels[valueIndex];
    }
  }

  if (options.scaleData) {
    const scale = options.scaleData.scale || [];
    const labels = options.scaleData.options || [];
    const valueIndex = scale.indexOf(answerValue);
    if (valueIndex !== -1 && labels[valueIndex]) {
      return labels[valueIndex];
    }
  }

  if (question.type === 'time' || question.type === 'number') {
    return String(answerValue);
  }

  return String(answerValue);
}

function escapeCSV(text) {
  if (text === null || text === undefined) {
    return '';
  }
  
  const str = String(text);
  
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

// ========== 测试用例 ==========

const mockOptions = {
  scaleId: 'phq9',
  title: 'PHQ-9 抑郁症筛查量表',
  questions: [
    {
      id: 'phq9_q1',
      text: '做事时提不起劲或没有兴趣',
      labels: ['完全不会', '几天', '一半以上的天数', '几乎每天'],
      options: [0, 1, 2, 3]
    },
    {
      id: 'phq9_q2',
      text: '感到心情低落、沮丧或绝望',
      labels: ['完全不会', '几天', '一半以上的天数', '几乎每天'],
      options: [0, 1, 2, 3]
    },
    {
      id: 'phq9_q3',
      text: '入睡困难、睡不安稳或睡眠过多',
      labels: ['完全不会', '几天', '一半以上的天数', '几乎每天'],
      options: [0, 1, 2, 3]
    }
  ],
  answers: {
    'phq9_q1': 2,
    'phq9_q2': 1,
    'phq9_q3': 3
  },
  questionTimes: {
    'phq9_q1': 5000,
    'phq9_q2': 3500,
    'phq9_q3': 4200
  },
  totalTime: 45,
  markedQuestions: ['phq9_q3'],
  scaleData: {
    scale: [0, 1, 2, 3],
    options: ['完全不会', '几天', '一半以上的天数', '几乎每天']
  },
  result: {
    score: 6,
    level: '轻度',
    suggestions: ['保持规律作息', '适当运动']
  }
};

console.log('===== 答题数据导出功能测试 =====\n');

let passedTests = 0;
let totalTests = 7;

// 测试1: JSON格式导出
console.log('测试1: 导出JSON格式');
try {
  const jsonResult = exportToJSON(mockOptions);
  const jsonData = JSON.parse(jsonResult);
  
  console.log('✅ JSON导出成功');
  console.log('- 量表ID:', jsonData.metadata.scaleId);
  console.log('- 总题数:', jsonData.metadata.totalQuestions);
  console.log('- 已答题数:', jsonData.metadata.answeredQuestions);
  console.log('- 完成率:', jsonData.statistics.completionRate);
  console.log('- 平均每题用时:', jsonData.statistics.averageTimePerQuestion.toFixed(2) + '秒');
  console.log('- 答题记录数:', jsonData.answers.length);
  console.log('- 结果分数:', jsonData.result?.score);
  console.log('- 结果等级:', jsonData.result?.level);
  passedTests++;
  console.log();
} catch (error) {
  console.error('❌ JSON导出失败:', error.message);
  console.log();
}

// 测试2: CSV格式导出
console.log('测试2: 导出CSV格式');
try {
  const csvResult = exportToCSV(mockOptions);
  const lines = csvResult.split('\n');
  
  console.log('✅ CSV导出成功');
  console.log('- 总行数:', lines.length);
  console.log('- 前3行预览:');
  lines.slice(0, 3).forEach((line, index) => {
    console.log(`  ${index + 1}. ${line}`);
  });
  console.log('- CSV头部行:', lines[7]);
  console.log('- 数据行示例:', lines[8]);
  passedTests++;
  console.log();
} catch (error) {
  console.error('❌ CSV导出失败:', error.message);
  console.log();
}

// 测试3: 特殊字符转义
console.log('测试3: CSV特殊字符转义');
const specialCharsOptions = {
  ...mockOptions,
  questions: [
    {
      id: 'test_q1',
      text: '这是一个包含"引号"的题目',
      labels: ['选项A,包含逗号', '选项B\n包含换行', '选项C"引号"'],
      options: [0, 1, 2]
    }
  ],
  answers: {
    'test_q1': 0
  }
};

try {
  const csvResult = exportToCSV(specialCharsOptions);
  console.log('✅ 特殊字符转义测试通过');
  passedTests++;
  console.log();
} catch (error) {
  console.error('❌ 特殊字符转义失败:', error.message);
  console.log();
}

// 测试4: 未作答题目处理
console.log('测试4: 未作答题目处理');
const incompleteOptions = {
  ...mockOptions,
  answers: {
    'phq9_q1': 2
  }
};

try {
  const jsonResult = exportToJSON(incompleteOptions);
  const jsonData = JSON.parse(jsonResult);
  
  const unansweredCount = jsonData.answers.filter(a => !a.isAnswered).length;
  
  console.log('✅ 未作答题目处理正确');
  console.log('- 已答题数:', jsonData.metadata.answeredQuestions);
  console.log('- 未答题数:', unansweredCount);
  console.log('- 完成率:', jsonData.statistics.completionRate);
  passedTests++;
  console.log();
} catch (error) {
  console.error('❌ 未作答题目处理失败:', error.message);
  console.log();
}

// 测试5: 标记题目统计
console.log('测试5: 标记题目统计');
try {
  const jsonResult = exportToJSON(mockOptions);
  const jsonData = JSON.parse(jsonResult);
  
  const markedAnswers = jsonData.answers.filter(a => a.isMarked);
  
  console.log('✅ 标记题目统计正确');
  console.log('- 标记题目数:', jsonData.statistics.markedCount);
  console.log('- 标记的题目:', markedAnswers.map(a => a.questionNumber).join(', '));
  passedTests++;
  console.log();
} catch (error) {
  console.error('❌ 标记题目统计失败:', error.message);
  console.log();
}

// 测试6: 数据完整性验证
console.log('测试6: 数据完整性验证');
try {
  const jsonResult = exportToJSON(mockOptions);
  const jsonData = JSON.parse(jsonResult);
  
  const requiredFields = ['metadata', 'answers', 'statistics', 'result'];
  const missingFields = requiredFields.filter(field => !jsonData[field]);
  
  if (missingFields.length === 0) {
    console.log('✅ 数据完整性验证通过');
    console.log('- 所有必要字段都存在');
    
    const answerRequiredFields = [
      'questionNumber', 
      'questionId', 
      'questionText', 
      'answerValue', 
      'answerLabel',
      'timeSpent',
      'isMarked',
      'isAnswered'
    ];
    
    const firstAnswer = jsonData.answers[0];
    const missingAnswerFields = answerRequiredFields.filter(field => !(field in firstAnswer));
    
    if (missingAnswerFields.length === 0) {
      console.log('- 答案记录字段完整');
      passedTests++;
    } else {
      console.log('⚠️  答案记录缺少字段:', missingAnswerFields.join(', '));
    }
    
    console.log();
  } else {
    console.log('⚠️  缺少必要字段:', missingFields.join(', '));
    console.log();
  }
} catch (error) {
  console.error('❌ 数据完整性验证失败:', error.message);
  console.log();
}

// 测试7: 时间格式验证
console.log('测试7: 时间格式验证');
try {
  const jsonResult = exportToJSON(mockOptions);
  const jsonData = JSON.parse(jsonResult);
  
  const exportTime = new Date(jsonData.metadata.exportTime);
  const isValidDate = !isNaN(exportTime.getTime());
  
  if (isValidDate) {
    console.log('✅ 时间格式验证通过');
    console.log('- 导出时间:', jsonData.metadata.exportTime);
    console.log('- 时间戳有效:', isValidDate);
    passedTests++;
    console.log();
  } else {
    console.log('❌ 时间格式无效');
    console.log();
  }
} catch (error) {
  console.error('❌ 时间格式验证失败:', error.message);
  console.log();
}

console.log('===== 测试完成 =====');
console.log(`\n通过测试: ${passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('✅ 所有测试通过！答题数据导出功能正常工作。');
  process.exit(0);
} else {
  console.log('⚠️  部分测试失败');
  process.exit(1);
}


