import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { useDemo } from "../app/StoreProvider";
import { activities, levels } from "../curriculum/foundations";
import { chords } from "../curriculum/chords";
import { isAppUnlocked, studentRoutines } from "../domain/selectors";
import {
  routineBlockKindLabels,
  routineBlockKinds,
  type RoutineBlock,
  type RoutineBlockKind,
} from "../domain/types";

interface DraftBlock {
  localId: string;
  kind: RoutineBlockKind;
  title: string;
  minutes: number;
  activityId: string;
  chordQuery: string;
  chordIds: string[];
  bpm: string;
  notes: string;
}

const KIND_HINTS: Record<RoutineBlockKind, string> = {
  warmup: "Easy finger stretches, slow picking — arrive in your body.",
  technique: "A focused curriculum exercise with steps to follow.",
  chords: "Switch between chords with the metronome keeping you honest.",
  song: "Play a section of a song you love, slowly and cleanly.",
  cooldown: "Slow strums, breathe out, notice what improved today.",
};

const DEFAULT_TITLES: Record<RoutineBlockKind, string> = {
  warmup: "Finger warm-up",
  technique: "Technique focus",
  chords: "Chord changes",
  song: "Song time",
  cooldown: "Cool-down",
};

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

const chordEntries = Object.entries(chords);

export function RoutineBuilder({
  studentId,
  routineId,
  teacherMode = false,
}: {
  studentId: string;
  routineId?: string;
  teacherMode?: boolean;
}) {
  const { state, dispatch } = useDemo();
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

  if (!student) return <section className="card empty"><h1>Student not found.</h1></section>;
  if (routineId && !existing)
    return <section className="card empty"><h1>Routine not found.</h1></section>;

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

function BlockEditor({
  block,
  index,
  total,
  activityOptions,
  onPatch,
  onMove,
  onRemove,
}: {
  block: DraftBlock;
  index: number;
  total: number;
  activityOptions: typeof activities;
  onPatch: (p: Partial<DraftBlock>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const matches = block.chordQuery.trim()
    ? chordEntries
        .filter(
          ([id, c]) =>
            !block.chordIds.includes(id) &&
            (c.name.toLowerCase().includes(block.chordQuery.trim().toLowerCase()) ||
              id.toLowerCase().includes(block.chordQuery.trim().toLowerCase())),
        )
        .slice(0, 8)
    : [];
  return (
    <div className="card form-card">
      <div className="row spread">
        <strong>
          <GripVertical size={15} /> Block {index + 1} · {routineBlockKindLabels[block.kind]}
        </strong>
        <div className="row">
          <button type="button" className="icon-button" aria-label="Move block up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp size={16} />
          </button>
          <button type="button" className="icon-button" aria-label="Move block down" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown size={16} />
          </button>
          <button type="button" className="icon-button" aria-label="Remove block" disabled={total === 1} onClick={onRemove}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="form-row">
        <label>
          Block type
          <select
            value={block.kind}
            onChange={(e) => {
              const kind = e.target.value as RoutineBlockKind;
              onPatch({ kind, title: "", activityId: "", chordIds: [], chordQuery: "", bpm: "", notes: "" });
            }}
          >
            {routineBlockKinds.map((k) => (
              <option key={k} value={k}>
                {routineBlockKindLabels[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Minutes
          <input
            type="number"
            min={1}
            max={30}
            value={block.minutes}
            onChange={(e) => onPatch({ minutes: Number(e.target.value) })}
          />
        </label>
      </div>
      <label>
        Title
        <input
          type="text"
          value={block.title}
          maxLength={80}
          placeholder={DEFAULT_TITLES[block.kind]}
          onChange={(e) => onPatch({ title: e.target.value })}
        />
      </label>
      <p className="small">{KIND_HINTS[block.kind]}</p>
      {(block.kind === "technique" || block.kind === "song") && (
        <label>
          Curriculum activity
          <select
            value={block.activityId}
            onChange={(e) => onPatch({ activityId: e.target.value })}
          >
            <option value="">Pick an activity…</option>
            {activityOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {block.kind === "chords" && (
        <>
          <div className="chord-pick-list">
            {block.chordIds.map((id) => (
              <button
                key={id}
                type="button"
                className="chip active"
                onClick={() => onPatch({ chordIds: block.chordIds.filter((c) => c !== id) })}
                aria-label={`Remove ${chords[id]?.name ?? id}`}
              >
                {chords[id]?.name ?? id} ✕
              </button>
            ))}
            {block.chordIds.length === 0 && (
              <span className="small">No chords yet — search and tap to add (up to 6).</span>
            )}
          </div>
          <label>
            Find chords
            <input
              type="text"
              value={block.chordQuery}
              placeholder="e.g. G7, Bm, F#m7b5…"
              onChange={(e) => onPatch({ chordQuery: e.target.value })}
            />
          </label>
          {matches.length > 0 && (
            <div className="chord-pick-list">
              {matches.map(([id, c]) => (
                <button
                  key={id}
                  type="button"
                  className="chip"
                  disabled={block.chordIds.length >= 6}
                  onClick={() => onPatch({ chordIds: [...block.chordIds, id], chordQuery: "" })}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <label>
            Metronome target <span className="small">(optional BPM)</span>
            <input
              type="number"
              min={30}
              max={240}
              value={block.bpm}
              placeholder="e.g. 80"
              onChange={(e) => onPatch({ bpm: e.target.value })}
            />
          </label>
        </>
      )}
      {block.kind !== "chords" && (
        <label>
          Notes for yourself <span className="small">(optional)</span>
          <textarea
            value={block.notes}
            maxLength={500}
            rows={2}
            placeholder="What should future-you remember here?"
            onChange={(e) => onPatch({ notes: e.target.value })}
          />
        </label>
      )}
    </div>
  );
}
