import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCompany } from "../../../context/CompanyContext";
import type {
  StockGroupType,
  StockCategoryType,
  StockItemType,
  UnitType,
  GodownType,
} from "../../../types/api";

// ─── helpers ──────────────────────────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td className={`px-4 py-2.5 text-sm border-b border-zinc-50 dark:border-zinc-800/60 whitespace-nowrap ${muted ? "text-zinc-400" : "text-zinc-700 dark:text-zinc-300"}`}>
      {children}
    </td>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-zinc-400">
      {message}
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </div>
  );
}

// ─── section tables ───────────────────────────────────────────────────────────

function StockGroupTable({ groups }: { groups: StockGroupType[] }) {
  const parentName = (id?: number) => groups.find(g => g.sg_id === id)?.name ?? "Primary";
  if (groups.length === 0) return <EmptyRow message="No stock groups found." />;
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Name</Th><Th>Alias</Th><Th>Under</Th><Th>Add Quantities</Th>
          <Th>HSN / SAC</Th><Th>HSN Description</Th>
          <Th>GST %</Th><Th>CGST %</Th><Th>SGST %</Th>
          <Th>Primary</Th><Th>Predefined</Th><Th>Created At</Th>
        </tr>
      </thead>
      <tbody>
        {groups.map(g => (
          <tr key={g.sg_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
            <Td><span className="font-medium text-zinc-800 dark:text-zinc-200">{g.name}</span></Td>
            <Td muted>{g.alias ?? "—"}</Td>
            <Td muted>{parentName(g.parent_group_id)}</Td>
            <Td muted>{g.should_quantities_be_added ? "Yes" : "No"}</Td>
            <Td muted>{g.hsn_sac_code ?? "—"}</Td>
            <Td muted>{g.hsn_sac_description ?? "—"}</Td>
            <Td muted>{g.gst_rate ?? 0}%</Td>
            <Td muted>{g.cgst_rate ?? 0}%</Td>
            <Td muted>{g.sgst_rate ?? 0}%</Td>
            <Td muted>{g.is_primary ? "Yes" : "No"}</Td>
            <Td muted>{g.is_predefined ? "Yes" : "No"}</Td>
            <Td muted>{g.created_at ? new Date(g.created_at).toLocaleDateString() : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

function StockCategoryTable({ categories }: { categories: StockCategoryType[] }) {
  const parentName = (id?: number) => categories.find(c => c.sc_id === id)?.name ?? "Primary";
  if (categories.length === 0) return <EmptyRow message="No stock categories found." />;
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Name</Th><Th>Under</Th><Th>Description</Th>
          <Th>Active</Th><Th>Created At</Th><Th>Updated At</Th>
        </tr>
      </thead>
      <tbody>
        {categories.map(c => (
          <tr key={c.sc_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
            <Td><span className="font-medium text-zinc-800 dark:text-zinc-200">{c.name}</span></Td>
            <Td muted>{parentName(c.parent_category_id)}</Td>
            <Td muted>{c.description ?? "—"}</Td>
            <Td muted>{c.is_active ? "Yes" : "No"}</Td>
            <Td muted>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</Td>
            <Td muted>{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

function StockItemTable({ items, groups, categories, units }: {
  items: StockItemType[];
  groups: StockGroupType[];
  categories: StockCategoryType[];
  units: UnitType[];
}) {
  const groupName    = (id?: number) => groups.find(g => g.sg_id === id)?.name ?? "—";
  const categoryName = (id?: number) => categories.find(c => c.sc_id === id)?.name ?? "—";
  const unitName     = (id?: number) => units.find(u => u.unit_id === id)?.name ?? "—";
  if (items.length === 0) return <EmptyRow message="No stock items found." />;
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Name</Th><Th>Alias</Th><Th>Group</Th><Th>Category</Th><Th>Unit</Th>
          <Th>HSN</Th><Th>SAC</Th>
          <Th>GST %</Th><Th>CGST %</Th><Th>SGST %</Th><Th>IGST %</Th>
          <Th>Type of Supply</Th>
          <Th>Opening Qty</Th><Th>Opening Rate</Th><Th>Opening Value</Th>
          <Th>Reorder Level</Th><Th>Reorder Qty</Th>
          <Th>Track Batches</Th><Th>Track Expiry</Th>
          <Th>Created At</Th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.item_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
            <Td><span className="font-medium text-zinc-800 dark:text-zinc-200">{item.name}</span></Td>
            <Td muted>{item.alias ?? "—"}</Td>
            <Td muted>{groupName(item.group_id)}</Td>
            <Td muted>{categoryName(item.category_id)}</Td>
            <Td muted>{unitName(item.unit_id)}</Td>
            <Td muted>{item.hsn_code ?? "—"}</Td>
            <Td muted>{item.sac_code ?? "—"}</Td>
            <Td muted>{item.gst_rate ?? 0}%</Td>
            <Td muted>{item.cgst_rate ?? 0}%</Td>
            <Td muted>{item.sgst_rate ?? 0}%</Td>
            <Td muted>{item.igst_rate ?? 0}%</Td>
            <Td muted>{item.type_of_supply ?? "—"}</Td>
            <Td muted>{item.opening_quantity ?? 0}</Td>
            <Td muted>{item.opening_rate ?? 0}</Td>
            <Td muted>{item.opening_value ?? 0}</Td>
            <Td muted>{item.reorder_level ?? "—"}</Td>
            <Td muted>{item.reorder_quantity ?? "—"}</Td>
            <Td muted>{item.track_batches ? "Yes" : "No"}</Td>
            <Td muted>{item.track_expiry ? "Yes" : "No"}</Td>
            <Td muted>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

function UnitTable({ units }: { units: UnitType[] }) {
  if (units.length === 0) return <EmptyRow message="No units found." />;
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Name</Th><Th>Symbol</Th><Th>Formal Name</Th><Th>Type</Th>
          <Th>Decimal Places</Th><Th>UQC</Th>
          <Th>Simple</Th><Th>Predefined</Th>
          <Th>Created At</Th><Th>Updated At</Th>
        </tr>
      </thead>
      <tbody>
        {units.map(u => (
          <tr key={u.unit_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
            <Td><span className="font-medium text-zinc-800 dark:text-zinc-200">{u.name}</span></Td>
            <Td muted>{u.symbol}</Td>
            <Td muted>{u.formal_name ?? "—"}</Td>
            <Td muted>{u.unit_type ?? "—"}</Td>
            <Td muted>{u.decimal_places ?? 0}</Td>
            <Td muted>{u.unit_quantity_code ?? "—"}</Td>
            <Td muted>{u.is_simple ? "Yes" : "No"}</Td>
            <Td muted>{u.is_predefined ? "Yes" : "No"}</Td>
            <Td muted>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</Td>
            <Td muted>{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

function GodownTable({ godowns }: { godowns: GodownType[] }) {
  const parentName = (id?: number) => godowns.find(g => g.godown_id === id)?.name ?? "Primary";
  if (godowns.length === 0) return <EmptyRow message="No godowns found." />;
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Name</Th><Th>Alias</Th><Th>Under</Th>
          <Th>Address</Th><Th>City</Th><Th>State</Th><Th>Pincode</Th>
          <Th>Main Location</Th><Th>Allows Storage</Th>
          <Th>Primary</Th><Th>Predefined</Th>
          <Th>Created At</Th><Th>Updated At</Th>
        </tr>
      </thead>
      <tbody>
        {godowns.map(g => (
          <tr key={g.godown_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
            <Td>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{g.name}</span>
              {g.is_main_location ? (
                <span className="ml-2 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">main</span>
              ) : null}
            </Td>
            <Td muted>{g.alias ?? "—"}</Td>
            <Td muted>{parentName(g.parent_godown_id)}</Td>
            <Td muted>{g.address ?? "—"}</Td>
            <Td muted>{g.city ?? "—"}</Td>
            <Td muted>{g.state ?? "—"}</Td>
            <Td muted>{g.pincode ?? "—"}</Td>
            <Td muted>{g.is_main_location ? "Yes" : "No"}</Td>
            <Td muted>{g.allow_storage_of_materials ? "Yes" : "No"}</Td>
            <Td muted>{g.is_primary ? "Yes" : "No"}</Td>
            <Td muted>{g.is_predefined ? "Yes" : "No"}</Td>
            <Td muted>{g.created_at ? new Date(g.created_at).toLocaleDateString() : "—"}</Td>
            <Td muted>{g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

// ─── section config ───────────────────────────────────────────────────────────

const SECTIONS = [
  { key: "stock-group",    label: "Stock Groups"       },
  { key: "stock-category", label: "Stock Categories"   },
  { key: "stock-items",    label: "Stock Items"         },
  { key: "unit",           label: "Units"               },
  { key: "godown",         label: "Godowns"             },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

// ─── main ─────────────────────────────────────────────────────────────────────

export default function InventoryMastersList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCompany } = useCompany();

  const activeSection = (searchParams.get("section") ?? "stock-group") as SectionKey;

  const [stockGroups,     setStockGroups]     = useState<StockGroupType[]>([]);
  const [stockCategories, setStockCategories] = useState<StockCategoryType[]>([]);
  const [stockItems,      setStockItems]      = useState<StockItemType[]>([]);
  const [units,           setUnits]           = useState<UnitType[]>([]);
  const [godowns,         setGodowns]         = useState<GodownType[]>([]);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const company_id = selectedCompany?.company_id;
      if (!company_id) return;
      setLoading(true);
      try {
        const [sg, sc, si, u, gd] = await Promise.all([
          window.api.stockGroup.getAll(company_id),
          window.api.stockCategory.getAll(company_id),
          window.api.stockItem.getAll(company_id),
          window.api.unit.getAll(company_id),
          window.api.godown.getAll(company_id),
        ]);
        if (sg.success) setStockGroups(sg.stockGroups ?? []);
        if (sc.success) setStockCategories(sc.stockCategories ?? []);
        if (si.success) setStockItems(si.stockItems ?? []);
        if (u.success)  setUnits(u.units ?? []);
        if (gd.success) setGodowns(gd.godowns ?? []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCompany]);

  const counts: Record<SectionKey, number> = {
    "stock-group":    stockGroups.length,
    "stock-category": stockCategories.length,
    "stock-items":    stockItems.length,
    "unit":           units.length,
    "godown":         godowns.length,
  };

  const activeLabel = SECTIONS.find(s => s.key === activeSection)?.label ?? "";

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 py-3 flex items-center justify-between shrink-0 border-b border-zinc-100 dark:border-zinc-800">
        <span className="font-semibold text-base">{activeLabel}</span>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-3 shrink-0 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSearchParams({ section: s.key })}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-t border-b-2 transition-colors whitespace-nowrap ${
              activeSection === s.key
                ? "border-zinc-800 dark:border-zinc-200 text-zinc-800 dark:text-zinc-100 font-medium"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            {s.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeSection === s.key
                ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
            }`}>
              {counts[s.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-zinc-400">Loading...</div>
        ) : (
          <>
            {activeSection === "stock-group"    && <StockGroupTable    groups={stockGroups} />}
            {activeSection === "stock-category" && <StockCategoryTable categories={stockCategories} />}
            {activeSection === "stock-items"    && <StockItemTable     items={stockItems} groups={stockGroups} categories={stockCategories} units={units} />}
            {activeSection === "unit"           && <UnitTable          units={units} />}
            {activeSection === "godown"         && <GodownTable        godowns={godowns} />}
          </>
        )}
      </div>

    </div>
  );
}