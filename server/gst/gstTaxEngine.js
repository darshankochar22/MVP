const STATE_CODE_MAP = {
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  "punjab": "03",
  "chandigarh": "04",
  "uttarakhand": "05",
  "haryana": "06",
  "delhi": "07",
  "rajasthan": "08",
  "uttar pradesh": "09",
  "bihar": "10",
  "sikkim": "11",
  "arunachal pradesh": "12",
  "nagaland": "13",
  "manipur": "14",
  "mizoram": "15",
  "tripura": "16",
  "meghalaya": "17",
  "assam": "18",
  "west bengal": "19",
  "jharkhand": "20",
  "odisha": "21",
  "chhattisgarh": "22",
  "madhya pradesh": "23",
  "gujarat": "24",
  "daman and diu": "26",
  "dadra and nagar haveli and daman and diu": "26",
  "maharashtra": "27",
  "andhra pradesh": "37",
  "karnataka": "29",
  "goa": "30",
  "lakshadweep": "31",
  "kerala": "32",
  "tamil nadu": "33",
  "puducherry": "34",
  "andaman and nicobar islands": "35",
  "telangana": "36",
  "ladakh": "38"
};

const resolveStateCode = (stateName, gstin) => {
  if (gstin && gstin.length >= 2) {
    const code = gstin.substring(0, 2);
    if (/^\d+$/.test(code)) {
      return code;
    }
  }
  if (!stateName) return "27"; // Default to Maharashtra if nothing specified
  const nameLower = stateName.trim().toLowerCase();
  return STATE_CODE_MAP[nameLower] || "27";
};

/**
 * Walks the statutory configuration hierarchy to resolve HSN and GST rate details.
 * Hierarchy: Item -> Stock Group -> Ledger (if item not used) -> Company HSN Override
 */
const resolveTaxRate = async (db, { company_id, stock_item_id, ledger_id, hsn_code, date }) => {
  let resolved = {
    hsn_code: hsn_code || "",
    gst_rate: 0,
    cgst_rate: 0,
    sgst_rate: 0,
    igst_rate: 0,
    cess_rate: 0,
    source: "default"
  };

  // 1. Resolve by Stock Item if stock_item_id is provided
  if (stock_item_id) {
    const itemResult = await db.execute({
      sql: `SELECT * FROM stock_items WHERE item_id = ? AND company_id = ?`,
      args: [stock_item_id, company_id]
    });
    const item = itemResult.rows[0];
    if (item) {
      if (item.hsn_code) resolved.hsn_code = item.hsn_code;
      if (item.gst_applicable === 'Applicable' || item.gst_rate > 0) {
        resolved.gst_rate = item.gst_rate || 0;
        resolved.cgst_rate = item.cgst_rate || 0;
        resolved.sgst_rate = item.sgst_rate || 0;
        resolved.igst_rate = item.igst_rate || 0;
        resolved.source = "stock_item";
        return resolved;
      }
      
      // 2. Check Stock Group of this item
      if (item.group_id) {
        const groupResult = await db.execute({
          sql: `SELECT * FROM stock_groups WHERE sg_id = ? AND company_id = ?`,
          args: [item.group_id, company_id]
        });
        const group = groupResult.rows[0];
        if (group && (group.gst_rate > 0 || group.hsn_sac_code)) {
          if (group.hsn_sac_code) resolved.hsn_code = group.hsn_sac_code;
          resolved.gst_rate = group.gst_rate || 0;
          resolved.cgst_rate = group.cgst_rate || 0;
          resolved.sgst_rate = group.sgst_rate || 0;
          resolved.igst_rate = group.igst_rate || 0;
          resolved.cess_rate = group.cess_rate || 0;
          resolved.source = "stock_group";
          return resolved;
        }
      }
    }
  }

  // 3. Check Ledger Statutory Details
  if (ledger_id) {
    const ledgerStatResult = await db.execute({
      sql: `SELECT * FROM ledger_statutory_details WHERE ledger_id = ?`,
      args: [ledger_id]
    });
    const stat = ledgerStatResult.rows[0];
    if (stat && (stat.gst_rate > 0 || stat.hsn_sac_code)) {
      if (stat.hsn_sac_code) resolved.hsn_code = stat.hsn_sac_code;
      resolved.gst_rate = stat.gst_rate || 0;
      resolved.cgst_rate = stat.cgst_rate || 0;
      resolved.sgst_rate = stat.sgst_rate || 0;
      resolved.igst_rate = stat.igst_rate || 0;
      resolved.source = "ledger";
      return resolved;
    }
  }

  // 4. Fallback to Company HSN Rate overrides (if HSN code is resolved)
  const queryHsn = resolved.hsn_code || hsn_code;
  if (queryHsn) {
    const hsnRateResult = await db.execute({
      sql: `SELECT * FROM gst_hsn_rates 
            WHERE company_id = ? AND hsn_code = ? AND effective_from <= ? 
            ORDER BY effective_from DESC LIMIT 1`,
      args: [company_id, queryHsn, date || new Date().toISOString().split('T')[0]]
    });
    const hsnRate = hsnRateResult.rows[0];
    if (hsnRate) {
      resolved.gst_rate = hsnRate.gst_rate || 0;
      resolved.cgst_rate = hsnRate.cgst_rate || 0;
      resolved.sgst_rate = hsnRate.sgst_rate || 0;
      resolved.igst_rate = hsnRate.igst_rate || 0;
      resolved.cess_rate = hsnRate.cess_rate || 0;
      resolved.source = "company_hsn";
      return resolved;
    }
  }

  return resolved;
};

/**
 * Resolves or creates a Duties & Taxes ledger for a specific tax type.
 */
const resolveOrCreateTaxLedger = async (db, company_id, tax_type) => {
  // Try to find an existing ledger under "Duties & Taxes" group or name matching tax_type
  const ledgerResult = await db.execute({
    sql: `SELECT l.ledger_id FROM ledgers l
          LEFT JOIN groups g ON g.group_id = l.group_id
          WHERE l.company_id = ? AND l.is_active = 1
          AND (LOWER(l.name) = LOWER(?) OR LOWER(COALESCE(l.ledger_type, '')) = LOWER(?) OR l.ledger_id IN (
            SELECT ledger_id FROM ledger_statutory_details WHERE type_of_duty_tax = ?
          ))
          LIMIT 1`,
    args: [company_id, tax_type, tax_type, tax_type]
  });

  if (ledgerResult.rows.length > 0) {
    return ledgerResult.rows[0].ledger_id;
  }

  // Find the group_id for "Duties & Taxes"
  const groupResult = await db.execute({
    sql: `SELECT group_id FROM groups WHERE company_id = ? AND name = 'Duties & Taxes' AND is_active = 1 LIMIT 1`,
    args: [company_id]
  });
  const group_id = groupResult.rows.length > 0 ? groupResult.rows[0].group_id : null;

  // Insert the ledger
  const name = tax_type.toUpperCase();
  const insertResult = await db.execute({
    sql: `INSERT INTO ledgers (
            company_id, group_id, name, ledger_type, nature,
            opening_balance, closing_balance, is_bill_wise, maintain_inventory_values,
            registration_type, is_active, is_predefined
          ) VALUES (?, ?, ?, 'Duties & Taxes', 'Liabilities', 0, 0, 0, 0, 'Unregistered', 1, 0)`,
    args: [company_id, group_id, name]
  });

  const ledger_id = Number(insertResult.lastInsertRowid);

  // Insert statutory details
  await db.execute({
    sql: `INSERT INTO ledger_statutory_details (
            ledger_id, gst_applicability, type_of_duty_tax, percentage_of_calculation
          ) VALUES (?, 'Applicable', ?, 0)`,
    args: [ledger_id, tax_type]
  });

  return ledger_id;
};

/**
 * Computes GST tax lines for a voucher payload.
 */
const computeVoucherTaxLines = async (db, payload) => {
  const {
    company_id,
    date,
    party_ledger_id,
    place_of_supply,
    stock_entries = [],
    entries = [],
    voucher_type
  } = payload;

  if (!company_id) {
    throw new Error("company_id is required for GST calculation");
  }

  // 1. Resolve Company State
  const companyGstResult = await db.execute({
    sql: `SELECT * FROM gst_registrations WHERE company_id = ? AND is_active = 1 LIMIT 1`,
    args: [company_id]
  });
  const companyReg = companyGstResult.rows[0];
  const companyState = companyReg ? companyReg.state_id : "";
  const companyGSTIN = companyReg ? companyReg.gstin : "";
  const companyStateCode = resolveStateCode(companyState, companyGSTIN);

  // 2. Resolve Party State
  let partyState = "";
  let partyGSTIN = "";
  if (party_ledger_id) {
    const partyResult = await db.execute({
      sql: `SELECT * FROM ledgers WHERE ledger_id = ? AND company_id = ?`,
      args: [party_ledger_id, company_id]
    });
    const party = partyResult.rows[0];
    if (party) {
      partyState = party.state || "";
      partyGSTIN = party.gstin || "";
    }
  }

  // Destination State: place_of_supply overrides party state
  const destinationState = place_of_supply || partyState || companyState || "";
  const destinationStateCode = resolveStateCode(destinationState, partyGSTIN);

  const isInterState = companyStateCode !== destinationStateCode;

  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalCess = 0;
  let totalAssessableValue = 0;

  const processedStockEntries = [];
  const taxLinesBreakdown = [];

  // 3. Compute tax for each stock entry
  for (const entry of stock_entries) {
    const assessable_value = (entry.quantity || 0) * (entry.rate || 0) - (entry.discount_amount || 0);
    totalAssessableValue += assessable_value;

    const rateDetails = await resolveTaxRate(db, {
      company_id,
      stock_item_id: entry.stock_item_id,
      ledger_id: entry.ledger_id,
      hsn_code: entry.hsn_code,
      date
    });

    let cgst_amount = 0;
    let sgst_amount = 0;
    let igst_amount = 0;
    let cess_amount = 0;

    const gst_rate = rateDetails.gst_rate;
    if (gst_rate > 0) {
      if (isInterState) {
        igst_amount = Number((assessable_value * (gst_rate / 100)).toFixed(2));
        totalIGST += igst_amount;
      } else {
        cgst_amount = Number((assessable_value * ((gst_rate / 2) / 100)).toFixed(2));
        sgst_amount = Number((assessable_value * ((gst_rate / 2) / 100)).toFixed(2));
        totalCGST += cgst_amount;
        totalSGST += sgst_amount;
      }
    }

    if (rateDetails.cess_rate > 0) {
      cess_amount = Number((assessable_value * (rateDetails.cess_rate / 100)).toFixed(2));
      totalCess += cess_amount;
    }

    processedStockEntries.push({
      ...entry,
      hsn_code: rateDetails.hsn_code,
      gst_rate: gst_rate,
      cgst_amount,
      sgst_amount,
      igst_amount,
      cess_amount,
      assessable_value
    });

    if (gst_rate > 0 || rateDetails.cess_rate > 0) {
      taxLinesBreakdown.push({
        hsn_code: rateDetails.hsn_code,
        assessable_value,
        gst_rate,
        cgst_amount,
        sgst_amount,
        igst_amount,
        cess_amount
      });
    }
  }

  // 4. Generate updated accounting entries (double-entry injection)
  // Determine if it is a debit or credit tax post
  const isPurchase = voucher_type === 'Purchase' || voucher_type === 'Debit Note';
  const taxEntryType = isPurchase ? 'Dr' : 'Cr';
  const partyEntryType = isPurchase ? 'Cr' : 'Dr';

  // Strip existing tax entries (under Duties & Taxes) to calculate fresh
  const finalEntries = entries.filter(e => {
    // Keep entries that are NOT tax ledgers
    // Let's identify tax ledgers by checking name/type if possible or just filter them out dynamically
    const nameLower = (e.ledger_name || "").toLowerCase();
    return !nameLower.includes("cgst") && !nameLower.includes("sgst") && !nameLower.includes("igst") && !nameLower.includes("cess");
  });

  // Inject CGST, SGST, IGST lines
  if (!isInterState) {
    if (totalCGST > 0) {
      const cgstLedgerId = await resolveOrCreateTaxLedger(db, company_id, "CGST");
      finalEntries.push({
        ledger_id: cgstLedgerId,
        ledger_name: "CGST",
        type: taxEntryType,
        amount: totalCGST,
        amount_forex: totalCGST,
        currency: "INR"
      });
    }
    if (totalSGST > 0) {
      const sgstLedgerId = await resolveOrCreateTaxLedger(db, company_id, "SGST");
      finalEntries.push({
        ledger_id: sgstLedgerId,
        ledger_name: "SGST",
        type: taxEntryType,
        amount: totalSGST,
        amount_forex: totalSGST,
        currency: "INR"
      });
    }
  } else {
    if (totalIGST > 0) {
      const igstLedgerId = await resolveOrCreateTaxLedger(db, company_id, "IGST");
      finalEntries.push({
        ledger_id: igstLedgerId,
        ledger_name: "IGST",
        type: taxEntryType,
        amount: totalIGST,
        amount_forex: totalIGST,
        currency: "INR"
      });
    }
  }

  if (totalCess > 0) {
    const cessLedgerId = await resolveOrCreateTaxLedger(db, company_id, "CESS");
    finalEntries.push({
      ledger_id: cessLedgerId,
      ledger_name: "CESS",
      type: taxEntryType,
      amount: totalCess,
      amount_forex: totalCess,
      currency: "INR"
    });
  }

  // Balance the Party Ledger (Sundry Debtor / Sundry Creditor)
  // Sum Dr and Cr of non-party entries
  let totalDr = 0;
  let totalCr = 0;
  let partyEntryIndex = -1;

  finalEntries.forEach((e, idx) => {
    if (Number(e.ledger_id) === Number(party_ledger_id)) {
      partyEntryIndex = idx;
    } else {
      if (e.type === 'Dr') totalDr += e.amount;
      else totalCr += e.amount;
    }
  });

  const balanceDiff = Math.abs(totalDr - totalCr);

  if (partyEntryIndex !== -1) {
    // Update the party ledger entry with the balanced grand total
    finalEntries[partyEntryIndex].amount = Number(balanceDiff.toFixed(2));
    finalEntries[partyEntryIndex].amount_forex = Number(balanceDiff.toFixed(2));
    finalEntries[partyEntryIndex].type = partyEntryType;
  } else if (party_ledger_id) {
    // Add the party entry if missing
    finalEntries.unshift({
      ledger_id: party_ledger_id,
      ledger_name: "Party A/c",
      type: partyEntryType,
      amount: Number(balanceDiff.toFixed(2)),
      amount_forex: Number(balanceDiff.toFixed(2)),
      currency: "INR"
    });
  }

  return {
    is_inter_state: isInterState ? 1 : 0,
    party_gstin: partyGSTIN,
    party_state: partyState,
    total_cgst: totalCGST,
    total_sgst: totalSGST,
    total_igst: totalIGST,
    total_cess: totalCess,
    stock_entries: processedStockEntries,
    entries: finalEntries,
    taxLinesBreakdown
  };
};

/**
 * Savescomputed tax audit lines to the database for a voucher.
 */
const saveVoucherTaxLines = async (db, voucher_id, computedTax) => {
  // First clean out existing lines for this voucher
  await db.execute({
    sql: `DELETE FROM gst_voucher_tax_lines WHERE voucher_id = ?`,
    args: [voucher_id]
  });

  const { is_inter_state, party_gstin, party_state, stock_entries = [] } = computedTax;

  for (const entry of stock_entries) {
    // Save line for CGST/SGST or IGST if tax is applicable
    if (entry.gst_rate > 0) {
      if (is_inter_state) {
        await db.execute({
          sql: `INSERT INTO gst_voucher_tax_lines (
                  voucher_id, hsn_code, description, quantity, unit,
                  assessable_value, tax_type, rate, amount, is_inter_state, party_gstin, party_state
                ) VALUES (?, ?, ?, ?, ?, ?, 'IGST', ?, ?, ?, ?, ?)`,
          args: [
            voucher_id,
            entry.hsn_code || "",
            entry.item_name || "",
            entry.quantity || 0,
            "",
            entry.assessable_value || 0,
            entry.gst_rate,
            entry.igst_amount || 0,
            is_inter_state,
            party_gstin,
            party_state
          ]
        });
      } else {
        // CGST
        await db.execute({
          sql: `INSERT INTO gst_voucher_tax_lines (
                  voucher_id, hsn_code, description, quantity, unit,
                  assessable_value, tax_type, rate, amount, is_inter_state, party_gstin, party_state
                ) VALUES (?, ?, ?, ?, ?, ?, 'CGST', ?, ?, ?, ?, ?)`,
          args: [
            voucher_id,
            entry.hsn_code || "",
            entry.item_name || "",
            entry.quantity || 0,
            "",
            entry.assessable_value || 0,
            entry.gst_rate / 2,
            entry.cgst_amount || 0,
            is_inter_state,
            party_gstin,
            party_state
          ]
        });
        // SGST
        await db.execute({
          sql: `INSERT INTO gst_voucher_tax_lines (
                  voucher_id, hsn_code, description, quantity, unit,
                  assessable_value, tax_type, rate, amount, is_inter_state, party_gstin, party_state
                ) VALUES (?, ?, ?, ?, ?, ?, 'SGST', ?, ?, ?, ?, ?)`,
          args: [
            voucher_id,
            entry.hsn_code || "",
            entry.item_name || "",
            entry.quantity || 0,
            "",
            entry.assessable_value || 0,
            entry.gst_rate / 2,
            entry.sgst_amount || 0,
            is_inter_state,
            party_gstin,
            party_state
          ]
        });
      }
    }

    if (entry.cess_amount > 0) {
      await db.execute({
        sql: `INSERT INTO gst_voucher_tax_lines (
                voucher_id, hsn_code, description, quantity, unit,
                assessable_value, tax_type, rate, amount, is_inter_state, party_gstin, party_state
              ) VALUES (?, ?, ?, ?, ?, ?, 'CESS', 0, ?, ?, ?, ?)`,
        args: [
          voucher_id,
          entry.hsn_code || "",
          entry.item_name || "",
          entry.quantity || 0,
          "",
          entry.assessable_value || 0,
          entry.cess_amount || 0,
          is_inter_state,
          party_gstin,
          party_state
        ]
      });
    }
  }
};

module.exports = {
  STATE_CODE_MAP,
  resolveStateCode,
  resolveTaxRate,
  computeVoucherTaxLines,
  saveVoucherTaxLines
};
