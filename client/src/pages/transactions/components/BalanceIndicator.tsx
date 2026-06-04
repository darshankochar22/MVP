// components/BalanceIndicator.tsx
import type { useVoucherForm } from "../hooks/useVoucherForm";

interface BalanceIndicatorProps {
  form: ReturnType<typeof useVoucherForm>;
}

export default function BalanceIndicator({ form }: BalanceIndicatorProps) {
  if (form.voucherType === "Receipt") {
    if (form.receiptEntryMode === "single") {
      return form.particularsTotal > 0 ? (
        <span className="text-gray-500">✓ Balanced</span>
      ) : null;
    }
    if (form.debitTotal <= 0) return null;

    const hasNegative = form.receiptDoubleRows.some(
      (r) =>
        r.ledger &&
        r.ledgerBalance &&
        parseFloat(r.ledgerBalance) < 0
    );

    if (Math.abs(form.debitTotal - form.creditTotal) > 0.01) {
      return (
        <span className="text-red-700">
          ⚠ Diff:{" "}
          {Math.abs(form.debitTotal - form.creditTotal).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    }

    if (hasNegative) {
      return <span className="text-red-600">⚠ Negative balance on selected ledgers</span>;
    }

    return <span className="text-gray-500">✓ Balanced</span>;
  }

  if (form.voucherType === "Payment") {
    if (form.paymentEntryMode === "single") {
      return form.particularsTotal > 0 ? (
        <span className="text-gray-500">✓ Balanced</span>
      ) : null;
    }
    if (form.debitTotal <= 0) return null;

    const hasNegative = form.paymentDoubleRows.some(
      (r) =>
        r.ledger &&
        r.ledgerBalance &&
        parseFloat(r.ledgerBalance) < 0
    );

    if (Math.abs(form.debitTotal - form.creditTotal) > 0.01) {
      return (
        <span className="text-red-700">
          ⚠ Diff:{" "}
          {Math.abs(form.debitTotal - form.creditTotal).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    }

    if (hasNegative) {
      return <span className="text-red-600">⚠ Negative balance on selected ledgers</span>;
    }

    return <span className="text-gray-500">✓ Balanced</span>;
  }

  if (form.voucherType === "Contra") {
    if (form.contraEntryMode === "single") {
      return form.particularsTotal > 0 ? (
        <span className="text-gray-500">✓ Balanced</span>
      ) : null;
    }
    if (form.debitTotal <= 0) return null;

    const hasNegative = form.contraDoubleRows.some(
      (r) =>
        r.ledger &&
        r.ledgerBalance &&
        parseFloat(r.ledgerBalance) < 0
    );

    if (Math.abs(form.debitTotal - form.creditTotal) > 0.01) {
      return (
        <span className="text-red-700">
          ⚠ Diff:{" "}
          {Math.abs(form.debitTotal - form.creditTotal).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    }

    if (hasNegative) {
      return <span className="text-red-600">⚠ Negative balance on selected ledgers</span>;
    }

    return <span className="text-gray-500">✓ Balanced</span>;
  }

  if (form.voucherType === "Journal") {
    if (form.journalEntryMode === "single") {
      return form.particularsTotal > 0 ? (
        <span className="text-gray-500">✓ Balanced</span>
      ) : null;
    }
    if (form.debitTotal <= 0) return null;
    if (Math.abs(form.debitTotal - form.creditTotal) > 0.01) {
      return (
        <span className="text-red-700">
          ⚠ Diff:{" "}
          {Math.abs(form.debitTotal - form.creditTotal).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    }
    return <span className="text-gray-500">✓ Balanced</span>;
  }

  return null;
}
