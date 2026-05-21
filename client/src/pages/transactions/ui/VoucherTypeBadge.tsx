/**
 * VoucherTypeBadge — colour-coded label for a voucher type string.
 * Maps known types to brand-consistent colours.
 * Reused in VoucherList, VoucherView, Daybook.
 */

const TYPE_CLASSES: Record<string, string> = {
  Receipt:  "bg-emerald-100 text-emerald-800",
  Payment:  "bg-rose-100   text-rose-800",
  Contra:   "bg-violet-100 text-violet-800",
  Journal:  "bg-amber-100  text-amber-800",
  Sales:    "bg-blue-100   text-blue-800",
  Purchase: "bg-orange-100 text-orange-800",
};

/** Solid (filled) variant used in VoucherView title bars */
const TYPE_SOLID: Record<string, string> = {
  Receipt:  "bg-emerald-600",
  Payment:  "bg-rose-600",
  Contra:   "bg-violet-600",
  Journal:  "bg-amber-600",
  Sales:    "bg-blue-600",
  Purchase: "bg-orange-600",
};

interface Props {
  type: string;
  /** 'pill' = small rounded label (list rows), 'solid' = filled bg string for title bars */
  variant?: "pill" | "solid";
  size?: "xs" | "sm";
}

export function voucherTypeSolidClass(type: string): string {
  return TYPE_SOLID[type] ?? "bg-zinc-700";
}

export default function VoucherTypeBadge({ type, variant = "pill", size = "xs" }: Props) {
  if (variant === "solid") {
    // Return just the class — caller applies it to the container. Use pill instead.
    return null;
  }
  const cls = TYPE_CLASSES[type] ?? "bg-zinc-100 text-zinc-600";
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[9px] px-1.5 py-0.5";
  return (
    <span className={`font-bold rounded-full uppercase tracking-wider select-none ${sizeClass} ${cls}`}>
      {type}
    </span>
  );
}
