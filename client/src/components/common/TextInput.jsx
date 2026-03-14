import React from "react";
import { cn } from "../../utils/cn";

const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-4 py-3 text-lg",
};

export default function TextInput({
                                      label,
                                      type = "text",
                                      size = "md",
                                      placeholder = "",
                                      value,
                                      onChange,
                                      className = "",
                                  }) {
    return (
        <div className="space-y-1">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={cn(
                    "w-full rounded-xl border border-gray-300 bg-white",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    sizeClasses[size],
                    className
                )}
            />
        </div>
    );
}
