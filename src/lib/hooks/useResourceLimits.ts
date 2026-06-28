import { useCallback, useEffect, useState } from "react";

interface ResourceLimit {
  count: number;
  /** -1 means unlimited (paid). */
  max: number;
}

interface ResourceLimitsState {
  isFreeUser: boolean;
  classes: ResourceLimit;
  students: ResourceLimit;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const UNLIMITED: ResourceLimit = { count: 0, max: -1 };

/**
 * Hook that fetches the current user's class/student caps so the UI can disable
 * "Create class" / "Add student" and show an upgrade CTA pre-emptively.
 */
export function useResourceLimits(): ResourceLimitsState {
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [classes, setClasses] = useState<ResourceLimit>(UNLIMITED);
  const [students, setStudents] = useState<ResourceLimit>(UNLIMITED);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/resource-limits");
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to fetch resource limits");
        return;
      }

      setIsFreeUser(data.isFreeUser);
      setClasses(data.classes);
      setStudents(data.students);
    } catch (err) {
      console.error("Failed to fetch resource limits:", err);
      setError("Failed to fetch resource limits");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  return { isFreeUser, classes, students, isLoading, error, refetch: fetchLimits };
}

/**
 * Helper: whether the user can still create another resource of this kind.
 * Returns true when unlimited (-1) or under the cap.
 */
export function canCreateResource(limit: ResourceLimit): boolean {
  return limit.max === -1 || limit.count < limit.max;
}
