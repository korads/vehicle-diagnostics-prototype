export const executiveSedanProportions = {
  width: 1.08,
  height: 0.96,
  length: 1.19,
} as const;

export type VehiclePosition = readonly [number, number, number];

export function transformVehiclePosition(
  position: VehiclePosition,
): [number, number, number] {
  return [
    position[0] * executiveSedanProportions.width,
    position[1] * executiveSedanProportions.height,
    position[2] * executiveSedanProportions.length,
  ];
}
