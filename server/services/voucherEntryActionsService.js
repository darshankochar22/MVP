let voucherEntryActions = [];

module.exports = {
  create: async (data) => {
    try {
      const action = {
        id: Date.now(),
        company_id: data.company_id,
        voucher_id: data.voucher_id,
        action_type: data.action_type,  
        action_data: data.action_data || null,

        autofill_ledger_id: data.autofill_ledger_id || null,
        autofill_amount: data.autofill_amount || null,
        autofill_narration: data.autofill_narration || null,

        previous_mode: data.previous_mode || null,
        new_mode: data.new_mode || null,

        additional_details: data.additional_details || null,
  
        related_report_type: data.related_report_type || null, 
        related_report_id: data.related_report_id || null,

        is_optional: data.is_optional ?? false,
        optional_reason: data.optional_reason || null,
        performed_by: data.performed_by || null,
        performed_at: data.performed_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      voucherEntryActions.push(action);
      return { success: true, action };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = voucherEntryActions.filter(a => a.company_id === company_id);
      return { success: true, actions: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getByVoucher: async (voucher_id) => {
    try {
      const result = voucherEntryActions
        .filter(a => a.voucher_id === voucher_id)
        .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at));

      return { success: true, actions: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const action = voucherEntryActions.find(a => a.id === id);
      if (!action) return { success: false, error: 'Action not found' };

      voucherEntryActions = voucherEntryActions.filter(a => a.id !== id);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};