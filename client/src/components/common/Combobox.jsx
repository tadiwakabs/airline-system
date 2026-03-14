import React, { useEffect, useRef, useState } from "react";

export default function Combobox({
     label,
     options = [],
     value,
     onChange,
     onSearch,
     placeholder = "Search...",
     emptyMessage = "No results found",
 }) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const wrapperRef = useRef(null);

    const normalizedOptions = options.map((opt) => {
        if (typeof opt === "string") {
            return { label: opt, value: opt };
        }
        return opt;
    });

    const selectedOption = normalizedOptions.find((opt) => opt.value === value);

    useEffect(() => {
        if (!isOpen && selectedOption) {
            setInputValue(selectedOption.label);
        }
    }, [isOpen, selectedOption]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                if (selectedOption) {
                    setInputValue(selectedOption.label);
                }
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
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                    const newValue = e.target.value;
                    setInputValue(newValue);
                    setIsOpen(true);
                    onSearch?.(newValue);
                }}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                    {normalizedOptions.length > 0 ? (
                        normalizedOptions.map((option) => (
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
