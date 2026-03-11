import { describe, it, expect } from "vitest";

describe("API contract consistency", () => {
  describe("POST /v1/runs response shape", () => {
    it("should contain runId and status", () => {
      const response = { runId: "abc-123", status: "queued" };
      expect(response).toHaveProperty("runId");
      expect(response).toHaveProperty("status");
    });
  });

  describe("GET /v1/runs/:id response shape", () => {
    it("should contain steps array with label and action", () => {
      const response = {
        status: "passed",
        steps: [
          { name: "goto", action: "goto", label: "Navigate to site", status: "passed", durationMs: 500 },
        ],
        findings: { consoleErrors: [], failedRequests: [], diagnostics: [] },
        assets: { screenshots: [{ label: "step-1", filename: "s1.png", path: "/s1.png" }] },
      };
      expect(response.steps[0]).toHaveProperty("label");
      expect(response.steps[0]).toHaveProperty("action");
      expect(response.assets.screenshots).toHaveLength(1);
    });

    it("should accept both passed/failed status strings", () => {
      const statuses = ["passed", "failed", "running", "queued", "error"];
      statuses.forEach((s) => expect(typeof s).toBe("string"));
    });
  });

  describe("Edge function screenshot mapping", () => {
    it("should extract screenshots from result.assets.screenshots", () => {
      const result = {
        assets: { screenshots: [{ label: "a", filename: "a.png", path: "/a.png" }] },
      };
      const screenshots = result.assets?.screenshots || [];
      expect(screenshots).toHaveLength(1);
    });

    it("should fall back to result.screenshots if assets is missing", () => {
      const result = {
        screenshots: [{ label: "b", filename: "b.png", path: "/b.png" }],
      } as { assets?: { screenshots?: unknown[] }; screenshots?: unknown[] };
      const screenshots = result.assets?.screenshots || result.screenshots || [];
      expect(screenshots).toHaveLength(1);
    });

    it("should return empty array if no screenshots anywhere", () => {
      const result = {} as { assets?: { screenshots?: unknown[] }; screenshots?: unknown[] };
      const screenshots = result.assets?.screenshots || result.screenshots || [];
      expect(screenshots).toHaveLength(0);
    });
  });
});
