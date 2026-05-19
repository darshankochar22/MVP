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


function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold text-black uppercase tracking-wider bg-gray-100 border-b border-gray-300 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-2.5 text-sm border-b border-gray-100 whitespace-nowrap text-black">
      {children}
    </td>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">
      {message}
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </div>
  );
}


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
          <tr key={g.sg_id} className="hover:bg-gray-50 transition-colors">
            <Td><span className="font-medium">{g.name}</span></Td>
            <Td>{g.alias ?? "—"}</Td>
            <Td>{parentName(g.parent_group_id)}</Td>
            <Td>{g.should_quantities_be_added ? "Yes" : "No"}</Td>
            <Td>{g.hsn_sac_code ?? "—"}</Td>
            <Td>{g.hsn_sac_description ?? "—"}</Td>
            <Td>{g.gst_rate ?? 0}%</Td>
            <Td>{g.cgst_rate ?? 0}%</Td>
            <Td>{g.sgst_rate ?? 0}%</Td>
            <Td>{g.is_primary ? "Yes" : "No"}</Td>
            <Td>{g.is_predefined ? "Yes" : "No"}</Td>
            <Td>{g.created_at ? new Date(g.created_at).toLocaleDateString() : "—"}</Td>
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
          <tr key={c.sc_id} className="hover:bg-gray-50 transition-colors">
            <Td><span className="font-medium">{c.name}</span></Td>
            <Td>{parentName(c.parent_category_id)}</Td>
            <Td>{c.description ?? "—"}</Td>
            <Td>{c.is_active ? "Yes" : "No"}</Td>
            <Td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</Td>
            <Td>{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "—"}</Td>
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
          <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
            <Td><span className="font-medium">{item.name}</span></Td>
            <Td>{item.alias ?? "—"}</Td>
            <Td>{groupName(item.group_id)}</Td>
            <Td>{categoryName(item.category_id)}</Td>
            <Td>{unitName(item.unit_id)}</Td>
            <Td>{item.hsn_code ?? "—"}</Td>
            <Td>{item.sac_code ?? "—"}</Td>
            <Td>{item.gst_rate ?? 0}%</Td>
            <Td>{item.cgst_rate ?? 0}%</Td>
            <Td>{item.sgst_rate ?? 0}%</Td>
            <Td>{item.igst_rate ?? 0}%</Td>
            <Td>{item.type_of_supply ?? "—"}</Td>
            <Td>{item.opening_quantity ?? 0}</Td>
            <Td>{item.opening_rate ?? 0}</Td>
            <Td>{item.opening_value ?? 0}</Td>
            <Td>{item.reorder_level ?? "—"}</Td>
            <Td>{item.reorder_quantity ?? "—"}</Td>
            <Td>{item.track_batches ? "Yes" : "No"}</Td>
            <Td>{item.track_expiry ? "Yes" : "No"}</Td>
            <Td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</Td>
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
          <tr key={u.unit_id} className="hover:bg-gray-50 transition-colors">
            <Td><span className="font-medium">{u.name}</span></Td>
            <Td>{u.symbol}</Td>
            <Td>{u.formal_name ?? "—"}</Td>
            <Td>{u.unit_type ?? "—"}</Td>
            <Td>{u.decimal_places ?? 0}</Td>
            <Td>{u.unit_quantity_code ?? "—"}</Td>
            <Td>{u.is_simple ? "Yes" : "No"}</Td>
            <Td>{u.is_predefined ? "Yes" : "No"}</Td>
            <Td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</Td>
            <Td>{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : "—"}</Td>
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
          <tr key={g.godown_id} className="hover:bg-gray-50 transition-colors">
            <Td>
              <span className="font-medium">{g.name}</span>
              {g.is_main_location ? (
                <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">main</span>
              ) : null}
            </Td>
            <Td>{g.alias ?? "—"}</Td>
            <Td>{parentName(g.parent_godown_id)}</Td>
            <Td>{g.address ?? "—"}</Td>
            <Td>{g.city ?? "—"}</Td>
            <Td>{g.state ?? "—"}</Td>
            <Td>{g.pincode ?? "—"}</Td>
            <Td>{g.is_main_location ? "Yes" : "No"}</Td>
            <Td>{g.allow_storage_of_materials ? "Yes" : "No"}</Td>
            <Td>{g.is_primary ? "Yes" : "No"}</Td>
            <Td>{g.is_predefined ? "Yes" : "No"}</Td>
            <Td>{g.created_at ? new Date(g.created_at).toLocaleDateString() : "—"}</Td>
            <Td>{g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}


const SECTIONS = [
  { key: "stock-group",    label: "Stock Groups"     },
  { key: "stock-category", label: "Stock Categories" },
  { key: "stock-items",    label: "Stock Items"      },
  { key: "unit",           label: "Units"            },
  { key: "godown",         label: "Godowns"          },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

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
    <div className="flex flex-col h-full bg-white">

      {/* Header */}
      <div className="px-6 py-3 flex items-center justify-between shrink-0 border-b border-gray-200">
        <span className="font-semibold text-base text-black">{activeLabel}</span>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-gray-500 hover:text-black transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-3 shrink-0 border-b border-gray-200 overflow-x-auto bg-white">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSearchParams({ section: s.key })}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-t border-b-2 transition-colors whitespace-nowrap ${
              activeSection === s.key
                ? "border-black text-black font-semibold"
                : "border-transparent text-gray-400 hover:text-black"
            }`}
          >
            {s.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              activeSection === s.key
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-500"
            }`}>
              {counts[s.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-5 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading...</div>
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