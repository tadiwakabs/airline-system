import { useEffect, useState } from "react";
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
import {
    getPassengerByUserId,
    updatePassenger,
    getCountries,
    getStates,
} from "../../services/passengerService";

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
    const [passenger, setPassenger] = useState(null);
    const [loading, setLoading] = useState(true);

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);

    const [editableData, setEditableData] = useState({
        email: "",
        title: "",
        gender: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
    });

    const [passengerData, setPassengerData] = useState({
        passengerId: "",
        phoneNumber: "",
        passportNumber: "",
        passportCountryCode: "",
        passportExpirationDate: "",
        placeOfBirth: "",
        nationality: "",
        dlNumber: "",
        dlState: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [profileMessage, setProfileMessage] = useState("");
    const [passengerMessage, setPassengerMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [error, setError] = useState("");

    const countryOptions = countries.map((c) => ({
        label: c.name,
        value: c.code,
    }));

    const stateOptions = states.map((s) => ({
        label: `${s.name} (${s.code})`,
        value: s.code,
    }));

    useEffect(() => {
        loadProfileAndPassenger();
        loadLookups();
    }, []);

    const loadLookups = async () => {
        try {
            const [countriesRes, statesRes] = await Promise.all([
                getCountries(),
                getStates(),
            ]);
            setCountries(countriesRes.data || []);
            setStates(statesRes.data || []);
        } catch (err) {
            console.error("Failed to load lookup data:", err);
        }
    };

    const loadProfileAndPassenger = async () => {
        try {
            setLoading(true);
            setError("");

            const profileData = await getMyProfile();
            setProfile(profileData);

            setEditableData({
                email: profileData.email || "",
                title: profileData.title || "",
                gender: profileData.gender || "",
                firstName: profileData.firstName || "",
                lastName: profileData.lastName || "",
                dateOfBirth: profileData.dateOfBirth?.split("T")[0] || "",
            });

            try {
                const passengerResponse = await getPassengerByUserId(profileData.userId);
                const passengerDataFromApi = passengerResponse.data;

                setPassenger(passengerDataFromApi);
                setPassengerData({
                    passengerId: passengerDataFromApi.passengerId || "",
                    phoneNumber: passengerDataFromApi.phoneNumber || "",
                    passportNumber: passengerDataFromApi.passportNumber || "",
                    passportCountryCode: passengerDataFromApi.passportCountryCode || "",
                    passportExpirationDate:
                        passengerDataFromApi.passportExpirationDate?.split("T")[0] || "",
                    placeOfBirth: passengerDataFromApi.placeOfBirth || "",
                    nationality: passengerDataFromApi.nationality || "",
                    dlNumber: passengerDataFromApi.dlNumber ?? "",
                    dlState: passengerDataFromApi.dlState || "",
                });
            } catch {
                setPassenger(null);
                setPassengerData({
                    passengerId: "",
                    phoneNumber: "",
                    passportNumber: "",
                    passportCountryCode: "",
                    passportExpirationDate: "",
                    placeOfBirth: "",
                    nationality: "",
                    dlNumber: "",
                    dlState: "",
                });
            }
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

    const handlePassengerChange = (e) => {
        const { name, value } = e.target;
        setPassengerData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setPassengerMessage("");
        setError("");
    };

    const handlePassengerDropdownChange = (name, value) => {
        setPassengerData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setPassengerMessage("");
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
            await loadProfileAndPassenger();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update profile.");
        }
    };

    const handlePassengerSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setPassengerMessage("");

        if (!passenger?.passengerId) {
            setError("Passenger profile not found.");
            return;
        }

        try {
            const payload = {
                phoneNumber: passengerData.phoneNumber || null,
                passportNumber: passengerData.passportNumber || null,
                passportCountryCode: passengerData.passportCountryCode || null,
                passportExpirationDate: passengerData.passportExpirationDate || null,
                placeOfBirth: passengerData.placeOfBirth || null,
                nationality: passengerData.nationality || null,
                dlNumber: passengerData.dlNumber === "" ? null : Number(passengerData.dlNumber),
                dlState: passengerData.dlState || null,
            };

            const response = await updatePassenger(passenger.passengerId, payload);
            setPassengerMessage(response?.data?.message || "Passenger info updated.");
            await loadProfileAndPassenger();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update passenger info.");
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

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
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
                            onClick={() => setActiveTab("passenger")}
                            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                activeTab === "passenger"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                            }`}
                        >
                            Passenger Info
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
                    </div>
                </Card>

                <Card className="p-6">
                    {activeTab === "profile" && (
                        <>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                My Profile
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Update your account details.
                            </p>

                            <Separator className="mt-6 mb-2" />

                            <h1 className="text-lg font-semibold">Account Details</h1>
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
                                    label="Role"
                                    value={profile.userRole}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <TextInput
                                    label="Account Creation Date"
                                    value={profile.createdAt ? new Date(profile.createdAt).toLocaleString() : ""}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <TextInput
                                    label="Last Updated"
                                    value={profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : ""}
                                    disabled
                                    className="bg-gray-50"
                                />
                            </div>

                            <Separator className="mt-6 mb-4" />

                            <h1 className="text-lg font-semibold">Editable Details</h1>
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <TextInput
                                        label="First Name"
                                        name="firstName"
                                        value={editableData.firstName}
                                        onChange={handleEditableChange}
                                    />

                                    <TextInput
                                        label="Last Name"
                                        name="lastName"
                                        value={editableData.lastName}
                                        onChange={handleEditableChange}
                                    />

                                    <TextInput
                                        label="Date of Birth"
                                        name="dateOfBirth"
                                        type="date"
                                        value={editableData.dateOfBirth}
                                        onChange={handleEditableChange}
                                    />

                                    <TextInput
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={editableData.email}
                                        onChange={handleEditableChange}
                                    />

                                    <Dropdown
                                        label="Title"
                                        value={editableData.title}
                                        onChange={(val) =>
                                            setEditableData((prev) => ({ ...prev, title: val }))
                                        }
                                        options={titleOptions}
                                    />

                                    <Dropdown
                                        label="Gender"
                                        value={editableData.gender}
                                        onChange={(val) =>
                                            setEditableData((prev) => ({ ...prev, gender: val }))
                                        }
                                        options={genderOptions}
                                    />
                                </div>

                                {profileMessage && (
                                    <p className="text-sm text-green-600">{profileMessage}</p>
                                )}

                                {error && activeTab === "profile" && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}

                                <Button type="submit">Save Changes</Button>
                            </form>
                        </>
                    )}

                    {activeTab === "passenger" && (
                        <>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Passenger Info
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Update passenger-specific details.
                            </p>

                            <Separator className="my-6" />

                            <form onSubmit={handlePassengerSubmit} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <TextInput
                                        label="Passenger ID"
                                        value={passenger?.passengerId || ""}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                    <TextInput
                                        label="First Name"
                                        value={profile.firstName || ""}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                    <TextInput
                                        label="Last Name"
                                        value={profile.lastName || ""}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                    <TextInput
                                        label="Email"
                                        value={profile.email || ""}
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
                                        label="Gender"
                                        value={profile.gender || ""}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                    <TextInput
                                        label="Phone Number"
                                        name="phoneNumber"
                                        value={passengerData.phoneNumber}
                                        onChange={handlePassengerChange}
                                    />
                                </div>
                                
                                <Separator className="my-6" />
                                
                                <h1 className="text-lg font-semibold">Domestic Details</h1>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <TextInput
                                        label="DL Number"
                                        name="dlNumber"
                                        value={passengerData.dlNumber}
                                        onChange={handlePassengerChange}
                                    />
                                    <Dropdown
                                        label="DL State"
                                        value={passengerData.dlState}
                                        onChange={(val) =>
                                            handlePassengerDropdownChange("dlState", val)
                                        }
                                        options={stateOptions}
                                    />
                                </div>
                                
                                <Separator className="my-6" />
                                
                                <h1 className="text-lg font-semibold">International Details</h1>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <TextInput
                                        label="Passport Number"
                                        name="passportNumber"
                                        value={passengerData.passportNumber}
                                        onChange={handlePassengerChange}
                                    />
                                    <Dropdown
                                        label="Passport Country"
                                        value={passengerData.passportCountryCode}
                                        onChange={(val) =>
                                            handlePassengerDropdownChange("passportCountryCode", val)
                                        }
                                        options={countryOptions}
                                    />
                                    <TextInput
                                        label="Passport Expiration"
                                        name="passportExpirationDate"
                                        type="date"
                                        value={passengerData.passportExpirationDate}
                                        onChange={handlePassengerChange}
                                    />
                                    <TextInput
                                        label="Place of Birth"
                                        name="placeOfBirth"
                                        value={passengerData.placeOfBirth}
                                        onChange={handlePassengerChange}
                                    />
                                    <Dropdown
                                        label="Nationality"
                                        value={passengerData.nationality}
                                        onChange={(val) =>
                                            handlePassengerDropdownChange("nationality", val)
                                        }
                                        options={countryOptions}
                                    />
                                </div>
                                

                                {passengerMessage && (
                                    <p className="text-sm text-green-600">{passengerMessage}</p>
                                )}

                                {error && activeTab === "passenger" && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}

                                <Button type="submit">Save Passenger Info</Button>
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

                                {error && activeTab === "password" && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}

                                <Button type="submit">Change Password</Button>
                            </form>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
