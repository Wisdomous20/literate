import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { enqueueTranscriptionService } from "./enqueueTranscriptionService";

type AudioAssessmentType = "ORAL_READING" | "READING_FLUENCY";

export interface CreateAudioAssessmentSessionInput {
  studentId: string;
  passageId: string;
  type: AudioAssessmentType;
  audioUrl: string;
  fileName?: string;
}

export interface CreateAudioAssessmentSessionResult {
  success: boolean;
  assessmentId?: string;
  sessionId?: string;
  status?: "PENDING";
  jobId?: string;
  error?: string;
  code?:
    | "VALIDATION_ERROR"
    | "DAILY_LIMIT_REACHED"
    | "NOT_FOUND"
    | "INTERNAL_ERROR";
}

export async function createAudioAssessmentSessionService(
  input: CreateAudioAssessmentSessionInput,
): Promise<CreateAudioAssessmentSessionResult> {
  const assessmentResult = await createAssessmentService({
    studentId: input.studentId,
    passageId: input.passageId,
    type: input.type,
  });

  if (!assessmentResult.success || !assessmentResult.assessment) {
    return {
      success: false,
      error: assessmentResult.error || "Failed to create assessment.",
      code: assessmentResult.code,
    };
  }

  const assessmentId = assessmentResult.assessment.id;
  const enqueueResult = await enqueueTranscriptionService({
    assessmentId,
    audioUrl: input.audioUrl,
    fileName: input.fileName,
  });

  if (!enqueueResult.success) {
    return {
      success: false,
      assessmentId,
      error: enqueueResult.error || "Failed to enqueue transcription.",
      code: enqueueResult.code,
    };
  }

  return {
    success: true,
    assessmentId,
    sessionId: enqueueResult.sessionId,
    status: "PENDING",
    jobId: enqueueResult.jobId,
  };
}
