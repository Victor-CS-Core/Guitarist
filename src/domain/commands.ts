import { activities, levels, skills } from "../curriculum/foundations";
import { canUnlock } from "./selectors";
import {
  statuses,
  type Actor,
  type Command,
  type DemoState,
  type Result,
} from "./types";
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
    (command.type !== "completePractice" ||
      actor.studentId !== command.studentId)
  )
    return fail("Your teacher takes care of this step.");
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
        (!command.reason ||
          ![
            "placement",
            "memory",
            "clean-tone",
            "rhythm",
            "transition",
            "other",
          ].includes(command.reason))
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
      for (const item of items)
        if (command.itemIds.includes(item.id)) item.completed = true;
      next.sessions.push({
        id: command.sessionId,
        studentId: student.id,
        durationSeconds: Math.floor(command.durationSeconds),
        itemIds: command.itemIds,
        at: command.at,
      });
      text = "Completed a practice session";
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
  }
  next.events.push({
    id: crypto.randomUUID(),
    studentId: student.id,
    text,
    at: command.at,
  });
  return { ok: true, value: next };
}
