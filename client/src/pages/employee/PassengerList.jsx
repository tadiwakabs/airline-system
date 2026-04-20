import { useMemo, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Separator from "../../components/common/Separator";
import Dropdown from "../../components/common/Dropdown";
import {
    getPassengersForFlight,
    getSeatsForFlight,
} from "../../services/passengerService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    if (isHighlighted)
        return "bg-blue-500 text-white border-blue-500 ring-2 ring-blue-300";
    if (seat.seatStatus === "Occupied" || seat.seatStatus === "Reserved") {
        const p = passengersBySeat[seat.seatNumber];
        if (p) return "bg-red-100 text-red-700 border-red-200";
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
    return "bg-green-50 text-green-700 border-green-200";
}

function cabinBadgeClass(cls) {
    switch ((cls || "").toLowerCase()) {
        case "first":    return "bg-purple-100 text-purple-700";
        case "business": return "bg-blue-100 text-blue-700";
        default:         return "bg-gray-100 text-gray-600";
    }
}

function typeBadgeClass(type) {
    switch ((type || "").toLowerCase()) {
        case "child":  return "bg-amber-100 text-amber-700";
        case "infant": return "bg-pink-100 text-pink-700";
        default:       return "bg-green-100 text-green-700";
    }
}

// ── Seat map (read-only) ──────────────────────────────────────────────────────

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
                                    {(compact ? row.seats.slice(0, 2) : left).map((seat) => {
                                        const p = passengersBySeat[seat.seatNumber];
                                        return (
                                            <div
                                                key={seat.seatNumber}
                                                className="relative group"
                                                onMouseEnter={() => onHoverSeat(seat.seatNumber)}
                                                onMouseLeave={() => onHoverSeat(null)}
                                            >
                                                <div className={`w-10 h-10 rounded-lg border text-xs font-semibold flex items-center justify-center cursor-default transition-colors ${seatColor(seat, passengersBySeat, highlightedSeat)}`}>
                                                    {seat.letter}
                                                </div>
                                                {p && (
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 hidden group-hover:block w-44 rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-lg text-xs text-gray-700 pointer-events-none">
                                                        <p className="font-medium">{p.passenger.firstName} {p.passenger.lastName}</p>
                                                        <p className="text-gray-500">{seat.seatNumber} · {p.ticketClass ?? "—"}</p>
                                                        <p className="text-gray-500">{p.passenger.passengerType}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="w-8 text-center text-[10px] uppercase tracking-wide text-gray-300">
                                    aisle
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {(compact ? row.seats.slice(2) : right).map((seat) => {
                                        const p = passengersBySeat[seat.seatNumber];
                                        return (
                                            <div
                                                key={seat.seatNumber}
                                                className="relative group"
                                                onMouseEnter={() => onHoverSeat(seat.seatNumber)}
                                                onMouseLeave={() => onHoverSeat(null)}
                                            >
                                                <div className={`w-10 h-10 rounded-lg border text-xs font-semibold flex items-center justify-center cursor-default transition-colors ${seatColor(seat, passengersBySeat, highlightedSeat)}`}>
                                                    {seat.letter}
                                                </div>
                                                {p && (
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 hidden group-hover:block w-44 rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-lg text-xs text-gray-700 pointer-events-none">
                                                        <p className="font-medium">{p.passenger.firstName} {p.passenger.lastName}</p>
                                                        <p className="text-gray-500">{seat.seatNumber} · {p.ticketClass ?? "—"}</p>
                                                        <p className="text-gray-500">{p.passenger.passengerType}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-red-100 border border-red-200 inline-block" />
                    Booked
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-amber-100 border border-amber-200 inline-block" />
                    Reserved (unpaid)
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-green-50 border border-green-200 inline-block" />
                    Available
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-blue-500 inline-block" />
                    Highlighted
                </div>
            </div>
        </div>
    );
}

// ── Sort options ──────────────────────────────────────────────────────────────

const sortOptions = [
    { label: "Seat number", value: "seat" },
    { label: "Last name",   value: "lastName" },
    { label: "First name",  value: "firstName" },
    { label: "Cabin class", value: "class" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function PassengerList() {
    const [flightNumInput, setFlightNumInput] = useState("");
    const [loadedFlightNum, setLoadedFlightNum] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [tickets, setTickets] = useState([]);   // from /api/ticket/flight/:num
    const [seats, setSeats] = useState([]);        // from /api/seating/flight/:num

    const [sortBy, setSortBy] = useState("seat");
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedSeat, setHighlightedSeat] = useState(null);
    const {user}= useAuth();
    const navigate = useNavigate();

    // ── Load handler ─────────────────────────────────────────────────────────

    const handleLoad = async () => {
        const num = parseInt(flightNumInput.trim(), 10);
        if (!num || isNaN(num)) {
            setError("Please enter a valid flight number.");
            return;
        }

        setError("");
        setLoading(true);
        setTickets([]);
        setSeats([]);
        setLoadedFlightNum(null);
        setHighlightedSeat(null);

        try {
            const [ticketData, seatData] = await Promise.all([
                getPassengersForFlight(num),
                getSeatsForFlight(num),
            ]);
            setTickets(ticketData);
            setSeats(seatData);
            setLoadedFlightNum(num);
        } catch (err) {
            const msg = err?.response?.data?.message;
            setError(msg || "Failed to load flight data. Check the flight number and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLoad();
    };

    // ── Derived data ──────────────────────────────────────────────────────────

    // Map seatNumber → ticket (for seat map lookup)
    const passengersBySeat = useMemo(() => {
        const map = {};
        for (const t of tickets) {
            if (t.seatNumber) map[t.seatNumber] = t;
        }
        return map;
    }, [tickets]);

    // Stats
    const stats = useMemo(() => {
        const total     = seats.length;
        const occupied  = seats.filter((s) => s.seatStatus === "Occupied").length;
        const reserved  = seats.filter((s) => s.seatStatus === "Reserved").length;
        const available = seats.filter((s) => s.seatStatus === "Available").length;
        return { total, occupied, reserved, available };
    }, [seats]);
    
    const handleBack = () => {
        const role = user?.userRole;
        
        if (role == "Administrator"){
            navigate("/admin/dashboard");
        } else {
            navigate("/employee/dashboard")
        }   
    };


    // Filtered + sorted passenger list
    const filteredTickets = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let result = [...tickets];

        if (term) {
            result = result.filter((t) => {
                const p = t.passenger;
                if (!p) return false;
                return (
                    (p.firstName  || "").toLowerCase().includes(term) ||
                    (p.lastName   || "").toLowerCase().includes(term) ||
                    (t.seatNumber || "").toLowerCase().includes(term) ||
                    (t.ticketClass|| "").toLowerCase().includes(term) ||
                    (p.email      || "").toLowerCase().includes(term)
                );
            });
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case "lastName":
                    return (a.passenger?.lastName || "").localeCompare(b.passenger?.lastName || "");
                case "firstName":
                    return (a.passenger?.firstName || "").localeCompare(b.passenger?.firstName || "");
                case "class": {
                    const order = { First: 0, Business: 1, Economy: 2 };
                    return (order[a.ticketClass] ?? 3) - (order[b.ticketClass] ?? 3);
                }
                default: {
                    // seat: numeric row first, then letter
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
    }, [tickets, sortBy, searchTerm]);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl px-4 py-10">

            {/* Page header */}
            <div className="mb-4 flex justify-between items-start">
                <h1 className="text-2xl font-semibold text-gray-200">Passenger List</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Enter a flight number to view all booked passengers and seat assignments.
                </p>
                <Button 
                    onClick={handleBack} 
                    className="bg-blue-600 text-white hover:bg-blue-700 border-none px-6 py-2 rounded-none font-bold transition-colors"> 
                    Back 
                </Button>
            </div>

            {/* Flight number lookup */}
            <Card className="p-5 mb-6">
                <div className="flex gap-3 items-end">
                    <div className="w-56">
                        <TextInput
                            label="Flight number"
                            value={flightNumInput}
                            onChange={(e) => setFlightNumInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. 1042"
                            type="number"
                        />
                    </div>
                    <Button onClick={handleLoad} disabled={loading || !flightNumInput.trim()}>
                        {loading ? "Loading..." : "Load flight"}
                    </Button>
                </div>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </Card>

            {/* Results */}
            {loadedFlightNum !== null && !loading && (
                <>
                    {/* Stats bar */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { label: "Total seats",  value: stats.total,     color: "text-gray-900" },
                            { label: "Booked",        value: stats.occupied,  color: "text-red-600" },
                            { label: "Reserved",      value: stats.reserved,  color: "text-amber-600" },
                            { label: "Available",     value: stats.available, color: "text-green-600" },
                        ].map((s) => (
                            <div key={s.label} className="rounded-lg bg-gray-50 p-4 text-center">
                                <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                                <p className="mt-0.5 text-sm text-gray-500">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {tickets.length === 0 ? (
                        <Card className="p-6">
                            <p className="text-sm text-gray-500">No booked passengers found for flight {loadedFlightNum}.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">

                            {/* ── Left: passenger list ─────────────────────── */}
                            <Card className="p-5">
                                <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {filteredTickets.length} passenger{filteredTickets.length !== 1 ? "s" : ""}
                                        {searchTerm && " matching"}
                                    </p>
                                    <div className="flex gap-3 flex-wrap">
                                        <div className="w-48">
                                            <TextInput
                                                placeholder="Search name, seat, email…"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="w-40">
                                            <Dropdown
                                                label=""
                                                value={sortBy}
                                                onChange={(val) => setSortBy(val)}
                                                options={sortOptions}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator className="mb-4" />

                                <div className="overflow-y-auto max-h-[62vh] space-y-2 pr-1">
                                    {filteredTickets.length === 0 ? (
                                        <p className="text-sm text-gray-500">No passengers match your search.</p>
                                    ) : (
                                        filteredTickets.map((t) => {
                                            const p = t.passenger;
                                            const isHighlighted = highlightedSeat === t.seatNumber;
                                            return (
                                                <div
                                                    key={t.ticketCode}
                                                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors cursor-default ${
                                                        isHighlighted
                                                            ? "border-blue-300 bg-blue-50"
                                                            : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                                    }`}
                                                    onMouseEnter={() => setHighlightedSeat(t.seatNumber)}
                                                    onMouseLeave={() => setHighlightedSeat(null)}
                                                >
                                                    {/* Seat badge */}
                                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-800">
                                                        {t.seatNumber || "—"}
                                                    </div>

                                                    {/* Passenger info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {p ? `${p.firstName} ${p.lastName}` : "Unknown passenger"}
                                                        </p>
                                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                                            {t.ticketClass && (
                                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cabinBadgeClass(t.ticketClass)}`}>
                                                                    {t.ticketClass}
                                                                </span>
                                                            )}
                                                            {p?.passengerType && (
                                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass(p.passengerType)}`}>
                                                                    {p.passengerType}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Contact */}
                                                    <div className="text-right text-xs text-gray-500 flex-shrink-0 hidden sm:block">
                                                        {p?.email && <p className="truncate max-w-[160px]">{p.email}</p>}
                                                        {p?.phoneNumber && <p>{p.phoneNumber}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>

                            {/* ── Right: seat map ──────────────────────────── */}
                            <div className="sticky top-6">
                                <p className="mb-2 text-sm font-semibold text-gray-700 px-1">
                                    Seat map — Flight {loadedFlightNum}
                                </p>
                                {seats.length === 0 ? (
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
                    )}
                </>
            )}
        </div>
    );
}
