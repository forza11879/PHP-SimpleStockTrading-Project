/** Formats a money amount to cents (two decimals) for display. */
export function formatPrice(value: number): string {
  return Number(value).toFixed(2);
}
