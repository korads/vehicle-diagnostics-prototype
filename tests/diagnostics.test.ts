import { describe, expect, it } from "vitest";
import {
  resolveDiagnosticMarkers,
  severityMeta,
  type DiagnosticItem,
} from "@/lib/diagnostics";

describe("resolveDiagnosticMarkers", () => {
  it("expands brake pads into four wheel markers", () => {
    const diagnostics: DiagnosticItem[] = [
      { id: "brakes", partCode: "brake_pads", severity: "replace_now" },
    ];

    const markers = resolveDiagnosticMarkers(diagnostics);

    expect(markers).toHaveLength(4);
    expect(markers.map((marker) => marker.id).sort()).toEqual([
      "front-left",
      "front-right",
      "rear-left",
      "rear-right",
    ]);
    expect(markers.every((marker) => marker.diagnosticId === "brakes")).toBe(
      true,
    );
  });

  it("ignores unknown part codes without throwing", () => {
    const markers = resolveDiagnosticMarkers([
      { id: "unknown", partCode: "future_part", severity: "inspect" },
    ]);

    expect(markers).toEqual([]);
  });

  it("preserves every supported severity", () => {
    const severities = Object.keys(severityMeta) as DiagnosticItem["severity"][];
    const diagnostics = severities.map((severity, index) => ({
      id: `battery-${index}`,
      partCode: "battery",
      severity,
    }));

    expect(resolveDiagnosticMarkers(diagnostics).map((marker) => marker.severity))
      .toEqual(severities);
  });
});
