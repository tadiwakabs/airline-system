import React from "react";
import { cn } from "../../utils/cn";

const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-4 py-3 text-lg",
};

export default function TextInput({
      label,
      name,
      id,
      type = "text",
      size = "md",
      placeholder = "",
      value,
      onChange,
      error,
      disabled = false,
      className = "",
  }) {
    const inputId = id || name;

    return (
        <div className="space-y-1">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700"
                >
                    {label}
                </label>
            )}

            <input
                id={inputId}
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={cn(
                    "w-full rounded-xl border bg-white",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    error ? "border-red-500" : "border-gray-300",
                    disabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
                        : error
                        ? "border-red-500"
                        : "border-gray-300",
                    sizeClasses[size],
                    className
                )}
            />

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}