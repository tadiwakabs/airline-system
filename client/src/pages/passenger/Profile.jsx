import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../../components/common/Card";
import TextInput from "../../components/common/TextInput";
import Button from "../../components/common/Button";
import Dropdown from "../../components/common/Dropdown";
import Separator from "../../components/common/Separator";
import {
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
} from "../../services/authService";
import { getMyNotifications } from "../../services/notificationService";
import {
    getMyStandbyOffers,
    acceptStandbyOffer,
    rejectStandbyOffer
} from "../../services/standbyService";

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
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(
    location.state?.defaultTab || "profile"
);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

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

    // Added state for notifications and standby
    const [notifications, setNotifications] = useState([]);
    const [standbyOffers, setStandbyOffers] = useState([]);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [standbyLoading, setStandbyLoading] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");

    useEffect(() => {
        loadProfile();
        loadNotifications();
        loadStandbyOffers();
    }, []);

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

    // Added loader for notifications
    const loadNotifications = async () => {
        try {
            setNotificationLoading(true);
            const data = await getMyNotifications();
            setNotifications(data || []);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load notifications.");
        } finally {
            setNotificationLoading(false);
        }
    };

    // Added loader for standby offers
    const loadStandbyOffers = async () => {
        try {
            setStandbyLoading(true);
            const data = await getMyStandbyOffers();
            setStandbyOffers(data || []);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load standby offers.");
        } finally {
            setStandbyLoading(false);
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

    const handleAcceptStandbyOffer = async (standbyId) => {
        try {
            setError("");
            setNotificationMessage("");

            const response = await acceptStandbyOffer(standbyId);

            navigate("/booking/payment", {
                state: {
                    standbyBooking: {
                        ...response,
                        isStandby: true,
                    },
                },
            });
        } catch (err) {
            setError(
                err?.response?.data?.error ||
                err?.response?.data?.innerError ||
                err?.response?.data?.message ||
                "Failed to accept standby offer."
            );
        }
    };

    const handleRejectStandbyOffer = async (standbyId) => {
    try {
        const res = await rejectStandbyOffer(standbyId);
        alert(res.message || "Standby rejected");

        loadStandbyOffers();
        loadNotifications();
    } catch (err) {
        alert("Failed to reject standby");
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

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
                {/* Left sidebar */}
                <Card className="h-fit p-3">
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

                        {/* Added Notifications tab button */}
                        <button
                            type="button"
                            onClick={() => setActiveTab("notifications")}
                            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                activeTab === "notifications"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                            }`}
                        >
                            Notifications
                        </button>

                        {/* Added Standby Offers tab button */}
                        <button
                            type="button"
                            onClick={() => setActiveTab("standby")}
                            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                activeTab === "standby"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                            }`}
                        >
                            Standby Offers
                        </button>
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

                    {/* Added Notifications tab content */}
                    {activeTab === "notifications" && (
                        <>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Notifications
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View important account and flight updates.
                            </p>

                            <Separator className="my-6" />

                            {notificationLoading ? (
                                <p>Loading notifications...</p>
                            ) : notifications.length === 0 ? (
                                <p className="text-sm text-gray-500">No notifications found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {notifications.map((notification) => (
                                        <Card
                                            key={notification.notificationId}
                                            className="p-4"
                                        >
                                            <p className="text-sm font-medium text-gray-900">
                                                {notification.message}
                                            </p>
                                            <p className="mt-2 text-xs text-gray-500">
                                                Flight: {notification.flightNum}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Created:{" "}
                                                {notification.createdAt
                                                    ? new Date(
                                                          notification.createdAt
                                                      ).toLocaleString()
                                                    : "N/A"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Status: {notification.notificationStatus}
                                            </p>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Added Standby Offers tab content */}
                    {activeTab === "standby" && (
                        <>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Standby Offers
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View and respond to your standby flight offers.
                            </p>

                            <Separator className="my-6" />

                            {notificationMessage && (
                                <p className="mb-4 text-sm text-green-600">
                                    {notificationMessage}
                                </p>
                            )}

                            {error && (
                                <p className="mb-4 text-sm text-red-600">{error}</p>
                            )}

                            {standbyLoading ? (
                                <p>Loading standby offers...</p>
                            ) : standbyOffers.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No standby offers found.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {standbyOffers.map((offer) => (
                                        <Card key={offer.standbyId} className="p-4">
                                            <p className="text-sm font-medium text-gray-900">
                                                Flight {offer.flightNum}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Status: {offer.standbyStatus}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Expires:{" "}
                                                {offer.offerExpiresAt
                                                    ? new Date(
                                                          offer.offerExpiresAt
                                                      ).toLocaleString()
                                                    : "N/A"}
                                            </p>

                                            {offer.standbyStatus === "Offered" && (
    <div className="mt-4 flex gap-2">
        <Button
            type="button"
            onClick={() =>
                handleAcceptStandbyOffer(offer.standbyId)
            }
        >
            Accept Offer
        </Button>

        <Button
            type="button"
            variant="outline"
            onClick={() =>
                handleRejectStandbyOffer(offer.standbyId)
            }
        >
            Reject
        </Button>
    </div>
)}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}