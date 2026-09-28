import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { activityById } from "../curriculum/foundations";
import type { AssignmentItem } from "../domain/types";

/** The "you did it" screen shown when a practice session is submitted. */
export function PracticeComplete({
  seconds,
  items,
  completedIds,
  studentName,
  appUnlocked,
}: {
  seconds: number;
  items: AssignmentItem[];
  completedIds: string[];
  studentName: string;
  appUnlocked: boolean;
}) {
  return (
    <section className="card completion">
      <span className="completion-icon">
        <Check size={38} />
      </span>
      <div className="eyebrow green">YOU SHOWED UP FOR YOUR MUSIC</div>
      <h1>Practice complete.</h1>
      <p>That’s another small step forward, {studentName}.</p>
      <strong className="timer-display">
        {Math.floor(seconds / 60)}
        <small> min </small>
        {seconds % 60}
        <small> sec</small>
      </strong>
      <p>Actual time practiced · self-reported</p>
      <div className="completed-list">
        {items
          .filter((i) => completedIds.includes(i.id))
          .map((i) => (
            <p key={i.id}>
              <Check size={15} /> {activityById(i.activityId)?.title}
            </p>
          ))}
      </div>
      <p className="small">
        Only completed activities are checked off. Unfinished steps remain
        assigned.
      </p>
      <div className="teacher-tip">
        {appUnlocked
          ? "This session is logged in your practice history — just for you."
          : "Your teacher can now see this session. They’ll listen to your playing at your next lesson."}
      </div>
      <Link to="/student" className="button">
        Back home <ArrowRight size={17} />
      </Link>
    </section>
  );
}
