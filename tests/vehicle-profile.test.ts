import { describe, expect, it } from "vitest";
import {
  executiveSedanProfile,
  getCameraFramingScale,
  transformVehiclePosition,
} from "@/lib/vehicle-profile";

describe("executive sedan profile", () => {
  it("maps normalized diagnostic anchors onto the replacement model", () => {
    expect(transformVehiclePosition([0.7, 0.34, 0.66])).toEqual([
      0.7 * executiveSedanProfile.anchorScale[0],
      0.34 * executiveSedanProfile.anchorScale[1],
      0.66 * executiveSedanProfile.anchorScale[2] +
        executiveSedanProfile.anchorOffset[2],
    ]);
  });

  it("keeps the front and rear brake anchors aligned with the wheelbase", () => {
    const front = transformVehiclePosition([0.7, 0.34, 0.66]);
    const rear = transformVehiclePosition([-0.7, 0.34, -0.66]);

    expect(front[0]).toBeCloseTo(0.469);
    expect(front[1]).toBeCloseTo(0.272);
    expect(front[2]).toBeCloseTo(0.9414);
    expect(rear[0]).toBeCloseTo(-0.469);
    expect(rear[1]).toBeCloseTo(0.272);
    expect(rear[2]).toBeCloseTo(-0.7614);
  });

  it("backs the camera away on narrow mobile scenes", () => {
    expect(getCameraFramingScale(320, 430)).toBeGreaterThan(1.18);
    expect(getCameraFramingScale(360, 430)).toBeGreaterThan(1.07);
    expect(getCameraFramingScale(390, 430)).toBe(1);
    expect(getCameraFramingScale(1280, 720)).toBe(1);
  });
});
