import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Dropdown from "../../components/common/Dropdown";
import Combobox from "../../components/common/Combobox";
import Separator from "../../components/common/Separator";
import Modal from "../../components/common/Modal";
import Dialog from "../../components/common/Dialog";
import {
    getAllFlights,
    createFlight,
    createRecurringFlights,
    updateFlight,
    deleteFlight,
    upsertFlightPricing,
} from "../../services/flightService";
import { getAllAircraft } from "../../services/aircraftService";
import {
    getAllRecurringSchedules,
    updateRecurringSchedule,
    deleteRecurringSchedule,
    bulkImportRecurringSchedules,
} from "../../services/recurringScheduleService";
import airportOptions from "../../dropdownData/airports.json";

// ── Helpers ───────────────────────────────────────────────────────────────────

function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 3958.8;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
}

function getAirportCoords(code) {
    return airportOptions.find((a) => a.value === code) ?? null;
}

function formatTime(timeStr) {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const d = new Date();
    d.setHours(Number(h), Number(m));
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseDays(daysOfWeek) {
    if (!daysOfWeek) return [];
    if (Array.isArray(daysOfWeek)) return daysOfWeek.map(Number);
    return String(daysOfWeek).split(",").map(Number);
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Static option lists ───────────────────────────────────────────────────────

const statusFilterOptions = [
    { label: "All Statuses", value: "" },
    { label: "On Time",   value: "On Time" },
    { label: "Delayed",   value: "Delayed" },
    { label: "Cancelled", value: "Cancelled" },
    { label: "Boarding",  value: "Boarding" },
    { label: "Departed",  value: "Departed" },
    { label: "Arrived",   value: "Arrived" },
];

const formStatusOptions = [
    { label: "On Time",   value: "On Time" },
    { label: "Delayed",   value: "Delayed" },
    { label: "Cancelled", value: "Cancelled" },
    { label: "Boarding",  value: "Boarding" },
    { label: "Departed",  value: "Departed" },
    { label: "Arrived",   value: "Arrived" },
];

const sortOptions = [
    { label: "Flight Number",  value: "flightNum" },
    { label: "Departure Time", value: "departTime" },
    { label: "Arrival Time",   value: "arrivalTime" },
    { label: "Distance",       value: "distance" },
    { label: "Status",         value: "status" },
];

const weekdayOptions = [
    { label: "Sunday",    value: 0 },
    { label: "Monday",    value: 1 },
    { label: "Tuesday",   value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday",  value: 4 },
    { label: "Friday",    value: 5 },
    { label: "Saturday",  value: 6 },
];

// ── Empty form shapes ─────────────────────────────────────────────────────────

const emptyForm = {
    flightNum: "",
    departTime: "",
    arrivalTime: "",
    aircraftUsed: "",
    status: "",
    departingPortCode: "",
    arrivingPortCode: "",
    isDomestic: false,
    distance: "",
    flightChange: false,
    economyPrice: "",
    businessPrice: "",
    firstPrice: "",
};

const emptyRecurringForm = {
    startDate: "",
    endDate: "",
    departureTimeOfDay: "",
    arrivalTimeOfDay: "",
    aircraftUsed: "",
    status: "",
    departingPortCode: "",
    arrivingPortCode: "",
    isDomestic: false,
    distance: "",
    flightChange: false,
    daysOfWeek: [],
    economyPrice: "",
    businessPrice: "",
    firstPrice: "",
};

// ── Small shared sub-component ────────────────────────────────────────────────

function AirportCombobox({ label, value, onChange, filtered, onSearch }) {
    return (
        <Combobox
            label={label}
            options={filtered}
            value={value}
            onChange={onChange}
            onSearch={onSearch}
            placeholder="Search airport..."
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function Flights() {

    // ── Tab ───────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("flights"); // "flights" | "recurring"

    // ── Shared ────────────────────────────────────────────────────────────────
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [aircraftOpts, setAircraftOpts] = useState([]);
    const [filteredAircraftOpts, setFilteredAircraftOpts] = useState([]);

    // ── Flights tab ───────────────────────────────────────────────────────────
    const [flights, setFlights] = useState([]);
    const [flightsLoading, setFlightsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortBy, setSortBy] = useState("flightNum");
    const [sortDirection, setSortDirection] = useState("asc");
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [editingFlightId, setEditingFlightId] = useState(null);
    const [flightFormMode, setFlightFormMode] = useState("single");
    const [formData, setFormData] = useState(emptyForm);
    const [recurringData, setRecurringData] = useState(emptyRecurringForm);
    const [isDeleteFlightDialogOpen, setIsDeleteFlightDialogOpen] = useState(false);
    const [flightToDelete, setFlightToDelete] = useState(null);
    // airport filter states — flights tab
    const [apDepF,  setApDepF]  = useState(airportOptions);
    const [apArrF,  setApArrF]  = useState(airportOptions);
    const [apDepRF, setApDepRF] = useState(airportOptions);
    const [apArrRF, setApArrRF] = useState(airportOptions);

    // ── Recurring Schedules tab ───────────────────────────────────────────────
    const [schedules, setSchedules] = useState([]);
    const [schedulesLoading, setSchedulesLoading] = useState(true);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [scheduleForm, setScheduleForm] = useState(emptyRecurringForm);
    const [isDeleteScheduleDialogOpen, setIsDeleteScheduleDialogOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const [deleteScheduleMode, setDeleteScheduleMode] = useState("unlink"); // "unlink" | "delete"
    // airport filter states — schedule modal
    const [apDepS, setApDepS] = useState(airportOptions);
    const [apArrS, setApArrS] = useState(airportOptions);
    
    // CSV importing states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importJson, setImportJson]               = useState("");
    const [importError, setImportError]             = useState("");
    const [importResult, setImportResult]           = useState(null);
    const [importing, setImporting]                 = useState(false);

    // ── Initial load ──────────────────────────────────────────────────────────
    useEffect(() => {
        loadFlights();
        loadSchedules();
        loadAircraft();
    }, []);

    const loadAircraft = async () => {
        try {
            const res = await getAllAircraft();
            const opts = res.data.map((a) => ({ label: a.tailnumber, value: a.tailnumber }));
            setAircraftOpts(opts);
            setFilteredAircraftOpts(opts);
        } catch {
            // non-critical
        }
    };

    const loadFlights = async () => {
        try {
            setFlightsLoading(true);
            const res = await getAllFlights();
            setFlights(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load flights.");
        } finally {
            setFlightsLoading(false);
        }
    };

    const loadSchedules = async () => {
        try {
            setSchedulesLoading(true);
            const res = await getAllRecurringSchedules();
            setSchedules(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load recurring schedules.");
        } finally {
            setSchedulesLoading(false);
        }
    };

    // ── Formatters ────────────────────────────────────────────────────────────
    const pad = (num) => String(num).padStart(2, "0");

    const formatForDateTimeLocal = (value) => {
        if (!value) return "";

        const d = new Date(value);

        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const formatDisplayDateTime = (value) => {
        if (!value) return "";

        const d = new Date(value);

        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    };

    // ── Auto-distance effects ─────────────────────────────────────────────────
    useEffect(() => {
        const dep = getAirportCoords(formData.departingPortCode);
        const arr = getAirportCoords(formData.arrivingPortCode);
        setFormData((p) => ({
            ...p,
            distance: dep && arr ? haversineDistance(dep.lat, dep.lng, arr.lat, arr.lng) : "",
        }));
    }, [formData.departingPortCode, formData.arrivingPortCode]);

    useEffect(() => {
        const dep = getAirportCoords(recurringData.departingPortCode);
        const arr = getAirportCoords(recurringData.arrivingPortCode);
        setRecurringData((p) => ({
            ...p,
            distance: dep && arr ? haversineDistance(dep.lat, dep.lng, arr.lat, arr.lng) : "",
        }));
    }, [recurringData.departingPortCode, recurringData.arrivingPortCode]);

    useEffect(() => {
        const dep = getAirportCoords(scheduleForm.departingPortCode);
        const arr = getAirportCoords(scheduleForm.arrivingPortCode);
        setScheduleForm((p) => ({
            ...p,
            distance: dep && arr ? haversineDistance(dep.lat, dep.lng, arr.lat, arr.lng) : "",
        }));
    }, [scheduleForm.departingPortCode, scheduleForm.arrivingPortCode]);

    // ── Flights tab handlers ──────────────────────────────────────────────────

    const resetFlightForm = () => {
        setFormData(emptyForm);
        setRecurringData(emptyRecurringForm);
        setEditingFlightId(null);
        setFlightFormMode("single");
        setIsFlightModalOpen(false);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleRecurringChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRecurringData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const toggleDay = (dayValue) => {
        setRecurringData((prev) => {
            const exists = prev.daysOfWeek.includes(dayValue);
            return {
                ...prev,
                daysOfWeek: exists
                    ? prev.daysOfWeek.filter((d) => d !== dayValue)
                    : [...prev.daysOfWeek, dayValue].sort((a, b) => a - b),
            };
        });
    };

    const handleAddNew = () => {
        setSuccessMessage("");
        setError("");
        setEditingFlightId(null);
        setFlightFormMode("single");
        setFormData(emptyForm);
        setRecurringData(emptyRecurringForm);
        setIsFlightModalOpen(true);
    };

    const handleEdit = (flight) => {
        setSuccessMessage("");
        setError("");
        setFlightFormMode("single");
        setEditingFlightId(flight.flightNum);
        setFormData({
            flightNum:         flight.flightNum ?? "",
            departTime:        formatForDateTimeLocal(flight.departTime),
            arrivalTime:       formatForDateTimeLocal(flight.arrivalTime),
            aircraftUsed:      flight.aircraftUsed ?? "",
            status:            flight.status ?? "",
            departingPortCode: flight.departingPortCode ?? flight.departingPort ?? "",
            arrivingPortCode:  flight.arrivingPortCode ?? flight.arrivingPort ?? "",
            isDomestic:        !!flight.isDomestic,
            distance:          flight.distance ?? "",
            flightChange:      !!flight.flightChange,
            economyPrice:      flight.pricing?.find(p => p.cabinClass === "Economy")?.price ?? "",
            businessPrice:     flight.pricing?.find(p => p.cabinClass === "Business")?.price ?? "",
            firstPrice:        flight.pricing?.find(p => p.cabinClass === "First")?.price ?? "",
        });
        setIsFlightModalOpen(true);
    };

    const handleDelete = (flight) => {
        setError("");
        setSuccessMessage("");
        setFlightToDelete(flight);
        setIsDeleteFlightDialogOpen(true);
    };

    const confirmDeleteFlight = async () => {
        if (!flightToDelete) return;

        try {
            setError("");
            setSuccessMessage("");

            await deleteFlight(flightToDelete.flightNum);

            setSuccessMessage(`Flight ${flightToDelete.flightNum} deleted successfully.`);

            setIsDeleteFlightDialogOpen(false);
            setFlightToDelete(null);

            await loadFlights();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete flight.");
        }
    };

    const handleFlightSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        const payload = {
            flightNum:         Number(formData.flightNum),
            departTime:        formData.departTime,
            arrivalTime:       formData.arrivalTime,
            aircraftUsed:      formData.aircraftUsed,
            status:            formData.status,
            departingPortCode: formData.departingPortCode,
            arrivingPortCode:  formData.arrivingPortCode,
            isDomestic:        formData.isDomestic,
            distance:          Number(formData.distance),
            flightChange:      formData.flightChange,
        };
        try {
            if (editingFlightId !== null) {
                await updateFlight(editingFlightId, payload);
            } else {
                await createFlight(payload);
            }
            // Upsert pricing if any price was provided
            if (formData.economyPrice || formData.businessPrice || formData.firstPrice) {
                await upsertFlightPricing(payload.flightNum, {
                    economyPrice:  Number(formData.economyPrice),
                    businessPrice: Number(formData.businessPrice),
                    firstPrice:    Number(formData.firstPrice),
                });
            }
            setSuccessMessage(editingFlightId !== null ? "Flight updated successfully." : "Flight created successfully.");
            resetFlightForm();
            await loadFlights();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to save flight.");
        }
    };

    const handleRecurringSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        const payload = {
            ...recurringData,
            distance: Number(recurringData.distance),
            departureTimeOfDay: recurringData.departureTimeOfDay
                ? `${recurringData.departureTimeOfDay}:00` : "",
            arrivalTimeOfDay: recurringData.arrivalTimeOfDay
                ? `${recurringData.arrivalTimeOfDay}:00` : "",
            economyPrice:  recurringData.economyPrice  ? Number(recurringData.economyPrice)  : null,
            businessPrice: recurringData.businessPrice ? Number(recurringData.businessPrice) : null,
            firstPrice:    recurringData.firstPrice    ? Number(recurringData.firstPrice)    : null,
        };
        try {
            await createRecurringFlights(payload);
            setSuccessMessage("Recurring flights created successfully.");
            resetFlightForm();
            await loadFlights();
            await loadSchedules();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to create recurring flights.");
        }
    };

    // ── Recurring Schedules tab handlers ──────────────────────────────────────

    const resetScheduleForm = () => {
        setScheduleForm(emptyRecurringForm);
        setEditingScheduleId(null);
        setIsScheduleModalOpen(false);
    };

    const handleScheduleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setScheduleForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const toggleScheduleDay = (dayValue) => {
        setScheduleForm((prev) => {
            const exists = prev.daysOfWeek.includes(dayValue);
            return {
                ...prev,
                daysOfWeek: exists
                    ? prev.daysOfWeek.filter((d) => d !== dayValue)
                    : [...prev.daysOfWeek, dayValue].sort((a, b) => a - b),
            };
        });
    };

    const handleEditSchedule = (schedule) => {
        setSuccessMessage("");
        setError("");
        setEditingScheduleId(schedule.id);
        setScheduleForm({
            departingPortCode:  schedule.departingPortCode ?? schedule.departingPort ?? "",
            arrivingPortCode:   schedule.arrivingPortCode ?? schedule.arrivingPort ?? "",
            departureTimeOfDay: schedule.departureTimeOfDay?.slice(0, 5) ?? "",
            arrivalTimeOfDay:   schedule.arrivalTimeOfDay?.slice(0, 5) ?? "",
            aircraftUsed:       schedule.aircraftUsed ?? "",
            status:             schedule.status ?? "",
            isDomestic:         !!schedule.isDomestic,
            distance:           schedule.distance ?? "",
            flightChange:       !!schedule.flightChange,
            startDate:          schedule.startDate?.slice(0, 10) ?? "",
            endDate:            schedule.endDate?.slice(0, 10) ?? "",
            daysOfWeek:         parseDays(schedule.daysOfWeek),
            economyPrice:       schedule.economyPrice ?? "",
            businessPrice:      schedule.businessPrice ?? "",
            firstPrice:         schedule.firstPrice ?? "",
        });
        setIsScheduleModalOpen(true);
    };

    const handleImport = async () => {
        setImportError("");
        setImportResult(null);

        let parsed;
        try {
            parsed = JSON.parse(importJson);
            if (!Array.isArray(parsed)) throw new Error("Must be a JSON array.");
        } catch (e) {
            setImportError("Invalid JSON: " + e.message);
            return;
        }

        setImporting(true);
        try {
            const res = await bulkImportRecurringSchedules(parsed);
            setImportResult(res.data);
            await loadSchedules();
            await loadFlights();
        } catch (err) {
            setImportError(err?.response?.data?.message || "Import failed.");
        } finally {
            setImporting(false);
        }
    };

    const handleDeleteSchedule = (schedule) => {
        setSuccessMessage("");
        setError("");
        setScheduleToDelete(schedule);
        setDeleteScheduleMode("unlink");
        setIsDeleteScheduleDialogOpen(true);
    };

    const confirmDeleteSchedule = async () => {
        if (!scheduleToDelete) return;

        const deleteFlights = deleteScheduleMode === "delete";

        try {
            setError("");
            setSuccessMessage("");

            await deleteRecurringSchedule(scheduleToDelete.id, deleteFlights);

            setSuccessMessage(
                deleteFlights
                    ? "Schedule and future flights deleted."
                    : "Schedule deleted. Existing flights have been unlinked."
            );

            setIsDeleteScheduleDialogOpen(false);
            setScheduleToDelete(null);

            await loadSchedules();
            await loadFlights();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete schedule.");
        }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        const payload = {
            ...scheduleForm,
            distance: Number(scheduleForm.distance),
            departureTimeOfDay: scheduleForm.departureTimeOfDay
                ? `${scheduleForm.departureTimeOfDay}:00` : "",
            arrivalTimeOfDay: scheduleForm.arrivalTimeOfDay
                ? `${scheduleForm.arrivalTimeOfDay}:00` : "",
            economyPrice:  scheduleForm.economyPrice  ? Number(scheduleForm.economyPrice)  : null,
            businessPrice: scheduleForm.businessPrice ? Number(scheduleForm.businessPrice) : null,
            firstPrice:    scheduleForm.firstPrice    ? Number(scheduleForm.firstPrice)    : null,
        };
        try {
            await updateRecurringSchedule(editingScheduleId, payload);
            setSuccessMessage("Schedule updated. Future flights have been regenerated.");
            resetScheduleForm();
            await loadSchedules();
            await loadFlights();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update schedule.");
        }
    };

    // ── Filtered / sorted flights ─────────────────────────────────────────────
    const filteredFlights = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let result = [...flights];
        if (term) {
            result = result.filter((f) =>
                String(f.flightNum).toLowerCase().includes(term) ||
                (f.aircraftUsed || "").toLowerCase().includes(term) ||
                (f.status || "").toLowerCase().includes(term) ||
                (f.departingPortCode || f.departingPort || "").toLowerCase().includes(term) ||
                (f.arrivingPortCode  || f.arrivingPort  || "").toLowerCase().includes(term)
            );
        }
        if (statusFilter) result = result.filter((f) => f.status === statusFilter);
        result.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            if (sortBy === "departTime" || sortBy === "arrivalTime") {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else {
                if (typeof aVal === "string") aVal = aVal.toLowerCase();
                if (typeof bVal === "string") bVal = bVal.toLowerCase();
            }
            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
        return result;
    }, [flights, searchTerm, statusFilter, sortBy, sortDirection]);

    // ── Shared helpers ────────────────────────────────────────────────────────
    const searchAircraft = (q) =>
        setFilteredAircraftOpts(
            aircraftOpts.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
        );

    const filterAirports = (q) =>
        airportOptions.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));

    // Reusable form sections
    const renderAircraftAndStatus = (data, setData) => (
        <div className="grid grid-cols-2 gap-4">
            <Combobox
                label="Aircraft Tail Number"
                options={filteredAircraftOpts}
                value={data.aircraftUsed}
                onChange={(val) => setData((p) => ({ ...p, aircraftUsed: val }))}
                onSearch={searchAircraft}
                placeholder="Search tail number..."
            />
            <Dropdown
                label="Status"
                value={data.status}
                onChange={(val) => setData((p) => ({ ...p, status: val }))}
                options={formStatusOptions}
                defaultValue="Select status"
            />
        </div>
    );

    const renderCheckboxes = (data, onChange) => (
        <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="isDomestic"   checked={data.isDomestic}   onChange={onChange} />
                Domestic Flight
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="flightChange" checked={data.flightChange} onChange={onChange} />
                Flight Changed
            </label>
        </div>
    );

    const renderDaysOfWeek = (daysOfWeek, toggle) => (
        <div>
            <label className="text-sm font-medium text-gray-700">Days of Week</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
                {weekdayOptions.map((day) => (
                    <label key={day.value} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={daysOfWeek.includes(day.value)}
                            onChange={() => toggle(day.value)}
                        />
                        {day.label}
                    </label>
                ))}
            </div>
        </div>
    );

    const renderDistanceField = (value, onChange) => (
        <TextInput
            label="Distance (miles)"
            name="distance"
            type="number"
            value={value}
            onChange={onChange}
            disabled
            className="bg-gray-50 text-gray-500 cursor-not-allowed"
        />
    );

    // ── Tab button ────────────────────────────────────────────────────────────
    const TabButton = ({ id, label }) => (
        <button
            onClick={() => { setActiveTab(id); setError(""); setSuccessMessage(""); }}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors duration-150 ${
                activeTab === id
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
            {label}
        </button>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl px-4 py-10">

            {/* Page header */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Flights</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage individual and recurring flights.</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => {
                            if (activeTab === "flights") {
                                handleAddNew();
                            } else {
                                setSuccessMessage("");
                                setError("");
                                setEditingFlightId(null);
                                setFlightFormMode("recurring");
                                setFormData(emptyForm);
                                setRecurringData(emptyRecurringForm);
                                setIsFlightModalOpen(true);
                            }
                        }}
                    >
                        {activeTab === "flights" ? "Add Flight" : "Add Recurring Schedule"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                        setImportJson("");
                        setImportError("");
                        setImportResult(null);
                        setIsImportModalOpen(true);
                    }}>
                        Import JSON
                    </Button>
                </div>
                
            </div>

            {/* Feedback */}
            {error          && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {successMessage && <p className="mb-4 text-sm text-green-600">{successMessage}</p>}

            {/* Tab bar */}
            <div className="flex border-b border-gray-200 mb-6">
                <TabButton id="flights"   label="Flights" />
                <TabButton id="recurring" label="Recurring Schedules" />
            </div>

            {/* ════════════════════════════════════════════════════════════════
                FLIGHTS TAB
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === "flights" && (
                <Card className="p-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <TextInput
                            label="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Flight #, airport, status..."
                        />
                        <Dropdown label="Status"    value={statusFilter}   onChange={(val) => setStatusFilter(val)}   options={statusFilterOptions} />
                        <Dropdown label="Sort By"   value={sortBy}         onChange={(val) => setSortBy(val)}         options={sortOptions} />
                        <Dropdown
                            label="Direction"
                            value={sortDirection}
                            onChange={(val) => setSortDirection(val)}
                            options={[
                                { label: "Ascending",  value: "asc" },
                                { label: "Descending", value: "desc" },
                            ]}
                        />
                    </div>

                    <Separator className="my-6" />

                    {flightsLoading ? (
                        <p>Loading flights...</p>
                    ) : filteredFlights.length === 0 ? (
                        <p className="text-sm text-gray-500">No flights found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2">
                                <thead>
                                <tr className="text-left text-sm text-gray-500">
                                    <th className="px-3 py-2">Flight #</th>
                                    <th className="px-3 py-2">Departure</th>
                                    <th className="px-3 py-2">Arrival</th>
                                    <th className="px-3 py-2">Aircraft</th>
                                    <th className="px-3 py-2">Route</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Distance</th>
                                    <th className="px-3 py-2">Price</th>
                                    <th className="px-3 py-2">Type</th>
                                    <th className="px-3 py-2">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredFlights.map((flight) => (
                                    <tr key={flight.flightNum} className="rounded-xl bg-gray-50 text-sm">
                                        <td className="px-3 py-3 font-medium text-gray-900">{flight.flightNum}</td>
                                        <td className="px-3 py-3">{formatDisplayDateTime(flight.departTime)}</td>
                                        <td className="px-3 py-3">{formatDisplayDateTime(flight.arrivalTime)}</td>
                                        <td className="px-3 py-3">{flight.aircraftUsed}</td>
                                        <td className="px-3 py-3">
                                            {flight.departingPortCode ?? flight.departingPort} →{" "}
                                            {flight.arrivingPortCode  ?? flight.arrivingPort}
                                        </td>
                                        <td className="px-3 py-3">{flight.status}</td>
                                        <td className="px-3 py-3">{flight.distance}</td>
                                        <td className="px-3 py-3">
                                            {flight.pricing && flight.pricing.length > 0 ? (
                                                <div className="flex flex-col gap-0.2 text-xs text-slate-900">
                                                    {["Economy", "Business", "First"].map((cls) => {
                                                        const p = flight.pricing.find(x => x.cabinClass === cls);
                                                        const abbr = cls[0];
                                                        return p
                                                            ? <span key={cls}><span className="font-medium">{abbr}:</span> ${Number(p.price).toFixed(2)}</span>
                                                            : <span key={cls} className="text-gray-400">{abbr}: —</span>;
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Not set</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">{flight.isDomestic ? "Domestic" : "International"}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(flight)}>Edit</Button>
                                                <Button
                                                    size="sm" variant="outline"
                                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(flight)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* ════════════════════════════════════════════════════════════════
                RECURRING SCHEDULES TAB
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === "recurring" && (
                <Card className="p-6">
                    {schedulesLoading ? (
                        <p>Loading schedules...</p>
                    ) : schedules.length === 0 ? (
                        <p className="text-sm text-gray-500">No recurring schedules found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2">
                                <thead>
                                <tr className="text-left text-sm text-gray-500">
                                    <th className="px-3 py-2">ID</th>
                                    <th className="px-3 py-2">Route</th>
                                    <th className="px-3 py-2">Depart</th>
                                    <th className="px-3 py-2">Arrive</th>
                                    <th className="px-3 py-2">Aircraft</th>
                                    <th className="px-3 py-2">Days</th>
                                    <th className="px-3 py-2">Date Range</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {schedules.map((s) => (
                                    <tr key={s.id} className="rounded-xl bg-gray-50 text-sm">
                                        <td className="px-3 py-3 font-medium text-gray-900">{s.id}</td>
                                        <td className="px-3 py-3">{s.departingPort} → {s.arrivingPort}</td>
                                        <td className="px-3 py-3">{formatTime(s.departureTimeOfDay)}</td>
                                        <td className="px-3 py-3">{formatTime(s.arrivalTimeOfDay)}</td>
                                        <td className="px-3 py-3">{s.aircraftUsed}</td>
                                        <td className="px-3 py-3">
                                            {parseDays(s.daysOfWeek).map((d) => DAY_LABELS[d]).join(", ")}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {s.startDate?.slice(0, 10)} – {s.endDate?.slice(0, 10)}
                                        </td>
                                        <td className="px-3 py-3">{s.status}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleEditSchedule(s)}>Edit</Button>
                                                <Button
                                                    size="sm" variant="outline"
                                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDeleteSchedule(s)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* ════════════════════════════════════════════════════════════════
                ADD / EDIT FLIGHT MODAL
            ════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isFlightModalOpen}
                onClose={resetFlightForm}
                title={editingFlightId !== null ? "Edit Flight" : "Add Flight"}
                className="!max-w-2xl"
                contentClassName="!max-h-[78vh]"
            >
                <p className="mb-4 text-sm text-gray-500">
                    {editingFlightId !== null
                        ? "Update the details for this flight."
                        : "Create a new flight record or set up a recurring schedule."}
                </p>

                {editingFlightId === null && (
                    <div className="mb-5 flex gap-2 border-b border-gray-200 pb-4">
                        <Button type="button" variant={flightFormMode === "single"    ? "primary" : "outline"} size="sm" onClick={() => setFlightFormMode("single")}>Single Flight</Button>
                        <Button type="button" variant={flightFormMode === "recurring" ? "primary" : "outline"} size="sm" onClick={() => setFlightFormMode("recurring")}>Recurring</Button>
                    </div>
                )}

                {/* Single flight form */}
                {flightFormMode === "single" && (
                    <form onSubmit={handleFlightSubmit} className="space-y-4">
                        <TextInput
                            label="Flight Number" name="flightNum" type="number"
                            value={formData.flightNum} onChange={handleFormChange}
                            disabled={editingFlightId !== null}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <TextInput label="Departure Time" name="departTime"  type="datetime-local" value={formData.departTime}  onChange={handleFormChange} />
                            <TextInput label="Arrival Time"   name="arrivalTime" type="datetime-local" value={formData.arrivalTime} onChange={handleFormChange} />
                        </div>
                        {renderAircraftAndStatus(formData, setFormData)}
                        <div className="grid grid-cols-2 gap-4">
                            <AirportCombobox label="Departing Airport" value={formData.departingPortCode}
                                             onChange={(val) => setFormData((p) => ({ ...p, departingPortCode: val }))}
                                             filtered={apDepF} onSearch={(q) => setApDepF(filterAirports(q))} />
                            <AirportCombobox label="Arriving Airport" value={formData.arrivingPortCode}
                                             onChange={(val) => setFormData((p) => ({ ...p, arrivingPortCode: val }))}
                                             filtered={apArrF} onSearch={(q) => setApArrF(filterAirports(q))} />
                        </div>
                        {renderDistanceField(formData.distance, handleFormChange)}
                        {renderCheckboxes(formData, handleFormChange)}
                        <Separator />
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Pricing</p>
                            <div className="grid grid-cols-3 gap-4">
                                <TextInput
                                    label="Economy ($)"
                                    name="economyPrice"
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.economyPrice}
                                    onChange={handleFormChange}
                                />
                                <TextInput
                                    label="Business ($)"
                                    name="businessPrice"
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.businessPrice}
                                    onChange={handleFormChange}
                                />
                                <TextInput
                                    label="First Class ($)"
                                    name="firstPrice"
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.firstPrice}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="submit">{editingFlightId !== null ? "Save Changes" : "Create Flight"}</Button>
                            <Button type="button" variant="outline" onClick={resetFlightForm}>Cancel</Button>
                        </div>
                    </form>
                )}

                {/* Recurring create form */}
                {editingFlightId === null && flightFormMode === "recurring" && (
                    <form onSubmit={handleRecurringSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <TextInput label="Start Date" name="startDate" type="date" value={recurringData.startDate} onChange={handleRecurringChange} />
                            <TextInput label="End Date"   name="endDate"   type="date" value={recurringData.endDate}   onChange={handleRecurringChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <TextInput label="Departure Time" name="departureTimeOfDay" type="time" value={recurringData.departureTimeOfDay} onChange={handleRecurringChange} />
                            <TextInput label="Arrival Time"   name="arrivalTimeOfDay"   type="time" value={recurringData.arrivalTimeOfDay}   onChange={handleRecurringChange} />
                        </div>
                        {renderAircraftAndStatus(recurringData, setRecurringData)}
                        <div className="grid grid-cols-2 gap-4">
                            <AirportCombobox label="Departing Airport" value={recurringData.departingPortCode}
                                             onChange={(val) => setRecurringData((p) => ({ ...p, departingPortCode: val }))}
                                             filtered={apDepRF} onSearch={(q) => setApDepRF(filterAirports(q))} />
                            <AirportCombobox label="Arriving Airport" value={recurringData.arrivingPortCode}
                                             onChange={(val) => setRecurringData((p) => ({ ...p, arrivingPortCode: val }))}
                                             filtered={apArrRF} onSearch={(q) => setApArrRF(filterAirports(q))} />
                        </div>
                        {renderDistanceField(recurringData.distance, handleRecurringChange)}
                        {renderCheckboxes(recurringData, handleRecurringChange)}
                        {renderDaysOfWeek(recurringData.daysOfWeek, toggleDay)}
                        <Separator />
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Pricing</p>
                            <div className="grid grid-cols-3 gap-4">
                                <TextInput
                                    label="Economy ($)"
                                    name="economyPrice"
                                    type="number"
                                    placeholder="0.00"
                                    value={recurringData.economyPrice}
                                    onChange={handleRecurringChange}
                                />
                                <TextInput
                                    label="Business ($)"
                                    name="businessPrice"
                                    type="number"
                                    placeholder="0.00"
                                    value={recurringData.businessPrice}
                                    onChange={handleRecurringChange}
                                />
                                <TextInput
                                    label="First Class ($)"
                                    name="firstPrice"
                                    type="number"
                                    placeholder="0.00"
                                    value={recurringData.firstPrice}
                                    onChange={handleRecurringChange}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="submit">Create Recurring Flights</Button>
                            <Button type="button" variant="outline" onClick={resetFlightForm}>Cancel</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ════════════════════════════════════════════════════════════════
                EDIT RECURRING SCHEDULE MODAL
            ════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isScheduleModalOpen}
                onClose={resetScheduleForm}
                title="Edit Recurring Schedule"
                className="!max-w-2xl"
                contentClassName="!max-h-[78vh]"
            >
                <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Changes apply to all future flights in this schedule. If the date range
                    or days of week change, future flights will be deleted and regenerated.
                </p>

                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput label="Start Date" name="startDate" type="date" value={scheduleForm.startDate} onChange={handleScheduleFormChange} />
                        <TextInput label="End Date"   name="endDate"   type="date" value={scheduleForm.endDate}   onChange={handleScheduleFormChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput label="Departure Time" name="departureTimeOfDay" type="time" value={scheduleForm.departureTimeOfDay} onChange={handleScheduleFormChange} />
                        <TextInput label="Arrival Time"   name="arrivalTimeOfDay"   type="time" value={scheduleForm.arrivalTimeOfDay}   onChange={handleScheduleFormChange} />
                    </div>
                    {renderAircraftAndStatus(scheduleForm, setScheduleForm)}
                    <div className="grid grid-cols-2 gap-4">
                        <AirportCombobox label="Departing Airport" value={scheduleForm.departingPortCode}
                                         onChange={(val) => setScheduleForm((p) => ({ ...p, departingPortCode: val }))}
                                         filtered={apDepS} onSearch={(q) => setApDepS(filterAirports(q))} />
                        <AirportCombobox label="Arriving Airport" value={scheduleForm.arrivingPortCode}
                                         onChange={(val) => setScheduleForm((p) => ({ ...p, arrivingPortCode: val }))}
                                         filtered={apArrS} onSearch={(q) => setApArrS(filterAirports(q))} />
                    </div>
                    {renderDistanceField(scheduleForm.distance, handleScheduleFormChange)}
                    {renderCheckboxes(scheduleForm, handleScheduleFormChange)}
                    {renderDaysOfWeek(scheduleForm.daysOfWeek, toggleScheduleDay)}
                    <Separator />
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Pricing</p>
                        <p className="text-xs text-gray-500 mb-3">Applied to all regenerated future flights.</p>
                        <div className="grid grid-cols-3 gap-4">
                            <TextInput
                                label="Economy ($)"
                                name="economyPrice"
                                type="number"
                                placeholder="0.00"
                                value={scheduleForm.economyPrice}
                                onChange={handleScheduleFormChange}
                            />
                            <TextInput
                                label="Business ($)"
                                name="businessPrice"
                                type="number"
                                placeholder="0.00"
                                value={scheduleForm.businessPrice}
                                onChange={handleScheduleFormChange}
                            />
                            <TextInput
                                label="First Class ($)"
                                name="firstPrice"
                                type="number"
                                placeholder="0.00"
                                value={scheduleForm.firstPrice}
                                onChange={handleScheduleFormChange}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit">Save Changes</Button>
                        <Button type="button" variant="outline" onClick={resetScheduleForm}>Cancel</Button>
                    </div>
                </form>
            </Modal>

            {/* ════════════════════════════════════════════════════════════════
                DELETE FLIGHT DIALOG
            ════════════════════════════════════════════════════════════════ */}
            <Dialog
                isOpen={isDeleteFlightDialogOpen}
                onClose={() => {
                    setIsDeleteFlightDialogOpen(false);
                    setFlightToDelete(null);
                }}
                title="Delete Flight"
                description={
                    flightToDelete
                        ? `Are you sure you want to delete flight #${flightToDelete.flightNum}?`
                        : "Are you sure you want to delete this flight?"
                }
                confirmText="Delete Flight"
                confirmVariant="danger"
                onConfirm={confirmDeleteFlight}
                className="!max-w-md"
            >
                <div className="space-y-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        This action cannot be undone.
                    </div>

                    {flightToDelete && (
                        <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-700">
                            <p>
                                <span className="font-medium">Flight #:</span>{" "}
                                {flightToDelete.flightNum}
                            </p>
                            <p>
                                <span className="font-medium">Route:</span>{" "}
                                {flightToDelete.departingPortCode ?? flightToDelete.departingPort}
                                {" → "}
                                {flightToDelete.arrivingPortCode ?? flightToDelete.arrivingPort}
                            </p>
                            <p>
                                <span className="font-medium">Departure:</span>{" "}
                                {formatDisplayDateTime(flightToDelete.departTime)}
                            </p>
                        </div>
                    )}
                </div>
            </Dialog>


            {/* ════════════════════════════════════════════════════════════════
                DELETE RECURRING SCHEDULE DIALOG
            ════════════════════════════════════════════════════════════════ */}
            <Dialog
                isOpen={isDeleteScheduleDialogOpen}
                onClose={() => {
                    setIsDeleteScheduleDialogOpen(false);
                    setScheduleToDelete(null);
                    setDeleteScheduleMode("unlink");
                }}
                title="Delete Recurring Schedule"
                description={
                    scheduleToDelete
                        ? `Are you sure you want to delete recurring schedule #${scheduleToDelete.id}?`
                        : "Are you sure you want to delete this recurring schedule?"
                }
                confirmText={
                    deleteScheduleMode === "delete"
                        ? "Delete Schedule & Flights"
                        : "Delete Schedule"
                }
                confirmVariant="danger"
                onConfirm={confirmDeleteSchedule}
                className="!max-w-xl"
            >
                <div className="space-y-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        This action cannot be undone.
                    </div>

                    <div className="space-y-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                            <input
                                type="radio"
                                name="deleteScheduleMode"
                                checked={deleteScheduleMode === "unlink"}
                                onChange={() => setDeleteScheduleMode("unlink")}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-medium text-gray-900">Delete schedule only</p>
                                <p className="text-sm text-gray-600">
                                    Keep existing/future generated flights, but unlink them from this schedule.
                                </p>
                            </div>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                            <input
                                type="radio"
                                name="deleteScheduleMode"
                                checked={deleteScheduleMode === "delete"}
                                onChange={() => setDeleteScheduleMode("delete")}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-medium text-gray-900">Delete schedule and future flights</p>
                                <p className="text-sm text-gray-600">
                                    Remove the recurring schedule and also delete the future flights generated from it.
                                </p>
                            </div>
                        </label>
                    </div>

                    {scheduleToDelete && (
                        <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-700">
                            <p>
                                <span className="font-medium">Route:</span>{" "}
                                {scheduleToDelete.departingPortCode} → {scheduleToDelete.arrivingPortCode}
                            </p>
                            <p>
                                <span className="font-medium">Aircraft:</span> {scheduleToDelete.aircraftUsed}
                            </p>
                            <p>
                                <span className="font-medium">Date Range:</span>{" "}
                                {scheduleToDelete.startDate?.slice(0, 10)} – {scheduleToDelete.endDate?.slice(0, 10)}
                            </p>
                        </div>
                    )}
                </div>
            </Dialog>

            {/* ════════════════════════════════════════════════════════════════
                IMPORT RECURRING SCHEDULES MODAL
            ════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Bulk Import Recurring Schedules"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Paste a JSON array of recurring schedule objects. Each entry uses the same
                        shape as a single recurring schedule.{" "}
                        <button
                            className="text-blue-600 underline text-sm"
                            onClick={() => {
                                const template = JSON.stringify([{
                                    departingPortCode:  "HOU",
                                    arrivingPortCode:   "DAL",
                                    departureTimeOfDay: "08:00:00",
                                    arrivalTimeOfDay:   "09:15:00",
                                    aircraftUsed:       "B737",
                                    status:             "On Time",
                                    isDomestic:         true,
                                    distance:           239,
                                    flightChange:       false,
                                    startDate:          "2026-04-01",
                                    endDate:            "2026-06-30",
                                    daysOfWeek:         [1, 2, 3, 4, 5],
                                    economyPrice:       199,
                                    businessPrice:      399,
                                    firstPrice:         699,
                                }], null, 2);
                                setImportJson(template);
                            }}
                        >
                            Load template
                        </button>
                    </p>

                    <textarea
                        className="w-full h-72 border border-gray-300 rounded p-2 font-mono text-xs"
                        placeholder='[{ "departingPortCode": "HOU", ... }]'
                        value={importJson}
                        onChange={(e) => setImportJson(e.target.value)}
                    />

                    {importError && (
                        <p className="text-sm text-red-600">{importError}</p>
                    )}

                    {importResult && (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
                            <p className="font-medium">Import complete</p>
                            <p>{importResult.imported} schedule(s) imported.</p>
                            {importResult.errors?.length > 0 && (
                                <p className="text-yellow-700 mt-1">
                                    {importResult.errors.length} row(s) had errors — check the console.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={handleImport} disabled={importing || !importJson.trim()}>
                            {importing ? "Importing..." : "Import"}
                        </Button>
                        <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}
