import type { Actor, DemoState } from "../domain/types";
export function practiceSummary(state: DemoState, actor: Actor) {
  if (actor.role !== "student")
    throw Error("Sign in as a student first.");
  const student = state.students.find((s) => s.id === actor.studentId);
  if (!student) throw Error("Student not found.");
  return {
    student: student.name,
    pendingActivities: state.assignments
      .filter((a) => a.studentId === student.id)
      .flatMap((a) => a.items)
      .filter((i) => !i.completed).length,
    recordedSeconds: state.sessions
      .filter((s) => s.studentId === student.id)
      .reduce((n, s) => n + s.durationSeconds, 0),
  };
}
export function validateEmptyInput(value: unknown): void {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length
  )
    throw Error("This tool accepts an empty object only.");
}
interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
}
interface ModelContext {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
}
export function registerTools(
  doc: Document,
  read: () => { state: DemoState; actor: Actor },
  navigate: () => void,
) {
  const context = (doc as Document & { modelContext?: ModelContext })
    .modelContext;
  if (!context?.registerTool) return () => {};
  const lifecycle = new AbortController();
  const common = {
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
  };
  const tools: Tool[] = [
    {
      ...common,
      name: "get_practice_summary",
      title: "Read practice summary",
      description:
        "Read pending activities and recorded seconds for the signed-in student.",
      execute: (input) => {
        validateEmptyInput(input);
        const { state, actor } = read();
        return practiceSummary(state, actor);
      },
    },
    {
      ...common,
      name: "navigate_to_practice",
      title: "Open assigned practice",
      description:
        "Open the practice page for the signed-in student. Does not start the timer or complete practice.",
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        validateEmptyInput(input);
        const { state, actor } = read();
        practiceSummary(state, actor);
        navigate();
        return { page: "/student/practice", timerStarted: false };
      },
    },
  ];
  for (const tool of tools) {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Optional browser capability; ordinary UI remains available. */
    }
  }
  return () => lifecycle.abort();
}
