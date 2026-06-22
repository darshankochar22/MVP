const voucherService = require('../../voucher/voucherService');

const daybook = async (company_id, fy_id, from_date, to_date) => {
  try {
    const { vouchers } = await voucherService.getDaybook(company_id, fy_id, from_date, to_date);

    const result = [];
    for (const v of vouchers) {
      const full = await voucherService.getById(v.voucher_id);
      if (full.success) result.push(full.voucher);
    }

    return { success: true, vouchers: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { daybook };