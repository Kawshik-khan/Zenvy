// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImageDropzone } from "./ImageDropzone";

const MB = 1024 * 1024;
const png = (name: string, size = 1000) => new File([new Uint8Array(size)], name, { type: "image/png" });

function setup(props: Partial<Parameters<typeof ImageDropzone>[0]> = {}) {
  const onFilesChange = vi.fn();
  const user = userEvent.setup({ applyAccept: false });
  render(<ImageDropzone id="job-images" name="images" label="Job images" onFilesChange={onFilesChange} {...props} />);
  const input = screen.getByLabelText("Job images") as HTMLInputElement;
  return { user, input, onFilesChange };
}

describe("ImageDropzone (gallery)", () => {
  it("is a labelled file input with limits in its description", () => {
    const { input } = setup();
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("name", "images");
    expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    expect(input).toHaveAttribute("multiple");
    expect(input).toHaveAccessibleDescription("JPG, PNG or WebP · up to 5 MB · max 4");
  });

  it("previews chosen files with a cover badge and announces them", async () => {
    const { user, input, onFilesChange } = setup();
    await user.upload(input, [png("poster.png"), png("office.png")]);

    expect(screen.getByRole("img", { name: "poster.png" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "office.png" })).toBeInTheDocument();
    expect(screen.getByText("Cover")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Selected images, 2 of 4" })).toBeInTheDocument();
    expect(onFilesChange).toHaveBeenLastCalledWith([expect.any(File), expect.any(File)]);
    expect(screen.getByText("Added poster.png, office.png.")).toBeInTheDocument();
  });

  it("rejects invalid files with reasons and marks the input invalid", async () => {
    const { user, input } = setup({ maxSizeMB: 1 });
    await user.upload(input, [png("huge.png", 2 * MB), new File(["x"], "cv.pdf", { type: "application/pdf" })]);

    expect(screen.getAllByText("huge.png is larger than 1 MB.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("cv.pdf: use JPG, PNG or WebP.").length).toBeGreaterThan(0);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("removes a file and returns focus to the input", async () => {
    const { user, input, onFilesChange } = setup();
    await user.upload(input, [png("a.png"), png("b.png")]);
    await user.click(screen.getByRole("button", { name: "Remove a.png" }));

    expect(screen.queryByRole("img", { name: "a.png" })).toBeNull();
    expect(onFilesChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: "b.png" })]);
    expect(input).toHaveFocus();
  });

  it("stops accepting files at the limit", async () => {
    const { user, input } = setup({ maxFiles: 2 });
    await user.upload(input, [png("1.png"), png("2.png"), png("3.png")]);
    expect(screen.getByRole("list", { name: "Selected images, 2 of 2" })).toBeInTheDocument();
    expect(screen.getAllByText("3.png: you can add up to 2 images.").length).toBeGreaterThan(0);
    expect(input).toBeDisabled();
  });

  it("accepts dropped files and shows the drag state", () => {
    setup();
    const surface = screen.getByText("Drop images or browse").closest("label")!;
    fireEvent.dragEnter(surface, { dataTransfer: { files: [] } });
    expect(screen.getByText("Drop to add")).toBeInTheDocument();
    fireEvent.drop(surface, { dataTransfer: { files: [png("dropped.png")] } });
    expect(screen.getByRole("img", { name: "dropped.png" })).toBeInTheDocument();
  });
});

describe("ImageDropzone (avatar)", () => {
  it("shows the current photo and replaces it with a new one", async () => {
    const user = userEvent.setup();
    render(<ImageDropzone id="photo" name="photo" label="Profile photo" variant="avatar" initialUrl="/me.png" />);
    expect(screen.getByRole("img", { name: "Current photo" })).toHaveAttribute("src", "/me.png");

    const input = screen.getByLabelText("Profile photo");
    expect(input).not.toHaveAttribute("multiple");
    await user.upload(input, png("new.png"));
    expect(screen.getByRole("img", { name: "New photo: new.png" })).toBeInTheDocument();

    await user.upload(input, png("newer.png"));
    expect(screen.getByRole("img", { name: "New photo: newer.png" })).toBeInTheDocument();
  });
});
