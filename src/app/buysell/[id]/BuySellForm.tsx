"use client";

import { useState } from "react";
import { useActionState } from "react";
import { buySellAction } from "@/src/lib/actions";
import { formatPrice } from "@/src/lib/money";
import type { OrderResult } from "@/src/lib/orders";

const copy = {
  buy: {
    action: "Buy",
    maxLabel: "Maximum affordable",
    overMessage: (max: number) => `You can afford at most ${max} shares.`,
    estLabel: "Estimated cost",
    submitClass: "bg-green-600 text-white hover:bg-green-700",
  },
  sell: {
    action: "Sell",
    maxLabel: "Maximum sellable",
    overMessage: (max: number) => `You own at most ${max} shares.`,
    estLabel: "Estimated proceeds",
    submitClass: "bg-red-600 text-white hover:bg-red-700",
  },
} as const;

export default function BuySellForm({
  id,
  type,
  max,
  price,
  cash,
  ownedQty,
  avgPrice,
}: {
  id: number;
  type: "buy" | "sell";
  max: number;
  price: number;
  cash: number;
  ownedQty: number;
  avgPrice: number;
}) {
  const [qty, setQty] = useState("1");
  const [infoOpen, setInfoOpen] = useState(false);
  const [state, formAction, pending] = useActionState<OrderResult, FormData>(
    buySellAction.bind(null, id),
    {},
  );

  const qtyNum = Number(qty);
  const overMax = qtyNum > max;
  const invalidQty = !Number.isInteger(qtyNum) || qtyNum < 1;
  const invalid = overMax || invalidQty || max <= 0;
  const c = copy[type];
  const estimate =
    !invalidQty && !overMax && price > 0
      ? `$${formatPrice(qtyNum * price)}`
      : "—";

  return (
    <form action={formAction} className="mt-3">
      {state.error && (
        <p className="mb-2 border border-line bg-canvas px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted">Current price</span>
        <span className="text-lg font-semibold tabular-nums">
          {price > 0 ? `$${formatPrice(price)}` : "Unavailable"}
        </span>
      </div>
      <label className="mt-3 block text-xs text-muted" htmlFor={`qty-${type}`}>
        Quantity
      </label>
      <input
        type="number"
        min="1"
        max={max}
        step="1"
        id={`qty-${type}`}
        name="qty"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        onFocus={() => setInfoOpen(true)}
        onBlur={() => setInfoOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") (e.target as HTMLInputElement).blur();
        }}
        aria-expanded={infoOpen}
        aria-describedby={infoOpen ? `qty-info-${type}` : undefined}
        className="mt-1 w-full border border-line bg-surface px-3 py-1.5 text-sm tabular-nums"
      />
      {infoOpen && (
        <div
          id={`qty-info-${type}`}
          className="mt-1 border border-line bg-canvas px-3 py-2 text-xs"
        >
          <div className="flex justify-between py-0.5">
            <span className="text-muted">Cash balance</span>
            <span className="tabular-nums">${formatPrice(cash)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted">Position</span>
            <span className="tabular-nums">
              {ownedQty > 0
                ? `${ownedQty} @ $${formatPrice(avgPrice)}`
                : "None"}
            </span>
          </div>
        </div>
      )}
      <div className="mt-2 flex items-baseline justify-between text-sm">
        <span className="text-xs text-muted">{c.estLabel}</span>
        <span className="font-semibold tabular-nums">{estimate}</span>
      </div>
      {max > 0 && (
        <p className="mt-1 text-xs text-muted">
          {c.maxLabel}: {max}
        </p>
      )}
      {max > 0 && overMax && (
        <p className="mt-1 text-xs text-red-600">{c.overMessage(max)}</p>
      )}
      {max > 0 && !overMax && invalidQty && (
        <p className="mt-1 text-xs text-red-600">
          Quantity must be a whole number of at least 1.
        </p>
      )}
      <input type="hidden" name="type" value={type} />
      <button
        type="submit"
        disabled={pending || invalid}
        className={`mt-3 w-full rounded px-3 py-2 text-sm font-semibold disabled:opacity-40 ${c.submitClass}`}
      >
        {c.action}
      </button>
    </form>
  );
}
