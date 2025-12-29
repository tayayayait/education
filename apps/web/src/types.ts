export interface AchievementStandard {
  id: string;
  code: string;
  description: string;
  category: string;
}

export interface Problem {
  id: string;
  questionNumber: number;
  correctAnswer: string; // 'O' or 'X' for simplicity in MVP, or actual value
  linkedStandardId: string;
}

export interface StudentResult {
  id: string;
  name: string;
  answers: Record<number, boolean>; // Question Number -> Is Correct
}

export interface CategoryScore {
  category: string;
  score: number; // 0-100
  totalQuestions: number;
  correctCount: number;
}

export interface StandardScore {
  standardId: string;
  standardCode: string;
  description: string;
  score: number;
  status: 'Mastery' | 'Needs Review' | 'Critical Support Needed';
}

export interface DiagnosticReport {
  studentName: string;
  totalScore: number;
  categoryScores: CategoryScore[];
  standardScores: StandardScore[];
  weakestStandard: StandardScore | null;
  feedback: string;
}