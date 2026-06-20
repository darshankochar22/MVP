import { useCallback, useEffect, useState } from "react";
import type { TDSNatureOfPaymentType } from "@/types/entities/TDSNatureOfPayment";

interface UseTdsNatureOfPaymentsResult {
  items: TDSNatureOfPaymentType[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches active TDS Nature of Payment records for a company via the
 * preload bridge (window.api.tdsNatureOfPayment.getAll), mirroring the
 * getAll(company_id) convention used by group/ledger/stockItem etc.
 */
export function useTdsNatureOfPayments(
  companyId: number | null | undefined
): UseTdsNatureOfPaymentsResult {
  const [items, setItems] = useState<TDSNatureOfPaymentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!companyId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await window.api.tdsNatureOfPayment.getAll(companyId);
      if (res?.success) {
        setItems(res.tdsNatureOfPaymentList ?? []);
      } else {
        setError(res?.error || "Failed to load Nature of Payment list");
        setItems([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, loading, error, refetch };
}