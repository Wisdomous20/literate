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
    await user.click(
      screen.getByRole("button", {
        name: /points to each word with his\/her finger/i,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /employs little or no method of analysis/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: /save observation/i }));

    expect(onSave).toHaveBeenCalledWith(
      [
        "VOICE_HARDLY_AUDIBLE",
        "FINGER_POINTING",
        "LITTLE_OR_NO_ANALYSIS",
      ],
      "",
    );
  });

  it("keeps in-progress checks when the parent re-renders with a new behaviors array", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    // The parent pages rebuild the behaviors array on every render. Simulate
    // that by re-rendering with a fresh (value-equal) array mid-edit.
    const { rerender } = render(
      <BehaviorChecklist behaviors={buildReadingBehaviorItems([])} onSave={onSave} />,
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const voice = screen.getByRole("button", { name: /voice is hardly audible/i });
    await user.click(voice);

    // New array reference, same persisted (unchecked) data — must NOT reset.
    rerender(
      <BehaviorChecklist behaviors={buildReadingBehaviorItems([])} onSave={onSave} />,
    );

    await user.click(screen.getByRole("button", { name: /save observation/i }));

    expect(onSave).toHaveBeenCalledWith(["VOICE_HARDLY_AUDIBLE"], "");
  });

  it("loads and saves other observations", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <BehaviorChecklist
        behaviors={buildReadingBehaviorItems([])}
        otherObservations="Needs review"
        onSave={onSave}
      />,
    );

    const observations = screen.getByPlaceholderText("Enter observations...");
    expect(observations).toHaveValue("Needs review");

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.clear(observations);
    await user.type(observations, "Voice was too soft");
    await user.click(screen.getByRole("button", { name: /save observation/i }));

    expect(onSave).toHaveBeenCalledWith([], "Voice was too soft");
  });

  it("keeps edit mode open when saving fails", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("Database save failed"));

    render(
      <BehaviorChecklist
        behaviors={buildReadingBehaviorItems([])}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: /voice is hardly audible/i }));
    await user.click(screen.getByRole("button", { name: /save observation/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Database save failed",
    );
    expect(
      screen.getByRole("button", { name: /save observation/i }),
    ).toBeInTheDocument();
  });
});
