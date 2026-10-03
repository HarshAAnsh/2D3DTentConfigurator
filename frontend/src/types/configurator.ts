export type TentSize = "5x5" | "8x8";

export type Section = "front" | "back" | "left" | "right" | "roof";

export type ElementType = "text" | "image";

/* -------------------------------------------------------------------------- */
/* DESIGN ELEMENT                                                             */
/* -------------------------------------------------------------------------- */

export interface DesignElement {
  id: string;

  type: ElementType;

  text: string;

  image: string;

  x: number;

  y: number;

  scale: number;

  rotation: number;

  color: string;

  /*
   * Image dimensions.
   *
   * These are required because the
   * canvas editor uses them directly.
   */
  width: number;

  height: number;

  /*
   * Text configuration.
   */
  fontSize: number;

  fontFamily: string;

  /*
   * 0 = invisible
   * 1 = fully visible
   */
  opacity: number;
}

/* -------------------------------------------------------------------------- */
/* SECTION DESIGN                                                             */
/* -------------------------------------------------------------------------- */

export interface SectionDesign {
  /*
   * Background color for this panel.
   */
  color: string;

  /*
   * Text and image elements.
   */
  elements: DesignElement[];
}

/* -------------------------------------------------------------------------- */
/* PRODUCT CONFIGURATION                                                      */
/* -------------------------------------------------------------------------- */

export interface ProductConfiguration {
  /*
   * Configuration identifier.
   */
  id: string;

  /*
   * Only these two sizes are supported.
   */
  size: TentSize;

  /*
   * Global canopy color.
   */
  canopyColor: string;

  /*
   * Metal/frame color.
   */
  frameColor: string;

  /*
   * Individual panel configurations.
   */
  sections: Record<Section, SectionDesign>;
}

/* -------------------------------------------------------------------------- */
/* PRICING RESPONSE                                                           */
/* -------------------------------------------------------------------------- */

export interface PriceResponse {
  basePrice: number;

  variantPrice: number;

  customizationPrice: number;

  total: number;

  currency: string;
}
