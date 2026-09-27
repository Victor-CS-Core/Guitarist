import { useEffect, useRef } from "react";

/**
 * Confirmation dialog shown when the student tries to navigate away from an
 * unfinished practice session. Rendered through a native <dialog> so it
 * traps focus while the router blocker holds the navigation.
 */
export function LeavePractice({
  onStay,
  onLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onStay();
      }}
    >
      <h2>Leave this practice?</h2>
      <p>
        Your unfinished session has not been saved. Stay to finish early and
        record your time, or leave and discard it.
      </p>
      <div className="row">
        <button className="button" autoFocus onClick={onStay}>
          Keep practicing
        </button>
        <button className="button secondary" onClick={onLeave}>
          Leave without saving
        </button>
      </div>
    </dialog>
  );
}
