import { Link } from "react-router-dom";

export default function Gateway() {
  const sections = [
    {
      title: "Masters",
      items: ["Create", "Alter", "Chart of Accounts", "Financial Years"],
    },
    {
      title: "Transactions",
      items: ["Vouchers", "Voucher Register", "Day Book"],
    },
    {
      title: "Utilities",
      items: ["Banking"],
    },
    {
      title: "Reports",
      items: [
        "Balance Sheet",
        "Profit & Loss A/c",
        "Stock Summary",
        "Ratio Analysis",
        "Display More Reports",
      ],
    },
  ];

  const getRoute = (section: string, item: string) => {
    if (section === "Masters" || section === "Transactions" || section === "Utilities") {
      if (item === "Create") return "/master/create";
      if (item === "Alter") return "/master/alter";
      if (item === "Chart of Accounts") return "/master/coa";
      if (item === "Financial Years") return "/master/financial-years";
      if (item === "Vouchers") return "/transactions/vouchers";
      if (item === "Voucher Register") return "/transactions/voucher-list";
      if (item === "Day Book") return "/transactions/daybook";
      if (item === "Banking") return "/utilities/banking";
    }
    return null;
  };

  return (
    <div className="w-full max-w-md border border-zinc-200 rounded bg-white shadow-xs p-6 flex flex-col gap-6 select-none font-sans">
      
      {/* Header */}
      <div className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-150 pb-2 flex justify-between items-center">
        <span>Gateway of Tally</span>
        <span className="text-[9px] bg-zinc-900 text-white px-1.5 py-0.5 rounded font-mono">Main Menu</span>
      </div>

      {/* Menu Sections */}
      <div className="flex flex-col gap-5">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1.5">
            
            {/* Section Header */}
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {section.title}
            </div>

            {/* Section Items */}
            {section.items.length > 0 && (
              <div className="flex flex-col pl-2 gap-1 border-l border-zinc-150 ml-1">
                {section.items.map((item) => {
                  const route = getRoute(section.title, item);
                  const isSelectable = !!route;

                  const btnClass = `w-full text-left px-2.5 py-1.5 text-xs rounded transition-all select-none ${
                    isSelectable
                      ? "text-zinc-800 hover:bg-zinc-900 hover:text-white cursor-pointer font-medium"
                      : "text-zinc-300 cursor-not-allowed opacity-50 font-normal"
                  }`;

                  if (route) {
                    return (
                      <Link
                        key={item}
                        to={route}
                        className={btnClass}
                      >
                        {item}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item}
                      disabled
                      className={btnClass}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        ))}
      </div>
      
    </div>
  );
}