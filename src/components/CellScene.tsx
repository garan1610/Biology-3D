import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  Environment,
  Float,
  Html,
  Lightformer,
  OrbitControls,
  RoundedBox,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import {
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ForwardedRef,
  type RefObject,
} from "react";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshPhysicalMaterialParameters,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  RepeatWrapping,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  type Material,
  type MeshStandardMaterialParameters,
  type Texture,
} from "three";
import type { CellItem, CellModelAsset, ViewMode } from "../data/cells";

type CellSceneProps = {
  cell: CellItem;
  activeOrganelle: string;
  viewMode: ViewMode;
  crossSection: boolean;
  autoRotate: boolean;
  resetKey: number;
};

export type CellSceneHandle = {
  captureScreenshot: () => Promise<Blob>;
  exportGLB: () => Promise<Blob>;
};

type MaterialProps = {
  id: string;
  activeOrganelle: string;
  viewMode: ViewMode;
  color: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
};

const surfaceTextureCache = new Map<string, CanvasTexture>();

type DerivedTextureSet = {
  normalMap: CanvasTexture;
  roughnessMap: CanvasTexture;
  aoMap: CanvasTexture;
};

type NativeAssetPreset = ReturnType<typeof getNativeAssetPreset>;

const derivedTextureCache = new Map<string, DerivedTextureSet>();

const sharpenShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new Vector2(1, 1) },
    strength: { value: 0.18 },
    contrast: { value: 1.035 },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float strength;
    uniform float contrast;
    varying vec2 vUv;

    void main() {
      vec2 texel = 1.0 / resolution;
      vec4 center = texture2D(tDiffuse, vUv);
      vec4 north = texture2D(tDiffuse, vUv + vec2(0.0, texel.y));
      vec4 south = texture2D(tDiffuse, vUv - vec2(0.0, texel.y));
      vec4 east = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0));
      vec4 west = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0));
      vec3 sharpened = center.rgb * (1.0 + 4.0 * strength) - (north.rgb + south.rgb + east.rgb + west.rgb) * strength;
      vec3 contrasted = (sharpened - 0.5) * contrast + 0.5;
      gl_FragColor = vec4(clamp(contrasted, 0.0, 1.0), center.a);
    }
  `,
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getCellSurfaceTexture(seed: string) {
  const cached = surfaceTextureCache.get(seed);
  if (cached) {
    return cached;
  }

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create material texture.");
  }

  const image = context.createImageData(size, size);
  const seedValue = hashString(seed);
  const phaseA = (seedValue % 997) / 997;
  const phaseB = ((seedValue >> 8) % 991) / 991;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / size;
      const ny = y / size;
      const broad = Math.sin((nx * 8.5 + phaseA * 4.2) * Math.PI) + Math.cos((ny * 7.5 + phaseB * 5.6) * Math.PI);
      const fine = Math.sin((nx * 38 + ny * 14 + phaseB * 9) * Math.PI) * 0.42;
      const pores = Math.cos((nx * 73 - ny * 61 + phaseA * 13) * Math.PI) * 0.28;
      const value = Math.max(72, Math.min(206, 132 + broad * 18 + fine * 16 + pores * 12));
      const offset = (y * size + x) * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2.4, 2.4);
  texture.needsUpdate = true;
  surfaceTextureCache.set(seed, texture);
  return texture;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getCanvasSourceSize(source: CanvasImageSource) {
  const sized = source as CanvasImageSource & {
    naturalWidth?: number;
    naturalHeight?: number;
    videoWidth?: number;
    videoHeight?: number;
    width?: number;
    height?: number;
  };

  return {
    width: Math.max(1, sized.naturalWidth ?? sized.videoWidth ?? Number(sized.width) ?? 1),
    height: Math.max(1, sized.naturalHeight ?? sized.videoHeight ?? Number(sized.height) ?? 1),
  };
}

function configureGeneratedTexture(texture: CanvasTexture) {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function getSourceImage(texture: Texture) {
  return texture.image as CanvasImageSource | undefined;
}

function generateDerivedMapsFromTexture({
  texture,
  preset,
  seed,
}: {
  texture: Texture;
  preset: NativeAssetPreset;
  seed: string;
}) {
  const cached = derivedTextureCache.get(seed);
  if (cached) {
    return cached;
  }

  const source = getSourceImage(texture);
  if (!source) {
    return null;
  }

  const sourceSize = getCanvasSourceSize(source);
  const maxSize = 768;
  const scale = Math.min(1, maxSize / Math.max(sourceSize.width, sourceSize.height));
  const width = Math.max(32, Math.round(sourceSize.width * scale));
  const height = Math.max(32, Math.round(sourceSize.height * scale));
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
  if (!colorContext) {
    return null;
  }

  try {
    colorContext.drawImage(source, 0, 0, width, height);
  } catch {
    return null;
  }

  const colorData = colorContext.getImageData(0, 0, width, height);
  const pixelCount = width * height;
  const heightField = new Float32Array(pixelCount);
  const saturationField = new Float32Array(pixelCount);

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const r = colorData.data[offset] / 255;
    const g = colorData.data[offset + 1] / 255;
    const b = colorData.data[offset + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
    saturationField[index] = max === 0 ? 0 : (max - min) / max;
    heightField[index] = clamp01(luminance * preset.heightLuminance + saturationField[index] * preset.heightSaturation);
  }

  const normalCanvas = document.createElement("canvas");
  const roughnessCanvas = document.createElement("canvas");
  const aoCanvas = document.createElement("canvas");
  normalCanvas.width = width;
  normalCanvas.height = height;
  roughnessCanvas.width = width;
  roughnessCanvas.height = height;
  aoCanvas.width = width;
  aoCanvas.height = height;

  const normalContext = normalCanvas.getContext("2d");
  const roughnessContext = roughnessCanvas.getContext("2d");
  const aoContext = aoCanvas.getContext("2d");
  if (!normalContext || !roughnessContext || !aoContext) {
    return null;
  }

  const normalImage = normalContext.createImageData(width, height);
  const roughnessImage = roughnessContext.createImageData(width, height);
  const aoImage = aoContext.createImageData(width, height);

  const sample = (x: number, y: number) => {
    const px = (x + width) % width;
    const py = (y + height) % height;
    return heightField[py * width + px];
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const offset = index * 4;
      const center = sample(x, y);
      const dx = sample(x + 1, y) - sample(x - 1, y);
      const dy = sample(x, y + 1) - sample(x, y - 1);
      const nx = -dx * preset.normalStrength;
      const ny = -dy * preset.normalStrength;
      const nz = 1;
      const length = Math.hypot(nx, ny, nz) || 1;
      const edge = Math.min(1, (Math.abs(dx) + Math.abs(dy)) * preset.edgeStrength);
      const saturation = saturationField[index];

      normalImage.data[offset] = Math.round((nx / length * 0.5 + 0.5) * 255);
      normalImage.data[offset + 1] = Math.round((ny / length * 0.5 + 0.5) * 255);
      normalImage.data[offset + 2] = Math.round((nz / length * 0.5 + 0.5) * 255);
      normalImage.data[offset + 3] = 255;

      const roughness = clamp01(
        preset.roughnessBase +
          (1 - center) * preset.roughnessFromDark +
          saturation * preset.roughnessFromSaturation +
          edge * preset.roughnessFromEdges,
      );
      const roughnessByte = Math.round(roughness * 255);
      roughnessImage.data[offset] = roughnessByte;
      roughnessImage.data[offset + 1] = roughnessByte;
      roughnessImage.data[offset + 2] = roughnessByte;
      roughnessImage.data[offset + 3] = 255;

      const ao = clamp01(1 - ((1 - center) * preset.aoFromDark + edge * preset.aoFromEdges));
      const aoByte = Math.round(ao * 255);
      aoImage.data[offset] = aoByte;
      aoImage.data[offset + 1] = aoByte;
      aoImage.data[offset + 2] = aoByte;
      aoImage.data[offset + 3] = 255;
    }
  }

  normalContext.putImageData(normalImage, 0, 0);
  roughnessContext.putImageData(roughnessImage, 0, 0);
  aoContext.putImageData(aoImage, 0, 0);

  const maps = {
    normalMap: configureGeneratedTexture(new CanvasTexture(normalCanvas)),
    roughnessMap: configureGeneratedTexture(new CanvasTexture(roughnessCanvas)),
    aoMap: configureGeneratedTexture(new CanvasTexture(aoCanvas)),
  };
  derivedTextureCache.set(seed, maps);
  return maps;
}

function CellMaterial({
  id,
  activeOrganelle,
  viewMode,
  color,
  opacity = 1,
  roughness = 0.66,
  metalness = 0.03,
}: MaterialProps) {
  const active = id === activeOrganelle;
  const dimmed = viewMode === "focus" && !active;
  const bumpMap = useMemo(() => getCellSurfaceTexture(`${id}:${color}`), [color, id]);
  const material: MeshPhysicalMaterialParameters = {
    color,
    roughness: active ? Math.max(0.34, roughness - 0.08) : roughness,
    metalness,
    side: DoubleSide,
    transparent: opacity < 1 || dimmed,
    opacity: dimmed ? Math.min(opacity, 0.18) : opacity,
    emissive: active ? new Color(color).lerp(new Color("#fff7df"), 0.28) : "#000000",
    emissiveIntensity: active ? 0.16 : 0,
    clearcoat: 0.34,
    clearcoatRoughness: 0.48,
    ior: 1.36,
    reflectivity: 0.46,
    transmission: opacity < 0.72 && !dimmed ? 0.08 : 0,
    thickness: 0.35,
    bumpMap,
    bumpScale: active ? 0.034 : 0.022,
    envMapIntensity: active ? 1.18 : 0.82,
  };

  return <meshPhysicalMaterial {...material} />;
}

type TubeProps = {
  id: string;
  color: string;
  points: Array<[number, number, number]>;
  radius?: number;
  activeOrganelle: string;
  viewMode: ViewMode;
};

function CurveTube({
  id,
  color,
  points,
  radius = 0.035,
  activeOrganelle,
  viewMode,
}: TubeProps) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(
      points.map((point) => new Vector3(point[0], point[1], point[2])),
    );
    return new TubeGeometry(curve, 80, radius, 12, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <CellMaterial
        id={id}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        color={color}
        roughness={0.58}
      />
    </mesh>
  );
}

type CommonModelProps = {
  activeOrganelle: string;
  viewMode: ViewMode;
  crossSection: boolean;
};

function applyAssetVertexColors(mesh: Mesh, cell: CellItem) {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute("position");
  if (!position) {
    return;
  }

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) {
    return;
  }

  const sizeX = Math.max(box.max.x - box.min.x, 0.001);
  const sizeY = Math.max(box.max.y - box.min.y, 0.001);
  const sizeZ = Math.max(box.max.z - box.min.z, 0.001);
  const palette = [
    new Color(cell.color),
    new Color(cell.accent),
    ...cell.organelles.map((organelle) => new Color(organelle.color)),
  ];
  const highlight = new Color("#fff4d8");
  const shadow = new Color("#3d4a72");
  const colors: number[] = [];

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const nx = (x - box.min.x) / sizeX;
    const ny = (y - box.min.y) / sizeY;
    const nz = (z - box.min.z) / sizeZ;
    const flow = Math.sin(nx * 11.6 + ny * 4.8) + Math.cos(ny * 9.4 + nz * 7.2);
    const paletteIndex = Math.abs(Math.floor((flow + nx * 3.2 + ny * 2.6) * palette.length)) % palette.length;
    const color = new Color(cell.color).lerp(palette[paletteIndex], 0.48);
    color.lerp(highlight, Math.max(0, nz - 0.24) * 0.22);
    color.lerp(shadow, Math.max(0, 0.32 - nz) * 0.12);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
}

function createAssetMaterial({
  original,
  cell,
  meshIndex,
  viewMode,
  crossSection,
}: {
  original: Mesh["material"];
  cell: CellItem;
  meshIndex: number;
  viewMode: ViewMode;
  crossSection: boolean;
}) {
  const source = Array.isArray(original) ? original[0] : original;
  const sourceMaterial = source as Partial<MeshStandardMaterial>;
  const bumpMap = sourceMaterial.normalMap ? null : getCellSurfaceTexture(`${cell.id}:asset:${meshIndex}`);
  const material = new MeshStandardMaterial({
    color: "#ffffff",
    map: sourceMaterial.map ?? null,
    normalMap: sourceMaterial.normalMap ?? null,
    bumpMap,
    bumpScale: bumpMap ? 0.018 : 0,
    roughnessMap: sourceMaterial.roughnessMap ?? null,
    metalnessMap: sourceMaterial.metalnessMap ?? null,
    side: DoubleSide,
    vertexColors: true,
    transparent: crossSection || viewMode === "focus" || sourceMaterial.transparent,
    opacity: crossSection ? 0.92 : viewMode === "focus" ? 0.95 : sourceMaterial.opacity ?? 1,
    roughness: Math.max(0.36, Math.min(0.74, sourceMaterial.roughness ?? 0.44)),
    metalness: Math.min(0.12, sourceMaterial.metalness ?? 0.03),
    emissive: new Color(cell.accent).lerp(new Color("#ffffff"), 0.58),
    emissiveIntensity: viewMode === "focus" ? 0.034 : 0.01,
  });

  material.envMapIntensity = 1.08 * (cell.modelAsset?.exposure ?? 1);
  material.needsUpdate = true;
  return material;
}

function getNativeAssetPreset(asset: CellModelAsset) {
  const assetKey = `${asset.url} ${asset.sourceLabel}`.toLowerCase();
  const isWhiteBlood = assetKey.includes("white-blood");
  const isPlant = assetKey.includes("plant");

  if (isWhiteBlood) {
    return {
      anisotropy: 14,
      color: new Color(1.045, 1.035, 1.055),
      roughness: 0.34,
      metalness: 0.01,
      emissive: new Color("#f7efff"),
      emissiveIntensity: 0.018,
      envMapIntensity: 1.42,
      bumpScale: 0.032,
      normalStrength: 5.8,
      normalScale: 0.56,
      edgeStrength: 10.5,
      heightLuminance: 0.78,
      heightSaturation: 0.38,
      roughnessBase: 0.26,
      roughnessFromDark: 0.18,
      roughnessFromSaturation: 0.2,
      roughnessFromEdges: 0.18,
      aoIntensity: 0.62,
      aoFromDark: 0.28,
      aoFromEdges: 0.18,
      clearcoat: 0.42,
      clearcoatRoughness: 0.36,
      sheen: 0.24,
      sheenRoughness: 0.68,
      sheenColor: new Color("#f6eeff"),
      ior: 1.34,
      reflectivity: 0.58,
      transmission: 0.09,
      thickness: 0.56,
      attenuationDistance: 2.8,
      attenuationColor: new Color("#f1e7ff"),
      specularIntensity: 0.78,
      specularColor: new Color("#fff8ff"),
      opacity: 1,
      crossSectionOpacity: 0.78,
      transparent: false,
    };
  }

  if (isPlant) {
    return {
      anisotropy: 16,
      color: new Color(1.035, 1.025, 0.965),
      roughness: 0.46,
      metalness: 0.015,
      emissive: new Color("#fff1d5"),
      emissiveIntensity: 0.012,
      envMapIntensity: 1.34,
      bumpScale: 0.045,
      normalStrength: 6.1,
      normalScale: 0.54,
      edgeStrength: 10.8,
      heightLuminance: 0.64,
      heightSaturation: 0.54,
      roughnessBase: 0.42,
      roughnessFromDark: 0.16,
      roughnessFromSaturation: 0.24,
      roughnessFromEdges: 0.2,
      aoIntensity: 0.62,
      aoFromDark: 0.24,
      aoFromEdges: 0.24,
      clearcoat: 0.2,
      clearcoatRoughness: 0.62,
      sheen: 0.1,
      sheenRoughness: 0.74,
      sheenColor: new Color("#f2e4b1"),
      ior: 1.38,
      reflectivity: 0.38,
      transmission: 0.015,
      thickness: 0.22,
      attenuationDistance: 3.8,
      attenuationColor: new Color("#fff2cf"),
      specularIntensity: 0.46,
      specularColor: new Color("#fff8e9"),
      opacity: 1,
      crossSectionOpacity: 0.84,
      transparent: false,
    };
  }

  return {
    anisotropy: 10,
    color: new Color(1.015, 1.01, 0.995),
    roughness: 0.48,
    metalness: 0.03,
    emissive: new Color("#fff4e5"),
    emissiveIntensity: 0.02,
    envMapIntensity: 1.16,
    bumpScale: 0.014,
    normalStrength: 4,
    normalScale: 0.32,
    edgeStrength: 8,
    heightLuminance: 0.72,
    heightSaturation: 0.32,
    roughnessBase: 0.38,
    roughnessFromDark: 0.12,
    roughnessFromSaturation: 0.16,
    roughnessFromEdges: 0.12,
    aoIntensity: 0.5,
    aoFromDark: 0.18,
    aoFromEdges: 0.14,
    clearcoat: 0.18,
    clearcoatRoughness: 0.54,
    sheen: 0,
    sheenRoughness: 1,
    sheenColor: new Color("#ffffff"),
    ior: 1.36,
    reflectivity: 0.42,
    transmission: 0,
    thickness: 0.16,
    attenuationDistance: Infinity,
    attenuationColor: new Color("#ffffff"),
    specularIntensity: 0.5,
    specularColor: new Color("#ffffff"),
    opacity: 1,
    crossSectionOpacity: 0.86,
    transparent: false,
  };
}

function createNativeAssetMaterial({
  original,
  asset,
  crossSection,
}: {
  original: Mesh["material"];
  asset: CellModelAsset;
  crossSection: boolean;
}) {
  const nativePreset = getNativeAssetPreset(asset);
  const cloneMaterial = (source: Material) => {
    const sourceMaterial = source instanceof MeshStandardMaterial ? source : null;
    const displayMap = sourceMaterial?.map ?? null;
    const generatedMaps = displayMap
      ? generateDerivedMapsFromTexture({
          texture: displayMap,
          preset: nativePreset,
          seed: `${asset.url}:${displayMap.uuid}:${nativePreset.normalStrength}`,
        })
      : null;
    const material =
      sourceMaterial instanceof MeshStandardMaterial
        ? new MeshPhysicalMaterial({
            color: sourceMaterial.color,
            map: displayMap,
            normalMap: sourceMaterial.normalMap ?? generatedMaps?.normalMap ?? null,
            roughnessMap: sourceMaterial.roughnessMap ?? generatedMaps?.roughnessMap ?? null,
            metalnessMap: sourceMaterial.metalnessMap,
            alphaMap: sourceMaterial.alphaMap,
            aoMap: sourceMaterial.aoMap ?? generatedMaps?.aoMap ?? null,
            aoMapIntensity: generatedMaps?.aoMap ? nativePreset.aoIntensity : 1,
            side: DoubleSide,
            transparent: crossSection || sourceMaterial.transparent || nativePreset.transparent,
            opacity: crossSection ? nativePreset.crossSectionOpacity : nativePreset.opacity,
            roughness: nativePreset.roughness,
            metalness: Math.min(sourceMaterial.metalness, nativePreset.metalness),
            emissive: nativePreset.emissive,
            emissiveMap: displayMap,
            emissiveIntensity: nativePreset.emissiveIntensity * (asset.exposure ?? 1),
            clearcoat: nativePreset.clearcoat,
            clearcoatRoughness: nativePreset.clearcoatRoughness,
            sheen: nativePreset.sheen,
            sheenRoughness: nativePreset.sheenRoughness,
            sheenColor: nativePreset.sheenColor,
            ior: nativePreset.ior,
            reflectivity: nativePreset.reflectivity,
            transmission: nativePreset.transmission,
            thickness: nativePreset.thickness,
            attenuationDistance: nativePreset.attenuationDistance,
            attenuationColor: nativePreset.attenuationColor,
            specularIntensity: nativePreset.specularIntensity,
            specularColor: nativePreset.specularColor,
            bumpMap: sourceMaterial.normalMap || generatedMaps?.normalMap ? null : displayMap ?? getCellSurfaceTexture(`${asset.url}:${sourceMaterial.uuid}`),
            bumpScale: sourceMaterial.normalMap || generatedMaps?.normalMap ? 0 : nativePreset.bumpScale,
          })
        : source.clone();
    material.side = DoubleSide;
    material.transparent = crossSection || material.transparent || nativePreset.transparent;
    material.opacity = crossSection ? Math.min(material.opacity, nativePreset.crossSectionOpacity) : material.opacity;

    if (material instanceof MeshStandardMaterial) {
      if (displayMap) {
        displayMap.anisotropy = nativePreset.anisotropy;
        displayMap.colorSpace = SRGBColorSpace;
        displayMap.needsUpdate = true;
      }
      material.vertexColors = false;
      material.envMapIntensity = nativePreset.envMapIntensity * (asset.exposure ?? 1);
      material.color.multiply(nativePreset.color);
      if (material.normalMap) {
        material.normalScale.set(nativePreset.normalScale, nativePreset.normalScale);
      }
    }

    material.needsUpdate = true;
    return material;
  };

  return Array.isArray(original) ? original.map(cloneMaterial) : cloneMaterial(original);
}

function AssetCellModel({
  cell,
  asset,
  viewMode,
  crossSection,
}: CommonModelProps & {
  cell: CellItem;
  asset: CellModelAsset;
}) {
  const { scene } = useGLTF(asset.url);
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    let meshIndex = 0;

    clone.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) {
        return;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (asset.materialMode === "native") {
        const uv = mesh.geometry.getAttribute("uv");
        if (uv && !mesh.geometry.getAttribute("uv2")) {
          mesh.geometry.setAttribute("uv2", uv);
        }
        if (cell.id === "whiteBlood") {
          mesh.geometry = mesh.geometry.clone();
          mesh.geometry.computeVertexNormals();
        }
        mesh.material = createNativeAssetMaterial({
          original: mesh.material,
          asset,
          crossSection,
        });
      } else {
        mesh.geometry.computeVertexNormals();
        applyAssetVertexColors(mesh, cell);
        mesh.material = createAssetMaterial({
          original: mesh.material,
          cell,
          meshIndex,
          viewMode,
          crossSection,
        });
      }
      meshIndex += 1;
    });

    return clone;
  }, [cell, scene, viewMode, crossSection]);

  return (
    <group
      position={asset.position ?? [0, 0, 0]}
      rotation={asset.rotation ?? [0, 0, 0]}
      scale={[asset.scale, asset.scale, asset.scale]}
    >
      <Center>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

function Dots({
  id,
  color,
  activeOrganelle,
  viewMode,
  count,
  spread,
}: CommonModelProps & {
  id: string;
  color: string;
  count: number;
  spread: [number, number, number];
}) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const a = index * 1.71;
        const b = index * 2.37;
        return [
          Math.sin(a) * spread[0],
          Math.cos(b) * spread[1],
          Math.sin(a + b) * spread[2],
        ] as [number, number, number];
      }),
    [count, spread],
  );

  return (
    <>
      {dots.map((position, index) => (
        <mesh key={`${id}-${index}`} position={position} castShadow>
          <sphereGeometry args={[0.055 + (index % 3) * 0.018, 18, 18]} />
          <CellMaterial
            id={id}
            activeOrganelle={activeOrganelle}
            viewMode={viewMode}
            color={color}
            opacity={0.92}
          />
        </mesh>
      ))}
    </>
  );
}

function Nucleus({
  id = "nucleus",
  position,
  scale,
  activeOrganelle,
  viewMode,
  color = "#7047a8",
}: CommonModelProps & {
  id?: string;
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 48]} />
        <CellMaterial
          id={id}
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color={color}
          opacity={0.92}
          roughness={0.44}
        />
      </mesh>
      <mesh position={[0.2, 0.16, 0.38]} castShadow>
        <sphereGeometry args={[0.23, 28, 28]} />
        <CellMaterial
          id={id}
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#b56ad8"
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

function Mitochondrion({
  id = "mitochondrion",
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  activeOrganelle,
  viewMode,
}: CommonModelProps & {
  id?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.16, 0.46, 10, 24]} />
        <CellMaterial
          id={id}
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#cf7042"
        />
      </mesh>
      {[0, 1, 2].map((item) => (
        <mesh key={item} position={[0, -0.18 + item * 0.18, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.09, 0.012, 8, 18]} />
          <CellMaterial
            id={id}
            activeOrganelle={activeOrganelle}
            viewMode={viewMode}
            color="#f0b074"
          />
        </mesh>
      ))}
    </group>
  );
}

function PlantModel({ activeOrganelle, viewMode, crossSection }: CommonModelProps) {
  return (
    <group rotation={[0.1, -0.28, 0]}>
      <RoundedBox args={[4.7, 2.7, 0.42]} radius={0.18} smoothness={8} position={[0, 0, 0]}>
        <CellMaterial
          id="cellWall"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#84ad4a"
          opacity={crossSection ? 0.34 : 0.5}
        />
      </RoundedBox>
      <RoundedBox args={[4.18, 2.24, 0.24]} radius={0.12} smoothness={8} position={[0.02, 0.02, 0.08]}>
        <CellMaterial
          id="cellWall"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#4f9f83"
          opacity={0.24}
        />
      </RoundedBox>
      <mesh position={[-0.45, -0.12, 0.32]} scale={[1.05, 0.78, 0.28]} castShadow>
        <sphereGeometry args={[0.78, 46, 46]} />
        <CellMaterial
          id="vacuole"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#62bdd2"
          opacity={0.74}
        />
      </mesh>
      <Nucleus
        position={[0.92, 0.42, 0.45]}
        scale={[0.52, 0.52, 0.38]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
      {[
        [-1.65, 0.48, 0.28],
        [1.68, -0.38, 0.3],
        [-1.52, -0.62, 0.22],
      ].map((position, index) => (
        <group key={index} position={position as [number, number, number]} rotation={[0, 0, index * 0.7]}>
          <mesh scale={[0.35, 0.18, 0.12]} castShadow>
            <sphereGeometry args={[1, 30, 20]} />
            <CellMaterial
              id="chloroplast"
              activeOrganelle={activeOrganelle}
              viewMode={viewMode}
              color="#67ad46"
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.82, 1]}>
            <torusGeometry args={[0.22, 0.012, 8, 42]} />
            <CellMaterial
              id="chloroplast"
              activeOrganelle={activeOrganelle}
              viewMode={viewMode}
              color="#9ed36a"
            />
          </mesh>
        </group>
      ))}
      <Mitochondrion
        position={[0.28, -0.72, 0.42]}
        rotation={[0.3, 0.2, 1.35]}
        scale={[0.95, 0.95, 0.95]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
      <CurveTube
        id="nucleus"
        color="#ce785c"
        points={[
          [0.42, 0.12, 0.42],
          [0.62, -0.06, 0.5],
          [1.05, -0.08, 0.46],
          [1.44, 0.06, 0.38],
        ]}
        radius={0.05}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
      />
      <Dots
        id="vacuole"
        color="#c76ac5"
        count={18}
        spread={[1.72, 0.92, 0.42]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
    </group>
  );
}

function WhiteBloodModel({ activeOrganelle, viewMode, crossSection }: CommonModelProps) {
  return (
    <group scale={[1.2, 1.2, 1.2]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.35, 64, 64]} />
        <CellMaterial
          id="membrane"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#d6d7e6"
          opacity={crossSection ? 0.28 : 0.45}
        />
      </mesh>
      {[
        [-0.42, 0.22, 0.34],
        [0.28, 0.06, 0.36],
        [0.02, -0.42, 0.28],
      ].map((position, index) => (
        <Nucleus
          key={index}
          id="nucleus"
          position={position as [number, number, number]}
          scale={[0.42, 0.36, 0.28]}
          color="#6c35a0"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          crossSection={crossSection}
        />
      ))}
      <Dots
        id="granules"
        color="#c06696"
        count={30}
        spread={[1.05, 1.02, 0.72]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
      <Dots
        id="lysosome"
        color="#8b54b7"
        count={12}
        spread={[0.92, 0.88, 0.62]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
    </group>
  );
}

function NeuronModel({ activeOrganelle, viewMode, crossSection }: CommonModelProps) {
  return (
    <group rotation={[0.02, -0.2, 0]} scale={[1.05, 1.05, 1.05]}>
      <Nucleus
        id="soma"
        position={[-0.55, 0, 0.08]}
        scale={[0.64, 0.58, 0.44]}
        color="#774eb2"
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
      <mesh position={[-0.55, 0, 0]} scale={[0.94, 0.82, 0.62]} castShadow receiveShadow>
        <sphereGeometry args={[1, 52, 52]} />
        <CellMaterial
          id="soma"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#8db5d8"
          opacity={crossSection ? 0.36 : 0.55}
        />
      </mesh>
      <CurveTube
        id="axon"
        color="#6b7dc6"
        points={[
          [0.04, 0.02, 0.04],
          [0.72, -0.02, 0.02],
          [1.56, 0.04, 0.02],
          [2.35, -0.04, 0],
        ]}
        radius={0.08}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
      />
      {[0.55, 1.06, 1.58, 2.08].map((x, index) => (
        <mesh key={index} position={[x, 0, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.16, 0.24, 8, 24]} />
          <CellMaterial
            id="axon"
            activeOrganelle={activeOrganelle}
            viewMode={viewMode}
            color="#bfd1df"
            opacity={0.94}
          />
        </mesh>
      ))}
      {[
        [
          [-1.08, 0.28, 0],
          [-1.55, 0.82, 0.08],
          [-2.1, 1.03, 0],
        ],
        [
          [-1.16, -0.18, 0],
          [-1.7, -0.54, 0.05],
          [-2.2, -0.9, 0],
        ],
        [
          [-0.78, 0.58, 0.04],
          [-0.82, 1.16, 0.02],
          [-1.12, 1.58, 0],
        ],
        [
          [-0.9, -0.55, 0.04],
          [-0.92, -1.04, 0],
          [-1.2, -1.44, 0.02],
        ],
      ].map((points, index) => (
        <CurveTube
          key={index}
          id="dendrites"
          color="#7d9bcf"
          points={points as Array<[number, number, number]>}
          radius={0.052}
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
        />
      ))}
      <Dots
        id="dendrites"
        color="#b46ac7"
        count={12}
        spread={[2.2, 1.4, 0.2]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
    </group>
  );
}

function EpithelialModel({ activeOrganelle, viewMode, crossSection }: CommonModelProps) {
  return (
    <group rotation={[0.08, -0.22, 0]} scale={[1.08, 1.08, 1.08]}>
      <RoundedBox args={[2.4, 2.0, 0.72]} radius={0.1} smoothness={8} position={[0, -0.12, 0]}>
        <CellMaterial
          id="membrane"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#d79baa"
          opacity={crossSection ? 0.32 : 0.52}
        />
      </RoundedBox>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh
          key={index}
          position={[-1.1 + index * 0.2, 1.04, 0.08]}
          rotation={[0, 0, 0]}
          castShadow
        >
          <capsuleGeometry args={[0.045, 0.34, 8, 14]} />
          <CellMaterial
            id="microvilli"
            activeOrganelle={activeOrganelle}
            viewMode={viewMode}
            color="#c86f80"
          />
        </mesh>
      ))}
      <Nucleus
        position={[0.15, -0.2, 0.32]}
        scale={[0.55, 0.5, 0.36]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
      <CurveTube
        id="junctions"
        color="#9f6cbd"
        points={[
          [-1.18, 0.74, 0.38],
          [-0.6, 0.7, 0.44],
          [0.1, 0.73, 0.4],
          [0.96, 0.68, 0.42],
        ]}
        radius={0.04}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
      />
      <Dots
        id="nucleus"
        color="#d082a2"
        count={18}
        spread={[0.96, 0.72, 0.38]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
    </group>
  );
}

function BacteriaModel({ activeOrganelle, viewMode, crossSection }: CommonModelProps) {
  return (
    <group rotation={[0.02, 0.1, -0.02]} scale={[1.12, 1.12, 1.12]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <capsuleGeometry args={[0.78, 2.9, 14, 48]} />
        <CellMaterial
          id="cellWall"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#65b8ae"
          opacity={crossSection ? 0.36 : 0.62}
        />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.88, 0.88, 0.82]}>
        <capsuleGeometry args={[0.62, 2.6, 12, 40]} />
        <CellMaterial
          id="cellWall"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#235a74"
          opacity={0.44}
        />
      </mesh>
      <CurveTube
        id="nucleoid"
        color="#7a43ad"
        points={[
          [-0.9, 0.12, 0.3],
          [-0.42, -0.14, 0.38],
          [0.1, 0.18, 0.34],
          [0.62, -0.12, 0.36],
          [1.02, 0.06, 0.32],
        ]}
        radius={0.12}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
      />
      <CurveTube
        id="flagellum"
        color="#b87438"
        points={[
          [1.82, -0.22, 0.08],
          [2.35, -0.72, 0],
          [2.95, -0.5, 0.02],
          [3.55, -0.95, 0],
        ]}
        radius={0.055}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
      />
      <Dots
        id="nucleoid"
        color="#e59b3a"
        count={34}
        spread={[1.42, 0.48, 0.36]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
    </group>
  );
}

function AnimalModel({ activeOrganelle, viewMode, crossSection }: CommonModelProps) {
  return (
    <group rotation={[0.06, -0.34, 0]} scale={[1.08, 1.08, 1.08]}>
      <mesh scale={[1.7, 1.25, 0.72]} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <CellMaterial
          id="membrane"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#9db6dc"
          opacity={crossSection ? 0.28 : 0.48}
        />
      </mesh>
      <Nucleus
        position={[0.22, 0.18, 0.36]}
        scale={[0.55, 0.55, 0.42]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
      <Mitochondrion
        position={[-0.82, 0.44, 0.32]}
        rotation={[0.4, 0.1, 1.12]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
      <Mitochondrion
        position={[0.82, -0.42, 0.25]}
        rotation={[0.1, 0.35, -0.75]}
        scale={[0.9, 0.9, 0.9]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[-0.24 + index * 0.18, -0.56 + index * 0.08, 0.46]} rotation={[0.2, 0, 0.7]}>
          <torusGeometry args={[0.38 + index * 0.035, 0.025, 10, 52]} />
          <CellMaterial
            id="golgi"
            activeOrganelle={activeOrganelle}
            viewMode={viewMode}
            color="#d49057"
          />
        </mesh>
      ))}
      <Dots
        id="nucleus"
        color="#b35fc8"
        count={28}
        spread={[1.25, 0.85, 0.46]}
        activeOrganelle={activeOrganelle}
        viewMode={viewMode}
        crossSection={crossSection}
      />
    </group>
  );
}

function MuscleModel({ activeOrganelle, viewMode, crossSection }: CommonModelProps) {
  return (
    <group rotation={[0.15, -0.26, -0.03]} scale={[1.08, 1.08, 1.08]}>
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.95, 1, 0.82]} castShadow receiveShadow>
        <capsuleGeometry args={[0.76, 2.9, 14, 48]} />
        <CellMaterial
          id="sarcolemma"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          color="#d7b284"
          opacity={crossSection ? 0.26 : 0.42}
        />
      </mesh>
      {[-0.42, 0, 0.42].map((y, row) =>
        [-0.58, 0.24, 1.06].map((x, index) => (
          <mesh key={`${row}-${index}`} position={[x, y, 0.15]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.86, 24]} />
            <CellMaterial
              id="myofibril"
              activeOrganelle={activeOrganelle}
              viewMode={viewMode}
              color={index % 2 === 0 ? "#bd3d51" : "#cf6272"}
            />
          </mesh>
        )),
      )}
      {[-1.1, 1.42].map((x, index) => (
        <Nucleus
          key={index}
          id="mitochondria"
          position={[x, 0.54 - index * 0.92, 0.36]}
          scale={[0.26, 0.2, 0.18]}
          color="#cf7042"
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          crossSection={crossSection}
        />
      ))}
      {[0, 1, 2, 3, 4].map((index) => (
        <CurveTube
          key={index}
          id="sarcolemma"
          color="#ead2a7"
          points={[
            [-1.55 + index * 0.65, -0.86, 0.26],
            [-1.45 + index * 0.65, -0.24, 0.34],
            [-1.55 + index * 0.65, 0.72, 0.28],
          ]}
          radius={0.035}
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
        />
      ))}
    </group>
  );
}

function CellModel({
  cell,
  activeOrganelle,
  viewMode,
  crossSection,
  autoRotate,
  modelRootRef,
}: Omit<CellSceneProps, "resetKey"> & {
  modelRootRef: RefObject<Group | null>;
}) {
  useFrame((_, delta) => {
    if (modelRootRef.current && autoRotate) {
      modelRootRef.current.rotation.y += delta * 0.1;
    }
  });

  const common = { activeOrganelle, viewMode, crossSection };

  return (
    <group ref={modelRootRef} position={[0, 0, 0]}>
      {cell.modelAsset ? (
        <AssetCellModel cell={cell} asset={cell.modelAsset} {...common} />
      ) : (
        <>
          {cell.modelKind === "plant" && <PlantModel {...common} />}
          {cell.modelKind === "whiteBlood" && <WhiteBloodModel {...common} />}
          {cell.modelKind === "neuron" && <NeuronModel {...common} />}
          {cell.modelKind === "epithelial" && <EpithelialModel {...common} />}
          {cell.modelKind === "bacteria" && <BacteriaModel {...common} />}
          {cell.modelKind === "animal" && <AnimalModel {...common} />}
          {cell.modelKind === "muscle" && <MuscleModel {...common} />}
        </>
      )}
    </group>
  );
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Screenshot export did not return image data."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

function SceneExportBridge({
  apiRef,
  modelRootRef,
}: {
  apiRef: ForwardedRef<CellSceneHandle>;
  modelRootRef: RefObject<Group | null>;
}) {
  const { gl, scene, camera } = useThree();

  useImperativeHandle(
    apiRef,
    () => ({
      async captureScreenshot() {
        return canvasToPngBlob(gl.domElement);
      },
      async exportGLB() {
        const model = modelRootRef.current;
        if (!model) {
          throw new Error("The 3D model is still loading.");
        }

        const exporter = new GLTFExporter();
        const result = await exporter.parseAsync(model.clone(true), {
          binary: true,
          embedImages: true,
          onlyVisible: true,
          trs: true,
        });

        if (!(result instanceof ArrayBuffer)) {
          throw new Error("GLB export returned JSON instead of binary data.");
        }

        return new Blob([result], { type: "model/gltf-binary" });
      },
    }),
    [camera, gl, modelRootRef, scene],
  );

  return null;
}

function TrueAssetPostProcessing({ cell }: { cell: CellItem }) {
  const { gl, scene, camera, size, viewport } = useThree();
  const sharpenStrength = cell.id === "plant" ? 0.145 : 0.105;
  const ssaoRadius = cell.id === "plant" ? 0.052 : 0.042;

  const { composer, ssaoPass, sharpenPass } = useMemo(() => {
    const composerInstance = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const ssao = new SSAOPass(scene, camera, size.width, size.height, 32);
    ssao.output = SSAOPass.OUTPUT.Default;
    ssao.kernelRadius = ssaoRadius;
    ssao.minDistance = 0.003;
    ssao.maxDistance = cell.id === "plant" ? 0.18 : 0.13;

    const sharpen = new ShaderPass(sharpenShader);
    sharpen.uniforms.strength.value = sharpenStrength;
    sharpen.uniforms.contrast.value = cell.id === "plant" ? 1.04 : 1.025;

    composerInstance.addPass(renderPass);
    composerInstance.addPass(ssao);
    composerInstance.addPass(sharpen);
    composerInstance.addPass(new OutputPass());

    return {
      composer: composerInstance,
      ssaoPass: ssao,
      sharpenPass: sharpen,
    };
  }, [camera, cell.id, gl, scene, sharpenStrength, size.height, size.width, ssaoRadius]);

  useEffect(() => {
    composer.setPixelRatio(viewport.dpr);
    composer.setSize(size.width, size.height);
    ssaoPass.setSize(size.width, size.height);
    sharpenPass.uniforms.resolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
  }, [composer, sharpenPass, size.height, size.width, ssaoPass, viewport.dpr]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame((_, delta) => {
    composer.render(delta);
  }, 1);

  return null;
}

function ModelLoadingOverlay({ cell }: { cell: CellItem }) {
  const { progress } = useProgress();
  const displayProgress = Math.max(8, Math.min(100, Math.round(progress)));

  return (
    <Html center className="model-loader">
      <div>
        <span>Loading 3D specimen</span>
        <strong>{cell.name}</strong>
        <i>
          <b style={{ width: `${displayProgress}%` }} />
        </i>
        <em>{displayProgress}%</em>
      </div>
    </Html>
  );
}

export const CellScene = forwardRef<CellSceneHandle, CellSceneProps>(function CellScene({
  cell,
  activeOrganelle,
  viewMode,
  crossSection,
  autoRotate,
  resetKey,
}: CellSceneProps, ref) {
  const nativeMaterial = cell.modelAsset?.materialMode === "native";
  const trueAssetDisplay = cell.id === "plant" || cell.id === "whiteBlood";
  const modelRootRef = useRef<Group | null>(null);

  return (
    <Canvas
      key={resetKey}
      className={`cell-canvas${nativeMaterial ? " is-native-asset" : ""}`}
      dpr={[1, 2]}
      shadows
      gl={{ antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = SRGBColorSpace;
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = cell.id === "whiteBlood" ? 1.08 : cell.id === "plant" ? 1.02 : nativeMaterial ? 1.04 : 1.0;
        gl.shadowMap.type = PCFSoftShadowMap;
      }}
      camera={{
        position: [0, trueAssetDisplay ? 0.1 : 0.2, trueAssetDisplay ? 6.1 : 5.8],
        fov: trueAssetDisplay ? 33 : 38,
      }}
    >
      <SceneExportBridge apiRef={ref} modelRootRef={modelRootRef} />
      {trueAssetDisplay && <TrueAssetPostProcessing cell={cell} />}
      {!nativeMaterial && <color attach="background" args={["#fbf7ee"]} />}
      {!nativeMaterial && <fog attach="fog" args={["#fbf7ee", 7.6, 12.8]} />}
      <Environment frames={1} resolution={256}>
        <Lightformer
          form="rect"
          intensity={cell.id === "whiteBlood" ? 3.7 : cell.id === "plant" ? 3.15 : nativeMaterial ? 3.3 : 3}
          position={[0, 3.9, 4.8]}
          rotation={[-0.22, 0, 0]}
          scale={[5.4, 2.1, 1]}
        />
        <Lightformer
          form="rect"
          intensity={cell.id === "whiteBlood" ? 1.9 : cell.id === "plant" ? 1.5 : nativeMaterial ? 1.6 : 1.42}
          position={[-4.2, 1.4, 2.6]}
          rotation={[0, 0.38, 0]}
          scale={[2.8, 3.6, 1]}
          color={cell.accentSoft}
        />
        <Lightformer
          form="ring"
          intensity={0.92}
          position={[3.8, -1.2, -2.8]}
          scale={2.3}
          color={cell.accent}
        />
      </Environment>
      <ambientLight intensity={cell.id === "whiteBlood" ? 1.04 : cell.id === "plant" ? 0.9 : nativeMaterial ? 0.96 : 0.82} />
      <hemisphereLight
        args={[
          nativeMaterial ? "#fff7ed" : "#fff3df",
          nativeMaterial ? "#ddcfbd" : "#d8d1c6",
          cell.id === "whiteBlood" ? 1.02 : cell.id === "plant" ? 0.86 : nativeMaterial ? 0.92 : 0.82,
        ]}
      />
      <directionalLight
        position={[4.2, 5.2, 5.8]}
        intensity={cell.id === "whiteBlood" ? 2.38 : cell.id === "plant" ? 2.06 : nativeMaterial ? 2.24 : 2.16}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00025}
      />
      {nativeMaterial && (
        <directionalLight
          position={[-4.4, 2.2, 3.6]}
          intensity={0.7}
          color="#fff1df"
        />
      )}
      {cell.id === "plant" && (
        <>
          <spotLight
            position={[-2.8, 2.4, 3.2]}
            angle={0.38}
            penumbra={0.82}
            intensity={0.46}
            color="#ffe4b8"
          />
          <pointLight position={[2.6, 0.3, -2.1]} intensity={0.34} color="#b6d889" />
        </>
      )}
      {cell.id === "whiteBlood" && (
        <>
          <spotLight
            position={[0.6, 3.8, 4.2]}
            angle={0.56}
            penumbra={0.9}
            intensity={0.58}
            color="#fff7ff"
          />
          <pointLight position={[-2.8, 0.9, 2.8]} intensity={0.38} color="#dac4ff" />
          <pointLight position={[2.6, -0.8, -2.4]} intensity={0.24} color="#ffd6e4" />
        </>
      )}
      <spotLight
        position={[-3.6, 3.2, 4.6]}
        angle={0.42}
        penumbra={0.74}
        intensity={nativeMaterial ? 0.58 : 0.84}
        color={nativeMaterial ? "#fff8ec" : cell.accentSoft}
      />
      <pointLight
        position={[2.8, -1.2, 3.2]}
        intensity={nativeMaterial ? 0.34 : 0.42}
        color={nativeMaterial ? "#ffffff" : cell.accent}
      />
      <Suspense fallback={<ModelLoadingOverlay cell={cell} />}>
        <Float speed={1.25} rotationIntensity={0.08} floatIntensity={0.18}>
          <CellModel
            cell={cell}
            activeOrganelle={activeOrganelle}
            viewMode={viewMode}
            crossSection={crossSection}
            autoRotate={autoRotate}
            modelRootRef={modelRootRef}
          />
        </Float>
        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={cell.id === "whiteBlood" ? 0.28 : cell.id === "plant" ? 0.3 : nativeMaterial ? 0.24 : 0.32}
          scale={trueAssetDisplay ? 8.4 : nativeMaterial ? 7.8 : 7.2}
          blur={cell.id === "plant" ? 2.25 : nativeMaterial ? 2.6 : 2.1}
          far={4.2}
        />
      </Suspense>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan
        minDistance={3.2}
        maxDistance={8.4}
      />
    </Canvas>
  );
});
