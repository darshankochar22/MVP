import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { RightActionPanel } from "@/components/ui";

export default function RightPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCompany, activeFY, availableFYs, switchFY } = useCompany();

  // Modals state
  const [showDateModal, setShowDateModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [tempDate, setTempDate] = useState("");

  const handleBack = () => {
    const currentPath = location.pathname;
    if (currentPath === "/") {
      // Home screen, do nothing or quit
      return;
    }
    
    // Smart back navigation
    if (currentPath.startsWith("/master/coa/")) {
      navigate("/master/coa");
    } else if (currentPath.startsWith("/master/")) {
      navigate("/");
    } else if (currentPath.startsWith("/transactions/")) {
      navigate("/");
    } else if (currentPath.startsWith("/utilities/")) {
      navigate("/");
    } else if (currentPath.startsWith("/data/")) {
      navigate("/");
    } else {
      navigate(-1);
    }
  };

  const handleSaveDate = () => {
    if (tempDate.trim()) {
      localStorage.setItem("tally_session_date", tempDate.trim());
      window.dispatchEvent(new Event("tally-session-date-changed"));
    }
    setShowDateModal(false);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is active, check Enter and Esc keys
      if (showDateModal) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSaveDate();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setShowDateModal(false);
        }
        return;
      }
      if (showPeriodModal) {
        if (e.key === "Escape") {
          e.preventDefault();
          setShowPeriodModal(false);
        }
        return;
      }

      // Avoid firing shortcuts when user is typing in form inputs/textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (e.key === "F2" || e.key === "f2") {
        e.preventDefault();
        if (e.altKey) {
          setShowPeriodModal(true);
        } else {
          const defaultDate = localStorage.getItem("tally_session_date") || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          setTempDate(defaultDate);
          setShowDateModal(true);
        }
      } else if (e.key === "F3" || e.key === "f3") {
        e.preventDefault();
        navigate("/company");
      } else if (e.key === "F11" || e.key === "f11") {
        e.preventDefault();
        navigate("/data/tallyFeatures");
      } else if (e.key === "F12" || e.key === "f12") {
        e.preventDefault();
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "F12", code: "F12", bubbles: true }));
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, location, showDateModal, showPeriodModal, tempDate, availableFYs, activeFY, switchFY]);

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const actions = [
    {
      key: "F2",
      label: "Date",
      onClick: () => {
        const defaultDate = localStorage.getItem("tally_session_date") || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        setTempDate(defaultDate);
        setShowDateModal(true);
      }
    },
    {
      key: "Alt+F2",
      label: "Period",
      onClick: () => setShowPeriodModal(true)
    },
    {
      key: "F3",
      label: "Company",
      onClick: () => navigate("/company")
    },
    {
      key: "F11",
      label: "Features",
      onClick: () => navigate("/data/tallyFeatures")
    },
    {
      key: "F12",
      label: "Configure",
      onClick: () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "F12", code: "F12", bubbles: true }));
      }
    },
    {
      key: "Esc",
      label: location.pathname === "/" ? "Quit" : "Back",
      onClick: handleBack
    }
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <RightActionPanel actions={actions} title="Gateway Binds" className="w-full flex-1" />

      {/* Date Picker Modal (F2) */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white border border-zinc-400 p-5 shadow-2xl w-80 font-mono text-xs rounded select-none">
            <div className="bg-zinc-900 text-white px-2 py-1 text-center font-bold uppercase tracking-wider mb-4">
              Change Date
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-zinc-500 font-bold uppercase text-[9px] mb-1">
                  Current Session Date
                </label>
                <input
                  type="text"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 transition-colors"
                  placeholder="e.g. 21-May-2026"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowDateModal(false)}
                  className="px-3 py-1.5 border border-zinc-200 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel [Esc]
                </button>
                <button
                  onClick={handleSaveDate}
                  className="px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer font-bold"
                >
                  Accept [Enter]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Period Selection Modal (Alt+F2) */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white border border-zinc-400 p-5 shadow-2xl w-96 font-mono text-xs rounded select-none">
            <div className="bg-zinc-900 text-white px-2 py-1 text-center font-bold uppercase tracking-wider mb-4">
              Change Period
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Select Active Financial Year
              </div>
              
              {availableFYs.length === 0 ? (
                <div className="py-4 text-center text-zinc-400 italic">No financial years available.</div>
              ) : (
                <div className="flex flex-col border border-zinc-200 rounded divide-y divide-zinc-150 max-h-48 overflow-y-auto">
                  {availableFYs.map((fy) => {
                    const isSelected = activeFY?.fy_id === fy.fy_id;
                    return (
                      <button
                        key={fy.fy_id}
                        onClick={async () => {
                          await switchFY(fy);
                          setShowPeriodModal(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between hover:bg-zinc-50 cursor-pointer ${
                          isSelected ? "bg-zinc-100 font-bold" : ""
                        }`}
                      >
                        <span>
                          {formatDate(fy.start_date)} — {formatDate(fy.end_date)}
                        </span>
                        {isSelected && (
                          <span className="text-zinc-900 font-bold text-[10px] bg-zinc-200 px-1.5 py-0.5 rounded">
                            ✓ Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setShowPeriodModal(false)}
                  className="px-3 py-1.5 border border-zinc-200 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Close [Esc]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}