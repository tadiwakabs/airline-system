import React from "react";
import { cn } from "../../utils/cn";

const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-400 text-gray-800 hover:bg-gray-100",
};

const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
};

export default function Button({
                                   children,
                                   variant = "primary",
                                   size = "md",
                                   type = "button",
                                   onClick,
                                   disabled = false,
                                   className = "",
                               }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "rounded-xl font-medium transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
        >
            {children}
        </button>
    );
}
