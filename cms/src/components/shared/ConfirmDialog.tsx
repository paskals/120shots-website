import { useState } from "react";

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: "danger" | "warning";
  requireDoubleConfirm?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmVariant,
  requireDoubleConfirm = false,
  onConfirm,
  onCancel,
}: Props) {
  const [step, setStep] = useState(1);

  const isDanger = confirmVariant === "danger";
  const buttonColor = isDanger
    ? "bg-red-600 hover:bg-red-700"
    : "bg-amber-600 hover:bg-amber-700";

  const handleConfirm = () => {
    if (requireDoubleConfirm && step === 1) {
      setStep(2);
    } else {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full mx-4 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
        <p className="text-sm text-zinc-600 mb-6">{message}</p>

        {requireDoubleConfirm && step === 2 && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              isDanger ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            Click again to confirm this action.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${buttonColor}`}
          >
            {step === 2 ? `Confirm ${confirmLabel}` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
