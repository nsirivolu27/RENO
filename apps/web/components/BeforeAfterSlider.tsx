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

  return (
    <div
      className="ba-slider"
      style={{ "--pos": `${pos}%` } as CSSProperties}
    >
      <img className="ba-after" src={after} alt={label ? `${label} — after` : "After"} />
      <img className="ba-before" src={before} alt={label ? `${label} — before` : "Before"} />
      <div className="ba-handle" aria-hidden="true" />
      <span className="ba-tag before">Before</span>
      <span className="ba-tag after">After</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
      />
    </div>
  );
}
