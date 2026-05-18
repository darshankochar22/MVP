import { useEffect, useState } from "react";
import { useCompany } from "../src/context/CompanyContext";

export default function LeftPanel() {
  const [currentTime, setCurrentTime] = useState("");
  const { selectedCompany } = useCompany();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "medium",
        })
      );
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const periodLabel = selectedCompany?.financial_year_beginning_from
    ? (() => {
        const fyStart = selectedCompany.financial_year_beginning_from;
        const [y] = fyStart.split("-");
        const nextY = y ? String(Number(y) + 1) : "";
        return `1-Apr-${y} to 31-Mar-${nextY}`;
      })()
    : "No period set";

  return (
    <div className="rounded h-full px-4 py-3 flex flex-col gap-4 w-full">

      <div className="flex flex-row justify-between gap-6">
        <div className="flex flex-col">
          <span className="text-sm">CURRENT PERIOD</span>
          <span>{periodLabel}</span>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-sm">CURRENT DATE</span>
          <span>{currentTime}</span>
        </div>
      </div>

      <div className="flex flex-row justify-between gap-6">
        <div className="flex flex-col">
          <span className="text-sm">NAME OF COMPANY</span>
          <span>{selectedCompany?.name ?? "—"}</span>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-sm">DATE OF LAST ENTRY</span>
          <span>{currentTime}</span>
        </div>
      </div>

    </div>
  );
}