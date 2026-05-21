import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCompany } from "@/context/CompanyContext";
import GatewayLayout from "@/components/GatewayLayout.tsx";

export default function COA() {
  const { selectedCompany } = useCompany();
  const [masterSections, setMasterSections] = useState<{ title: string; items: string[] }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const companyId = selectedCompany?.company_id;
    if (!companyId) return;
    async function fetchMenu() {
      try {
        const data = await window.api.master.getMenu(companyId);
        if (data && data.success) {
          setMasterSections(data.menu);
        }
      } catch (err) {
        console.error("Failed to fetch master menu:", err);
      }
    }
    fetchMenu();
  }, [selectedCompany]);

  const getRoute = (item: string) => {
    const map: Record<string, string> = {
      Ledger: "/master/coa/ledger",
      Group: "/master/coa/group",
      Currency: "/data/currency",
      "Voucher Type": "/data/voucherType",
      "Cost Centre": "/data/costCentre",
      "Stock Group": "/master/coa/stock-group",
      "Stock Category": "/master/coa/stock-category",
      "Stock Items": "/master/coa/stock-group", // Combined Groups & Items Tree
      Unit: "/master/coa/unit",
      Location: "/master/coa/godown",
      "GST Registration": "/data/gstRegistration",
      "GST Classification": "/data/gstClassification",
      "Employee Group": "/data/employeeGroup",
      Employee: "/data/employee",
      "Attendance Type": "/data/attendanceType",
      "Pay Head": "/data/payHead",
      "Payroll Unit": "/data/payrollUnit",
      "Salary Structure": "/data/salaryStructure",
    };
    return map[item] ?? null;
  };

  return (
    <GatewayLayout>
      <div className="w-full max-w-md border border-zinc-200 rounded bg-white shadow-xs p-6 flex flex-col gap-6 select-none font-sans">
        
        {/* Header */}
        <div className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-150 pb-2 flex justify-between items-center">
          <span>Chart of Accounts</span>
          <span className="text-[9px] bg-zinc-900 text-white px-1.5 py-0.5 rounded font-mono">COA Menu</span>
        </div>

        {/* Menu Sections with custom scroll area */}
        <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
          {masterSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1.5">
              
              {/* Section Header */}
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {section.title}
              </div>

              {/* Section Items */}
              {section.items.length > 0 && (
                <div className="flex flex-col pl-2 gap-1 border-l border-zinc-150 ml-1">
                  {section.items.map((item) => {
                    const route = getRoute(item);
                    const isSelectable = !!route;

                    const btnClass = `w-full text-left px-2.5 py-1.5 text-xs rounded transition-all select-none ${
                      isSelectable
                        ? "text-zinc-800 hover:bg-zinc-900 hover:text-white cursor-pointer font-medium"
                        : "text-zinc-300 cursor-not-allowed opacity-40 font-normal"
                    }`;

                    return (
                      <button
                        key={item}
                        onClick={() => {
                          if (route) navigate(route);
                        }}
                        disabled={!isSelectable}
                        className={btnClass}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </GatewayLayout>
  );
}
