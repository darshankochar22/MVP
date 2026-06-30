import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FullScreenPanel from "@/components/ui/FullScreenPanel";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DataTable, { type TableColumn } from "@/components/ui/DataTable";
import { useCompany } from "@/context/CompanyContext";
import type { IntegrationStatus } from "@/types/api/GstIntegrations";

const TABS = [
  { value: "einvoice", label: "e-Invoice" },
  { value: "eway", label: "e-Way Bill" },
  { value: "filing", label: "GST Filing" },
];

function StatusBar({ status }: { status: IntegrationStatus | null }) {
  if (!status) return null;
  return (
    <div className="flex items-center gap-4 px-3 py-1.5 border-b border-zinc-200 bg-zinc-50 text-[11px] text-zinc-600">
      <span>Status: <span className="font-semibold text-zinc-900">{status.configured ? "Connected" : "Not configured"}</span></span>
      {status.gstin && <span>GSTIN: {status.gstin}</span>}
      <span>Mode: {status.sandbox === false ? "production" : "sandbox"}</span>
      {!status.configured && <span className="text-zinc-500">— set the GST_* variables in .env</span>}
    </div>
  );
}

// ---- e-Invoice tab ----------------------------------------------------------
function EInvoiceTab({ companyId }: { companyId: number }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [st, rec] = await Promise.all([window.api.eInvoice.getStatus(companyId), window.api.eInvoice.getRecords(companyId)]);
    setStatus(st);
    setRows(rec.success ? rec.records : []);
    setLoading(false);
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  const cols: TableColumn[] = [
    { key: "invoice_number", label: "Invoice", span: "col-span-2" },
    { key: "invoice_date", label: "Date", span: "col-span-2" },
    { key: "irn", label: "IRN", span: "col-span-4", render: (r) => <span className="truncate" title={r.irn || ""}>{r.irn || "—"}</span> },
    { key: "ack_no", label: "Ack No", span: "col-span-2", render: (r) => r.ack_no || "—" },
    { key: "status", label: "Status", span: "col-span-2", render: (r) => <span className={r.status === "CANCELLED" ? "font-bold" : ""}>{r.status}</span> },
  ];

  return (
    <div>
      <StatusBar status={status} />
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-zinc-500">{rows.length} IRN(s). Generate an e-Invoice from a sales voucher (Voucher View → e-Invoice).</span>
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
        </div>
        <DataTable columns={cols} rows={rows} rowKey={(r) => r.irn_id} loading={loading} variant="report" emptyMessage="No e-Invoices generated yet." />
      </div>
    </div>
  );
}

// ---- e-Way Bill tab ---------------------------------------------------------
function EwayTab({ companyId }: { companyId: number }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [st, rec] = await Promise.all([window.api.ewayBill.getStatus(companyId), window.api.ewayBill.getRecords(companyId)]);
    setStatus(st);
    setRows(rec.success ? rec.records : []);
    setLoading(false);
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  const cols: TableColumn[] = [
    { key: "ewb_no", label: "EWB No", span: "col-span-3" },
    { key: "ewb_date", label: "Date", span: "col-span-2", render: (r) => r.ewb_date || "—" },
    { key: "valid_upto", label: "Valid Upto", span: "col-span-3", render: (r) => r.valid_upto || "—" },
    { key: "irn", label: "IRN", span: "col-span-2", render: (r) => <span className="truncate" title={r.irn || ""}>{r.irn ? "linked" : "—"}</span> },
    { key: "status", label: "Status", span: "col-span-2", render: (r) => <span className={r.status === "CANCELLED" ? "font-bold" : ""}>{r.status}</span> },
  ];

  return (
    <div>
      <StatusBar status={status} />
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-zinc-500">{rows.length} e-Way Bill(s). Generate from a sales voucher (Voucher View → e-Way Bill).</span>
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
        </div>
        <DataTable columns={cols} rows={rows} rowKey={(r) => r.ewb_id} loading={loading} variant="report" emptyMessage="No e-Way Bills generated yet." />
      </div>
    </div>
  );
}

// ---- GST Filing tab ---------------------------------------------------------
function FilingTab({ companyId, fyId }: { companyId: number; fyId: number | undefined }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnType, setReturnType] = useState("GSTR1");
  const [period, setPeriod] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [st, f] = await Promise.all([window.api.gstFiling.getStatus(companyId), window.api.gstFiling.getFilings(companyId)]);
    setStatus(st);
    setRows(f.success ? f.filings : []);
    setLoading(false);
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  const run = async (kind: "prepare" | "save" | "file") => {
    if (!period.match(/^\d{6}$/)) { setMsg("Enter the return period as MMYYYY (e.g. 062026)."); return; }
    if (kind === "file" && !window.confirm(`File ${returnType} for ${period}? Filing is irreversible.`)) return;
    setBusy(true); setMsg(null);
    let res;
    if (kind === "prepare") res = await window.api.gstFiling.prepare({ company_id: companyId, return_type: returnType, fy_id: fyId || 0, return_period: period });
    else if (kind === "save") res = await window.api.gstFiling.saveToPortal({ company_id: companyId, return_type: returnType, fy_id: fyId || 0, return_period: period });
    else {
      const otp = window.prompt("Enter EVC / OTP to file:") || "";
      if (!otp) { setBusy(false); return; }
      res = await window.api.gstFiling.fileReturn({ company_id: companyId, return_type: returnType, return_period: period, evc_otp: otp });
    }
    setBusy(false);
    setMsg(res.success ? `${kind} ok${res.arn ? ` — ARN ${res.arn}` : ""}` : (res.error || `${kind} failed`));
    load();
  };

  const cols: TableColumn[] = [
    { key: "return_type", label: "Return", span: "col-span-2" },
    { key: "return_period", label: "Period", span: "col-span-2" },
    { key: "status", label: "Status", span: "col-span-2", render: (r) => <span className={r.status === "FILED" ? "font-bold" : ""}>{r.status}</span> },
    { key: "arn", label: "ARN", span: "col-span-3", render: (r) => r.arn || "—" },
    { key: "updated_at", label: "Updated", span: "col-span-3" },
  ];

  return (
    <div>
      <StatusBar status={status} />
      <div className="p-3">
        <div className="border border-zinc-200 p-3 mb-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Prepare &amp; file a return</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <label className="text-[10px] text-zinc-500 block mb-0.5">Return</label>
              <Select value={returnType} onChange={(e) => setReturnType(e.target.value)} options={[{ value: "GSTR1", label: "GSTR-1" }, { value: "GSTR3B", label: "GSTR-3B" }]} />
            </div>
            <div className="w-40">
              <label className="text-[10px] text-zinc-500 block mb-0.5">Period (MMYYYY)</label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="062026" />
            </div>
            <Button variant="secondary" size="sm" onClick={() => run("prepare")} disabled={busy}>Prepare</Button>
            <Button variant="secondary" size="sm" onClick={() => run("save")} disabled={busy || !status?.configured}>Save to portal</Button>
            <Button variant="primary" size="sm" onClick={() => run("file")} disabled={busy || !status?.configured}>File</Button>
            {msg && <span className="text-[11px] text-zinc-700 pb-2">{msg}</span>}
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">Prepare computes the return locally. Save uploads it to the GSP (reversible). File commits it with EVC/OTP (irreversible).</p>
        </div>
        <DataTable columns={cols} rows={rows} rowKey={(r) => r.filing_id} loading={loading} variant="report" emptyMessage="No filings yet." />
      </div>
    </div>
  );
}

export default function ComplianceWorkspace() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const active = TABS.some((t) => t.value === tab) ? (tab as string) : "einvoice";

  if (!companyId) {
    return (
      <FullScreenPanel title="GST & e-Invoicing" onClose={() => navigate("/")}>
        <div className="p-6 text-xs text-zinc-500">Select a company first.</div>
      </FullScreenPanel>
    );
  }

  return (
    <FullScreenPanel title="GST & e-Invoicing" onClose={() => navigate("/")}>
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-white">
          <Tabs tabs={TABS} value={active} onChange={(v) => navigate(`/compliance/${v}`)} />
        </div>
        <div className="flex-1 min-h-0">
          {active === "einvoice" && <EInvoiceTab companyId={companyId} />}
          {active === "eway" && <EwayTab companyId={companyId} />}
          {active === "filing" && <FilingTab companyId={companyId} fyId={activeFY?.fy_id} />}
        </div>
      </div>
    </FullScreenPanel>
  );
}
