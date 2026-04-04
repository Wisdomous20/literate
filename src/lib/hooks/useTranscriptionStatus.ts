import { useQuery } from "@tanstack/react-query";
import type { OralFluencyAnalysis } from "@/types/oral-reading";

interface TranscriptionStatus {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  assessmentId: string;
  sessionId: string;
  analysis?: OralFluencyAnalysis;
}

export function useTranscriptionStatus(
  assessmentId: string | null,
  options?: { interval?: number; enabled?: boolean }
) {
  const interval = options?.interval ?? 3000;

  return useQuery<TranscriptionStatus>({
    queryKey: ["transcription-status", assessmentId],
    queryFn: async () => {
      const res = await fetch(
        `/api/oral-reading/transcribe?assessmentId=${assessmentId}`
      );
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    enabled: !!assessmentId && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "FAILED") return false;
      return interval;
    },
    staleTime: 0,
  });
}