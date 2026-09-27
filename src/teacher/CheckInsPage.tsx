import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AudioLines, Trash2 } from "lucide-react";
import { apiRequest } from "../auth/api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { formatClipDuration } from "../student/checkInUtils";
import { formatDate, formatTime } from "../lib/format";
import type { CheckinSummary } from "../student/CheckInRecorder";

interface ClipGroup {
  studentId: string;
  studentName: string;
  clips: CheckinSummary[];
}

export function CheckInsPage() {
  const [clips, setClips] = useState<CheckinSummary[]>([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await apiRequest<{ checkins: CheckinSummary[] } | { error: string }>("/api/checkins");
        if (!active) return;
        if (result.status === 200 && "checkins" in result.data) {
          setClips(result.data.checkins);
        } else {
          setLoadError(true);
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const groups = useMemo<ClipGroup[]>(() => {
    const byStudent = new Map<string, ClipGroup>();
    for (const clip of clips) {
      if (studentId && clip.studentId !== studentId) continue;
      const group = byStudent.get(clip.studentId) ?? {
        studentId: clip.studentId,
        studentName: clip.studentName ?? "A student",
        clips: [],
      };
      group.clips.push(clip);
      byStudent.set(clip.studentId, group);
    }
    return [...byStudent.values()];
  }, [clips, studentId]);

  const studentOptions = useMemo(
    () => groups.map((g) => ({ id: g.studentId, name: g.studentName })),
    [groups],
  );

  async function deleteClip(id: string) {
    try {
      const result = await apiRequest<{ ok: true } | { error: string }>(`/api/checkins/${id}`, { method: "DELETE" });
      if (result.status === 200) setClips((list) => list.filter((clip) => clip.id !== id));
    } catch {
      /* leave the row; the teacher can retry */
    }
  }

  return (
    <>
      <Link className="text-link" to="/teacher">
        <ArrowLeft size={16} /> Your studio
      </Link>
      <div className="page-heading">
        <div className="eyebrow green">YOUR TEACHING STUDIO</div>
        <h1>Audio check-ins</h1>
        <p>
          Short practice clips your students recorded between lessons. Listen,
          then bring your notes to the next session.
        </p>
      </div>

      <section className="card form-card spaced">
        <div className="row spread">
          <label>
            Student
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">All students</option>
              {studentOptions.map((s) => (
                <option value={s.id} key={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="small">{clips.length} {clips.length === 1 ? "check-in" : "check-ins"} in your studio</p>
      </section>

      {loading && <p className="small" role="status">Loading check-ins…</p>}
      {loadError && !loading && (
        <EmptyState
          icon={<AudioLines size={35} />}
          title="Couldn't load the check-ins."
          message="Check your connection and reload."
        />
      )}

      {!loading && !loadError && groups.length === 0 && (
        <EmptyState
          icon={<AudioLines size={35} />}
          title="No check-ins yet."
          message={
            clips.length
              ? "No clips match this filter."
              : "When a student records a practice clip from their home page, it will appear here."
          }
        />
      )}

      {!loading && groups.map((group) => (
        <section className="card spaced" key={group.studentId} aria-label={`Check-ins from ${group.studentName}`}>
          <div className="row spread">
            <h2 className="m-0">{group.studentName}</h2>
            <span className="small">{group.clips.length} {group.clips.length === 1 ? "clip" : "clips"}</span>
          </div>
          <div className="stack spaced">
            {group.clips.map((clip) => (
              <div className="activity-row" key={clip.id}>
                <AudioLines size={18} aria-hidden />
                <div className="flex-1 min-w-0">
                  <strong>
                    {formatClipDuration(clip.durationSeconds)} ·{" "}
                    {formatDate(clip.createdAt)}
                    {" "}
                    <span className="small">
                      {formatTime(clip.createdAt)}
                    </span>
                  </strong>
                  <audio controls preload="none" src={`/api/checkins/${clip.id}/audio`} className="w-full mt-8" />
                </div>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setPendingDelete(clip.id)}
                  aria-label={`Delete check-in from ${group.studentName}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this check-in?"
        message="The student will see it disappear from their history."
        onConfirm={() => {
          if (pendingDelete) void deleteClip(pendingDelete);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
