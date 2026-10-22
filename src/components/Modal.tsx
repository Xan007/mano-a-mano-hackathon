import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { m } from "motion/react";
import { useCalmMotion } from "../lib/motion";

const stack: HTMLElement[] = [];
let savedOverflow = "";
let savedInert = false;
const focusable =
  'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]';
export function Modal({
  children,
  labelledBy,
  describedBy,
  onClose,
  className = "",
  align = "center",
  dark = false,
}: {
  dark?: boolean;
  children: ReactNode;
  labelledBy: string;
  describedBy?: string;
  onClose?: () => void;
  className?: string;
  align?: "center" | "bottom" | "chat";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const reduce = useCalmMotion();
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const node = panel.current!;
    const previous = document.activeElement as HTMLElement | null;
    const root = document.getElementById("root");
    if (!stack.length) {
      savedOverflow = document.body.style.overflow;
      savedInert = root?.inert ?? false;
      document.body.style.overflow = "hidden";
      if (root) root.inert = true;
    }
    stack.push(node);
    const first =
      node.querySelector<HTMLElement>("[data-autofocus]") ??
      node.querySelector<HTMLElement>(focusable);
    (first ?? node).focus({ preventScroll: true });
    function keydown(event: KeyboardEvent) {
      if (stack.at(-1) !== node) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current?.();
      }
      if (event.key === "Tab") {
        const items = [...node.querySelectorAll<HTMLElement>(focusable)].filter(
          (item) => item.getClientRects().length > 0,
        );
        const firstItem = items[0],
          lastItem = items.at(-1);
        if (!firstItem) {
          event.preventDefault();
          node.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === firstItem ||
            !node.contains(document.activeElement))
        ) {
          event.preventDefault();
          lastItem?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === lastItem ||
            !node.contains(document.activeElement))
        ) {
          event.preventDefault();
          firstItem.focus();
        }
      }
    }
    document.addEventListener("keydown", keydown, true);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      stack.splice(stack.indexOf(node), 1);
      if (!stack.length) {
        document.body.style.overflow = savedOverflow;
        if (root) root.inert = savedInert;
      }
      if (previous?.isConnected && !previous.closest("[inert]"))
        previous.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <m.div
      style={dark ? { backgroundColor: "rgba(8,13,26,.96)" } : undefined}
      className={`fixed inset-0 z-[100] flex bg-ink/45 p-3 ${align === "bottom" ? "items-end justify-center sm:items-center" : align === "chat" ? "items-end justify-end pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-5" : "items-center justify-center"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
    >
      <m.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={className}
        initial={reduce ? false : { opacity: 0, y: 18, scale: 0.975 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.985 }}
        transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </m.div>,
    document.body,
  );
}
