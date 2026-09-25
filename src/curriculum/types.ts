export interface Skill {
  id: string;
  title: string;
  levelId: string;
  description: string;
  required: boolean;
}
export interface Level {
  id: string;
  order: number;
  title: string;
  description: string;
  badgeId: string;
  goal: string;
  skills: Skill[];
}
export interface Activity {
  id: string;
  skillId: string;
  title: string;
  description: string;
  minutes: number;
  kind:
    | "parts"
    | "strings"
    | "fingers"
    | "notes"
    | "chord"
    | "builder"
    | "rhythm"
    | "transition";
  chordId?: string;
  /**
   * Optional suggested tempo for the in-session metronome. When present, the
   * practice page shows a chip that loads these values into the metronome.
   * Structural twin of rhythmEngine's TempoPreset.
   */
  tempo?: {
    bpm: number;
    beatsPerBar: number;
    /** Note value that gets one beat (4 = quarter note, 8 = eighth note). */
    beatUnit?: number;
  };
  steps: string[];
}
