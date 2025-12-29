import {
  StudentResult,
  Problem,
  AchievementStandard,
  DiagnosticReport,
  CategoryScore,
  StandardScore
} from '../types';

export const analyzeStudent = (
  student: StudentResult,
  problems: Problem[],
  standards: AchievementStandard[]
): DiagnosticReport => {
  const categoryStats: Record<string, { total: number; correct: number }> = {};
  const standardStats: Record<string, { total: number; correct: number; standard: AchievementStandard }> = {};
  let totalCorrect = 0;

  standards.forEach(std => {
    standardStats[std.id] = { total: 0, correct: 0, standard: std };
    if (!categoryStats[std.category]) {
      categoryStats[std.category] = { total: 0, correct: 0 };
    }
  });

  problems.forEach(problem => {
    const isCorrect = student.answers[problem.questionNumber] || false;
    const stdId = problem.linkedStandardId;
    const std = standardStats[stdId]?.standard;

    if (std) {
      standardStats[stdId].total += 1;
      categoryStats[std.category].total += 1;

      if (isCorrect) {
        standardStats[stdId].correct += 1;
        categoryStats[std.category].correct += 1;
        totalCorrect += 1;
      }
    }
  });

  const categoryScores: CategoryScore[] = Object.keys(categoryStats).map(cat => {
    const { total, correct } = categoryStats[cat];
    return {
      category: cat,
      totalQuestions: total,
      correctCount: correct,
      score: total === 0 ? 0 : Math.round((correct / total) * 100)
    };
  });

  const standardScores: StandardScore[] = Object.values(standardStats).map(stat => {
    const percentage = stat.total === 0 ? 0 : Math.round((stat.correct / stat.total) * 100);
    let status: StandardScore['status'] = 'Critical Support Needed';
    if (percentage >= 80) status = 'Mastery';
    else if (percentage >= 50) status = 'Needs Review';

    return {
      standardId: stat.standard.id,
      standardCode: stat.standard.code,
      description: stat.standard.description,
      score: percentage,
      status
    };
  });

  const weaknesses = standardScores.filter(s => s.score < 80).sort((a, b) => a.score - b.score);
  const weakestStandard = weaknesses.length > 0 ? weaknesses[0] : null;

  const totalScore = problems.length === 0 ? 0 : Math.round((totalCorrect / problems.length) * 100);
  let feedback = '';

  if (totalScore >= 90) {
    feedback = '전반적으로 매우 우수합니다. 대부분 성취기준을 안정적으로 달성했으며 심화 학습을 추천합니다.';
  } else if (totalScore >= 70) {
    feedback = '기본 개념은 이해하고 있으나 일부 영역에서 보완이 필요합니다. 취약 성취기준을 중심으로 복습하세요.';
  } else {
    feedback = '핵심 개념 이해가 부족합니다. 기초 문제부터 단계적으로 연습하고 보충학습을 권장합니다.';
  }

  return {
    studentName: student.name,
    totalScore,
    categoryScores,
    standardScores,
    weakestStandard,
    feedback
  };
};
