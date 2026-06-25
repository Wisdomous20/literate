export function normalizeAnswerForExactMatch(answer: string | null | undefined) {
  return (answer ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function answersMatchExactly(
  guideAnswer: string | null | undefined,
  studentAnswer: string | null | undefined,
) {
  const normalizedGuide = normalizeAnswerForExactMatch(guideAnswer);
  const normalizedStudent = normalizeAnswerForExactMatch(studentAnswer);

  return normalizedGuide.length > 0 && normalizedGuide === normalizedStudent;
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "another",
  "because",
  "before",
  "being",
  "between",
  "could",
  "every",
  "from",
  "have",
  "into",
  "more",
  "must",
  "only",
  "other",
  "over",
  "right",
  "same",
  "should",
  "some",
  "still",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "when",
  "where",
  "which",
  "while",
  "will",
  "with",
  "would",
  "your",
]);

function significantTerms(answer: string | null | undefined) {
  const normalized = normalizeAnswerForExactMatch(answer);
  const matches = normalized.match(/[a-z0-9]+/g) ?? [];

  return new Set(
    matches.filter((term) => term.length > 2 && !STOP_WORDS.has(term)),
  );
}

function coverage(source: Set<string>, target: Set<string>) {
  if (source.size === 0) return 0;

  let matches = 0;
  for (const term of source) {
    if (target.has(term)) matches++;
  }

  return matches / source.size;
}

export function answerMatchesGuide(
  guideAnswer: string | null | undefined,
  studentAnswer: string | null | undefined,
) {
  if (answersMatchExactly(guideAnswer, studentAnswer)) return true;

  const guideTerms = significantTerms(guideAnswer);
  const studentTerms = significantTerms(studentAnswer);

  if (guideTerms.size === 0 || studentTerms.size === 0) return false;

  const guideCoverage = coverage(guideTerms, studentTerms);
  const studentCoverage = coverage(studentTerms, guideTerms);

  return guideCoverage >= 0.75 || (guideCoverage >= 0.6 && studentCoverage >= 0.85);
}
