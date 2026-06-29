// Voucher automation contract — the single source of truth for the "response pattern":
// the exact JSON shape that automation.createVoucher (and window.api.voucher.create)
// accepts. Pure data + a DB-free validator, so a generator (a script, the user by hand,
// or an LLM later) can be checked for shape WITHOUT touching the database.
//
// Mirrors what server/voucher/voucherCRUD.create() actually reads. No model, no network.

const VOUCHER_TYPES = [
  'Journal', 'Payment', 'Receipt', 'Contra',
  'Sales', 'Purchase', 'Credit Note', 'Debit Note',
  'Payroll',
];

// Pure double-entry types: caller supplies the final Dr/Cr lines and they must balance.
const BALANCED_TYPES = ['Journal', 'Payment', 'Receipt', 'Contra'];
// GST types: tax lines are added automatically by the engine, so raw entries may not balance.
const GST_TYPES = ['Sales', 'Purchase', 'Credit Note', 'Debit Note'];

// Same tolerance as voucherLedgerHelpers.validateDoubleEntry.
const isBalanced = (entries) => {
  const total = entries.reduce(
    (sum, e) => (e.type === 'Dr' ? sum + (Number(e.amount) || 0) : sum - (Number(e.amount) || 0)),
    0,
  );
  return Math.abs(total) < 0.01;
};

// Human + machine readable description of the payload. Rendered in the Copilot
// "Assisted Entry" panel and copyable for any external generator.
const VOUCHER_SCHEMA = {
  title: 'Voucher payload',
  description:
    'One JSON object = one voucher. Send it to window.api.automation.createVoucher; the app validates it and writes it to the books. company_id and fy_id are filled in for you from the active company/financial year.',
  fields: {
    company_id:            { type: 'number',  required: true,  note: 'Active company. Filled in automatically.' },
    fy_id:                 { type: 'number',  required: true,  note: 'Active financial year. Filled in automatically.' },
    voucher_type:          { type: 'string',  required: true,  enum: VOUCHER_TYPES, note: 'e.g. Journal, Payment, Receipt, Contra, Sales, Purchase, Payroll.' },
    date:                  { type: 'string',  required: true,  format: 'YYYY-MM-DD' },
    voucher_number:        { type: 'string',  required: false, note: 'Auto-generated if omitted.' },
    narration:             { type: 'string',  required: false, note: 'Free-text description of the entry.' },
    party_ledger_id:       { type: 'number',  required: false, note: 'Party/bank/cash ledger id. For Payroll this is the account paid from.' },
    party_name:            { type: 'string',  required: false, note: 'Party name; resolved to party_ledger_id on create if the id is missing.' },
    reference_number:      { type: 'string',  required: false },
    is_accounting_voucher: { type: 'boolean', required: false, default: true,  note: 'Set false for inventory-only vouchers.' },
    is_inventory_voucher:  { type: 'boolean', required: false, default: false },
    entries:               { type: 'array of entry', required: 'for accounting vouchers', note: 'The Dr/Cr lines.' },
    stock_entries:         { type: 'array', required: false, note: 'Inventory lines for stock vouchers.' },
    payroll_entries:       { type: 'array', required: 'for Payroll', note: '[{ pay_head_id, amount }]; Dr/Cr lines are derived.' },
  },
  entry: {
    ledger_id:   { type: 'number', required: 'preferred', note: 'Ledger to debit/credit.' },
    ledger_name: { type: 'string', required: false, note: 'Exact ledger name; auto-resolved to ledger_id on create if id is missing.' },
    type:        { type: 'string', required: true, enum: ['Dr', 'Cr'] },
    amount:      { type: 'number', required: true, note: 'Positive number; the Dr/Cr type carries the sign.' },
    narration:   { type: 'string', required: false },
  },
  rules: [
    'For Journal / Payment / Receipt / Contra the sum of Dr amounts must equal the sum of Cr amounts.',
    'Each entry needs a ledger_id, or an exact ledger_name that already exists in this company (auto-resolved).',
    'Amounts are positive numbers; type ("Dr" or "Cr") decides the direction.',
    'For Sales / Purchase / Credit Note / Debit Note, GST tax lines are added automatically.',
    'Payroll uses payroll_entries ([{ pay_head_id, amount }]) plus party_ledger_id.',
  ],
};

// Worked, ready-to-edit examples per voucher type. `today` is injected so the date is current.
const buildExamples = (today) => ({
  Journal: {
    voucher_type: 'Journal',
    date: today,
    narration: 'Provision for audit fees',
    entries: [
      { ledger_name: 'Audit Fees', type: 'Dr', amount: 25000 },
      { ledger_name: 'Audit Fees Payable', type: 'Cr', amount: 25000 },
    ],
  },
  Payment: {
    voucher_type: 'Payment',
    date: today,
    narration: 'Office rent for the month',
    entries: [
      { ledger_name: 'Rent', type: 'Dr', amount: 40000 },
      { ledger_name: 'Cash', type: 'Cr', amount: 40000 },
    ],
  },
  Receipt: {
    voucher_type: 'Receipt',
    date: today,
    narration: 'Received from customer',
    entries: [
      { ledger_name: 'Bank', type: 'Dr', amount: 15000 },
      { ledger_name: 'ABC Traders', type: 'Cr', amount: 15000 },
    ],
  },
  Sales: {
    voucher_type: 'Sales',
    date: today,
    party_name: 'ABC Traders',
    narration: 'Sale of goods (18% GST)',
    entries: [
      { ledger_name: 'ABC Traders', type: 'Dr', amount: 11800 },
      { ledger_name: 'Sales', type: 'Cr', amount: 10000 },
      { ledger_name: 'Output CGST', type: 'Cr', amount: 900 },
      { ledger_name: 'Output SGST', type: 'Cr', amount: 900 },
    ],
  },
});

// Structural validation only — NO database access. Returns { ok, errors, warnings }.
// Authoritative checks (GST recompute, ledger existence, the real double-entry guard)
// still happen on create; this gives fast, shape-level feedback to a generator.
const validatePayload = (data) => {
  const errors = [];
  const warnings = [];
  const num = (v) => typeof v === 'number' && !Number.isNaN(v);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, errors: ['Payload must be a JSON object.'], warnings };
  }

  if (!num(data.company_id)) errors.push('company_id is required (number).');
  if (!num(data.fy_id)) errors.push('fy_id is required (number).');
  if (!data.voucher_type || typeof data.voucher_type !== 'string') {
    errors.push('voucher_type is required (string), e.g. "Journal", "Payment", "Receipt".');
  } else if (!VOUCHER_TYPES.includes(data.voucher_type)) {
    warnings.push(`voucher_type "${data.voucher_type}" is not one of the known types (${VOUCHER_TYPES.join(', ')}).`);
  }
  if (!data.date || typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('date is required in YYYY-MM-DD format.');
  }

  const vt = data.voucher_type;
  const isAccounting = data.is_accounting_voucher == null ? true : !!data.is_accounting_voucher;

  if (vt === 'Payroll') {
    if (!Array.isArray(data.payroll_entries) || data.payroll_entries.length === 0) {
      errors.push('Payroll vouchers need payroll_entries: [{ pay_head_id, amount }, ...].');
    } else {
      data.payroll_entries.forEach((p, i) => {
        if (!p || typeof p !== 'object') { errors.push(`payroll_entries[${i}] must be an object.`); return; }
        if (!num(p.pay_head_id)) errors.push(`payroll_entries[${i}].pay_head_id must be a number.`);
        if (!num(p.amount) || p.amount <= 0) errors.push(`payroll_entries[${i}].amount must be a positive number.`);
      });
    }
    if (!num(data.party_ledger_id)) warnings.push('party_ledger_id (the bank/cash ledger paid from) is usually required for Payroll.');
  } else if (isAccounting) {
    if (!Array.isArray(data.entries) || data.entries.length < 2) {
      errors.push('Accounting vouchers need entries: at least 2 lines (e.g. one Dr and one Cr).');
    } else {
      data.entries.forEach((e, i) => {
        if (!e || typeof e !== 'object') { errors.push(`entries[${i}] must be an object.`); return; }
        if (e.type !== 'Dr' && e.type !== 'Cr') errors.push(`entries[${i}].type must be "Dr" or "Cr".`);
        if (!num(e.amount) || e.amount <= 0) errors.push(`entries[${i}].amount must be a positive number.`);
        if (!num(e.ledger_id) && !(typeof e.ledger_name === 'string' && e.ledger_name.trim())) {
          errors.push(`entries[${i}] needs a ledger_id (number) or ledger_name (string).`);
        } else if (!num(e.ledger_id) && e.ledger_name) {
          warnings.push(`entries[${i}] has no ledger_id; "${e.ledger_name}" will be resolved by name on create.`);
        }
      });
      if (errors.length === 0) {
        const balanced = isBalanced(data.entries);
        if (BALANCED_TYPES.includes(vt) && !balanced) {
          errors.push('Debit total must equal Credit total (sum of Dr amounts = sum of Cr amounts).');
        } else if (GST_TYPES.includes(vt) && !balanced) {
          warnings.push('Dr and Cr totals are not equal — usually fine here because GST tax lines are added automatically, but double-check.');
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
};

module.exports = {
  VOUCHER_TYPES,
  VOUCHER_SCHEMA,
  buildExamples,
  validatePayload,
  isBalanced,
};
