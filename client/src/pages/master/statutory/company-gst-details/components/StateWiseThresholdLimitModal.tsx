import React, { useState, useEffect } from "react";

export interface StateThresholdLimit {
  stateName: string;
  limit: number;
}

interface StateWiseThresholdLimitModalProps {
  isOpen: boolean;
  initialLimits: StateThresholdLimit[];
  onSave: (limits: StateThresholdLimit[]) => void;
  onClose: () => void;
}

const TALLY_INDIAN_STATES = [
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttarakhand",
  "Uttar Pradesh",
  "West Bengal",
];

export default function StateWiseThresholdLimitModal({
  isOpen,
  initialLimits,
  onSave,
  onClose,
}: StateWiseThresholdLimitModalProps) {
  const [limits, setLimits] = useState<StateThresholdLimit[]>([]);
  const [addingState, setAddingState] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLimits(initialLimits || []);
      setAddingState("");
    }
  }, [isOpen, initialLimits]);

  if (!isOpen) return null;

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value;
    if (!selectedState) return;
    
    // Check if state is already in the list
    if (limits.some(l => l.stateName === selectedState)) {
      alert("State already added.");
      setAddingState("");
      return;
    }

    setLimits([...limits, { stateName: selectedState, limit: 50000 }]);
    setAddingState(""); // clear selection so dropdown appears again
  };

  const handleLimitChange = (index: number, newLimitStr: string) => {
    const num = Number(newLimitStr.replace(/,/g, ""));
    const updated = [...limits];
    updated[index].limit = isNaN(num) ? 0 : num;
    setLimits(updated);
  };

  const removeState = (index: number) => {
    const updated = [...limits];
    updated.splice(index, 1);
    setLimits(updated);
  };

  const handleSaveAndClose = () => {
    onSave(limits);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm select-none text-black font-sans">
      <div className="bg-white border-2 border-black w-[600px] flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-black px-6 py-4">
          <h2 className="text-xl font-bold text-center flex-1 underline decoration-2 underline-offset-4">
            Intrastate Threshold Limit for e-Way Bill
          </h2>
          <button 
            onClick={handleSaveAndClose}
            className="text-black hover:text-gray-600 font-bold text-2xl absolute right-4 top-3"
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 px-4 text-left font-bold text-lg w-2/3">State</th>
                <th className="py-2 px-4 text-right font-bold text-lg w-1/3 border-l-2 border-black">Limit</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {limits.map((item, index) => (
                <tr key={item.stateName} className="border-b border-gray-300 hover:bg-gray-50 group">
                  <td className="py-3 px-4 text-base font-medium">{item.stateName}</td>
                  <td className="py-3 px-4 border-l-2 border-black">
                    <input
                      type="text"
                      className="w-full text-right outline-none bg-transparent border border-transparent focus:border-black focus:bg-[#fff9c4] px-2 py-1 transition-colors"
                      value={item.limit.toLocaleString("en-IN")}
                      onChange={(e) => handleLimitChange(index, e.target.value)}
                      onBlur={() => {
                         // On blur, auto-save limits silently if needed, or wait for close
                      }}
                    />
                  </td>
                  <td className="text-center">
                    <button 
                      onClick={() => removeState(index)}
                      className="text-red-500 font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
              {/* New row for adding a state */}
              <tr className="border-b border-gray-300">
                <td className="py-3 px-4 text-base">
                  <select 
                    className="w-full outline-none bg-transparent font-medium focus:bg-[#fff9c4] focus:border-black border border-transparent px-2 py-1"
                    value={addingState}
                    onChange={handleStateSelect}
                  >
                    <option value="" disabled hidden>Select State...</option>
                    <option value="Any">Any</option>
                    {TALLY_INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4 border-l-2 border-black">
                  <input
                    type="text"
                    disabled
                    className="w-full text-right outline-none bg-transparent text-gray-400 px-2 py-1"
                    value="50,000"
                  />
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t-2 border-black px-6 py-3 flex justify-end">
          <button 
            onClick={handleSaveAndClose}
            className="px-6 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors rounded"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
