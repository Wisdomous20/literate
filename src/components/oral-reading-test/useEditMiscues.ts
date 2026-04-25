"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { MiscueResult } from "@/types/oral-reading";
import { fetchOralFluencyMiscues } from "@/app/actions/oral-fluency/getMiscues";
import { updateMiscueAction } from "@/app/actions/oral-fluency/updateMiscue";

// ─── Local Types ───

export type MiscueType = MiscueResult["miscueType"];
export type EditTool = MiscueType | null;

export interface EditableMiscueResult extends MiscueResult {
  id?: string;
  repetitionCount?: number;
}

interface EditState {
  miscues: EditableMiscueResult[];
}

export interface EditMetrics {
  totalMiscues: number;
  oralFluencyScore: number;
  classificationLevel: "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION";
}

export type ClickResult =
  | { action: "added" }
  | { action: "needsText"; wordIndex: number; expectedWord: string }
  | { action: "needsRepetition"; wordIndex: number; expectedWord: string }
  | { action: "waitingSecond" }
  | null;

// ─── Helpers ───

function computeMetrics(
  miscues: EditableMiscueResult[],
  totalWords: number,
): EditMetrics {
  const nonSelfCorrected = miscues.filter((m) => !m.isSelfCorrected).length;
  const score =
    totalWords > 0
      ? Math.round(
          ((totalWords - nonSelfCorrected) / totalWords) * 100 * 10,
        ) / 10
      : 0;
  const classificationLevel: EditMetrics["classificationLevel"] =
    score >= 97 ? "INDEPENDENT" : score >= 90 ? "INSTRUCTIONAL" : "FRUSTRATION";
  return { totalMiscues: nonSelfCorrected, oralFluencyScore: score, classificationLevel };
}

function miscueKey(m: { wordIndex: number; miscueType: string; expectedWord: string }) {
  return `${m.wordIndex}::${m.miscueType}::${m.expectedWord}`;
}

// ─── Backend sync ───

async function syncEditsToBackend(
  sessionId: string,
  originalMiscues: EditableMiscueResult[],
  editedMiscues: EditableMiscueResult[],
): Promise<EditMetrics | null> {
  if (!sessionId) return null;

  // 1. Fetch DB miscues to get IDs
  const dbResult = await fetchOralFluencyMiscues(sessionId);
  if (!dbResult.success || !dbResult.data) return null;

  const dbById = new Map<string, typeof dbResult.data[number]>();
  for (const m of dbResult.data) {
    dbById.set(miscueKey(m), m);
  }

  // 2. Build sets for diff
  const originalKeys = new Set(originalMiscues.map(miscueKey));
  const editedMap = new Map<string, EditableMiscueResult>();
  for (const m of editedMiscues) {
    editedMap.set(miscueKey(m), m);
  }

  let lastMetrics: EditMetrics | null = null;

  // 3. Find removed miscues (in original but not in edited) → delete
  for (const orig of originalMiscues) {
    const key = miscueKey(orig);
    if (!editedMap.has(key)) {
      const dbEntry = dbById.get(key);
      if (dbEntry) {
        const result = await updateMiscueAction({
          miscueId: dbEntry.id,
          action: "delete",
        });
        if (result.success && result.updatedMetrics) {
          lastMetrics = {
            totalMiscues: result.updatedMetrics.totalMiscues,
            oralFluencyScore: result.updatedMetrics.oralFluencyScore,
            classificationLevel: result.updatedMetrics.classificationLevel as EditMetrics["classificationLevel"],
          };
        }
      }
    }
  }

  // 4. Find type-changed miscues → update
  // To detect type changes: look for original miscues where the key changed
  // because miscueType is part of the key. Instead, match by (wordIndex, expectedWord)
  for (const orig of originalMiscues) {
    const origKey = miscueKey(orig);
    if (editedMap.has(origKey)) continue; // unchanged or already handled as removal

    // Find if there's an edited miscue at the same position with different type
    const edited = editedMiscues.find(
      (e) =>
        e.wordIndex === orig.wordIndex &&
        e.expectedWord === orig.expectedWord &&
        e.miscueType !== orig.miscueType &&
        !originalKeys.has(miscueKey(e)), // it's truly new to that position
    );

    if (edited) {
      const dbEntry = dbById.get(origKey);
      if (dbEntry) {
        const result = await updateMiscueAction({
          miscueId: dbEntry.id,
          action: "update",
          newMiscueType: edited.miscueType,
        });
        if (result.success && result.updatedMetrics) {
          lastMetrics = {
            totalMiscues: result.updatedMetrics.totalMiscues,
            oralFluencyScore: result.updatedMetrics.oralFluencyScore,
            classificationLevel: result.updatedMetrics.classificationLevel as EditMetrics["classificationLevel"],
          };
        }
      }
    }
  }

  return lastMetrics;
}

// ─── Hook ───

export function useEditMiscues({
  originalMiscues,
  totalWords,
  sessionId,
  onSave,
}: {
  originalMiscues: EditableMiscueResult[];
  totalWords: number;
  sessionId?: string;
  onSave?: (
    miscues: EditableMiscueResult[],
    metrics: EditMetrics,
  ) => Promise<void> | void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMiscues, setEditedMiscues] = useState<EditableMiscueResult[]>(
    [],
  );
  const [activeTool, setActiveTool] = useState<EditTool>(null);
  const [transpositionFirst, setTranspositionFirst] = useState<number | null>(
    null,
  );
  const [undoStack, setUndoStack] = useState<EditState[]>([]);
  const [redoStack, setRedoStack] = useState<EditState[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const originalRef = useRef<EditableMiscueResult[]>(originalMiscues);

  // Keep originalRef in sync when not editing
  useEffect(() => {
    if (!isEditing) {
      originalRef.current = originalMiscues;
    }
  }, [originalMiscues, isEditing]);

  const currentMetrics = useMemo(
    () =>
      computeMetrics(
        isEditing ? editedMiscues : originalMiscues,
        totalWords,
      ),
    [isEditing, editedMiscues, originalMiscues, totalWords],
  );

  const pushUndo = useCallback((miscues: EditableMiscueResult[]) => {
    setUndoStack((prev) => [...prev, { miscues }]);
    setRedoStack([]);
  }, []);

  const enterEditMode = useCallback(() => {
    setEditedMiscues([...originalRef.current]);
    setUndoStack([]);
    setRedoStack([]);
    setActiveTool(null);
    setTranspositionFirst(null);
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedMiscues([]);
    setActiveTool(null);
    setTranspositionFirst(null);
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const resetAll = useCallback(() => {
    setEditedMiscues([...originalRef.current]);
    setUndoStack([]);
    setRedoStack([]);
    setActiveTool(null);
    setTranspositionFirst(null);
  }, []);

  const saveEdit = useCallback(async () => {
    setIsSaving(true);
    try {
      // Sync changes to backend if sessionId is available
      if (sessionId) {
        await syncEditsToBackend(sessionId, originalRef.current, editedMiscues);
      }

      const metrics = computeMetrics(editedMiscues, totalWords);
      await onSave?.(editedMiscues, metrics);
      originalRef.current = editedMiscues;
      setIsEditing(false);
      setUndoStack([]);
      setRedoStack([]);
      setActiveTool(null);
      setTranspositionFirst(null);
    } finally {
      setIsSaving(false);
    }
  }, [editedMiscues, totalWords, onSave, sessionId]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, { miscues: editedMiscues }]);
    setUndoStack((u) => u.slice(0, -1));
    setEditedMiscues(prev.miscues);
  }, [undoStack, editedMiscues]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, { miscues: editedMiscues }]);
    setRedoStack((r) => r.slice(0, -1));
    setEditedMiscues(next.miscues);
  }, [redoStack, editedMiscues]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      } else if (e.key === "Escape") {
        setActiveTool(null);
        setTranspositionFirst(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isEditing, undo, redo]);

  // ─── Word interaction ───

  const handleWordClick = useCallback(
    (wordIndex: number, expectedWord: string): ClickResult => {
      if (!activeTool) return null;

      const tool = activeTool;

      // TRANSPOSITION needs two clicks
      if (tool === "TRANSPOSITION") {
        if (transpositionFirst === null) {
          setTranspositionFirst(wordIndex);
          return { action: "waitingSecond" };
        }
        const first = transpositionFirst;
        setTranspositionFirst(null);
        if (first === wordIndex) return null;

        pushUndo(editedMiscues);
        setEditedMiscues((prev) => [
          ...prev,
          {
            miscueType: "TRANSPOSITION",
            expectedWord,
            spokenWord: null,
            wordIndex: Math.min(first, wordIndex),
            wordIndexB: Math.max(first, wordIndex),
            timestamp: null,
            isSelfCorrected: false,
          },
        ]);
        return { action: "added" };
      }

      // Tools that need text input
      if (
        tool === "SUBSTITUTION" ||
        tool === "MISPRONUNCIATION" ||
        tool === "REVERSAL"
      ) {
        return { action: "needsText", wordIndex, expectedWord };
      }

      // REPETITION needs a count
      if (tool === "REPETITION") {
        return { action: "needsRepetition", wordIndex, expectedWord };
      }

      // OMISSION — direct add
      if (tool === "OMISSION") {
        pushUndo(editedMiscues);
        setEditedMiscues((prev) => [
          ...prev,
          {
            miscueType: "OMISSION",
            expectedWord,
            spokenWord: null,
            wordIndex,
            timestamp: null,
            isSelfCorrected: false,
          },
        ]);
        return { action: "added" };
      }

      // SELF_CORRECTION — direct add
      if (tool === "SELF_CORRECTION") {
        pushUndo(editedMiscues);
        setEditedMiscues((prev) => [
          ...prev,
          {
            miscueType: "SELF_CORRECTION",
            expectedWord,
            spokenWord: expectedWord,
            wordIndex,
            timestamp: null,
            isSelfCorrected: true,
          },
        ]);
        return { action: "added" };
      }

      return null;
    },
    [activeTool, transpositionFirst, editedMiscues, pushUndo],
  );

  const confirmTextMiscue = useCallback(
    (wordIndex: number, expectedWord: string, spokenWord: string) => {
      if (!activeTool) return;
      pushUndo(editedMiscues);
      setEditedMiscues((prev) => [
        ...prev,
        {
          miscueType: activeTool,
          expectedWord,
          spokenWord,
          wordIndex,
          timestamp: null,
          isSelfCorrected: false,
        },
      ]);
    },
    [activeTool, editedMiscues, pushUndo],
  );

  const confirmRepetitionMiscue = useCallback(
    (wordIndex: number, expectedWord: string, count: number) => {
      pushUndo(editedMiscues);
      setEditedMiscues((prev) => [
        ...prev,
        {
          miscueType: "REPETITION",
          expectedWord,
          spokenWord: expectedWord,
          wordIndex,
          timestamp: null,
          isSelfCorrected: false,
          repetitionCount: count,
        },
      ]);
    },
    [editedMiscues, pushUndo],
  );

  const removeMiscue = useCallback(
    (index: number) => {
      pushUndo(editedMiscues);
      setEditedMiscues((prev) => prev.filter((_, i) => i !== index));
    },
    [editedMiscues, pushUndo],
  );

  const updateMiscue = useCallback(
    (index: number, updates: Partial<EditableMiscueResult>) => {
      pushUndo(editedMiscues);
      setEditedMiscues((prev) =>
        prev.map((m, i) => (i === index ? { ...m, ...updates } : m)),
      );
    },
    [editedMiscues, pushUndo],
  );

  return {
    isEditing,
    editedMiscues,
    activeTool,
    transpositionFirst,
    undoStack,
    redoStack,
    isSaving,
    currentMetrics,
    setActiveTool,
    enterEditMode,
    cancelEdit,
    resetAll,
    saveEdit,
    undo,
    redo,
    handleWordClick,
    confirmTextMiscue,
    confirmRepetitionMiscue,
    removeMiscue,
    updateMiscue,
  };
}
