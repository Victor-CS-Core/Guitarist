import { describe, it, expect } from "vitest";
import { seed } from "../test/fixtures";
import { applyCommand } from "./commands";
import { canUnlock, earnedBadgeIds, isAppUnlocked } from "./selectors";
import type { DemoState, Command, RoutineBlock } from "./types";
const at = "2026-09-23T12:00:00Z";
const teacher = { role: "teacher" as const };
function run(state: DemoState, command: Command) {
  const r = applyCommand(state, teacher, command);
  if (!r.ok) throw Error(r.error);
  return r.value;
}
describe("teacher-controlled mastery", () => {
  it("rejects student mastery and other learner changes", () => {
    expect(
      applyCommand(
        seed(),
        { role: "student", studentId: "noah" },
        {
          type: "assess",
          studentId: "noah",
          skillId: "string-numbers",
          status: "MASTERED",
          at,
        },
      ).ok,
    ).toBe(false);
    expect(
      applyCommand(
        seed(),
        { role: "student", studentId: "emma" },
        {
          type: "completePractice",
          studentId: "noah",
          sessionId: "s1",
          durationSeconds: 12,
          itemIds: ["noah-strings"],
          at,
        },
      ).ok,
    ).toBe(false);
  });
  it("requires explicit teacher unlock after mastery", () => {
    let s = seed();
    expect(canUnlock(s, "noah", "level-2")).toBe(false);
    for (const id of [
      "guitar-parts",
      "string-numbers",
      "finger-numbers",
      "holding",
      "picking",
    ])
      s = run(s, {
        type: "assess",
        studentId: "noah",
        skillId: id,
        status: "MASTERED",
        at,
      });
    expect(canUnlock(s, "noah", "level-2")).toBe(true);
    expect(s.students[1].unlockedLevels).not.toContain("level-2");
    expect(earnedBadgeIds(s, "noah")).toContain("guitar-explorer");
    s = run(s, { type: "unlock", studentId: "noah", levelId: "level-2", at });
    expect(s.students[1].unlockedLevels).toContain("level-2");
  });
  it("requires an override reason and preserves rejected state", () => {
    const s = seed();
    const before = JSON.stringify(s);
    expect(
      applyCommand(s, teacher, {
        type: "unlock",
        studentId: "noah",
        levelId: "level-2",
        overrideReason: " ",
        at,
      }).ok,
    ).toBe(false);
    expect(JSON.stringify(s)).toBe(before);
    expect(
      run(s, {
        type: "unlock",
        studentId: "noah",
        levelId: "level-2",
        overrideReason: "Reviewed readiness in person",
        at,
      }).students[1].currentLevelId,
    ).toBe("level-2");
  });
  it("rejects invalid targets and unknown records", () => {
    for (const minutes of [-1, 0, NaN, Infinity])
      expect(
        applyCommand(seed(), teacher, {
          type: "assign",
          studentId: "noah",
          activityId: "strings",
          minutes,
          repetitions: 1,
          at,
        }).ok,
      ).toBe(false);
    expect(
      applyCommand(seed(), teacher, {
        type: "assess",
        studentId: "missing",
        skillId: "picking",
        status: "MASTERED",
        at,
      }).ok,
    ).toBe(false);
  });
  it("records practice once without mastering skills", () => {
    const cmd: Command = {
      type: "completePractice",
      studentId: "noah",
      sessionId: "once",
      durationSeconds: 23,
      itemIds: ["noah-strings"],
      at,
    };
    const s = run(seed(), cmd);
    expect(s.sessions.filter((x) => x.id === "once")).toHaveLength(1);
    expect(run(s, cmd).sessions).toHaveLength(s.sessions.length);
    expect(s.students[1].skills["string-numbers"]).not.toBe("MASTERED");
  });
  it("rejects invalid completion and reinforcement without reason", () => {
    expect(
      applyCommand(seed(), teacher, {
        type: "completePractice",
        studentId: "noah",
        sessionId: "bad",
        durationSeconds: NaN,
        itemIds: ["unknown"],
        at,
      }).ok,
    ).toBe(false);
    expect(
      applyCommand(seed(), teacher, {
        type: "assess",
        studentId: "emma",
        skillId: "chord-am",
        status: "NEEDS_REINFORCEMENT",
        at,
      }).ok,
    ).toBe(false);
  });
});
it("records early practice time without completing unperformed steps", () => {
  const r = applyCommand(
    seed(),
    { role: "student", studentId: "noah" },
    {
      type: "completePractice",
      studentId: "noah",
      sessionId: "early",
      durationSeconds: 9,
      itemIds: [],
      at,
    },
  );
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value.sessions.at(-1)?.durationSeconds).toBe(9);
    expect(
      r.value.assignments
        .find((a) => a.studentId === "noah")
        ?.items.every((i) => !i.completed),
    ).toBe(true);
  }
});

describe("app unlock (graduation gift)", () => {
  it("lets the teacher unlock and re-lock the app, and blocks students", () => {
    const unlocked = run(seed(), {
      type: "setAppUnlocked",
      studentId: "noah",
      unlocked: true,
      at,
    });
    expect(unlocked.students.find((s) => s.id === "noah")!.appUnlocked).toBe(true);
    const relocked = run(unlocked, {
      type: "setAppUnlocked",
      studentId: "noah",
      unlocked: false,
      at,
    });
    expect(relocked.students.find((s) => s.id === "noah")!.appUnlocked).toBe(false);
    expect(
      applyCommand(
        seed(),
        { role: "student", studentId: "noah" },
        { type: "setAppUnlocked", studentId: "noah", unlocked: true, at },
      ).ok,
    ).toBe(false);
  });

  it("treats records without the flag as locked", () => {
    expect(isAppUnlocked({ appUnlocked: true })).toBe(true);
    expect(isAppUnlocked({ appUnlocked: false })).toBe(false);
    expect(isAppUnlocked({} as never)).toBe(false);
  });
});

describe("practice routines", () => {
  const goodBlocks: RoutineBlock[] = [
    { id: "b1", kind: "warmup" as const, title: "Finger stretches", minutes: 3 },
    { id: "b2", kind: "chords" as const, title: "Em to Am", minutes: 5, chordIds: ["Em", "Am"], bpm: 70 },
    { id: "b3", kind: "cooldown" as const, title: "Slow strums", minutes: 2 },
  ];
  function unlockSeed(id: string): DemoState {
    const r = applyCommand(seed(), teacher, { type: "setAppUnlocked", studentId: id, unlocked: true, at });
    if (!r.ok) throw Error(r.error);
    return r.value;
  }
  function createAs(actor: { role: "teacher" } | { role: "student"; studentId: string }, studentId = "emma") {
    return applyCommand(seed(), actor, {
      type: "createRoutine",
      studentId,
      name: "My 10-minute session",
      blocks: goodBlocks,
      at,
    });
  }
  it("lets the teacher create a routine for a student", () => {
    const r = createAs(teacher);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const routines = r.value.routines.filter((x) => x.studentId === "emma");
    expect(routines).toHaveLength(1);
    expect(routines[0].name).toBe("My 10-minute session");
    expect(routines[0].blocks).toHaveLength(3);
    expect(routines[0].createdBy).toBe("teacher");
    expect(r.value.events.at(-1)!.text).toContain("My 10-minute session");
  });
  it("lets a graduated student create their own routine, but not another student's", () => {
    const unlocked = unlockSeed("emma");
    const own = applyCommand(unlocked, { role: "student", studentId: "emma" }, {
      type: "createRoutine", studentId: "emma", name: "My 10-minute session", blocks: goodBlocks, at,
    });
    expect(own.ok).toBe(true);
    expect(
      applyCommand(unlocked, { role: "student", studentId: "emma" }, {
        type: "createRoutine", studentId: "noah", name: "Sneaky", blocks: goodBlocks, at,
      }).ok,
    ).toBe(false);
  });
  it("blocks students still in the course from building routines", () => {
    // emma is locked in the plain seed.
    expect(createAs({ role: "student", studentId: "emma" }).ok).toBe(false);
    const shared = createAs(teacher);
    expect(shared.ok).toBe(true);
    if (!shared.ok) return;
    const routineId = shared.value.routines[0].id;
    expect(
      applyCommand(shared.value, { role: "student", studentId: "emma" }, {
        type: "deleteRoutine", studentId: "emma", routineId, at,
      }).ok,
    ).toBe(false);
  });
  it("validates routine shape", () => {
    const bad = (name: string, blocks: typeof goodBlocks) =>
      applyCommand(seed(), teacher, { type: "createRoutine", studentId: "emma", name, blocks, at }).ok;
    expect(bad("", goodBlocks)).toBe(false);
    expect(bad("x".repeat(61), goodBlocks)).toBe(false);
    expect(bad("ok", [])).toBe(false);
    expect(bad("ok", Array.from({ length: 9 }, (_, i) => ({ ...goodBlocks[0], id: `b${i}` })))).toBe(false);
    expect(bad("ok", [{ ...goodBlocks[0], minutes: 0 }])).toBe(false);
    expect(bad("ok", [{ ...goodBlocks[0], minutes: 31 }])).toBe(false);
    expect(bad("ok", [{ ...goodBlocks[1], chordIds: ["not-a-chord"] }])).toBe(false);
    expect(bad("ok", [{ ...goodBlocks[1], bpm: 500 }])).toBe(false);
    expect(bad("ok", [{ id: "bx", kind: "technique" as const, title: "T", minutes: 5, activityId: "nope" }])).toBe(false);
    expect(bad("ok", [{ id: "bx", kind: "nope" as never, title: "T", minutes: 5 }])).toBe(false);
  });
  it("normalizes blocks: trims titles and fills ids", () => {
    const r = applyCommand(seed(), teacher, {
      type: "createRoutine",
      studentId: "emma",
      name: "  Evening flow  ",
      blocks: [{ id: "", kind: "warmup", title: "  Stretch  ", minutes: 4 } as never],
      at,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const routine = r.value.routines[0];
    expect(routine.name).toBe("Evening flow");
    expect(routine.blocks[0].title).toBe("Stretch");
    expect(routine.blocks[0].id).not.toBe("");
  });
  it("lets students edit their own routines but not teacher-shared ones", () => {
    const created = createAs(teacher);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const routineId = created.value.routines[0].id;
    const studentTry = applyCommand(
      created.value,
      { role: "student", studentId: "emma" },
      { type: "updateRoutine", studentId: "emma", routineId, name: "Hacked", blocks: goodBlocks, at },
    );
    expect(studentTry.ok).toBe(false);
    const teacherEdit = applyCommand(
      created.value,
      teacher,
      { type: "updateRoutine", studentId: "emma", routineId, name: "Evening flow", blocks: goodBlocks, at },
    );
    expect(teacherEdit.ok).toBe(true);
    if (!teacherEdit.ok) return;
    expect(teacherEdit.value.routines[0].name).toBe("Evening flow");
    const studentDelete = applyCommand(
      teacherEdit.value,
      { role: "student", studentId: "emma" },
      { type: "deleteRoutine", studentId: "emma", routineId, at },
    );
    expect(studentDelete.ok).toBe(false);
    const own = applyCommand(unlockSeed("noah"), { role: "student", studentId: "noah" }, {
      type: "createRoutine", studentId: "noah", name: "Noah's flow", blocks: goodBlocks, at,
    });
    expect(own.ok).toBe(true);
    if (!own.ok) return;
    const ownId = own.value.routines.find((x) => x.studentId === "noah")!.id;
    const ownDelete = applyCommand(
      own.value,
      { role: "student", studentId: "noah" },
      { type: "deleteRoutine", studentId: "noah", routineId: ownId, at },
    );
    expect(ownDelete.ok).toBe(true);
    if (!ownDelete.ok) return;
    expect(ownDelete.value.routines.some((x) => x.id === ownId)).toBe(false);
  });
  it("works on records created before routines existed", () => {
    const legacy = seed() as unknown as Record<string, unknown>;
    delete legacy.routines;
    const r = applyCommand(legacy as unknown as DemoState, teacher, {
      type: "createRoutine",
      studentId: "emma",
      name: "Legacy",
      blocks: goodBlocks,
      at,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.routines).toHaveLength(1);
  });
  it("logs a guided routine session with its label", () => {
    const created = createAs(teacher);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const routine = created.value.routines[0];
    const done = applyCommand(
      created.value,
      { role: "student", studentId: "emma" },
      {
        type: "completePractice",
        studentId: "emma",
        sessionId: "routine-run-1",
        durationSeconds: 640,
        itemIds: [],
        routineId: routine.id,
        label: routine.name,
        at,
      },
    );
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    const session = done.value.sessions.find((s) => s.id === "routine-run-1")!;
    expect(session.routineId).toBe(routine.id);
    expect(session.label).toBe("My 10-minute session");
    expect(done.value.events.at(-1)!.text).toContain("My 10-minute session");
  });
  it("rejects routine sessions for unknown routines", () => {
    const r = applyCommand(
      seed(),
      { role: "student", studentId: "emma" },
      {
        type: "completePractice",
        studentId: "emma",
        sessionId: "routine-run-2",
        durationSeconds: 100,
        itemIds: [],
        routineId: "missing",
        at,
      },
    );
    expect(r.ok).toBe(false);
  });
});
