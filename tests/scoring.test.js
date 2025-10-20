/**
 * 量表评分逻辑单元测试
 * WS-M1-W2-003
 */

import { scoreUnified } from '@/utils/scoring.js';

describe('量表评分测试', () => {
  // GAD-7 测试
  describe('GAD-7 广泛性焦虑量表', () => {
    test('最低分（全部0分）', () => {
      const answers = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 };
      const result = scoreUnified('gad7', answers);
      expect(result.score).toBe(0);
      expect(result.level).toBe('normal');
    });
    
    test('最高分（全部3分）', () => {
      const answers = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 };
      const result = scoreUnified('gad7', answers);
      expect(result.score).toBe(21);
      expect(result.level).toBe('severe');
    });
    
    test('轻度焦虑（5-9分）', () => {
      const answers = { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 0 };
      const result = scoreUnified('gad7', answers);
      expect(result.score).toBe(6);
      expect(result.level).toBe('mild');
    });
  });

  // PHQ-9 测试
  describe('PHQ-9 抑郁症筛查量表', () => {
    test('最低分', () => {
      const answers = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0 };
      const result = scoreUnified('phq9', answers);
      expect(result.score).toBe(0);
      expect(result.level).toBe('normal');
    });
    
    test('最高分', () => {
      const answers = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3 };
      const result = scoreUnified('phq9', answers);
      expect(result.score).toBe(27);
      expect(result.level).toBe('severe');
    });
  });

  // 学业压力测试
  describe('学业压力量表', () => {
    test('最低分', () => {
      const answers = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0 };
      const result = scoreUnified('academic_stress_8', answers);
      expect(result.score).toBe(0);
    });
    
    test('最高分', () => {
      const answers = { q1: 4, q2: 4, q3: 4, q4: 4, q5: 4, q6: 4, q7: 4, q8: 4 };
      const result = scoreUnified('academic_stress_8', answers);
      expect(result.score).toBe(32);
    });
  });
});

