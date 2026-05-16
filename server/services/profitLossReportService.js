let profitLossReportDetails = [];
let profitLossViews         = [];

module.exports = {
  create: async (data) => {
    try {
      const reportId = Date.now();
      const reportDetail = {
        id: reportId,
        company_id: data.company_id,
        report_name: data.report_name || 'Profit & Loss A/c',
        report_date: data.report_date || new Date().toISOString().split('T')[0],
        period_start: data.period_start,
        period_end: data.period_end,
        format_type: data.format_type || 'Vertical',       
        compare_with_previous_period: data.compare_with_previous_period ?? false,
        comparison_period_start: data.comparison_period_start || null,
        comparison_period_end: data.comparison_period_end || null,
        basis_of_values: data.basis_of_values || 'Default',
        change_view: data.change_view || null,
        exception_report_enabled: data.exception_report_enabled ?? false,
        saved_view_name: data.saved_view_name || null,
        filter_enabled: data.filter_enabled ?? false,
        filter_details: data.filter_details || null,
        show_detail_view: data.show_detail_view ?? false,
        show_condensed_view: data.show_condensed_view ?? false,
        show_percentage_of_sales: data.show_percentage_of_sales ?? false,
        show_auto_column: data.show_auto_column ?? false,
        show_profit: data.show_profit ?? true,
        show_optional: data.show_optional ?? false,
        show_post_dated: data.show_post_dated ?? false,
        show_stat_adjustment: data.show_stat_adjustment ?? false,
        show_schedule_vi: data.show_schedule_vi ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      profitLossReportDetails.push(reportDetail);

      if (data.rows && data.rows.length > 0) {
        data.rows.forEach((row, i) => {
          profitLossViews.push({
            id: Date.now() + i + 1,
            report_id: reportId,
            company_id: data.company_id,
            report_date: reportDetail.report_date,
            section: row.section || 'Income',              
            group_name: row.group_name,
            parent_group_name: row.parent_group_name || null,
            opening_balance: row.opening_balance || 0,
            current_period_amount: row.current_period_amount || 0,
            closing_balance: row.closing_balance || 0,
            display_order: row.display_order || i + 1,
            is_total_row: row.is_total_row ?? false,
            is_gross_profit_row: row.is_gross_profit_row ?? false,
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
      const reports = profitLossReportDetails.filter(r => r.company_id === company_id);
      return { success: true, reports };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const report = profitLossReportDetails.find(r => r.id === id);
      if (!report) return { success: false, error: 'Report not found' };

      const rows = profitLossViews
        .filter(v => v.report_id === id)
        .sort((a, b) => a.display_order - b.display_order);

      const income     = rows.filter(r => r.section === 'Income');
      const expenses   = rows.filter(r => r.section === 'Expense');
      const grossProfit = rows.filter(r => r.section === 'GrossProfit');
      const netProfit  = rows.filter(r => r.section === 'NetProfit');

      return {
        success: true,
        report: {
          ...report,
          income,
          expenses,
          grossProfit,
          netProfit,
        },
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const report = profitLossReportDetails.find(r => r.id === id);
      if (!report) return { success: false, error: 'Report not found' };

      profitLossReportDetails = profitLossReportDetails.filter(r => r.id !== id);
      profitLossViews         = profitLossViews.filter(v => v.report_id !== id);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};