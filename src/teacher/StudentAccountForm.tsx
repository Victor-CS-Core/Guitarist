import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { useStudio } from "../app/StoreProvider";

export function StudentAccountForm() {
  const { createStudent } = useStudio();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true); setMessage("");
    const result = await createStudent(name, username, password);
    setPending(false);
    if (result.ok) {
      setName(""); setUsername(""); setPassword(""); setOpen(false);
      setMessage("Student account created.");
    } else setMessage(result.error);
  }
  return <div className="student-account-area">
    <button className="button add-student" type="button" onClick={() => { setOpen(!open); setMessage(""); }}><UserPlus size={18} /> Add student</button>
    {open && <form className="card form-card student-account-form" onSubmit={submit}>
      <h2>Create a student account</h2>
      <p>Give your student their username and password in person. No email is needed.</p>
      <label htmlFor="student-name">Student name</label>
      <input id="student-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required />
      <label htmlFor="student-username">Student username</label>
      <input id="student-username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,31}" autoComplete="off" required />
      <label htmlFor="student-password">Student password</label>
      <input id="student-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={256} autoComplete="new-password" required />
      <button className="button" type="submit" disabled={pending}>{pending ? "Creating…" : "Create student"}</button>
    </form>}
    {message && <p role={open ? "alert" : "status"} className="form-message">{message}</p>}
  </div>;
}
