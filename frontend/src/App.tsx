import { useRef } from "react";
import ModelViewer from "./components/ModelViewer";
import Controls from "./components/Controls";
import Editor2D from "./components/Editor2D";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <div className="app">
      {/* ------------------------------------------------------------ */}
      {/* Header                                                       */}
      {/* ------------------------------------------------------------ */}

      <header className="app-header">
        <div>
          <p className="brand-eyebrow">Product Configurator</p>

          <h1>3D Tent Configurator</h1>

          <p className="brand-subtitle">Customize your tent in real time</p>
        </div>

        <div className="header-actions">
          <div className="header-price">
            <span>$999</span>

            <small>Starting price</small>
          </div>

          <button type="button">🛒 Add to Cart</button>
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* Main                                                         */}
      {/* ------------------------------------------------------------ */}

      <main className="main-layout">
        {/* ---------------------------------------------------------- */}
        {/* Left side                                                   */}
        {/* ---------------------------------------------------------- */}

        <section className="workspace">
          {/* 3D Viewer */}
          <div className="workspace-card">
            <div className="panel-title">
              <div>
                <p className="eyebrow">3D Preview</p>

                <h2>Live Product Preview</h2>
              </div>

              <span className="helper-text">
                Drag to rotate • Scroll to zoom
              </span>
            </div>

            <ModelViewer />
          </div>

          {/* 2D Editor */}
          <div className="workspace-card">
            <div className="panel-title">
              <div>
                <p className="eyebrow">Design</p>

                <h2>2D Panel Editor</h2>
              </div>

              <span className="helper-text">Add text or upload your logo</span>
            </div>

            <Editor2D canvasRef={canvasRef} />
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Right side                                                  */}
        {/* ---------------------------------------------------------- */}

        <aside className="controls">
          <Controls />
        </aside>
      </main>

      {/* ------------------------------------------------------------ */}
      {/* Footer                                                       */}
      {/* ------------------------------------------------------------ */}

      <footer className="app-footer">
        <div>
          <p className="eyebrow">Configuration</p>

          <div className="price-items">
            <span>
              Base: <strong>$999</strong>
            </span>

            <span>
              Customization: <strong>$0</strong>
            </span>

            <span className="total-price">
              Total: <strong>$999</strong>
            </span>
          </div>
        </div>

        <div className="footer-actions">
          <button type="button" className="secondary">
            Reset
          </button>

          <button type="button">🛒 Add to Cart</button>
        </div>
      </footer>
    </div>
  );
}
