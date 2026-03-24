import { useEffect, useMemo, useState } from "react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import TextInput from "../components/common/TextInput";
import Dropdown from "../components/common/Dropdown";
import Combobox from "../components/common/Combobox";
import Separator from "../components/common/Separator";
import Modal from "../components/common/Modal";
import {
    getAllFlights,
    createFlight,
    createRecurringFlights,
    updateFlight,
    deleteFlight,
} from "../services/flightService";
//import { getAllAircraft } from "../services/aircraftService";
import airportOptions from "../dropdownData/airports.json";

const statusFilterOptions = [
    { label: "All Statuses", value: "" },
    { label: "On Time", value: "On Time" },
    { label: "Delayed", value: "Delayed" },
    { label: "Cancelled", value: "Cancelled" },
    { label: "Boarding", value: "Boarding" },
    { label: "Departed", value: "Departed" },
    { label: "Arrived", value: "Arrived" },
];

const formStatusOptions = [
    { label: "On Time", value: "On Time" },
    { label: "Delayed", value: "Delayed" },
    { label: "Cancelled", value: "Cancelled" },
    { label: "Boarding", value: "Boarding" },
    { label: "Departed", value: "Departed" },
    { label: "Arrived", value: "Arrived" },
];

const sortOptions = [
    { label: "Flight Number", value: "flightNum" },
    { label: "Departure Time", value: "departTime" },
    { label: "Arrival Time", value: "arrivalTime" },
    { label: "Distance", value: "distance" },
    { label: "Status", value: "status" },
];

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
};

const weekdayOptions = [
    { label: "Sunday", value: 0 },
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
];

export default function Flights() {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortBy, setSortBy] = useState("flightNum");
    const [sortDirection, setSortDirection] = useState("asc");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFlightId, setEditingFlightId] = useState(null);
    const [formMode, setFormMode] = useState("single");

    const [formData, setFormData] = useState(emptyForm);
    const [recurringData, setRecurringData] = useState(emptyRecurringForm);

    const [aircraftOptions, setAircraftOptions] = useState([]);
    const [filteredAircraftOptions, setFilteredAircraftOptions] = useState([]);
    const [filteredAirportsDep, setFilteredAirportsDep] = useState(airportOptions);
    const [filteredAirportsArr, setFilteredAirportsArr] = useState(airportOptions);
    const [filteredAirportsDepR, setFilteredAirportsDepR] = useState(airportOptions);
    const [filteredAirportsArrR, setFilteredAirportsArrR] = useState(airportOptions);

    const formatForDateTimeLocal = (value) => {
        if (!value) return "";
        return new Date(value).toISOString().slice(0, 16);
    };

    const formatDisplayDateTime = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleString();
    };

    useEffect(() => {
        loadFlights();
        loadAircraft();
    }, []);

    const loadAircraft = async () => {
        try {
            const res = await getAllAircraft();
            const opts = res.data.map((a) => ({
                label: a.tailNumber,
                value: a.tailNumber,
            }));
            setAircraftOptions(opts);
            setFilteredAircraftOptions(opts);
        } catch {
            // non-critical — form still works without autocomplete
        }
    };

    const loadFlights = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await getAllFlights();
            setFlights(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load flights.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setRecurringData(emptyRecurringForm);
        setEditingFlightId(null);
        setFormMode("single");
        setIsModalOpen(false);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleRecurringChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRecurringData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
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
        setFormMode("single");
        setFormData(emptyForm);
        setRecurringData(emptyRecurringForm);
        setIsModalOpen(true);
    };

    const handleEdit = (flight) => {
        setSuccessMessage("");
        setError("");
        setFormMode("single");
        setEditingFlightId(flight.flightNum);
        setFormData({
            flightNum: flight.flightNum ?? "",
            departTime: formatForDateTimeLocal(flight.departTime),
            arrivalTime: formatForDateTimeLocal(flight.arrivalTime),
            aircraftUsed: flight.aircraftUsed ?? "",
            status: flight.status ?? "",
            departingPortCode: flight.departingPortCode ?? "",
            arrivingPortCode: flight.arrivingPortCode ?? "",
            isDomestic: !!flight.isDomestic,
            distance: flight.distance ?? "",
            flightChange: !!flight.flightChange,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (flightNum) => {
        const confirmed = window.confirm(
            `Delete flight ${flightNum}? This cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccessMessage("");
            await deleteFlight(flightNum);
            setSuccessMessage("Flight deleted successfully.");
            await loadFlights();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete flight.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        const payload = {
            flightNum: Number(formData.flightNum),
            departTime: formData.departTime,
            arrivalTime: formData.arrivalTime,
            aircraftUsed: formData.aircraftUsed,
            status: formData.status,
            departingPortCode: formData.departingPortCode,
            arrivingPortCode: formData.arrivingPortCode,
            isDomestic: formData.isDomestic,
            distance: Number(formData.distance),
            flightChange: formData.flightChange,
        };

        try {
            if (editingFlightId !== null) {
                await updateFlight(editingFlightId, payload);
                setSuccessMessage("Flight updated successfully.");
            } else {
                await createFlight(payload);
                setSuccessMessage("Flight created successfully.");
            }

            resetForm();
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
                ? `${recurringData.departureTimeOfDay}:00`
                : "",
            arrivalTimeOfDay: recurringData.arrivalTimeOfDay
                ? `${recurringData.arrivalTimeOfDay}:00`
                : "",
        };

        try {
            await createRecurringFlights(payload);
            setSuccessMessage("Recurring flights created successfully.");
            resetForm();
            await loadFlights();
        } catch (err) {
            setError(
                err?.response?.data?.message || "Failed to create recurring flights."
            );
        }
    };

    const filteredFlights = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        let result = [...flights];

        if (term) {
            result = result.filter((flight) =>
                String(flight.flightNum).toLowerCase().includes(term) ||
                (flight.aircraftUsed || "").toLowerCase().includes(term) ||
                (flight.status || "").toLowerCase().includes(term) ||
                (flight.departingPortCode || "").toLowerCase().includes(term) ||
                (flight.arrivingPortCode || "").toLowerCase().includes(term)
            );
        }

        if (statusFilter) {
            result = result.filter((flight) => flight.status === statusFilter);
        }

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

    const modalTitle = editingFlightId !== null ? "Edit Flight" : "Add Flight";

    const modalFooter = null; // buttons are inside each form

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            {/* Page header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Flights</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        View, add, edit, and delete flights.
                    </p>
                </div>

                <Button onClick={handleAddNew}>Add Flight</Button>
            </div>

            {/* Feedback messages */}
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {successMessage && (
                <p className="mb-4 text-sm text-green-600">{successMessage}</p>
            )}

            {/* Full-width flights table */}
            <Card className="p-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <TextInput
                        label="Search"
                        name="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Flight #, airport, status..."
                    />

                    <Dropdown
                        label="Status"
                        name="statusFilter"
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                        options={statusFilterOptions}
                    />

                    <Dropdown
                        label="Sort By"
                        name="sortBy"
                        value={sortBy}
                        onChange={(val) => setSortBy(val)}
                        options={sortOptions}
                    />

                    <Dropdown
                        label="Direction"
                        name="sortDirection"
                        value={sortDirection}
                        onChange={(val) => setSortDirection(val)}
                        options={[
                            { label: "Ascending", value: "asc" },
                            { label: "Descending", value: "desc" },
                        ]}
                    />
                </div>

                <Separator className="my-6" />

                {loading ? (
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
                                <th className="px-3 py-2">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredFlights.map((flight) => (
                                <tr
                                    key={flight.flightNum}
                                    className="rounded-xl bg-gray-50 text-sm"
                                >
                                    <td className="px-3 py-3 font-medium text-gray-900">
                                        {flight.flightNum}
                                    </td>
                                    <td className="px-3 py-3">
                                        {formatDisplayDateTime(flight.departTime)}
                                    </td>
                                    <td className="px-3 py-3">
                                        {formatDisplayDateTime(flight.arrivalTime)}
                                    </td>
                                    <td className="px-3 py-3">{flight.aircraftUsed}</td>
                                    <td className="px-3 py-3">
                                        {flight.departingPortCode} →{" "}
                                        {flight.arrivingPortCode}
                                    </td>
                                    <td className="px-3 py-3">{flight.status}</td>
                                    <td className="px-3 py-3">{flight.distance}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(flight)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(flight.flightNum)}
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

            {/* Add / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={resetForm}
                title={modalTitle}
                footer={modalFooter}
                className="!max-w-2xl"
                contentClassName="!max-h-[78vh]"
            >
                <p className="mb-4 text-sm text-gray-500">
                    {editingFlightId !== null
                        ? "Update the details for this flight."
                        : "Create a new flight record or set up a recurring schedule."}
                </p>

                {/* Single / Recurring tabs — only shown when adding */}
                {editingFlightId === null && (
                    <div className="mb-5 flex gap-2 border-b border-gray-200 pb-4">
                        <Button
                            type="button"
                            variant={formMode === "single" ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setFormMode("single")}
                        >
                            Single Flight
                        </Button>
                        <Button
                            type="button"
                            variant={formMode === "recurring" ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setFormMode("recurring")}
                        >
                            Recurring
                        </Button>
                    </div>
                )}

                {/* Single flight form */}
                {formMode === "single" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <TextInput
                            label="Flight Number"
                            name="flightNum"
                            type="number"
                            value={formData.flightNum}
                            onChange={handleFormChange}
                            disabled={editingFlightId !== null}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label="Departure Time"
                                name="departTime"
                                type="datetime-local"
                                value={formData.departTime}
                                onChange={handleFormChange}
                            />
                            <TextInput
                                label="Arrival Time"
                                name="arrivalTime"
                                type="datetime-local"
                                value={formData.arrivalTime}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Combobox
                                label="Aircraft Tail Number"
                                options={filteredAircraftOptions}
                                value={formData.aircraftUsed}
                                onChange={(val) => setFormData((p) => ({ ...p, aircraftUsed: val }))}
                                onSearch={(q) => setFilteredAircraftOptions(
                                    aircraftOptions.filter((o) =>
                                        o.label.toLowerCase().includes(q.toLowerCase())
                                    )
                                )}
                                placeholder="Search tail number..."
                            />
                            <Dropdown
                                label="Status"
                                value={formData.status}
                                onChange={(val) => setFormData((p) => ({ ...p, status: val }))}
                                options={formStatusOptions}
                                defaultValue="Select status"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Combobox
                                label="Departing Airport"
                                options={filteredAirportsDep}
                                value={formData.departingPortCode}
                                onChange={(val) => setFormData((p) => ({ ...p, departingPortCode: val }))}
                                onSearch={(q) => setFilteredAirportsDep(
                                    airportOptions.filter((o) =>
                                        o.label.toLowerCase().includes(q.toLowerCase())
                                    )
                                )}
                                placeholder="Search airport..."
                            />
                            <Combobox
                                label="Arriving Airport"
                                options={filteredAirportsArr}
                                value={formData.arrivingPortCode}
                                onChange={(val) => setFormData((p) => ({ ...p, arrivingPortCode: val }))}
                                onSearch={(q) => setFilteredAirportsArr(
                                    airportOptions.filter((o) =>
                                        o.label.toLowerCase().includes(q.toLowerCase())
                                    )
                                )}
                                placeholder="Search airport..."
                            />
                        </div>

                        <TextInput
                            label="Distance"
                            name="distance"
                            type="number"
                            value={formData.distance}
                            onChange={handleFormChange}
                        />

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                name="isDomestic"
                                checked={formData.isDomestic}
                                onChange={handleFormChange}
                            />
                            Domestic Flight
                        </label>

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                name="flightChange"
                                checked={formData.flightChange}
                                onChange={handleFormChange}
                            />
                            Flight Changed
                        </label>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit">
                                {editingFlightId !== null ? "Save Changes" : "Create Flight"}
                            </Button>
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {/* Recurring flight form — only available when adding */}
                {editingFlightId === null && formMode === "recurring" && (
                    <form onSubmit={handleRecurringSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label="Start Date"
                                name="startDate"
                                type="date"
                                value={recurringData.startDate}
                                onChange={handleRecurringChange}
                            />
                            <TextInput
                                label="End Date"
                                name="endDate"
                                type="date"
                                value={recurringData.endDate}
                                onChange={handleRecurringChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label="Departure Time"
                                name="departureTimeOfDay"
                                type="time"
                                value={recurringData.departureTimeOfDay}
                                onChange={handleRecurringChange}
                            />
                            <TextInput
                                label="Arrival Time"
                                name="arrivalTimeOfDay"
                                type="time"
                                value={recurringData.arrivalTimeOfDay}
                                onChange={handleRecurringChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Combobox
                                label="Aircraft Tail Number"
                                options={filteredAircraftOptions}
                                value={recurringData.aircraftUsed}
                                onChange={(val) => setRecurringData((p) => ({ ...p, aircraftUsed: val }))}
                                onSearch={(q) => setFilteredAircraftOptions(
                                    aircraftOptions.filter((o) =>
                                        o.label.toLowerCase().includes(q.toLowerCase())
                                    )
                                )}
                                placeholder="Search tail number..."
                            />
                            <Dropdown
                                label="Status"
                                value={recurringData.status}
                                onChange={(val) => setRecurringData((p) => ({ ...p, status: val }))}
                                options={formStatusOptions}
                                defaultValue="Select status"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Combobox
                                label="Departing Airport"
                                options={filteredAirportsDepR}
                                value={recurringData.departingPortCode}
                                onChange={(val) => setRecurringData((p) => ({ ...p, departingPortCode: val }))}
                                onSearch={(q) => setFilteredAirportsDepR(
                                    airportOptions.filter((o) =>
                                        o.label.toLowerCase().includes(q.toLowerCase())
                                    )
                                )}
                                placeholder="Search airport..."
                            />
                            <Combobox
                                label="Arriving Airport"
                                options={filteredAirportsArrR}
                                value={recurringData.arrivingPortCode}
                                onChange={(val) => setRecurringData((p) => ({ ...p, arrivingPortCode: val }))}
                                onSearch={(q) => setFilteredAirportsArrR(
                                    airportOptions.filter((o) =>
                                        o.label.toLowerCase().includes(q.toLowerCase())
                                    )
                                )}
                                placeholder="Search airport..."
                            />
                        </div>

                        <TextInput
                            label="Distance"
                            name="distance"
                            type="number"
                            value={recurringData.distance}
                            onChange={handleRecurringChange}
                        />

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                name="isDomestic"
                                checked={recurringData.isDomestic}
                                onChange={handleRecurringChange}
                            />
                            Domestic Flight
                        </label>

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                name="flightChange"
                                checked={recurringData.flightChange}
                                onChange={handleRecurringChange}
                            />
                            Flight Changed
                        </label>

                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Days of Week
                            </label>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                {weekdayOptions.map((day) => (
                                    <label
                                        key={day.value}
                                        className="flex items-center gap-2 text-sm text-gray-700"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={recurringData.daysOfWeek.includes(day.value)}
                                            onChange={() => toggleDay(day.value)}
                                        />
                                        {day.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit">Create Recurring Flights</Button>
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
