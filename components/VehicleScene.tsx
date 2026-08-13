"use client";

import { Html, OrbitControls, useGLTF } from "@react-three/drei";
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
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: "#788493",
      metalness: 0.9,
      roughness: 0.26,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: "#c6d3e1",
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    });

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      child.material = bodyMaterial;
      const edges = new THREE.EdgesGeometry(child.geometry, 32);
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
      <mesh renderOrder={4} scale={2.25}>
        <sphereGeometry args={[0.075, 14, 14]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.16 : 0.09}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {selected ? (
        <Html center position={[0, 0.32, 0]} distanceFactor={7.5} zIndexRange={[20, 0]}>
          <div
            className="part-callout"
            style={{ "--marker-color": color } as React.CSSProperties}
            aria-hidden="true"
          >
            <span className={`part-glyph ${marker.glyph}`} />
            <span className="part-callout-label">{marker.label}</span>
          </div>
        </Html>
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
