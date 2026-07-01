import type { useVoucherForm } from "../hooks/useVoucherForm";
import StockTransferVoucherBody from "../components/StockTransferVoucherBody";

interface Props {
  form: ReturnType<typeof useVoucherForm>;
  handleAmountConfirm: (row: any, idx: number) => void;
  focusStockQty: (idx: number) => void;
  focusStockRate: (idx: number) => void;
  proceedToNextStockRow: (idx: number) => void;
}

export default function RejectionOutVoucher({ handleAmountConfirm: _ignored, ...props }: Props) {
  // Non-accounting inventory voucher — no Purchase Ledger row (Tally posts nothing here).
  return <StockTransferVoucherBody {...props} />;
}
