export const executiveSedanProfile = {
  modelScale: [0.6, 0.8, 0.6] as const,
  modelRotationY: -Math.PI / 2,
  anchorScale: [0.67, 0.8, 1.29] as const,
  anchorOffset: [0, 0, 0.09] as const,
} as const;

export type VehiclePosition = readonly [number, number, number];

export function getCameraFramingScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) {
    return 1;
  }

  const aspect = width / height;
  return aspect < 0.9 ? 1 + (0.9 - aspect) * 1.2 : 1;
}

export function transformVehiclePosition(
  position: VehiclePosition,
): [number, number, number] {
  return [
    position[0] * executiveSedanProfile.anchorScale[0] +
      executiveSedanProfile.anchorOffset[0],
    position[1] * executiveSedanProfile.anchorScale[1] +
      executiveSedanProfile.anchorOffset[1],
    position[2] * executiveSedanProfile.anchorScale[2] +
      executiveSedanProfile.anchorOffset[2],
  ];
}
