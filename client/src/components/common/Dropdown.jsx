import React from "react";

export default function Dropdown({
     label,
     value,
     onChange,
     defaultValue = "Select an option",
     options = [],
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

            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">{defaultValue}</option>

                {normalizedOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
