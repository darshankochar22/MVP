import type { ReactNode } from "react";

interface Props {
  type: "error" | "success";
  message: string;
  onDismiss?: () => void;
  /** Extra buttons / links to render next to dismiss */
  actions?: ReactNode;
}

const STYLES = {
  error:   "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
};

const DISMISS_STYLES = {
  error:   "text-red-500 hover:text-red-700",
  success: "text-green-500 hover:text-green-700",
};

export default function AlertBanner({ type, message, onDismiss, actions }: Props) {
  return (
    <div
      className={`px-3 py-1.5 border-b text-xs flex justify-between items-center transition-all animate-slide-down ${STYLES[type]}`}
    >
      <span className="font-semibold">• {message}</span>
      <div className="flex items-center gap-3">
        {actions}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`font-bold font-sans ${DISMISS_STYLES[type]}`}
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
