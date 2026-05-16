/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    api: {
      company: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        verifyPassword: (data: { id: number; password: string }) => Promise<any>
      }

      fy: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        setActive: (id: number) => Promise<any>
        delete: (id: number) => Promise<any>
      }

      group: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getTree: () => Promise<any>
      }

      ledger: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getByGroup: (groupId: number) => Promise<any>
      }

      costCentre: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getTree: () => Promise<any>
      }

      unit: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
      }

      stockGroup: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getTree: () => Promise<any>
      }

      stockCategory: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
      }

      stockItem: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getByGroup: (groupId: number) => Promise<any>
        getByCategory: (categoryId: number) => Promise<any>
      }

      godown: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getTree: () => Promise<any>
      }

      voucher: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        cancel: (id: number) => Promise<any>
        getDaybook: (filters: any) => Promise<any>
        getByType: (type: string) => Promise<any>
        getByLedger: (ledgerId: number) => Promise<any>
      }

      report: {
        trialBalance: (filters: any) => Promise<any>
        balanceSheet: (filters: any) => Promise<any>
        profitLoss: (filters: any) => Promise<any>
        ledgerReport: (filters: any) => Promise<any>
        cashBook: (filters: any) => Promise<any>
        bankBook: (filters: any) => Promise<any>
        daybook: (filters: any) => Promise<any>
      }

      banking: {
        getUnreconciled: (ledgerId: number) => Promise<any>
        reconcile: (data: any) => Promise<any>
        unreconcile: (data: any) => Promise<any>
        getStatement: (filters: any) => Promise<any>
        getSummary: (ledgerId: number) => Promise<any>
      }

      currency: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        setDefault: (id: number) => Promise<any>
      }

      voucherType: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getConfig: (id: number) => Promise<any>
        updateConfig: (data: any) => Promise<any>
      }

      gstRegistration: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
      }

      gstClassification: {
        create: (data: any) => Promise<any>
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        update: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
      }
    }
  }
}

export {}