import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ViewMiscuesModal from "./viewMiscuesModal";
import type { MiscueResult } from "@/types/oral-reading";
import type { EditModeCallbacks } from "@/components/oral-reading-test/passageDisplay";

const miscues: MiscueResult[] = [
  {
    miscueType: "MISPRONUNCIATION",
    expectedWord: "cat",
    spokenWord: "kat",
    wordIndex: 1,
    timestamp: 5,
    isSelfCorrected: false,
  },
];

describe("ViewMiscuesModal", () => {
  it("calls onJumpToTime from the passage popup", async () => {
    const user = userEvent.setup();
    const onJumpToTime = vi.fn();

    render(
      <ViewMiscuesModal
        open
        onClose={() => {}}
        passageContent="The cat sat"
        miscues={miscues}
        onJumpToTime={onJumpToTime}
      />,
    );

    await user.click(screen.getByText("cat"));
    await user.click(screen.getByRole("button", { name: /jump to word/i }));

    expect(onJumpToTime).toHaveBeenCalledWith(5);
  });

  it("calls onJumpToTime from the miscue list timestamp", async () => {
    const user = userEvent.setup();
    const onJumpToTime = vi.fn();

    render(
      <ViewMiscuesModal
        open
        onClose={() => {}}
        passageContent="The cat sat"
        miscues={miscues}
        onJumpToTime={onJumpToTime}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Miscued Words" }));
    await user.click(screen.getByRole("button", { name: /jump to cat at 00:05\.0/i }));

    expect(onJumpToTime).toHaveBeenCalledWith(5);
  });

  it("keeps Passage View and Miscued Words read-only when editing is available", async () => {
    const user = userEvent.setup();

    render(
      <ViewMiscuesModal
        open
        onClose={() => {}}
        passageContent="The cat sat"
        miscues={miscues}
        onDeleteMiscue={vi.fn()}
        onUpdateMiscueType={vi.fn()}
        editMiscues={{} as EditModeCallbacks}
      />,
    );

    await user.click(screen.getByText("cat"));
    expect(screen.queryByRole("button", { name: /delete mispronunciation/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit mispronunciation/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Miscued Words" }));
    expect(screen.queryByRole("button", { name: /delete mispronunciation/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit mispronunciation/i })).not.toBeInTheDocument();
  });
});
