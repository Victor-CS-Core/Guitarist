import { useState } from "react";
import { useStudio } from "../app/StoreProvider";
import type { Student } from "../domain/types";

/**
 * The Account tab of the student workspace: password reset, access
 * enable/disable, and the graduation-gift app unlock.
 */
export function StudentAccountTab({ student }: { student: Student }) {
  const { accounts, dispatch, resetStudentPassword, setStudentDisabled } =
    useStudio();
  const account = accounts.find((a) => a.studentId === student.id);
  const [newPassword, setNewPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [unlockMessage, setUnlockMessage] = useState("");
  const [accountPending, setAccountPending] = useState(false);

  return (
    <>
      <section className="card form-card account-panel">
        <h2>Student access</h2>
        <p>
          Username: <strong>{account?.username}</strong>
        </p>
        <p>
          {account?.disabled
            ? "This account is disabled."
            : "This student can sign in."}
        </p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setAccountPending(true);
            setAccountMessage("");
            const result = await resetStudentPassword(student.id, newPassword);
            setAccountPending(false);
            setAccountMessage(
              result.ok
                ? "Password changed. The student must sign in again."
                : result.error,
            );
            if (result.ok) setNewPassword("");
          }}
        >
          <label htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={256}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <button
            className="button secondary"
            type="submit"
            disabled={accountPending}
          >
            Reset password
          </button>
        </form>
        <button
          className={account?.disabled ? "button secondary" : "button danger"}
          type="button"
          disabled={accountPending}
          onClick={async () => {
            setAccountPending(true);
            setAccountMessage("");
            const result = await setStudentDisabled(
              student.id,
              !account?.disabled,
            );
            setAccountPending(false);
            setAccountMessage(
              result.ok
                ? account?.disabled
                  ? "Student access enabled."
                  : "Student access disabled."
                : result.error,
            );
          }}
        >
          {account?.disabled ? "Enable student access" : "Disable student access"}
        </button>
        {accountMessage && (
          <p role="status" className="form-message">
            {accountMessage}
          </p>
        )}
      </section>
      <section
        className="card form-card spaced"
        aria-labelledby="unlock-app-heading"
      >
        <h2 id="unlock-app-heading">Graduation gift: unlock the app</h2>
        <p>
          {student.appUnlocked === true
            ? `${student.name} keeps the app as a personal practice studio — no more assignments or due dates, just tools, the full chord library, and their own practice rhythm.`
            : `Finished the course? Unlock the app and ${student.name} keeps it as a personal practice studio — a gift for the road ahead.`}
        </p>
        <button
          className="button"
          type="button"
          disabled={accountPending}
          onClick={async () => {
            setAccountPending(true);
            setUnlockMessage("");
            const r = await dispatch({
              type: "setAppUnlocked",
              studentId: student.id,
              unlocked: student.appUnlocked !== true,
              at: new Date().toISOString(),
            });
            setAccountPending(false);
            setUnlockMessage(
              r.ok
                ? student.appUnlocked === true
                  ? "The app is locked for this student again."
                  : "The app is unlocked — it’s theirs to keep."
                : r.error,
            );
          }}
        >
          {student.appUnlocked === true
            ? "Lock the app again"
            : `Unlock the app for ${student.name}`}
        </button>
        {unlockMessage && (
          <p role="status" className="form-message">
            {unlockMessage}
          </p>
        )}
      </section>
    </>
  );
}
