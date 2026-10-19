// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CALL_NOTE_MAX_LENGTH } from "@/lib/call-notes";
import CallNotePad from "./CallNotePad";
import CallToolsMenu from "./CallToolsMenu";

describe("CallToolsMenu", () => {
  it("opens a labelled menu and runs the chosen tool", async () => {
    const user = userEvent.setup();
    const onOpenNote = vi.fn();
    const onOpenPomodoro = vi.fn();
    render(<CallToolsMenu onOpenNote={onOpenNote} onOpenPomodoro={onOpenPomodoro} />);

    await user.click(screen.getByRole("button", { name: "Call tools" }));
    await user.click(await screen.findByRole("button", { name: "Make note" }));
    expect(onOpenNote).toHaveBeenCalledTimes(1);
    expect(onOpenPomodoro).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Call tools" }));
    await user.click(await screen.findByRole("button", { name: "Focus timer" }));
    expect(onOpenPomodoro).toHaveBeenCalledTimes(1);
  });
});

describe("CallNotePad", () => {
  it("saves a trimmed note and shows confirmation", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CallNotePad open onClose={() => {}} onSave={onSave} />);

    const save = screen.getByRole("button", { name: "Save to chat" });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText("Note"), "  agenda: graphs  ");
    await user.click(save);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith("agenda: graphs"));
    expect(await screen.findByText("Note sent to chat.")).toBeInTheDocument();
  });

  it("refuses a note over the limit and says why", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<CallNotePad open onClose={() => {}} onSave={onSave} />);

    await user.click(screen.getByLabelText("Note"));
    await user.paste("x".repeat(CALL_NOTE_MAX_LENGTH + 1));

    expect(screen.getByText(`Keep it under ${CALL_NOTE_MAX_LENGTH} characters.`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save to chat" })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("reports a failed save and keeps the text", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("Chat is unavailable"));
    render(<CallNotePad open onClose={() => {}} onSave={onSave} />);

    await user.type(screen.getByLabelText("Note"), "keep me");
    await user.click(screen.getByRole("button", { name: "Save to chat" }));

    expect(await screen.findByText("Chat is unavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("Note")).toHaveValue("keep me");
  });

  it("renders nothing while closed", () => {
    render(<CallNotePad open={false} onClose={() => {}} onSave={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
