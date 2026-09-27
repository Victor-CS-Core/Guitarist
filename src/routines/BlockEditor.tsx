import { ArrowUp, ArrowDown, Trash2, GripVertical } from "lucide-react";
import { activities } from "../curriculum/foundations";
import { chords } from "../curriculum/chords";
import {
  routineBlockKindLabels,
  routineBlockKinds,
  type RoutineBlockKind,
} from "../domain/types";

export interface DraftBlock {
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

export const KIND_HINTS: Record<RoutineBlockKind, string> = {
  warmup: "Easy finger stretches, slow picking — arrive in your body.",
  technique: "A focused curriculum exercise with steps to follow.",
  chords: "Switch between chords with the metronome keeping you honest.",
  song: "Play a section of a song you love, slowly and cleanly.",
  cooldown: "Slow strums, breathe out, notice what improved today.",
};

export const DEFAULT_TITLES: Record<RoutineBlockKind, string> = {
  warmup: "Finger warm-up",
  technique: "Technique focus",
  chords: "Chord changes",
  song: "Song time",
  cooldown: "Cool-down",
};

const chordEntries = Object.entries(chords);

export function BlockEditor({
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
