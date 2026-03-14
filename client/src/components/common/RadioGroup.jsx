import React from "react";

export default function RadioGroup({
       label,
       name,
       options = [],
       selectedValue,
       onChange,
   }) {
    return (
        <div className="space-y-2">
            {label && <p className="font-medium text-gray-800">{label}</p>}

            <div className="flex flex-wrap gap-4">
                {options.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={selectedValue === option.value}
                            onChange={(e) => onChange(e.target.value)}
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
