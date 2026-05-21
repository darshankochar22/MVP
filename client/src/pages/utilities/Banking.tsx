import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { PageTitleBar, RightActionPanel } from "@/components/ui";

const menuSections = [
  {
    label: "Reconciliation",
    items: [
      { name: "Banking Activities", shortcut: "F7", desc: "Bank Reconciliation Statement (BRS)" },
      { name: "Imported Bank Data", shortcut: "F8", desc: "Awaiting e-Statement parsing" },
    ],
  },
  {
    label: "Cheque Management",
    items: [
      { name: "Cheque Printing", shortcut: "F2", desc: "Multi-cheque layout alignment" },
      { name: "Cheque Register", shortcut: "F3", desc: "Clearing status & void registers" },
      { name: "Post Dated Summary", shortcut: "F4", desc: "Future liquidity & PDC items" },
    ],
  },
  {
    label: "Other Slip Reports",
    items: [
      { name: "Deposit Slip", shortcut: "F5", desc: "Cash & cheque physical deposit books" },
      { name: "Payment Advice", shortcut: "F6", desc: "Email/print payment instructions" },
    ],
  },
];

const UTILITY_DETAILS: Record<
  string,
  {
    title: string;
    description: string;
    actionLabel: string;
    stats: { label: string; value: string; detail?: string }[];
  }
> = {
  "Banking Activities": {
    title: "Bank Reconciliation Statement (BRS)",
    description: "Verify and reconcile general bank account ledger entries against statement feeds.",
    actionLabel: "Start Reconciling",
    stats: [
      { label: "BRS Status", value: "Out of Date", detail: "Last reconciled: 30-Apr-2026" },
      { label: "SBI Current A/c Ledger", value: "₹12,45,210.50", detail: "Books balance" },
      { label: "Bank Statement Balance", value: "₹12,38,100.50", detail: "Live e-Statement feed" },
      { label: "Difference to Match", value: "₹7,110.00", detail: "3 outstanding transaction items" },
    ],
  },
  "Imported Bank Data": {
    title: "Imported Bank Feed Data",
    description: "Ingest CSV, MT940, or OFX statement files to automate match generation.",
    actionLabel: "Import Statement",
    stats: [
      { label: "Awaiting Import", value: "1 Feed Ready", detail: "Parsed from API webhook" },
      { label: "Last Ingested", value: "15-May-2026", detail: "148 transactions processed" },
      { label: "Auto-Match Rate", value: "92.4%", detail: "High-confidence ledger pairing" },
    ],
  },
  "Cheque Printing": {
    title: "Cheque Printing Utility",
    description: "Calibrate alignment dimensions and batch print physical bank cheques.",
    actionLabel: "Calibrate Alignment",
    stats: [
      { label: "Preferred Bank", value: "State Bank of India Current Account" },
      { label: "Pending Queue", value: "8 Cheques", detail: "Awaiting batch layout rendering" },
      { label: "Last Printed Slip", value: "Chq No. 109842", detail: "₹85,000 to Sigma Logistics" },
      { label: "Printer Source", value: "Bypass Tray (A4)", detail: "Ready to print" },
    ],
  },
  "Cheque Register": {
    title: "Clearing Cheque Register",
    description: "Consolidated book tracking clearance timelines of issued instruments.",
    actionLabel: "Export Register",
    stats: [
      { label: "Total Cheques Issued", value: "42 Instruments", detail: "FY 2026-27" },
      { label: "Cleared & Matched", value: "31", detail: "Matched via statement feeds" },
      { label: "Outstanding Items", value: "9", detail: "Awaiting bank clearing house" },
      { label: "Voided / Cancelled", value: "2", detail: "Spelled/voided with reversed ledger impact" },
    ],
  },
  "Post Dated Summary": {
    title: "Post Dated Cheques (PDC) Summary",
    description: "Overview of receipts and payments scheduled to execute in the future.",
    actionLabel: "View Future Cashflow",
    stats: [
      { label: "PDC Receipts", value: "3 Cheques", detail: "Cumulative: ₹4,50,000" },
      { label: "PDC Payments", value: "1 Cheque", detail: "Cumulative: ₹1,20,000" },
      { label: "Projected Liquidity", value: "+ ₹3,30,000", detail: "Scheduled before 15-Jun-2026" },
    ],
  },
  "Deposit Slip": {
    title: "Bank Deposit Slip Generator",
    description: "Generate and output cash or cheque deposit advice slips for physical dispatch.",
    actionLabel: "Print Deposit Slip",
    stats: [
      { label: "Pending Cash Deposits", value: "3 Entries", detail: "Value: ₹75,000" },
      { label: "Pending Cheque Slips", value: "2 Slips", detail: "Value: ₹1,10,000" },
      { label: "Total Deposit Queue", value: "₹1,85,000", detail: "Ready for bank submission" },
    ],
  },
  "Payment Advice": {
    title: "Payment Advice Notes",
    description: "Email confirmation slips detailing vendor invoices settled in bank transfers.",
    actionLabel: "Batch Email Advices",
    stats: [
      { label: "Generated Advices", value: "15 Notes", detail: "FY 2026-27" },
      { label: "Successfully Sent", value: "12 Sent", detail: "Delivered to vendor invoice desks" },
      { label: "Awaiting Email Setup", value: "3 Pending", detail: "Missing vendor email configs" },
    ],
  },
};

export default function Banking() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [activeItem, setActiveItem] = useState<string>("Banking Activities");

  // Keyboard navigation & hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        navigate("/");
      }
      if (e.key === "F2") {
        e.preventDefault();
        setActiveItem("Cheque Printing");
      }
      if (e.key === "F3") {
        e.preventDefault();
        setActiveItem("Cheque Register");
      }
      if (e.key === "F4") {
        e.preventDefault();
        setActiveItem("Post Dated Summary");
      }
      if (e.key === "F5") {
        e.preventDefault();
        setActiveItem("Deposit Slip");
      }
      if (e.key === "F6") {
        e.preventDefault();
        setActiveItem("Payment Advice");
      }
      if (e.key === "F7") {
        e.preventDefault();
        setActiveItem("Banking Activities");
      }
      if (e.key === "F8") {
        e.preventDefault();
        setActiveItem("Imported Bank Data");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const bankingActions = [
    { key: "F7", label: "BRS View", onClick: () => setActiveItem("Banking Activities") },
    { key: "F8", label: "Bank Feed", onClick: () => setActiveItem("Imported Bank Data") },
    { key: "F2", label: "Chq Print", onClick: () => setActiveItem("Cheque Printing") },
    { key: "F3", label: "Chq Register", onClick: () => setActiveItem("Cheque Register") },
    { key: "F4", label: "PDC Summary", onClick: () => setActiveItem("Post Dated Summary") },
    { key: "F5", label: "Deposit Slip", onClick: () => setActiveItem("Deposit Slip") },
    { key: "F6", label: "Payment Advice", onClick: () => setActiveItem("Payment Advice") },
    { key: "Esc", label: "Quit", onClick: () => navigate("/") },
  ];

  const currentDetails = UTILITY_DETAILS[activeItem] || UTILITY_DETAILS["Banking Activities"];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 font-mono text-xs select-none relative overflow-hidden">
      
      {/* Title Bar */}
      <PageTitleBar title="Banking Utilities" subtitle={selectedCompany?.name} />

      {/* Main Body Layout */}
      <div className="flex-1 flex min-h-0">
        
        {/* Left Side: Option Selection Panels */}
        <div className="w-[340px] border-r border-zinc-200 flex flex-col shrink-0 bg-white p-4 overflow-y-auto">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-4">
            Select Banking Utility
          </div>

          <div className="space-y-5">
            {menuSections.map((section) => (
              <div key={section.label} className="space-y-1.5">
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">
                  {section.label}
                </div>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => {
                    const isSelected = activeItem === item.name;
                    return (
                      <div
                        key={item.name}
                        onClick={() => setActiveItem(item.name)}
                        className={`flex flex-col p-2.5 rounded border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-950 border-zinc-950 text-white shadow-sm"
                            : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{item.name}</span>
                          <span
                            className={`text-[8px] font-bold px-1 py-0.5 rounded font-mono ${
                              isSelected ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {item.shortcut}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] mt-1 ${
                            isSelected ? "text-zinc-400" : "text-zinc-500"
                          }`}
                        >
                          {item.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Area: Interactive Live Mock Data & Details */}
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-y-auto bg-zinc-50/50">
          <div className="max-w-xl w-full mx-auto space-y-6">
            
            {/* Header info */}
            <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-sm space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                {currentDetails.title}
              </h2>
              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                {currentDetails.description}
              </p>
            </div>

            {/* Live Statistic Metrics Card */}
            <div className="border border-zinc-200 bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2 flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Live Ledger & Process Monitor</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System feeds operational" />
              </div>
              
              <div className="divide-y divide-zinc-100 font-mono">
                {currentDetails.stats.map((stat, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-zinc-50/30">
                    <span className="col-span-4 font-semibold text-zinc-400">{stat.label}</span>
                    <span className="col-span-1 text-zinc-300">:</span>
                    <div className="col-span-7 flex flex-col">
                      <span className="font-bold text-zinc-900 text-xs">{stat.value}</span>
                      {stat.detail && (
                        <span className="text-[10px] text-zinc-500 font-sans mt-0.5">{stat.detail}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => alert(`${currentDetails.title} action triggered.`)}
                className="text-xs px-5 py-2 font-bold bg-zinc-950 text-white hover:bg-zinc-800 rounded transition-all shadow-sm active:scale-95 duration-100 uppercase tracking-wide"
              >
                {currentDetails.actionLabel}
              </button>
            </div>

          </div>
        </div>

        {/* Right Side: Action Panel */}
        <RightActionPanel actions={bankingActions} />

      </div>

    </div>
  );
}