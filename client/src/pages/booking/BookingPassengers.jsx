import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Dropdown from "../../components/common/Dropdown.jsx";
import Combobox from "../../components/common/Combobox.jsx";
import {
    getCountries,
    getPassengerByUserId,
    getStates,
    updatePassenger,
    createPassenger,
    getSavedPassengers,
} from "../../services/passengerService";
import FormError from "../../components/common/FormError.jsx";
import { useFormErrors } from "../../utils/useFormErrors";

function capitalize(value) {
    if (!value) return "";
    if (value === "first") return "First Class";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildPassengerLabel(type, index) {
    return `${type} ${index + 1}`;
}

function createEmptyPassenger(type) {
    return {
        passengerType: type,
        title: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        email: "",
        phoneNumber: "",
        passportNumber: "",
        passportCountryCode: "",
        passportExpirationDate: "",
        placeOfBirth: "",
        nationality: "",
        dlNumber: "",
        dlState: "",
        isAccountPassenger: false,
        selectedSavedPassengerId: "",
    };
}

function buildInitialPassengers(counts) {
    const forms = [];

    for (let i = 0; i < (counts?.adults || 0); i++) {
        forms.push(createEmptyPassenger("Adult"));
    }

    for (let i = 0; i < (counts?.children || 0); i++) {
        forms.push(createEmptyPassenger("Child"));
    }

    for (let i = 0; i < (counts?.infants || 0); i++) {
        forms.push(createEmptyPassenger("Infant"));
    }

    return forms;
}

function getStoredAuth() {
    const possibleKeys = ["auth", "user", "currentUser"];

    for (const key of possibleKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        try {
            const parsed = JSON.parse(raw);
            if (parsed) return parsed;
        } catch {
            // ignore invalid JSON
        }
    }

    return null;
}

function getUserIdFromStorage() {
    const auth = getStoredAuth();
    if (!auth) return null;

    return (
        auth.userId ||
        auth.user?.userId ||
        auth.data?.userId ||
        null
    );
}

function normalizeGender(value) {
    if (!value) return null;

    const lower = String(value).toLowerCase();
    if (lower === "male") return "Male";
    if (lower === "female") return "Female";

    return value;
}

function normalizePassengerType(value) {
    if (!value) return "Adult";

    const lower = String(value).toLowerCase();
    if (lower === "adult") return "Adult";
    if (lower === "child") return "Child";
    if (lower === "infant") return "Infant";

    return value;
}

function toPassengerPayload(passenger, { userId = null, linkToUser = false } = {}) {
    return {
        userId: linkToUser ? userId : null,
        title: passenger.title || null,
        firstName: passenger.firstName?.trim() || "",
        lastName: passenger.lastName?.trim() || "",
        dateOfBirth: passenger.dateOfBirth || null,
        gender: normalizeGender(passenger.gender),
        phoneNumber: passenger.phoneNumber?.trim() || null,
        email: passenger.email?.trim() || null,

        dlNumber: passenger.dlNumber ? Number(passenger.dlNumber) : null,
        dlState: passenger.dlState || null,

        passportNumber: passenger.passportNumber?.trim() || null,
        passportCountryCode: passenger.passportCountryCode || null,
        passportExpirationDate: passenger.passportExpirationDate || null,
        placeOfBirth: passenger.placeOfBirth?.trim() || null,
        nationality: passenger.nationality || null,

        passengerType: normalizePassengerType(passenger.passengerType),
    };
}

function validatePassenger(passenger, isDomesticItinerary) {
    if (!passenger.firstName?.trim()) {
        return `${passenger.passengerType} passenger first name is required.`;
    }

    if (!passenger.lastName?.trim()) {
        return `${passenger.passengerType} passenger last name is required.`;
    }

    if (!passenger.dateOfBirth) {
        return `${passenger.firstName || passenger.passengerType} is missing a date of birth.`;
    }

    if (passenger.passengerType === "Adult" && isDomesticItinerary) {
        if (!passenger.dlNumber) {
            return `${passenger.firstName || "Adult"} is missing a DL / ID number.`;
        }

        if (!passenger.dlState) {
            return `${passenger.firstName || "Adult"} is missing a DL / ID state.`;
        }
    }

    if (passenger.phoneNumber){
        const onlyNums= /^\d+$/;
        if (!onlyNums.test(passenger.phoneNumber)){
            return "Phone number must contain only digits."
        }
    }

    if (!isDomesticItinerary) {
        if (!passenger.passportNumber) {
            return `${passenger.firstName || passenger.passengerType} is missing a passport number.`;
        }

        if (!passenger.passportCountryCode) {
            return `${passenger.firstName || passenger.passengerType} is missing a passport country.`;
        }
    }

    return "";
}

const RequiredMark = () => <span className="text-red-500"> *</span>;

export default function BookingPassengers() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const selectedItinerary =
        state?.selectedItinerary ||
        state?.itinerary ||
        state?.selectedOutbound;
    const searchParams = state?.searchParams;

    const initialPassengerForms = useMemo(
        () => buildInitialPassengers(searchParams?.passengers),
        [searchParams?.passengers]
    );

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [localErrors, setLocalErrors] = useState({});
    const [passengerForms, setPassengerForms] = useState(initialPassengerForms);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const {errors:serverErrors,setErrors:setServerErrors,clearErrors}= useFormErrors();
    const [savedPassengers, setSavedPassengers] = useState([]);

    const countryOptions = countries.map(c => ({
        label: c.name,
        value: c.code
    }));

    const stateOptions = states.map(s => ({
        label: `${s.name} (${s.code})`,
        value: s.code
    }));

    const genderOptions = [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
        { label: "Non-Binary", value: "Non-Binary" },
        { label: "Other", value: "Other" },
    ];

    useEffect(() => {
        if (!selectedItinerary || !searchParams) {
            navigate("/flight-search");
        }
    }, [selectedItinerary, searchParams, navigate]);

    useEffect(() => {
        setPassengerForms(buildInitialPassengers(searchParams?.passengers));
    }, [searchParams?.passengers]);

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [countriesRes, statesRes] = await Promise.all([
                    getCountries(),
                    getStates(),
                ]);

                setCountries(countriesRes.data);
                setStates(statesRes.data);
            } catch (err) {
                console.error("Error loading lookup data", err);
            }
        };

        fetchLookups();
    }, []);

    useEffect(() => {
        const loadSavedPassengers = async () => {
            try {
                const res = await getSavedPassengers();
                setSavedPassengers(res.data || []);
            } catch (err) {
                console.error("Error loading saved passengers:", err);
            }
        };

        loadSavedPassengers();
    }, []);

    useEffect(() => {
        if (!selectedItinerary || !searchParams) return;

        const fetchPassengerProfile = async () => {
            try {
                setLoading(true);
                clearErrors();

                const userId = getUserIdFromStorage();

                if (!userId) {
                    setLoading(false);
                    return;
                }

                const res = await getPassengerByUserId(userId);
                const savedProfile = res.data;
                setProfile(savedProfile);

                setPassengerForms((prev) => {
                    if (!prev.length) return prev;

                    const updated = [...prev];

                    // Prefill the first adult only
                    const firstAdultIndex = updated.findIndex(
                        (p) => p.passengerType === "Adult"
                    );

                    if (firstAdultIndex !== -1) {
                        updated[firstAdultIndex] = {
                            ...updated[firstAdultIndex],
                            title: savedProfile?.title || "",
                            firstName: savedProfile?.firstName || "",
                            lastName: savedProfile?.lastName || "",
                            dateOfBirth: savedProfile?.dateOfBirth
                                ? String(savedProfile.dateOfBirth).slice(0, 10)
                                : "",
                            gender: savedProfile?.gender || "",
                            email: savedProfile?.email || "",
                            phoneNumber: savedProfile?.phoneNumber || "",
                            passportNumber: savedProfile?.passportNumber || "",
                            passportCountryCode: savedProfile?.passportCountryCode || "",
                            passportExpirationDate: savedProfile?.passportExpirationDate
                                ? String(savedProfile.passportExpirationDate).slice(0, 10)
                                : "",
                            placeOfBirth: savedProfile?.placeOfBirth || "",
                            nationality: savedProfile?.nationality || "",
                            dlNumber: savedProfile?.dlNumber || savedProfile?.DLNumber || "",
                            dlState: savedProfile?.dlState || savedProfile?.DLState || "",
                            isAccountPassenger: true,
                            selectedSavedPassengerId: "",
                        };
                    }

                    return updated;
                });
            } catch (err) {
                console.error("Error loading passenger profile:", err)
                setServerErrors({response:{data:"Couldn't load saved passenger profile."}});
            } finally {
                setLoading(false);
            }
        };

        fetchPassengerProfile();
    }, [selectedItinerary, searchParams]);

    const handlePassengerChange = (index, field, value) => {
        setPassengerForms((prev) =>
            prev.map((passenger, i) =>
                i === index ? { ...passenger, [field]: value } : passenger
            )
        );
    };

    const handleApplySavedPassenger = (index, savedPassengerId) => {
        const selected = savedPassengers.find((p) => p.passengerId === savedPassengerId);
        if (!selected) return;

        setPassengerForms((prev) =>
            prev.map((passenger, i) =>
                i === index
                    ? {
                        ...passenger,
                        title: selected.title || "",
                        firstName: selected.firstName || "",
                        lastName: selected.lastName || "",
                        dateOfBirth: selected.dateOfBirth
                            ? String(selected.dateOfBirth).slice(0, 10)
                            : "",
                        gender: selected.gender || "",
                        email: selected.email || "",
                        phoneNumber: selected.phoneNumber || "",
                        passportNumber: selected.passportNumber || "",
                        passportCountryCode: selected.passportCountryCode || "",
                        passportExpirationDate: selected.passportExpirationDate
                            ? String(selected.passportExpirationDate).slice(0, 10)
                            : "",
                        placeOfBirth: selected.placeOfBirth || "",
                        nationality: selected.nationality || "",
                        dlNumber: selected.dlNumber || "",
                        dlState: selected.dlState || "",
                        passengerType: selected.passengerType || passenger.passengerType,
                        isAccountPassenger: false,
                        selectedSavedPassengerId: selected.passengerId,
                    }
                    : passenger
            )
        );
    };

    const handleContinue = async () => {
        try {
            clearErrors();

            const userId = getUserIdFromStorage();
            const returnItinerary = state?.returnItinerary ?? null;

            for (const passenger of passengerForms) {
                const validationError = validatePassenger(passenger, isDomesticItinerary);
                if (validationError) {
                    setServerErrors({response:{data:validationError}});
                    return;
                }
            }

            const savedPassengers = [];

            for (const passenger of passengerForms) {
                const payload = toPassengerPayload(passenger, {
                    userId,
                    linkToUser: passenger.isAccountPassenger,
                });

                if (passenger.isAccountPassenger && profile?.passengerId) {
                    await updatePassenger(profile.passengerId, payload);

                    savedPassengers.push({
                        ...passenger,
                        passengerId: profile.passengerId,
                        userId: userId || null,
                    });
                } else {
                    const res = await createPassenger(payload);

                    savedPassengers.push({
                        ...passenger,
                        passengerId: res.data?.passengerId,
                        userId: passenger.isAccountPassenger ? userId || null : null,
                    });
                }
            }

            navigate("/booking/review", {
                state: {
                    selectedItinerary,
                    returnItinerary,
                    searchParams,
                    passengers: savedPassengers,
                },
            });
        } catch (err) {
            setServerErrors(err);
        }
    };

    const handleBack = () => {
       /* navigate("/flight-search", {
            state: { searchParams,selectedItinerary,fromBooking: true }
        });*/
        navigate(-1);
    };

    const isDomesticItinerary =
        selectedItinerary?.flights?.every((f) => f.isDomestic) ?? true;

    if (!selectedItinerary || !searchParams) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-2xl font-semibold">Passenger Details</h1>

                <Card className="p-5">
                    <p className="text-sm text-gray-500">Selected itinerary</p>
                    <p className="font-medium">
                        {selectedItinerary.flights[0].departingPort} →{" "}
                        {selectedItinerary.flights[selectedItinerary.flights.length - 1].arrivingPort}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Cabin: {capitalize(searchParams.cabinClass)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Passengers: {searchParams.passengers.adults} Adult,{" "}
                        {searchParams.passengers.children} Child,{" "}
                        {searchParams.passengers.infants} Infant
                    </p>
                </Card>

                {loading && (
                    <Card className="p-5">
                        <p>Loading passenger profile...</p>
                    </Card>
                )}

                <FormError errors={serverErrors}/>

                {!loading &&
                    passengerForms.map((passenger, index) => {
                        const sameTypeIndex =
                            passengerForms
                                .slice(0, index + 1)
                                .filter((p) => p.passengerType === passenger.passengerType).length - 1;

                        return (
                            <Card key={index} className="p-5 space-y-4 overflow-visible">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">
                                        {buildPassengerLabel(passenger.passengerType, sameTypeIndex)}
                                    </h2>

                                    {passenger.isAccountPassenger && (
                                        <p className="text-xs text-blue-600">
                                            Filled from your account details
                                        </p>
                                    )}
                                </div>

                                {!passenger.isAccountPassenger && (
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Use Saved Passenger
                                        </label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={passenger.selectedSavedPassengerId || ""}
                                            onChange={(e) => handleApplySavedPassenger(index, e.target.value)}
                                        >
                                            <option value="">Select saved passenger</option>
                                            {savedPassengers
                                                .filter((p) => p.passengerType === passenger.passengerType)
                                                .map((p) => (
                                                    <option key={p.passengerId} value={p.passengerId}>
                                                        {p.firstName} {p.lastName}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">First Name<RequiredMark /></label>
                                        <input
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={passenger.firstName}
                                            onChange={(e) =>
                                                handlePassengerChange(index, "firstName", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Last Name<RequiredMark /></label>
                                        <input
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={passenger.lastName}
                                            onChange={(e) =>
                                                handlePassengerChange(index, "lastName", e.target.value)
                                            }
                                        />
                                    </div>

                                    {passenger.passengerType === "Adult" && (
                                        <>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Email</label>
                                                <input
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={passenger.email}
                                                    onChange={(e) =>
                                                        handlePassengerChange(index, "email", e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                                                <input
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={passenger.phoneNumber}
                                                    onChange={(e) =>
                                                        handlePassengerChange(index, "phoneNumber", e.target.value)
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Date of Birth<RequiredMark /></label>
                                        <input
                                            type="date"
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={passenger.dateOfBirth}
                                            onChange={(e) =>
                                                handlePassengerChange(index, "dateOfBirth", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Dropdown
                                            label="Gender"
                                            value={passenger.gender}
                                            onChange={(val) =>
                                                handlePassengerChange(index, "gender", val)
                                            }
                                            options={genderOptions}
                                            defaultValue="Select gender"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {passenger.passengerType === "Adult" && isDomesticItinerary && (
                                        <>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">DL / ID Number<RequiredMark /></label>
                                                <input
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={passenger.dlNumber}
                                                    onChange={(e) =>
                                                        handlePassengerChange(index, "dlNumber", e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Combobox
                                                    label={<>DL / ID State<RequiredMark /></>}
                                                    value={passenger.dlState}
                                                    onChange={(val) =>
                                                        handlePassengerChange(index, "dlState", val)
                                                    }
                                                    options={stateOptions}
                                                    placeholder="Search state..."
                                                    emptyMessage="No states found"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {!isDomesticItinerary && (
                                        <>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Passport Number<RequiredMark /></label>
                                                <input
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={passenger.passportNumber}
                                                    onChange={(e) =>
                                                        handlePassengerChange(index, "passportNumber", e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Combobox
                                                    label={<>Passport Country<RequiredMark /></>}
                                                    value={passenger.passportCountryCode}
                                                    onChange={(val) =>
                                                        handlePassengerChange(index, "passportCountryCode", val)
                                                    }
                                                    options={countryOptions}
                                                    placeholder="Search country..."
                                                    emptyMessage="No countries found"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Passport Expiration Date<RequiredMark /></label>
                                                <input
                                                    type="date"
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={passenger.passportExpirationDate}
                                                    onChange={(e) =>
                                                        handlePassengerChange(index, "passportExpirationDate", e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Place of Birth</label>
                                                <input
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={passenger.placeOfBirth}
                                                    onChange={(e) =>
                                                        handlePassengerChange(index, "placeOfBirth", e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Combobox
                                                    label="Nationality"
                                                    value={passenger.nationality}
                                                    onChange={(val) =>
                                                        handlePassengerChange(index, "nationality", val)
                                                    }
                                                    options={countryOptions}
                                                    placeholder="Search nationality..."
                                                    emptyMessage="No countries found"
                                                />
                                            </div>
                                        </>
                                    )}
                                    
                                </div>
                            </Card>
                        );
                    })}

                {!loading && (
                    <div className="flex justify-center mt-8">
                        <Button variant="outline" onClick={handleBack} className="mr-auto"> Back </Button>
                        <Button onClick={handleContinue}>Continue</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
