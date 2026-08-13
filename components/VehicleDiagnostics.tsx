"use client";

import { Component, useMemo, useState, type ReactNode } from "react";
import demoDiagnosticsJson from "@/data/diagnostics.json";
import {
  resolveDiagnosticMarkers,
  type DiagnosticItem,
} from "@/lib/diagnostics";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import {
  clearVehicleModelCache,
  VehicleScene,
  type VehicleSceneProps,
} from "./VehicleScene";

const demoDiagnostics = demoDiagnosticsJson as DiagnosticItem[];

interface SceneBoundaryProps {
  children: ReactNode;
  onRetry: () => void;
}

interface SceneBoundaryState {
  failed: boolean;
}

export class SceneErrorBoundary extends Component<
  SceneBoundaryProps,
  SceneBoundaryState
> {
  state: SceneBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="scene-error" role="alert">
          <div className="scene-error-card">
            <h2>Схема автомобиля не загрузилась</h2>
            <p>
              Проверьте соединение и повторите загрузку. Диагностический список
              остаётся доступным.
            </p>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                this.props.onRetry();
                this.setState({ failed: false });
              }}
            >
              Повторить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface VehicleDiagnosticsProps {
  diagnostics?: readonly DiagnosticItem[];
  renderScene?: (props: VehicleSceneProps) => ReactNode;
}

export function VehicleDiagnostics({
  diagnostics = demoDiagnostics,
  renderScene,
}: VehicleDiagnosticsProps) {
  const initialSelectedId = diagnostics[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [previousDiagnostics, setPreviousDiagnostics] =
    useState(diagnostics);
  const [resetSignal, setResetSignal] = useState(0);
  const markers = useMemo(
    () => resolveDiagnosticMarkers(diagnostics),
    [diagnostics],
  );

  if (previousDiagnostics !== diagnostics) {
    setPreviousDiagnostics(diagnostics);
    setSelectedId((currentId) => {
      if (
        currentId !== null &&
        diagnostics.some((diagnostic) => diagnostic.id === currentId)
      ) {
        return currentId;
      }

      return diagnostics[0]?.id ?? null;
    });
  }
  const sceneProps: VehicleSceneProps = {
    markers,
    selectedId,
    onSelect: setSelectedId,
    resetSignal,
  };

  return (
    <main className="diagnostics-app">
      <section className="scene-shell" aria-label="Интерактивная схема автомобиля">
        <div className="brand" aria-label="Контур">
          <span className="brand-mark" aria-hidden="true">
            КТ
          </span>
          <div>
            <p className="brand-name">Контур</p>
            <p className="brand-subtitle">Система визуальной диагностики</p>
          </div>
        </div>

        <div className="scene-toolbar">
          <button
            type="button"
            className="icon-button"
            onClick={() => setResetSignal((signal) => signal + 1)}
            aria-label="Вернуть исходный ракурс"
          >
            <span className="reset-glyph" aria-hidden="true">
              ↺
            </span>
            <span className="button-label">Сбросить ракурс</span>
          </button>
        </div>

        <SceneErrorBoundary onRetry={clearVehicleModelCache}>
          {renderScene ? renderScene(sceneProps) : <VehicleScene {...sceneProps} />}
        </SceneErrorBoundary>

        <div className="scene-caption" aria-hidden="true">
          <span className="drag-symbol" />
          <span>Перетаскивайте, чтобы осмотреть</span>
        </div>
      </section>

      <DiagnosticsPanel
        diagnostics={diagnostics}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </main>
  );
}
