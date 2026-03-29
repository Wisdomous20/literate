import { Worker, Job } from "bullmq";
import { getRedis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { gradeEssayAnswer } from "@/service/comprehension-test/gradeEssayService";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";
import type { GradingJobData } from "@/lib/queues";

async function processGrading(job: Job<GradingJobData>) {
  const { assessmentId, comprehensionTestId } = job.data;
  console.log(`[Worker:grading] Processing ${assessmentId}`);

  // 1. Get the comprehension test with its answers
  const test = await prisma.comprehensionTest.findUnique({
    where: { id: comprehensionTestId },
    include: { answers: true },
  });
  if (!test) throw new Error(`ComprehensionTest ${comprehensionTestId} not found`);

  // 2. Get the assessment with passage content and quiz questions
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      passage: {
        select: {
          content: true,
          quiz: {
            include: {
              questions: {
                select: {
                  questionText: true,
                  type: true,
                  correctAnswer: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!assessment?.passage) {
    throw new Error(`Assessment or passage not found for ${assessmentId}`);
  }

  const passageContent = assessment.passage.content;

  // Build a map: question text → original Question record
  const questionsByText = new Map(
    (assessment.passage.quiz?.questions ?? []).map((q) => [q.questionText, q])
  );

  // 3. Grade each ungraded essay answer
  let correctCount = test.answers.filter((a) => a.isCorrect === true).length;

  for (const ans of test.answers) {
    // Skip already-graded answers (MC answers are graded at submission time)
    if (ans.isCorrect !== null) continue;

    // Match back to original Question by text
    const originalQuestion = questionsByText.get(ans.question);

    // Skip if not an essay
    if (!originalQuestion || originalQuestion.type !== "ESSAY") continue;

    console.log(`[Worker:grading] Grading essay: "${ans.question.slice(0, 50)}..."`);

    const result = await gradeEssayAnswer({
      questionText: ans.question,
      correctAnswer: originalQuestion.correctAnswer,
      studentAnswer: ans.answer,
      passageContent,
    });

    await prisma.comprehensionAnswer.update({
      where: { id: ans.id },
      data: { isCorrect: result.isCorrect },
    });

    if (result.isCorrect) correctCount++;
  }

  // 4. Recalculate score and level
  const totalItems = test.totalItems;
  const pct = totalItems > 0 ? (correctCount / totalItems) * 100 : 0;
  const level = pct >= 75 ? "INDEPENDENT" : pct >= 50 ? "INSTRUCTIONAL" : "FRUSTRATION";

  await prisma.comprehensionTest.update({
    where: { id: comprehensionTestId },
    data: { score: correctCount, classificationLevel: level },
  });

  console.log(`[Worker:grading] Done: ${correctCount}/${totalItems} (${level})`);

  // 5. Try to compute oral reading level
  try {
    await createOralReadingService(assessmentId, level);
    console.log(`[Worker:grading] Oral reading level computed`);
  } catch {
    // Expected if fluency hasn't completed yet
  }

  return { assessmentId, score: correctCount, level };
}

export const gradingWorker = new Worker<GradingJobData>(
  "grading",
  processGrading,
  { connection: getRedis(), concurrency: 3 },
);

gradingWorker.on("completed", (job) =>
  console.log(`[Worker:grading] Job ${job.id} done`)
);
gradingWorker.on("failed", (job, err) =>
  console.error(`[Worker:grading] Job ${job?.id} failed:`, err.message)
);
gradingWorker.on("error", (err) =>
  console.error("[Worker:grading] Worker error:", err.message)
);