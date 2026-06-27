
export interface ChartBar {
  label: string;   // x-axis label (e.g. "Apr", "May")
  value: number;   // can be negative (downward bar)
}

interface Props {
  bars: ChartBar[];
  height?: number;        // px height of the plot area
  selectedIndex?: number; // highlight the bar matching the selected row
}

/**
 * Lightweight SVG bar chart for the Stock Item Monthly/Daily summary.
 * Strict gray theme: positive bars filled (zinc-800), negative bars drawn
 * downward as outline bars (white fill, black border) — no color used for
 * sign. Baseline is a 1px zinc rule. Matches TallyPrime's bottom-of-report
 * chart structurally, not visually.
 */
export default function StockBarChart({ bars, height = 96, selectedIndex = -2 }: Props) {
  if (!bars.length) return null;

  const max = Math.max(1, ...bars.map(b => Math.abs(b.value)));
  const hasNeg = bars.some(b => b.value < 0);
  const plotH = height;
  const baseY = hasNeg ? plotH / 2 : plotH - 1;     // baseline position
  const usableH = hasNeg ? plotH / 2 : plotH - 1;   // half height if negatives exist

  // Bar geometry in a normalized 0..100 width coordinate space per slot
  const slot = 100 / bars.length;
  const barW = Math.min(60, slot * 0.6); // % of a slot
  const gap  = (slot - barW) / 2;

  return (
    <div className="border-t border-zinc-200 bg-white px-3 pt-2 pb-1 shrink-0 select-none">
      <svg
        viewBox={`0 0 100 ${plotH + 14}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: plotH + 14 }}
      >
        {/* baseline */}
        <line x1="0" y1={baseY} x2="100" y2={baseY} stroke="#d4d4d8" strokeWidth="0.3" />
        {bars.map((b, i) => {
          const h = (Math.abs(b.value) / max) * usableH;
          const x = i * slot + gap;
          const isNeg = b.value < 0;
          const y = isNeg ? baseY : baseY - h;
          const sel = i === selectedIndex;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(0.4, h)}
                fill={isNeg ? "#ffffff" : sel ? "#18181b" : "#52525b"}
                stroke={isNeg ? "#18181b" : "none"}
                strokeWidth={isNeg ? 0.4 : 0}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>
      {/* x-axis labels (HTML so they stay crisp / non-stretched) */}
      <div className="flex w-full text-[8px] font-mono text-zinc-500 leading-none">
        {bars.map((b, i) => (
          <span
            key={i}
            className={`text-center truncate ${i === selectedIndex ? "text-zinc-900 font-bold" : ""}`}
            style={{ width: `${slot}%` }}
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
