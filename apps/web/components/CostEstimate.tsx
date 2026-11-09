"use client";

import { useEffect, useState } from "react";
import { BUDGET_TIERS, formatMoneyRange } from "@reno/core";
import type { BudgetTier, CostEstimate, GenerateMode } from "@reno/core";

interface CostEstimateProps {
  room: string;
  style: string;
  mode: GenerateMode;
  /** Restrict pricing to one company's own product line. */
  vendorIds?: string[];
  /** Hide the tier switcher (e.g. in a printed proposal). */
  readOnly?: boolean;
}

const TIER_LABEL: Record<BudgetTier, string> = {
  essential: "Essential",
  standard: "Standard",
  premium: "Premium",
};

/**
 * Itemized cost range for a concept, from the vendor catalog.
 * Always shows the "indicative, not a quote" caveat. A number in front of a
 * client without that line is a liability.
 */
export default function CostEstimate({
  room,
  style,
  mode,
  vendorIds,
  readOnly = false,
}: CostEstimateProps) {
  const [tier, setTier] = useState<BudgetTier>("standard");
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [source, setSource] = useState<"sample" | "custom">("sample");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, style, mode, tier, vendorIds }),
    })
      .then((res) => res.json())
      .then((data: { estimate?: CostEstimate; catalogSource?: "sample" | "custom"; error?: string }) => {
        if (cancelled) return;
        if (!data.estimate) {
          setError(data.error ?? "Could not build an estimate.");
          return;
        }
        setEstimate(data.estimate);
        setSource(data.catalogSource ?? "sample");
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the pricing service.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [room, style, mode, tier, vendorIds]);

  if (error) {
    return (
      <div className="estimate-panel">
        <p className="estimate-note">{error}</p>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="estimate-panel">
        <p className="estimate-note">
          {loading ? "Pricing this concept..." : "No estimate available."}
        </p>
      </div>
    );
  }

  return (
    <div className="estimate-panel">
      <div className="estimate-head">
        <div>
          <strong>Indicative cost</strong>
          <p className="estimate-note" style={{ margin: 0 }}>
            {mode === "renovate"
              ? "Furnishings, surfaces, fixtures and labor"
              : "Furnishings and decor only"}
          </p>
        </div>
        <span className="estimate-total">
          {formatMoneyRange(
            estimate.subtotalLow,
            estimate.subtotalHigh,
            estimate.currency
          )}
        </span>
      </div>

      {!readOnly && (
        <div className="tier-row no-print" role="group" aria-label="Budget level">
          {BUDGET_TIERS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${tier === t ? " active" : ""}`}
              onClick={() => setTier(t)}
              aria-pressed={tier === t}
            >
              {TIER_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      <ul className="estimate-lines">
        {estimate.lines.map((line) => (
          <li key={line.itemId}>
            <span>
              {line.name}
              <span className="line-vendor">
                {line.vendorName} - {line.quantity}{" "}
                {line.unit === "each" ? "x" : line.unit}
              </span>
            </span>
            <span className="line-price">
              {formatMoneyRange(line.low, line.high, estimate.currency)}
            </span>
          </li>
        ))}
      </ul>

      <p className="estimate-note">
        {estimate.notes.join(" ")}
        {source === "sample" &&
          " Prices come from Reno's sample catalog. Load your own vendor list before quoting."}
      </p>
    </div>
  );
}
