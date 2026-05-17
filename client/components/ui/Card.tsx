import { Link } from "react-router-dom";

export type OptionType = { label: string; path?: string };

type MenuCardProps = {
  options: OptionType[];
};

export default function MenuCard({
  options,
}: MenuCardProps) {
  return (
    <div className="absolute top-12 left-0 border rounded shadow-md p-3 w-56 flex flex-col gap-2 bg-white z-50">

      {options.map((option) => (
        option.path ? (
          <Link
            key={option.label}
            to={option.path}
            className="text-left px-2 py-1 rounded hover:bg-gray-100"
          >
            {option.label}
          </Link>
        ) : (
          <button
            key={option.label}
            className="text-left px-2 py-1 rounded hover:bg-gray-100 text-gray-500 cursor-not-allowed"
          >
            {option.label}
          </button>
        )
      ))}

    </div>
  );
}