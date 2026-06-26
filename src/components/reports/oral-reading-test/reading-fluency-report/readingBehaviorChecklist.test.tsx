import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BehaviorChecklist from "./readingBehaviorChecklist";
import { buildReadingBehaviorItems } from "@/lib/readingBehaviors";

describe("BehaviorChecklist", () => {
  it("separates automated checks from teacher observations", () => {
    render(<BehaviorChecklist behaviors={buildReadingBehaviorItems([])} />);

    expect(screen.getByText("Automated checks")).toBeInTheDocument();
    expect(screen.getByText("Teacher observations")).toBeInTheDocument();

    const automated = screen.getByText("Automated checks").closest("section");
    const teacher = screen.getByText("Teacher observations").closest("section");

    expect(automated).not.toBeNull();
    expect(teacher).not.toBeNull();
    expect(
      within(automated!).getByText("Does word-by-word reading"),
    ).toBeInTheDocument();
    expect(
      within(teacher!).getByText("Voice is hardly audible"),
    ).toBeInTheDocument();
  });

  it("saves selected teacher-observed behavior types", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <BehaviorChecklist
        behaviors={buildReadingBehaviorItems([])}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: /voice is hardly audible/i }));
    await user.click(screen.getByRole("button", { name: /save observation/i }));

    expect(onSave).toHaveBeenCalledWith(["VOICE_HARDLY_AUDIBLE"], "");
  });
});
