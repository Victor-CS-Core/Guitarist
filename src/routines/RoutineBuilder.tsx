import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useStudio } from "../app/StoreProvider";
import { EmptyState } from "../components/EmptyState";
import { activities, levels } from "../curriculum/foundations";
import { isAppUnlocked, studentRoutines } from "../domain/selectors";
import { type RoutineBlock } from "../domain/types";
import { BlockEditor, DEFAULT_TITLES, type DraftBlock } from "./BlockEditor";

function toDraft(block?: RoutineBlock): DraftBlock {
  return {
    localId: block?.id ?? crypto.randomUUID(),
    kind: block?.kind ?? "warmup",
    title: block?.title ?? "",
    minutes: block?.minutes ?? 5,
    activityId: block?.activityId ?? "",
    chordQuery: "",
    chordIds: block?.chordIds ? [...block.chordIds] : [],
    bpm: block?.bpm ? String(block.bpm) : "",
    notes: block?.notes ?? "",
  };
}

export function RoutineBuilder({
  studentId,
  routineId,
  teacherMode = false,
}: {
  studentId: string;
  routineId?: string;
  teacherMode?: boolean;
}) {
  const { state, dispatch } = useStudio();
  const navigate = useNavigate();
  const existing = routineId
    ? studentRoutines(state, studentId).find((r) => r.id === routineId)
    : undefined;
  const student = state.students.find((s) => s.id === studentId);
  const unlocked = student ? isAppUnlocked(student) : false;

  const activityOptions = useMemo(() => {
    const pool =
      teacherMode || unlocked
        ? activities
        : activities.filter((a) =>
            (student?.unlockedLevels ?? []).includes(
              levels.find((l) => l.skills.some((s) => s.id === a.skillId))?.id ?? "",
            ),
          );
    return pool;
  }, [teacherMode, unlocked, student]);

  const [name, setName] = useState(existing?.name ?? "");
  const [blocks, setBlocks] = useState<DraftBlock[]>(() =>
    existing && existing.blocks.length > 0
      ? existing.blocks.map(toDraft)
      : [toDraft()],
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);

  if (!student) return <EmptyState title="Student not found." />;
  if (routineId && !existing)
    return <EmptyState title="Routine not found." />;

  const totalMinutes = blocks.reduce((n, b) => n + (Number(b.minutes) || 0), 0);

  function patchBlock(localId: string, patch: Partial<DraftBlock>) {
    setBlocks((bs) => bs.map((b) => (b.localId === localId ? { ...b, ...patch } : b)));
  }
  function move(localId: string, dir: -1 | 1) {
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.localId === localId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function addBlock() {
    if (blocks.length >= 8) {
      setMessage("Routines hold up to 8 blocks — keep it focused.");
      return;
    }
    setBlocks((bs) => [...bs, toDraft()]);
  }

  async function save() {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    setMessage("");
    const payload: RoutineBlock[] = blocks.map((b) => {
      const block: RoutineBlock = {
        id: b.localId,
        kind: b.kind,
        title: b.title.trim() || DEFAULT_TITLES[b.kind],
        minutes: Math.max(1, Math.min(30, Math.floor(Number(b.minutes) || 5))),
      };
      if (b.kind === "technique" || b.kind === "song") {
        const fallback = activityOptions[0]?.id;
        if (b.activityId || fallback) block.activityId = b.activityId || fallback!;
      }
      if (b.kind === "chords") {
        if (b.chordIds.length > 0) block.chordIds = [...b.chordIds];
        const bpm = parseInt(b.bpm, 10);
        if (Number.isFinite(bpm)) block.bpm = Math.max(30, Math.min(240, bpm));
      }
      if (b.notes.trim()) block.notes = b.notes.trim().slice(0, 500);
      return block;
    });
    const result = await dispatch(
      existing
        ? { type: "updateRoutine", studentId, routineId: existing.id, name, blocks: payload, at: new Date().toISOString() }
        : { type: "createRoutine", studentId, name, blocks: payload, at: new Date().toISOString() },
    );
    setSaving(false);
    saveInFlight.current = false;
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    navigate(teacherMode ? `/teacher/students/${studentId}` : "/student/practice");
  }

  return (
    <section className="stack">
      <div className="page-heading">
        <div className="eyebrow green">
          {existing ? "SHAPE THIS ROUTINE" : "BUILD YOUR PRACTICE ROUTINE"}
        </div>
        <h1>{existing ? "Edit routine" : teacherMode ? `A routine for ${student.name}` : "Your routine"}</h1>
        <p>
          {totalMinutes} minutes across {blocks.length}{" "}
          {blocks.length === 1 ? "block" : "blocks"} · a good session has a
          beginning, a middle, and a gentle landing.
        </p>
      </div>
      {message && (
        <p role={message.startsWith("Created") || message.startsWith("Saved") ? "status" : "alert"} className="notice">
          {message}
        </p>
      )}
      <div className="card form-card">
        <label>
          Routine name
          <input
            type="text"
            value={name}
            maxLength={60}
            placeholder="My 20-minute session"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      </div>
      {blocks.map((b, i) => (
        <BlockEditor
          key={b.localId}
          block={b}
          index={i}
          total={blocks.length}
          activityOptions={activityOptions}
          onPatch={(p) => patchBlock(b.localId, p)}
          onMove={(dir) => move(b.localId, dir)}
          onRemove={() => setBlocks((bs) => bs.filter((x) => x.localId !== b.localId))}
        />
      ))}
      <button type="button" className="button secondary" onClick={addBlock}>
        <Plus size={16} /> Add a block
      </button>
      <div className="row">
        <button type="button" className="button" disabled={saving} onClick={save}>
          {saving ? "Saving…" : existing ? "Save routine" : "Create routine"}
        </button>
        <button
          type="button"
          className="text-link"
          onClick={() => navigate(teacherMode ? `/teacher/students/${studentId}` : "/student/practice")}
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
