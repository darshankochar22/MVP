// Service Tax Details service — Drizzle ORM (follows payrollStatutoryDetailsService).
//   * READS use db.all(sql`SELECT ...`) so the legacy snake_case shape is preserved
//     and mapped to the camelCase the frontend uses.
//   * MUTATIONS use the query builder (upsert the singleton by company_id, and
//     replace the service-category child rows atomically).
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const { serviceTaxDetails, serviceTaxCategories } = require('../db/schema');

const DEFAULTS = {
  serviceTaxRegistrationNumber: '',
  typeOfOrganisation: 'Individual/Proprietory/One Person Company',
  isMonthlyFormat: 0,
  computeTaxLiabilityBasedOn: 'Accrual',
  setAlterServiceTaxDetails: 0,
  taxLiabilityApplicableFrom: '',
  defineServiceCategoryAsMasters: 0,
  isReverseChargeApplicable: 0,
  deactivateFrom: '',
  categories: [],
};

const loadCategories = async (company_id) => {
  const rows = await db.all(
    sql`SELECT * FROM ${serviceTaxCategories}
        WHERE ${serviceTaxCategories.companyId} = ${company_id}
        ORDER BY ${serviceTaxCategories.sortOrder} ASC, ${serviceTaxCategories.id} ASC`
  );
  return (rows || []).map((r) => ({
    name: r.name || '',
    serviceTaxRate: Number(r.service_tax_rate) || 0,
    educationCessRate: Number(r.education_cess_rate) || 0,
    secondaryEducationCessRate: Number(r.secondary_education_cess_rate) || 0,
    swachhBharatCessRate: Number(r.swachh_bharat_cess_rate) || 0,
    krishiKalyanCessRate: Number(r.krishi_kalyan_cess_rate) || 0,
  }));
};

const get = async (company_id) => {
  try {
    const rows = await db.all(
      sql`SELECT * FROM ${serviceTaxDetails}
          WHERE ${serviceTaxDetails.companyId} = ${company_id}
          LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return { success: true, exists: false, data: { ...DEFAULTS, categories: [] } };
    }

    const r = rows[0];
    const categories = await loadCategories(company_id);
    return {
      success: true,
      exists: true,
      data: {
        serviceTaxRegistrationNumber: r.service_tax_registration_number || '',
        typeOfOrganisation: r.type_of_organisation || DEFAULTS.typeOfOrganisation,
        isMonthlyFormat: Number(r.is_monthly_format) || 0,
        computeTaxLiabilityBasedOn: r.compute_tax_liability_based_on || 'Accrual',
        setAlterServiceTaxDetails: Number(r.set_alter_service_tax_details) || 0,
        taxLiabilityApplicableFrom: r.tax_liability_applicable_from || '',
        defineServiceCategoryAsMasters: Number(r.define_service_category_as_masters) || 0,
        isReverseChargeApplicable: Number(r.is_reverse_charge_applicable) || 0,
        deactivateFrom: r.deactivate_from || '',
        categories,
      },
    };
  } catch (err) {
    console.error('Error fetching service tax details:', err);
    return { success: false, error: err.message };
  }
};

const toColumns = (data) => {
  // "Is monthly format" & "Compute tax liability based on" apply only to
  // Individual/Proprietory/One Person Company; reset them for company types (#146).
  const isIndividual =
    (data.typeOfOrganisation || DEFAULTS.typeOfOrganisation) === 'Individual/Proprietory/One Person Company';
  return {
    serviceTaxRegistrationNumber: data.serviceTaxRegistrationNumber || null,
    typeOfOrganisation: data.typeOfOrganisation || DEFAULTS.typeOfOrganisation,
    isMonthlyFormat: isIndividual && Number(data.isMonthlyFormat) ? 1 : 0,
    computeTaxLiabilityBasedOn: isIndividual ? (data.computeTaxLiabilityBasedOn || 'Accrual') : 'Accrual',
    setAlterServiceTaxDetails: Number(data.setAlterServiceTaxDetails) ? 1 : 0,
    taxLiabilityApplicableFrom: data.taxLiabilityApplicableFrom || null,
    defineServiceCategoryAsMasters: Number(data.defineServiceCategoryAsMasters) ? 1 : 0,
    isReverseChargeApplicable: Number(data.isReverseChargeApplicable) ? 1 : 0,
    deactivateFrom: data.deactivateFrom || null,
  };
};

const replaceCategories = async (company_id, categories) => {
  await db.delete(serviceTaxCategories).where(eq(serviceTaxCategories.companyId, company_id));
  const rows = (categories || [])
    .filter((c) => c && String(c.name || '').trim() !== '')
    .map((c, i) => ({
      companyId: company_id,
      name: String(c.name).trim(),
      serviceTaxRate: Number(c.serviceTaxRate) || 0,
      educationCessRate: Number(c.educationCessRate) || 0,
      secondaryEducationCessRate: Number(c.secondaryEducationCessRate) || 0,
      swachhBharatCessRate: Number(c.swachhBharatCessRate) || 0,
      krishiKalyanCessRate: Number(c.krishiKalyanCessRate) || 0,
      sortOrder: i,
    }));
  if (rows.length > 0) await db.insert(serviceTaxCategories).values(rows);
};

const save = async (data) => {
  try {
    const company_id = data.company_id;
    if (!company_id) return { success: false, error: 'Company ID is required' };

    const existing = await db.all(
      sql`SELECT ${serviceTaxDetails.companyId} FROM ${serviceTaxDetails}
          WHERE ${serviceTaxDetails.companyId} = ${company_id}
          LIMIT 1`
    );

    if (existing && existing.length > 0) {
      await db
        .update(serviceTaxDetails)
        .set({ ...toColumns(data), updatedAt: sql`datetime('now')` })
        .where(eq(serviceTaxDetails.companyId, company_id));
    } else {
      await db
        .insert(serviceTaxDetails)
        .values({ companyId: company_id, ...toColumns(data) });
    }

    // Only persist the category list when the master flag is on; otherwise clear it.
    if (Number(data.defineServiceCategoryAsMasters)) {
      await replaceCategories(company_id, data.categories);
    } else {
      await db.delete(serviceTaxCategories).where(eq(serviceTaxCategories.companyId, company_id));
    }

    return { success: true };
  } catch (err) {
    console.error('Error saving service tax details:', err);
    return { success: false, error: err.message };
  }
};

module.exports = { get, save };
