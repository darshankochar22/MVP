import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import type { DaybookEntry } from "../../types/api";

export default function Daybook() {
  const [entries, setEntries] = useState<DaybookEntry[]>([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });

  useEffect(() => {
    async function fetchDaybook() {
      try {
        const data = await window.api.voucher.getDaybook({});
        setEntries(data || []);
        
        let debit = 0;
        let credit = 0;
        (data || []).forEach((entry: DaybookEntry) => {
          debit += Number(entry.debit) || 0;
          credit += Number(entry.credit) || 0;
        });
        setTotals({ debit, credit });
      } catch (err) {
        console.error("Failed to fetch daybook:", err);
      }
    }
    fetchDaybook();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <Link to="/" className="px-4 py-2">
        ← Back
      </Link>

      <div className="mt-4 bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h1 className="text-lg font-semibold text-gray-800">Day Book</h1>
          <div className="text-right">
            <p className="text-xs ">Date</p>
            <p className="text-sm font-medium text-gray-700">11-May-2026</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase">
                <th className="px-4 py-2 text-left border ">Date</th>
                <th className="px-4 py-2 text-left border ">Particulars</th>
                <th className="px-4 py-2 text-left border ">Vch Type</th>
                <th className="px-4 py-2 text-left border ">Vch No.</th>
                <th className="px-4 py-2 text-right border ">Debit Amount</th>
                <th className="px-4 py-2 text-right border ">Credit Amount</th>
              </tr>
              <tr className="text-xs">
                <td colSpan={4} className="px-4 py-1 border "></td>
                <td className="px-4 py-1 text-right border ">Inwards Qty</td>
                <td className="px-4 py-1 text-right border ">Outwards Qty</td>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 border ">{entry.date}</td>
                  <td className="px-4 py-3 border ">{entry.particulars}</td>
                  <td className="px-4 py-3 border ">
                    <span className="text-xs px-2 py-1 rounded">
                      {entry.vchType}
                    </span>
                  </td>
                  <td className="px-4 py-3 border ">{entry.vchNo}</td>
                  <td className="px-4 py-3 text-right border ">{entry.debit ? entry.debit : "—"}</td>
                  <td className="px-4 py-3 text-right border ">{entry.credit ? entry.credit : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium text-sm">
                <td colSpan={4} className="px-4 py-2 text-right border">Total</td>
                <td className="px-4 py-2 text-right border ">{totals.debit || "—"}</td>
                <td className="px-4 py-2 text-right border ">{totals.credit || "—"}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}