import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GradeEssayInput {
  questionText: string;
  correctAnswer: string | null;
  studentAnswer: string;
  passageContent: string;
}

interface GradeEssayResult {
  isCorrect: boolean;
  reasoning: string;
}

export async function gradeEssayAnswer(input: GradeEssayInput): Promise<GradeEssayResult> {
  const { questionText, correctAnswer, studentAnswer, passageContent } = input;

  if (!studentAnswer.trim()) {
    return { isCorrect: false, reasoning: "No answer provided." };
  }

  const systemPrompt = `You are a reading comprehension grader for elementary/middle school students. 
You must grade the student's essay answer as either CORRECT (1) or INCORRECT (0).
Be lenient with grammar and spelling — focus on whether the student demonstrates understanding of the passage and answers the question's intent.
Respond ONLY with valid JSON: {"isCorrect": true/false, "reasoning": "brief explanation"}`;

  const userPrompt = `Passage:
"""
${passageContent}
"""

Question: ${questionText}
${correctAnswer ? `Expected Answer/Key Points: ${correctAnswer}` : ""}
Student's Answer: ${studentAnswer}

Grade this answer as correct (1) or incorrect (0).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { isCorrect: false, reasoning: "Failed to get grading response." };
    }

    const parsed = JSON.parse(content) as { isCorrect: boolean; reasoning: string };
    return {
      isCorrect: !!parsed.isCorrect,
      reasoning: parsed.reasoning || "",
    };
  } catch (error) {
    console.error("Essay grading error:", error);
    // Fallback: mark as incorrect if AI fails
    return { isCorrect: false, reasoning: "Grading service unavailable." };
  }
}