import type { ReactNode } from "react";
import LeftPanel from "@/components/LeftPanel.tsx";
import RightPanel from "@/components/RightPanel.tsx";

interface Props {
  children: ReactNode;
}

/**
 * Reusable three-column Tally dashboard layout wrapper.
 * Left Panel (30% width) | Center Menu (52% width) | Right Action Panel (18% width)
 */
export default function GatewayLayout({ children }: Props) {
  return (
    <div className="flex-1 flex justify-center py-6 w-full bg-zinc-55/30 min-h-screen text-zinc-900 font-sans">
      <div className="w-[96%] max-w-[1400px] flex gap-5 items-stretch">
        
        {/* Left Company Status Panel */}
        <div className="w-[32%] border border-zinc-200 rounded bg-white shadow-xs flex flex-col p-2 select-none">
          <LeftPanel />
        </div>

        {/* Center Navigation Content */}
        <div className="w-[50%] flex justify-center items-start">
          {children}
        </div>

        {/* Right Shortcut Action Panel */}
        <div className="w-[18%] border border-zinc-200 rounded bg-white shadow-xs overflow-hidden flex flex-col">
          <RightPanel />
        </div>

      </div>
    </div>
  );
}
