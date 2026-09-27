import { useState } from "react";
import { useStudio } from "../app/StoreProvider";
import { formatDate } from "../lib/format";

/**
 * The Notes tab of the student workspace: the private lesson-note form plus
 * the note history, newest first.
 */
export function StudentNotesTab({ studentId }: { studentId: string }) {
  const { state, dispatch } = useStudio();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [notePending, setNotePending] = useState(false);

  return (
    <div className="learning-layout">
      <form
        className="card form-card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (notePending) return;
          setNotePending(true);
          const r = await dispatch({
            type: "saveNote",
            studentId,
            text: note,
            at: new Date().toISOString(),
          });
          setNotePending(false);
          setMessage(r.ok ? "Lesson note saved." : r.error);
          if (r.ok) setNote("");
        }}
      >
        <h2>Lesson notes</h2>
        <p>These notes are visible only in your teacher account.</p>
        <label>
          Your note
          <textarea
            rows={6}
            maxLength={3000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
          />
        </label>
        <button className="button" type="submit" disabled={notePending}>
          {notePending ? "Saving…" : "Save note"}
        </button>
        <p role="status" className="form-message">
          {message}
        </p>
      </form>
      <div className="stack">
        {state.notes
          .filter((n) => n.studentId === studentId)
          .slice()
          .reverse()
          .map((n) => (
            <article className="card" key={n.id}>
              <span className="eyebrow">{formatDate(n.at)}</span>
              <p className="note-text spaced">{n.text}</p>
            </article>
          ))}
      </div>
    </div>
  );
}
