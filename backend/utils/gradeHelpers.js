// Q1=A grade scale, Q2=B GPA points
const GRADE_SCALE = [
  { min: 70, grade: 'A', points: 5.0 },
  { min: 60, grade: 'B', points: 4.0 },
  { min: 50, grade: 'C', points: 3.0 },
  { min: 40, grade: 'D', points: 2.0 },
  { min:  0, grade: 'E', points: 1.0 },
];

function computeGrade(finalMark) {
  if (finalMark == null || isNaN(finalMark)) return { grade: null, points: null };
  const rounded = Math.round(finalMark * 100) / 100;
  for (const row of GRADE_SCALE) {
    if (rounded >= row.min) return { grade: row.grade, points: row.points };
  }
  return { grade: 'E', points: 1.0 };
}

// Validate that a unit's assessment weights sum to 100
function validateWeights(assessments, excludeId = null) {
  const total = assessments
    .filter((a) => !excludeId || String(a._id) !== String(excludeId))
    .reduce((sum, a) => sum + (Number(a.weight) || 0), 0);
  return {
    total: Math.round(total * 100) / 100,
    valid: Math.abs(total - 100) < 0.01,
  };
}

// Given a list of marks + assessments for one student in one unit,
// compute { coursework, exam, final, grade, points }
function computeStudentUnitResult(assessments, marks) {
  let coursework = 0;
  let exam = 0;
  let allGraded = true;

  for (const a of assessments) {
    const mark = marks.find((m) => String(m.assessmentId) === String(a._id));
    if (!mark || mark.score == null) { allGraded = false; continue; }

    const pct = (Number(mark.score) / Number(a.maxScore)) * 100;
    const weighted = (pct * Number(a.weight)) / 100;

    if (a.type === 'exam') exam += weighted;
    else coursework += weighted;
  }

  const final = coursework + exam;
  const { grade, points } = computeGrade(final);
  return {
    coursework: Math.round(coursework * 100) / 100,
    exam:       Math.round(exam * 100) / 100,
    final:      Math.round(final * 100) / 100,
    grade,
    points,
    allGraded,
  };
}

module.exports = {
  GRADE_SCALE,
  computeGrade,
  validateWeights,
  computeStudentUnitResult,
};
