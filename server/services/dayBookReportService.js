let dayBookReports     = [];
let dayBookEntries     = [];
let dayBookEntryLines  = [];

module.exports = {
  create: async (data) => {
    try {
      const reportId = Date.now();

      const report = {
        id: reportId,
        company_id: data.company_id,
        report_name: data.report_name || 'Day Book',
        date_from: data.date_from,
        date_to: data.date_to,
        selected_company_id: data.selected_company_id || data.company_id,
        basis_of_values: data.basis_of_values || 'Default',
        change_view: data.change_view || null,
        exception_reports_enabled: data.exception_reports_enabled ?? false,
        saved_view_name: data.saved_view_name || null,
        filter_enabled: data.filter_enabled ?? false,
        filter_details: data.filter_details || null,
        show_profit: data.show_profit ?? false,
        show_columnar: data.show_columnar ?? false,
        show_optional: data.show_optional ?? false,
        show_post_dated: data.show_post_dated ?? false,
        show_stat_adjustment: data.show_stat_adjustment ?? false,
        show_details: data.show_details ?? true,
        show_related_reports: data.show_related_reports ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dayBookReports.push(report);

      if (data.entries && data.entries.length > 0) {
        data.entries.forEach((entry, i) => {
          const entryId = Date.now() + i + 1;

          dayBookEntries.push({
            id: entryId,
            report_id: reportId,
            company_id: data.company_id,
            voucher_id: entry.voucher_id || null,
            voucher_date: entry.voucher_date,
            particulars: entry.particulars || null,
            voucher_type: entry.voucher_type,
            voucher_number: entry.voucher_number,
            debit_amount: entry.debit_amount || 0,
            credit_amount: entry.credit_amount || 0,
            narration: entry.narration || null,
            party_ledger_name: entry.party_ledger_name || null,
            show_profit: entry.show_profit ?? false,
            is_optional: entry.is_optional ?? false,
            is_post_dated: entry.is_post_dated ?? false,
            is_stat_adjustment: entry.is_stat_adjustment ?? false,
            gross_profit: entry.gross_profit || 0,
            cost: entry.cost || 0,
            display_order: entry.display_order || i + 1,
            is_drillable: entry.is_drillable ?? true,
            notes: entry.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (entry.lines && entry.lines.length > 0) {
            entry.lines.forEach((line, j) => {
              dayBookEntryLines.push({
                id: Date.now() + i + j + 1000,
                entry_id: entryId,
                ledger_id: line.ledger_id || null,
                particulars: line.particulars || null,
                debit_amount: line.debit_amount || 0,
                credit_amount: line.credit_amount || 0,
                line_order: line.line_order || j + 1,
                notes: line.notes || null,
              });
            });
          }
        });
      }

      return { success: true, report };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const reports = dayBookReports.filter(r => r.company_id === company_id);
      return { success: true, reports };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const report = dayBookReports.find(r => r.id === id);
      if (!report) return { success: false, error: 'Report not found' };

      const entries = dayBookEntries
        .filter(e => e.report_id === id)
        .sort((a, b) => a.display_order - b.display_order)
        .map(entry => ({
          ...entry,
          lines: dayBookEntryLines
            .filter(l => l.entry_id === entry.id)
            .sort((a, b) => a.line_order - b.line_order),
        }));

      const totalDebit  = entries.reduce((s, e) => s + e.debit_amount, 0);
      const totalCredit = entries.reduce((s, e) => s + e.credit_amount, 0);

      return {
        success: true,
        report: {
          ...report,
          entries,
          totalDebit,
          totalCredit,
        },
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const report = dayBookReports.find(r => r.id === id);
      if (!report) return { success: false, error: 'Report not found' };

      const entryIds = dayBookEntries
        .filter(e => e.report_id === id)
        .map(e => e.id);

      dayBookReports    = dayBookReports.filter(r => r.id !== id);
      dayBookEntries    = dayBookEntries.filter(e => e.report_id !== id);
      dayBookEntryLines = dayBookEntryLines.filter(l => !entryIds.includes(l.entry_id));

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};