import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  CheckCircle2,
  ClipboardList,
  Clock,
  Lightbulb,
  ListOrdered,
  TriangleAlert,
} from "lucide-react";
import { activityById } from "../curriculum/foundations";
import { getLessonPlan } from "./lessonPlans";
import { EmptyState } from "../components/EmptyState";

export function LessonPlanDetail() {
  const { levelId } = useParams();
  const plan = levelId ? getLessonPlan(levelId) : undefined;
  if (!plan) {
    return (
      <EmptyState
        title="No lesson plan found"
        message="This chapter does not have a lesson plan yet."
      >
        <Link className="button secondary" to="/teacher/lesson-plans">
          Back to lesson plans
        </Link>
      </EmptyState>
    );
  }
  return (
    <>
      <Link className="text-link" to="/teacher/lesson-plans">
        <ArrowLeft size={16} /> Lesson plans
      </Link>
      <div className="page-heading">
        <div className="eyebrow green">CHAPTER {plan.chapter}</div>
        <h1>{plan.title}</h1>
        <p>{plan.tagline}</p>
        <p className="small">
          <Clock size={14} aria-hidden /> About {plan.durationMinutes} minutes
        </p>
      </div>

      <section className="card spaced">
        <h2 className="section-heading mt-0">
          Lesson goal
        </h2>
        <p>{plan.goal}</p>
      </section>

      <section className="card spaced">
        <h2 className="section-heading mt-0">
          <Backpack size={18} aria-hidden /> Materials
        </h2>
        <ul>
          {plan.materials.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <div className="section-heading">
        <h2>
          <ListOrdered size={18} aria-hidden /> Lesson flow
        </h2>
        <span className="small">Follow top to bottom in the lesson</span>
      </div>
      {plan.sections.map((section, i) => (
        <section className="card spaced" key={section.title}>
          <div className="row spread">
            <h3 className="m-0">
              {i + 1}. {section.title}
            </h3>
            <span className="small">
              <Clock size={14} aria-hidden /> {section.minutes} min
            </span>
          </div>
          <ol>
            {section.script.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {section.teacherTips?.map((tip) => (
            <div className="teacher-tip" key={tip}>
              <span className="eyebrow">
                <Lightbulb size={14} aria-hidden /> TEACHER TIP
              </span>
              <p>{tip}</p>
            </div>
          ))}
        </section>
      ))}

      <section className="card spaced">
        <h2 className="section-heading mt-0">
          <TriangleAlert size={18} aria-hidden /> Common mistakes
        </h2>
        {plan.commonMistakes.map(({ mistake, fix }) => (
          <div key={mistake} className="mb-12">
            <p className="mb-4">
              <strong>Watch for:</strong> {mistake}
            </p>
            <p className="small mt-0">
              <strong>Fix:</strong> {fix}
            </p>
          </div>
        ))}
      </section>

      {plan.activityIds.length > 0 && (
        <section className="card spaced">
          <h2 className="section-heading mt-0">
            <ClipboardList size={18} aria-hidden /> Assign for the week
          </h2>
          <p className="small">
            These app activities match the chapter. Preview one, then assign it
            from a student's page.
          </p>
          <div className="skill-list">
            {plan.activityIds.map((id) => {
              const activity = activityById(id);
              if (!activity) return null;
              return (
                <div className="row spread" key={id}>
                  <span>
                    {activity.title}
                    <span className="small"> · {activity.minutes} min</span>
                  </span>
                  <Link
                    className="text-link"
                    to={`/teacher/preview/activity/${id}`}
                  >
                    Preview <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card spaced">
        <h2 className="section-heading mt-0">
          <CheckCircle2 size={18} aria-hidden /> Ready to move on when…
        </h2>
        <ul>
          {plan.assessment.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
