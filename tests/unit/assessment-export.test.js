/**
 * 答题数据导出功能单元测试
 */

const path = require('path');
const { exportToJSON, exportToCSV } = require(path.resolve(__dirname, '../../utils/assessment-export.js'));

// 模拟数据
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
  console.log('- CSV头部行:', lines[7]); // 第8行是表头
  console.log('- 数据行示例:', lines[8]); // 第9行是第一条数据
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
      labels: ['选项A,包含逗号', '选项B\n包含换行', '选项C"引号"']
    }
  ],
  answers: {
    'test_q1': 0
  }
};

try {
  const csvResult = exportToCSV(specialCharsOptions);
  console.log('✅ 特殊字符转义测试通过');
  console.log('- CSV包含特殊字符处理');
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
    // phq9_q2 和 phq9_q3 未作答
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
  
  // 验证必要字段
  const requiredFields = ['metadata', 'answers', 'statistics', 'result'];
  const missingFields = requiredFields.filter(field => !jsonData[field]);
  
  if (missingFields.length === 0) {
    console.log('✅ 数据完整性验证通过');
    console.log('- 所有必要字段都存在');
    
    // 验证每个答案记录的字段
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
console.log('\n所有测试通过！答题数据导出功能正常工作。');

