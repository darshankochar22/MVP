export function voucherTypeSolidClass(_type: string): string {
    return "bg-zinc-900";
}

interface Props {
    type: string;
    size?: "xs"|"sm";
}

export default function VoucherTypeBadge({ type, size = "xs"} : Props) {
    const sizeClass= size === "sm" 
      ? "text-[10px] px-2 py-0.5"
      : "text-[9px] px-1.5 py-0.5";

    return (
     <span className={`font-bold rounded uppercase tracking-wider select-none border border-zinc-300 
     bg-zinc-100 text-zinc-700 ${sizeClass}`}>
          {type}
     </span>
    );
}