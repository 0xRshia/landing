"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  AdditiveBlending,
  Box3,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Points,
  SRGBColorSpace,
  SpotLight,
  Vector3,
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
  onLoading: () => void;
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

function RenderReadySignal({
  onReady,
  onError,
}: Pick<SceneProps, "onReady" | "onError">) {
  const { camera, gl, scene } = useThree();
  const compiled = useRef(false);
  const readyFrame = useRef<number | null>(null);
  const signalled = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void gl
      .compileAsync(scene, camera)
      .then(() => {
        if (!cancelled) compiled.current = true;
      })
      .catch(() => {
        if (!cancelled) onError();
      });

    return () => {
      cancelled = true;
      if (readyFrame.current !== null) {
        cancelAnimationFrame(readyFrame.current);
      }
    };
  }, [camera, gl, onError, scene]);

  useFrame(() => {
    if (!compiled.current || signalled.current) return;

    signalled.current = true;
    readyFrame.current = requestAnimationFrame(onReady);
  });

  return null;
}

function WebGLFallbackSignal({ onError }: { onError: () => void }) {
  useEffect(onError, [onError]);
  return null;
}

function WebGLContextMonitor({
  onError,
  onRestored,
}: {
  onError: () => void;
  onRestored: () => void;
}) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: WebGLContextEvent) => {
      event.preventDefault();
      onError();
    };
    const handleRestored = () => onRestored();

    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", handleRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [gl, onError, onRestored]);

  return null;
}

function Guitar({
  targetRef,
  activeSong,
  reducedMotion,
}: Omit<SceneProps, "onLoading" | "onReady" | "onError">) {
  const group = useRef<Group>(null);
  const silverRim = useRef<SpotLight>(null);
  const bloodRim = useRef<SpotLight>(null);
  const viewport = useThree((state) => state.viewport);
  const guitar = useGLTF("/models/explorer-guitar.glb");

  const preparedGuitar = useMemo(() => {
    const clone = guitar.scene.clone(true);

    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      // This is one compact hero model. Disabling culling avoids false-negative
      // bounds on mobile Safari without creating a meaningful rendering cost.
      object.frustumCulled = false;
      const source = object.material;
      const name = Array.isArray(source)
        ? source[0]?.name ?? ""
        : source?.name ?? "";

      if (name === "Material.004") {
        object.material = new MeshStandardMaterial({
          color: new Color("#252a33"),
          emissive: new Color("#10131a"),
          emissiveIntensity: 0.5,
          metalness: 0.48,
          roughness: 0.3,
          side: DoubleSide,
        });
      } else if (name === "Material.002") {
        object.material = new MeshStandardMaterial({
          color: new Color("#9da1a8"),
          metalness: 0.92,
          roughness: 0.2,
          side: DoubleSide,
        });
      } else if (name === "Material.001") {
        object.material = new MeshStandardMaterial({
          color: new Color("#181a20"),
          metalness: 0.82,
          roughness: 0.32,
          side: DoubleSide,
        });
      } else {
        object.material = new MeshStandardMaterial({
          color: new Color("#4a403b"),
          metalness: 0.18,
          roughness: 0.58,
          side: DoubleSide,
        });
      }
    });

    const oriented = new Group();
    oriented.add(clone);
    oriented.rotation.set(0.08, -0.18, Math.PI / 2);
    oriented.updateMatrixWorld(true);

    const bounds = new Box3().setFromObject(oriented);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const dimensions = [center.x, center.y, center.z, size.x, size.y, size.z];

    if (
      bounds.isEmpty() ||
      size.lengthSq() === 0 ||
      !dimensions.every(Number.isFinite)
    ) {
      throw new Error("The guitar model has invalid render bounds.");
    }

    oriented.position.sub(center);

    const root = new Group();
    root.add(oriented);

    return {
      root,
      width: size.x,
      height: size.y,
    };
  }, [guitar.scene]);

  const fittedScale = Math.min(
    (viewport.width * 0.78) / preparedGuitar.width,
    (viewport.height * 0.82) / preparedGuitar.height,
  );

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
        <primitive object={preparedGuitar.root} scale={fittedScale} />
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
      <RenderReadySignal onReady={props.onReady} onError={props.onError} />
    </>
  );
}

export default function SceneCanvas(props: SceneProps) {
  const { onError, onLoading } = props;
  const [compact, setCompact] = useState(true);
  const [contextGeneration, setContextGeneration] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const handleContextRestored = useCallback(() => {
    onLoading();
    setContextGeneration((generation) => generation + 1);
  }, [onLoading]);

  const handleContextLost = useCallback(() => {
    onError();
    setContextGeneration((generation) => generation + 1);
  }, [onError]);

  return (
    <div className="scene-layer" aria-hidden="true">
      <SceneErrorBoundary onError={props.onError}>
        <Canvas
          camera={{ fov: 32, position: [0, 0, 6.4], near: 0.1, far: 30 }}
          dpr={props.reducedMotion || compact ? 1 : 1.25}
          gl={{
            antialias: !props.reducedMotion && !compact,
            alpha: false,
            powerPreference: compact ? "default" : "high-performance",
            outputColorSpace: SRGBColorSpace,
          }}
          fallback={<WebGLFallbackSignal onError={props.onError} />}
        >
          <WebGLContextMonitor
            onError={handleContextLost}
            onRestored={handleContextRestored}
          />
          <Suspense key={contextGeneration} fallback={null}>
            <SceneContents {...props} />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}

useGLTF.preload("/models/explorer-guitar.glb");
