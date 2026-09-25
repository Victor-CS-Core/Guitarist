import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
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
    // All 7 chords render a diagram each.
    expect(container.querySelectorAll(".chord-diagram")).toHaveLength(7);
    const search = screen.getByLabelText("Search chords by name");
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(search, { target: { value: "minor" } });
    expect(container.querySelectorAll(".chord-diagram")).toHaveLength(2);
    expect(container.textContent).toMatch(/matching/);
    expect(container.textContent).toContain("minor");
  });
});
