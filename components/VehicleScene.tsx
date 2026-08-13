"use client";

import { Billboard, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import sedanModelUrl from "@/assets/sedan.glb?url";
import {
  severityMeta,
  type DiagnosticMarker,
  type DiagnosticSeverity,
} from "@/lib/diagnostics";

export interface VehicleSceneProps {
  markers: readonly DiagnosticMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  resetSignal: number;
}

const projectedLabelPosition = new THREE.Vector3();

function calculateClampedLabelPosition(
  object: THREE.Object3D,
  camera: THREE.Camera,
  size: { width: number; height: number },
) {
  projectedLabelPosition.setFromMatrixPosition(object.matrixWorld).project(camera);
  const x = projectedLabelPosition.x * (size.width / 2) + size.width / 2;
  const y = -(projectedLabelPosition.y * (size.height / 2)) + size.height / 2;
  const horizontalMargin = Math.min(44, size.width / 2);

  return [
    THREE.MathUtils.clamp(x, horizontalMargin, size.width - horizontalMargin),
    THREE.MathUtils.clamp(y, 14, size.height - 14),
  ];
}

function useReducedMotion() {
  const reducedMotion = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotion.current = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function SedanModel() {
  const { scene } = useGLTF(sedanModelUrl);

  const blueprintModel = useMemo(() => {
    const clone = scene.clone(true);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: "#69788a",
      metalness: 0.94,
      roughness: 0.2,
      clearcoat: 0.72,
      clearcoatRoughness: 0.24,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: "#b9c9dc",
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      child.material = bodyMaterial;
      const edges = new THREE.EdgesGeometry(child.geometry, 40);
      const outline = new THREE.LineSegments(edges, edgeMaterial);
      outline.renderOrder = 2;
      child.add(outline);
    });

    clone.position.y = -0.65;
    return clone;
  }, [scene]);

  useEffect(
    () => () => {
      blueprintModel.traverse((child) => {
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose();
        }
      });
      const firstMesh = blueprintModel.getObjectByProperty("isMesh", true) as
        | THREE.Mesh
        | undefined;
      const firstLine = blueprintModel.getObjectByProperty(
        "isLineSegments",
        true,
      ) as THREE.LineSegments | undefined;
      if (firstMesh) {
        (firstMesh.material as THREE.Material).dispose();
      }
      if (firstLine) {
        (firstLine.material as THREE.Material).dispose();
      }
    },
    [blueprintModel],
  );

  return <primitive object={blueprintModel} />;
}

function MarkerShape({ severity }: { severity: DiagnosticSeverity }) {
  if (severity === "replace_now") {
    return <octahedronGeometry args={[0.085, 0]} />;
  }

  if (severity === "replace_soon") {
    return <torusGeometry args={[0.065, 0.022, 8, 24]} />;
  }

  return <sphereGeometry args={[0.065, 16, 16]} />;
}

function createPartShape(glyph: DiagnosticMarker["glyph"]) {
  const shape = new THREE.Shape();

  if (glyph === "brake-pad") {
    shape.moveTo(-0.13, -0.075);
    shape.lineTo(-0.12, 0.015);
    shape.quadraticCurveTo(-0.1, 0.105, 0, 0.12);
    shape.quadraticCurveTo(0.1, 0.105, 0.12, 0.015);
    shape.lineTo(0.13, -0.075);
    shape.lineTo(0.065, -0.075);
    shape.lineTo(0.055, -0.105);
    shape.lineTo(-0.055, -0.105);
    shape.lineTo(-0.065, -0.075);
    shape.closePath();
    return shape;
  }

  if (glyph === "battery") {
    shape.moveTo(-0.13, -0.09);
    shape.lineTo(0.13, -0.09);
    shape.lineTo(0.13, 0.075);
    shape.lineTo(0.055, 0.075);
    shape.lineTo(0.055, 0.11);
    shape.lineTo(0.015, 0.11);
    shape.lineTo(0.015, 0.075);
    shape.lineTo(-0.055, 0.075);
    shape.lineTo(-0.055, 0.11);
    shape.lineTo(-0.095, 0.11);
    shape.lineTo(-0.095, 0.075);
    shape.lineTo(-0.13, 0.075);
    shape.closePath();
    return shape;
  }

  shape.moveTo(0, 0.14);
  shape.bezierCurveTo(0.04, 0.06, 0.12, -0.015, 0.12, -0.075);
  shape.bezierCurveTo(0.12, -0.145, 0.065, -0.19, 0, -0.19);
  shape.bezierCurveTo(-0.065, -0.19, -0.12, -0.145, -0.12, -0.075);
  shape.bezierCurveTo(-0.12, -0.015, -0.04, 0.06, 0, 0.14);
  shape.closePath();
  return shape;
}

function PartSchematic({
  glyph,
  color,
}: {
  glyph: DiagnosticMarker["glyph"];
  color: string;
}) {
  const { fillGeometry, edgeGeometry } = useMemo(() => {
    const fill = new THREE.ShapeGeometry(createPartShape(glyph), 12);
    return {
      fillGeometry: fill,
      edgeGeometry: new THREE.EdgesGeometry(fill, 1),
    };
  }, [glyph]);

  useEffect(
    () => () => {
      fillGeometry.dispose();
      edgeGeometry.dispose();
    },
    [edgeGeometry, fillGeometry],
  );

  return (
    <Billboard follow position={[0, 0.03, 0]}>
      <mesh geometry={fillGeometry} renderOrder={8}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.16}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <lineSegments geometry={edgeGeometry} renderOrder={9}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={1}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </Billboard>
  );
}

function DiagnosticPoint({
  marker,
  selected,
  onSelect,
}: {
  marker: DiagnosticMarker;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();
  const { invalidate } = useThree();
  const color = severityMeta[marker.severity].color;

  useFrame(({ clock }) => {
    if (!group.current || reducedMotion.current) {
      return;
    }
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.6) * 0.08;
    group.current.scale.setScalar(selected ? pulse * 1.22 : pulse);
    invalidate();
  });

  return (
    <group ref={group} position={[...marker.position]}>
      <mesh
        renderOrder={5}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(marker.diagnosticId);
        }}
        aria-label={`${marker.label}: ${severityMeta[marker.severity].label}`}
      >
        <MarkerShape severity={marker.severity} />
        <meshBasicMaterial color={color} depthTest={false} toneMapped={false} />
      </mesh>
      <mesh renderOrder={4} scale={selected ? 2.65 : 2.35}>
        <sphereGeometry args={[0.075, 14, 14]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.2 : 0.14}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {selected ? (
        <>
          <PartSchematic glyph={marker.glyph} color={color} />
          <Html
            center
            position={[0, 0.24, 0]}
            zIndexRange={[20, 0]}
            calculatePosition={calculateClampedLabelPosition}
          >
            <div
              className="part-callout"
              style={{ "--marker-color": color } as React.CSSProperties}
              aria-hidden="true"
            >
              {marker.label}
            </div>
          </Html>
        </>
      ) : null}
    </group>
  );
}

function CameraControls({ resetSignal }: { resetSignal: number }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, invalidate } = useThree();

  useEffect(() => {
    camera.position.set(3.4, 2.25, 4.15);
    camera.lookAt(0, 0, 0);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [camera, invalidate, resetSignal]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      enableZoom={false}
      enablePan={false}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI - 0.08}
      rotateSpeed={0.62}
    />
  );
}

function LoadingState() {
  return (
    <Html center>
      <div className="scene-state" role="status">
        Загружаем схему автомобиля
      </div>
    </Html>
  );
}

export function VehicleScene({
  markers,
  selectedId,
  onSelect,
  resetSignal,
}: VehicleSceneProps) {
  return (
    <Canvas
      className="scene-canvas"
      camera={{ position: [3.4, 2.25, 4.15], fov: 34, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => undefined}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 6, 3]} intensity={2.2} color="#dbe8f7" />
      <directionalLight position={[-3, 2, -4]} intensity={1.1} color="#5d7d9d" />
      <Suspense fallback={<LoadingState />}>
        <group rotation={[0, -0.34, 0]}>
          <SedanModel />
          <group position={[0, -0.65, 0]}>
            {markers.map((marker) => (
              <DiagnosticPoint
                key={`${marker.diagnosticId}-${marker.id}`}
                marker={marker}
                selected={marker.diagnosticId === selectedId}
                onSelect={onSelect}
              />
            ))}
          </group>
        </group>
      </Suspense>
      <CameraControls resetSignal={resetSignal} />
    </Canvas>
  );
}

export function clearVehicleModelCache() {
  useGLTF.clear(sedanModelUrl);
}

useGLTF.preload(sedanModelUrl);
