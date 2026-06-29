import type { useVoucherForm } from "../hooks/useVoucherForm";
import StockTransferVoucherBody from "../components/StockTransferVoucherBody";

interface Props {
  form: ReturnType<typeof useVoucherForm>;
  focusStockQty: (idx: number) => void;
  focusStockRate: (idx: number) => void;
  proceedToNextStockRow: (idx: number) => void;
}

export default function MaterialInVoucher(props: Props) {
  return <StockTransferVoucherBody {...props} config={{ sourceGodownLabel: "Source Godown", hideGodownColumn: true }} />;
}
