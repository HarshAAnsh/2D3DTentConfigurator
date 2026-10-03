import { Canvas, useThree } from "@react-three/fiber";

import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";

import { Suspense, useEffect, useMemo, useRef } from "react";

import type { RefObject } from "react";

import * as THREE from "three";

import { OrbitControls as ThreeOrbitControls } from "three-stdlib";

import { useConfiguratorStore } from "../store/configuratorStore";

import { loadImage } from "../services/textureService";

import type { Section, TentSize, DesignElement } from "../types/configurator";

/* ==========================================================================
   MODEL PATHS
   ========================================================================== */

const models: Record<TentSize, string> = {
  "5x5": "/models/glb/Tent_5_5.glb",
  "8x8": "/models/glb/Tent_8_8.glb",
};

/* ==========================================================================
   SECTIONS
   ========================================================================== */

const SECTION_ORDER: Section[] = ["front", "back", "left", "right", "roof"];

/* ==========================================================================
   CANVAS SIZE
   ========================================================================== */

const TEXTURE_WIDTH = 1000;
const TEXTURE_HEIGHT = 650;

/* ==========================================================================
   MATERIAL HELPERS
   ========================================================================== */

function getMeshMaterials(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function hasMaterial(mesh: THREE.Mesh, materialName: string): boolean {
  return getMeshMaterials(mesh).some(
    (material) => material.name === materialName,
  );
}

/* ==========================================================================
   TRIANGLE CLASSIFICATION
   ========================================================================== */

function classifyTriangle(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  eaveY: number,
): Section {
  const center = new THREE.Vector3()
    .add(a)
    .add(b)
    .add(c)
    .multiplyScalar(1 / 3);

  /*
   * Everything above the wall/eave height
   * belongs to the roof.
   */
  if (center.y > eaveY + 0.01) {
    return "roof";
  }

  /*
   * Remaining geometry is the vertical fabric.
   *
   * Determine which side of the tent the
   * triangle belongs to using its center.
   */
  if (
    Math.abs(center.z) >=
    Math.abs(center.x)
  ) {
    return center.z >= 0
      ? "front"
      : "back";
  }

  return center.x >= 0
    ? "right"
    : "left";
}

/* ==========================================================================
   CREATE SECTION GEOMETRY
   ========================================================================== */

function createSectionGeometry(
  source: THREE.Mesh<
    THREE.BufferGeometry,
    THREE.Material | THREE.Material[]
  >,
): Record<Section, THREE.BufferGeometry> {
  const sourceGeometry =
    source.geometry.index
      ? source.geometry.toNonIndexed()
      : source.geometry.clone();

  const position =
    sourceGeometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;

  if (!position) {
    throw new Error(
      `Fabric mesh "${source.name}" has no position attribute.`,
    );
  }

  /* ========================================================================
     SECTION DATA
     ======================================================================== */

  const sectionData: Record<
    Section,
    {
      positions: number[];
      normals: number[];
      vertices: THREE.Vector3[];
    }
  > = {
    front: {
      positions: [],
      normals: [],
      vertices: [],
    },

    back: {
      positions: [],
      normals: [],
      vertices: [],
    },

    left: {
      positions: [],
      normals: [],
      vertices: [],
    },

    right: {
      positions: [],
      normals: [],
      vertices: [],
    },

    roof: {
      positions: [],
      normals: [],
      vertices: [],
    },
  };

  /* ========================================================================
     TEMPORARY VECTORS
     ======================================================================== */

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();

  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();

  const normal = new THREE.Vector3();

  const center = new THREE.Vector3();

  /* ========================================================================
     FIRST PASS
     
     We first inspect all triangles and determine the actual wall/eave
     height of the tent.
     ======================================================================== */

  /* ========================================================================
   DETECT REAL EAVE HEIGHT

   The tent walls are close to the outer X/Z perimeter.
   The roof slopes inward toward the center.

   Therefore we find the highest triangle whose center is still
   close to the outer perimeter.

   This gives us the real wall/roof boundary.
   ======================================================================== */

const triangleCenters: THREE.Vector3[] = [];

const triangleRadii: number[] = [];

for (
  let i = 0;
  i < position.count;
  i += 3
) {
  a.fromBufferAttribute(
    position,
    i,
  );

  b.fromBufferAttribute(
    position,
    i + 1,
  );

  c.fromBufferAttribute(
    position,
    i + 2,
  );

  center
    .copy(a)
    .add(b)
    .add(c)
    .multiplyScalar(
      1 / 3,
    );

  const radius =
    Math.sqrt(
      center.x * center.x +
      center.z * center.z,
    );

  triangleCenters.push(
    center.clone(),
  );

  triangleRadii.push(
    radius,
  );
}

/*
 * Find the largest radius of the fabric.
 */
const maxRadius =
  Math.max(
    ...triangleRadii,
  );

/*
 * Only consider triangles close to the outer perimeter.
 *
 * 90% works well for both the 5x5 and 8x8 GLBs.
 */
const perimeterThreshold =
  maxRadius * 0.90;

const perimeterYValues: number[] = [];

for (
  let i = 0;
  i < triangleCenters.length;
  i++
) {
  if (
    triangleRadii[i] >=
    perimeterThreshold
  ) {
    perimeterYValues.push(
      triangleCenters[i].y,
    );
  }
}

/*
 * The highest point on the outer perimeter
 * is the wall/eave boundary.
 */
let eaveY = 0;
 
if (
  perimeterYValues.length > 0
) {
  eaveY =
    Math.max(
      ...perimeterYValues,
    );
}

/*
 * Small safety margin.
 *
 * This prevents the exact eave edge from being
 * classified as roof.
 */
eaveY += 0.01;

console.log(
  `[3D GEOMETRY] ${source.name} eave detection`,
  {
    maxRadius,
    perimeterThreshold,
    eaveY,
    perimeterSamples:
      perimeterYValues.length,
  },
);


  /* ========================================================================
     SECOND PASS
     
     Actually classify and collect triangles.
     ======================================================================== */

  for (
    let i = 0;
    i < position.count;
    i += 3
  ) {
    a.fromBufferAttribute(
      position,
      i,
    );

    b.fromBufferAttribute(
      position,
      i + 1,
    );

    c.fromBufferAttribute(
      position,
      i + 2,
    );

    ab.subVectors(
      b,
      a,
    );

    ac.subVectors(
      c,
      a,
    );

    normal
      .crossVectors(
        ab,
        ac,
      )
      .normalize();

    const section =
      classifyTriangle(
        a,
        b,
        c,
        eaveY,
      );

    const data =
      sectionData[section];

    /* ----------------------------------------------------------------------
       Positions
       ---------------------------------------------------------------------- */

    data.positions.push(
      a.x,
      a.y,
      a.z,

      b.x,
      b.y,
      b.z,

      c.x,
      c.y,
      c.z,
    );

    /* ----------------------------------------------------------------------
       Normals
       ---------------------------------------------------------------------- */

    for (
      let j = 0;
      j < 3;
      j++
    ) {
      data.normals.push(
        normal.x,
        normal.y,
        normal.z,
      );
    }

    /* ----------------------------------------------------------------------
       Vertices
       ---------------------------------------------------------------------- */

    data.vertices.push(
      a.clone(),
      b.clone(),
      c.clone(),
    );
  }

  /* ========================================================================
     SECTION-SPECIFIC BOUNDS
     ======================================================================== */

  const sectionBounds: Record<
    Section,
    THREE.Box3
  > = {
    front: new THREE.Box3(),
    back: new THREE.Box3(),
    left: new THREE.Box3(),
    right: new THREE.Box3(),
    roof: new THREE.Box3(),
  };

  for (
    const section of SECTION_ORDER
  ) {
    const data =
      sectionData[section];

    for (
      const vertex of data.vertices
    ) {
      sectionBounds[
        section
      ].expandByPoint(
        vertex,
      );
    }
  }

  console.log(
    `[3D UV] ${source.name} section bounds`,
    {
      front: sectionBounds.front,
      back: sectionBounds.back,
      left: sectionBounds.left,
      right: sectionBounds.right,
      roof: sectionBounds.roof,
    },
  );

  /* ========================================================================
     UV GENERATION
     ======================================================================== */

  const getUV = (
    vertex: THREE.Vector3,
    section: Section,
  ): [number, number] => {
    const bounds =
      sectionBounds[section];

    const size =
      new THREE.Vector3();

    bounds.getSize(size);

    const rangeX =
      Math.max(
        size.x,
        0.0001,
      );

    const rangeY =
      Math.max(
        size.y,
        0.0001,
      );

    const rangeZ =
      Math.max(
        size.z,
        0.0001,
      );

    let u = 0.5;
    let v = 0.5;

    switch (section) {
      /* ================================================================
         FRONT
         ================================================================ */

      case "front":
        u =
          (vertex.x -
            bounds.min.x) /
          rangeX;

        v =
          (vertex.y -
            bounds.min.y) /
          rangeY;

        break;

      /* ================================================================
         BACK
         ================================================================ */

      case "back":
        u =
          (bounds.max.x -
            vertex.x) /
          rangeX;

        v =
          (vertex.y -
            bounds.min.y) /
          rangeY;

        break;

      /* ================================================================
         LEFT
         ================================================================ */

      case "left":
        u =
          (bounds.max.z -
            vertex.z) /
          rangeZ;

        v =
          (vertex.y -
            bounds.min.y) /
          rangeY;

        break;

      /* ================================================================
         RIGHT
         ================================================================ */

      case "right":
        u =
          (vertex.z -
            bounds.min.z) /
          rangeZ;

        v =
          (vertex.y -
            bounds.min.y) /
          rangeY;

        break;

      /* ================================================================
         ROOF
         ================================================================ */

      case "roof": {
  /*
   * The roof is a pyramid/four-sided canopy.
   *
   * Use the X/Z position relative to the tent center.
   * Instead of using the roof bounding box directly,
   * compress the coordinates toward the center.
   */

  const centerX =
    (bounds.min.x +
      bounds.max.x) *
    0.5;

  const centerZ =
    (bounds.min.z +
      bounds.max.z) *
    0.5;

  const halfX =
    Math.max(
      Math.abs(bounds.max.x - centerX),
      0.0001,
    );

  const halfZ =
    Math.max(
      Math.abs(bounds.max.z - centerZ),
      0.0001,
    );

  u =
    0.5 +
    ((vertex.x - centerX) /
      halfX) *
      0.45;

  v =
    0.5 +
    ((vertex.z - centerZ) /
      halfZ) *
      0.45;

  break;
}
    }

    /*
     * U = left -> right
     *
     * V = bottom -> top
     *
     * Because texture.flipY is false,
     * invert V here.
     */

    return [
      0.01 +
        THREE.MathUtils.clamp(
          u,
          0,
          1,
        ) *
          0.98,

      0.99 -
        THREE.MathUtils.clamp(
          v,
          0,
          1,
        ) *
          0.98,
    ];
  };

  /* ========================================================================
     CREATE FINAL GEOMETRIES
     ======================================================================== */

  const result =
    {} as Record<
      Section,
      THREE.BufferGeometry
    >;

  for (
    const section of SECTION_ORDER
  ) {
    const data =
      sectionData[section];

    const geometry =
      new THREE.BufferGeometry();

    /* ----------------------------------------------------------------------
       Position
       ---------------------------------------------------------------------- */

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        data.positions,
        3,
      ),
    );

    /* ----------------------------------------------------------------------
       Normal
       ---------------------------------------------------------------------- */

    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(
        data.normals,
        3,
      ),
    );

    /* ----------------------------------------------------------------------
       UV
       ---------------------------------------------------------------------- */

    const uvs: number[] = [];

    for (
      const vertex of data.vertices
    ) {
      const [
        u,
        v,
      ] = getUV(
        vertex,
        section,
      );

      uvs.push(
        u,
        v,
      );
    }

    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(
        uvs,
        2,
      ),
    );

    geometry.computeBoundingBox();

    geometry.computeBoundingSphere();

    result[section] =
      geometry;
  }

  sourceGeometry.dispose();

  return result;
}
/* ==========================================================================
   CREATE SECTION MESHES
   ========================================================================== */

function createSectionMeshes(
  source: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>,
): Record<Section, THREE.Mesh> {
  const parent = source.parent;

  if (!parent) {
    throw new Error(`Fabric mesh "${source.name}" has no parent.`);
  }

  const geometries = createSectionGeometry(source);

  const meshes = {} as Record<Section, THREE.Mesh>;

  for (const section of SECTION_ORDER) {
    const material = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometries[section], material);

    mesh.name = `${source.name}-${section}-custom`;

    mesh.position.copy(source.position);

    mesh.rotation.copy(source.rotation);

    mesh.scale.copy(source.scale);

    mesh.castShadow = source.castShadow;

    mesh.receiveShadow = source.receiveShadow;

    mesh.userData.isGeneratedSection = true;

    mesh.userData.section = section;

    parent.add(mesh);

    meshes[section] = mesh;
  }

  /*
   * Hide original fabric.
   */
  source.visible = false;

  return meshes;
}

/* ==========================================================================
   RENDER SECTION TO CANVAS
   ========================================================================== */

/**
 * This is the important change.
 *
 * We render the SAME configuration elements that the 2D editor uses.
 *
 * Therefore:
 *
 *     uploaded logo
 *          ↓
 *     Zustand config
 *          ↓
 *     this function
 *          ↓
 *     CanvasTexture
 *          ↓
 *     Three.js tent
 */
async function create3DSectionTexture(sectionConfig: {
  color: string;
  elements: DesignElement[];
}): Promise<THREE.CanvasTexture> {
  const canvas = document.createElement("canvas");

  canvas.width = TEXTURE_WIDTH;

  canvas.height = TEXTURE_HEIGHT;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create 2D canvas context.");
  }

  /* ---------------------------------------------------------------------- */
  /* Background                                                             */
  /* ---------------------------------------------------------------------- */

  ctx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  ctx.fillStyle = sectionConfig.color || "#ffffff";

  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  /* ---------------------------------------------------------------------- */
  /* Preload images                                                         */
  /* ---------------------------------------------------------------------- */

  const imageMap = new Map<string, HTMLImageElement>();

  const imageElements = sectionConfig.elements.filter(
    (element) => element.type === "image" && Boolean(element.image),
  );

  await Promise.all(
    imageElements.map(async (element) => {
      if (!element.image) {
        return;
      }

      try {
        const image = await loadImage(element.image);
        console.log("[3D LOGO] loaded", {
          id: element.id,
          width: image.naturalWidth,
          height: image.naturalHeight,
          srcLength: element.image.length,
        });

        imageMap.set(element.id, image);
      } catch (error) {
        console.error("Unable to load 3D logo:", error);
      }
    }),
  );

  /* ---------------------------------------------------------------------- */
  /* Draw elements                                                          */
  /* ---------------------------------------------------------------------- */

  for (const element of sectionConfig.elements) {
    ctx.save();

    const x = (element.x / 100) * TEXTURE_WIDTH;

    const y = (element.y / 100) * TEXTURE_HEIGHT;

    ctx.translate(x, y);

    ctx.rotate((element.rotation * Math.PI) / 180);

    ctx.scale(element.scale, element.scale);

    ctx.globalAlpha = Math.max(0, Math.min(1, element.opacity ?? 1));

    /* ------------------------------------------------------------------ */
    /* TEXT                                                                */
    /* ------------------------------------------------------------------ */

    if (element.type === "text") {
      ctx.fillStyle = element.color || "#111111";

      ctx.font = `700 ${element.fontSize}px ${element.fontFamily || "Arial"}`;

      ctx.textAlign = "center";

      ctx.textBaseline = "middle";

      ctx.fillText(element.text || "", 0, 0);
    }

    /* ------------------------------------------------------------------ */
    /* IMAGE / LOGO                                                        */
    /* ------------------------------------------------------------------ */

    if (element.type === "image" && element.image) {
      const image = imageMap.get(element.id);

      if (image) {
        const width = element.width || image.naturalWidth || 140;

        const height = element.height || image.naturalHeight || 140;

        ctx.drawImage(image, -width / 2, -height / 2, width, height);
      }
    }

    ctx.restore();
  }

  /* ---------------------------------------------------------------------- */
  /* Create Three.js texture                                                 */
  /* ---------------------------------------------------------------------- */

  const texture = new THREE.CanvasTexture(canvas);

  /*
   * IMPORTANT:
   *
   * The canvas uses normal browser coordinates:
   *
   *     top = 0
   *
   * Three.js UVs use:
   *
   *     bottom = 0
   *
   * Keep flipY enabled so the canvas appears correctly.
   */
  texture.flipY = false;

  texture.wrapS = THREE.ClampToEdgeWrapping;

  texture.wrapT = THREE.ClampToEdgeWrapping;

  texture.minFilter = THREE.LinearMipmapLinearFilter;

  texture.magFilter = THREE.LinearFilter;

  texture.colorSpace = THREE.SRGBColorSpace;

  texture.anisotropy = 4;

  texture.needsUpdate = true;

  return texture;
}

/* ==========================================================================
   LOADING MODEL
   ========================================================================== */

function LoadingModel() {
  return (
    <Html center>
      <div className="model-loader">Loading 3D model...</div>
    </Html>
  );
}

/* ==========================================================================
   CAMERA FITTER
   ========================================================================== */

function CameraFitter({
  object,
  controlsRef,
}: {
  object: THREE.Object3D;

  controlsRef: RefObject<ThreeOrbitControls | null>;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    object.updateMatrixWorld(true);

    const box = new THREE.Box3();

    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.visible) {
        box.expandByObject(child);
      }
    });

    if (box.isEmpty()) {
      return;
    }

    const center = new THREE.Vector3();

    const modelSize = new THREE.Vector3();

    box.getCenter(center);

    box.getSize(modelSize);

    const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);

    const perspectiveCamera = camera as THREE.PerspectiveCamera;

    const verticalFov = THREE.MathUtils.degToRad(perspectiveCamera.fov);

    let distance = maxDimension / (2 * Math.tan(verticalFov / 2));

    distance *= 1.35;

    const aspect = size.width / Math.max(size.height, 1);

    if (aspect < 1) {
      distance *= 1 / aspect;
    }

    const direction = new THREE.Vector3(1, 0.65, 1).normalize();

    const newPosition = center.clone().add(direction.multiplyScalar(distance));

    perspectiveCamera.position.copy(newPosition);

    perspectiveCamera.near = Math.max(0.01, distance / 100);

    perspectiveCamera.far = Math.max(100, distance * 100);

    perspectiveCamera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);

      controlsRef.current.update();
    }
  }, [object, camera, size.width, size.height, controlsRef]);

  return null;
}

/* ==========================================================================
   SCENE MODEL
   ========================================================================== */

function SceneModel() {
  const size = useConfiguratorStore((state) => state.config.size);

  const frameColor = useConfiguratorStore((state) => state.config.frameColor);

  const sections = useConfiguratorStore((state) => state.config.sections);

  const controlsRef = useRef<ThreeOrbitControls | null>(null);

  const { scene } = useGLTF(models[size]);

  /* ---------------------------------------------------------------------- */
  /* Clone GLB                                                               */
  /* ---------------------------------------------------------------------- */

  const cloned = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (Array.isArray(object.material)) {
          object.material = object.material.map((material) => material.clone());
        } else {
          object.material = object.material.clone();
        }
      }
    });

    return clone;
  }, [scene]);

  /* ---------------------------------------------------------------------- */
  /* Create generated section meshes                                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const fabricMeshes: THREE.Mesh[] = [];

    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }

      if (object.userData.isGeneratedSection) {
        return;
      }

      /*
       * IMPORTANT:
       *
       * Search ALL material slots.
       *
       * This handles:
       *
       * 5x5:
       * fabric_Mat
       * Inner_fabric
       *
       * 8x8:
       * Inner_fabric
       * fabric_Mat
       */
      if (hasMaterial(object, "fabric_Mat")) {
        fabricMeshes.push(object);
      }
    });

    for (const fabricMesh of fabricMeshes) {
      if (fabricMesh.userData.sectionMeshes) {
        continue;
      }

      try {
        const sectionMeshes = createSectionMeshes(fabricMesh);

        fabricMesh.userData.sectionMeshes = sectionMeshes;
      } catch (error) {
        console.error("Unable to create fabric sections:", error);
      }
    }

    cloned.updateMatrixWorld(true);
  }, [cloned]);

  /* ---------------------------------------------------------------------- */
  /* APPLY 3D TEXTURES                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        /* ---------------------------------------------------------- */
        /* Create exact 2D configuration textures                      */
        /* ---------------------------------------------------------- */

        const textures = await Promise.all(
          SECTION_ORDER.map(async (section) =>
            create3DSectionTexture(sections[section]),
          ),
        );

        if (cancelled) {
          textures.forEach((texture) => texture.dispose());

          return;
        }

        /* ---------------------------------------------------------- */
        /* Find generated meshes                                        */
        /* ---------------------------------------------------------- */

        cloned.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) {
            return;
          }

          const sectionMeshes = object.userData.sectionMeshes as
            | Record<Section, THREE.Mesh>
            | undefined;

          if (!sectionMeshes) {
            return;
          }

          SECTION_ORDER.forEach((section, index) => {
            const mesh = sectionMeshes[section];

            if (!mesh) {
              return;
            }

            const material = mesh.material as THREE.MeshStandardMaterial;

            /*
             * Dispose previous texture.
             */

            if (material.map) {
              material.map.dispose();
            }

            /*
             * Apply exact section texture.
             */

            material.map = textures[index];

            material.color.set("#ffffff");

            material.transparent = false;

            material.needsUpdate = true;
          });
        });

        /* ---------------------------------------------------------- */
        /* Frame / inner fabric                                        */
        /* ---------------------------------------------------------- */

        cloned.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) {
            return;
          }

          if (object.userData.isGeneratedSection) {
            return;
          }

          getMeshMaterials(object).forEach((material) => {
            if (!(material instanceof THREE.MeshStandardMaterial)) {
              return;
            }

            if (material.name === "Metal_mat") {
              material.color.set(frameColor);

              material.needsUpdate = true;
            }

            if (material.name === "Inner_fabric") {
              material.color.set("#f8fafc");

              material.needsUpdate = true;
            }
          });
        });
      } catch (error) {
        console.error("Unable to apply 3D configuration:", error);
      }
    }, 100);

    return () => {
      cancelled = true;

      window.clearTimeout(timer);
    };
  }, [cloned, sections, frameColor]);

  /* ---------------------------------------------------------------------- */
  /* Cleanup                                                                 */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      cloned.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
          return;
        }

        if (object.userData.isGeneratedSection) {
          object.geometry.dispose();

          const material = object.material as THREE.MeshStandardMaterial;

          if (material.map) {
            material.map.dispose();
          }

          material.dispose();

          return;
        }

        getMeshMaterials(object).forEach((material) => material.dispose());
      });
    };
  }, [cloned]);

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <primitive object={cloned} />

      <CameraFitter object={cloned} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={0.5}
        maxDistance={50}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

/* ==========================================================================
   MAIN MODEL VIEWER
   ========================================================================== */

export default function ModelViewer() {
  return (
    <div className="viewer">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [4, 3, 5],
          fov: 42,
          near: 0.01,
          far: 1000,
        }}
      >
        <ambientLight intensity={1.5} />

        <directionalLight position={[5, 8, 5]} intensity={2.5} castShadow />

        <directionalLight position={[-5, 4, -3]} intensity={1} />

        <Suspense fallback={<LoadingModel />}>
          <SceneModel />

          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ==========================================================================
   PRELOAD
   ========================================================================== */

Object.values(models).forEach((path) => {
  useGLTF.preload(path);
});
