import React from "react";

export default function DatePicker({
                                       label,
                                       value,
                                       onChange,
                                       min,
                                       max,
                                   }) {
    return (
        <div className="space-y-1">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
            <input
                type="date"
                value={value}
                min={min}
                max={max}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}
