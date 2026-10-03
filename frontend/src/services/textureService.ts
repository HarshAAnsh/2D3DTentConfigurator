import * as THREE from "three";

import type {
  DesignElement,
  SectionDesign,
} from "../types/configurator";

const imageCache =
  new Map<
    string,
    Promise<HTMLImageElement>
  >();

export function loadImage(
  source: string,
): Promise<HTMLImageElement> {
  const cached =
    imageCache.get(source);

  if (cached) {
    return cached;
  }

  const promise =
    new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const image =
          new Image();

        image.onload = () =>
          resolve(image);

        image.onerror = () =>
          reject(
            new Error(
              "Unable to load image.",
            ),
          );

        image.src = source;
      },
    );

  imageCache.set(
    source,
    promise,
  );

  return promise;
}

async function drawElement(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
) {
  ctx.save();

  const x =
    (element.x / 100) * 1024;

  const y =
    (element.y / 100) * 1024;

  ctx.translate(x, y);

  ctx.rotate(
    (element.rotation *
      Math.PI) /
      180,
  );

  ctx.scale(
    element.scale,
    element.scale,
  );

  ctx.globalAlpha =
    Math.max(
      0,
      Math.min(
        1,
        element.opacity,
      ),
    );

  if (
    element.type === "text"
  ) {
    ctx.fillStyle =
      element.color;

    ctx.font =
      `700 ${element.fontSize}px ${element.fontFamily}`;

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.fillText(
      element.text || "",
      0,
      0,
    );
  }

  if (
    element.type === "image" &&
    element.image
  ) {
    try {
      const image =
        await loadImage(
          element.image,
        );

      ctx.drawImage(
        image,

        -element.width / 2,

        -element.height / 2,

        element.width,

        element.height,
      );
    } catch (error) {
      console.error(
        "Unable to render uploaded image:",
        error,
      );
    }
  }

  ctx.restore();
}

export async function createSectionTexture(
  section: SectionDesign,
): Promise<THREE.CanvasTexture> {
  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width = 1024;

  canvas.height = 1024;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas 2D context is unavailable.",
    );
  }

  /*
   * Panel background.
   */
  ctx.fillStyle =
    section.color;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  /*
   * Draw all elements.
   */
  for (const element of
    section.elements) {
    await drawElement(
      ctx,
      element,
    );
  }

  /*
   * Border.
   */
  ctx.save();

  ctx.strokeStyle =
    "rgba(0,0,0,0.08)";

  ctx.lineWidth = 8;

  ctx.strokeRect(
    4,
    4,
    1016,
    1016,
  );

  ctx.restore();

  const texture =
    new THREE.CanvasTexture(
      canvas,
    );

  /*
   * GLTF UV coordinates use the
   * normal bottom-left convention.
   */
  texture.flipY = false;

  texture.colorSpace =
    THREE.SRGBColorSpace;

  texture.wrapS =
    THREE.ClampToEdgeWrapping;

  texture.wrapT =
    THREE.ClampToEdgeWrapping;

  texture.minFilter =
    THREE.LinearMipmapLinearFilter;

  texture.magFilter =
    THREE.LinearFilter;

  texture.anisotropy = 4;

  texture.needsUpdate =
    true;

  return texture;
}