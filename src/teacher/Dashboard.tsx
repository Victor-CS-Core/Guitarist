import { Link } from "react-router-dom";
import { ArrowRight, Users, Music2, ClipboardCheck } from "lucide-react";
import { useDemo } from "../demo/StoreProvider";
import { levels } from "../curriculum/foundations";
import { StatusBadge } from "../components/StatusBadge";
export function TeacherDashboard() {
  const { state } = useDemo();
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">YOUR TEACHING STUDIO</div>
        <h1>Small steps. Real musicians.</h1>
        <p>A clear picture of each student, before the first note.</p>
      </div>
      <div className="stats-grid">
        <div className="card">
          <Users size={22} />
          <strong className="stat-value">{state.students.length}</strong>
          <p>Students in your studio</p>
        </div>
        <div className="card">
          <Music2 size={22} />
          <strong className="stat-value">{state.sessions.length}</strong>
          <p>Recorded practice sessions</p>
        </div>
        <div className="card">
          <ClipboardCheck size={22} />
          <strong className="stat-value">
            {state.students.reduce(
              (n, s) =>
                n +
                Object.values(s.skills).filter(
                  (v) => v === "READY_FOR_ASSESSMENT",
                ).length,
              0,
            )}
          </strong>
          <p>Skills ready for your review</p>
        </div>
      </div>
      <div className="section-heading">
        <h2>Your students</h2>
        <span className="small">Fictional studio · Jamie Taylor</span>
      </div>
      <div className="teacher-students">
        {state.students.map((s) => {
          const level = levels.find((l) => l.id === s.currentLevelId)!;
          const sessions = state.sessions.filter((x) => x.studentId === s.id);
          return (
            <Link
              className="card student-card"
              key={s.id}
              to={`/teacher/students/${s.id}`}
            >
              <div className="row spread">
                <div className="row">
                  <span className="avatar large">{s.name[0]}</span>
                  <div>
                    <h2>{s.name}</h2>
                    <p>
                      Level {level.order} · {level.title}
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} />
              </div>
              <div className="skill-list">
                {level.skills.slice(0, 3).map((k) => (
                  <div className="row spread" key={k.id}>
                    <span>{k.title}</span>
                    <StatusBadge status={s.skills[k.id]} />
                  </div>
                ))}
              </div>
              <div className="teacher-tip">
                <span className="eyebrow">NEXT LESSON GOAL</span>
                <p>{s.goal}</p>
              </div>
              <p className="small">
                {sessions.length} practice sessions ·{" "}
                {Math.round(
                  sessions.reduce((n, x) => n + x.durationSeconds, 0) / 60,
                )}{" "}
                recorded minutes
              </p>
            </Link>
          );
        })}
      </div>
      <p className="small spaced">
        Practice time is self-reported. Your in-person assessment remains the
        measure of mastery.
      </p>
    </>
  );
}
