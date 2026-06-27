import { useParams } from "react-router-dom";
import InventoryVoucherRegister from "./inventory/InventoryVoucherRegister";

/** Statistics → voucher-type drill: Voucher Monthly Register (accounting Dr/Cr variant). */
export default function StatisticsVoucherRegister() {
  const { voucherType = "" } = useParams();
  const decoded = decodeURIComponent(voucherType);
  return (
    <InventoryVoucherRegister
      voucherType={decoded}
      title="Voucher Monthly Register"
      variant="accounting"
      subtitle={decoded}
    />
  );
}
