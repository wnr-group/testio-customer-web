"use client";

import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentCookName: string;
  newCookName: string;
}

export function CartConflictDialog({
  open,
  onClose,
  onConfirm,
  currentCookName,
  newCookName,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Replace cart items"
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#091A36]">
            Replace Cart?
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Your cart currently contains dishes from{" "}
          <strong className="text-[#091A36] font-bold">
            &quot;{currentCookName}&quot;
          </strong>
          . Adding items from{" "}
          <strong className="text-[#091A36] font-bold">
            &quot;{newCookName}&quot;
          </strong>
          will clear your current selection. Do you want to continue?
        </p>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#E8202A] py-3 text-xs font-bold text-white hover:bg-[#c71821] transition-colors"
          >
            Replace Cart
          </button>
        </div>
      </div>
    </div>
  );
}
