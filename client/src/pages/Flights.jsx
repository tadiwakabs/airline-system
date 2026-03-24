import { useEffect, useMemo, useState } from "react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import TextInput from "../components/common/TextInput";
import Dropdown from "../components/common/Dropdown";
import Separator from "../components/common/Separator";
import {
    getAllFlights,
    createFlight,
    updateFlight,
    deleteFlight,
} from "../services/flightService";

const statusOptions = [
    { label: "All Statuses", value: "" },
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

export default function Flights() {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortBy, setSortBy] = useState("flightNum");
    const [sortDirection, setSortDirection] = useState("asc");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingFlightId, setEditingFlightId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        loadFlights();
    }, []);

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
        setEditingFlightId(null);
        setIsFormOpen(false);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleAddNew = () => {
        setSuccessMessage("");
        setError("");
        setEditingFlightId(null);
        setFormData(emptyForm);
        setIsFormOpen(true);
    };

    const handleEdit = (flight) => {
        setSuccessMessage("");
        setError("");
        setEditingFlightId(flight.flightNum);
        setFormData({
            flightNum: flight.flightNum ?? "",
            departTime: flight.departTime ?? "",
            arrivalTime: flight.arrivalTime ?? "",
            aircraftUsed: flight.aircraftUsed ?? "",
            status: flight.status ?? "",
            departingPortCode: flight.departingPortCode ?? "",
            arrivingPortCode: flight.arrivingPortCode ?? "",
            isDomestic: !!flight.isDomestic,
            distance: flight.distance ?? "",
            flightChange: !!flight.flightChange,
        });
        setIsFormOpen(true);
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

            if (typeof aVal === "string") aVal = aVal.toLowerCase();
            if (typeof bVal === "string") bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [flights, searchTerm, statusFilter, sortBy, sortDirection]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Flights</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        View, add, edit, and delete flights.
                    </p>
                </div>

                <Button onClick={handleAddNew}>Add Flight</Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
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
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={statusOptions}
                        />

                        <Dropdown
                            label="Sort By"
                            name="sortBy"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            options={sortOptions}
                        />

                        <Dropdown
                            label="Direction"
                            name="sortDirection"
                            value={sortDirection}
                            onChange={(e) => setSortDirection(e.target.value)}
                            options={[
                                { label: "Ascending", value: "asc" },
                                { label: "Descending", value: "desc" },
                            ]}
                        />
                    </div>

                    <Separator className="my-6" />

                    {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                    {successMessage && (
                        <p className="mb-4 text-sm text-green-600">{successMessage}</p>
                    )}

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
                                        <td className="px-3 py-3">{flight.departTime}</td>
                                        <td className="px-3 py-3">{flight.arrivalTime}</td>
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
                                                    onClick={() =>
                                                        handleDelete(flight.flightNum)
                                                    }
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

                <Card className="h-fit p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {editingFlightId !== null ? "Edit Flight" : "Add Flight"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {editingFlightId !== null
                            ? "Update an existing flight."
                            : "Create a new flight record."}
                    </p>

                    <Separator className="my-6" />

                    {isFormOpen ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <TextInput
                                label="Flight Number"
                                name="flightNum"
                                type="number"
                                value={formData.flightNum}
                                onChange={handleFormChange}
                                disabled={editingFlightId !== null}
                            />

                            <TextInput
                                label="Departure Time"
                                name="departTime"
                                value={formData.departTime}
                                onChange={handleFormChange}
                                placeholder="e.g. 2026-03-23 08:30"
                            />

                            <TextInput
                                label="Arrival Time"
                                name="arrivalTime"
                                value={formData.arrivalTime}
                                onChange={handleFormChange}
                                placeholder="e.g. 2026-03-23 12:15"
                            />

                            <TextInput
                                label="Aircraft Tail Number"
                                name="aircraftUsed"
                                value={formData.aircraftUsed}
                                onChange={handleFormChange}
                            />

                            <TextInput
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleFormChange}
                                placeholder="On Time, Delayed, Cancelled..."
                            />

                            <TextInput
                                label="Departing Airport Code"
                                name="departingPortCode"
                                value={formData.departingPortCode}
                                onChange={handleFormChange}
                            />

                            <TextInput
                                label="Arriving Airport Code"
                                name="arrivingPortCode"
                                value={formData.arrivingPortCode}
                                onChange={handleFormChange}
                            />

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
                                    {editingFlightId !== null
                                        ? "Save Changes"
                                        : "Create Flight"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">
                                Select “Add Flight” to create a new record, or click
                                “Edit” on an existing flight.
                            </p>

                            <Button onClick={handleAddNew}>Open Form</Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
