import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { CompanyType } from "../types/api";

interface CompanyContextValue {
  selectedCompany: CompanyType | null;
  setSelectedCompany: (c: CompanyType | null) => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<CompanyType | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await window.api.company.getAll();
        const companies: CompanyType[] = Array.isArray(result?.companies)
          ? result.companies
          : Array.isArray(result)
            ? result
            : [];
        if (cancelled) return;
        if (companies.length === 1) {
          setSelectedCompany(companies[0]);
        }
      } catch {
        // ignore — will show "No company selected" in UI
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <CompanyContext value={{ selectedCompany, setSelectedCompany }}>
      {checked ? children : null}
    </CompanyContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return ctx;
}
