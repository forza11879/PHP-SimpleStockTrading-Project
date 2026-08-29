"use client";

import { useState } from "react";
import { useActionState } from "react";
import { buySellAction, type BuySellState } from "@/src/lib/actions";

const copy = {
  buy: {
    action: "Buy",
    maxLabel: "Maximum affordable",
    overMessage: (max: number) => `You can afford at most ${max} shares.`,
  },
  sell: {
    action: "Sell",
    maxLabel: "Maximum sellable",
    overMessage: (max: number) => `You own at most ${max} shares.`,
  },
} as const;

export default function BuySellForm({
  id,
  type,
  max,
  price,
}: {
  id: number;
  type: "buy" | "sell";
  max: number;
  price: number;
}) {
  const [qty, setQty] = useState("1");
  const [state, formAction, pending] = useActionState<BuySellState, FormData>(
    buySellAction.bind(null, id),
    { error: undefined },
  );

  const qtyNum = Number(qty);
  const overMax = qtyNum > max;
  const invalidQty = !Number.isInteger(qtyNum) || qtyNum < 1;
  const invalid = overMax || invalidQty || max <= 0;
  const c = copy[type];

  return (
    <form action={formAction}>
      {state.error && <p className="errorList">{state.error}</p>}
      <p>
        Current price: <strong>${price > 0 ? price : "Unavailable"}</strong>
      </p>
      <label>
        Quantity:
        <input
          type="number"
          min="1"
          max={max}
          step="1"
          name="qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
      </label>
      <br />
      {max > 0 && <small>{c.maxLabel}: {max}</small>}
      {max > 0 && overMax && (
        <p className="errorList">{c.overMessage(max)}</p>
      )}
      {max > 0 && !overMax && invalidQty && (
        <p className="errorList">Quantity must be a whole number of at least 1.</p>
      )}
      <input type="hidden" name="type" value={type} />
      <br />
      <button
        type="submit"
        className="btn btn-primary btn-md"
        disabled={pending || invalid}
      >
        {c.action}
      </button>
    </form>
  );
}