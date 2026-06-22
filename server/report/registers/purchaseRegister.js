const { getRegisterData } = require('../utils/registerBuilder');

const purchaseRegister = async (company_id, fy_id) => {
  try {
    const rows = await getRegisterData(company_id, fy_id, 'Purchase');
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { purchaseRegister };