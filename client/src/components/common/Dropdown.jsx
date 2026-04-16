import React from "react";
import { cn } from "../../utils/cn";

export default function Dropdown({
     label,
     value,
     onChange,
     defaultValue = "Select an option",
     options = [],
     className = "",
 }) {

    const normalizedOptions = options.map((opt) => {
        if (typeof opt === "string") {
            return { label: opt, value: opt };
        }
        return opt;
    });

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            <div className="relative">
                <select
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        "w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-white",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        "appearance-none pr-10 text-gray-800",
                        className
                    )}
                >
                    <option value="" className="text-gray-400">{defaultValue}</option>

                    {normalizedOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>

                {/* Custom chevron */}
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
