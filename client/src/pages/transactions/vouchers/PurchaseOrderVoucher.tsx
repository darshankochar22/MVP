import type { useVoucherForm } from "../hooks/useVoucherForm";
import StockTransferVoucherBody from "../components/StockTransferVoucherBody";

interface Props {
  form: ReturnType<typeof useVoucherForm>;
  handleAmountConfirm: (row: any, idx: number) => void;
  focusStockQty: (idx: number) => void;
  focusStockRate: (idx: number) => void;
  proceedToNextStockRow: (idx: number) => void;
}

// Purchase Order mirrors the Receipt Note layout: Party + Purchase ledger + an
// Actual/Billed item grid. Godown / Batch-Lot / qty / rate are captured in the
// Stock Item Allocations popup that opens on item select (see Vouchers.tsx
// handleLedgerSelectWithAllocation), so the inline godown column is hidden.
export default function PurchaseOrderVoucher({ handleAmountConfirm: _ignored, ...props }: Props) {
  return (
    <StockTransferVoucherBody
      {...props}
      config={{ salesPurchaseLabel: "Purchase Ledger", hideGodownColumn: true, showActualBilled: true }}
    />
  );
}
