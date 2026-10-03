import { ImagePlus, Plus, Trash2, RotateCcw } from "lucide-react";

import { useRef } from "react";

import { useConfiguratorStore } from "../store/configuratorStore";

import type { Section } from "../types/configurator";

const sections: Section[] = ["front", "back", "left", "right", "roof"];

export default function Controls() {
  const config = useConfiguratorStore((state) => state.config);

  const activeSection = useConfiguratorStore((state) => state.activeSection);

  const selectedElementId = useConfiguratorStore(
    (state) => state.selectedElementId,
  );

  const setSection = useConfiguratorStore((state) => state.setSection);

  const setSize = useConfiguratorStore((state) => state.setSize);

  const setCanopyColor = useConfiguratorStore((state) => state.setCanopyColor);

  const setFrameColor = useConfiguratorStore((state) => state.setFrameColor);

  const add = useConfiguratorStore((state) => state.addElement);

  const update = useConfiguratorStore((state) => state.updateElement);

  const remove = useConfiguratorStore((state) => state.removeElement);

  const reset = useConfiguratorStore((state) => state.reset);

  const file = useRef<HTMLInputElement | null>(null);

  const selected = config.sections[activeSection].elements.find(
    (element) => element.id === selectedElementId,
  );

  /* ---------------------------------------------------------------------- */
  /* ADD TEXT                                                               */
  /* ---------------------------------------------------------------------- */

  const addText = () => {
    add({
      id: crypto.randomUUID(),

      type: "text",

      text: "YOUR LOGO",

      image: "",

      x: 50,

      y: 50,

      scale: 0.7,

      rotation: 0,

      color: "#111111",

      width: 300,

      height: 80,

      fontSize: 58,

      fontFamily: "Arial",

      opacity: 1,
    });
  };

  /* ---------------------------------------------------------------------- */
  /* UPLOAD LOGO                                                            */
  /* ---------------------------------------------------------------------- */

  const upload = (uploadedFile: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      add({
        id: crypto.randomUUID(),

        type: "image",

        text: "",

        image: String(reader.result),

        x: 50,

        y: 50,

        scale: 0.7,

        rotation: 0,

        color: "#111111",

        width: 140,

        height: 140,

        fontSize: 32,

        fontFamily: "Arial",

        opacity: 1,
      });
    };

    reader.readAsDataURL(uploadedFile);
  };

  return (
    <aside className="controls">
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}

      <div className="controls-header">
        <h2>Customize</h2>
      </div>

      {/* ================================================================ */}
      {/* PRODUCT SIZE                                                     */}
      {/* ================================================================ */}

      <div className="control-group">
        <label htmlFor="product-size" className="control-label">
          Product Size
        </label>

        <select
          id="product-size"
          className="control-select"
          value={config.size}
          onChange={(event) => setSize(event.target.value as "5x5" | "8x8")}
        >
          <option value="5x5">5x5</option>

          <option value="8x8">8x8</option>
        </select>
      </div>

      {/* ================================================================ */}
      {/* COLORS                                                           */}
      {/* ================================================================ */}

      <div className="control-group">
        <span className="control-label">Colors</span>

        <div className="color-grid">
          <div className="color-control">
            <label htmlFor="canopy-color">Canopy Color</label>

            <div className="color-input-wrapper">
              <input
                id="canopy-color"
                type="color"
                value={config.canopyColor}
                onChange={(event) => setCanopyColor(event.target.value)}
              />

              <span>{config.canopyColor.toUpperCase()}</span>
            </div>
          </div>

          <div className="color-control">
            <label htmlFor="frame-color">Frame Color</label>

            <div className="color-input-wrapper">
              <input
                id="frame-color"
                type="color"
                value={config.frameColor}
                onChange={(event) => setFrameColor(event.target.value)}
              />

              <span>{config.frameColor.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* PANEL                                                            */}
      {/* ================================================================ */}

      <div className="control-group">
        <span className="control-label">Panel</span>

        <div className="panel-tabs">
          {sections.map((section) => (
            <button
              type="button"
              key={section}
              className={
                section === activeSection ? "panel-tab active" : "panel-tab"
              }
              onClick={() => setSection(section)}
            >
              {section}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* ADD ELEMENTS                                                     */}
      {/* ================================================================ */}

      <div className="control-group">
        <span className="control-label">Add Design</span>

        <div className="action-row">
          <button type="button" className="primary-action" onClick={addText}>
            <Plus size={17} />
            <span>Add Text</span>
          </button>

          <button
            type="button"
            className="primary-action"
            onClick={() => file.current?.click()}
          >
            <ImagePlus size={17} />
            <span>Logo</span>
          </button>

          <input
            ref={file}
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => {
              const uploadedFile = event.target.files?.[0];

              if (uploadedFile) {
                upload(uploadedFile);
              }

              event.target.value = "";
            }}
          />
        </div>
      </div>

      {/* ================================================================ */}
      {/* SELECTED ELEMENT                                                */}
      {/* ================================================================ */}

      {selected && (
        <div className="selected-element">
          <div className="selected-title">
            Selected <strong>{selected.type}</strong>
          </div>

          {selected.type === "text" && (
            <>
              <div className="control-group">
                <label htmlFor="selected-text" className="control-label">
                  Text
                </label>

                <input
                  id="selected-text"
                  className="control-input"
                  type="text"
                  value={selected.text}
                  onChange={(event) =>
                    update(selected.id, {
                      text: event.target.value,
                    })
                  }
                />
              </div>

              <div className="control-group">
                <label htmlFor="selected-text-color" className="control-label">
                  Text Color
                </label>

                <input
                  id="selected-text-color"
                  className="small-color-input"
                  type="color"
                  value={selected.color}
                  onChange={(event) =>
                    update(selected.id, {
                      color: event.target.value,
                    })
                  }
                />
              </div>
            </>
          )}

          <div className="slider-group">
            <div className="slider-header">
              <span>Scale</span>

              <span>{selected.scale.toFixed(2)}</span>
            </div>

            <input
              type="range"
              min="0.2"
              max="2"
              step="0.05"
              value={selected.scale}
              onChange={(event) =>
                update(selected.id, {
                  scale: Number(event.target.value),
                })
              }
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span>Rotation</span>

              <span>{Math.round(selected.rotation)}°</span>
            </div>

            <input
              type="range"
              min="-180"
              max="180"
              value={selected.rotation}
              onChange={(event) =>
                update(selected.id, {
                  rotation: Number(event.target.value),
                })
              }
            />
          </div>

          <button
            type="button"
            className="danger-action"
            onClick={() => remove(selected.id)}
          >
            <Trash2 size={16} />
            Remove
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/* RESET                                                            */}
      {/* ================================================================ */}

      <button type="button" className="reset-action" onClick={reset}>
        <RotateCcw size={16} />
        Reset
      </button>
    </aside>
  );
}
