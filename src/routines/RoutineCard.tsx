import { Link } from "react-router-dom";
import { Play, Pencil, Trash2, Flame, Target, LayoutGrid, Music2, Waves, GraduationCap } from "lucide-react";
import { routineMinutes } from "../domain/selectors";
import { routineBlockKindLabels, type Routine, type RoutineBlockKind } from "../domain/types";

const KIND_ICONS: Record<RoutineBlockKind, typeof Flame> = {
  warmup: Flame,
  technique: Target,
  chords: LayoutGrid,
  song: Music2,
  cooldown: Waves,
};

export function RoutineCard({
  routine,
  playTo,
  editTo,
  onDelete,
  deleting = false,
  audience = "student",
}: {
  routine: Routine;
  playTo?: string;
  editTo?: string;
  onDelete?: () => void;
  deleting?: boolean;
  /** "teacher" renders the shared badge from the teacher's point of view. */
  audience?: "student" | "teacher";
}) {
  return (
    <div className="card routine-card">
      <div className="row spread">
        <div>
          <h3>{routine.name}</h3>
          <p className="small">
            {routineMinutes(routine)} min · {routine.blocks.length}{" "}
            {routine.blocks.length === 1 ? "block" : "blocks"}
          </p>
        </div>
        {routine.createdBy === "teacher" && (
          <span className="badge teacher-shared">
            <GraduationCap size={14} />{" "}
            {audience === "teacher" ? "Shared routine" : "Shared by your teacher"}
          </span>
        )}
      </div>
      <div className="routine-block-strip" aria-label="Blocks in this routine">
        {routine.blocks.map((b) => {
          const Icon = KIND_ICONS[b.kind];
          return (
            <span key={b.id} className="routine-block-chip" title={`${b.title} · ${b.minutes} min`}>
              <Icon size={13} /> {routineBlockKindLabels[b.kind]}
            </span>
          );
        })}
      </div>
      <div className="row">
        {playTo && (
          <Link className="button" to={playTo}>
            <Play size={16} /> Play routine
          </Link>
        )}
        {editTo && (
          <>
            <Link className="button secondary" to={editTo} aria-label={`Edit ${routine.name}`}>
              <Pencil size={15} />
            </Link>
            {onDelete && (
              <button
                type="button"
                className="icon-button"
                aria-label={`Delete ${routine.name}`}
                disabled={deleting}
                onClick={onDelete}
              >
                <Trash2 size={16} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
