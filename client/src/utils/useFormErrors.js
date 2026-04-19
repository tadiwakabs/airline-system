import { useState } from 'react';

export const useFormErrors = () => {
    const [errors, setErrors] = useState({});

    const handleSetErrors = (err) => {
        // 1. Plain object passed directly from component
        if (
            err &&
            typeof err === "object" &&
            !err.response &&
            !Array.isArray(err)
        ) {
            setErrors(err);
            return;
        }

        const errorData = err?.response?.data;
        const errorString = JSON.stringify(errorData || "") || "";

        if (
            errorString.includes("DbUpdateException") ||
            errorString.includes("SqlException") ||
            errorString.includes("CONSTRAINT")
        ) {
            setErrors({ general: "Database error. Check FK and constraint field." });
        } else if (typeof errorData === "object" && errorData !== null) {
            setErrors(errorData);
        } else if (typeof errorData === "string" && errorData.trim()) {
            setErrors({ general: errorData });
        } else {
            setErrors({ general: "An unexpected error occurred." });
        }
    };

    const clearErrors = () => setErrors({});

    return { errors, setErrors: handleSetErrors, clearErrors, hasErrors: Object.keys(errors).length > 0 };
};
