export interface Question {
  a: number;
  b: number;
  answer: number;
}

export interface GameResult {
  question: Question;
  userAnswer: number | null;
  isCorrect: boolean;
}

/** 2~9단 모든 문제(72개) 생성 후 Fisher-Yates 셔플 */
export function generateQuestions(count: number, mode: 'multiply' | 'divide'): Question[] {
  const all: Question[] = [];
  for (let m = 2; m <= 9; m++) {
    for (let n = 1; n <= 9; n++) {
      if (mode === 'multiply') {
        all.push({ a: m, b: n, answer: m * n });
      } else {
        all.push({ a: m * n, b: m, answer: n });
      }
    }
  }
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}

export const COUNT_OPTIONS = [
  { label: '10문제', sub: '빠른 도전', value: 10 },
  { label: '20문제', sub: '보통 난이도', value: 20 },
  { label: '30문제', sub: '충분한 연습', value: 30 },
  { label: '전체', sub: '72문제 완전정복', value: 72 },
];
