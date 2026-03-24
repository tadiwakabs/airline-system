import React, { useState, useRef, useEffect } from "react";

const PASSENGER_TYPES = [
    {
        key: "adults",
        label: "Adults",
        sublabel: "Age 12+",
        min: 1,
    },
    {
        key: "children",
        label: "Children",
        sublabel: "Age 2–11",
        min: 0,
    },
    {
        key: "infants",
        label: "Infants",
        sublabel: "Under 2",
        min: 0,
    },
];

const MAX_TOTAL = 15;

function Counter({ value, onDecrement, onIncrement, disableDecrement, disableIncrement }) {
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={onDecrement}
                disabled={disableDecrement}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600
                           hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                −
            </button>
            <span className="w-4 text-center font-semibold text-gray-800">{value}</span>
            <button
                type="button"
                onClick={onIncrement}
                disabled={disableIncrement}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600
                           hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                +
            </button>
        </div>
    );
}

export default function PassengerSelector({ label = "Passengers", value, onChange, error }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // value shape: { adults: number, children: number, infants: number }
    const counts = value || { adults: 1, children: 0, infants: 0 };
    const total = counts.adults + counts.children + counts.infants;

    const summaryText =
        total === 1
            ? "1 Passenger"
            : `${total} Passengers` +
            (counts.children > 0 || counts.infants > 0
                ? ` (${counts.adults}A${counts.children > 0 ? `, ${counts.children}C` : ""}${counts.infants > 0 ? `, ${counts.infants}I` : ""})`
                : "");

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (key, delta) => {
        const next = { ...counts, [key]: counts[key] + delta };

        // Infants cannot exceed adults
        if (next.infants > next.adults) return;

        onChange(next);
    };

    const canIncrement = (key) => {
        if (total >= MAX_TOTAL) return false;
        if (key === "infants" && counts.infants >= counts.adults) return false;
        return true;
    };

    const canDecrement = (key) => {
        const type = PASSENGER_TYPES.find((t) => t.key === key);
        return counts[key] > type.min;
    };

    return (
        <div className="relative space-y-1" ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">{label}</label>
            )}

            {/* Trigger button styled to match other inputs */}
            <button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                className={`w-full rounded-xl border px-4 py-2.5 bg-white text-left text-base
                            focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                            ${error ? "border-red-500" : "border-gray-300"}`}
            >
                <span className="text-gray-800">{summaryText}</span>
                <span className="float-right text-gray-400 mt-0.5">{isOpen ? "▲" : "▼"}</span>
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Popover */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-4">
                    {PASSENGER_TYPES.map((type) => (
                        <div key={type.key} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{type.label}</p>
                                <p className="text-xs text-gray-400">{type.sublabel}</p>
                            </div>
                            <Counter
                                value={counts[type.key]}
                                onDecrement={() => handleChange(type.key, -1)}
                                onIncrement={() => handleChange(type.key, +1)}
                                disableDecrement={!canDecrement(type.key)}
                                disableIncrement={!canIncrement(type.key)}
                            />
                        </div>
                    ))}

                    <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                        <p className="text-xs text-gray-400">Max {MAX_TOTAL} passengers. Infants ≤ Adults.</p>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
