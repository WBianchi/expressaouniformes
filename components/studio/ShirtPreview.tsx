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
import {
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Color,
  DataTexture,
  RGBAFormat,
  RepeatWrapping,
} from "three";
import { defaultGarment, fabrics, type Garment } from "@/lib/garment";
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
  garment = defaultGarment,
}: {
  color: string;
  front?: string;
  back?: string;
  side: string;
  garment?: Garment;
}) {
  const { nodes, materials } = useGLTF("/shirt.glb");
  const geometry = (nodes.T_Shirt_male as Mesh).geometry;
  const texture = useMemo(() => {
    const size = 64,
      data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const wave =
          garment.fabric === "pique"
            ? Math.sin((x * Math.PI) / 8) * Math.sin((y * Math.PI) / 8)
            : garment.fabric === "dryfit"
              ? Math.cos((x * Math.PI) / 4) * Math.cos((y * Math.PI) / 4)
              : Math.sin(((x + y) * Math.PI) / 3);
        const index = (y * size + x) * 4;
        data[index] =
          data[index + 1] =
          data[index + 2] =
            128 + Math.round(wave * 90);
        data[index + 3] = 255;
      }
    const t = new DataTexture(data, size, size, RGBAFormat);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(22, 22);
    t.needsUpdate = true;
    return t;
  }, [garment.fabric]);
  const material = useMemo(() => {
    const m = (materials.lambert1 as MeshStandardMaterial).clone();
    m.color.set("#ffffff");
    m.onBeforeCompile = (shader) => {
      shader.uniforms.bodyTint = { value: new Color(color) };
      shader.uniforms.collarTint = { value: new Color(garment.collarColor) };
      shader.uniforms.sleeveTint = { value: new Color(garment.sleeveColor) };
      shader.vertexShader =
        "varying vec3 garmentPosition;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\ngarmentPosition = position;",
        );
      shader.fragmentShader =
        "varying vec3 garmentPosition;\nuniform vec3 bodyTint;\nuniform vec3 collarTint;\nuniform vec3 sleeveTint;\n" +
        shader.fragmentShader.replace(
          "#include <color_fragment>",
          `
        #include <color_fragment>
        float gx = abs(garmentPosition.x);
        float collarEdge = 0.255 - 0.06 * sqrt(max(0.0, 1.0 - gx * gx / 0.011));
        float collarMask = ${garment.collarEnabled ? "1.0" : "0.0"} * (1.0 - smoothstep(0.102, 0.105, gx)) * smoothstep(collarEdge, collarEdge + 0.001, garmentPosition.y);
        float sleeveMask = ${garment.sleevesEnabled ? "1.0" : "0.0"} * smoothstep(${garment.sleeveDetail === "cuff" ? "0.247, 0.249" : "0.179, 0.181"}, gx);
        diffuseColor.rgb *= mix(mix(bodyTint, sleeveTint, sleeveMask), collarTint, collarMask);
      `,
        );
    };
    m.customProgramCacheKey = () =>
      JSON.stringify([
        garment.collarEnabled,
        garment.sleevesEnabled,
        garment.sleeveDetail,
      ]);
    m.roughness = fabrics[garment.fabric].roughness;
    m.bumpMap = texture;
    m.bumpScale = fabrics[garment.fabric].bump;
    return m;
  }, [materials, garment, color, texture]);

  useEffect(() => () => texture.dispose(), [texture]);
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
  garment,
}: {
  garment?: Garment;
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
              <Shirt
                color={color}
                front={front}
                back={back}
                side={side}
                garment={garment}
              />
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
