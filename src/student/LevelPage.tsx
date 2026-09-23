import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lock, BookOpen } from "lucide-react";
import { levels, activities } from "../curriculum/foundations";
import { useDemo, useStudent } from "../demo/StoreProvider";
import { StatusBadge } from "../components/StatusBadge";
import { Exercises } from "./Exercises";
import { ChapterBadge } from "../components/ChapterBadge";
import { earnedBadgeIds } from "../domain/selectors";
export function LearnPage() {
  const student = useStudent(),
    { actor, state } = useDemo();
  const badges = earnedBadgeIds(state, student.id);
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">ONE CHAPTER AT A TIME</div>
        <h1>Your learning journey</h1>
        <p>Explore what you know. Get curious about what comes next.</p>
      </div>
      <div className="level-grid">
        {levels.map((l) => (
          <Link
            className={`card level-card ${!student.unlockedLevels.includes(l.id) && actor.role !== "teacher" ? "locked" : ""}`}
            to={`${actor.role === "teacher" ? "/teacher/curriculum" : "/student/learn"}/${l.id}`}
            key={l.id}
          >
            <ChapterBadge
              badgeId={l.badgeId}
              title={l.title}
              earned={badges.includes(l.badgeId)}
              compact
            />
            <div>
              <div className="eyebrow">LEVEL {l.order}</div>
              <h2>{l.title}</h2>
              <p>{l.description}</p>
              <span className="text-link">
                {student.unlockedLevels.includes(l.id) ||
                actor.role === "teacher" ? (
                  <>
                    Explore chapter <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    With your teacher <Lock size={14} />
                  </>
                )}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
export function LevelPage() {
  const { levelId } = useParams(),
    student = useStudent(),
    { actor } = useDemo();
  const [active, setActive] = useState<string | null>(null);
  const level = levels.find((l) => l.id === levelId);
  if (!level)
    return (
      <div className="card">
        <h1>That chapter isn’t here.</h1>
        <Link className="text-link" to="/student/learn">
          Back to Learn
        </Link>
      </div>
    );
  if (actor.role !== "teacher" && !student.unlockedLevels.includes(level.id))
    return (
      <div className="card empty">
        <Lock size={35} />
        <h1>A new chapter is ahead.</h1>
        <p>Your teacher will unlock this level when you’re ready.</p>
        <Link className="button" to="/student/learn">
          Back to your journey
        </Link>
      </div>
    );
  const available = activities.filter((a) =>
      level.skills.some((s) => s.id === a.skillId),
    ),
    activity = available.find((a) => a.id === active);
  return (
    <>
      <Link
        className="text-link"
        to={actor.role === "teacher" ? "/teacher/curriculum" : "/student/learn"}
      >
        <ArrowLeft size={16} /> All chapters
      </Link>
      <div className="page-heading">
        <div className="eyebrow green">
          LEVEL {level.order} ·{" "}
          {level.order > 1 && level.order !== 3
            ? "CURRICULUM PREVIEW"
            : "LET’S EXPLORE"}
        </div>
        <h1>{level.title}</h1>
        <p>{level.goal}</p>
      </div>
      <div className="learning-layout">
        <div className="stack">
          {level.skills.map((skill) => (
            <section className="card" key={skill.id}>
              <div className="row spread">
                <h3>{skill.title}</h3>
                <StatusBadge status={student.skills[skill.id]} />
              </div>
              <p className="spaced">{skill.description}</p>
              {available
                .filter((a) => a.skillId === skill.id)
                .map((a) => (
                  <button
                    key={a.id}
                    className="activity-link"
                    onClick={() => setActive(a.id)}
                  >
                    <BookOpen size={17} />
                    <span>{a.title}</span>
                    <ArrowRight size={16} />
                  </button>
                ))}
            </section>
          ))}
        </div>
        <aside className="card learning-panel">
          {activity ? (
            <>
              <h2>{activity.title}</h2>
              <ol className="instructions">
                {activity.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Exercises key={activity.id} activity={activity} />
            </>
          ) : (
            <>
              <BookOpen size={33} />
              <h2>Make yourself at home.</h2>
              <p>
                Choose an activity to explore it here. Try each idea on your
                guitar as you go.
              </p>
              <div className="teacher-tip">
                <strong>Your teacher’s listening for…</strong>
                <p>{level.goal}</p>
              </div>
              {!available.length && (
                <p className="small">
                  This chapter’s full activities are part of the next milestone.
                  Your teacher can already review its goals.
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  );
}
