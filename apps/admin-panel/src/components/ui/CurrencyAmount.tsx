/** مبلغ مالي مُنسَّق بعملته (Intl) — مع سقوط آمن. */
export function CurrencyAmount({
  amount,
  currency,
  className = '',
  maximumFractionDigits = 2,
}: {
  amount: number;
  currency: string;
  className?: string;
  maximumFractionDigits?: number;
}) {
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    formatted = `${amount.toFixed(maximumFractionDigits)} ${currency}`;
  }
  return <span className={`tabular-nums ${className}`}>{formatted}</span>;
}
