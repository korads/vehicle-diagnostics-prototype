import { describe, expect, it } from "vitest";
import {
  executiveSedanProportions,
  transformVehiclePosition,
} from "@/lib/vehicle-profile";

describe("executive sedan profile", () => {
  it("applies the same proportions to diagnostic anchor positions", () => {
    expect(transformVehiclePosition([0.7, 0.34, 0.66])).toEqual([
      0.7 * executiveSedanProportions.width,
      0.34 * executiveSedanProportions.height,
      0.66 * executiveSedanProportions.length,
    ]);
  });

  it("elongates the vehicle more than it widens it", () => {
    expect(executiveSedanProportions.length).toBeGreaterThan(
      executiveSedanProportions.width,
    );
    expect(executiveSedanProportions.height).toBeLessThan(1);
  });
});
