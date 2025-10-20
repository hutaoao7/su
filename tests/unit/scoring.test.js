/**
 * Scoring.js 单元测试
 * 测试所有14个量表的计分函数
 * 
 * 运行方法:
 * node tests/unit/scoring.test.js
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

const scoring = require('../../utils/scoring.js');

// 测试框架（简单实现）
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log('\n🚀 开始运行Scoring.js单元测试\n');
    console.log('='.repeat(80));
    
    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✅ PASS: ${test.name}`);
      } catch (error) {
        this.failed++;
        this.errors.push({ test: test.name, error });
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   错误: ${error.message}`);
      }
    }
    
    console.log('='.repeat(80));
    console.log(`\n📊 测试结果汇总:`);
    console.log(`   总计: ${this.tests.length}个测试`);
    console.log(`   通过: ${this.passed}个 ✅`);
    console.log(`   失败: ${this.failed}个 ❌`);
    console.log(`   通过率: ${((this.passed / this.tests.length) * 100).toFixed(1)}%\n`);
    
    if (this.failed > 0) {
      console.log('⚠️  失败的测试详情:');
      this.errors.forEach(({ test, error }) => {
        console.log(`\n  ${test}:`);
        console.log(`    ${error.stack || error.message}`);
      });
    } else {
      console.log('🎉 所有测试通过!\n');
    }
    
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// 断言函数
function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message}\n    Expected: ${expected}\n    Actual: ${actual}`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(`${message}\n    Expected: true\n    Actual: ${value}`);
  }
}

function assertExists(value, message = '') {
  if (value === undefined || value === null) {
    throw new Error(`${message}\n    Expected: non-null value\n    Actual: ${value}`);
  }
}

function assertRange(value, min, max, message = '') {
  if (value < min || value > max) {
    throw new Error(`${message}\n    Expected: ${min}-${max}\n    Actual: ${value}`);
  }
}

// 创建测试运行器
const runner = new TestRunner();

// ============================================================
// PHQ-9 抑郁量表测试
// ============================================================

runner.test('PHQ-9: 最低分测试（无抑郁）', () => {
  const answers = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const result = scoring.scorePHQ9(answers);
  
  assertEqual(result.total, 0, 'PHQ-9最低分应为0');
  assertEqual(result.band, '最轻/无', 'PHQ-9最低分等级应为"最轻/无"');
  assertExists(result.suggestions, 'PHQ-9应返回建议');
});

runner.test('PHQ-9: 轻度抑郁测试', () => {
  const answers = [1, 1, 1, 1, 1, 0, 0, 0, 0];
  const result = scoring.scorePHQ9(answers);
  
  assertEqual(result.total, 5, 'PHQ-9轻度分数应为5');
  assertEqual(result.band, '轻度', 'PHQ-9等级应为"轻度"');
});

runner.test('PHQ-9: 重度抑郁测试', () => {
  const answers = [3, 3, 3, 3, 3, 2, 2, 2, 2];
  const result = scoring.scorePHQ9(answers);
  
  assertEqual(result.total, 23, 'PHQ-9重度分数应为23');
  assertEqual(result.band, '重度', 'PHQ-9等级应为"重度"');
});

runner.test('PHQ-9: 自杀风险检测', () => {
  const answers = [1, 1, 1, 1, 1, 1, 1, 1, 2];
  const result = scoring.scorePHQ9(answers);
  
  assertTrue(result.alerts.length > 0, 'PHQ-9应检测到自杀风险');
  assertTrue(result.followups.includes('asq4'), 'PHQ-9应推荐ASQ-4跟进');
});

// ============================================================
// GAD-7 焦虑量表测试
// ============================================================

runner.test('GAD-7: 最低分测试（无焦虑）', () => {
  const answers = [0, 0, 0, 0, 0, 0, 0];
  const result = scoring.scoreGAD7(answers);
  
  assertEqual(result.total, 0, 'GAD-7最低分应为0');
  assertEqual(result.band, '正常', 'GAD-7最低分等级应为"正常"');
});

runner.test('GAD-7: 中度焦虑测试', () => {
  const answers = [2, 2, 1, 1, 1, 2, 1];
  const result = scoring.scoreGAD7(answers);
  
  assertEqual(result.total, 10, 'GAD-7中度分数应为10');
  assertEqual(result.band, '中度', 'GAD-7等级应为"中度"');
  assertTrue(result.followups.length > 0, 'GAD-7中度应推荐跟进评估');
});

runner.test('GAD-7: 最高分测试', () => {
  const answers = [3, 3, 3, 3, 3, 3, 3];
  const result = scoring.scoreGAD7(answers);
  
  assertEqual(result.total, 21, 'GAD-7最高分应为21');
  assertEqual(result.band, '重度', 'GAD-7最高分等级应为"重度"');
});

// ============================================================
// PSS-10 压力量表测试
// ============================================================

runner.test('PSS-10: 反向计分测试', () => {
  // 第4、5、7、8题（索引3、4、6、7）是反向题
  const answers = [0, 0, 0, 4, 4, 0, 4, 4, 0, 0];
  const result = scoring.scorePSS10(answers);
  
  // 反向题4分应计为0分
  assertTrue(result.total < 16, 'PSS-10反向计分应正确');
});

runner.test('PSS-10: 高压力测试', () => {
  const answers = [4, 4, 4, 0, 0, 4, 0, 0, 4, 4];
  const result = scoring.scorePSS10(answers);
  
  assertTrue(result.total >= 27, 'PSS-10高压力分数应>=27');
  assertEqual(result.band, '高压力', 'PSS-10等级应为"高压力"');
});

runner.test('PSS-10: 低压力测试', () => {
  const answers = [1, 1, 1, 3, 3, 1, 3, 3, 1, 1];
  const result = scoring.scorePSS10(answers);
  
  assertTrue(result.total < 14, 'PSS-10低压力分数应<14');
  assertEqual(result.band, '低压力', 'PSS-10等级应为"低压力"');
});

// ============================================================
// K6/K10 心理痛苦量表测试
// ============================================================

runner.test('K6: 阈值测试', () => {
  const answers = [2, 2, 2, 2, 2, 3];
  const result = scoring.scoreK6(answers);
  
  assertEqual(result.total, 13, 'K6分数应为13');
  assertTrue(result.alerts.length > 0, 'K6>=13应触发警告');
});

runner.test('K6: 低分测试', () => {
  const answers = [0, 0, 1, 1, 0, 0];
  const result = scoring.scoreK6(answers);
  
  assertTrue(result.total < 13, 'K6低分应<13');
  assertEqual(result.alerts.length, 0, 'K6低分不应触发警告');
});

runner.test('K10: 重度测试', () => {
  const answers = [4, 4, 4, 4, 3, 3, 3, 3, 3, 3];
  const result = scoring.scoreK10(answers);
  
  assertTrue(result.total >= 30, 'K10重度分数应>=30');
  assertEqual(result.band, '重度', 'K10等级应为"重度"');
});

runner.test('K10: 轻度测试', () => {
  const answers = [2, 2, 2, 2, 1, 1, 1, 1, 2, 2];
  const result = scoring.scoreK10(answers);
  
  assertRange(result.total, 16, 21, 'K10轻度分数应在16-21');
  assertEqual(result.band, '轻度', 'K10等级应为"轻度"');
});

// ============================================================
// WHO-5 幸福感量表测试
// ============================================================

runner.test('WHO-5: 转换分数测试', () => {
  const answers = [3, 3, 3, 3, 3];
  const result = scoring.scoreWHO5(answers);
  
  assertEqual(result.total, 15, 'WHO-5原始分应为15');
  assertEqual(result.transformed_score, 60, 'WHO-5转换分应为60 (15*4)');
});

runner.test('WHO-5: 低幸福感测试', () => {
  const answers = [1, 1, 2, 1, 1];
  const result = scoring.scoreWHO5(answers);
  
  assertTrue(result.transformed_score <= 50, 'WHO-5低分应<=50');
  assertTrue(result.alerts.length > 0, 'WHO-5低分应触发警告');
});

runner.test('WHO-5: 最高分测试', () => {
  const answers = [5, 5, 5, 5, 5];
  const result = scoring.scoreWHO5(answers);
  
  assertEqual(result.total, 25, 'WHO-5原始最高分应为25');
  assertEqual(result.transformed_score, 100, 'WHO-5转换最高分应为100');
});

// ============================================================
// ASQ-4 自杀风险筛查测试
// ============================================================

runner.test('ASQ-4: 无风险测试', () => {
  const answers = [0, 0, 0, 0];
  const result = scoring.scoreASQ4(answers);
  
  assertEqual(result.total, 0, 'ASQ-4无风险分数应为0');
  assertEqual(result.isPositive, false, 'ASQ-4无风险isPositive应为false');
  assertEqual(result.alerts.length, 0, 'ASQ-4无风险不应触发警告');
});

runner.test('ASQ-4: 有风险测试', () => {
  const answers = [0, 1, 0, 0];
  const result = scoring.scoreASQ4(answers);
  
  assertEqual(result.total, 1, 'ASQ-4有风险分数应>0');
  assertEqual(result.isPositive, true, 'ASQ-4有风险isPositive应为true');
  assertTrue(result.alerts.length > 0, 'ASQ-4有风险应触发警告');
});

// ============================================================
// 青少年社交焦虑量表测试
// ============================================================

runner.test('青少年社交焦虑: 低分测试', () => {
  const answers = [1, 1, 1, 1, 1, 1];
  const result = scoring.scoreYouthSocialAnxiety6(answers);
  
  assertEqual(result.total, 6, '青少年社交焦虑低分应为6');
  assertEqual(result.alerts.length, 0, '青少年社交焦虑低分不应触发警告');
});

runner.test('青少年社交焦虑: 高风险测试', () => {
  const answers = [3, 3, 3, 3, 2, 2];
  const result = scoring.scoreYouthSocialAnxiety6(answers);
  
  assertTrue(result.total >= 16, '青少年社交焦虑高分应>=16');
  assertTrue(result.alerts.length > 0, '青少年社交焦虑高分应触发警告');
  assertTrue(result.followups.length > 0, '青少年社交焦虑高分应推荐跟进');
});

// ============================================================
// 学业压力量表测试
// ============================================================

runner.test('学业压力: 低压力测试', () => {
  const answers = [1, 1, 1, 1, 1, 1, 1, 0];
  const result = scoring.scoreAcademicStress8(answers);
  
  assertTrue(result.total < 14, '学业压力低分应<14');
  assertEqual(result.alerts.length, 0, '学业压力低分不应触发警告');
});

runner.test('学业压力: 高压力测试', () => {
  const answers = [3, 3, 3, 3, 2, 2, 2, 2];
  const result = scoring.scoreAcademicStress8(answers);
  
  assertTrue(result.total >= 18, '学业压力高分应>=18');
  assertTrue(result.alerts.length > 0, '学业压力高分应触发警告');
});

// ============================================================
// 睡眠健康量表测试
// ============================================================

runner.test('睡眠健康: 反向计分测试', () => {
  // 所有题目都是反向计分（健康维度）
  const answers = [4, 4, 4, 4, 4, 4];
  const result = scoring.scoreSleepHealth6(answers);
  
  // 健康最好（4分）应转为问题最少（0分）
  assertEqual(result.total, 0, '睡眠健康最佳应反向计为0分');
});

runner.test('睡眠健康: 睡眠问题测试', () => {
  const answers = [1, 1, 1, 1, 1, 1];
  const result = scoring.scoreSleepHealth6(answers);
  
  assertTrue(result.total >= 12, '睡眠健康低分应反向计>=12');
  assertTrue(result.alerts.length > 0, '睡眠健康低分应触发警告');
});

// ============================================================
// Mini-SPIN 社交焦虑快筛测试
// ============================================================

runner.test('Mini-SPIN: 阈值测试', () => {
  const answers = [2, 2, 2];
  const result = scoring.scoreMiniSPIN(answers);
  
  assertEqual(result.total, 6, 'Mini-SPIN分数应为6');
  assertEqual(result.isPositive, true, 'Mini-SPIN>=6应为阳性');
  assertEqual(result.threshold, 6, 'Mini-SPIN阈值应为6');
});

runner.test('Mini-SPIN: 阴性测试', () => {
  const answers = [1, 1, 1];
  const result = scoring.scoreMiniSPIN(answers);
  
  assertEqual(result.total, 3, 'Mini-SPIN分数应为3');
  assertEqual(result.isPositive, false, 'Mini-SPIN<6应为阴性');
});

// ============================================================
// SPIN-17 社交恐惧症量表测试
// ============================================================

runner.test('SPIN-17: 低风险测试', () => {
  const answers = Array(17).fill(0);
  const result = scoring.scoreSPIN17(answers);
  
  assertEqual(result.total, 0, 'SPIN-17最低分应为0');
  assertEqual(result.band, '低风险', 'SPIN-17最低分等级应为"低风险"');
});

runner.test('SPIN-17: 较高风险测试', () => {
  const answers = Array(17).fill(2);
  const result = scoring.scoreSPIN17(answers);
  
  assertTrue(result.total >= 29, 'SPIN-17高分应>=29');
  assertEqual(result.band, '较高风险', 'SPIN-17高分等级应为"较高风险"');
});

// ============================================================
// ESSA-16 学业压力量表测试
// ============================================================

runner.test('ESSA-16: 维度计分测试', () => {
  const answers = Array(16).fill(3);
  const result = scoring.scoreESSA16(answers);
  
  assertEqual(result.total, 48, 'ESSA-16总分应为48');
  assertExists(result.byDimension, 'ESSA-16应返回维度分数');
  assertExists(result.byDimension.load, 'ESSA-16应包含作业负荷维度');
  assertExists(result.byDimension.score, 'ESSA-16应包含成绩担忧维度');
});

runner.test('ESSA-16: 高压力测试', () => {
  const answers = Array(16).fill(4);
  const result = scoring.scoreESSA16(answers);
  
  assertTrue(result.total >= 60, 'ESSA-16高压力分数应>=60');
  assertEqual(result.band, '高压力', 'ESSA-16等级应为"高压力"');
});

// ============================================================
// PSQI-19 睡眠质量量表测试
// ============================================================

runner.test('PSQI-19: 良好睡眠测试', () => {
  const payload = {
    subjective_quality: 0,
    sleep_latency_min: 10,
    latency_freq: 0,
    sleep_duration_h: 8,
    bedtime: '23:00',
    waketime: '07:00',
    disturbances_sum: 0,
    medication_use: 0,
    daytime_dysfunction: 0
  };
  const result = scoring.scorePSQI19(payload);
  
  assertTrue(result.total <= 5, 'PSQI-19良好睡眠分数应<=5');
  assertEqual(result.band, '良好', 'PSQI-19等级应为"良好"');
  assertExists(result.components, 'PSQI-19应返回组件分数');
});

runner.test('PSQI-19: 睡眠问题测试', () => {
  const payload = {
    subjective_quality: 3,
    sleep_latency_min: 60,
    latency_freq: 3,
    sleep_duration_h: 4,
    bedtime: '01:00',
    waketime: '07:00',
    disturbances_sum: 20,
    medication_use: 3,
    daytime_dysfunction: 5
  };
  const result = scoring.scorePSQI19(payload);
  
  assertTrue(result.total > 5, 'PSQI-19睡眠问题分数应>5');
  assertEqual(result.band, '可疑/需关注', 'PSQI-19等级应为"可疑/需关注"');
});

// ============================================================
// 统一接口测试
// ============================================================

runner.test('统一接口: scoreUnified测试', () => {
  const testCases = [
    { scaleId: 'phq9', answers: Array(9).fill(0) },
    { scaleId: 'gad7', answers: Array(7).fill(0) },
    { scaleId: 'pss10', answers: Array(10).fill(0) },
    { scaleId: 'k6', answers: Array(6).fill(0) },
    { scaleId: 'who5', answers: Array(5).fill(0) }
  ];
  
  testCases.forEach(({ scaleId, answers }) => {
    const result = scoring.scoreUnified(scaleId, answers);
    assertExists(result, `scoreUnified应返回${scaleId}的结果`);
    assertExists(result.total, `${scaleId}应返回total`);
    assertExists(result.suggestions, `${scaleId}应返回suggestions`);
  });
});

runner.test('统一接口: 未知量表ID测试', () => {
  try {
    scoring.scoreUnified('unknown_scale', []);
    throw new Error('应抛出错误');
  } catch (error) {
    assertTrue(error.message.includes('Unknown scale ID'), '未知量表ID应抛出错误');
  }
});

// ============================================================
// 边界值测试
// ============================================================

runner.test('边界值: 空数组测试', () => {
  const result = scoring.scorePHQ9([]);
  assertEqual(result.total, 0, '空数组应返回0分');
});

runner.test('边界值: 最大值测试', () => {
  const result = scoring.scorePHQ9(Array(9).fill(3));
  assertEqual(result.total, 27, 'PHQ-9最大值应为27');
});

runner.test('边界值: sumLikert反向计分测试', () => {
  const result = scoring.sumLikert({
    answers: [4, 4, 4, 4, 4],
    reverseIndex: [0, 2, 4],
    scale: [0, 1, 2, 3, 4]
  });
  
  // 索引0,2,4反向：4->0, 4->0, 4->0
  // 索引1,3正向：4, 4
  // 总分：0+4+0+4+0=8
  assertEqual(result, 8, 'sumLikert反向计分应正确');
});

// ============================================================
// 运行所有测试
// ============================================================

runner.run();
