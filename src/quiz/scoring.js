// Funnel Health Diagnostic — scoring logic (pure functions).
//
// Formula (per spec):
//   Funnel Health Score = 100 - ((Total Risk Points ÷ Maximum Applicable Points) × 100)
//   rounded to the nearest whole number.
//
// answers is a map { [questionId]: selectedOptionIndex } for scored questions 7–33.

import {
  DIAGNOSTIC_QUESTIONS,
  CATEGORIES,
  CATEGORY_LEVELS,
  RESULT_LEVELS,
  CRITICAL_QUESTIONS,
  MAX_POINTS_PER_QUESTION,
} from "./quizData.js";

const QUESTION_BY_ID = new Map(DIAGNOSTIC_QUESTIONS.map((q) => [q.id, q]));

export function pointsForAnswer(questionId, optionIndex) {
  const q = QUESTION_BY_ID.get(Number(questionId));
  if (!q || optionIndex == null) return 0;
  const option = q.options[optionIndex];
  return option ? option.points : 0;
}

export function getResultLevel(score) {
  return (
    RESULT_LEVELS.find((l) => score >= l.min && score <= l.max) ||
    RESULT_LEVELS[RESULT_LEVELS.length - 1]
  );
}

export function getCategoryLevel(score) {
  return (
    CATEGORY_LEVELS.find((l) => score >= l.min && score <= l.max) ||
    CATEGORY_LEVELS[0]
  );
}

// Have all 27 scored questions been answered?
export function allScoredAnswered(answers) {
  return DIAGNOSTIC_QUESTIONS.every((q) => answers[q.id] != null);
}

export function firstUnansweredScoredId(answers) {
  const q = DIAGNOSTIC_QUESTIONS.find((question) => answers[question.id] == null);
  return q ? q.id : null;
}

export function computeResults(answers) {
  const perQuestionPoints = {};
  let totalRiskPoints = 0;
  let answeredCount = 0;

  for (const q of DIAGNOSTIC_QUESTIONS) {
    const idx = answers[q.id];
    if (idx == null) continue;
    const pts = pointsForAnswer(q.id, idx);
    perQuestionPoints[q.id] = pts;
    totalRiskPoints += pts;
    answeredCount += 1;
  }

  // Only answered questions are "applicable" — with all 27 answered this is 81.
  const maxApplicablePoints = answeredCount * MAX_POINTS_PER_QUESTION;
  const healthScore =
    maxApplicablePoints === 0
      ? 0
      : Math.round(100 - (totalRiskPoints / maxApplicablePoints) * 100);

  const categoryScores = CATEGORIES.map((cat) => {
    const score = cat.questionIds.reduce(
      (sum, qid) => sum + (perQuestionPoints[qid] ?? 0),
      0
    );
    const level = getCategoryLevel(score);
    return {
      id: cat.id,
      name: cat.name,
      score,
      max: cat.questionIds.length * MAX_POINTS_PER_QUESTION,
      level: level.label,
      levelShort: level.short,
    };
  });

  // Top 3 leaks: highest category risk first; ties resolved by category order.
  const topLeaks = categoryScores
    .map((c, order) => ({ ...c, order }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 3)
    .map(({ order, ...c }) => c);

  // Critical override: any listed question answered with 2 or 3 points.
  const criticalFlags = Object.entries(CRITICAL_QUESTIONS)
    .map(([qid, label]) => ({
      id: Number(qid),
      label,
      points: perQuestionPoints[qid] ?? 0,
    }))
    .filter((f) => f.points >= 2)
    .sort((a, b) => b.points - a.points || a.id - b.id);

  return {
    totalRiskPoints,
    maxApplicablePoints,
    healthScore,
    resultLevel: getResultLevel(healthScore),
    categoryScores,
    topLeaks,
    criticalFlags,
    perQuestionPoints,
  };
}
