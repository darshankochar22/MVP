import { useState, useEffect, useRef } from "react";

interface GSTRegistrationItem {
  gst_id?: number;
  gstin?: string;
  state_id?: string;
  trade_name?: string;
  legal_name?: string;
}

interface DownloadSettingsModalProps {
  isOpen: boolean;
  registrations: GSTRegistrationItem[];
  initialRegistration: string;
  initialReturnType: string;
  onSave: (registration: string, returnType: string) => void;
  onClose: () => void;
}

const RETURN_TYPES = ["All Returns", "GSTR-1", "GSTR-2A", "GSTR-2B", "GSTR-3B"];

export default function DownloadSettingsModal({
  isOpen,
  registrations,
  initialRegistration,
  initialReturnType,
  onSave,
  onClose,
}: DownloadSettingsModalProps) {
  const [activeField, setActiveField] = useState<"gstRegistration" | "returnType">("gstRegistration");
  const [selectedReg, setSelectedReg] = useState("");
  const [selectedReturnType, setSelectedReturnType] = useState("All Returns");

  // Dropdown menus list open states
  const [regListOpen, setRegListOpen] = useState(false);
  const [returnTypeListOpen, setReturnTypeListOpen] = useState(false);
  const [regSelectedIndex, setRegSelectedIndex] = useState(0);
  const [returnTypeSelectedIndex, setReturnTypeSelectedIndex] = useState(0);

  const regInputRef = useRef<HTMLDivElement>(null);
  const typeInputRef = useRef<HTMLDivElement>(null);

  // Generate readable label for each GST Registration
  const getRegLabel = (r: GSTRegistrationItem) => {
    if (r.state_id) {
      // e.g. "Chhattisgarh Registration"
      return r.state_id.includes("Registration") ? r.state_id : `${r.state_id} Registration`;
    }
    return r.gstin ? `GSTIN: ${r.gstin}` : "Primary Registration";
  };

  const regOptions = registrations.length > 0 
    ? registrations.map(getRegLabel)
    : ["Primary Registration"];

  useEffect(() => {
    if (isOpen) {
      setSelectedReg(initialRegistration || regOptions[0] || "");
      setSelectedReturnType(initialReturnType || "All Returns");
      setActiveField("gstRegistration");
      setRegListOpen(true);
      setReturnTypeListOpen(false);
      
      const rIdx = regOptions.indexOf(initialRegistration);
      setRegSelectedIndex(rIdx >= 0 ? rIdx : 0);
      
      const tIdx = RETURN_TYPES.indexOf(initialReturnType);
      setReturnTypeSelectedIndex(tIdx >= 0 ? tIdx : 0);
    }
  }, [isOpen, initialRegistration, initialReturnType, registrations]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (activeField === "gstRegistration") {
        if (e.key === "ArrowDown" && regListOpen) {
          e.preventDefault();
          setRegSelectedIndex((p) => (p + 1) % regOptions.length);
        } else if (e.key === "ArrowUp" && regListOpen) {
          e.preventDefault();
          setRegSelectedIndex((p) => (p - 1 + regOptions.length) % regOptions.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          setSelectedReg(regOptions[regSelectedIndex]);
          setRegListOpen(false);
          setActiveField("returnType");
          setReturnTypeListOpen(true);
        }
      } else if (activeField === "returnType") {
        if (e.key === "ArrowDown" && returnTypeListOpen) {
          e.preventDefault();
          setReturnTypeSelectedIndex((p) => (p + 1) % RETURN_TYPES.length);
        } else if (e.key === "ArrowUp" && returnTypeListOpen) {
          e.preventDefault();
          setReturnTypeSelectedIndex((p) => (p - 1 + RETURN_TYPES.length) % RETURN_TYPES.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          const finalType = RETURN_TYPES[returnTypeSelectedIndex];
          onSave(selectedReg, finalType);
          onClose();
        } else if (e.key === "Backspace" || e.key === "ArrowUp") {
          // Allow going back to GST registration
          if (e.key === "Backspace" || (e.key === "ArrowUp" && returnTypeSelectedIndex === 0)) {
            e.preventDefault();
            setReturnTypeListOpen(false);
            setActiveField("gstRegistration");
            setRegListOpen(true);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeField, regListOpen, returnTypeListOpen, regSelectedIndex, returnTypeSelectedIndex, regOptions, selectedReg]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-[11000] flex items-center justify-center font-mono text-[11px] backdrop-blur-[1px]">
      <div className="flex gap-4 items-stretch">
        
        {/* Main Settings Prompt Box */}
        <div className="relative bg-white border border-zinc-400 shadow-2xl w-[400px] flex flex-col pt-3 pb-8 px-6 min-h-[200px]">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center font-bold text-xs pb-6 text-zinc-900 tracking-wide">
            Download Settings
          </div>

          <div className="space-y-4">
            {/* GST Registration selection */}
            <div 
              className="grid items-center min-h-[24px]"
              style={{ gridTemplateColumns: "130px 10px 1fr" }}
            >
              <span className="text-zinc-700">GST Registration</span>
              <span className="text-zinc-400 text-center">:</span>
              <div 
                ref={regInputRef}
                onClick={() => {
                  setActiveField("gstRegistration");
                  setRegListOpen(true);
                  setReturnTypeListOpen(false);
                }}
                className={`px-2 py-0.5 border cursor-pointer font-bold select-none truncate ${
                  activeField === "gstRegistration" ? "bg-[#ffea5d] border-[#e6c300] text-zinc-950" : "border-transparent bg-transparent text-zinc-900"
                }`}
              >
                {selectedReg}
              </div>
            </div>

            {/* Return Type selection */}
            <div 
              className="grid items-center min-h-[24px]"
              style={{ gridTemplateColumns: "130px 10px 1fr" }}
            >
              <span className="text-zinc-700">Return Type</span>
              <span className="text-zinc-400 text-center">:</span>
              <div 
                ref={typeInputRef}
                onClick={() => {
                  setActiveField("returnType");
                  setRegListOpen(false);
                  setReturnTypeListOpen(true);
                }}
                className={`px-2 py-0.5 border cursor-pointer font-bold select-none truncate ${
                  activeField === "returnType" ? "bg-[#ffea5d] border-[#e6c300] text-zinc-950" : "border-transparent bg-transparent text-zinc-900"
                }`}
              >
                {activeField === "returnType" ? RETURN_TYPES[returnTypeSelectedIndex] : selectedReturnType}
              </div>
            </div>
          </div>
        </div>

        {/* Right list panel for active field options */}
        {regListOpen && (
          <div className="bg-white border border-zinc-400 w-[240px] flex flex-col shadow-2xl overflow-hidden min-h-[200px]">
            <div className="bg-[#4d66cc] text-white font-bold text-xs py-1.5 px-3 tracking-wide">
              <span>List of GST Registrations</span>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {regOptions.map((opt, index) => (
                <div
                  key={opt}
                  onClick={() => {
                    setSelectedReg(opt);
                    setRegListOpen(false);
                    setActiveField("returnType");
                    setReturnTypeListOpen(true);
                  }}
                  className={`px-3 py-1 cursor-pointer flex justify-between font-mono text-[11px] ${
                    index === regSelectedIndex ? "bg-[#ffb62b] text-black font-bold" : "hover:bg-zinc-100 text-zinc-900"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {returnTypeListOpen && (
          <div className="bg-white border border-zinc-400 w-[200px] flex flex-col shadow-2xl overflow-hidden min-h-[200px]">
            <div className="bg-[#4d66cc] text-white font-bold text-xs py-1.5 px-3 tracking-wide">
              <span>Types of Return</span>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {RETURN_TYPES.map((opt, index) => (
                <div
                  key={opt}
                  onClick={() => {
                    setSelectedReturnType(opt);
                    onSave(selectedReg, opt);
                    onClose();
                  }}
                  className={`px-3 py-1 cursor-pointer flex justify-between font-mono text-[11px] ${
                    index === returnTypeSelectedIndex ? "bg-[#ffb62b] text-black font-bold" : "hover:bg-zinc-100 text-zinc-900"
                  }`}
                >
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
