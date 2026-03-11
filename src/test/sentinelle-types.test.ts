import { describe, it, expect } from "vitest";
import type { RunStatus, StepStatus, RunStep } from "@/lib/sentinelle-types";

describe("sentinelle-types", () => {
  it("RunStatus accepts all expected values including error", () => {
    const statuses: RunStatus[] = ["queued", "running", "passed", "failed", "error"];
    expect(statuses).toHaveLength(5);
  });

  it("StepStatus accepts both runner (passed/failed) and legacy (pass/fail) formats", () => {
    const statuses: StepStatus[] = ["passed", "failed", "pass", "fail", "skipped", "running"];
    expect(statuses).toHaveLength(6);
  });

  it("RunStep includes label and detail fields", () => {
    const step: RunStep = {
      name: "click_button",
      action: "click",
      label: "Click the login button",
      status: "passed",
      detail: "Element found and clicked",
      durationMs: 120,
    };
    expect(step.label).toBe("Click the login button");
    expect(step.detail).toBe("Element found and clicked");
  });

  it("RunStep works without optional fields", () => {
    const step: RunStep = {
      name: "navigate",
      action: "goto",
      label: "Go to homepage",
      status: "pass",
    };
    expect(step.detail).toBeUndefined();
    expect(step.durationMs).toBeUndefined();
  });
});
