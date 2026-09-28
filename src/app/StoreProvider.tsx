import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Actor, Command, AppState, Result, Student } from "../domain/types";
import { applyCommand } from "../domain/commands";
import { levels, skills } from "../curriculum/foundations";
import { apiRequest, type Identity, type StudentAccount } from "../auth/api";
import { loadStudioSnapshot, saveStudioSnapshot, clearStudioSnapshot } from "../lib/studioSnapshot";

type Status = "loading" | "signed-out" | "ready" | "error";
type ApiError = { error: string };
type StatePayload = { state: AppState; revisions: Record<string, number>; accounts: StudentAccount[] };
const empty: AppState = { version: 1, students: [], assignments: [], sessions: [], notes: [], events: [], routines: [] };
const signedOutActor: Actor = { role: "student", studentId: "" };
const failure = (error: string): Result<never> => ({ ok: false, error });

interface Studio {
  status: Status;
  state: AppState;
  actor: Actor;
  identity: Identity | null;
  accounts: StudentAccount[];
  warning?: string;
  /**
   * True when the app booted from a saved on-device snapshot instead of a
   * server session. The studio is fully local: no sign-in, works offline,
   * every change is written back to the snapshot.
   */
  studioMode: boolean;
  dispatch: (command: Command) => Promise<Result<AppState>>;
  login: (username: string, password: string) => Promise<Result<Identity>>;
  logout: () => Promise<boolean>;
  createStudent: (name: string, username: string, password: string) => Promise<Result<string>>;
  resetStudentPassword: (id: string, password: string) => Promise<Result<null>>;
  setStudentDisabled: (id: string, disabled: boolean) => Promise<Result<null>>;
  refresh: () => Promise<void>;
  practiceActive: boolean;
  setPracticeActive: (active: boolean) => void;
}
const Context = createContext<Studio | null>(null);

export function StoreProvider({ children, initialState, initialActor }: {
  children: ReactNode; initialState?: AppState; initialActor?: Actor;
}) {
  const fixture = !!initialState;
  const [state, setState] = useState<AppState>(initialState ?? empty);
  const [actor, setActor] = useState<Actor>(initialActor ?? signedOutActor);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [status, setStatus] = useState<Status>(fixture ? "ready" : "loading");
  const [accounts, setAccounts] = useState<StudentAccount[]>([]);
  const [revisions, setRevisions] = useState<Record<string, number>>({});
  const [warning, setWarning] = useState<string>();
  const [practiceActive, setPracticeActive] = useState(false);
  const [studioMode, setStudioMode] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const revisionsRef = useRef(revisions);
  revisionsRef.current = revisions;

  async function refresh() {
    if (fixture || studioMode) return;
    const result = await apiRequest<StatePayload | ApiError>("/api/state");
    if (result.status === 401) { setStatus("signed-out"); return; }
    if (result.status !== 200 || !("state" in result.data)) throw Error("Could not load your studio.");
    setState(result.data.state);
    revisionsRef.current = result.data.revisions;
    setRevisions(result.data.revisions);
    setAccounts(result.data.accounts);
    setWarning(undefined);
  }
  useEffect(() => {
    if (fixture) return;
    // A saved on-device studio takes precedence over the server session:
    // the app opens straight into the student's personal studio with no
    // sign-in, and works fully offline.
    const snapshot = loadStudioSnapshot();
    if (snapshot) {
      setState(snapshot.state);
      setActor(snapshot.actor);
      setStudioMode(true);
      setStatus("ready");
      return;
    }
    let active = true;
    async function load() {
      try {
        const result = await apiRequest<Identity | ApiError>("/api/me");
        if (!active) return;
        if (result.status === 401) { setStatus("signed-out"); return; }
        if (result.status !== 200 || !("role" in result.data)) throw Error("Could not check your session.");
        setIdentity(result.data);
        setActor(result.data.role === "teacher" ? { role: "teacher" } : { role: "student", studentId: result.data.studentId ?? "" });
        await refresh();
        if (active) setStatus("ready");
      } catch {
        if (active) { setStatus("error"); setWarning("Could not connect to Guitarist. Check your connection and reload."); }
      }
    }
    void load();
    return () => { active = false; };
  }, [fixture]);

  async function login(username: string, password: string): Promise<Result<Identity>> {
    try {
      const result = await apiRequest<Identity | ApiError>("/api/login", { method: "POST", body: JSON.stringify({ username, password }) });
      if (result.status !== 200 || !("role" in result.data)) return failure("error" in result.data ? result.data.error : "Sign in failed.");
      setIdentity(result.data);
      setActor(result.data.role === "teacher" ? { role: "teacher" } : { role: "student", studentId: result.data.studentId ?? "" });
      await refresh();
      setStatus("ready");
      return { ok: true, value: result.data };
    } catch { return failure("Could not connect to Guitarist. Please try again."); }
  }
  async function logout(): Promise<boolean> {
    if (studioMode) {
      // Leaving the on-device studio removes it from this phone. The
      // student can sign in again anytime and re-save it.
      clearStudioSnapshot();
    } else if (!fixture) {
      try {
        const result = await apiRequest<{ok:boolean} | ApiError>("/api/logout", { method: "POST", body: "{}" });
        if (result.status !== 200 || !("ok" in result.data) || !result.data.ok) {
          setWarning("Could not sign out. Please try again.");
          return false;
        }
      } catch {
        setWarning("Could not sign out. Check your connection and try again.");
        return false;
      }
    }
    setStatus("signed-out"); setIdentity(null); setActor(signedOutActor); setState(empty); setAccounts([]); setRevisions({}); revisionsRef.current = {}; setStudioMode(false);
    return true;
  }
  async function dispatch(command: Command): Promise<Result<AppState>> {
    if (fixture || studioMode) {
      const result = applyCommand(stateRef.current, actor, command);
      if (result.ok) {
        setState(result.value);
        if (studioMode) saveStudioSnapshot({ state: result.value, actor, savedAt: Date.now() });
      }
      return result;
    }
    try {
      const result = await apiRequest<{state:AppState;revision:number} | ApiError>("/api/commands", {
        method: "POST", body: JSON.stringify({ command, revision: revisionsRef.current[command.studentId] }),
      });
      if (result.status !== 200 || !("state" in result.data)) {
        if (result.status === 409) await refresh();
        return failure("error" in result.data ? result.data.error : "Could not save this change.");
      }
      await refresh();
      return { ok: true, value: result.data.state };
    } catch { return failure("Could not save this change. Please try again."); }
  }
  async function createStudent(name: string, username: string, password: string): Promise<Result<string>> {
    try {
      const result = await apiRequest<{studentId:string} | ApiError>("/api/students", { method: "POST", body: JSON.stringify({ displayName: name, username, password }) });
      if (result.status !== 201 || !("studentId" in result.data)) return failure("error" in result.data ? result.data.error : "Could not create this student.");
      await refresh();
      return { ok: true, value: result.data.studentId };
    } catch { return failure("Could not create this student. Please try again."); }
  }
  async function accountChange(id: string, path: string, body: unknown): Promise<Result<null>> {
    try {
      const result = await apiRequest<{ok:boolean} | ApiError>("/api/students/" + encodeURIComponent(id) + "/" + path, { method: "PATCH", body: JSON.stringify(body) });
      if (result.status !== 200) return failure("error" in result.data ? result.data.error : "Could not update this account.");
      await refresh();
      return { ok: true, value: null };
    } catch { return failure("Could not update this account. Please try again."); }
  }
  return <Context.Provider value={{
    status, state, actor, identity, accounts, warning, studioMode, dispatch, login, logout, createStudent,
    resetStudentPassword: (id, password) => accountChange(id, "credentials", { password }),
    setStudentDisabled: (id, disabled) => accountChange(id, "status", { disabled }),
    refresh, practiceActive, setPracticeActive,
  }}>{children}</Context.Provider>;
}

export function useStudio() {
  const value = useContext(Context);
  if (!value) throw Error("Studio provider is required");
  return value;
}
const preview: Student = {
  id: "preview", name: "Student", currentLevelId: levels[0].id, unlockedLevels: [levels[0].id],
  skills: Object.fromEntries(skills.map((skill) => [skill.id, "NOT_INTRODUCED"])) as Student["skills"],
  goal: levels[0].goal, appUnlocked: false,
};
export function useStudent(): Student {
  const { state, actor } = useStudio();
  return state.students.find((student) => student.id === (actor.role === "student" ? actor.studentId : state.students[0]?.id)) ?? preview;
}
