import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Metronome } from "./Metronome";

describe("Metronome", () => {
  it("renders the classic 4/4 surface: four dots, 4-beats label, 40–80 BPM", () => {
    const { container } = render(<Metronome />);
    expect(screen.getByText("Your steady beat")).toBeInTheDocument();
    expect(screen.getByText("4 beats")).toBeInTheDocument();
    const dots = container.querySelectorAll(".beat-dots .pulse");
    expect(dots).toHaveLength(4);
    const bpm = screen.getByLabelText("Beats per minute");
    expect(bpm).toHaveAttribute("min", "40");
    expect(bpm).toHaveAttribute("max", "80");
    expect(
      screen.getByText("Four-beat count-in cue"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".beat-dots"),
    ).toHaveAttribute("aria-label", "Metronome stopped");
  });

  it("applies a preset: beats drive the dots, BPM is clamped to the compact window", () => {
    const first = render(
      <Metronome preset={{ bpm: 72, beatsPerBar: 3 }} />,
    );
    expect(first.container.querySelectorAll(".beat-dots .pulse")).toHaveLength(
      3,
    );
    expect(screen.getByLabelText("Beats per minute")).toHaveValue(72);
    expect(screen.getByText("3 beats")).toBeInTheDocument();
    expect(screen.getByText("Three-beat count-in cue")).toBeInTheDocument();
    first.unmount();

    // Presets apply on mount (the practice page remounts via key on chip tap).
    render(<Metronome preset={{ bpm: 200, beatsPerBar: 4 }} />);
    expect(screen.getByLabelText("Beats per minute")).toHaveValue(80);
  });

  it("clamps a below-window preset BPM up to the compact minimum", () => {
    render(<Metronome preset={{ bpm: 10, beatsPerBar: 4 }} />);
    expect(screen.getByLabelText("Beats per minute")).toHaveValue(40);
  });
});
