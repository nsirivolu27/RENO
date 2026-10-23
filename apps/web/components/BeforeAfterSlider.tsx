"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  label?: string;
}

/**
 * Draggable before/after comparison. The "after" image is the base layer;
 * the "before" image is clipped from the right by the slider position.
 * In print, only the "after" image is shown (see globals.css).
 */
export default function BeforeAfterSlider({
  before,
  after,
  label,
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50);
  const [view, setView] = useState<"compare" | "before" | "after">("compare");

  const displayPos = view === "before" ? 100 : view === "after" ? 0 : pos;
  const title = label ? `${label} before and after` : "Before and after";

  return (
    <div className="ba-frame" aria-label={title}>
      <div
        className={`ba-slider ba-view-${view}`}
        style={{ "--pos": `${displayPos}%` } as CSSProperties}
      >
        <img className="ba-after" src={after} alt={label ? `${label} - after` : "After"} />
        <img className="ba-before" src={before} alt={label ? `${label} - before` : "Before"} />
        <div className="ba-handle" aria-hidden="true" />
        <span className="ba-tag before">Before</span>
        <span className="ba-tag after">After</span>
        {view === "compare" && (
          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Compare before and after"
          />
        )}
      </div>
      <div className="ba-tools no-print" aria-label="Comparison controls">
        <div className="ba-mode-tabs" role="group" aria-label="View mode">
          <button
            type="button"
            className={view === "compare" ? "active" : ""}
            onClick={() => setView("compare")}
          >
            Compare
          </button>
          <button
            type="button"
            className={view === "before" ? "active" : ""}
            onClick={() => setView("before")}
          >
            Before
          </button>
          <button
            type="button"
            className={view === "after" ? "active" : ""}
            onClick={() => setView("after")}
          >
            After
          </button>
        </div>
        <div className="ba-presets" role="group" aria-label="Split position">
          {[25, 50, 75].map((value) => (
            <button
              key={value}
              type="button"
              disabled={view !== "compare"}
              onClick={() => {
                setView("compare");
                setPos(value);
              }}
            >
              {value}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
