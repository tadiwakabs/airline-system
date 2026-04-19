import React, { useEffect, useMemo, useRef, useState } from "react";

export default function Combobox({
     label,
     options = [],
     value,
     onChange,
     onSearch,
     placeholder = "Search...",
     emptyMessage = "No results found",
                                     disabled = false,
 }) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [hasTyped, setHasTyped] = useState(false);
    const wrapperRef = useRef(null);

    const normalizedOptions = useMemo(
        () =>
            options.map((opt) => {
                if (typeof opt === "string") {
                    return { label: opt, value: opt };
                }
                return opt;
            }),
        [options]
    );

    const selectedOption = normalizedOptions.find((opt) => opt.value === value);

    const filteredOptions = useMemo(() => {
        if (!hasTyped) return normalizedOptions;

        const search = inputValue.trim().toLowerCase();
        if (!search) return normalizedOptions;

        return normalizedOptions.filter((option) => {
            const label = String(option.label ?? "").toLowerCase();
            const val = String(option.value ?? "").toLowerCase();
            return label.includes(search) || val.includes(search);
        });
    }, [normalizedOptions, inputValue, hasTyped]);

    useEffect(() => {
        if (!isOpen) {
            setInputValue(selectedOption?.label || "");
            setHasTyped(false);
        }
    }, [isOpen, selectedOption]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setInputValue(selectedOption?.label || "");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedOption]);

    const handleSelect = (option) => {
        onChange(option.value);
        setInputValue(option.label);
        setIsOpen(false);
    };

    const handleFocus = () => {
        setHasTyped(false);
        setIsOpen(true);
    };

    return (
        <div className="relative space-y-1" ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            <input
                type="text"
                value={inputValue}
                placeholder={placeholder}
                onChange={(e) => {
                    const newValue = e.target.value;
                    setInputValue(newValue);
                    setHasTyped(true);
                    setIsOpen(true);
                    onSearch?.(newValue);
                }}
                disabled={disabled}
                onFocus={disabled ? undefined : handleFocus}
                className={`w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    disabled ? "cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200" : ""
                }`}
            />

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option)}
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                            >
                                {option.label}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            {emptyMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
