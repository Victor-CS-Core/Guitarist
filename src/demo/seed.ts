import { skills } from "../curriculum/foundations";
import type { DemoState, Status } from "../domain/types";
export function seed(): DemoState {
  const base = Object.fromEntries(
    skills.map((s) => [s.id, "NOT_INTRODUCED" as Status]),
  );
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  return {
    version: 1,
    students: [
      {
        id: "emma",
        name: "Emma",
        currentLevelId: "level-3",
        unlockedLevels: ["level-1", "level-2", "level-3"],
        skills: {
          ...base,
          ...Object.fromEntries(
            skills
              .filter((s) => ["level-1", "level-2"].includes(s.levelId))
              .map((s) => [s.id, "MASTERED" as Status]),
          ),
          "chord-em": "MASTERED",
          "chord-am": "PRACTICING",
        },
        goal: "Build Em and Am without a helping hand.",
      },
      {
        id: "noah",
        name: "Noah",
        currentLevelId: "level-1",
        unlockedLevels: ["level-1"],
        skills: {
          ...base,
          ...Object.fromEntries(
            skills
              .filter((s) => s.levelId === "level-1")
              .map((s) => [s.id, "INTRODUCED" as Status]),
          ),
        },
        goal: "Find your strings and play your first little melody.",
      },
    ],
    assignments: [
      {
        id: "emma-today",
        studentId: "emma",
        at: yesterday,
        items: [
          {
            id: "emma-em",
            activityId: "em-shape",
            minutes: 3,
            repetitions: 3,
            completed: false,
          },
          {
            id: "emma-am",
            activityId: "am-shape",
            minutes: 5,
            repetitions: 3,
            completed: false,
          },
          {
            id: "emma-build",
            activityId: "am-reconstruction",
            minutes: 3,
            repetitions: 3,
            completed: false,
          },
        ],
      },
      {
        id: "noah-today",
        studentId: "noah",
        at: yesterday,
        items: [
          {
            id: "noah-strings",
            activityId: "strings",
            minutes: 2,
            repetitions: 3,
            completed: false,
          },
          {
            id: "noah-notes",
            activityId: "first-notes",
            minutes: 3,
            repetitions: 3,
            completed: false,
          },
        ],
      },
    ],
    sessions: [
      {
        id: "emma-previous",
        studentId: "emma",
        durationSeconds: 660,
        itemIds: ["emma-em"],
        at: yesterday,
      },
    ],
    notes: [
      {
        id: "note-emma",
        studentId: "emma",
        text: "Em is sounding clear. Encourage curved fingers on Am and a relaxed wrist. Assess the shape from memory next lesson.",
        at: yesterday,
      },
    ],
    events: [],
  };
}
