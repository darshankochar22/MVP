// Excise Registration Details service — Drizzle ORM (follows serviceTaxDetailsService).
//   * READS use db.all(sql`SELECT ...`) so the legacy snake_case shape is preserved
//     and mapped to the camelCase the frontend uses.
//   * MUTATIONS use the query builder (upsert the singleton by company_id, and
//     replace the excise-tariff child rows atomically).
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const { exciseRegistrationDetails, exciseTariffItems } = require('../db/schema');

const DEFAULTS = {
  unitName: '',
  address: '',
  state: '',
  pincode: '',
  telephoneNo: '',
  registrationType: 'Dealer',
  typeOfManufacturer: 'Regular',
  eccNumber: '',
  setAlterExciseTariffDetails: 0,
  defineExciseTariffAsMasters: 0,
  deactivateFrom: '',
  tariffs: [],
};

const loadTariffs = async (company_id) => {
  const rows = await db.all(
    sql`SELECT * FROM ${exciseTariffItems}
        WHERE ${exciseTariffItems.companyId} = ${company_id}
        ORDER BY ${exciseTariffItems.sortOrder} ASC, ${exciseTariffItems.id} ASC`
  );
  return (rows || []).map((r) => ({
    tariffName: r.tariff_name || '',
    hsnCode: r.hsn_code || '',
    reportingUom: r.reporting_uom || '',
    valuationType: r.valuation_type || 'Ad Valorem',
    rate: Number(r.rate) || 0,
  }));
};

const get = async (company_id) => {
  try {
    const rows = await db.all(
      sql`SELECT * FROM ${exciseRegistrationDetails}
          WHERE ${exciseRegistrationDetails.companyId} = ${company_id}
          LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return { success: true, exists: false, data: { ...DEFAULTS, tariffs: [] } };
    }

    const r = rows[0];
    const tariffs = await loadTariffs(company_id);
    return {
      success: true,
      exists: true,
      data: {
        unitName: r.unit_name || '',
        address: r.address || '',
        state: r.state || '',
        pincode: r.pincode || '',
        telephoneNo: r.telephone_no || '',
        registrationType: r.registration_type || 'Dealer',
        typeOfManufacturer: r.type_of_manufacturer || 'Regular',
        eccNumber: r.ecc_number || '',
        setAlterExciseTariffDetails: Number(r.set_alter_excise_tariff_details) || 0,
        defineExciseTariffAsMasters: Number(r.define_excise_tariff_as_masters) || 0,
        deactivateFrom: r.deactivate_from || '',
        tariffs,
      },
    };
  } catch (err) {
    console.error('Error fetching excise registration details:', err);
    return { success: false, error: err.message };
  }
};

const toColumns = (data) => ({
  unitName: data.unitName || null,
  address: data.address || null,
  state: data.state || null,
  pincode: data.pincode || null,
  telephoneNo: data.telephoneNo || null,
  registrationType: data.registrationType || 'Dealer',
  // Only meaningful for manufacturers; cleared otherwise.
  typeOfManufacturer: data.registrationType === 'Manufacturer' ? (data.typeOfManufacturer || 'Regular') : null,
  eccNumber: data.eccNumber || null,
  setAlterExciseTariffDetails: Number(data.setAlterExciseTariffDetails) ? 1 : 0,
  defineExciseTariffAsMasters: Number(data.defineExciseTariffAsMasters) ? 1 : 0,
  deactivateFrom: data.deactivateFrom || null,
});

const replaceTariffs = async (company_id, tariffs) => {
  await db.delete(exciseTariffItems).where(eq(exciseTariffItems.companyId, company_id));
  const rows = (tariffs || [])
    .filter((t) => t && String(t.tariffName || '').trim() !== '')
    .map((t, i) => ({
      companyId: company_id,
      tariffName: String(t.tariffName).trim(),
      hsnCode: t.hsnCode || null,
      reportingUom: t.reportingUom || null,
      valuationType: t.valuationType || 'Ad Valorem',
      rate: Number(t.rate) || 0,
      sortOrder: i,
    }));
  if (rows.length > 0) await db.insert(exciseTariffItems).values(rows);
};

const save = async (data) => {
  try {
    const company_id = data.company_id;
    if (!company_id) return { success: false, error: 'Company ID is required' };

    const existing = await db.all(
      sql`SELECT ${exciseRegistrationDetails.companyId} FROM ${exciseRegistrationDetails}
          WHERE ${exciseRegistrationDetails.companyId} = ${company_id}
          LIMIT 1`
    );

    if (existing && existing.length > 0) {
      await db
        .update(exciseRegistrationDetails)
        .set({ ...toColumns(data), updatedAt: sql`datetime('now')` })
        .where(eq(exciseRegistrationDetails.companyId, company_id));
    } else {
      await db
        .insert(exciseRegistrationDetails)
        .values({ companyId: company_id, ...toColumns(data) });
    }

    // Only persist the tariff list when the master flag is on; otherwise clear it.
    if (Number(data.defineExciseTariffAsMasters)) {
      await replaceTariffs(company_id, data.tariffs);
    } else {
      await db.delete(exciseTariffItems).where(eq(exciseTariffItems.companyId, company_id));
    }

    return { success: true };
  } catch (err) {
    console.error('Error saving excise registration details:', err);
    return { success: false, error: err.message };
  }
};

module.exports = { get, save };
