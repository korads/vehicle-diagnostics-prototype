import { fireEvent, render, screen } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  SceneErrorBoundary,
  VehicleDiagnostics,
} from "@/components/VehicleDiagnostics";
import type { DiagnosticItem } from "@/lib/diagnostics";

const diagnostics: DiagnosticItem[] = [
  { id: "brakes", partCode: "brake_pads", severity: "replace_now" },
  { id: "battery", partCode: "battery", severity: "inspect" },
];

describe("VehicleDiagnostics", () => {
  it("synchronizes scene marker selection with the diagnostics list", () => {
    render(
      <VehicleDiagnostics
        diagnostics={diagnostics}
        renderScene={({ onSelect }) => (
          <button type="button" onClick={() => onSelect("battery")}>
            Select battery marker
          </button>
        )}
      />,
    );

    const brakeButton = screen.getByRole("button", {
      name: /Тормозные колодки/i,
    });
    const batteryButton = screen.getByRole("button", { name: /Аккумулятор/i });

    expect(brakeButton).toHaveAttribute("aria-pressed", "true");
    expect(batteryButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "Select battery marker" }));

    expect(brakeButton).toHaveAttribute("aria-pressed", "false");
    expect(batteryButton).toHaveAttribute("aria-pressed", "true");
  });

  it("renders empty and unknown-location states", () => {
    const { rerender } = render(
      <VehicleDiagnostics diagnostics={[]} renderScene={() => null} />,
    );

    expect(screen.getByText(/Активных рекомендаций нет/i)).toBeInTheDocument();

    rerender(
      <VehicleDiagnostics
        diagnostics={[
          { id: "unknown", partCode: "future_part", severity: "inspect" },
        ]}
        renderScene={() => null}
      />,
    );

    expect(
      screen.getByText("Положение на модели не настроено"),
    ).toBeInTheDocument();
  });

  it("selects the first available item when the diagnostic input changes", () => {
    const { rerender } = render(
      <VehicleDiagnostics diagnostics={[]} renderScene={() => null} />,
    );

    rerender(
      <VehicleDiagnostics diagnostics={diagnostics} renderScene={() => null} />,
    );

    expect(
      screen.getByRole("button", { name: /Тормозные колодки/i }),
    ).toHaveAttribute("aria-pressed", "true");

    rerender(
      <VehicleDiagnostics
        diagnostics={[diagnostics[1]]}
        renderScene={() => null}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Аккумулятор/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("increments the reset signal without changing the selection", () => {
    const signals: number[] = [];
    render(
      <VehicleDiagnostics
        diagnostics={diagnostics}
        renderScene={({ resetSignal }) => {
          signals.push(resetSignal);
          return <span data-testid="reset-signal">{resetSignal}</span>;
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Вернуть исходный ракурс" }),
    );

    expect(screen.getByTestId("reset-signal")).toHaveTextContent("1");
    expect(
      screen.getByRole("button", { name: /Тормозные колодки/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(signals).toContain(0);
    expect(signals).toContain(1);
  });
});

class ThrowingScene extends Component<
  { shouldThrow: boolean; children: ReactNode },
  Record<string, never>
> {
  render() {
    if (this.props.shouldThrow) {
      throw new Error("Model load failed");
    }
    return this.props.children;
  }
}

describe("SceneErrorBoundary", () => {
  it("runs cache recovery before retrying the scene", () => {
    const onRetry = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { rerender } = render(
      <SceneErrorBoundary onRetry={onRetry}>
        <ThrowingScene shouldThrow>Scene ready</ThrowingScene>
      </SceneErrorBoundary>,
    );

    expect(
      screen.getByRole("heading", { name: "Схема автомобиля не загрузилась" }),
    ).toBeInTheDocument();

    rerender(
      <SceneErrorBoundary onRetry={onRetry}>
        <ThrowingScene shouldThrow={false}>Scene ready</ThrowingScene>
      </SceneErrorBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByText("Scene ready")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
