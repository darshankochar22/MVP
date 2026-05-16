let tallyFeatures = [];

const DEFAULT_FEATURES = {
  maintain_accounts: true,
  enable_bill_wise_entry: false,
  enable_cost_centres: false,

  maintain_inventory: true,
  integrate_accounts_with_inventory: true,
  enable_multiple_price_levels: false,
  enable_batches: false,
  maintain_expiry_date_for_batches: false,
  use_discount_column_in_invoices: false,
  use_separate_actual_billed_qty: false,

  enable_gst: false,
  set_alter_company_gst_details: false,

  enable_tds: false,
  enable_tcs: false,

  enable_browser_access_for_reports: false,
  enable_tally_net_services: false,
  enable_payment_request_qr: false,
  enable_multiple_addresses: false,
  mark_modified_vouchers: false,
};

const seedDefaultFeatures = (company_id) => {
  tallyFeatures.push({
    id: Date.now(),
    company_id,
    ...DEFAULT_FEATURES,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
};

module.exports = {
  seedDefaultFeatures,

  get: async (company_id) => {
    try {
      const features = tallyFeatures.find(f => f.company_id === company_id);
      if (!features) return { success: false, error: 'Features not found' };
      return { success: true, features };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = tallyFeatures.findIndex(f => f.company_id === data.company_id);
      if (index === -1) return { success: false, error: 'Features not found' };

      tallyFeatures[index] = {
        ...tallyFeatures[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return { success: true, features: tallyFeatures[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  reset: async (company_id) => {
    try {
      const index = tallyFeatures.findIndex(f => f.company_id === company_id);
      if (index === -1) return { success: false, error: 'Features not found' };

      tallyFeatures[index] = {
        ...tallyFeatures[index],
        ...DEFAULT_FEATURES,
        updated_at: new Date().toISOString(),
      };
      return { success: true, features: tallyFeatures[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};