import { act, useEffect, useState } from "react";
import Card from "../../components/common/Card";
import TextInput from "../../components/common/TextInput";
import Modal from "../../components/common/Modal";
import FieldLabel from "../../components/common/FieldLabel";
import Button from "../../components/common/Button";
import Dropdown from "../../components/common/Dropdown";
import Separator from "../../components/common/Separator";
import { useNavigate } from "react-router-dom";
import FormError from "../../components/common/FormError";

import { useFormErrors } from "../../utils/useFormErrors";
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
    getSavedPassengers,
    createSavedPassenger,
    updateSavedPassenger,
    deleteSavedPassenger,
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

const passengerTypeOptions = [
    { label: "Adult", value: "Adult" },
    { label: "Child", value: "Child" },
    { label: "Infant", value: "Infant" },
];

export default function Profile() {
    const [activeTab, setActiveTab] = useState("profile");
    const [profile, setProfile] = useState(null);
    const [passenger, setPassenger] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { errors: serverErrors, setErrors: setServerErrors, clearErrors } = useFormErrors();

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [isSavedPassengerModalOpen, setIsSavedPassengerModalOpen] = useState(false);

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

    const emptySavedPassengerForm = {
        passengerId: "",
        title: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        passengerType: "Adult",
        email: "",
        phoneNumber: "",
        passportNumber: "",
        passportCountryCode: "",
        passportExpirationDate: "",
        placeOfBirth: "",
        nationality: "",
        dlNumber: "",
        dlState: "",
    };

    const [savedPassengers, setSavedPassengers] = useState([]);
    const [savedPassengerForm, setSavedPassengerForm] = useState(emptySavedPassengerForm);
    const [editingSavedPassengerId, setEditingSavedPassengerId] = useState(null);
    const [savedPassengersMessage, setSavedPassengersMessage] = useState("");

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [profileMessage, setProfileMessage] = useState("");
    const [passengerMessage, setPassengerMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [error, setError] = useState("");

    const role = (profile?.userRole || profile?.UserRole || "").trim().toLowerCase();

    const isAdmin = role === "administrator";
    const isEmployee = isAdmin || role === "employee";

    const countryOptions = countries.map((c) => ({
        label: c.name,
        value: c.code,
    }));

    const adultSavedPassengers = savedPassengers.filter(
        (p) => (p.passengerType || "").toLowerCase() === "adult"
    );

    const childSavedPassengers = savedPassengers.filter(
        (p) => (p.passengerType || "").toLowerCase() === "child"
    );

    const infantSavedPassengers = savedPassengers.filter(
        (p) => (p.passengerType || "").toLowerCase() === "infant"
    );

    const stateOptions = states.map((s) => ({
        label: `${s.name} (${s.code})`,
        value: s.code,
    }));

    useEffect(() => {
        loadProfileAndPassenger();
        loadLookups();
        loadSavedPassengers();
    }, []);

    useEffect(() => {
        if (loading || !profile) return;
    }, [loading, profile, isEmployee, isAdmin, activeTab]);

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
            clearErrors();
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
            setServerErrors(err);
        } finally {
            setLoading(false);
        }
    };

    const loadSavedPassengers = async () => {
        try {
            const response = await getSavedPassengers();
            setSavedPassengers(response.data || []);
        } catch (err) {
            console.error("Failed to load saved passengers:", err);
        }
    };

    const handleEditableChange = (e) => {
        const { name, value } = e.target;
        setEditableData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setProfileMessage("");
        clearErrors();
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
        clearErrors();
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        clearErrors();
        setProfileMessage("");

        try {
            const response = await updateMyProfile(editableData);
            setProfileMessage(response.message || "Profile updated.");
            await loadProfileAndPassenger();
        } catch (err) {
            setServerErrors(err);
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

    const handleSavedPassengerChange = (e) => {
        const { name, value } = e.target;
        setSavedPassengerForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        setSavedPassengersMessage("");
        setError("");
    };

    const handleSavedPassengerDropdownChange = (name, value) => {
        setSavedPassengerForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        setSavedPassengersMessage("");
        setError("");
    };

    const resetSavedPassengerForm = () => {
        setSavedPassengerForm(emptySavedPassengerForm);
        setEditingSavedPassengerId(null);
        setIsSavedPassengerModalOpen(false);
    };

    const handleOpenNewSavedPassengerModal = () => {
        setSavedPassengersMessage("");
        setError("");
        setSavedPassengerForm(emptySavedPassengerForm);
        setEditingSavedPassengerId(null);
        setIsSavedPassengerModalOpen(true);
    };

    const handleEditSavedPassenger = (p) => {
        setEditingSavedPassengerId(p.passengerId);
        setSavedPassengerForm({
            passengerId: p.passengerId || "",
            title: p.title || "",
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            dateOfBirth: p.dateOfBirth?.split("T")[0] || "",
            gender: p.gender || "",
            passengerType: p.passengerType || "Adult",
            email: p.email || "",
            phoneNumber: p.phoneNumber || "",
            passportNumber: p.passportNumber || "",
            passportCountryCode: p.passportCountryCode || "",
            passportExpirationDate: p.passportExpirationDate?.split("T")[0] || "",
            placeOfBirth: p.placeOfBirth || "",
            nationality: p.nationality || "",
            dlNumber: p.dlNumber ?? "",
            dlState: p.dlState || "",
        });
        setSavedPassengersMessage("");
        setError("");
        setIsSavedPassengerModalOpen(true);
    };

    const handleSavedPassengerSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSavedPassengersMessage("");

        try {
            const payload = {
                title: savedPassengerForm.title || null,
                firstName: savedPassengerForm.firstName.trim(),
                lastName: savedPassengerForm.lastName.trim(),
                dateOfBirth: savedPassengerForm.dateOfBirth,
                gender: savedPassengerForm.gender || null,
                passengerType: savedPassengerForm.passengerType,
                email:
                    savedPassengerForm.passengerType === "Adult"
                        ? savedPassengerForm.email || null
                        : null,
                phoneNumber:
                    savedPassengerForm.passengerType === "Adult"
                        ? savedPassengerForm.phoneNumber || null
                        : null,
                passportNumber: savedPassengerForm.passportNumber || null,
                passportCountryCode: savedPassengerForm.passportCountryCode || null,
                passportExpirationDate: savedPassengerForm.passportExpirationDate || null,
                placeOfBirth: savedPassengerForm.placeOfBirth || null,
                nationality: savedPassengerForm.nationality || null,
                dlNumber:
                    savedPassengerForm.dlNumber === ""
                        ? null
                        : Number(savedPassengerForm.dlNumber),
                dlState: savedPassengerForm.dlState || null,
            };

            if (editingSavedPassengerId) {
                await updateSavedPassenger(editingSavedPassengerId, payload);
                setSavedPassengersMessage("Saved passenger updated.");
            } else {
                await createSavedPassenger(payload);
                setSavedPassengersMessage("Saved passenger created.");
            }

            resetSavedPassengerForm();
            await loadSavedPassengers();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to save passenger.");
        }
    };

    const handleDeleteSavedPassenger = async (passengerId) => {
        try {
            setError("");
            setSavedPassengersMessage("");
            await deleteSavedPassenger(passengerId);
            setSavedPassengersMessage("Saved passenger deleted.");
            if (editingSavedPassengerId === passengerId) {
                resetSavedPassengerForm();
            }
            await loadSavedPassengers();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete passenger.");
        }
    };


    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        clearErrors();
        setPasswordMessage("");

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setServerError({response:{data:"New passwords do not match."}});
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
            setServerErrors(err);
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
                <p className="text-red-600">Profile not found.</p>
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
                            onClick={() => setActiveTab("savedPassengers")}
                            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                activeTab === "savedPassengers"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                            }`}
                        >
                            Additional Passengers
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

                {/* Right content */}
                <Card className="p-6">
                    <FormError errors= {serverErrors}/>
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

                    {activeTab === "savedPassengers" && (
                        <>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">
                                        Additional Passengers
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Save additional travelers to reuse them during booking.
                                    </p>
                                </div>

                                <Button type="button" onClick={handleOpenNewSavedPassengerModal}>
                                    Add Passenger
                                </Button>
                            </div>

                            <Separator className="my-6" />

                            {savedPassengersMessage && (
                                <p className="mb-4 text-sm text-green-600">{savedPassengersMessage}</p>
                            )}

                            {error && activeTab === "savedPassengers" && (
                                <p className="mb-4 text-sm text-red-600">{error}</p>
                            )}

                            <div className="space-y-8">

                                {/* Adults */}
                                <div className="space-y-3">
                                    <h2 className="text-lg font-semibold text-gray-900">Adults</h2>

                                    {adultSavedPassengers.length === 0 ? (
                                        <p className="text-sm text-gray-500">No adults to display.</p>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {adultSavedPassengers.map((p) => (
                                                <div
                                                    key={p.passengerId}
                                                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                                                >
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {p.firstName} {p.lastName}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Adult · DOB {p.dateOfBirth?.split("T")[0]}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {p.email || "No email"} {p.phoneNumber ? `· ${p.phoneNumber}` : ""}
                                                            </p>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => handleEditSavedPassenger(p)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => handleDeleteSavedPassenger(p.passengerId)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Children */}
                                <div className="space-y-3">
                                    <h2 className="text-lg font-semibold text-gray-900">Children</h2>

                                    {childSavedPassengers.length === 0 ? (
                                        <p className="text-sm text-gray-500">No children to display.</p>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {childSavedPassengers.map((p) => (
                                                <div
                                                    key={p.passengerId}
                                                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                                                >
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {p.firstName} {p.lastName}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Child · DOB {p.dateOfBirth?.split("T")[0]}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {p.email || "No email"} {p.phoneNumber ? `· ${p.phoneNumber}` : ""}
                                                            </p>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => handleEditSavedPassenger(p)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => handleDeleteSavedPassenger(p.passengerId)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Infants */}
                                <div className="space-y-3">
                                    <h2 className="text-lg font-semibold text-gray-900">Infants</h2>

                                    {infantSavedPassengers.length === 0 ? (
                                        <p className="text-sm text-gray-500">No infants to display.</p>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {infantSavedPassengers.map((p) => (
                                                <div
                                                    key={p.passengerId}
                                                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                                                >
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {p.firstName} {p.lastName}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Infant · DOB {p.dateOfBirth?.split("T")[0]}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {p.email || "No email"} {p.phoneNumber ? `· ${p.phoneNumber}` : ""}
                                                            </p>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => handleEditSavedPassenger(p)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => handleDeleteSavedPassenger(p.passengerId)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>

                            <Modal
                                isOpen={isSavedPassengerModalOpen}
                                onClose={resetSavedPassengerForm}
                                title={editingSavedPassengerId ? "Edit Passenger" : "Add Passenger"}
                                className="max-w-3xl!"
                                contentClassName="!max-h-[78vh]"
                            >
                                <form onSubmit={handleSavedPassengerSubmit} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <FieldLabel>Title</FieldLabel>
                                            <Dropdown
                                                value={savedPassengerForm.title}
                                                onChange={(val) => handleSavedPassengerDropdownChange("title", val)}
                                                options={titleOptions}
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel required>Passenger Type</FieldLabel>
                                            <Dropdown
                                                value={savedPassengerForm.passengerType}
                                                onChange={(val) => handleSavedPassengerDropdownChange("passengerType", val)}
                                                options={passengerTypeOptions}
                                            />
                                        </div>

                                        <TextInput
                                            label={<>First Name <span className="text-red-500">*</span></>}
                                            name="firstName"
                                            value={savedPassengerForm.firstName}
                                            onChange={handleSavedPassengerChange}
                                        />

                                        <TextInput
                                            label={<>Last Name <span className="text-red-500">*</span></>}
                                            name="lastName"
                                            value={savedPassengerForm.lastName}
                                            onChange={handleSavedPassengerChange}
                                        />

                                        <TextInput
                                            label={<>Date of Birth <span className="text-red-500">*</span></>}
                                            name="dateOfBirth"
                                            type="date"
                                            value={savedPassengerForm.dateOfBirth}
                                            onChange={handleSavedPassengerChange}
                                        />

                                        <div>
                                            <FieldLabel>Gender</FieldLabel>
                                            <Dropdown
                                                value={savedPassengerForm.gender}
                                                onChange={(val) => handleSavedPassengerDropdownChange("gender", val)}
                                                options={genderOptions}
                                            />
                                        </div>

                                        {savedPassengerForm.passengerType === "Adult" && (
                                            <>
                                                <TextInput
                                                    label="Email"
                                                    name="email"
                                                    value={savedPassengerForm.email}
                                                    onChange={handleSavedPassengerChange}
                                                />
                                                <TextInput
                                                    label="Phone Number"
                                                    name="phoneNumber"
                                                    value={savedPassengerForm.phoneNumber}
                                                    onChange={handleSavedPassengerChange}
                                                />
                                            </>
                                        )}

                                        <TextInput
                                            label="DL Number"
                                            name="dlNumber"
                                            value={savedPassengerForm.dlNumber}
                                            onChange={handleSavedPassengerChange}
                                        />

                                        <div>
                                            <FieldLabel>DL State</FieldLabel>
                                            <Dropdown
                                                value={savedPassengerForm.dlState}
                                                onChange={(val) => handleSavedPassengerDropdownChange("dlState", val)}
                                                options={stateOptions}
                                            />
                                        </div>

                                        <TextInput
                                            label="Passport Number"
                                            name="passportNumber"
                                            value={savedPassengerForm.passportNumber}
                                            onChange={handleSavedPassengerChange}
                                        />

                                        <div>
                                            <FieldLabel>Passport Country</FieldLabel>
                                            <Dropdown
                                                value={savedPassengerForm.passportCountryCode}
                                                onChange={(val) => handleSavedPassengerDropdownChange("passportCountryCode", val)}
                                                options={countryOptions}
                                            />
                                        </div>

                                        <TextInput
                                            label="Passport Expiration"
                                            name="passportExpirationDate"
                                            type="date"
                                            value={savedPassengerForm.passportExpirationDate}
                                            onChange={handleSavedPassengerChange}
                                        />

                                        <TextInput
                                            label="Place of Birth"
                                            name="placeOfBirth"
                                            value={savedPassengerForm.placeOfBirth}
                                            onChange={handleSavedPassengerChange}
                                        />

                                        <div>
                                            <FieldLabel>Nationality</FieldLabel>
                                            <Dropdown
                                                value={savedPassengerForm.nationality}
                                                onChange={(val) => handleSavedPassengerDropdownChange("nationality", val)}
                                                options={countryOptions}
                                            />
                                        </div>
                                    </div>

                                    {savedPassengersMessage && (
                                        <p className="text-sm text-green-600">{savedPassengersMessage}</p>
                                    )}

                                    {error && activeTab === "savedPassengers" && (
                                        <p className="text-sm text-red-600">{error}</p>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <Button type="submit">
                                            {editingSavedPassengerId ? "Save Passenger" : "Add Passenger"}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={resetSavedPassengerForm}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </Modal>
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
