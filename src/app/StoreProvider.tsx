import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Actor, Command, DemoState, Result, Student } from "../domain/types";
import { applyCommand } from "../domain/commands";
import { levels, skills } from "../curriculum/foundations";
import { apiRequest, type Identity, type StudentAccount } from "../auth/api";

type Status = "loading" | "signed-out" | "ready" | "error";
type ApiError = { error: string };
type StatePayload = { state: DemoState; revisions: Record<string, number>; accounts: StudentAccount[] };
const empty: DemoState = { version: 1, students: [], assignments: [], sessions: [], notes: [], events: [] };
const signedOutActor: Actor = { role: "student", studentId: "" };
const failure = (error: string): Result<never> => ({ ok: false, error });

interface Studio {
  status: Status;
  state: DemoState;
  actor: Actor;
  identity: Identity | null;
  accounts: StudentAccount[];
  warning?: string;
  dispatch: (command: Command) => Promise<Result<DemoState>>;
  login: (username: string, password: string) => Promise<Result<Identity>>;
  logout: () => Promise<void>;
  createStudent: (name: string, username: string, password: string) => Promise<Result<string>>;
  resetStudentPassword: (id: string, password: string) => Promise<Result<null>>;
  setStudentDisabled: (id: string, disabled: boolean) => Promise<Result<null>>;
  refresh: () => Promise<void>;
  practiceActive: boolean;
  setPracticeActive: (active: boolean) => void;
}
const Context = createContext<Studio | null>(null);

export function StoreProvider({ children, initialState, initialActor }: {
  children: ReactNode; initialState?: DemoState; initialActor?: Actor;
}) {
  const fixture = !!initialState;
  const [state, setState] = useState<DemoState>(initialState ?? empty);
  const [actor, setActor] = useState<Actor>(initialActor ?? signedOutActor);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [status, setStatus] = useState<Status>(fixture ? "ready" : "loading");
  const [accounts, setAccounts] = useState<StudentAccount[]>([]);
  const [revisions, setRevisions] = useState<Record<string, number>>({});
  const [warning, setWarning] = useState<string>();
  const [practiceActive, setPracticeActive] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  async function refresh() {
    if (fixture) return;
    const result = await apiRequest<StatePayload | ApiError>("/api/state");
    if (result.status === 401) { setStatus("signed-out"); return; }
    if (result.status !== 200 || !("state" in result.data)) throw Error("Could not load your studio.");
    setState(result.data.state);
    setRevisions(result.data.revisions);
    setAccounts(result.data.accounts);
    setWarning(undefined);
  }
  useEffect(() => {
    if (fixture) return;
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
  async function logout() {
    if (!fixture) await apiRequest<{ok:boolean}>("/api/logout", { method: "POST", body: "{}" }).catch(() => undefined);
    setStatus("signed-out"); setIdentity(null); setActor(signedOutActor); setState(empty); setAccounts([]); setRevisions({});
  }
  async function dispatch(command: Command): Promise<Result<DemoState>> {
    if (fixture) {
      const result = applyCommand(stateRef.current, actor, command);
      if (result.ok) setState(result.value);
      return result;
    }
    try {
      const result = await apiRequest<{state:DemoState;revision:number} | ApiError>("/api/commands", {
        method: "POST", body: JSON.stringify({ command, revision: revisions[command.studentId] }),
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
    status, state, actor, identity, accounts, warning, dispatch, login, logout, createStudent,
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
export const useDemo = useStudio;
const preview: Student = {
  id: "preview", name: "Student", currentLevelId: levels[0].id, unlockedLevels: [levels[0].id],
  skills: Object.fromEntries(skills.map((skill) => [skill.id, "NOT_INTRODUCED"])) as Student["skills"],
  goal: levels[0].goal,
};
export function useStudent(): Student {
  const { state, actor } = useStudio();
  return state.students.find((student) => student.id === (actor.role === "student" ? actor.studentId : state.students[0]?.id)) ?? preview;
}
