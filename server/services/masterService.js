const tallyFeaturesService = require('./tallyFeaturesService');

const getMenu = async (company_id = 1) => {
  try {
    const featureResult = await tallyFeaturesService.get(company_id);
    const features = featureResult.success ? featureResult.features : {};

    const menu = [];

    // 1. Accounting Masters
    const accountingItems = ["Group", "Ledger", "Currency", "Voucher Type"];
    if (features.enable_cost_centres) {
      accountingItems.push("Cost Centre");
    }
    menu.push({ title: "Accounting Masters", items: accountingItems });

    // 2. Inventory Masters
    // Tally shows Inventory masters if maintain_inventory is 1
    if (features.maintain_inventory !== 0) {
      const inventoryItems = ["Stock Group", "Stock Category", "Stock Items", "Unit", "Location"];
      menu.push({ title: "Inventory Masters", items: inventoryItems });
    }

    // 3. Statutory Masters
    // Tally shows Statutory masters if GST is enabled or default lists it.
    menu.push({
      title: "Statutory Masters",
      items: ["GST Registration", "GST Classification", "Statutory Details", "Company GST Details", "PAN / CIN Details"]
    });

    // 4. Payroll Masters (Optional based on MVP)
    // Since controllers exist for employee, attendance, salary structure
    menu.push({
      title: "Payroll Masters",
      items: ["Employee Group", "Employee", "Attendance Type", "Pay Head", "Payroll Unit", "Salary Structure"]
    });

    return { success: true, menu };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = {
  getMenu
};