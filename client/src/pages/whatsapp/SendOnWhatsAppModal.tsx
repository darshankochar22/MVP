import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { renderElementToPdfBase64 } from "@/lib/exportDomPdf";

// Shared "Send invoice on WhatsApp" dialog. Sends the invoice_share template (party, number,
// date, amount + optional Pay Now link) and optionally attaches the rendered voucher PDF.
// `printAreaId` is the DOM id of the element to snapshot for the PDF (defaults to the
// voucher print area).

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: number;
  voucher: any;
  printAreaId?: string;
}

function invoiceTotal(voucher: any): number {
  const partyEntry = voucher?.entries?.find((e: any) => e.ledger_name === voucher.party_name);
  let total = partyEntry?.amount;
  if (total == null) {
    const dr = (voucher?.entries || []).filter((e: any) => e.type === "Dr").reduce((s: number, e: any) => s + (e.amount || 0), 0);
    const cr = (voucher?.entries || []).filter((e: any) => e.type === "Cr").reduce((s: number, e: any) => s + (e.amount || 0), 0);
    total = Math.max(dr, cr);
  }
  return Math.abs(total || 0);
}

export default function SendOnWhatsAppModal({ open, onClose, companyId, voucher, printAreaId = "voucher-print-area" }: Props) {
  const [phone, setPhone] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; link?: string | null } | null>(null);

  // Prefill the recipient from the party ledger's phone.
  useEffect(() => {
    if (!open) return;
    setResult(null);
    if (voucher?.party_ledger_id) {
      window.api.ledger.getById(voucher.party_ledger_id).then((r) => {
        if (r.success && (r.ledger as any)?.phone) setPhone(String((r.ledger as any).phone));
      });
    }
  }, [open, voucher?.party_ledger_id]);

  const send = async () => {
    if (!phone.trim()) { setResult({ ok: false, text: "Enter a recipient number." }); return; }
    setSending(true);
    setResult(null);

    let pdf_base64: string | undefined;
    if (attachPdf) {
      const el = document.getElementById(printAreaId);
      if (el) {
        const pdf = await renderElementToPdfBase64(el as HTMLElement);
        if (pdf.success) pdf_base64 = pdf.base64;
      }
    }

    const res = await window.api.whatsapp.sendInvoice({
      company_id: companyId,
      voucher_id: voucher.voucher_id,
      to_phone: phone.trim(),
      invoice_data: {
        party_name: voucher.party_name || "Customer",
        voucher_number: voucher.voucher_number || String(voucher.voucher_id),
        date: voucher.date || "",
        total_amount: invoiceTotal(voucher).toFixed(2),
        pdf_base64,
      },
    });
    setSending(false);
    setResult(res.success
      ? { ok: true, text: "Sent ✓", link: (res as any).paymentLink }
      : { ok: false, text: res.error || "Failed to send." });
  };

  return (
    <Modal open={open} onClose={onClose} title="Send on WhatsApp"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          <Button variant="primary" size="sm" onClick={send} disabled={sending}>{sending ? "Sending…" : "Send"}</Button>
        </>
      }>
      <div className="space-y-3">
        <div className="text-xs text-zinc-600">
          {voucher.voucher_type} <span className="font-semibold text-zinc-900">{voucher.voucher_number}</span> · {voucher.party_name || "—"} · ₹{invoiceTotal(voucher).toFixed(2)}
        </div>

        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Recipient number</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="919876543210" autoFocus />
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-700 select-none">
          <input type="checkbox" checked={attachPdf} onChange={(e) => setAttachPdf(e.target.checked)} />
          Attach invoice PDF
        </label>

        {result && (
          <div className={`text-[11px] ${result.ok ? "text-zinc-700" : "text-zinc-900 font-semibold"}`}>
            {result.text}
            {result.ok && result.link && (
              <div className="text-zinc-500 mt-0.5">Pay Now link: <span className="break-all">{result.link}</span></div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
