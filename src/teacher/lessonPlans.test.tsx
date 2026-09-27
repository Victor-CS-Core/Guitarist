import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { levels } from "../curriculum/foundations";
import { getLessonPlan, lessonPlans, validateLessonPlans } from "./lessonPlans";
import { LessonPlansPage } from "./LessonPlansPage";
import { LessonPlanDetail } from "./LessonPlanDetail";

function renderDetail(levelId: string) {
  return render(
    <MemoryRouter initialEntries={[`/teacher/lesson-plans/${levelId}`]}>
      <Routes>
        <Route path="/teacher/lesson-plans/:levelId" element={<LessonPlanDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("lesson plan data", () => {
  it("has one valid plan per curriculum chapter", () => {
    expect(validateLessonPlans()).toEqual([]);
    expect(lessonPlans).toHaveLength(levels.length);
    expect(levels.length).toBe(8);
  });

  it("orders plans by chapter and matches level titles", () => {
    lessonPlans.forEach((plan, i) => {
      expect(plan.chapter).toBe(i + 1);
      expect(plan.levelId).toBe(levels[i].id);
      expect(plan.title).toBe(levels[i].title);
    });
  });

  it("getLessonPlan finds plans and misses unknown ids", () => {
    expect(getLessonPlan("level-1")?.title).toBe("Guitar Explorer");
    expect(getLessonPlan("level-8")?.title).toBe("Independent Musician");
    expect(getLessonPlan("level-99")).toBeUndefined();
  });

  it("keeps every lesson within a realistic class length", () => {
    for (const plan of lessonPlans) {
      const sectionTotal = plan.sections.reduce((n, s) => n + s.minutes, 0);
      expect(sectionTotal).toBeGreaterThanOrEqual(40);
      expect(sectionTotal).toBeLessThanOrEqual(plan.durationMinutes);
    }
  });
});

describe("LessonPlansPage", () => {
  it("lists all eight chapters with links to their plans", () => {
    const { container } = render(
      <MemoryRouter>
        <LessonPlansPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Lesson plans" })).toBeInTheDocument();
    for (const plan of lessonPlans) {
      const link = container.querySelector(`a[href="/teacher/lesson-plans/${plan.levelId}"]`);
      expect(link).not.toBeNull();
      expect(link?.textContent).toContain(plan.title);
    }
  });
});

describe("LessonPlanDetail", () => {
  it("renders the full chapter 3 plan with flow, mistakes and assessment", () => {
    const { container } = renderDetail("level-3");
    expect(screen.getByRole("heading", { name: "First Chords" })).toBeInTheDocument();
    expect(screen.getByText(/builds Em and Am from memory/i)).toBeInTheDocument();
    // Lesson flow sections.
    expect(screen.getByRole("heading", { name: /2\. E minor/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /3\. A minor/ })).toBeInTheDocument();
    // Materials, mistakes, assessment.
    expect(screen.getByText(/common mistakes/i)).toBeInTheDocument();
    expect(screen.getByText(/strumming all six strings on Am/i)).toBeInTheDocument();
    expect(screen.getByText(/ready to move on when/i)).toBeInTheDocument();
    // App activities link to the teacher preview pages.
    const preview = container.querySelector('a[href="/teacher/preview/activity/em-shape"]');
    expect(preview).not.toBeNull();
    expect(preview?.textContent).toMatch(/preview/i);
  });

  it("shows an empty state for an unknown chapter", () => {
    renderDetail("level-99");
    expect(screen.getByText(/no lesson plan found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to lesson plans/i })).toBeInTheDocument();
  });
});
