import { useEffect } from "react";

interface ShortcutConfig {
  onAccept?: () => void;
  onQuit?: () => void;
  onDelete?: () => void;
  onCreate?: () => void;
}

export function useMasterShortcuts({
  onAccept,
  onQuit,
  onDelete,
  onCreate,
}: ShortcutConfig) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onQuit) {
          e.preventDefault();
          onQuit();
        }
      }
      if (e.altKey && e.key.toLowerCase() === "a") {
        if (onAccept) {
          e.preventDefault();
          onAccept();
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "a") {
        if (onAccept) {
          e.preventDefault();
          onAccept();
        }
      }
      if (e.altKey && e.key.toLowerCase() === "d") {
        if (onDelete) {
          e.preventDefault();
          onDelete();
        }
      }
      if (e.altKey && e.key.toLowerCase() === "c") {
        if (onCreate) {
          e.preventDefault();
          onCreate();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAccept, onQuit, onDelete, onCreate]);
}
