import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { House, BookOpen, Music2, ChartNoAxesCombined, Guitar, Users, LogOut } from "lucide-react";
import { AgentTools } from "../integrations/AgentTools";
import { useStudio, useStudent } from "../app/StoreProvider";

export function AppShell() {
  const { actor, identity, warning, logout, practiceActive } = useStudio();
  const student = useStudent();
  const navigate = useNavigate();
  const teacher = actor.role === "teacher";
  const links = teacher
    ? ([["/teacher", "Students", Users], ["/teacher/curriculum", "Curriculum", BookOpen]] as const)
    : ([["/student", "Home", House], ["/student/learn", "Learn", BookOpen], ["/student/practice", "Practice", Music2], ["/student/progress", "Progress", ChartNoAxesCombined]] as const);
  async function signOut() {
    if (practiceActive && !window.confirm("Leave unfinished practice? Unsaved practice time will be discarded.")) return;
    await logout();
    navigate("/", { replace: true });
  }
  return <div className="app-layout">
    <AgentTools />
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <NavLink className="brand" to={teacher ? "/teacher" : "/student"}>
        <span className="brand-symbol"><Guitar size={25} /></span>Guitarist<span className="brand-dot">.</span>
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
        <div className="account-controls"><span>{identity?.username}</span><button className="button secondary signout" type="button" onClick={signOut}><LogOut size={16} /> Sign out</button></div>
      </header>
      {warning && <div role="status" className="notice">{warning}</div>}
      <main id="main"><Outlet /></main>
      <footer>Made for the moments between lessons.</footer>
    </div>
  </div>;
}
