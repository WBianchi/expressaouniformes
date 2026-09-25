"use client";
import { Suspense, useEffect, useMemo, Component, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  useGLTF,
  OrbitControls,
  Decal,
  useTexture,
  useProgress,
} from "@react-three/drei";
import { Mesh, MeshStandardMaterial, SRGBColorSpace } from "three";
function CameraZoom({ zoom }: { zoom: number }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, zoom, invalidate]);
  return null;
}
function Print({ image, back = false }: { image: string; back?: boolean }) {
  const map = useTexture(image);
  map.colorSpace = SRGBColorSpace;
  return (
    <Decal
      position={[0, -0.03, back ? -0.12 : 0.15]}
      rotation={[0, back ? Math.PI : 0, 0]}
      scale={[0.27, 0.32, 0.16]}
    >
      <meshStandardMaterial
        map={map}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-5}
        roughness={1}
      />
    </Decal>
  );
}
function Shirt({
  color,
  front,
  back,
  side,
}: {
  color: string;
  front?: string;
  back?: string;
  side: string;
}) {
  const { nodes, materials } = useGLTF("/shirt.glb");
  const geometry = (nodes.T_Shirt_male as Mesh).geometry;
  const material = useMemo(() => {
    const m = (materials.lambert1 as MeshStandardMaterial).clone();
    m.color.set(color);
    m.roughness = 1;
    return m;
  }, [materials, color]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group rotation={[0, side === "back" ? Math.PI : 0, 0]}>
      <mesh geometry={geometry} material={material} dispose={null}>
        {front && <Print image={front} />}
        {back && <Print image={back} back />}
      </mesh>
    </group>
  );
}
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="preview-fallback">
        Prévia 3D indisponível neste dispositivo. A edição 2D continua
        disponível.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function ShirtPreview({
  color = "#244e8a",
  front,
  back,
  side = "front",
  interactive = false,
  zoom = 380,
  allowWheelZoom = true,
}: {
  zoom?: number;
  allowWheelZoom?: boolean;
  color?: string;
  front?: string;
  back?: string;
  side?: string;
  interactive?: boolean;
}) {
  const { active } = useProgress();
  return (
    <div className="shirt-preview">
      {active && (
        <span className="preview-loading" role="status">
          Carregando peça…
        </span>
      )}
      <Boundary>
        <Canvas
          orthographic
          camera={{ position: [0, 0, 2], zoom }}
          dpr={[1, 1.5]}
          frameloop="demand"
          gl={{ preserveDrawingBuffer: true, alpha: true }}
          resize={{ scroll: false }}
        >
          <CameraZoom zoom={zoom} />
          <ambientLight intensity={1.8} />
          <directionalLight position={[2, 3, 5]} intensity={2.5} />
          <directionalLight position={[-3, 1, -2]} intensity={1.5} />
          <Suspense fallback={null}>
            <group position={[0, 0.045, 0]}>
              <Shirt color={color} front={front} back={back} side={side} />
            </group>
          </Suspense>
          {interactive && (
            <OrbitControls
              enableZoom={allowWheelZoom}
              enablePan={false}
              minZoom={350}
              maxZoom={1400}
            />
          )}
        </Canvas>
      </Boundary>
    </div>
  );
}
