import { Clock3 } from "lucide-react";
import { useStudio } from "../app/StoreProvider";
import { formatDateTime, splitDuration } from "../lib/format";

/**
 * The Activity tab of the student workspace: the practice-session log and
 * the progress-event history, newest first.
 */
export function StudentActivityTab({ studentId }: { studentId: string }) {
  const { state } = useStudio();
  const sessions = state.sessions.filter((s) => s.studentId === studentId);
  const events = state.events.filter((e) => e.studentId === studentId);

  return (
    <div className="learning-layout">
      <section className="card">
        <h2>Practice activity</h2>
        <p>Self-reported time, not evidence of mastery.</p>
        {sessions.length ? (
          sessions
            .slice()
            .reverse()
            .map((s) => {
              const { minutes, seconds } = splitDuration(s.durationSeconds);
              return (
                <div className="activity-row" key={s.id}>
                  <Clock3 size={18} />
                  <div>
                    <strong>
                      {minutes} min {seconds} sec practiced
                    </strong>
                    <p>
                      {formatDateTime(s.at)} · {s.itemIds.length} activities
                    </p>
                  </div>
                </div>
              );
            })
        ) : (
          <p className="spaced">No practice sessions yet.</p>
        )}
      </section>
      <section className="card">
        <h2>Progress history</h2>
        {events
          .slice()
          .reverse()
          .map((e) => (
            <div className="activity-row" key={e.id}>
              <div>
                <strong>{e.text}</strong>
                <p>{formatDateTime(e.at)}</p>
              </div>
            </div>
          ))}
        {!events.length && (
          <p className="spaced">
            New teaching and practice actions will appear here.
          </p>
        )}
      </section>
    </div>
  );
}
