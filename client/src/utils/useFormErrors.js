import { useState } from 'react';

export const useFormErrors = () => {
    const [errors, setErrors] = useState([]);

    const handleFieldError = (err) => {
        const serverResponse = err.response?.data;
        
        if (typeof serverResponse === 'string') {
            // Handles: return BadRequest("Message")
            setErrors([serverResponse]);
        } else if (serverResponse?.errors) {
            // Handles: Model Validation 
            setErrors(Object.values(serverResponse.errors).flat());
        } else {
            setErrors(["An unexpected error occurred. Please check your connection."]);
        }
    };

    const clearErrors = () => setErrors([]);

    return { errors, setErrors: handleFieldError, clearErrors, hasErrors: errors.length > 0 };
};