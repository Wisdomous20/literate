import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: mockCreate } };
  },
}));

import { gradeEssayAnswer } from "../gradeEssayService";

const baseInput = {
  questionText: "What is the main idea of the passage?",
  correctAnswer: "The story is about friendship.",
  studentAnswer: "The passage talks about how two friends help each other.",
  passageContent: "Once upon a time, two friends lived in a small village...",
};

describe("gradeEssayAnswer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns isCorrect false immediately when studentAnswer is empty", async () => {
    const result = await gradeEssayAnswer({ ...baseInput, studentAnswer: "   " });

    expect(result.isCorrect).toBe(false);
    expect(result.reasoning).toBe("No answer provided.");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns isCorrect true when the AI grades as correct", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ isCorrect: true, reasoning: "Good answer." }) } }],
    });

    const result = await gradeEssayAnswer(baseInput);

    expect(result.isCorrect).toBe(true);
    expect(result.reasoning).toBe("Good answer.");
  });

  it("returns isCorrect false when the AI grades as incorrect", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ isCorrect: false, reasoning: "Misses the point." }) } }],
    });

    const result = await gradeEssayAnswer(baseInput);

    expect(result.isCorrect).toBe(false);
    expect(result.reasoning).toBe("Misses the point.");
  });

  it("returns failure when the AI returns no content", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const result = await gradeEssayAnswer(baseInput);

    expect(result.isCorrect).toBe(false);
    expect(result.reasoning).toBe("Failed to get grading response.");
  });

  it("returns failure gracefully when the OpenAI call throws", async () => {
    mockCreate.mockRejectedValue(new Error("API error"));

    const result = await gradeEssayAnswer(baseInput);

    expect(result.isCorrect).toBe(false);
    expect(result.reasoning).toBe("Grading service unavailable.");
  });

  it("truncates passageContent to 1000 characters in the prompt", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ isCorrect: true, reasoning: "OK" }) } }],
    });

    const longPassage = "x".repeat(2000);

    await gradeEssayAnswer({ ...baseInput, passageContent: longPassage });

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === "user").content;
    expect(userMessage).toContain("x".repeat(1000));
    expect(userMessage).not.toContain("x".repeat(1001));
  });
});
