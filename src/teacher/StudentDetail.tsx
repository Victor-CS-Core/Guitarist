import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useStudio } from "../app/StoreProvider";
import { levels } from "../curriculum/foundations";
import { AssessmentForm } from "./AssessmentForm";
import { StudentRoutines } from "./StudentRoutines";
import { StudentOverviewTab } from "./StudentOverviewTab";
import { StudentAssignmentsTab } from "./StudentAssignmentsTab";
import { StudentNotesTab } from "./StudentNotesTab";
import { StudentActivityTab } from "./StudentActivityTab";
import { StudentAccountTab } from "./StudentAccountTab";
import { EmptyState } from "../components/EmptyState";

const studentTabs = [
  "Overview",
  "Assess",
  "Assignments",
  "Routines",
  "Notes",
  "Activity",
  "Account",
];

/**
 * The teacher's student workspace: header, tab bar, and one tab panel at a
 * time. Each panel lives in its own file (Student*Tab) so this shell stays
 * focused on navigation and guards.
 */
export function StudentDetail() {
  const { studentId } = useParams(),
    { state } = useStudio(),
    student = state.students.find((s) => s.id === studentId);
  const [searchParams] = useSearchParams(),
    requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState(
    studentTabs.includes(requestedTab ?? "") ? requestedTab! : "Overview",
  );

  if (!student)
    return (
      <EmptyState title="Student not found">
        <Link className="button secondary" to="/teacher">
          Back to studio
        </Link>
      </EmptyState>
    );
  const level = levels.find((l) => l.id === student.currentLevelId);
  if (!level)
    return (
      <EmptyState
        title="This student’s chapter is missing"
        message={`${student.name} is linked to a chapter that no longer exists. Ask your administrator to check their record.`}
      >
        <Link className="button secondary" to="/teacher">
          Back to studio
        </Link>
      </EmptyState>
    );
  const next = levels[level.order];

  return (
    <>
      <Link className="text-link" to="/teacher">
        <ArrowLeft size={16} /> Your students
      </Link>
      <div className="page-heading row">
        <span className="avatar large">{student.name[0]}</span>
        <div>
          <div className="eyebrow green">STUDENT WORKSPACE</div>
          <h1>{student.name}</h1>
          <p>
            Level {level.order} · {level.title}
            {student.appUnlocked === true && " · App unlocked 🎓"}
          </p>
        </div>
      </div>
      <div className="tab-row" role="tablist" aria-label="Student detail">
        {studentTabs.map((t) => (
          <button
            key={t}
            id={`tab-${t}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls="student-panel"
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="student-panel" aria-labelledby={`tab-${tab}`}>
        {tab === "Overview" && (
          <StudentOverviewTab
            student={student}
            next={next}
            onBeginAssessment={() => setTab("Assess")}
          />
        )}
        {tab === "Assess" && (
          <AssessmentForm key={student.id} studentId={student.id} />
        )}
        {tab === "Assignments" && (
          <StudentAssignmentsTab studentId={student.id} />
        )}
        {tab === "Routines" && (
          <StudentRoutines key={student.id} studentId={student.id} />
        )}
        {tab === "Notes" && <StudentNotesTab studentId={student.id} />}
        {tab === "Activity" && <StudentActivityTab studentId={student.id} />}
        {tab === "Account" && <StudentAccountTab student={student} />}
      </div>
    </>
  );
}
