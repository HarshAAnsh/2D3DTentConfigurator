import { useEffect, useRef, useState } from "react";

import { PDFDownloadLink } from "@react-pdf/renderer";

import { ShoppingCart, FileDown } from "lucide-react";

import ModelViewer from "./components/ModelViewer";
import Editor2D from "./components/Editor2D";
import Controls from "./components/Controls";

import ConfigurationPDF from "./pdf/ConfigurationPDF";

import { useConfiguratorStore } from "./store/configuratorStore";

import { addToShopify, getPrice } from "./services/api";

import type { PriceResponse } from "./types/configurator";

import "./configurator.css";

export default function App() {
  /* ================================================================
     CONFIGURATION
     ================================================================ */

  const config = useConfiguratorStore((state) => state.config);

  /* ================================================================
     2D EDITOR CANVAS REF
     ================================================================ */

  const editor = useRef<HTMLCanvasElement | null>(null);

  /* ================================================================
     PRICING
     ================================================================ */

  const [price, setPrice] = useState<PriceResponse | null>(null);

  /* ================================================================
     CART
     ================================================================ */

  const [cart, setCart] = useState("");

  const [loading, setLoading] = useState(false);

  /* ================================================================
     GET PRICE
     ================================================================ */

  useEffect(() => {
    let active = true;

    getPrice(config)
      .then((result) => {
        if (active) {
          setPrice(result);
        }
      })
      .catch((error) => {
        console.error("[APP] Pricing request failed:", error);

        if (active) {
          setPrice(null);
        }
      });

    return () => {
      active = false;
    };
  }, [config]);

  /* ================================================================
     ADD TO CART
     ================================================================ */

  const addCart = async () => {
    if (!price) {
      return;
    }

    setLoading(true);

    try {
      const result = await addToShopify(config, price);

      setCart(result.cartId);
    } catch (error) {
      console.error("[SHOPIFY] Cart error:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================
     RENDER
     ================================================================ */

  return (
    <div className="app">
      {/* ==========================================================
          HEADER
          ========================================================== */}

      <header className="app-header">
        <div>
          <div className="brand-eyebrow">3D CONFIGURATOR</div>

          <h1>3D Tent Configurator</h1>

          <p className="brand-subtitle">Customize your tent in real time</p>
        </div>

        <div className="header-actions">
          <div className="header-price">
            <small>Starting price</small>

            <strong>${price?.total ?? "—"}</strong>
          </div>

          <button type="button" onClick={addCart} disabled={loading || !price}>
            <ShoppingCart size={17} />

            {loading ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </header>

      {/* ==========================================================
          MAIN LAYOUT
          ========================================================== */}

      <main className="main-layout">
        {/* ========================================================
            LEFT WORKSPACE
            ======================================================== */}

        <section className="workspace">
          {/* ======================================================
              3D PREVIEW
              ====================================================== */}

          <div className="workspace-card">
            <div className="panel-title">
              <div>
                <div className="eyebrow">3D PREVIEW</div>

                <h2>Live Product Preview</h2>
              </div>

              <span className="helper-text">
                Drag to rotate • Scroll to zoom
              </span>
            </div>

            <ModelViewer />
          </div>

          {/* ======================================================
              2D EDITOR
              ====================================================== */}

          <div className="workspace-card">
            <div className="panel-title">
              <div>
                <div className="eyebrow">DESIGN</div>

                <h2>2D Panel Editor</h2>
              </div>

              <span className="helper-text">Add text or upload your logo</span>
            </div>

            <Editor2D canvasRef={editor} />
          </div>
        </section>

        {/* ========================================================
            RIGHT CUSTOMIZATION PANEL
            ======================================================== */}

        <Controls />
      </main>

      {/* ==========================================================
          FOOTER
          ========================================================== */}

      <footer className="app-footer">
        <div>
          <div className="footer-label">CONFIGURATION</div>

          <div className="price-breakdown">
            <span>Base: ${price?.basePrice ?? "—"}</span>

            <span>Variant: ${price?.variantPrice ?? "—"}</span>

            <span>Customization: ${price?.customizationPrice ?? "—"}</span>

            <strong>Total: ${price?.total ?? "—"}</strong>
          </div>
        </div>

        <div className="footer-actions">
          {/* ======================================================
              PDF
              ====================================================== */}

          {price && (
            <PDFDownloadLink
              document={
                <ConfigurationPDF
                  config={config}
                  price={price}
                  preview={editor.current?.toDataURL() || ""}
                />
              }
              fileName="tent-configuration.pdf"
            >
              <button type="button" className="secondary">
                <FileDown size={16} />
                Download PDF
              </button>
            </PDFDownloadLink>
          )}

          {/* ======================================================
              CART SUCCESS
              ====================================================== */}

          {cart && <span className="success">✓ Mock Shopify cart: {cart}</span>}
        </div>
      </footer>
    </div>
  );
}
