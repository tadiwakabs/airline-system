import React from "react";

export default function FieldLabel({ children, required = false, className = "" }) {
    return (
        <label className={`block text-sm font-medium text-gray-700 ${className}`}>
            {children}
            {required && <span className="text-red-500"> *</span>}
        </label>
    );
}
