/**
 * IELTS Scoring Utilities
 * Converts raw scores to IELTS band scores.
 */

export const getListeningBand = (score) => {
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 32) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 26) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 18) return 5.5;
  if (score >= 16) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  if (score >= 8)  return 3.5;
  if (score >= 6)  return 3.0;
  if (score >= 4)  return 2.5;
  if (score >= 2)  return 2.0;
  if (score >= 1)  return 1.0;
  return 0.0;
};

export const getAcademicReadingBand = (score) => {
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 33) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 27) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 19) return 5.5;
  if (score >= 15) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  if (score >= 8)  return 3.5;
  if (score >= 6)  return 3.0;
  if (score >= 4)  return 2.5;
  if (score >= 2)  return 2.0;
  if (score >= 1)  return 1.0;
  return 0.0;
};

/**
 * Rounds an average band score to the nearest valid IELTS overall band.
 * Rules: < 0.25 → round down, 0.25–0.74 → x.5, >= 0.75 → round up.
 */
export const roundOverallIELTS = (average) => {
  const whole = Math.floor(average);
  const fraction = average - whole;
  if (fraction < 0.25) return whole;
  if (fraction < 0.75) return whole + 0.5;
  return whole + 1.0;
};
