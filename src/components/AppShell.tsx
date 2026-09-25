import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { House, BookOpen, Music2, ChartNoAxesCombined, Users, LogOut, ClipboardList, Wrench, Sun, Moon, Mic } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { AgentTools } from "../integrations/AgentTools";
import { useStudio, useStudent } from "../app/StoreProvider";
import { getStoredTheme, setStoredTheme, type Theme } from "../lib/theme";

export function AppShell() {
  const { actor, identity, warning, logout, practiceActive } = useStudio();
  const student = useStudent();
  const navigate = useNavigate();
  const teacher = actor.role === "teacher";
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === "guitarist:theme") setTheme(getStoredTheme());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function toggleTheme() {
    setTheme(setStoredTheme(theme === "dark" ? "light" : "dark"));
  }
  const links = teacher
    ? ([["/teacher", "Students", Users], ["/teacher/curriculum", "Curriculum", BookOpen], ["/teacher/assignments", "Assignments", ClipboardList], ["/teacher/check-ins", "Check-ins", Mic], ["/tools", "Tools", Wrench]] as const)
    : ([["/student", "Home", House], ["/student/learn", "Learn", BookOpen], ["/student/practice", "Practice", Music2], ["/student/progress", "Progress", ChartNoAxesCombined], ["/tools", "Tools", Wrench]] as const);
  async function signOut() {
    if (practiceActive && !window.confirm("Leave unfinished practice? Unsaved practice time will be discarded.")) return;
    if (await logout()) navigate("/", { replace: true });
  }
  return <div className="app-layout">
    <AgentTools />
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <NavLink className="brand" to={teacher ? "/teacher" : "/student"}>
        <span className="brand-symbol"><BrandMark size={37} /></span><span>Guitarist<span className="brand-dot">.</span></span>
      </NavLink>
      <div className="sidebar-label">YOUR MUSIC JOURNEY</div>
      <nav aria-label="Main navigation">
        {links.map(([to, label, Icon]) => <NavLink key={to} end={to === "/student" || to === "/teacher"} to={to} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}><Icon size={20} />{label}</NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><Music2 size={22} /><p>A little practice.<br /><strong>A lifetime of music.</strong></p></div>
        <div className="profile-row"><span className="avatar">{(identity?.displayName ?? "G")[0]}</span><div><strong>{teacher ? identity?.displayName : student.name}</strong><small>{teacher ? "Your teaching studio" : "Beginner Guitar Foundations"}</small></div></div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <span className="eyebrow">{teacher ? "THE TEACHING STUDIO" : "BEGINNER GUITAR FOUNDATIONS"}</span>
        <div className="account-controls">
          <button
            className="icon-button theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span>{identity?.username}</span><button className="button secondary signout" type="button" onClick={signOut}><LogOut size={16} /> Sign out</button></div>
      </header>
      {warning && <div role="status" className="notice">{warning}</div>}
      <main id="main"><Outlet /></main>
      <footer>Made for the moments between lessons.</footer>
    </div>
  </div>;
}
