// VAT Registration Details service — Drizzle ORM (follows exciseRegistrationDetailsService).
//   * READS use db.all(sql`SELECT ...`) and map snake_case → camelCase.
//   * MUTATIONS use the query builder (upsert the singleton by company_id, and
//     replace the VAT-commodity child rows atomically).
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const { vatRegistrationDetails, vatCommodities } = require('../db/schema');

const DEFAULTS = {
  state: '',
  tin: '',
  interstateSalesTaxNumber: '',
  setAlterTaxRateDetails: 0,
  taxRate: 0,
  taxType: 'Unknown',
  defineVatCommodityAsMasters: 0,
  deactivateFrom: '',
  commodities: [],
};

const loadCommodities = async (company_id) => {
  const rows = await db.all(
    sql`SELECT * FROM ${vatCommodities}
        WHERE ${vatCommodities.companyId} = ${company_id}
        ORDER BY ${vatCommodities.sortOrder} ASC, ${vatCommodities.id} ASC`
  );
  return (rows || []).map((r) => ({
    name: r.name || '',
    rate: Number(r.rate) || 0,
    taxType: r.tax_type || 'Unknown',
  }));
};

const get = async (company_id) => {
  try {
    const rows = await db.all(
      sql`SELECT * FROM ${vatRegistrationDetails}
          WHERE ${vatRegistrationDetails.companyId} = ${company_id}
          LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return { success: true, exists: false, data: { ...DEFAULTS, commodities: [] } };
    }

    const r = rows[0];
    const commodities = await loadCommodities(company_id);
    return {
      success: true,
      exists: true,
      data: {
        state: r.state || '',
        tin: r.tin || '',
        interstateSalesTaxNumber: r.interstate_sales_tax_number || '',
        setAlterTaxRateDetails: Number(r.set_alter_tax_rate_details) || 0,
        taxRate: Number(r.tax_rate) || 0,
        taxType: r.tax_type || 'Unknown',
        defineVatCommodityAsMasters: Number(r.define_vat_commodity_as_masters) || 0,
        deactivateFrom: r.deactivate_from || '',
        commodities,
      },
    };
  } catch (err) {
    console.error('Error fetching VAT registration details:', err);
    return { success: false, error: err.message };
  }
};

const toColumns = (data) => ({
  state: data.state || null,
  tin: data.tin || null,
  interstateSalesTaxNumber: data.interstateSalesTaxNumber || null,
  setAlterTaxRateDetails: Number(data.setAlterTaxRateDetails) ? 1 : 0,
  taxRate: Number(data.taxRate) || 0,
  taxType: data.taxType || 'Unknown',
  defineVatCommodityAsMasters: Number(data.defineVatCommodityAsMasters) ? 1 : 0,
  deactivateFrom: data.deactivateFrom || null,
});

const replaceCommodities = async (company_id, commodities) => {
  await db.delete(vatCommodities).where(eq(vatCommodities.companyId, company_id));
  const rows = (commodities || [])
    .filter((c) => c && String(c.name || '').trim() !== '')
    .map((c, i) => ({
      companyId: company_id,
      name: String(c.name).trim(),
      rate: Number(c.rate) || 0,
      taxType: c.taxType || 'Unknown',
      sortOrder: i,
    }));
  if (rows.length > 0) await db.insert(vatCommodities).values(rows);
};

const save = async (data) => {
  try {
    const company_id = data.company_id;
    if (!company_id) return { success: false, error: 'Company ID is required' };

    const existing = await db.all(
      sql`SELECT ${vatRegistrationDetails.companyId} FROM ${vatRegistrationDetails}
          WHERE ${vatRegistrationDetails.companyId} = ${company_id}
          LIMIT 1`
    );

    if (existing && existing.length > 0) {
      await db
        .update(vatRegistrationDetails)
        .set({ ...toColumns(data), updatedAt: sql`datetime('now')` })
        .where(eq(vatRegistrationDetails.companyId, company_id));
    } else {
      await db
        .insert(vatRegistrationDetails)
        .values({ companyId: company_id, ...toColumns(data) });
    }

    if (Number(data.defineVatCommodityAsMasters)) {
      await replaceCommodities(company_id, data.commodities);
    } else {
      await db.delete(vatCommodities).where(eq(vatCommodities.companyId, company_id));
    }

    return { success: true };
  } catch (err) {
    console.error('Error saving VAT registration details:', err);
    return { success: false, error: err.message };
  }
};

module.exports = { get, save };
