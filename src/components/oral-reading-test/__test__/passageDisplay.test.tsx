import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PassageDisplay, type EditModeCallbacks } from "../passageDisplay";
import type { EditableMiscueResult } from "../useEditMiscues";

function createEditMode(
  editedMiscues: EditableMiscueResult[],
): EditModeCallbacks {
  return {
    isEditing: true,
    editedMiscues,
    activeTool: null,
    transpositionFirst: null,
    undoStack: [],
    redoStack: [],
    isSaving: false,
    hasUnsavedChanges: false,
    setActiveTool: vi.fn(),
    enterEditMode: vi.fn(),
    cancelEdit: vi.fn(),
    closeEdit: vi.fn(() => true),
    resetAll: vi.fn(),
    saveEdit: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    handleWordClick: vi.fn(() => null),
    confirmTextMiscue: vi.fn(),
    confirmRepetitionMiscue: vi.fn(),
    removeMiscue: vi.fn(),
    updateMiscue: vi.fn(),
  };
}

describe("PassageDisplay", () => {
  it("updates existing miscues locally while editing instead of calling backend handlers", async () => {
    const user = userEvent.setup();
    const miscues: EditableMiscueResult[] = [
      {
        miscueType: "SUBSTITUTION",
        expectedWord: "cat",
        spokenWord: "bat",
        wordIndex: 0,
        timestamp: null,
        isSelfCorrected: false,
      },
    ];
    const editMode = createEditMode(miscues);
    const onUpdateMiscueType = vi.fn();

    render(
      <PassageDisplay
        content="cat"
        miscues={miscues}
        editMode={editMode}
        onUpdateMiscueType={onUpdateMiscueType}
      />,
    );

    await user.click(screen.getByText("cat"));
    await user.click(screen.getByRole("button", { name: "Omission" }));

    expect(editMode.updateMiscue).toHaveBeenCalledWith(0, {
      miscueType: "OMISSION",
      isSelfCorrected: false,
    });
    expect(onUpdateMiscueType).not.toHaveBeenCalled();
  });
});
