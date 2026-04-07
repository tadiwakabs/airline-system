import { act, useEffect, useState } from "react";
import Card from "../../components/common/Card";
import TextInput from "../../components/common/TextInput";
import Button from "../../components/common/Button";
import Dropdown from "../../components/common/Dropdown";
import Separator from "../../components/common/Separator";
import { useNavigate } from "react-router-dom";
import {
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
} from "../../services/authService";

const titleOptions = [
    { label: "Select title", value: "" },
    { label: "Dr", value: "Dr" },
    { label: "Ms", value: "Ms" },
    { label: "Mr", value: "Mr" },
    { label: "Miss", value: "Miss" },
    { label: "Mrs", value: "Mrs" },
    { label: "Mstr", value: "Mstr" },
    { label: "Prof", value: "Prof" },
    { label: "Rev", value: "Rev" },
];

const genderOptions = [
    { label: "Select gender", value: "" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Non-Binary", value: "NonBinary" },
    { label: "Other", value: "Other" },
];

export default function Profile() {
    const [activeTab, setActiveTab] = useState("profile");
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [editableData, setEditableData] = useState({
        email: "",
        title: "",
        gender: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [profileMessage, setProfileMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [error, setError] = useState("");

    const role = (profile?.userRole || profile?.UserRole || "").trim().toLowerCase();
    const email = (profile?.email || profile?.Email || "").trim().toLowerCase();

    const isAdminEmail = email.endsWith("@admin.3380airlines.com");
    const isEmployeeEmail = email.endsWith("@3380airlines.com") && !isAdminEmail;

    const isAdmin = role === "admin" || isAdminEmail;
    const isEmployee = role === "employee" || isEmployeeEmail;

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (loading || !profile) return;

        if (activeTab === "employee" && !isEmployee) {
            setActiveTab("profile");
        }

        if (activeTab === "admin" && !isAdmin) {
            setActiveTab("profile");
        }
    }, [loading, profile, isEmployee, isAdmin, activeTab]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getMyProfile();
            setProfile(data);
            setEditableData({
                email: data.email || "",
                title: data.title || "",
                gender: data.gender || "",
            });
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditableChange = (e) => {
        const { name, value } = e.target;
        setEditableData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setProfileMessage("");
        setError("");
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setPasswordMessage("");
        setError("");
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setProfileMessage("");

        try {
            const response = await updateMyProfile(editableData);
            setProfileMessage(response.message || "Profile updated.");
            await loadProfile();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update profile.");
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setPasswordMessage("");

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        try {
            const response = await changeMyPassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });

            setPasswordMessage(response.message || "Password updated.");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to change password.");
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-10">
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-10">
                <p className="text-red-600">{error || "Profile not found."}</p>
            </div>
        );
    }
    console.log({ role, email, isEmployee, isAdmin });
    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                {/* Left sidebar */}
                <Card className="p-3">
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("profile")}
                            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                activeTab === "profile"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                            }`}
                        >
                            Profile Info
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("password")}
                            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                activeTab === "password"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                            }`}
                        >
                            Change Password
                        </button>

                        {isEmployee && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("employee")}
                                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                    activeTab === "employee" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                                }`}
                            >
                                Employee Panel
                            </button>
                        )}

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("admin")}
                                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                activeTab === "admin" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                                }`}
                            >
                                Admin Panel
                            </button>
                            )}
                    </div>
                
                </Card>
                {/* Right content */}
                <Card className="p-6">
                    {activeTab === "profile" && (
                        <>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                My Profile
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View your account details and update allowed fields.
                            </p>

                            <Separator className="my-6" />

                            <div className="grid gap-4 md:grid-cols-2">
                                <TextInput
                                    label="User ID"
                                    value={profile.userId}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <TextInput
                                    label="Username"
                                    value={profile.username}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <TextInput
                                    label="First Name"
                                    value={profile.firstName}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <TextInput
                                    label="Last Name"
                                    value={profile.lastName}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <TextInput
                                    label="Date of Birth"
                                    value={profile.dateOfBirth?.split("T")[0] || ""}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <TextInput
                                    label="Role"
                                    value={profile.userRole}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <TextInput
                                    label="Account Creation Date"
                                    value={
                                        profile.createdAt
                                            ? new Date(profile.createdAt).toLocaleString()
                                            : ""
                                    }
                                    disabled
                                    className="bg-gray-50"
                                />
                                <TextInput
                                    label="Last Updated"
                                    value={
                                        profile.updatedAt
                                            ? new Date(profile.updatedAt).toLocaleString()
                                            : ""
                                    }
                                    disabled
                                    className="bg-gray-50"
                                />
                            </div>

                            <Separator className="my-6" />

                            <form onSubmit={handleProfileSubmit} className="space-y-4">

                                <div className="grid gap-4 md:grid-cols-2">
                                    <TextInput
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={editableData.email}
                                        onChange={handleEditableChange}
                                    />

                                    <Dropdown
                                        label="Title"
                                        name="title"
                                        value={editableData.title}
                                        onChange={handleEditableChange}
                                        options={titleOptions}
                                    />

                                    <Dropdown
                                        label="Gender"
                                        name="gender"
                                        value={editableData.gender}
                                        onChange={handleEditableChange}
                                        options={genderOptions}
                                    />
                                </div>

                                {profileMessage && (
                                    <p className="text-sm text-green-600">{profileMessage}</p>
                                )}

                                {error && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}

                                <Button type="submit">Save Changes</Button>
                            </form>
                        </>
                    )}

                    {activeTab === "password" && (
                        <>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Change Password
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Update your password.
                            </p>

                            <Separator className="my-6" />

                            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                                <TextInput
                                    label="Current Password"
                                    name="currentPassword"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                />

                                <TextInput
                                    label="New Password"
                                    name="newPassword"
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                />

                                <TextInput
                                    label="Confirm New Password"
                                    name="confirmPassword"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                />

                                {passwordMessage && (
                                    <p className="text-sm text-green-600">{passwordMessage}</p>
                                )}

                                {error && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}

                                <Button type="submit">Change Password</Button>
                            </form>
                        </>
                    )}

                    {activeTab == "employee" && isEmployee && (
                        <>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Employee Panel
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Employee tools and operations.
                            </p>

                            <Button onClick={() => navigate("/employee/dashboard")}>
                                Go to Employee Dashboard
                            </Button>

                            <Separator className="my-6" />
                        </>
                    )}

                    {activeTab === "admin" && isAdmin && (
                        <>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Admin Panel
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Administrative tools
                            </p>
                            <Separator className="my-6" />

                            <Button onClick={() => navigate("/admin/dashboard")}>
                                Go to Admin Dashboard
                            </Button>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}