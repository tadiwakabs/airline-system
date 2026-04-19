import React from "react";

const FormError = ({ errors }) => {
    if (!errors) return null;

    let errorList = [];

    if (Array.isArray(errors)) {
        errorList = errors;
    } else if (typeof errors === "object") {
        if (errors.general) errorList.push(errors.general);
        if (errors.message) errorList.push(errors.message);

        Object.entries(errors).forEach(([key, value]) => {
            if (key === "general" || key === "message") return;

            if (Array.isArray(value)) {
                errorList.push(...value);
            } else if (typeof value === "string") {
                errorList.push(value);
            } else if (value && typeof value === "object") {
                Object.values(value).forEach((nested) => {
                    if (Array.isArray(nested)) errorList.push(...nested);
                    else if (typeof nested === "string") errorList.push(nested);
                });
            }
        });
    }

    errorList = errorList.filter(Boolean);

    if (errorList.length === 0) return null;

    return (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
                <p className="text-red-800 font-bold text-base tracking-tight">Action Required</p>
            </div>

            <ul className="list-disc list-inside text-red-700 text-xs space-y-1 ml-1">
                {errorList.map((msg, i) => (
                    <li key={i} className="text-red-700 text-sm font-semibold leading-relaxed">
                        {msg}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FormError;
