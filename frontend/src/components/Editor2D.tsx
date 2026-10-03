import {
  useEffect,
  useRef,
} from "react";

import type {
  RefObject,
} from "react";

import {
  useConfiguratorStore,
} from "../store/configuratorStore";

import {
  loadImage,
} from "../services/textureService";

import type {
  DesignElement,
} from "../types/configurator";

/* -------------------------------------------------------------------------- */
/* PROPS                                                                      */
/* -------------------------------------------------------------------------- */

interface Editor2DProps {
  canvasRef: RefObject<
    HTMLCanvasElement | null
  >;

  onRendered?: (
    dataUrl: string,
  ) => void;
}

/* -------------------------------------------------------------------------- */
/* CANVAS                                                                      */
/* -------------------------------------------------------------------------- */

const CANVAS_WIDTH = 1000;

const CANVAS_HEIGHT = 650;

/* -------------------------------------------------------------------------- */
/* ELEMENT BOUNDS                                                             */
/* -------------------------------------------------------------------------- */

function getElementBounds(
  element: DesignElement,
) {
  if (
    element.type ===
    "image"
  ) {
    return {
      width:
        element.width *
        element.scale,

      height:
        element.height *
        element.scale,
    };
  }

  const text =
    element.text || "";

  const width =
    Math.max(
      80,
      text.length *
        element.fontSize *
        0.6,
    );

  return {
    width:
      width *
      element.scale,

    height:
      element.fontSize *
      1.5 *
      element.scale,
  };
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function Editor2D({
  canvasRef,
  onRendered,
}: Editor2DProps) {
  const section =
    useConfiguratorStore(
      (state) =>
        state.activeSection,
    );

  const config =
    useConfiguratorStore(
      (state) =>
        state.config,
    );

  const selected =
    useConfiguratorStore(
      (state) =>
        state.selectedElementId,
    );

  const select =
    useConfiguratorStore(
      (state) =>
        state.selectElement,
    );

  const update =
    useConfiguratorStore(
      (state) =>
        state.updateElement,
    );

  const elements =
    config.sections[
      section
    ].elements;

  const draggingRef =
    useRef<{
      id: string;

      startX: number;

      startY: number;

      elementX: number;

      elementY: number;
    } | null>(null);

  /* ---------------------------------------------------------------------- */
  /* RENDER CANVAS                                                          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.width =
      CANVAS_WIDTH;

    canvas.height =
      CANVAS_HEIGHT;

    let cancelled =
      false;

    const render =
      async () => {
        const ctx =
          canvas.getContext(
            "2d",
          );

        if (!ctx) {
          return;
        }

        /* -------------------------------------------------------------- */
        /* LOAD IMAGES                                                     */
        /* -------------------------------------------------------------- */

        const imageMap =
          new Map<
            string,
            HTMLImageElement
          >();

        const imageElements =
          elements.filter(
            (element) =>
              element.type ===
                "image" &&
              Boolean(
                element.image,
              ),
          );

        await Promise.all(
          imageElements.map(
            async (
              element,
            ) => {
              try {
                if (
                  !element.image
                ) {
                  return;
                }

                const image =
                  await loadImage(
                    element.image,
                  );

                imageMap.set(
                  element.id,
                  image,
                );
              } catch {
                // Ignore broken images.
              }
            },
          ),
        );

        if (cancelled) {
          return;
        }

        /* -------------------------------------------------------------- */
        /* CLEAR                                                          */
        /* -------------------------------------------------------------- */

        ctx.clearRect(
          0,
          0,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
        );

        /* -------------------------------------------------------------- */
        /* BACKGROUND                                                     */
        /* -------------------------------------------------------------- */

        ctx.fillStyle =
          config.sections[
            section
          ].color;

        ctx.fillRect(
          0,
          0,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
        );

        /* -------------------------------------------------------------- */
        /* BORDER                                                         */
        /* -------------------------------------------------------------- */

        ctx.strokeStyle =
          "#94a3b8";

        ctx.lineWidth = 4;

        ctx.strokeRect(
          2,
          2,
          CANVAS_WIDTH - 4,
          CANVAS_HEIGHT - 4,
        );

        /* -------------------------------------------------------------- */
        /* HEADER                                                         */
        /* -------------------------------------------------------------- */

        ctx.fillStyle =
          "rgba(15,23,42,0.65)";

        ctx.font =
          "600 15px Arial";

        ctx.textAlign =
          "center";

        ctx.fillText(
          `${section.toUpperCase()} PANEL`,
          CANVAS_WIDTH / 2,
          28,
        );

        /* -------------------------------------------------------------- */
        /* ELEMENTS                                                       */
        /* -------------------------------------------------------------- */

        for (const element of
          elements) {
          ctx.save();

          const x =
            (element.x / 100) *
            CANVAS_WIDTH;

          const y =
            (element.y / 100) *
            CANVAS_HEIGHT;

          ctx.translate(
            x,
            y,
          );

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

          /* ---------------------------------------------------------- */
          /* TEXT                                                        */
          /* ---------------------------------------------------------- */

          if (
            element.type ===
            "text"
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
              element.text,
              0,
              0,
            );
          }

          /* ---------------------------------------------------------- */
          /* IMAGE                                                       */
          /* ---------------------------------------------------------- */

          if (
            element.type ===
              "image" &&
            element.image
          ) {
            const image =
              imageMap.get(
                element.id,
              );

            if (image) {
              ctx.drawImage(
                image,

                -element.width /
                  2,

                -element.height /
                  2,

                element.width,

                element.height,
              );
            }
          }

          /* ---------------------------------------------------------- */
          /* SELECTION OUTLINE                                           */
          /* ---------------------------------------------------------- */

          if (
            element.id ===
            selected
          ) {
            const bounds =
              getElementBounds(
                element,
              );

            ctx.save();

            ctx.globalAlpha =
              1;

            ctx.strokeStyle =
              "#2563eb";

            ctx.lineWidth = 3;

            ctx.setLineDash([
              8,
              5,
            ]);

            ctx.strokeRect(
              -bounds.width /
                2,

              -bounds.height /
                2,

              bounds.width,

              bounds.height,
            );

            ctx.restore();
          }

          ctx.restore();
        }

        /* -------------------------------------------------------------- */
        /* PREVIEW                                                        */
        /* -------------------------------------------------------------- */

        onRendered?.(
          canvas.toDataURL(
            "image/png",
          ),
        );
      };

    void render();

    return () => {
      cancelled = true;
    };
  }, [
    canvasRef,
    config,
    elements,
    onRendered,
    section,
    selected,
  ]);

  /* ---------------------------------------------------------------------- */
  /* POINTER POSITION                                                       */
  /* ---------------------------------------------------------------------- */

  const getPointerPosition = (
    event:
      React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return {
        x: 0,

        y: 0,
      };
    }

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX -
          rect.left) /
          rect.width) *
        CANVAS_WIDTH,

      y:
        ((event.clientY -
          rect.top) /
          rect.height) *
        CANVAS_HEIGHT,
    };
  };

  /* ---------------------------------------------------------------------- */
  /* POINTER DOWN                                                           */
  /* ---------------------------------------------------------------------- */

  const handlePointerDown = (
    event:
      React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const {
      x,
      y,
    } =
      getPointerPosition(
        event,
      );

    let hit:
      DesignElement | null =
      null;

    for (
      let index =
        elements.length - 1;
      index >= 0;
      index--
    ) {
      const element =
        elements[index];

      const elementX =
        (element.x / 100) *
        CANVAS_WIDTH;

      const elementY =
        (element.y / 100) *
        CANVAS_HEIGHT;

      const bounds =
        getElementBounds(
          element,
        );

      const hitWidth =
        bounds.width / 2;

      const hitHeight =
        bounds.height / 2;

      if (
        Math.abs(
          x - elementX,
        ) <= hitWidth &&
        Math.abs(
          y - elementY,
        ) <= hitHeight
      ) {
        hit = element;

        break;
      }
    }

    select(
      hit?.id ?? null,
    );

    if (!hit) {
      return;
    }

    canvas.setPointerCapture(
      event.pointerId,
    );

    draggingRef.current = {
      id: hit.id,

      startX: x,

      startY: y,

      elementX: hit.x,

      elementY: hit.y,
    };
  };

  /* ---------------------------------------------------------------------- */
  /* POINTER MOVE                                                           */
  /* ---------------------------------------------------------------------- */

  const handlePointerMove = (
    event:
      React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const dragging =
      draggingRef.current;

    if (!dragging) {
      return;
    }

    const {
      x,
      y,
    } =
      getPointerPosition(
        event,
      );

    const deltaX =
      ((x -
        dragging.startX) /
        CANVAS_WIDTH) *
      100;

    const deltaY =
      ((y -
        dragging.startY) /
        CANVAS_HEIGHT) *
      100;

    update(
      dragging.id,
      {
        x: Math.max(
          0,
          Math.min(
            100,
            dragging.elementX +
              deltaX,
          ),
        ),

        y: Math.max(
          0,
          Math.min(
            100,
            dragging.elementY +
              deltaY,
          ),
        ),
      },
    );
  };

  /* ---------------------------------------------------------------------- */
  /* STOP DRAGGING                                                          */
  /* ---------------------------------------------------------------------- */

  const stopDragging = (
    event:
      React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (
      draggingRef.current
    ) {
      try {
        canvasRef.current?.releasePointerCapture(
          event.pointerId,
        );
      } catch {
        // Pointer capture may already be released.
      }
    }

    draggingRef.current =
      null;
  };

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <canvas
      ref={canvasRef}
      className="editor-canvas"
      onPointerDown={
        handlePointerDown
      }
      onPointerMove={
        handlePointerMove
      }
      onPointerUp={
        stopDragging
      }
      onPointerCancel={
        stopDragging
      }
      aria-label={`${section} panel editor`}
    />
  );
}