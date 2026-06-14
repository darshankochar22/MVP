import { useState } from "react";
import { Link } from "react-router-dom";

type MenuItem = {
  label: string;
  route?: string;
  highlightLetter?: string;
  subMenu?: MenuConfig;
  action?: "QUIT";
};

type MenuSection = {
  title?: string;
  items: MenuItem[];
};

type MenuConfig = {
  title: string;
  sections: MenuSection[];
};

export default function Gateway() {
  const [menuStack, setMenuStack] = useState<MenuConfig[]>([]);

  const gstReportsMenu: MenuConfig = {
    title: "GST Reports",
    sections: [
      {
        title: "GST RETURNS/COMPUTATIONS",
        items: [
          { label: "Track GST Return Activities", highlightLetter: "R" },
          { label: "GSTR-1", highlightLetter: "1" },
          { label: "GSTR-3B", highlightLetter: "3" },
          { label: "Annual Computation", highlightLetter: "A" },
        ],
      },
      {
        title: "EXCHANGE REPORTS",
        items: [
          { label: "e-Way Bill", highlightLetter: "W" },
        ],
      },
      {
        title: "RECONCILIATION REPORTS",
        items: [
          { label: "GSTR-1 Reconciliation", highlightLetter: "G" },
          { label: "GSTR-2A Reconciliation", highlightLetter: "2" },
          { label: "GSTR-2B Reconciliation", highlightLetter: "B" },
          { label: "Challan Reconciliation", highlightLetter: "C" },
        ],
      },
      {
        items: [
          { label: "Invoice Management System (IMS)", highlightLetter: "M" },
        ],
      },
      {
        items: [
          { label: "GST Utilities", highlightLetter: "U" },
        ],
      },
      {
        items: [
          { label: "Other Reports", highlightLetter: "O" },
        ],
      },
      {
        items: [
          { label: "Quit", highlightLetter: "Q", action: "QUIT" },
        ],
      },
    ],
  };

  const statutoryReportsMenu: MenuConfig = {
    title: "Statutory Reports",
    sections: [
      {
        items: [
          { label: "GST Reports", highlightLetter: "G", subMenu: gstReportsMenu },
          { label: "TDS Reports", highlightLetter: "T" },
          { label: "TCS Reports", highlightLetter: "C" },
        ],
      },
      {
        items: [
          { label: "Payroll Reports", highlightLetter: "P" },
        ],
      },
      {
        items: [
          { label: "Central Excise Reports", highlightLetter: "E" },
          { label: "Service Tax Reports", highlightLetter: "S" },
        ],
      },
      {
        items: [
          { label: "MSME Reports", highlightLetter: "M" },
        ],
      },
      {
        items: [
          { label: "Quit", highlightLetter: "Q", action: "QUIT" },
        ],
      },
    ],
  };

  const displayMoreReportsMenu: MenuConfig = {
    title: "Display More Reports",
    sections: [
      {
        title: "ACCOUNTING",
        items: [
          { label: "Trial Balance", highlightLetter: "T" },
          { label: "Day Book", highlightLetter: "D" },
          { label: "Cash Flow", highlightLetter: "C" },
          { label: "Funds Flow", highlightLetter: "F" },
        ],
      },
      {
        items: [
          { label: "Account Books", highlightLetter: "A" },
          { label: "Statements of Accounts", highlightLetter: "S" },
        ],
      },
      {
        title: "INVENTORY",
        items: [
          { label: "Inventory Books", highlightLetter: "I" },
          { label: "Statements of Inventory", highlightLetter: "E" },
          { label: "Job Work Reports", highlightLetter: "J" },
        ],
      },
      {
        title: "STATUTORY",
        items: [
          { label: "Statutory Reports", highlightLetter: "O", subMenu: statutoryReportsMenu },
        ],
      },
      {
        title: "PAYROLL",
        items: [
          { label: "Payroll Reports", highlightLetter: "P" },
        ],
      },
      {
        title: "EXCEPTION",
        items: [
          { label: "Exception Reports", highlightLetter: "X" },
          { label: "Analysis & Verification", highlightLetter: "V" },
        ],
      },
      {
        items: [
          { label: "Quit", highlightLetter: "Q", action: "QUIT" },
        ],
      },
    ],
  };

  const rootMenu: MenuConfig = {
    title: "Gateway of Tally",
    sections: [
      {
        title: "Masters",
        items: [
          { label: "Create", route: "/master/create", highlightLetter: "C" },
          { label: "Alter", route: "/master/alter", highlightLetter: "A" },
          { label: "Chart of Accounts", route: "/master/coa", highlightLetter: "H" },
          { label: "Financial Years", route: "/master/financial-years", highlightLetter: "F" },
        ],
      },
      {
        title: "Transactions",
        items: [
          { label: "Vouchers", route: "/transactions/vouchers", highlightLetter: "V" },
          { label: "Voucher Register", route: "/transactions/voucher-list", highlightLetter: "R" },
          { label: "Day Book", route: "/transactions/daybook", highlightLetter: "D" },
        ],
      },
      {
        title: "Utilities",
        items: [
          { label: "Banking", route: "/utilities/banking", highlightLetter: "N" },
        ],
      },
      {
        title: "Reports",
        items: [
          { label: "Balance Sheet", highlightLetter: "B" },
          { label: "Profit & Loss A/c", highlightLetter: "P" },
          { label: "Stock Summary", highlightLetter: "S" },
          { label: "Ratio Analysis", highlightLetter: "R" },
          { label: "Display More Reports", subMenu: displayMoreReportsMenu, highlightLetter: "D" },
        ],
      },
      {
        title: "Dashboard",
        items: [],
      },
      {
        title: "Quit",
        items: [],
      },
    ],
  };

  const currentMenu = menuStack.length > 0 ? menuStack[menuStack.length - 1] : rootMenu;

  const handleMenuClick = (item: MenuItem) => {
    if (item.action === "QUIT") {
      setMenuStack((prev) => prev.slice(0, -1));
    } else if (item.subMenu) {
      setMenuStack((prev) => [...prev, item.subMenu!]);
    }
  };

  const renderLabel = (label: string, highlightLetter?: string) => {
    return label;
  };

  return (
    <aside className="w-72 min-h-full border flex flex-col px-10 py-10 gap-6">

      <div className="text-xl font-semibold pb-2 flex flex-col gap-1">
        <button
          onClick={() => setMenuStack([])}
          className="text-left hover:underline outline-none"
        >
          Gateway of Tally
        </button>
        {menuStack.map((menu, idx) => (
          <button
            key={idx}
            onClick={() => setMenuStack(prev => prev.slice(0, idx + 1))}
            className="text-left hover:underline outline-none text-base font-normal text-gray-600"
          >
            {menu.title}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {currentMenu.sections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-2">

            {section.title && (
              <div className="font-semibold text-lg">
                {section.title}
              </div>
            )}

            {section.items.length > 0 && (
              <div className="flex flex-col pl-4 gap-1">
                {section.items.map((item, itemIdx) => {
                  const itemClass = "text-left rounded px-2 py-1";

                  if (item.route) {
                    return (
                      <Link
                        key={itemIdx}
                        to={item.route}
                        className={itemClass}
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={itemIdx}
                      onClick={() => handleMenuClick(item)}
                      className={itemClass}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        ))}
      </div>

    </aside>
  );
}