
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
