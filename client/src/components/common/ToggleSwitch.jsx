import React from "react";
import { cn } from "../../utils/cn";

export default function ToggleSwitch({ label, isActive = false, onToggle }) {
    return (
        <div className="flex items-center gap-3">
            {label && <span className="text-sm font-medium text-gray-700">{label}</span>}

            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    "relative w-14 h-8 rounded-full transition-colors duration-200",
                    isActive ? "bg-blue-600" : "bg-gray-300"
                )}
            >
        <span
            className={cn(
                "absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform duration-200",
                isActive ? "translate-x-6" : "translate-x-0"
            )}
        />
            </button>
        </div>
    );
}
