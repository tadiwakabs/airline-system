import React, { useEffect } from "react";
import { cn } from "../../utils/cn";

export default function Modal({
      isOpen,
      onClose,
      title,
      children,
      footer,
      closeOnOverlayClick = true,
      className = "",
  }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === "Escape") {
                onClose?.();
            }
        };

        document.addEventListener("keydown", handleEscape);

        // Prevent body scroll while modal is open
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = () => {
        if (closeOnOverlayClick) {
            onClose?.();
        }
    };

    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={handleOverlayClick}
        >
            <div
                className={cn(
                    "w-full max-w-lg rounded-2xl bg-white shadow-xl",
                    "max-h-[90vh] overflow-hidden",
                    className
                )}
                onClick={handleModalClick}
                role="dialog"
                aria-modal="true"
                aria-label={title || "Modal"}
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                    {children}
                </div>

                {footer && (
                    <div className="border-t border-gray-200 px-5 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
