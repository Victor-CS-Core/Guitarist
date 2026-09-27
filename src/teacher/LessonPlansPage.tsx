import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { lessonPlans } from "./lessonPlans";

export function LessonPlansPage() {
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">YOUR TEACHING STUDIO</div>
        <h1>Lesson plans</h1>
        <p>
          A teach-by guide for every chapter — what to cover, what to say, what
          to watch for, and what to assign. Open a chapter to walk through it
          before the lesson.
        </p>
      </div>
      <div className="teacher-students">
        {lessonPlans.map((plan) => (
          <Link
            className="card student-card"
            key={plan.levelId}
            to={`/teacher/lesson-plans/${plan.levelId}`}
          >
            <div className="row spread">
              <div>
                <span className="eyebrow">CHAPTER {plan.chapter}</span>
                <h2>{plan.title}</h2>
                <p className="small">{plan.tagline}</p>
              </div>
              <ArrowRight size={20} />
            </div>
            <p className="small">
              <Clock size={14} aria-hidden /> About {plan.durationMinutes} minutes
              {" · "}
              {plan.sections.length} sections
            </p>
            <div className="teacher-tip">
              <span className="eyebrow">LESSON GOAL</span>
              <p>{plan.goal}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
