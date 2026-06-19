import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../../context/CompanyContext";
import { cn } from "@/lib/utils";

interface GroupRow {
  group_id: number;
  name: string;
  parent_group_id: number | null;
  nature: string | null;
}

interface LedgerRow {
  ledger_id: number;
  name: string;
  group_id: number;
  opening_balance: number;
  nature: string | null;
}

interface TreeNode {
  id: string; // "group-<id>" or "ledger-<id>"
  name: string;
  type: "group" | "ledger";
  debit: number;
  credit: number;
  openingDebit: number;
  openingCredit: number;
  originalId: number;
  children: TreeNode[];
}

interface FlatRow {
  id: string;
  name: string;
  type: "group" | "ledger";
  debit: number;
  credit: number;
  openingDebit: number;
  openingCredit: number;
  originalId: number;
  depth: number;
}

export default function TrialBalance() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [ledgers, setLedgers] = useState<LedgerRow[]>([]);
  const [closingBalances, setClosingBalances] = useState<Record<number, { debit: number; credit: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [isLedgerWise, setIsLedgerWise] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;

  const loadData = useCallback(async () => {
    if (!companyId || !fyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch groups
      const groupRes = await window.api.group.getAll(companyId);
      const groupsData = groupRes.success ? groupRes.groups || [] : [];
      setGroups(groupsData);

      // 2. Fetch ledgers
      const ledgerRes = await window.api.ledger.getAll(companyId);
      const ledgersData = ledgerRes.success ? ledgerRes.ledgers || [] : [];
      setLedgers(ledgersData);

      // 3. Fetch trial balance closing balances
      const tbRes = await window.api.report.trialBalance(companyId, fyId);
      const balances: Record<number, { debit: number; credit: number }> = {};
      if (tbRes.success && tbRes.rows) {
        tbRes.rows.forEach((r: any) => {
          balances[r.ledger_id] = { debit: r.debit || 0, credit: r.credit || 0 };
        });
      }
      setClosingBalances(balances);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, fyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper to determine nature of a ledger/group recursively
  const getNature = useCallback((groupId: number, groupMap: Map<number, GroupRow>): string | null => {
    let current = groupMap.get(groupId);
    while (current) {
      if (current.nature) return current.nature;
      if (current.parent_group_id) {
        current = groupMap.get(current.parent_group_id);
      } else {
        break;
      }
    }
    return null;
  }, []);

  // Compute Tree Nodes
  const { tree, totalDebit, totalCredit, differenceDebit, differenceCredit } = useMemo(() => {
    if (groups.length === 0 && ledgers.length === 0) {
      return {
        tree: [],
        totalDebit: 0,
        totalCredit: 0,
        differenceDebit: 0,
        differenceCredit: 0
      };
    }

    const groupMap = new Map<number, GroupRow>();
    groups.forEach((g) => groupMap.set(g.group_id, g));

    // Calculate opening balances Dr vs Cr
    let sumOpeningDebit = 0;
    let sumOpeningCredit = 0;

    const ledgersWithNature = ledgers.map((l) => {
      const nature = getNature(l.group_id, groupMap);
      let opDebit = 0;
      let opCredit = 0;

      if (l.opening_balance !== 0) {
        if (nature === "Assets" || nature === "Expenses") {
          if (l.opening_balance > 0) opDebit = l.opening_balance;
          else opCredit = Math.abs(l.opening_balance);
        } else {
          if (l.opening_balance > 0) opCredit = l.opening_balance;
          else opDebit = Math.abs(l.opening_balance);
        }
      }

      sumOpeningDebit += opDebit;
      sumOpeningCredit += opCredit;

      return {
        ...l,
        nature,
        opDebit,
        opCredit,
      };
    });

    // Opening balance difference
    let diffDebit = 0;
    let diffCredit = 0;
    if (sumOpeningDebit !== sumOpeningCredit) {
      const diff = Math.abs(sumOpeningDebit - sumOpeningCredit);
      if (sumOpeningDebit > sumOpeningCredit) {
        diffCredit = diff; // Credit side is short, so difference goes to Credit
      } else {
        diffDebit = diff; // Debit side is short
      }
    }

    // Map ledgers and child groups to parents
    const childrenMap = new Map<number | null, { groups: GroupRow[]; ledgers: typeof ledgersWithNature }>();
    const groupIds = new Set(groups.map(g => g.group_id));
    
    groups.forEach((g) => {
      const parent = g.parent_group_id;
      const parentKey = (parent !== null && groupIds.has(parent)) ? parent : null;
      if (!childrenMap.has(parentKey)) {
        childrenMap.set(parentKey, { groups: [], ledgers: [] });
      }
      childrenMap.get(parentKey)!.groups.push(g);
    });

    ledgersWithNature.forEach((l) => {
      const parent = l.group_id;
      const parentKey = groupIds.has(parent) ? parent : null;
      if (!childrenMap.has(parentKey)) {
        childrenMap.set(parentKey, { groups: [], ledgers: [] });
      }
      childrenMap.get(parentKey)!.ledgers.push(l);
    });

    // Recursive tree builder
    const buildNode = (group: GroupRow): TreeNode => {
      const nodeChildren: TreeNode[] = [];
      const direct = childrenMap.get(group.group_id);

      if (direct) {
        direct.groups.forEach((childGroup) => {
          nodeChildren.push(buildNode(childGroup));
        });
        direct.ledgers.forEach((l) => {
          const cb = closingBalances[l.ledger_id] || { debit: 0, credit: 0 };
          nodeChildren.push({
            id: `ledger-${l.ledger_id}`,
            name: l.name,
            type: "ledger",
            debit: cb.debit,
            credit: cb.credit,
            openingDebit: l.opDebit,
            openingCredit: l.opCredit,
            originalId: l.ledger_id,
            children: [],
          });
        });
      }

      // Rollup values
      const debit = nodeChildren.reduce((s, c) => s + c.debit, 0);
      const credit = nodeChildren.reduce((s, c) => s + c.credit, 0);
      const openingDebit = nodeChildren.reduce((s, c) => s + c.openingDebit, 0);
      const openingCredit = nodeChildren.reduce((s, c) => s + c.openingCredit, 0);

      return {
        id: `group-${group.group_id}`,
        name: group.name,
        type: "group",
        debit,
        credit,
        openingDebit,
        openingCredit,
        originalId: group.group_id,
        children: nodeChildren,
      };
    };

    // Primary (root) groups
    const rootNodes: TreeNode[] = [];
    const rootDirect = childrenMap.get(null);
    if (rootDirect) {
      rootDirect.groups.forEach((g) => {
        const node = buildNode(g);
        if (node.debit !== 0 || node.credit !== 0 || node.children.length > 0) {
          rootNodes.push(node);
        }
      });
      rootDirect.ledgers.forEach((l) => {
        const cb = closingBalances[l.ledger_id] || { debit: 0, credit: 0 };
        if (cb.debit !== 0 || cb.credit !== 0) {
          rootNodes.push({
            id: `ledger-${l.ledger_id}`,
            name: l.name,
            type: "ledger",
            debit: cb.debit,
            credit: cb.credit,
            openingDebit: l.opDebit,
            openingCredit: l.opCredit,
            originalId: l.ledger_id,
            children: [],
          });
        }
      });
    }

    // Calculate Grand Totals summing active ledgers directly
    let tDebit = 0;
    let tCredit = 0;
    ledgersWithNature.forEach((l) => {
      const cb = closingBalances[l.ledger_id] || { debit: 0, credit: 0 };
      tDebit += cb.debit;
      tCredit += cb.credit;
    });
    tDebit += diffDebit;
    tCredit += diffCredit;

    return {
      tree: rootNodes,
      totalDebit: tDebit,
      totalCredit: tCredit,
      differenceDebit: diffDebit,
      differenceCredit: diffCredit,
    };
  }, [groups, ledgers, closingBalances, getNature]);

  // Flatten the visible rows based on expand/collapse state or isLedgerWise view
  const visibleRows = useMemo(() => {
    if (isLedgerWise) {
      const rows: FlatRow[] = [];
      const groupMap = new Map<number, GroupRow>();
      groups.forEach((g) => groupMap.set(g.group_id, g));

      ledgers.forEach((l) => {
        const cb = closingBalances[l.ledger_id] || { debit: 0, credit: 0 };
        if (cb.debit !== 0 || cb.credit !== 0) {
          const nature = getNature(l.group_id, groupMap);
          let opDebit = 0;
          let opCredit = 0;
          if (l.opening_balance !== 0) {
            if (nature === "Assets" || nature === "Expenses") {
              if (l.opening_balance > 0) opDebit = l.opening_balance;
              else opCredit = Math.abs(l.opening_balance);
            } else {
              if (l.opening_balance > 0) opCredit = l.opening_balance;
              else opDebit = Math.abs(l.opening_balance);
            }
          }
          rows.push({
            id: `ledger-${l.ledger_id}`,
            name: l.name,
            type: "ledger",
            debit: cb.debit,
            credit: cb.credit,
            openingDebit: opDebit,
            openingCredit: opCredit,
            originalId: l.ledger_id,
            depth: 0,
          });
        }
      });

      // Sort alphabetically by name
      rows.sort((a, b) => a.name.localeCompare(b.name));

      // Add Difference in opening balances row if present
      if (differenceDebit > 0 || differenceCredit > 0) {
        rows.push({
          id: "diff-opening-balances",
          name: "Difference in opening balances",
          type: "ledger",
          debit: differenceDebit,
          credit: differenceCredit,
          openingDebit: differenceDebit,
          openingCredit: differenceCredit,
          originalId: 0,
          depth: 0,
        });
      }
      return rows;
    }

    const rows: FlatRow[] = [];
    const recurse = (nodes: TreeNode[], depth = 0) => {
      nodes.forEach((n) => {
        rows.push({
          id: n.id,
          name: n.name,
          type: n.type,
          debit: n.debit,
          credit: n.credit,
          openingDebit: n.openingDebit,
          openingCredit: n.openingCredit,
          originalId: n.originalId,
          depth,
        });
        if (n.type === "group" && expandedNodes[n.id]) {
          recurse(n.children, depth + 1);
        }
      });
    };
    recurse(tree);

    // Add Difference in opening balances row if present
    if (differenceDebit > 0 || differenceCredit > 0) {
      rows.push({
        id: "diff-opening-balances",
        name: "Difference in opening balances",
        type: "ledger",
        debit: differenceDebit,
        credit: differenceCredit,
        openingDebit: differenceDebit,
        openingCredit: differenceCredit,
        originalId: 0,
        depth: 0,
      });
    }

    return rows;
  }, [tree, expandedNodes, differenceDebit, differenceCredit, isLedgerWise, ledgers, closingBalances, groups, getNature]);

  const toggleExpand = useCallback((rowId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  }, []);

  const handleRowAction = useCallback(
    (row: FlatRow) => {
      if (row.type === "group") {
        toggleExpand(row.id);
      } else if (row.type === "ledger" && row.originalId > 0) {
        navigate(`/reports/accounts/ledger?ledger_id=${row.originalId}`);
      }
    },
    [toggleExpand, navigate]
  );

  // Clamp focusedIndex safely if visibleRows length changes
  useEffect(() => {
    setFocusedIndex((prev) => {
      if (visibleRows.length === 0) return 0;
      return Math.min(Math.max(prev, 0), visibleRows.length - 1);
    });
  }, [visibleRows]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, visibleRows.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === "Enter") {
        const row = visibleRows[focusedIndex];
        if (row) {
          e.preventDefault();
          handleRowAction(row);
        }
      }
      if (e.shiftKey && e.key === "Enter") {
        const row = visibleRows[focusedIndex];
        if (row && row.type === "group") {
          e.preventDefault();
          toggleExpand(row.id);
        }
      }
      if (e.key === "F1") {
        e.preventDefault();
        if (e.altKey) {
          // Alt+F1: Detailed (expand all)
          const allExpanded: Record<string, boolean> = {};
          const recurse = (nodes: TreeNode[]) => {
            nodes.forEach(n => {
              if (n.type === "group") {
                allExpanded[n.id] = true;
                recurse(n.children);
              }
            });
          };
          recurse(tree);
          setExpandedNodes(allExpanded);
        } else {
          // F1: Condensed (collapse all)
          setExpandedNodes({});
        }
      }
      if (e.key === "F5" || e.key === "f5") {
        e.preventDefault();
        setIsLedgerWise((prev) => !prev);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [visibleRows, focusedIndex, handleRowAction, toggleExpand, tree, navigate]);

  const formatCurrency = (val: number) => {
    if (val === 0) return "";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const companyName = selectedCompany?.name || "Moly Jain";
  const periodLabel = activeFY?.start_date ? new Date(activeFY.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "1-Apr-26";

  return (
    <div className="flex flex-col h-screen w-screen bg-white select-none text-zinc-900 font-mono text-[11px]">
      {/* Top Application Header */}
      <div className="bg-[#0b2e27] text-white px-3 py-1 flex items-center justify-between border-b border-[#08221d] shrink-0 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="font-bold tracking-wider text-sky-400">TallyPrime</span>
          <span className="bg-[#ffcc00] text-black px-1 rounded-[2px] font-bold text-[8px]">EDU</span>
        </div>
        <div className="flex items-center gap-4 text-emerald-200">
          <span><span className="underline">K</span>: Company</span>
          <span><span className="underline">Y</span>: Data</span>
          <span><span className="underline">Z</span>: Exchange</span>
          <span className="bg-[#cbe2ec] text-[#0b2e27] px-1 font-bold">G: Go To</span>
          <span><span className="underline">O</span>: Import</span>
          <span><span className="underline">E</span>: Export</span>
          <span><span className="underline">M</span>: Share</span>
          <span><span className="underline">P</span>: Print</span>
          <span><span className="underline">F1</span>: Help</span>
        </div>
      </div>

      {/* Page Title Bar */}
      <div className="bg-[#cbe2ec] border-b border-[#a8c6d1] px-3 py-1.5 flex items-center justify-between shrink-0 text-[#002d40]">
        <div className="font-bold text-sm">Trial Balance</div>
        <div className="font-bold text-sm">{companyName}</div>
        <div className="text-[10px] text-zinc-500">Gateway of Tally</div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Table container */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#ecf4f7] text-[#002d40] z-10 border-b border-[#a8c6d1] text-[10px]">
                <tr className="border-b border-[#a8c6d1]">
                  <th rowSpan={3} className="text-left px-3 py-2 font-bold w-[60%] border-r border-[#a8c6d1] align-bottom">
                    Particulars
                  </th>
                  <th colSpan={2} className="text-center px-3 py-1 font-bold">
                    {companyName}
                  </th>
                </tr>
                <tr className="border-b border-[#a8c6d1]">
                  <th colSpan={2} className="text-center px-3 py-0.5 font-normal text-zinc-500">
                    For {periodLabel}
                  </th>
                </tr>
                <tr className="border-b border-[#a8c6d1]">
                  <th colSpan={2} className="text-center px-3 py-1 font-bold">
                    Closing Balance
                  </th>
                </tr>
                <tr className="bg-[#ecf4f7] border-b border-[#a8c6d1]">
                  <th className="border-r border-[#a8c6d1]"></th>
                  <th className="text-right px-3 py-1 font-bold w-[20%] border-r border-[#a8c6d1]">Debit</th>
                  <th className="text-right px-3 py-1 font-bold w-[20%]">Credit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-zinc-400 italic">
                      Loading Trial Balance data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-red-500 italic">
                      Error: {error}
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-zinc-400 italic">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row, idx) => {
                    const isFocused = idx === focusedIndex;
                    const indentStyles = { paddingLeft: `${row.depth * 16 + 12}px` };

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setFocusedIndex(idx)}
                        onDoubleClick={() => handleRowAction(row)}
                        className={cn(
                          "border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer text-[12px] h-6",
                          isFocused ? "bg-[#ffcc00] text-black font-bold" : "",
                          row.type === "group" && !isFocused ? "font-bold text-zinc-900" : "text-zinc-700"
                        )}
                      >
                        <td className="py-0.5 border-r border-zinc-100 align-middle" style={indentStyles}>
                          {row.type === "group" && (
                            <span className="mr-1 text-zinc-400">
                              {expandedNodes[row.id] ? "▼" : "▶"}
                            </span>
                          )}
                          {row.name}
                        </td>
                        <td className="px-3 py-0.5 text-right border-r border-zinc-100 align-middle">
                          {formatCurrency(row.debit)}
                        </td>
                        <td className="px-3 py-0.5 text-right align-middle">
                          {formatCurrency(row.credit)}
                        </td>
                      </tr>
                    );
                  })
                )}
                {/* Grand Total Row */}
                <tr className="bg-[#ecf4f7] border-t border-[#a8c6d1] border-b-2 border-double border-zinc-800 font-bold text-zinc-900 text-[12px] h-7">
                  <td className="px-3 py-1 text-left uppercase align-middle">Grand Total</td>
                  <td className="px-3 py-1 text-right border-r border-[#a8c6d1] align-middle">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="px-3 py-1 text-right align-middle">
                    {formatCurrency(totalCredit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Bar Controls */}
          <div className="bg-[#cbe2ec] border-t border-[#a8c6d1] px-3 py-1 flex items-center gap-6 shrink-0 text-[#002d40] text-[10px]">
            <span><span className="font-bold">Q</span>: Quit</span>
            <span><span className="font-bold">Space</span>: Select</span>
            <span><span className="font-bold">R</span>: Remove Line</span>
            <span><span className="font-bold">U</span>: Restore Line</span>
            <span className="ml-auto"><span className="font-bold">F12</span>: Configure</span>
          </div>
        </div>

        {/* Right Button Panel */}
        <div className="w-[120px] bg-[#cbe2ec] border-l border-[#a8c6d1] flex flex-col p-1 gap-1 shrink-0 text-[#002d40] text-[10px] font-bold">
          <button onClick={() => setExpandedNodes({})} className="w-full text-left p-1 border border-[#9cbac7] bg-[#d9ecf5] hover:bg-[#b0d4e5]">
            F1: Condensed
          </button>
          <button
            onClick={() => {
              const allExpanded: Record<string, boolean> = {};
              const recurse = (nodes: TreeNode[]) => {
                nodes.forEach(n => {
                  if (n.type === "group") {
                    allExpanded[n.id] = true;
                    recurse(n.children);
                  }
                });
              };
              recurse(tree);
              setExpandedNodes(allExpanded);
            }}
            className="w-full text-left p-1 border border-[#9cbac7] bg-[#d9ecf5] hover:bg-[#b0d4e5]"
          >
            Alt+F1: Detailed
          </button>
          <button className="w-full text-left p-1 border border-[#9cbac7] bg-[#d9ecf5] hover:bg-[#b0d4e5]">
            F2: Period
          </button>
          <button className="w-full text-left p-1 border border-[#9cbac7] bg-[#d9ecf5] hover:bg-[#b0d4e5]">
            F3: Company
          </button>
          <button className="w-full text-left p-1 border border-[#9cbac7] bg-[#d9ecf5] hover:bg-[#b0d4e5]">
            F4: Group
          </button>
          <button
            onClick={() => setIsLedgerWise((prev) => !prev)}
            className="w-full text-left p-1 border border-[#9cbac7] bg-[#d9ecf5] hover:bg-[#b0d4e5]"
          >
            F5: {isLedgerWise ? "Group-wise" : "Ledger-wise"}
          </button>
          <div className="flex-1"></div>
          <button onClick={() => navigate("/")} className="w-full text-left p-1 border border-[#9cbac7] bg-[#d9ecf5] hover:bg-[#b0d4e5] text-red-700">
            Esc: Quit
          </button>
        </div>
      </div>
    </div>
  );
}
