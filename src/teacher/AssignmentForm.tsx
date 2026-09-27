import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown, Check, X } from "lucide-react";
import { Stepper } from "../components/Stepper";
import { ChipGroup } from "../components/ChipGroup";
import { activities, levels, skills } from "../curriculum/foundations";
import type { Activity } from "../curriculum/types";
import { useStudio } from "../app/StoreProvider";

interface SetItem {
  activityId: string;
  minutes: number;
  repetitions: number;
}

const PRESETS: Array<{ name: string; blurb: string; activityIds: string[] }> = [
  { name: "Quick warm-up", blurb: "First sounds + steady pulse", activityIds: ["first-notes", "rhythm"] },
  { name: "Chord foundations", blurb: "Em and Am shapes", activityIds: ["em-shape", "am-shape"] },
  { name: "Tone & memory", blurb: "Clean Am, three ways", activityIds: ["am-placement", "am-tone", "am-reconstruction"] },
  { name: "Rhythm lab", blurb: "Pulse, then changes", activityIds: ["rhythm", "transitions"] },
  { name: "Full session", blurb: "A complete practice arc", activityIds: ["first-notes", "em-shape", "am-shape", "transitions", "rhythm"] },
];

const DUE_OPTIONS = [
  { key: "", label: "No due date", days: 0 },
  { key: "tomorrow", label: "Tomorrow", days: 1 },
  { key: "3days", label: "In 3 days", days: 3 },
  { key: "week", label: "Next week", days: 7 },
] as const;

function toISODate(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function defaultItem(activity: Activity): SetItem {
  return { activityId: activity.id, minutes: activity.minutes, repetitions: 3 };
}

export function AssignmentForm({ studentId }: { studentId: string }) {
  const { state, dispatch } = useStudio();
  const student = state.students.find((s) => s.id === studentId);
  const unlockedLevels = useMemo(
    () =>
      levels.filter((l) => student?.unlockedLevels.includes(l.id) ?? false),
    [student],
  );
  const availableByLevel = useMemo(
    () =>
      unlockedLevels.map((level) => ({
        level,
        activities: activities.filter(
          (a) => skills.find((s) => s.id === a.skillId)!.levelId === level.id,
        ),
      })),
    [unlockedLevels],
  );
  const availableIds = useMemo(
    () => new Set(availableByLevel.flatMap((g) => g.activities.map((a) => a.id))),
    [availableByLevel],
  );

  const [picked, setPicked] = useState<SetItem[]>([]);
  const [due, setDue] = useState<(typeof DUE_OPTIONS)[number]["key"]>("");
  const [message, setMessage] = useState("");
  const [assigning, setAssigning] = useState(false);
  const pickedIndex = useMemo(
    () => new Map(picked.map((p, i) => [p.activityId, i])),
    [picked],
  );

  function toggle(activity: Activity) {
    setPicked((prev) =>
      prev.some((p) => p.activityId === activity.id)
        ? prev.filter((p) => p.activityId !== activity.id)
        : [...prev, defaultItem(activity)],
    );
  }
  function applyPreset(ids: string[]) {
    const items = ids.flatMap((id) => {
      const activity = activities.find((a) => a.id === id);
      return activity && availableIds.has(id) ? [defaultItem(activity)] : [];
    });
    setPicked(items);
    setMessage(
      items.length === 0
        ? "Those activities are in chapters this student hasn't unlocked yet."
        : "",
    );
  }
  function update(i: number, patch: Partial<SetItem>) {
    setPicked((prev) => prev.map((p, n) => (n === i ? { ...p, ...patch } : p)));
  }
  function move(i: number, dir: -1 | 1) {
    setPicked((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  const totalMinutes = picked.reduce((n, p) => n + p.minutes, 0);

  async function assign() {
    if (picked.length === 0 || assigning) return;
    setAssigning(true);
    const option = DUE_OPTIONS.find((o) => o.key === due)!;
    const dueDate =
      option.days > 0
        ? toISODate(new Date(Date.now() + option.days * 86400000))
        : undefined;
    const r = await dispatch({
      type: "assign",
      studentId,
      items: picked.map((p) => ({
        activityId: p.activityId,
        minutes: p.minutes,
        repetitions: p.repetitions,
      })),
      ...(dueDate ? { dueDate } : {}),
      at: new Date().toISOString(),
    });
    setAssigning(false);
    if (r.ok) {
      setPicked([]);
      setDue("");
      setMessage(
        `Assigned ${picked.length === 1 ? "1 activity" : `${picked.length} activities`} · about ${totalMinutes} minutes. Your student can find it on Home.`,
      );
    } else {
      setMessage(r.error);
    }
  }

  if (!student)
    return (
      <section className="card form-card">
        <h2>Student not found.</h2>
        <p>This practice-set builder needs a valid student to assign to.</p>
      </section>
    );

  return (
    <section className="card form-card">
      <h2>Build the practice set.</h2>
      <p>
        Tap activities to add them — tune the set, then assign. No forms to
        fill, no typing.
      </p>

      <div className="filter-group">
        <span className="filter-label">Start from a preset</span>
        <div className="filter-chips" role="group" aria-label="Assignment presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.blurb}
              onClick={() => applyPreset(preset.activityIds)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {availableByLevel.map(({ level, activities: group }) => (
        <div className="filter-group" key={level.id}>
          <span className="filter-label">
            Chapter {level.order} · {level.title}
          </span>
          <div className="activity-pick-grid">
            {group.map((activity) => {
              const order = pickedIndex.get(activity.id);
              const selected = order !== undefined;
              return (
                <button
                  key={activity.id}
                  type="button"
                  className={`activity-pick-card${selected ? " picked" : ""}`}
                  aria-pressed={selected}
                  onClick={() => toggle(activity)}
                >
                  {selected && <span className="pick-order">{order + 1}</span>}
                  <strong>{activity.title}</strong>
                  <span className="small">{activity.minutes} min · {activity.description}</span>
                  {selected && (
                    <span className="pick-check" aria-hidden>
                      <Check size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {picked.length === 0 ? (
        <p className="small">
          Tap an activity above — or a preset — to start the set. You can also{" "}
          <Link className="text-link" to="/teacher/lesson-plans">
            open a lesson plan
          </Link>{" "}
          for ideas on what to assign this week.
        </p>
      ) : (
        <div className="set-panel">
          <div className="row spread">
            <h3 className="m-0">
              Your set · {picked.length}{" "}
              {picked.length === 1 ? "activity" : "activities"}
            </h3>
            <span className="small">about {totalMinutes} min</span>
          </div>
          {picked.map((item, i) => {
            const activity = activities.find((a) => a.id === item.activityId);
            if (!activity) return null;
            return (
              <div className="set-row" key={item.activityId}>
                <div className="set-order">
                  <button
                    type="button"
                    aria-label={`Move ${activity.title} earlier`}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${activity.title} later`}
                    disabled={i === picked.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div className="set-title">
                  <strong>{activity.title}</strong>
                  <span className="small">{activity.description}</span>
                </div>
                <Stepper
                  label={`${activity.title} minutes`}
                  value={`${item.minutes}m`}
                  decrementLabel="Fewer minutes"
                  incrementLabel="More minutes"
                  onDecrement={() => update(i, { minutes: item.minutes - 1 })}
                  onIncrement={() => update(i, { minutes: item.minutes + 1 })}
                  disableDecrement={item.minutes <= 1}
                  disableIncrement={item.minutes >= 60}
                />
                <Stepper
                  label={`${activity.title} rounds`}
                  value={`×${item.repetitions}`}
                  decrementLabel="Fewer rounds"
                  incrementLabel="More rounds"
                  onDecrement={() => update(i, { repetitions: item.repetitions - 1 })}
                  onIncrement={() => update(i, { repetitions: item.repetitions + 1 })}
                  disableDecrement={item.repetitions <= 1}
                  disableIncrement={item.repetitions >= 100}
                />
                <button
                  type="button"
                  className="set-remove"
                  aria-label={`Remove ${activity.title} from the set`}
                  onClick={() =>
                    setPicked((prev) => prev.filter((_, n) => n !== i))
                  }
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
          <ChipGroup
            label="Due"
            groupLabel="Due date"
            options={DUE_OPTIONS}
            value={due}
            onChange={setDue}
          />
          <button className="button" type="button" disabled={assigning} onClick={assign}>
            {assigning
              ? "Assigning…"
              : `Assign ${picked.length} ${picked.length === 1 ? "activity" : "activities"} · about ${totalMinutes} min`}
          </button>
        </div>
      )}
      <p role="status" className="form-message">
        {message}
      </p>
    </section>
  );
}
