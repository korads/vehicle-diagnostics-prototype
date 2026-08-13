"use client";

import {
  getDiagnosticTitle,
  hasKnownLocation,
  severityMeta,
  type DiagnosticItem,
  type DiagnosticSeverity,
} from "@/lib/diagnostics";

const severityOrder: DiagnosticSeverity[] = [
  "replace_now",
  "replace_soon",
  "inspect",
];

interface DiagnosticsPanelProps {
  diagnostics: readonly DiagnosticItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DiagnosticsPanel({
  diagnostics,
  selectedId,
  onSelect,
}: DiagnosticsPanelProps) {
  return (
    <aside className="diagnostics-panel" aria-labelledby="diagnostics-title">
      <header className="panel-header">
        <p className="eyebrow">
          <span className="live-dot" aria-hidden="true" />
          Диагностика завершена
        </p>
        <div className="panel-title-row">
          <h1 className="panel-title" id="diagnostics-title">
            Требует внимания
          </h1>
          <span className="issue-count">
            {String(diagnostics.length).padStart(2, "0")} узла
          </span>
        </div>
      </header>

      <div className="legend" aria-label="Статусы диагностики">
        {severityOrder.map((severity) => {
          const meta = severityMeta[severity];
          return (
            <span className="legend-item" key={severity}>
              <span
                className={`status-symbol ${meta.className}`}
                aria-hidden="true"
              />
              {meta.shortLabel}
            </span>
          );
        })}
      </div>

      {diagnostics.length === 0 ? (
        <div className="empty-state" role="status">
          Активных рекомендаций нет.
          <br />
          Все проверенные узлы в норме.
        </div>
      ) : (
        <ol className="issues-list">
          {diagnostics.map((diagnostic, index) => {
            const meta = severityMeta[diagnostic.severity];
            const isSelected = diagnostic.id === selectedId;
            const isKnown = hasKnownLocation(diagnostic);

            return (
              <li key={diagnostic.id}>
                <button
                  type="button"
                  className={`issue-button${isSelected ? " selected" : ""}`}
                  style={
                    { "--issue-color": meta.color } as React.CSSProperties
                  }
                  onClick={() => onSelect(diagnostic.id)}
                  aria-pressed={isSelected}
                >
                  <span className="issue-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="issue-title">
                      {getDiagnosticTitle(diagnostic)}
                    </span>
                    <span className="issue-status">
                      <span
                        className={`status-symbol ${meta.className}`}
                        aria-hidden="true"
                      />
                      {meta.label}
                    </span>
                    {!isKnown ? (
                      <span className="issue-note unknown-location">
                        Положение на модели не настроено
                      </span>
                    ) : diagnostic.note ? (
                      <span className="issue-note">{diagnostic.note}</span>
                    ) : null}
                  </span>
                  <span className="issue-chevron" aria-hidden="true">
                    {isSelected ? "—" : "↗"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <footer className="panel-footer">
        <span>SEDAN / 2026</span>
        <span>Схема 01—A</span>
      </footer>
    </aside>
  );
}
