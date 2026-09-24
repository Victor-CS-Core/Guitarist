import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import { useDemo } from "../app/StoreProvider";
import { registerTools } from "./webmcp";
export function AgentTools() {
  const { state, actor } = useDemo(),
    navigate = useNavigate(),
    latest = useRef({ state, actor });
  latest.current = { state, actor };
  useEffect(
    () =>
      registerTools(
        document,
        () => latest.current,
        () => flushSync(() => void navigate("/student/practice")),
      ),
    [navigate],
  );
  return null;
}
