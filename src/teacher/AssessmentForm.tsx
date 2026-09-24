import { useState } from "react";
import { useDemo } from "../app/StoreProvider";
import {
  skills,
  activities,
  reinforcement,
  activityById,
  levels,
} from "../curriculum/foundations";
import type { Reason, Status } from "../domain/types";
export function AssessmentForm({ studentId }: { studentId: string }) {
  const { state, dispatch } = useDemo(),
    student = state.students.find((s) => s.id === studentId)!;
  const available = skills.filter((s) =>
    student.unlockedLevels.includes(s.levelId),
  );
  const [skillId, setSkillId] = useState(
      available.find((s) => student.skills[s.id] !== "MASTERED")?.id ??
        available[0].id,
    ),
    [reason, setReason] = useState<Reason>("placement"),
    [guidance, setGuidance] = useState(""),
    [message, setMessage] = useState("");
  const suggested = ["rhythm", "transition"].includes(reason)
    ? reinforcement[reason]
    : skillId === "chord-am"
      ? reinforcement[reason]
      : activities.find((a) => a.skillId === skillId)?.id;
  const activity = suggested ? activityById(suggested) : undefined;
  const targetLevel = levels.find((l) =>
    l.skills.some((s) => s.id === activity?.skillId),
  );
  const availableTarget =
    !!activity &&
    !!targetLevel &&
    student.unlockedLevels.includes(targetLevel.id);
  async function assess(status: Status) {
    const r = await dispatch({
      type: "assess",
      studentId,
      skillId,
      status,
      at: new Date().toISOString(),
      ...(status === "NEEDS_REINFORCEMENT" ? { reason, guidance } : {}),
    });
    setMessage(
      r.ok ? "Assessment saved. Your student’s progress is updated." : r.error,
    );
    return r.ok;
  }
  async function reinforce() {
    if (!activity || !availableTarget) {
      setMessage(
        "This skill has no targeted activity available yet.",
      );
      return;
    }
    if (await assess("NEEDS_REINFORCEMENT")) {
      const r = await dispatch({
        type: "assign",
        studentId,
        activityId: activity.id,
        minutes: activity.minutes,
        repetitions: 3,
        at: new Date().toISOString(),
      });
      setMessage(
        r.ok
          ? "Reinforcement assigned. It’s ready on the student’s dashboard."
          : r.error,
      );
    }
  }
  return (
    <section className="card form-card">
      <div className="eyebrow">IN-LESSON ASSESSMENT</div>
      <h2>A little listening goes a long way.</h2>
      <p>Watch and listen to the student play before marking mastery.</p>
      <label>
        Skill
        <select
          aria-label="Skill"
          value={skillId}
          onChange={(e) => {
            setSkillId(e.target.value);
            setMessage("");
          }}
        >
          {available.map((s) => (
            <option value={s.id} key={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      <div className="assessment-actions">
        <button
          className="button secondary"
          onClick={() => assess("INTRODUCED")}
        >
          Introduce skill
        </button>
        <button
          className="button secondary"
          onClick={() => assess("PRACTICING")}
        >
          Continue practicing
        </button>
        <button
          className="button secondary"
          onClick={() => assess("READY_FOR_ASSESSMENT")}
        >
          Ready for assessment
        </button>
        <button className="button" onClick={() => assess("MASTERED")}>
          Mark mastered
        </button>
      </div>
      <hr />
      <h3>Give the next practice a purpose.</h3>
      <label>
        Reinforcement reason
        <select
          aria-label="Reinforcement reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as Reason)}
        >
          <option value="placement">Finger placement · motor skill</option>
          <option value="memory">Shape memory · understanding</option>
          <option value="clean-tone">Clean tone · motor skill</option>
          <option value="rhythm">Rhythm · motor skill</option>
          <option value="transition">Transition · motor skill</option>
          <option value="other">Other · add guidance</option>
        </select>
      </label>
      {reason === "other" && (
        <label>
          Reinforcement guidance
          <textarea
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            maxLength={1000}
          />
        </label>
      )}
      <div className="teacher-tip">
        <strong>
          {activity?.title ?? "Activity coming in the next milestone"}
        </strong>
        <p>
          {activity?.description ??
            "You can continue practicing or record your guidance in lesson notes."}
        </p>
        {activity && <p>{activity.minutes} minutes · 3 rounds</p>}
      </div>
      {activity && !availableTarget && (
        <p className="small">
          First unlock {targetLevel?.title} from Overview, then assign this
          targeted exercise.
        </p>
      )}
      <button
        className="button secondary"
        disabled={!availableTarget}
        onClick={reinforce}
      >
        Assign reinforcement
      </button>
      <p role="status" className="form-message">
        {message}
      </p>
    </section>
  );
}
