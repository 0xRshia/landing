"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, PerformanceMonitor, Preload, useGLTF } from "@react-three/drei";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Points,
  SRGBColorSpace,
  SpotLight,
} from "three";

export type SceneTarget = {
  x: number;
  y: number;
  scale: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  cameraZ: number;
  rim: number;
  velocity: number;
};

type SceneProps = {
  targetRef: MutableRefObject<SceneTarget>;
  activeSong: number;
  reducedMotion: boolean;
  onReady: () => void;
  onError: () => void;
};

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const frame = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(frame);
  }, [onReady]);

  return null;
}

function WebGLFallbackSignal({ onError }: { onError: () => void }) {
  useEffect(onError, [onError]);
  return null;
}

function Guitar({
  targetRef,
  activeSong,
  reducedMotion,
}: Omit<SceneProps, "onReady" | "onError">) {
  const group = useRef<Group>(null);
  const silverRim = useRef<SpotLight>(null);
  const bloodRim = useRef<SpotLight>(null);
  const guitar = useGLTF("/models/explorer-guitar.glb");

  const scene = useMemo(() => {
    const clone = guitar.scene.clone(true);

    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      object.frustumCulled = true;
      const source = object.material;
      const name = Array.isArray(source)
        ? source[0]?.name ?? ""
        : source?.name ?? "";

      if (name === "Material.004") {
        object.material = new MeshPhysicalMaterial({
          color: new Color("#1c2027"),
          emissive: new Color("#0a0b0e"),
          emissiveIntensity: 0.8,
          metalness: 0.3,
          roughness: 0.22,
          clearcoat: 1,
          clearcoatRoughness: 0.14,
          side: DoubleSide,
        });
      } else if (name === "Material.002") {
        object.material = new MeshStandardMaterial({
          color: new Color("#777a7f"),
          metalness: 1,
          roughness: 0.16,
          side: DoubleSide,
        });
      } else if (name === "Material.001") {
        object.material = new MeshStandardMaterial({
          color: new Color("#101114"),
          metalness: 0.9,
          roughness: 0.28,
          side: DoubleSide,
        });
      } else {
        object.material = new MeshStandardMaterial({
          color: new Color("#342e2b"),
          metalness: 0.18,
          roughness: 0.62,
          side: DoubleSide,
        });
      }
    });

    return clone;
  }, [guitar.scene]);

  useFrame((state, delta) => {
    if (!group.current || document.hidden) return;

    const target = targetRef.current;
    const idle = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.58);
    const velocityLean = MathUtils.clamp(target.velocity, -0.16, 0.16);
    const ease = 3.1;

    group.current.position.x = MathUtils.damp(
      group.current.position.x,
      target.x,
      ease,
      delta,
    );
    group.current.position.y = MathUtils.damp(
      group.current.position.y,
      target.y + idle * 0.035,
      ease,
      delta,
    );
    group.current.scale.setScalar(
      MathUtils.damp(group.current.scale.x, target.scale, ease, delta),
    );
    group.current.rotation.x = MathUtils.damp(
      group.current.rotation.x,
      target.rotationX + idle * 0.012,
      ease,
      delta,
    );
    group.current.rotation.y = MathUtils.damp(
      group.current.rotation.y,
      target.rotationY + velocityLean,
      ease,
      delta,
    );
    group.current.rotation.z = MathUtils.damp(
      group.current.rotation.z,
      target.rotationZ + idle * 0.008,
      ease,
      delta,
    );

    target.velocity = MathUtils.damp(target.velocity, 0, 4.5, delta);

    const perspectiveCamera = state.camera;
    perspectiveCamera.position.z = MathUtils.damp(
      perspectiveCamera.position.z,
      target.cameraZ,
      2.4,
      delta,
    );
    perspectiveCamera.lookAt(0, 0, 0);

    const songPulse = activeSong >= 0 ? 3 : 0;
    if (silverRim.current) {
      silverRim.current.intensity = MathUtils.damp(
        silverRim.current.intensity,
        target.rim,
        3,
        delta,
      );
    }
    if (bloodRim.current) {
      bloodRim.current.intensity = MathUtils.damp(
        bloodRim.current.intensity,
        7.5 + songPulse,
        4,
        delta,
      );
    }
  });

  return (
    <>
      <ambientLight intensity={0.72} color="#89909d" />
      <hemisphereLight args={["#c5cad3", "#090608", 1.25]} />
      <directionalLight
        position={[2.5, 2.4, 4.2]}
        color="#bfc5d0"
        intensity={4}
      />
      <directionalLight
        position={[-2.5, -1.8, 3.6]}
        color="#710b18"
        intensity={2.5}
      />
      <spotLight
        ref={silverRim}
        position={[4, 3.4, 4]}
        color="#d0d4db"
        intensity={11}
        angle={0.48}
        penumbra={0.75}
        distance={15}
      />
      <spotLight
        ref={bloodRim}
        position={[-4.2, -1, 3.4]}
        color="#7b0714"
        intensity={8}
        angle={0.54}
        penumbra={0.8}
        distance={14}
      />
      <pointLight position={[0, 0.8, 3.4]} intensity={4} color="#f2e8dc" />
      <group ref={group}>
        <Center>
          <primitive
            object={scene}
            rotation={[0.08, -0.18, Math.PI / 2]}
            scale={4.8}
          />
        </Center>
      </group>
    </>
  );
}

function Dust({ reducedMotion }: { reducedMotion: boolean }) {
  const points = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(78 * 3);
    for (let index = 0; index < 78; index += 1) {
      const seed = index * 12.9898;
      values[index * 3] = Math.sin(seed) * 5.4;
      values[index * 3 + 1] = Math.cos(seed * 1.7) * 3.2;
      values[index * 3 + 2] = -1.8 + (index % 9) * 0.42;
    }
    return values;
  }, []);

  useFrame((state, delta) => {
    if (!points.current || reducedMotion || document.hidden) return;
    points.current.rotation.y += delta * 0.009;
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.13) * 0.1;
  });

  if (reducedMotion) return null;

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#b9b2a8"
        size={0.018}
        opacity={0.22}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function SceneContents(props: SceneProps) {
  return (
    <>
      <color attach="background" args={["#050506"]} />
      <fog attach="fog" args={["#050506", 6.2, 12]} />
      <Guitar
        targetRef={props.targetRef}
        activeSong={props.activeSong}
        reducedMotion={props.reducedMotion}
      />
      <Dust reducedMotion={props.reducedMotion} />
      <ReadySignal onReady={props.onReady} />
      <Preload all />
    </>
  );
}

export default function SceneCanvas(props: SceneProps) {
  const [dpr, setDpr] = useState(1.25);

  return (
    <div className="scene-layer" aria-hidden="true">
      <SceneErrorBoundary onError={props.onError}>
        <Canvas
          camera={{ fov: 32, position: [0, 0, 6.4], near: 0.1, far: 30 }}
          dpr={props.reducedMotion ? 1 : dpr}
          gl={{
            antialias: !props.reducedMotion,
            alpha: false,
            powerPreference: "high-performance",
            outputColorSpace: SRGBColorSpace,
          }}
          fallback={<WebGLFallbackSignal onError={props.onError} />}
        >
          <PerformanceMonitor
            onIncline={() => setDpr(1.4)}
            onDecline={() => setDpr(1)}
          />
          <Suspense fallback={null}>
            <SceneContents {...props} />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}

useGLTF.preload("/models/explorer-guitar.glb");
