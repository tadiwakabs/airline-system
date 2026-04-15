import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Separator from "../../components/common/Separator";
import Dropdown from "../../components/common/Dropdown";
import {
    getMyUpcomingFlights,
    getPassengersForMyFlight,
} from "../../services/employeeService";
import { getSeatsForFlight } from "../../services/passengerService";

// ── Helpers copied/adapted from PassengerList.jsx ─────────────────────────────

function groupSeatsForRender(seats) {
    const rows = new Map();
    for (const seat of seats) {
        const match = String(seat.seatNumber).match(/^(\d+)([A-Z])$/i);
        if (!match) continue;
        const rowNumber = Number(match[1]);
        const letter = match[2].toUpperCase();
        if (!rows.has(rowNumber)) rows.set(rowNumber, []);
        rows.get(rowNumber).push({ ...seat, letter });
    }
    return [...rows.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([rowNumber, rowSeats]) => ({
            rowNumber,
            seats: rowSeats.sort((a, b) => a.letter.localeCompare(b.letter)),
        }));
}

function getCabinSection(rowNumber) {
    if (rowNumber >= 1 && rowNumber <= 4) return "First Class";
    if (rowNumber >= 5 && rowNumber <= 10) return "Business Class";
    return "Economy Class";
}

function shouldShowSectionDivider(currentRow, previousRow) {
    if (previousRow == null) return true;
    return getCabinSection(currentRow) !== getCabinSection(previousRow);
}

function seatColor(seat, passengersBySeat, highlightedSeat) {
    const isHighlighted = highlightedSeat === seat.seatNumber;
    if (isHighlighted) return "bg-blue-500 text-white border-blue-500 ring-2 ring-blue-300";
    if (seat.seatStatus === "Occupied" || seat.seatStatus === "Reserved") {
        const p = passengersBySeat[seat.seatNumber];
        if (p) return "bg-red-100 text-red-700 border-red-200";
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
    return "bg-green-50 text-green-700 border-green-200";
}

function cabinBadgeClass(cls) {
    switch ((cls || "").toLowerCase()) {
        case "first": return "bg-purple-100 text-purple-700";
        case "business": return "bg-blue-100 text-blue-700";
        default: return "bg-gray-100 text-gray-600";
    }
}

function ReadOnlySeatMap({ seats, passengersBySeat, highlightedSeat, onHoverSeat }) {
    const rows = useMemo(() => groupSeatsForRender(seats), [seats]);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 overflow-y-auto max-h-[70vh]">
            <div className="mx-auto mb-4 w-40 rounded-t-full border border-gray-200 bg-gray-50 py-2 text-center text-xs font-medium text-gray-500">
                Front of aircraft
            </div>

            <div className="space-y-1.5">
                {rows.map((row, index) => {
                    const previousRowNumber = index > 0 ? rows[index - 1].rowNumber : null;
                    const showDivider = shouldShowSectionDivider(row.rowNumber, previousRowNumber);

                    const left = row.seats.filter((s) => ["A", "B", "C"].includes(s.letter));
                    const right = row.seats.filter((s) => ["D", "E", "F"].includes(s.letter));
                    const compact = !row.seats.some((s) => ["E", "F"].includes(s.letter));

                    return (
                        <div key={row.rowNumber} className="space-y-1.5">
                            {showDivider && (
                                <div className="flex items-center gap-3 py-2">
                                    <div className="h-px flex-1 bg-gray-200" />
                                    <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                        {getCabinSection(row.rowNumber)}
                                    </div>
                                    <div className="h-px flex-1 bg-gray-200" />
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-3">
                                <div className="w-7 text-right text-xs font-medium text-gray-400">
                                    {row.rowNumber}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {(compact ? row.seats.slice(0, 2) : left).map((seat) => (
                                        <div
                                            key={seat.seatNumber}
                                            onMouseEnter={() => onHoverSeat(seat.seatNumber)}
                                            onMouseLeave={() => onHoverSeat(null)}
                                            className={`w-10 h-10 rounded-lg border text-xs font-semibold flex items-center justify-center cursor-default transition-colors ${seatColor(seat, passengersBySeat, highlightedSeat)}`}
                                        >
                                            {seat.letter}
                                        </div>
                                    ))}
                                </div>

                                <div className="w-8 text-center text-[10px] uppercase tracking-wide text-gray-300">
                                    aisle
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {(compact ? row.seats.slice(2) : right).map((seat) => (
                                        <div
                                            key={seat.seatNumber}
                                            onMouseEnter={() => onHoverSeat(seat.seatNumber)}
                                            onMouseLeave={() => onHoverSeat(null)}
                                            className={`w-10 h-10 rounded-lg border text-xs font-semibold flex items-center justify-center cursor-default transition-colors ${seatColor(seat, passengersBySeat, highlightedSeat)}`}
                                        >
                                            {seat.letter}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const flightSortOptions = [
    { label: "Departure Time", value: "departTime" },
    { label: "Arrival Time", value: "arrivalTime" },
    { label: "Flight Number", value: "flightNum" },
];

const passengerSortOptions = [
    { label: "Seat number", value: "seat" },
    { label: "Last name", value: "lastName" },
    { label: "First name", value: "firstName" },
    { label: "Cabin class", value: "class" },
];

export default function MyFlights() {
    const [flights, setFlights] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [passengers, setPassengers] = useState([]);
    const [seats, setSeats] = useState([]);

    const [loadingFlights, setLoadingFlights] = useState(true);
    const [loadingFlightDetails, setLoadingFlightDetails] = useState(false);
    const [error, setError] = useState("");

    const [flightSearchTerm, setFlightSearchTerm] = useState("");
    const [flightSortBy, setFlightSortBy] = useState("departTime");

    const [passengerSearchTerm, setPassengerSearchTerm] = useState("");
    const [passengerSortBy, setPassengerSortBy] = useState("seat");
    const [highlightedSeat, setHighlightedSeat] = useState(null);

    useEffect(() => {
        loadFlights();
    }, []);

    const loadFlights = async () => {
        try {
            setLoadingFlights(true);
            setError("");
            const data = await getMyUpcomingFlights();
            setFlights(data);

            if (data.length > 0) {
                await handleSelectFlight(data[0]);
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load your assigned flights.");
        } finally {
            setLoadingFlights(false);
        }
    };

    const handleSelectFlight = async (flight) => {
        try {
            setSelectedFlight(flight);
            setPassengers([]);
            setSeats([]);
            setHighlightedSeat(null);
            setLoadingFlightDetails(true);
            setError("");

            const [passengerData, seatData] = await Promise.all([
                getPassengersForMyFlight(flight.flightNum),
                getSeatsForFlight(flight.flightNum),
            ]);

            setPassengers(passengerData);
            setSeats(seatData);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load flight details.");
        } finally {
            setLoadingFlightDetails(false);
        }
    };

    const filteredFlights = useMemo(() => {
        const term = flightSearchTerm.trim().toLowerCase();
        let result = [...flights];

        if (term) {
            result = result.filter((f) =>
                String(f.flightNum).toLowerCase().includes(term) ||
                (f.departingPort || "").toLowerCase().includes(term) ||
                (f.arrivingPort || "").toLowerCase().includes(term) ||
                (f.status || "").toLowerCase().includes(term) ||
                (f.aircraftUsed || "").toLowerCase().includes(term)
            );
        }

        result.sort((a, b) => {
            if (flightSortBy === "departTime" || flightSortBy === "arrivalTime") {
                return new Date(a[flightSortBy]) - new Date(b[flightSortBy]);
            }
            return String(a[flightSortBy]).localeCompare(String(b[flightSortBy]));
        });

        return result;
    }, [flights, flightSearchTerm, flightSortBy]);

    const passengersBySeat = useMemo(() => {
        const map = {};
        for (const p of passengers) {
            if (p.seatNumber) map[p.seatNumber] = p;
        }
        return map;
    }, [passengers]);

    const filteredPassengers = useMemo(() => {
        const term = passengerSearchTerm.trim().toLowerCase();
        let result = [...passengers];

        if (term) {
            result = result.filter((p) =>
                (p.firstName || "").toLowerCase().includes(term) ||
                (p.lastName || "").toLowerCase().includes(term) ||
                (p.seatNumber || "").toLowerCase().includes(term) ||
                (p.ticketClass || "").toLowerCase().includes(term)
            );
        }

        result.sort((a, b) => {
            switch (passengerSortBy) {
                case "lastName":
                    return (a.lastName || "").localeCompare(b.lastName || "");
                case "firstName":
                    return (a.firstName || "").localeCompare(b.firstName || "");
                case "class": {
                    const order = { First: 0, Business: 1, Economy: 2 };
                    return (order[a.ticketClass] ?? 3) - (order[b.ticketClass] ?? 3);
                }
                default: {
                    const parseSeat = (s) => {
                        const m = String(s || "").match(/^(\d+)([A-Z]?)$/i);
                        return m ? [parseInt(m[1], 10), m[2].toUpperCase()] : [9999, ""];
                    };
                    const [aRow, aLet] = parseSeat(a.seatNumber);
                    const [bRow, bLet] = parseSeat(b.seatNumber);
                    return aRow !== bRow ? aRow - bRow : aLet.localeCompare(bLet);
                }
            }
        });

        return result;
    }, [passengers, passengerSearchTerm, passengerSortBy]);

    const stats = useMemo(() => {
        const total = seats.length;
        const occupied = seats.filter((s) => s.seatStatus === "Occupied").length;
        const reserved = seats.filter((s) => s.seatStatus === "Reserved").length;
        const available = seats.filter((s) => s.seatStatus === "Available").length;
        return { total, occupied, reserved, available };
    }, [seats]);

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
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">My Flights</h1>
                <p className="mt-1 text-sm text-gray-500">
                    View your upcoming assigned flights and passenger manifests.
                </p>
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
                <Card className="p-5">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                        <p className="text-sm font-semibold text-gray-800">
                            Assigned flights
                        </p>
                    </div>

                    <div className="space-y-3 mb-4">
                        <TextInput
                            label="Search flights"
                            value={flightSearchTerm}
                            onChange={(e) => setFlightSearchTerm(e.target.value)}
                            placeholder="Flight #, route, status..."
                        />
                        <Dropdown
                            label="Sort By"
                            value={flightSortBy}
                            onChange={(val) => setFlightSortBy(val)}
                            options={flightSortOptions}
                        />
                    </div>

                    <Separator className="mb-4" />

                    {loadingFlights ? (
                        <p className="text-sm text-gray-500">Loading flights...</p>
                    ) : filteredFlights.length === 0 ? (
                        <p className="text-sm text-gray-500">No upcoming flights assigned to you.</p>
                    ) : (
                        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                            {filteredFlights.map((flight) => {
                                const active = selectedFlight?.flightNum === flight.flightNum;
                                return (
                                    <button
                                        key={flight.flightNum}
                                        onClick={() => handleSelectFlight(flight)}
                                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                                            active
                                                ? "border-blue-300 bg-blue-50"
                                                : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-medium text-gray-900">
                                                Flight {flight.flightNum}
                                            </p>
                                            <span className="text-xs text-gray-500">{flight.status}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-700">
                                            {flight.departingPort} → {flight.arrivingPort}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {formatDisplayDateTime(flight.departTime)}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <div className="space-y-6">
                    {selectedFlight && (
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: "Total seats", value: stats.total, color: "text-gray-900" },
                                { label: "Booked", value: stats.occupied, color: "text-red-600" },
                                { label: "Reserved", value: stats.reserved, color: "text-amber-600" },
                                { label: "Available", value: stats.available, color: "text-green-600" },
                            ].map((s) => (
                                <div key={s.label} className="rounded-lg bg-gray-50 p-4 text-center">
                                    <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                                    <p className="mt-0.5 text-sm text-gray-500">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedFlight ? (
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
                            <Card className="p-5">
                                <div className="mb-4">
                                    <p className="text-lg font-semibold text-gray-900">
                                        Flight {selectedFlight.flightNum}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {selectedFlight.departingPort} → {selectedFlight.arrivingPort} • {formatDisplayDateTime(selectedFlight.departTime)}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {filteredPassengers.length} passenger{filteredPassengers.length !== 1 ? "s" : ""}
                                    </p>
                                    <div className="flex gap-3 flex-wrap">
                                        <div className="w-48">
                                            <TextInput
                                                placeholder="Search name, seat, class..."
                                                value={passengerSearchTerm}
                                                onChange={(e) => setPassengerSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="w-40">
                                            <Dropdown
                                                label=""
                                                value={passengerSortBy}
                                                onChange={(val) => setPassengerSortBy(val)}
                                                options={passengerSortOptions}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator className="mb-4" />

                                {loadingFlightDetails ? (
                                    <p className="text-sm text-gray-500">Loading passenger list...</p>
                                ) : filteredPassengers.length === 0 ? (
                                    <p className="text-sm text-gray-500">No booked passengers found.</p>
                                ) : (
                                    <div className="overflow-y-auto max-h-[62vh] space-y-2 pr-1">
                                        {filteredPassengers.map((p) => {
                                            const isHighlighted = highlightedSeat === p.seatNumber;
                                            return (
                                                <div
                                                    key={`${p.passengerId}-${p.seatNumber}`}
                                                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors cursor-default ${
                                                        isHighlighted
                                                            ? "border-blue-300 bg-blue-50"
                                                            : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                                    }`}
                                                    onMouseEnter={() => setHighlightedSeat(p.seatNumber)}
                                                    onMouseLeave={() => setHighlightedSeat(null)}
                                                >
                                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-800">
                                                        {p.seatNumber || "—"}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {p.firstName} {p.lastName}
                                                        </p>
                                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                                            {p.ticketClass && (
                                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cabinBadgeClass(p.ticketClass)}`}>
                                                                    {p.ticketClass}
                                                                </span>
                                                            )}
                                                            {p.ticketStatus && (
                                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                                                                    {p.ticketStatus}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>

                            <div className="sticky top-6">
                                <p className="mb-2 text-sm font-semibold text-gray-700 px-1">
                                    Seat map — Flight {selectedFlight.flightNum}
                                </p>
                                {loadingFlightDetails ? (
                                    <Card className="p-4">
                                        <p className="text-sm text-gray-500">Loading seat map...</p>
                                    </Card>
                                ) : seats.length === 0 ? (
                                    <Card className="p-4">
                                        <p className="text-sm text-gray-500">No seat data available.</p>
                                    </Card>
                                ) : (
                                    <ReadOnlySeatMap
                                        seats={seats}
                                        passengersBySeat={passengersBySeat}
                                        highlightedSeat={highlightedSeat}
                                        onHoverSeat={setHighlightedSeat}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <Card className="p-6">
                            <p className="text-sm text-gray-500">
                                Select a flight to view passengers and seating.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
