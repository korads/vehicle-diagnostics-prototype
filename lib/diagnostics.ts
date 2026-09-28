export type DiagnosticSeverity = "replace_now" | "replace_soon" | "inspect";

export interface DiagnosticItem {
  id: string;
  partCode: string;
  severity: DiagnosticSeverity;
  title?: string;
  note?: string;
}

export type PartGlyph = "brake-pad" | "battery" | "oil";

export interface PartAnchor {
  id: string;
  position: readonly [number, number, number];
}

export interface PartDefinition {
  label: string;
  glyph: PartGlyph;
  anchors: readonly PartAnchor[];
}

export interface DiagnosticMarker extends PartAnchor {
  diagnosticId: string;
  partCode: string;
  label: string;
  glyph: PartGlyph;
  severity: DiagnosticSeverity;
}

export const severityMeta: Record<
  DiagnosticSeverity,
  { label: string; shortLabel: string; color: string; className: string }
> = {
  replace_now: {
    label: "Требуется замена",
    shortLabel: "Заменить",
    color: "#ff4d5f",
    className: "replace-now",
  },
  replace_soon: {
    label: "Скоро потребуется замена",
    shortLabel: "Скоро",
    color: "#ffc247",
    className: "replace-soon",
  },
  inspect: {
    label: "Требуется проверка",
    shortLabel: "Проверить",
    color: "#4da8ff",
    className: "inspect",
  },
};

export const partCatalog: Record<string, PartDefinition> = {
  brake_pads: {
    label: "Тормозные колодки",
    glyph: "brake-pad",
    anchors: [
      { id: "front-left", position: [0.7, 0.34, 0.66] },
      { id: "front-right", position: [-0.7, 0.34, 0.66] },
      { id: "rear-left", position: [0.7, 0.34, -0.66] },
      { id: "rear-right", position: [-0.7, 0.34, -0.66] },
    ],
  },
  battery: {
    label: "Аккумулятор",
    glyph: "battery",
    anchors: [{ id: "engine-bay-left", position: [0.28, 0.83, 0.88] }],
  },
  engine_oil: {
    label: "Моторное масло",
    glyph: "oil",
    anchors: [{ id: "engine-center", position: [-0.2, 0.92, 0.78] }],
  },
};

export function resolveDiagnosticMarkers(
  diagnostics: readonly DiagnosticItem[],
): DiagnosticMarker[] {
  return diagnostics.flatMap((diagnostic) => {
    const part = partCatalog[diagnostic.partCode];

    if (!part) {
      return [];
    }

    return part.anchors.map((anchor) => ({
      ...anchor,
      diagnosticId: diagnostic.id,
      partCode: diagnostic.partCode,
      label: diagnostic.title ?? part.label,
      glyph: part.glyph,
      severity: diagnostic.severity,
    }));
  });
}

export function getDiagnosticTitle(diagnostic: DiagnosticItem): string {
  return (
    diagnostic.title ??
    partCatalog[diagnostic.partCode]?.label ??
    diagnostic.partCode
  );
}

export function hasKnownLocation(diagnostic: DiagnosticItem): boolean {
  return Boolean(partCatalog[diagnostic.partCode]);
}
