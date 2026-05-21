/**
 * AmountDisplay — formats a number as an INR amount string consistently.
 * Use for all monetary values across the app.
 */

interface Props {
  amount: number;
  /** Show the ₹ symbol (default true) */
  showSymbol?: boolean;
  className?: string;
}

const formatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(amount: number, showSymbol = true): string {
  return `${showSymbol ? "₹" : ""}${formatter.format(amount)}`;
}

export default function AmountDisplay({ amount, showSymbol = true, className }: Props) {
  return (
    <span className={className}>
      {formatINR(amount, showSymbol)}
    </span>
  );
}
