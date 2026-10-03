import { create } from "zustand";

import type {
  DesignElement,
  ProductConfiguration,
  Section,
  TentSize,
} from "../types/configurator";

/* -------------------------------------------------------------------------- */
/* CREATE EMPTY SECTIONS                                                      */
/* -------------------------------------------------------------------------- */

const createEmptySections = (
  color: string,
): ProductConfiguration["sections"] => ({
  front: {
    color,

    elements: [],
  },

  back: {
    color,

    elements: [],
  },

  left: {
    color,

    elements: [],
  },

  right: {
    color,

    elements: [],
  },

  roof: {
    color,

    elements: [],
  },
});

/* -------------------------------------------------------------------------- */
/* CREATE INITIAL CONFIGURATION                                               */
/* -------------------------------------------------------------------------- */

const createInitialConfig = (): ProductConfiguration => {
  const canopyColor = "#ffffff";

  return {
    id: `CFG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

    size: "8x8",

    canopyColor,

    frameColor: "#d4d4d4",

    sections: createEmptySections(canopyColor),
  };
};

/* -------------------------------------------------------------------------- */
/* STATE                                                                      */
/* -------------------------------------------------------------------------- */

interface State {
  config: ProductConfiguration;

  activeSection: Section;

  selectedElementId: string | null;

  setSize: (size: TentSize) => void;

  setCanopyColor: (color: string) => void;

  setFrameColor: (color: string) => void;

  setSection: (section: Section) => void;

  addElement: (element: DesignElement) => void;

  updateElement: (id: string, patch: Partial<DesignElement>) => void;

  removeElement: (id: string) => void;

  selectElement: (id: string | null) => void;

  reset: () => void;
}

/* -------------------------------------------------------------------------- */
/* STORE                                                                      */
/* -------------------------------------------------------------------------- */

export const useConfiguratorStore = create<State>((set) => ({
  config: createInitialConfig(),

  activeSection: "front",

  selectedElementId: null,

  /* -------------------------------------------------------------------- */
  /* SIZE                                                                 */
  /* -------------------------------------------------------------------- */

  setSize: (size) =>
    set((state) => ({
      config: {
        ...state.config,

        size,
      },
    })),

  /* -------------------------------------------------------------------- */
  /* CANOPY COLOR                                                         */
  /* -------------------------------------------------------------------- */

  setCanopyColor: (canopyColor) =>
    set((state) => ({
      config: {
        ...state.config,

        canopyColor,

        /*
         * Keep every panel's
         * background synchronized
         * with the main canopy color.
         */
        sections: {
          front: {
            ...state.config.sections.front,

            color: canopyColor,
          },

          back: {
            ...state.config.sections.back,

            color: canopyColor,
          },

          left: {
            ...state.config.sections.left,

            color: canopyColor,
          },

          right: {
            ...state.config.sections.right,

            color: canopyColor,
          },

          roof: {
            ...state.config.sections.roof,

            color: canopyColor,
          },
        },
      },
    })),

  /* -------------------------------------------------------------------- */
  /* FRAME COLOR                                                          */
  /* -------------------------------------------------------------------- */

  setFrameColor: (frameColor) =>
    set((state) => ({
      config: {
        ...state.config,

        frameColor,
      },
    })),

  /* -------------------------------------------------------------------- */
  /* ACTIVE PANEL                                                         */
  /* -------------------------------------------------------------------- */

  setSection: (activeSection) =>
    set({
      activeSection,

      selectedElementId: null,
    }),

  /* -------------------------------------------------------------------- */
  /* ADD ELEMENT                                                          */
  /* -------------------------------------------------------------------- */

  addElement: (element) =>
    set((state) => ({
      config: {
        ...state.config,

        sections: {
          ...state.config.sections,

          [state.activeSection]: {
            ...state.config.sections[state.activeSection],

            elements: [
              ...state.config.sections[state.activeSection].elements,

              element,
            ],
          },
        },
      },

      selectedElementId: element.id,
    })),

  /* -------------------------------------------------------------------- */
  /* UPDATE ELEMENT                                                       */
  /* -------------------------------------------------------------------- */

  updateElement: (id, patch) =>
    set((state) => ({
      config: {
        ...state.config,

        sections: {
          ...state.config.sections,

          [state.activeSection]: {
            ...state.config.sections[state.activeSection],

            elements: state.config.sections[state.activeSection].elements.map(
              (element) =>
                element.id === id
                  ? {
                      ...element,

                      ...patch,
                    }
                  : element,
            ),
          },
        },
      },
    })),

  /* -------------------------------------------------------------------- */
  /* REMOVE ELEMENT                                                       */
  /* -------------------------------------------------------------------- */

  removeElement: (id) =>
    set((state) => ({
      config: {
        ...state.config,

        sections: {
          ...state.config.sections,

          [state.activeSection]: {
            ...state.config.sections[state.activeSection],

            elements: state.config.sections[
              state.activeSection
            ].elements.filter((element) => element.id !== id),
          },
        },
      },

      selectedElementId: null,
    })),

  /* -------------------------------------------------------------------- */
  /* SELECT ELEMENT                                                       */
  /* -------------------------------------------------------------------- */

  selectElement: (selectedElementId) =>
    set({
      selectedElementId,
    }),

  /* -------------------------------------------------------------------- */
  /* RESET                                                                */
  /* -------------------------------------------------------------------- */

  reset: () =>
    set({
      config: createInitialConfig(),

      activeSection: "front",

      selectedElementId: null,
    }),
}));
