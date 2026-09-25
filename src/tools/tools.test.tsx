import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { chords } from "../curriculum/chords";
import { ChordLibraryPage } from "./ChordLibrary";
import { RhythmToolPage } from "./RhythmTool";
import { StudyTimerPage } from "./StudyTimer";
import { ToolsHome } from "./ToolsHome";
import { TunerPage } from "./Tuner";

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("tools pages", () => {
  it("ToolsHome links to all four tools", () => {
    const { container } = renderInRouter(<ToolsHome />);
    expect(screen.getByRole("heading", { name: /tools/i })).toBeInTheDocument();
    for (const to of ["/tools/timer", "/tools/tuner", "/tools/rhythm", "/tools/chords"]) {
      const link = container.querySelector(`a[href="${to}"]`);
      expect(link).not.toBeNull();
    }
  });

  it("StudyTimerPage renders presets and a clock", () => {
    renderInRouter(<StudyTimerPage />);
    expect(screen.getByText("Study timer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "25 min" })).toBeInTheDocument();
    expect(screen.getByLabelText("Timer display")).toHaveTextContent("25:00");
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("TunerPage renders without a microphone and offers reference tones", () => {
    renderInRouter(<TunerPage />);
    expect(screen.getByText("Chromatic tuner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start tuning/i })).toBeInTheDocument();
    for (const note of ["E2", "A2", "D3", "G3", "B3", "E4"]) {
      expect(
        screen.getByRole("button", { name: new RegExp(`\\b${note}\\b`) }),
      ).toBeInTheDocument();
    }
  });

  it("RhythmToolPage renders signature and subdivision controls", () => {
    renderInRouter(<RhythmToolPage />);
    expect(screen.getByText("Rhythm lab")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4/4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7/8" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tap tempo/i })).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveAttribute("min", "30");
  });

  it("ChordLibraryPage renders the chord grid and filters by search", async () => {
    const { container } = renderInRouter(<ChordLibraryPage />);
    expect(screen.getByText("Chord library")).toBeInTheDocument();
    // One diagram per chord in the generated library.
    const total = Object.keys(chords).length;
    expect(total).toBeGreaterThan(200);
    expect(container.querySelectorAll(".chord-diagram")).toHaveLength(total);
    // Query the input directly: getByLabelText walks the whole labelled tree
    // (thousands of string-explorer buttons) and takes ~35s in jsdom.
    const search = container.querySelector('input[type="search"]');
    expect(search).not.toBeNull();
    const { fireEvent } = await import("@testing-library/react");
    // "maj9" matches exactly one chord per root (12 roots).
    fireEvent.change(search!, { target: { value: "maj9" } });
    expect(container.querySelectorAll(".chord-diagram")).toHaveLength(12);
    expect(container.textContent).toMatch(/matching/);
    expect(container.textContent).toContain("maj9");
  }, 30000);

  it("ChordLibraryPage filters by root and type", async () => {
    const { container } = renderInRouter(<ChordLibraryPage />);
    const { fireEvent } = await import("@testing-library/react");
    // 24 qualities per root: picking root E leaves 24 chords.
    fireEvent.click(screen.getByRole("button", { name: "E", pressed: false }));
    expect(container.querySelectorAll(".chord-diagram")).toHaveLength(24);
    // Narrowing to minor 7 leaves a single chord.
    fireEvent.click(screen.getByRole("button", { name: "m7" }));
    expect(container.querySelectorAll(".chord-diagram")).toHaveLength(1);
    expect(container.textContent).toContain("Em7");
  });
});
