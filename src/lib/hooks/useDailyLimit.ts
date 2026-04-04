import { useEffect, useState, useCallback } from "react";

interface DailyLimitUsage {
  ORAL_READING: number;
  COMPREHENSION: number;
  READING_FLUENCY: number;
}

interface DailyLimitStatus {
  isFreeUser: boolean;
  usage: DailyLimitUsage;
  limits: DailyLimitUsage;
  remaining: DailyLimitUsage;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook that fetches the current user's daily assessment limits.
 * For paid users, remaining values are -1 (unlimited).
 */
export function useDailyLimit(): DailyLimitStatus {
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [usage, setUsage] = useState<DailyLimitUsage>({
    ORAL_READING: 0,
    COMPREHENSION: 0,
    READING_FLUENCY: 0,
  });
  const [limits, setLimits] = useState<DailyLimitUsage>({
    ORAL_READING: -1,
    COMPREHENSION: -1,
    READING_FLUENCY: -1,
  });
  const [remaining, setRemaining] = useState<DailyLimitUsage>({
    ORAL_READING: -1,
    COMPREHENSION: -1,
    READING_FLUENCY: -1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/assessment/check-limit");
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to fetch limits");
        return;
      }

      setIsFreeUser(data.isFreeUser);
      setUsage(data.usage);
      setLimits(data.limits);
      setRemaining(data.remaining);
    } catch (err) {
      console.error("Failed to fetch daily limits:", err);
      setError("Failed to fetch daily limits");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  return {
    isFreeUser,
    usage,
    limits,
    remaining,
    isLoading,
    error,
    refetch: fetchLimits,
  };
}

/**
 * Helper: check if a specific assessment type is still available today.
 * Returns true if unlimited (-1) or remaining > 0.
 */
export function canTakeAssessment(
  remaining: DailyLimitUsage,
  type: keyof DailyLimitUsage
): boolean {
  const value = remaining[type];
  return value === -1 || value > 0;
}