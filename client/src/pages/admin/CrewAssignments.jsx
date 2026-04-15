import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Dropdown from "../../components/common/Dropdown";
import Separator from "../../components/common/Separator";
import Modal from "../../components/common/Modal";
import {
    getAllFlights,
} from "../../services/flightService";
import {
    getAllEmployees,
    getCrewForFlight,
    assignCrewToFlight,
    removeCrewFromFlight,
} from "../../services/employeeService";

const statusFilterOptions = [
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
    { label: "Status", value: "status" },
];

export default function CrewAssignments() {
    const [flights, setFlights] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [crewCounts, setCrewCounts] = useState({});
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortBy, setSortBy] = useState("departTime");
    const [sortDirection, setSortDirection] = useState("asc");

    const [selectedFlight, setSelectedFlight] = useState(null);
    const [flightCrew, setFlightCrew] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
    const [crewModalLoading, setCrewModalLoading] = useState(false);

    const [page, setPage] = useState(0);

    useEffect(() => {
        loadPageData();
    }, []);

    const loadPageData = async () => {
        try {
            setLoading(true);
            setError("");

            const [flightsRes, employeesRes] = await Promise.all([
                getAllFlights(),
                getAllEmployees(),
            ]);

            const allFlights = flightsRes.data ?? [];
            const cabinCrewEmployees = (employeesRes ?? []).filter(
                (e) => e.department === "Cabin Crew" && e.status === "Active"
            );

            setFlights(allFlights);
            setEmployees(cabinCrewEmployees);

            const counts = {};
            await Promise.all(
                allFlights.map(async (flight) => {
                    try {
                        const crew = await getCrewForFlight(flight.flightNum);
                        counts[flight.flightNum] = crew.length;
                    } catch {
                        counts[flight.flightNum] = 0;
                    }
                })
            );

            setCrewCounts(counts);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load crew assignment data.");
        } finally {
            setLoading(false);
        }
    };

    const openCrewModal = async (flight) => {
        try {
            setError("");
            setSuccessMessage("");
            setSelectedFlight(flight);
            setSelectedEmployeeId("");
            setFlightCrew([]);
            setCrewModalLoading(true);
            setIsCrewModalOpen(true);

            const crew = await getCrewForFlight(flight.flightNum);
            setFlightCrew(crew);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load crew assignments.");
        } finally {
            setCrewModalLoading(false);
        }
    };

    const closeCrewModal = () => {
        setSelectedFlight(null);
        setSelectedEmployeeId("");
        setFlightCrew([]);
        setIsCrewModalOpen(false);
    };

    const handleAssignCrew = async () => {
        if (!selectedFlight || !selectedEmployeeId) return;

        try {
            setError("");
            setSuccessMessage("");

            await assignCrewToFlight({
                flightNum: selectedFlight.flightNum,
                employeeId: selectedEmployeeId,
            });

            const updatedCrew = await getCrewForFlight(selectedFlight.flightNum);
            setFlightCrew(updatedCrew);
            setCrewCounts((prev) => ({
                ...prev,
                [selectedFlight.flightNum]: updatedCrew.length,
            }));

            setSelectedEmployeeId("");
            setSuccessMessage("Crew member assigned successfully.");
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to assign crew member.");
        }
    };

    const handleRemoveCrew = async (employeeId) => {
        if (!selectedFlight) return;

        try {
            setError("");
            setSuccessMessage("");

            await removeCrewFromFlight(selectedFlight.flightNum, employeeId);

            const updatedCrew = await getCrewForFlight(selectedFlight.flightNum);
            setFlightCrew(updatedCrew);
            setCrewCounts((prev) => ({
                ...prev,
                [selectedFlight.flightNum]: updatedCrew.length,
            }));

            setSuccessMessage("Crew member removed from flight.");
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to remove crew member.");
        }
    };

    const filteredFlights = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let result = [...flights];

        if (term) {
            result = result.filter((f) =>
                String(f.flightNum).toLowerCase().includes(term) ||
                (f.aircraftUsed || "").toLowerCase().includes(term) ||
                (f.status || "").toLowerCase().includes(term) ||
                (f.departingPortCode || f.departingPort || "").toLowerCase().includes(term) ||
                (f.arrivingPortCode || f.arrivingPort || "").toLowerCase().includes(term)
            );
        }

        if (statusFilter) {
            result = result.filter((f) => f.status === statusFilter);
        }

        result.sort((a, b) => {
            if (sortBy === "departTime") {
                const now = Date.now();
                const aTime = new Date(a.departTime).getTime();
                const bTime = new Date(b.departTime).getTime();

                const aIsPast = aTime < now;
                const bIsPast = bTime < now;

                // Future/current flights come before past flights
                if (aIsPast !== bIsPast) {
                    return aIsPast ? 1 : -1;
                }

                // Future flights sorted ascending by departure
                if (!aIsPast && !bIsPast) {
                    return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
                }

                // Past flights sorted descending by departure so the most recent past one is first
                return sortDirection === "asc" ? bTime - aTime : aTime - bTime;
            }

            let aVal = a[sortBy];
            let bVal = b[sortBy];

            if (sortBy === "arrivalTime") {
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

    useEffect(() => {
        setPage(0);
    }, [searchTerm, statusFilter, sortBy, sortDirection]);

    const PAGE_SIZE = 50;
    const totalPages = Math.ceil(filteredFlights.length / PAGE_SIZE);
    const pagedFlights = filteredFlights.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const availableCrew = employees.filter(
        (emp) => !flightCrew.some((crew) => crew.employeeId === emp.employeeId)
    );

    const formatDisplayDateTime = (value) => {
        if (!value) return "";
        const d = new Date(value);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">Crew Assignments</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Assign Cabin Crew employees to flights.
                </p>
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {successMessage && <p className="mb-4 text-sm text-green-600">{successMessage}</p>}

            <Card className="p-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <TextInput
                        label="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Flight #, airport, status..."
                    />
                    <Dropdown
                        label="Status"
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                        options={statusFilterOptions}
                    />
                    <Dropdown
                        label="Sort By"
                        value={sortBy}
                        onChange={(val) => setSortBy(val)}
                        options={sortOptions}
                    />
                    <Dropdown
                        label="Direction"
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
                                <th className="px-3 py-2">Crew</th>
                                <th className="px-3 py-2">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pagedFlights.map((flight) => (
                                <tr key={flight.flightNum} className="rounded-xl bg-gray-50 text-sm">
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
                                        {flight.departingPortCode ?? flight.departingPort} →{" "}
                                        {flight.arrivingPortCode ?? flight.arrivingPort}
                                    </td>
                                    <td className="px-3 py-3">{flight.status}</td>
                                    <td className="px-3 py-3">
                                        {crewCounts[flight.flightNum] ?? 0}
                                    </td>
                                    <td className="px-3 py-3">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openCrewModal(flight)}
                                        >
                                            Manage Crew
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <span>
                        Showing {filteredFlights.length === 0 ? 0 : page * PAGE_SIZE + 1}–
                        {Math.min((page + 1) * PAGE_SIZE, filteredFlights.length)} of {filteredFlights.length} flights
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            ← Prev
                        </Button>
                        <span className="px-2 py-1 text-gray-500">
                            Page {page + 1} of {Math.max(totalPages, 1)}
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || totalPages === 0}
                        >
                            Next →
                        </Button>
                    </div>
                </div>
            </Card>

            <Modal
                isOpen={isCrewModalOpen}
                onClose={closeCrewModal}
                title={
                    selectedFlight
                        ? `Manage Crew — Flight ${selectedFlight.flightNum}`
                        : "Manage Crew"
                }
                className="!max-w-2xl"
                contentClassName="!max-h-[78vh]"
            >
                {!selectedFlight || crewModalLoading ? (
                    <p className="text-sm text-gray-500">Loading crew...</p>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-700">
                            <p>
                                <span className="font-medium">Route:</span>{" "}
                                {selectedFlight.departingPortCode ?? selectedFlight.departingPort} →{" "}
                                {selectedFlight.arrivingPortCode ?? selectedFlight.arrivingPort}
                            </p>
                            <p>
                                <span className="font-medium">Departure:</span>{" "}
                                {formatDisplayDateTime(selectedFlight.departTime)}
                            </p>
                            <p>
                                <span className="font-medium">Arrival:</span>{" "}
                                {formatDisplayDateTime(selectedFlight.arrivalTime)}
                            </p>
                            <p>
                                <span className="font-medium">Status:</span> {selectedFlight.status}
                            </p>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-medium text-gray-700">Assign Cabin Crew</p>
                            <div className="flex gap-3">
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                >
                                    <option value="">Select a crew member...</option>
                                    {availableCrew.map((emp) => (
                                        <option key={emp.employeeId} value={emp.employeeId}>
                                            {emp.firstName} {emp.lastName} ({emp.employeeId})
                                        </option>
                                    ))}
                                </select>
                                <Button onClick={handleAssignCrew} disabled={!selectedEmployeeId}>
                                    Assign
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <p className="mb-2 text-sm font-medium text-gray-700">Assigned Crew</p>
                            {flightCrew.length === 0 ? (
                                <p className="text-sm text-gray-500">No crew assigned yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {flightCrew.map((crew) => (
                                        <div
                                            key={`${crew.flightNum}-${crew.employeeId}`}
                                            className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {crew.firstName} {crew.lastName}
                                                </p>
                                                <p className="text-gray-500">
                                                    {crew.employeeId}
                                                    {crew.jobTitle ? ` • ${crew.jobTitle}` : ""}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50"
                                                onClick={() => handleRemoveCrew(crew.employeeId)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
