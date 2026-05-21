const VARIANT_CLASSES: Record<string, string> = {
  success:  "bg-emerald-100 text-emerald-800",
  danger:   "bg-rose-100 text-rose-800",
  warning:  "bg-amber-100 text-amber-800",
  info:     "bg-blue-100 text-blue-800",
  neutral:  "bg-zinc-100 text-zinc-600",
  violet:   "bg-violet-100 text-violet-800",
  orange:   "bg-orange-100 text-orange-800",
};

// Map common voucher types to variant names
const TYPE_VARIANT: Record<string, string> = {
  Receipt:  "success",
  Payment:  "danger",
  Contra:   "violet",
  Journal:  "warning",
  Sales:    "info",
  Purchase: "orange",
  Active:   "success",
  Cancelled: "danger",
};

interface Props {
  label: string;
  /** Pass a variant key or a voucher type string — auto-maps known types */
  variant?: string;
  size?: "xs" | "sm";
}

export default function StatusBadge({ label, variant, size = "xs" }: Props) {
  const resolvedVariant = variant ?? TYPE_VARIANT[label] ?? "neutral";
  const cls = VARIANT_CLASSES[resolvedVariant] ?? VARIANT_CLASSES.neutral;
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[9px] px-1.5 py-0.5";
  return (
    <span className={`font-bold rounded-full uppercase tracking-wider select-none ${sizeClass} ${cls}`}>
      {label}
    </span>
  );
}
