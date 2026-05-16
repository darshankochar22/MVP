let voucherTypes = [];
let voucherTypeConfigs = [];

const PREDEFINED_VOUCHER_TYPES = [
  { name: 'Contra',         short_name: 'Contra',   category: 'Contra',         affects_inventory: false, affects_accounting: true,  affects_gst: false },
  { name: 'Payment',        short_name: 'Pmnt',     category: 'Payment',        affects_inventory: false, affects_accounting: true,  affects_gst: false },
  { name: 'Receipt',        short_name: 'Rcpt',     category: 'Receipt',        affects_inventory: false, affects_accounting: true,  affects_gst: false },
  { name: 'Journal',        short_name: 'Jrnl',     category: 'Journal',        affects_inventory: false, affects_accounting: true,  affects_gst: false },
  { name: 'Sales',          short_name: 'Sale',     category: 'Sales',          affects_inventory: true,  affects_accounting: true,  affects_gst: true  },
  { name: 'Purchase',       short_name: 'Purc',     category: 'Purchase',       affects_inventory: true,  affects_accounting: true,  affects_gst: true  },
  { name: 'Credit Note',    short_name: 'Crnt',     category: 'Credit Note',    affects_inventory: true,  affects_accounting: true,  affects_gst: true  },
  { name: 'Debit Note',     short_name: 'Dbnt',     category: 'Debit Note',     affects_inventory: true,  affects_accounting: true,  affects_gst: true  },
  { name: 'Stock Journal',  short_name: 'StJn',     category: 'Stock Journal',  affects_inventory: true,  affects_accounting: false, affects_gst: false },
  { name: 'Delivery Note',  short_name: 'DlvN',     category: 'Delivery Note',  affects_inventory: true,  affects_accounting: false, affects_gst: false },
  { name: 'Receipt Note',   short_name: 'RctN',     category: 'Receipt Note',   affects_inventory: true,  affects_accounting: false, affects_gst: false },
  { name: 'Memorandum',     short_name: 'Memo',     category: 'Memorandum',     affects_inventory: false, affects_accounting: false, affects_gst: false },
  { name: 'Payroll',        short_name: 'Pyrl',     category: 'Payroll',        affects_inventory: false, affects_accounting: true,  affects_gst: false },
];

const seedDefaultVoucherTypes = (company_id) => {
  PREDEFINED_VOUCHER_TYPES.forEach((vt, i) => {
    const id = Date.now() + i;

    voucherTypes.push({
      id,
      company_id,
      name: vt.name,
      short_name: vt.short_name,
      category: vt.category,
      default_voucher_class: null,
      affects_inventory: vt.affects_inventory,
      affects_accounting: vt.affects_accounting,
      affects_gst: vt.affects_gst,
      numbering_method: 'Automatic',  
      numbering_prefix: '',
      numbering_suffix: '',
      starts_with: 1,
      is_predefined: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    voucherTypeConfigs.push({
      id: Date.now() + i + 1000,
      voucher_type_id: id,
      use_effective_dates: false,
      allow_zero_value_transactions: false,
      make_voucher_optional: false,
      allow_narration: true,
      allow_narration_per_ledger: false,
      whatsapp_after_save: false,
      print_after_save: false,
      enable_default_accounting_allocation: false,
      track_additional_cost_for_purchase: false,
      default_title_to_print: vt.name,
      use_for_pos_invoicing: false,
      default_bank_id: null,
      declaration: null,
      set_alter_declaration: false,
    });
  });
};

module.exports = {
  seedDefaultVoucherTypes,

  create: async (data) => {
    try {
      const exists = voucherTypes.find(
        vt => vt.company_id === data.company_id &&
        vt.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) return { success: false, error: 'Voucher Type already exists' };

      const id = Date.now();

      const voucherType = {
        id,
        company_id: data.company_id,
        name: data.name,
        short_name: data.short_name || data.name.slice(0, 4),
        category: data.category,
        default_voucher_class: data.default_voucher_class || null,
        affects_inventory: data.affects_inventory || false,
        affects_accounting: data.affects_accounting ?? true,
        affects_gst: data.affects_gst || false,
        numbering_method: data.numbering_method || 'Automatic',
        numbering_prefix: data.numbering_prefix || '',
        numbering_suffix: data.numbering_suffix || '',
        starts_with: data.starts_with || 1,
        is_predefined: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      voucherTypes.push(voucherType);

      voucherTypeConfigs.push({
        id: Date.now() + 1,
        voucher_type_id: id,
        use_effective_dates: false,
        allow_zero_value_transactions: false,
        make_voucher_optional: false,
        allow_narration: true,
        allow_narration_per_ledger: false,
        whatsapp_after_save: false,
        print_after_save: false,
        enable_default_accounting_allocation: false,
        track_additional_cost_for_purchase: false,
        default_title_to_print: data.name,
        use_for_pos_invoicing: false,
        default_bank_id: null,
        declaration: null,
        set_alter_declaration: false,
      });

      return { success: true, voucherType };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = voucherTypes.filter(vt => vt.company_id === company_id && vt.is_active);
      return { success: true, voucherTypes: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const voucherType = voucherTypes.find(vt => vt.id === id);
      if (!voucherType) return { success: false, error: 'Voucher Type not found' };
      return { success: true, voucherType };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getConfig: async (voucher_type_id) => {
    try {
      const config = voucherTypeConfigs.find(c => c.voucher_type_id === voucher_type_id);
      if (!config) return { success: false, error: 'Config not found' };
      return { success: true, config };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updateConfig: async (data) => {
    try {
      const index = voucherTypeConfigs.findIndex(c => c.voucher_type_id === data.voucher_type_id);
      if (index === -1) return { success: false, error: 'Config not found' };

      voucherTypeConfigs[index] = { ...voucherTypeConfigs[index], ...data };
      return { success: true, config: voucherTypeConfigs[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = voucherTypes.findIndex(vt => vt.id === data.id);
      if (index === -1) return { success: false, error: 'Voucher Type not found' };
      if (voucherTypes[index].is_predefined) return { success: false, error: 'Cannot edit predefined voucher types' };

      voucherTypes[index] = { ...voucherTypes[index], ...data, updated_at: new Date().toISOString() };
      return { success: true, voucherType: voucherTypes[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const vt = voucherTypes.find(vt => vt.id === id);
      if (!vt) return { success: false, error: 'Voucher Type not found' };
      if (vt.is_predefined) return { success: false, error: 'Cannot delete predefined voucher types' };

      voucherTypes = voucherTypes.map(vt => vt.id === id ? { ...vt, is_active: false } : vt);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};