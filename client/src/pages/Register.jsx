import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useFormErrors } from "../utils/useFormErrors";
import { registerUser } from "../services/authService";

import Button from "../components/common/Button";
import Card from "../components/common/Card";
import TextInput from "../components/common/TextInput";
import Dropdown from "../components/common/Dropdown";
import DatePicker from "../components/common/DatePicker";
import Separator from "../components/common/Separator";
import FormError from "../components/common/FormError";

export default function Register() {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    const {errors,setErrors,clearErrors}= useFormErrors();
    
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        title: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: ""
    });

    const [loading, setLoading] = useState(false);

    function updateField(name, value) {
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        clearErrors();

        if (formData.password !== formData.confirmPassword) {
            setErrors({response:{data:"Password do not match"}})
            return;
        }

        try {
            setLoading(true);

            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                title: formData.title || null,
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender || null
            };

            const data = await registerUser(payload);
            loginWithToken(data);
            navigate("/"); // redirect after success
            
        } catch (err) {
            setErrors(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-xl p-6">
                <h1 className="text-2xl mb-2">Create Account</h1>
                <p className="body-2 text-gray-500 mb-4">
                    Join 3380 Airlines and start booking flights.
                </p>

                <Separator className="mb-4" />

                <FormError errors={errors}/>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    {/* Title */}
                    <Dropdown
                        label="Title"
                        value={formData.title}
                        onChange={(val) => updateField("title", val)}
                        options={[
                            { label: "Dr.", value: "Dr" },
                            { label: "Ms.", value: "Ms" },
                            { label: "Mr.", value: "Mr" },
                            { label: "Miss.", value: "Miss" },
                            { label: "Mrs.", value: "Mrs" },
                            { label: "Mstr.", value: "Mstr" },
                            { label: "Prof", value: "Prof" },
                            { label: "Rev.", value: "Rev" }
                        ]}
                        placeholder="Select title"
                    />

                    {/* Name */}
                    <div className="flex gap-3">
                        <TextInput
                            label="First Name"
                            value={formData.firstName}
                            onChange={(e) =>
                                updateField("firstName", e.target.value)
                            }
                            required
                        />
                        <TextInput
                            label="Last Name"
                            value={formData.lastName}
                            onChange={(e) =>
                                updateField("lastName", e.target.value)
                            }
                            required
                        />
                    </div>

                    {/* Username */}
                    <TextInput
                        label="Username"
                        value={formData.username}
                        onChange={(e) =>
                            updateField("username", e.target.value)
                        }
                        required
                    />

                    {/* Email */}
                    <TextInput
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                            updateField("email", e.target.value)
                        }
                        required
                    />

                    {/* DOB */}
                    <DatePicker
                        label="Date of Birth"
                        value={formData.dateOfBirth}
                        onChange={(val) =>
                            updateField("dateOfBirth", val)
                        }
                        required
                    />

                    {/* Gender */}
                    <Dropdown
                        label="Gender"
                        value={formData.gender}
                        onChange={(val) => updateField("gender", val)}
                        options={[
                            { label: "Male", value: "Male" },
                            { label: "Female", value: "Female" },
                            { label: "Non-Binary", value: "NonBinary" },
                            { label: "Other", value: "Other" }
                        ]}
                        placeholder="Select gender"
                    />

                    {/* Password */}
                    <TextInput
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                            updateField("password", e.target.value)
                        }
                        required
                    />

                    <TextInput
                        label="Confirm Password"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                            updateField("confirmPassword", e.target.value)
                        }
                        required
                    />

                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating Account..." : "Register"}
                    </Button>
                </form>

                <Separator className="my-4" />

                <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Login
                    </Link>
                </p>
            </Card>
        </div>
    );
}