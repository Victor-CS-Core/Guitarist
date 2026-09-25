import { activities, levels, skills } from "../curriculum/foundations";
import { chords } from "../curriculum/chords";
import { canUnlock, isAppUnlocked } from "./selectors";
import {
  reasons,
  routineBlockKinds,
  statuses,
  type Actor,
  type Command,
  type DemoState,
  type Result,
  type RoutineBlock,
} from "./types";

/**
 * Validates routine blocks and returns them normalized (trimmed strings,
 * generated ids for blocks missing one). Returns an error string when invalid.
 */
export function validateRoutineBlocks(
  name: string,
  blocks: RoutineBlock[],
): { ok: true; value: RoutineBlock[] } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!name.trim() || name.trim().length > 60)
    return fail("Give the routine a name between 1 and 60 characters.");
  if (!Array.isArray(blocks) || blocks.length < 1 || blocks.length > 8)
    return fail("A routine needs 1 to 8 blocks.");
  const seen = new Set<string>();
  const normalized: RoutineBlock[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") return fail("Each block needs a title and a length.");
    if (!routineBlockKinds.includes(block.kind))
      return fail("Choose a valid block type.");
    const title = block.title?.trim() ?? "";
    if (!title || title.length > 80)
      return fail("Each block needs a title between 1 and 80 characters.");
    if (!Number.isInteger(block.minutes) || block.minutes < 1 || block.minutes > 30)
      return fail("Each block needs 1–30 whole minutes.");
    const id = typeof block.id === "string" && block.id ? block.id : crypto.randomUUID();
    if (seen.has(id)) return fail("Each block needs its own identity.");
    seen.add(id);
    const out: RoutineBlock = { id, kind: block.kind, title, minutes: block.minutes };
    if (block.activityId !== undefined) {
      if (!activities.some((a) => a.id === block.activityId))
        return fail("Choose an available activity for the technique block.");
      out.activityId = block.activityId;
    }
    if (block.chordIds !== undefined) {
      if (
        !Array.isArray(block.chordIds) ||
        block.chordIds.length < 1 ||
        block.chordIds.length > 6 ||
        block.chordIds.some((c) => typeof c !== "string" || !chords[c])
      )
        return fail("Choose 1–6 real chords for the chord-change block.");
      out.chordIds = [...block.chordIds];
    }
    if (block.bpm !== undefined) {
      if (!Number.isInteger(block.bpm) || block.bpm < 30 || block.bpm > 240)
        return fail("Use a metronome target between 30 and 240 BPM.");
      out.bpm = block.bpm;
    }
    if (block.notes !== undefined) {
      const notes = block.notes.trim();
      if (notes.length > 500) return fail("Keep block notes under 500 characters.");
      if (notes) out.notes = notes;
    }
    normalized.push(out);
  }
  return { ok: true, value: normalized };
}

export function applyCommand(
  state: DemoState,
  actor: Actor,
  command: Command,
): Result<DemoState> {
  const fail = (error: string): Result<DemoState> => ({ ok: false, error });
  const original = state.students.find((s) => s.id === command.studentId);
  if (!original) return fail("This student could not be found.");
  if (!Number.isFinite(Date.parse(command.at)))
    return fail("A valid date is required.");
  if (
    actor.role !== "teacher" &&
    !(
      (command.type === "completePractice" ||
        command.type === "createRoutine" ||
        command.type === "updateRoutine" ||
        command.type === "deleteRoutine") &&
      actor.studentId === command.studentId
    )
  )
    return fail("Your teacher takes care of this step.");
  // Self-directed routines are a graduation gift: students still working
  // through the course practice from teacher-shared routines instead.
  if (
    actor.role === "student" &&
    (command.type === "createRoutine" ||
      command.type === "updateRoutine" ||
      command.type === "deleteRoutine") &&
    !isAppUnlocked(original)
  )
    return fail("Your teacher shares routines with you while you're working through the course.");
  const next = structuredClone(state),
    student = next.students.find((s) => s.id === command.studentId)!;
  let text = "";
  switch (command.type) {
    case "assess": {
      const skill = skills.find((s) => s.id === command.skillId);
      if (!skill || !statuses.includes(command.status))
        return fail("Choose a valid skill and status.");
      if (!student.unlockedLevels.includes(skill.levelId))
        return fail("Unlock this level before assessing its skills.");
      if (
        command.status === "NEEDS_REINFORCEMENT" &&
        (!command.reason || !reasons.includes(command.reason))
      )
        return fail("Choose a reinforcement reason.");
      if (command.reason === "other" && !command.guidance?.trim())
        return fail("Add guidance for this reinforcement.");
      student.skills[skill.id] = command.status;
      text = `${skill.title}: ${command.status.toLowerCase().replaceAll("_", " ")}${command.reason ? ` (${command.reason})` : ""}${command.guidance ? ` — ${command.guidance.trim()}` : ""}`;
      break;
    }
    case "assign": {
      const activity = activities.find((a) => a.id === command.activityId);
      if (!activity) return fail("Choose an available activity.");
      const skill = skills.find((s) => s.id === activity.skillId)!;
      if (!student.unlockedLevels.includes(skill.levelId))
        return fail("Choose an activity from an unlocked level.");
      if (
        !Number.isFinite(command.minutes) ||
        command.minutes <= 0 ||
        command.minutes > 60 ||
        !Number.isInteger(command.repetitions) ||
        command.repetitions < 1 ||
        command.repetitions > 100
      )
        return fail("Use 1–60 minutes and 1–100 whole rounds.");
      const id = crypto.randomUUID();
      const dueDate = command.dueDate?.trim() || undefined;
      if (dueDate !== undefined) {
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
          !Number.isFinite(Date.parse(`${dueDate}T12:00:00`))
        )
          return fail("Choose a valid due date.");
      }
      next.assignments.push({
        id,
        studentId: student.id,
        at: command.at,
        items: [
          {
            id: `${id}-item`,
            activityId: activity.id,
            minutes: command.minutes,
            repetitions: command.repetitions,
            completed: false,
            ...(dueDate ? { dueDate } : {}),
          },
        ],
      });
      text = `Assigned ${activity.title}`;
      break;
    }
    case "unlock": {
      const level = levels.find((l) => l.id === command.levelId);
      if (!level) return fail("Choose an available level.");
      if (
        !canUnlock(state, student.id, level.id) &&
        !command.overrideReason?.trim()
      )
        return fail(
          "Assess the prerequisite skills, or record your reason for an override.",
        );
      if (!student.unlockedLevels.includes(level.id))
        student.unlockedLevels.push(level.id);
      student.currentLevelId = level.id;
      student.goal = level.goal;
      text = `Unlocked ${level.title}${command.overrideReason ? `: ${command.overrideReason.trim()}` : ""}`;
      break;
    }
    case "completePractice": {
      if (
        !command.sessionId ||
        !Number.isFinite(command.durationSeconds) ||
        command.durationSeconds < 0 ||
        command.durationSeconds > 86400
      )
        return fail("Practice duration is invalid.");
      if (next.sessions.some((s) => s.id === command.sessionId))
        return { ok: true, value: state };
      const items = next.assignments
        .filter((a) => a.studentId === student.id)
        .flatMap((a) => a.items);
      if (
        (command.itemIds.length === 0 && command.durationSeconds === 0) ||
        new Set(command.itemIds).size !== command.itemIds.length ||
        command.itemIds.some((id) => !items.some((i) => i.id === id))
      )
        return fail("Choose an assigned practice activity.");
      let routineName: string | undefined;
      if (command.routineId !== undefined) {
        const routine = (next.routines ?? []).find(
          (r) => r.id === command.routineId && r.studentId === student.id,
        );
        if (!routine) return fail("This routine could not be found.");
        routineName = routine.name;
      }
      if (
        command.label !== undefined &&
        (!command.label.trim() || command.label.trim().length > 60)
      )
        return fail("Keep the session label between 1 and 60 characters.");
      for (const item of items)
        if (command.itemIds.includes(item.id)) item.completed = true;
      next.sessions.push({
        id: command.sessionId,
        studentId: student.id,
        durationSeconds: Math.floor(command.durationSeconds),
        itemIds: command.itemIds,
        at: command.at,
        ...(command.routineId ? { routineId: command.routineId } : {}),
        ...(command.label?.trim() ? { label: command.label.trim() } : {}),
      });
      text = routineName
        ? `Completed practice routine “${routineName}”`
        : "Completed a practice session";
      break;
    }
    case "saveNote":
      if (!command.text.trim() || command.text.length > 3000)
        return fail("Write a note between 1 and 3,000 characters.");
      next.notes.push({
        id: crypto.randomUUID(),
        studentId: student.id,
        text: command.text.trim(),
        at: command.at,
      });
      text = "Added a lesson note";
      break;
    case "setAppUnlocked": {
      student.appUnlocked = command.unlocked;
      text = command.unlocked
        ? `Unlocked the app for ${student.name} — the studio stays with them`
        : `Locked the app for ${student.name}`;
      break;
    }
    case "createRoutine": {
      // Records created before routines existed have no array yet.
      if (!next.routines) next.routines = [];
      const checked = validateRoutineBlocks(command.name, command.blocks);
      if (!checked.ok) return fail(checked.error);
      const routine = {
        id: crypto.randomUUID(),
        studentId: student.id,
        name: command.name.trim(),
        blocks: checked.value,
        createdBy: actor.role,
        at: command.at,
      };
      next.routines.push(routine);
      text =
        actor.role === "teacher"
          ? `Created practice routine “${routine.name}” for ${student.name}`
          : `Created practice routine “${routine.name}”`;
      break;
    }
    case "updateRoutine":
    case "deleteRoutine": {
      if (!next.routines) next.routines = [];
      const routine = next.routines.find(
        (r) => r.id === command.routineId && r.studentId === student.id,
      );
      if (!routine) return fail("This routine could not be found.");
      if (actor.role === "student" && routine.createdBy !== "student")
        return fail("Only your teacher can change this routine.");
      if (command.type === "deleteRoutine") {
        next.routines = next.routines.filter((r) => r.id !== routine.id);
        text = `Deleted practice routine “${routine.name}”`;
        break;
      }
      const checked = validateRoutineBlocks(command.name, command.blocks);
      if (!checked.ok) return fail(checked.error);
      routine.name = command.name.trim();
      routine.blocks = checked.value;
      text = `Updated practice routine “${routine.name}”`;
      break;
    }
  }
  next.events.push({
    id: crypto.randomUUID(),
    studentId: student.id,
    text,
    at: command.at,
  });
  return { ok: true, value: next };
}
