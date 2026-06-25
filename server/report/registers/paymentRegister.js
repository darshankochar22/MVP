const { getRegisterData } = require('../utils/registerBuilder');
const paymentRegister = async (company_id, fy_id) => {
  try {
    const rows = await getRegisterData(company_id, fy_id, 'Payment');
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
module.exports = { paymentRegister };
