const { getRegisterData } = require('../utils/registerBuilder');

const salesRegister = async (company_id, fy_id) => {
  try {
    const rows = await getRegisterData(company_id, fy_id, 'Sales');
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { salesRegister };