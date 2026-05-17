import OpenAI from "openai";
import { Tags } from "@/generated/prisma/enums";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GradeEssayInput {
  questionText: string;
  correctAnswer: string | null;
  studentAnswer: string;
  passageContent: string;
  tag: Tags;
}

interface GradeEssayResult {
  isCorrect: boolean;
  reasoning: string;
  confidence?: number;
  needsReview?: boolean;
}

const DIMENSION_GUIDANCE: Record<Tags, string> = {
  [Tags.Literal]:
    "Literal: award 1 only for accurate retrieval of facts explicitly stated in the text. Award 0 for factual errors or unsupported added details.",
  [Tags.Inferential]:
    "Inferential: award 1 only when the answer uses textual clues to reach a logical conclusion beyond the exact wording. Award 0 for unsupported conclusions or mere repetition without inference.",
  [Tags.Critical]:
    "Critical: award 1 only when the answer shows judgment, author-intent evaluation, or theme application anchored in the text. Award 0 for purely subjective opinions with no textual grounding.",
};

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function requiresExplanation(questionText: string, tag: Tags) {
  if (tag !== Tags.Literal) return true;

  return /\b(why|how|explain|describe|compare|infer|lesson|theme|opinion|judge)\b/i.test(
    questionText,
  );
}

function isTooVague(questionText: string, studentAnswer: string, tag: Tags) {
  return requiresExplanation(questionText, tag) && countWords(studentAnswer) <= 1;
}

export async function gradeEssayAnswer(
  input: GradeEssayInput,
): Promise<GradeEssayResult> {
  const { questionText, correctAnswer, studentAnswer, passageContent, tag } = input;

  if (!studentAnswer.trim()) {
    return { isCorrect: false, reasoning: "No answer provided." };
  }

  if (isTooVague(questionText, studentAnswer, tag)) {
    return {
      isCorrect: false,
      reasoning:
        "Answer is too vague to demonstrate understanding for this question.",
      confidence: 1,
      needsReview: false,
    };
  }

  const systemPrompt = `You are grading a Phil-IRI style reading-comprehension essay using the LiteRate binary scoring framework.
Score only 1 or 0.
Prioritize meaning over mechanics. Ignore grammar, spelling, punctuation, and code-switching if the meaning is clear.
Use only the supplied passage and answer key. Do not use outside knowledge. If the student states something contradicted by or unsupported by the passage, score 0.
One-word or otherwise vague answers score 0 when they do not provide enough evidence of understanding.
${DIMENSION_GUIDANCE[tag]}
Return ONLY valid JSON with this shape:
{"isCorrect":true,"reasoning":"brief explanation","confidence":0.0,"needsReview":false}`;

  const userPrompt = `Passage excerpt:
"""
${passageContent.slice(0, 1000)}
"""

Question dimension: ${tag}
Question: ${questionText}
${correctAnswer ? `Validated answer key / target concept: ${correctAnswer}` : ""}
Student answer: ${studentAnswer}

Grade the answer using LiteRate's binary rubric. Set needsReview to true when the answer is in a high-uncertainty zone.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 250,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { isCorrect: false, reasoning: "Failed to get grading response." };
    }

    const parsed = JSON.parse(content) as GradeEssayResult;

    return {
      isCorrect: !!parsed.isCorrect,
      reasoning: parsed.reasoning || "",
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : undefined,
      needsReview:
        typeof parsed.needsReview === "boolean" ? parsed.needsReview : undefined,
    };
  } catch (error) {
    console.error("Essay grading error:", error);
    return { isCorrect: false, reasoning: "Grading service unavailable." };
  }
}
