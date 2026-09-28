import { Link } from "react-router-dom";
import { Music2 } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { RoutineSection } from "../routines/RoutineSection";

/** Shown on the practice page when there is nothing assigned to practice. */
export function PracticeEmpty({ appUnlocked }: { appUnlocked: boolean }) {
  return (
    <>
      <RoutineSection />
      <EmptyState
        icon={<Music2 size={38} />}
        title="You’re all caught up."
        message={
          appUnlocked
            ? "No assignments on your stand — this studio is yours now. Run a routine above, warm up with a tool below, or revisit any lesson."
            : "Your assigned practice is complete, or your teacher hasn’t assigned it yet."
        }
      >
        {appUnlocked ? (
          <div className="hero-actions">
            <Link className="button" to="/tools/timer">
              Start a timed session
            </Link>
            <Link className="text-link" to="/tools/chords">
              Browse the chord library
            </Link>
          </div>
        ) : (
          <Link className="button" to="/student/learn">
            Explore your lessons
          </Link>
        )}
        <p className="small">You can revisit completed activities from Home.</p>
      </EmptyState>
    </>
  );
}
