import { AchievementStandard, Problem } from '../types';

export const CATEGORIES = [
  '수와 연산',
  '도형',
  '측정',
  '규칙성',
  '자료와 가능성'
];

export const STANDARDS: AchievementStandard[] = [
  { id: 'S1', code: '4수1-01', category: '수와 연산', description: '자연수의 개념을 이해하고 자리값을 설명할 수 있다.' },
  { id: 'S2', code: '4수1-02', category: '수와 연산', description: '덧셈·뺄셈의 계산 원리를 이해하고 계산할 수 있다.' },
  { id: 'S3', code: '4도2-01', category: '도형', description: '각의 개념을 이해하고 기본 도형의 성질을 설명할 수 있다.' },
  { id: 'S4', code: '4도2-02', category: '도형', description: '대칭의 의미를 이해하고 간단한 도형을 그릴 수 있다.' },
  { id: 'S5', code: '4측3-01', category: '측정', description: '길이와 넓이를 적절한 단위로 측정할 수 있다.' },
  { id: 'S6', code: '4규4-01', category: '규칙성', description: '수의 규칙을 찾아 다음 항을 예측할 수 있다.' },
  { id: 'S7', code: '4자5-01', category: '자료와 가능성', description: '간단한 자료를 분류하고 표나 그래프로 나타낼 수 있다.' }
];

export const PROBLEMS: Problem[] = [
  { id: 'P1', questionNumber: 1, correctAnswer: 'O', linkedStandardId: 'S1' },
  { id: 'P2', questionNumber: 2, correctAnswer: 'O', linkedStandardId: 'S1' },
  { id: 'P3', questionNumber: 3, correctAnswer: 'O', linkedStandardId: 'S1' },
  { id: 'P4', questionNumber: 4, correctAnswer: 'O', linkedStandardId: 'S2' },
  { id: 'P5', questionNumber: 5, correctAnswer: 'O', linkedStandardId: 'S2' },
  { id: 'P6', questionNumber: 6, correctAnswer: 'O', linkedStandardId: 'S2' },
  { id: 'P7', questionNumber: 7, correctAnswer: 'O', linkedStandardId: 'S3' },
  { id: 'P8', questionNumber: 8, correctAnswer: 'O', linkedStandardId: 'S3' },
  { id: 'P9', questionNumber: 9, correctAnswer: 'O', linkedStandardId: 'S3' },
  { id: 'P10', questionNumber: 10, correctAnswer: 'O', linkedStandardId: 'S4' },
  { id: 'P11', questionNumber: 11, correctAnswer: 'O', linkedStandardId: 'S4' },
  { id: 'P12', questionNumber: 12, correctAnswer: 'O', linkedStandardId: 'S5' },
  { id: 'P13', questionNumber: 13, correctAnswer: 'O', linkedStandardId: 'S5' },
  { id: 'P14', questionNumber: 14, correctAnswer: 'O', linkedStandardId: 'S5' },
  { id: 'P15', questionNumber: 15, correctAnswer: 'O', linkedStandardId: 'S6' },
  { id: 'P16', questionNumber: 16, correctAnswer: 'O', linkedStandardId: 'S6' },
  { id: 'P17', questionNumber: 17, correctAnswer: 'O', linkedStandardId: 'S6' },
  { id: 'P18', questionNumber: 18, correctAnswer: 'O', linkedStandardId: 'S7' },
  { id: 'P19', questionNumber: 19, correctAnswer: 'O', linkedStandardId: 'S7' },
  { id: 'P20', questionNumber: 20, correctAnswer: 'O', linkedStandardId: 'S7' }
];
