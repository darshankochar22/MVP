import { useEffect, useState, useCallback } from "react";
import { VoucherPopupShell } from "@/components/tally-ui/VoucherPopupShell";
import { toLocalIsoDate } from "@/lib/dueDate";

interface Props {
  initialDate: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
  label?: string;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function DatePickerPopup({
  initialDate,
  onClose,
  onConfirm,
  label = "Date",
}: Props) {
  const parsed = new Date(initialDate || Date.now());
  const safeDate = isNaN(parsed.getTime()) ? new Date() : parsed;

  const [viewYear, setViewYear] = useState(safeDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(safeDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(safeDate);
  // highlightedDay is 0-based index within the current month (0 = day 1)
  const [highlightedDay, setHighlightedDay] = useState(safeDate.getDate() - 1);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const today = new Date();

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  const isSelected = (day: number) =>
    day === selectedDate.getDate() &&
    viewMonth === selectedDate.getMonth() &&
    viewYear === selectedDate.getFullYear();

  // Month navigation moves selectedDate to the same day-of-month in the newly
  // viewed month (clamped to its length), so Enter always confirms what's shown.
  const navigateMonth = useCallback(
    (delta: number) => {
      const first = new Date(viewYear, viewMonth + delta, 1);
      const y = first.getFullYear();
      const m = first.getMonth();
      const dim = new Date(y, m + 1, 0).getDate();
      const day = Math.min(selectedDate.getDate(), dim);
      setViewYear(y);
      setViewMonth(m);
      setSelectedDate(new Date(y, m, day));
      setHighlightedDay(day - 1);
    },
    [viewYear, viewMonth, selectedDate]
  );

  const handlePrevMonth = useCallback(() => navigateMonth(-1), [navigateMonth]);
  const handleNextMonth = useCallback(() => navigateMonth(1), [navigateMonth]);

  // Select a day in the currently-viewed month and keep highlight in sync
  const selectDay = useCallback(
    (day: number) => {
      setSelectedDate(new Date(viewYear, viewMonth, day));
      setHighlightedDay(day - 1);
    },
    [viewYear, viewMonth]
  );

  const handleConfirm = useCallback(() => {
    onConfirm(toLocalIsoDate(selectedDate));
    onClose();
  }, [selectedDate, onConfirm, onClose]);

  // Arrow keys update BOTH highlightedDay AND selectedDate (both setters called
  // at handler level — never one inside the other's updater) so pressing Enter
  // immediately after navigating always confirms the right day.
  // Escape + Alt+A are handled by VoucherPopupShell.
  useEffect(() => {
    // day is 1-based within the viewed month
    const moveTo = (day: number) => {
      const clamped = Math.min(Math.max(day, 1), daysInMonth);
      setHighlightedDay(clamped - 1);
      setSelectedDate(new Date(viewYear, viewMonth, clamped));
    };

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); handleConfirm(); return; }
      if (e.key === "PageUp") { e.preventDefault(); handlePrevMonth(); return; }
      if (e.key === "PageDown") { e.preventDefault(); handleNextMonth(); return; }

      if (e.key === "ArrowRight") { e.preventDefault(); moveTo(highlightedDay + 2); }
      if (e.key === "ArrowLeft") { e.preventDefault(); moveTo(highlightedDay); }
      if (e.key === "ArrowDown") { e.preventDefault(); moveTo(highlightedDay + 8); }
      if (e.key === "ArrowUp") { e.preventDefault(); moveTo(highlightedDay - 6); }
      if (e.key === "Home") { e.preventDefault(); moveTo(1); }
      if (e.key === "End") { e.preventDefault(); moveTo(daysInMonth); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleConfirm, handlePrevMonth, handleNextMonth, daysInMonth, viewYear, viewMonth, highlightedDay]);

  // Build the calendar grid weeks
  const renderCalendar = () => {
    const weeks: React.ReactElement[] = [];
    let dayCounter = 1;
    let nextMonthDay = 1;
    let weekIndex = 0;

    while (dayCounter <= daysInMonth) {
      const week: React.ReactElement[] = [];

      for (let col = 0; col < 7; col++) {
        if (weekIndex === 0 && col < firstWeekday) {
          // Previous month overflow
          const prevDay = daysInPrevMonth - firstWeekday + col + 1;
          week.push(
            <div key={`prev-${col}`} className="h-8 w-8 flex items-center justify-center text-xs text-gray-400">
              {prevDay}
            </div>
          );
        } else if (dayCounter > daysInMonth) {
          // Next month overflow
          week.push(
            <div key={`next-${nextMonthDay}`} className="h-8 w-8 flex items-center justify-center text-xs text-gray-400">
              {nextMonthDay++}
            </div>
          );
        } else {
          const d = dayCounter;
          const isHi = highlightedDay === d - 1;
          const isSel = isSelected(d);
          const isTod = isToday(d);

          week.push(
            <div
              key={`day-${d}`}
              className={`h-8 w-8 flex items-center justify-center text-xs cursor-pointer ${
                isHi
                  ? "bg-black text-white font-bold"
                  : isSel
                  ? "border border-black text-black font-bold"
                  : isTod
                  ? "text-black font-bold underline"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
              onClick={() => selectDay(d)}
              onMouseEnter={() => setHighlightedDay(d - 1)}
            >
              {d}
            </div>
          );
          dayCounter++;
        }
      }

      weeks.push(
        <div key={`week-${weekIndex}`} className="flex">
          {week}
        </div>
      );
      weekIndex++;
      if (dayCounter > daysInMonth) break;
    }
    return weeks;
  };

  return (
    <VoucherPopupShell
      size="compact"
      title={`${label} Selection`}
      headerRight={
        <span className="font-bold text-black">
          {selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      }
      onClose={onClose}
      onAccept={handleConfirm}
      hint="↑↓←→ Navigate · PgUp/PgDn: Month · Enter: Accept · Esc: Cancel"
    >
      {/* Month / Year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-sm font-bold text-black">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-2 border-b border-gray-300">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col">{renderCalendar()}</div>
    </VoucherPopupShell>
  );
}
