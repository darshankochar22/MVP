import type { useVoucherForm } from "../hooks/useVoucherForm";
import StockTransferVoucherBody from "../components/StockTransferVoucherBody";

interface Props {
  form: ReturnType<typeof useVoucherForm>;
  handleAmountConfirm: (row: any, idx: number) => void;
  focusStockQty: (idx: number) => void;
  focusStockRate: (idx: number) => void;
  proceedToNextStockRow: (idx: number) => void;
}

export default function ReceiptNoteVoucher({ handleAmountConfirm: _ignored, ...props }: Props) {
  // Receipt Note mirrors the Purchase layout: Party + Purchase ledger + an
  // Actual/Billed item grid. Godown/qty/rate are captured in the Stock Item
  // Allocations popup that opens on item select, so the inline godown column is
  // hidden (see Vouchers.tsx handleLedgerSelectWithAllocation).
  return (
    <StockTransferVoucherBody
      {...props}
      config={{ salesPurchaseLabel: "Purchase Ledger", hideGodownColumn: true, showActualBilled: true, showReferenceRow: true }}
    />
  );
}
