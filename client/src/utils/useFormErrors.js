import { useState } from 'react';

export const useFormErrors = () => {
    const [errors, setErrors] = useState({});

    const handleSetErrors = (err) => {
        const errorData = err.response?.data;
        const errorString = JSON.stringify(errorData || "") || "";

        if (
        errorString.includes("DbUpdateException") || 
        errorString.includes("SqlException") || 
        errorString.includes("CONSTRAINT")
        ) {
            // OVERRIDE: Show your custom unified message instead of the chunk
            setErrors({ database: "Database error. Check FK and constraint feild" })
        } 
        else if (typeof errorData === "object") {
            setErrors(errorData);
        } 
        else {
            setErrors({ general: "An unexpected error occurred." });
        }
    };

    const clearErrors = () => setErrors({});

    return { errors, setErrors: handleSetErrors, clearErrors, hasErrors: errors.length > 0 };
};