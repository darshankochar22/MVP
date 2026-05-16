let trialBalanceReports = [];
let trialBalanceRows    = [];

module.exports = {
  create: async (data) => {
    try {
      const reportId = Date.now();
      const report = {
        id: reportId,
        company_id: data.company_id,
        company_name: data.company_name || null,
        report_date: data.report_date || new Date().toISOString().split('T')[0],
        period_start: data.period_start,
        period_end: data.period_end,
        show_closing_balance: data.show_closing_balance ?? true,
        show_debit_credit: data.show_debit_credit ?? true,
        show_groups: data.show_groups ?? true,
        show_grand_total: data.show_grand_total ?? true,
        detailed_mode: data.detailed_mode ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      trialBalanceReports.push(report);

      if (data.rows && data.rows.length > 0) {
        data.rows.forEach((row, i) => {
          trialBalanceRows.push({
            id: Date.now() + i + 1,
            report_id: reportId,
            parent_row_id: row.parent_row_id || null,
            row_type: row.row_type || 'Ledger', 
            particulars: row.particulars,
            group_id: row.group_id || null,
            ledger_id: row.ledger_id || null,
            display_order: row.display_order || i + 1,
            opening_debit: row.opening_debit || 0,
            opening_credit: row.opening_credit || 0,
            period_debit: row.period_debit || 0,
            period_credit: row.period_credit || 0,
            closing_debit: row.closing_debit || 0,
            closing_credit: row.closing_credit || 0,
            is_drillable: row.is_drillable ?? true,
            is_grand_total: row.is_grand_total ?? false,
            notes: row.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }

      return { success: true, report };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const reports = trialBalanceReports.filter(r => r.company_id === company_id);
      return { success: true, reports };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const report = trialBalanceReports.find(r => r.id === id);
      if (!report) return { success: false, error: 'Report not found' };

      const rows = trialBalanceRows
        .filter(r => r.report_id === id)
        .sort((a, b) => a.display_order - b.display_order);

      return { success: true, report: { ...report, rows } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const report = trialBalanceReports.find(r => r.id === id);
      if (!report) return { success: false, error: 'Report not found' };

      trialBalanceReports = trialBalanceReports.filter(r => r.id !== id);
      trialBalanceRows    = trialBalanceRows.filter(r => r.report_id !== id);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};