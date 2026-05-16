let balanceSheetReports     = [];
let balanceSheetViews       = [];
let balanceSheetReportDetails = [];

module.exports = {
  create: async (data) => {
    try {
      const reportId = Date.now();

      const reportDetail = {
        id: reportId,
        company_id: data.company_id,
        report_name: data.report_name || 'Balance Sheet',
        report_date: data.report_date || new Date().toISOString().split('T')[0],
        comparison_period_start: data.comparison_period_start || null,
        comparison_period_end: data.comparison_period_end || null,
        format_type: data.format_type || 'Vertical',      
        method_of_showing: data.method_of_showing || 'Net Balance',
        show_vertical_balance_sheet: data.show_vertical_balance_sheet ?? true,
        show_working_capital_figures: data.show_working_capital_figures ?? false,
        profit_or_loss_as_liability: data.profit_or_loss_as_liability ?? true,
        show_detail_view: data.show_detail_view ?? false,
        show_condensed_view: data.show_condensed_view ?? false,
        show_schedule_vi: data.show_schedule_vi ?? false,
        include_closing_stock: data.include_closing_stock ?? true,
        compare_quarterly: data.compare_quarterly ?? false,
        basis_of_values: data.basis_of_values || 'Default',
        change_view: data.change_view || null,
        exception_reports_enabled: data.exception_reports_enabled ?? false,
        filter_enabled: data.filter_enabled ?? false,
        saved_view_name: data.saved_view_name || null,
        filter_details: data.filter_details || null,
        show_profit: data.show_profit ?? true,
        show_columnar: data.show_columnar ?? false,
        show_optional: data.show_optional ?? false,
        show_post_dated: data.show_post_dated ?? false,
        show_stat_adjustment: data.show_stat_adjustment ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      balanceSheetReportDetails.push(reportDetail);

      if (data.rows && data.rows.length > 0) {
        data.rows.forEach((row, i) => {
          balanceSheetViews.push({
            id: Date.now() + i + 1,
            report_id: reportId,
            company_id: data.company_id,
            report_date: reportDetail.report_date,
            group_name: row.group_name,
            parent_group_name: row.parent_group_name || null,
            opening_balance: row.opening_balance || 0,
            side: row.side || 'Assets',           
            current_period_debit: row.current_period_debit || 0,
            current_period_credit: row.current_period_credit || 0,
            closing_balance: row.closing_balance || 0,
            display_order: row.display_order || i + 1,
            is_total_row: row.is_total_row ?? false,
            is_drill_down_available: row.is_drill_down_available ?? true,
            created_at: new Date().toISOString(),
          });
        });
      }

      return { success: true, report: reportDetail };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const reports = balanceSheetReportDetails.filter(r => r.company_id === company_id);
      return { success: true, reports };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const report = balanceSheetReportDetails.find(r => r.id === id);
      if (!report) return { success: false, error: 'Report not found' };

      const rows = balanceSheetViews
        .filter(v => v.report_id === id)
        .sort((a, b) => a.display_order - b.display_order);

      const assets      = rows.filter(r => r.side === 'Assets');
      const liabilities = rows.filter(r => r.side === 'Liabilities');

      return {
        success: true,
        report: {
          ...report,
          assets,
          liabilities,
        },
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const report = balanceSheetReportDetails.find(r => r.id === id);
      if (!report) return { success: false, error: 'Report not found' };

      balanceSheetReportDetails = balanceSheetReportDetails.filter(r => r.id !== id);
      balanceSheetViews         = balanceSheetViews.filter(v => v.report_id !== id);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};