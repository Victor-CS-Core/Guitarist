import type { Status } from "../domain/types";
export const statusLabel: Record<Status, string> = {
  NOT_INTRODUCED: "Not introduced",
  INTRODUCED: "Introduced",
  LEARNING: "Learning",
  PRACTICING: "Practicing",
  READY_FOR_ASSESSMENT: "Teacher review",
  MASTERED: "Mastered",
  NEEDS_REINFORCEMENT: "Keep practicing",
};
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      {status === "MASTERED" ? "✓ " : ""}
      {statusLabel[status]}
    </span>
  );
}
