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

  export async function gradeEssayAnswer(
    input: GradeEssayInput,
  ): Promise<GradeEssayResult> {
    const { questionText, correctAnswer, studentAnswer, passageContent } = input;

    if (!studentAnswer.trim()) {
      return { isCorrect: false, reasoning: "No answer provided." };
    }

    const systemPrompt = `You are a reading comprehension grader for elementary/middle school students.
  Be lenient with grammar/spelling — focus on understanding and intent.
  Respond ONLY with valid JSON: {"isCorrect": true/false, "reasoning": "brief explanation"}`;

    const userPrompt = `Passage excerpt:
  """
  ${passageContent.slice(0, 1000)}
  """
  Question: ${questionText}
  ${correctAnswer ? `Key points: ${correctAnswer}` : ""}
  Student answer: ${studentAnswer}
  Grade as correct or incorrect.`;

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

      const parsed = JSON.parse(content) as {
        isCorrect: boolean;
        reasoning: string;
      };
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
