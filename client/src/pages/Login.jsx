import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFormErrors } from "../utils/useFormErrors";

import Card from "../components/common/Card";
import TextInput from "../components/common/TextInput";
import Button from "../components/common/Button";
import Separator from "../components/common/Separator";
import FormError from "../components/common/FormError";


export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loading } = useAuth();
    const {errors, setErrors, clearErrors}=useFormErrors();
    const [localErrors, setLocalErrors]= useState({});


    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });


    const [submitError, setSubmitError] = useState("");
    const from = location.state?.from?.pathname || "/";

    const handleChange = (e) => {
        const { name, value } = e.target;


        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setLocalErrors((prev) => ({
            ...prev,
            [name]: "",
        }));

        
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = "Username or email is required.";
        }

        if (!formData.password.trim()) {
            newErrors.password = "Password is required.";
        }

        if (Object.keys(newErrors).length >0){
            setErrors(newErrors);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(""); 
        clearErrors();      
        setLocalErrors({}); 

        if (!validateForm()) return;

        try {
            const result = await login(formData);

            if (result && result.success) {
                clearErrors(); 
                navigate(from, { replace: true });
                return ; 
            } 
            setErrors({ general: result?.message || "Invalid credentials." });
        } catch (err) {
            setErrors({ general: "A connection error occurred. Please try again." });
        }
    };

    return (
        <div className="">
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-xl p-6">
                    <h1 className="text-2xl mb-2">Login</h1>
                    <p className="text-base text-gray-500">
                        Sign in to manage bookings, view trips, and access your account.
                    </p>

                    <Separator className="my-4"/>
                    <FormError errors={errors}/>

                    {/* Username */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
                        <TextInput
                            label="Username or Email"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter username or email"
                            error={errors.username}
                        />

                        {/* Password */}
                        <TextInput
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            error={errors.password}
                        />

                        {submitError ? (
                            <p className="text-red-600 text-sm">{submitError}</p>
                        ) : null}

                        <Button type="submit" disabled={loading}>
                            {loading ? "Signing In..." : "Sign In"}
                        </Button>
                    </form>

                    <Separator className="my-4"/>

                    <p className="text-sm text-gray-500 text-center">
                        Don’t have an account?&nbsp;
                        <Link to="/register" className="text-blue-600 hover:underline">Create one</Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
