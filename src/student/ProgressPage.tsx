import { Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useDemo, useStudent } from "../demo/StoreProvider";
import { levels, skills } from "../curriculum/foundations";
import { earnedBadgeIds } from "../domain/selectors";
import { StatusBadge } from "../components/StatusBadge";
import { ChapterBadge } from "../components/ChapterBadge";
export function ProgressPage() {
  const student = useStudent(),
    { state } = useDemo(),
    badges = earnedBadgeIds(state, student.id),
    mastered = Object.values(student.skills).filter(
      (s) => s === "MASTERED",
    ).length;
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">LOOK HOW FAR YOU’VE COME</div>
        <h1>Your progress</h1>
        <p>Every skill is a small win. Every practice helps it grow.</p>
      </div>
      <div className="stats-grid">
        <div className="card">
          <span className="eyebrow">SKILLS MASTERED</span>
          <strong className="stat-value">
            {mastered}
            <small> / {skills.length}</small>
          </strong>
          <p>Confirmed by your teacher</p>
        </div>
        <div className="card">
          <span className="eyebrow">CHAPTER BADGES</span>
          <strong className="stat-value">
            {badges.length}
            <small> / 8</small>
          </strong>
          <p>Earned through demonstrated mastery</p>
        </div>
        <div className="card">
          <span className="eyebrow">PRACTICE SESSIONS</span>
          <strong className="stat-value">
            {state.sessions.filter((s) => s.studentId === student.id).length}
          </strong>
          <p>Time spent making space for music</p>
        </div>
      </div>
      <div className="section-heading">
        <h2>Your chapters</h2>
        <p>No deadlines. Your own rhythm.</p>
      </div>
      <div className="journey" aria-label="Connected chapter progress path">
        {levels.map((l) => {
          const earned = badges.includes(l.badgeId);
          const unlocked = student.unlockedLevels.includes(l.id);
          return (
            <section
              className={`card journey-level ${earned ? "journey-earned" : unlocked ? "journey-current" : "journey-locked"}`}
              key={l.id}
            >
              <div className="journey-node">
                <ChapterBadge
                  badgeId={l.badgeId}
                  title={l.title}
                  earned={earned}
                />
              </div>
              <div className="journey-content">
                <div className="eyebrow">CHAPTER {l.order}</div>
                <Link to={`/student/learn/${l.id}`}>
                  <h2>{l.title}</h2>
                </Link>
                <p className="journey-badge-name">
                  {earned ? (
                    <>
                      <Check size={15} /> {l.badgeId.replaceAll("-", " ")} badge
                      collected
                    </>
                  ) : unlocked ? (
                    "A badge to earn with your teacher"
                  ) : (
                    "A new chapter is ahead"
                  )}
                </p>
                <div className="skill-list">
                  {l.skills.map((s) => (
                    <div className="row spread" key={s.id}>
                      <span>{s.title}</span>
                      <StatusBadge status={student.skills[s.id]} />
                    </div>
                  ))}
                </div>
              </div>
              <span
                className={`journey-state ${earned ? "collected" : unlocked ? "in-progress" : "up-ahead"}`}
              >
                {earned ? (
                  "Collected"
                ) : unlocked ? (
                  "In progress"
                ) : (
                  <>
                    <Lock size={13} /> Ahead
                  </>
                )}
              </span>
            </section>
          );
        })}
      </div>
    </>
  );
}
