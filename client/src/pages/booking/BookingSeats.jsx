import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import {
    getSeatsForFlight,
    reserveSeat,
    releaseSeat,
} from "../../services/seatingService";

function capitalize(value) {
    if (!value) return "";
    if (value.toLowerCase() === "first") return "First Class";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildPassengerLabel(type, indexWithinType) {
    return `${type} ${indexWithinType + 1}`;
}

function normalizeCabinClass(cabinClass) {
    const lower = String(cabinClass || "").toLowerCase();

    if (lower === "business") return "Buisness"; // matches backend enum typo for now
    if (lower === "first") return "First";
    return "Economy";
}

function seatClassMatches(seatClass, cabinClass) {
    return String(seatClass || "").toLowerCase() === String(cabinClass || "").toLowerCase();
}

function getSeatVisualState(seat, allowedClass, selectedPassengerId, selectedSeatNumber) {
    const seatClass = seat.seatclass;
    const status = seat.seatStatus;

    if (!seatClassMatches(seatClass, allowedClass)) return "wrong-class";
    if (status === "Occupied") return "occupied";
    if (status === "Reserved" && seat.passengerId !== selectedPassengerId) return "reserved";
    if (seat.seatNumber === selectedSeatNumber) return "selected";
    return "available";
}

function seatButtonClass(state) {
    const base =
        "w-11 h-11 rounded-lg border text-sm font-semibold transition-colors";

    switch (state) {
        case "selected":
            return `${base} bg-blue-600 text-white border-blue-600`;
        case "occupied":
            return `${base} bg-red-100 text-red-600 border-red-200 cursor-not-allowed`;
        case "reserved":
            return `${base} bg-amber-100 text-amber-700 border-amber-200 cursor-not-allowed`;
        case "wrong-class":
            return `${base} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`;
        default:
            return `${base} bg-green-50 text-green-700 border-green-200 hover:bg-green-100`;
    }
}

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

function PlaneLegend() {
    return (
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-green-50 border border-green-200 inline-block" />
                Available
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-blue-600 inline-block" />
                Selected
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-red-100 border border-red-200 inline-block" />
                Occupied
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-amber-100 border border-amber-200 inline-block" />
                Reserved
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-gray-100 border border-gray-200 inline-block" />
                Unavailable
            </div>
        </div>
    );
}

function SeatMap({
                     seats,
                     allowedClass,
                     selectedPassengerId,
                     selectedSeatNumber,
                     onSelectSeat,
                 }) {
    const rows = useMemo(() => groupSeatsForRender(seats), [seats]);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mx-auto mb-6 w-40 rounded-t-full border border-gray-200 bg-gray-50 py-2 text-center text-xs font-medium text-gray-500">
                Front of aircraft
            </div>

            <div className="space-y-2">
                {rows.map((row) => {
                    const seatLetters = row.seats.map((s) => s.letter);
                    const left = row.seats.filter((s) => ["A", "B", "C"].includes(s.letter));
                    const right = row.seats.filter((s) => ["D", "E", "F"].includes(s.letter));
                    const compact = !seatLetters.includes("E") && !seatLetters.includes("F");

                    return (
                        <div key={row.rowNumber} className="flex items-center justify-center gap-3">
                            <div className="w-8 text-right text-xs font-medium text-gray-400">
                                {row.rowNumber}
                            </div>

                            <div className="flex items-center gap-2">
                                {(compact ? row.seats.slice(0, 2) : left).map((seat) => {
                                    const state = getSeatVisualState(
                                        seat,
                                        allowedClass,
                                        selectedPassengerId,
                                        selectedSeatNumber
                                    );

                                    return (
                                        <button
                                            key={seat.seatNumber}
                                            type="button"
                                            className={seatButtonClass(state)}
                                            disabled={state !== "available" && state !== "selected"}
                                            onClick={() => onSelectSeat(seat)}
                                        >
                                            {seat.letter}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="w-8 text-center text-[10px] uppercase tracking-wide text-gray-300">
                                aisle
                            </div>

                            <div className="flex items-center gap-2">
                                {(compact ? row.seats.slice(2) : right).map((seat) => {
                                    const state = getSeatVisualState(
                                        seat,
                                        allowedClass,
                                        selectedPassengerId,
                                        selectedSeatNumber
                                    );

                                    return (
                                        <button
                                            key={seat.seatNumber}
                                            type="button"
                                            className={seatButtonClass(state)}
                                            disabled={state !== "available" && state !== "selected"}
                                            onClick={() => onSelectSeat(seat)}
                                        >
                                            {seat.letter}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function BookingSeats() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const selectedItinerary = state?.selectedItinerary;
    const searchParams = state?.searchParams;
    const passengers = state?.passengers ?? [];
    const pricingSummary = state?.pricingSummary ?? null;

    const flights = selectedItinerary?.flights ?? [];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [flightIndex, setFlightIndex] = useState(0);
    const [activePassengerIndex, setActivePassengerIndex] = useState(0);
    const [seatsByFlight, setSeatsByFlight] = useState({});
    const [seatSelections, setSeatSelections] = useState({});

    useEffect(() => {
        if (!selectedItinerary || !searchParams || !passengers.length) {
            navigate("/flight-search");
        }
    }, [selectedItinerary, searchParams, passengers, navigate]);

    const passengersWithIndex = useMemo(() => {
        const counters = {};
        return passengers.map((p) => {
            const type = p.passengerType;
            counters[type] = counters[type] ?? 0;
            const indexWithinType = counters[type];
            counters[type] += 1;
            return { ...p, indexWithinType };
        });
    }, [passengers]);

    const cabinClass = useMemo(
        () => normalizeCabinClass(searchParams?.cabinClass),
        [searchParams?.cabinClass]
    );

    useEffect(() => {
        if (!flights.length) return;

        const loadSeats = async () => {
            try {
                setLoading(true);
                setError("");

                const responses = await Promise.all(
                    flights.map((flight) => getSeatsForFlight(flight.flightNum))
                );

                const next = {};
                flights.forEach((flight, i) => {
                    next[flight.flightNum] = responses[i].data ?? [];
                });

                setSeatsByFlight(next);
            } catch (err) {
                console.error("Error loading seats:", err);
                setError("Could not load seats for this itinerary.");
            } finally {
                setLoading(false);
            }
        };

        loadSeats();
    }, [flights]);

    const currentFlight = flights[flightIndex];
    const currentPassenger = passengersWithIndex[activePassengerIndex];
    const currentSeats = currentFlight ? seatsByFlight[currentFlight.flightNum] ?? [] : [];

    const selectedSeatNumber =
        seatSelections?.[currentFlight?.flightNum]?.[currentPassenger?.passengerId] ?? null;

    const handleSelectSeat = async (seat) => {
        if (!currentFlight || !currentPassenger?.passengerId) return;

        try {
            setSaving(true);
            setError("");

            const existingSeatNumber =
                seatSelections?.[currentFlight.flightNum]?.[currentPassenger.passengerId];

            if (existingSeatNumber && existingSeatNumber !== seat.seatNumber) {
                await releaseSeat({
                    flightNum: currentFlight.flightNum,
                    seatNumber: existingSeatNumber,
                    passengerId: currentPassenger.passengerId,
                });
            }

            await reserveSeat({
                flightNum: currentFlight.flightNum,
                seatNumber: seat.seatNumber,
                passengerId: currentPassenger.passengerId,
                cabinClass,
            });

            const refreshed = await getSeatsForFlight(currentFlight.flightNum);

            setSeatsByFlight((prev) => ({
                ...prev,
                [currentFlight.flightNum]: refreshed.data ?? [],
            }));

            setSeatSelections((prev) => ({
                ...prev,
                [currentFlight.flightNum]: {
                    ...(prev[currentFlight.flightNum] ?? {}),
                    [currentPassenger.passengerId]: seat.seatNumber,
                },
            }));
        } catch (err) {
            console.error("Error reserving seat:", err.response?.data || err.message);
            setError(
                err.response?.data?.message ||
                (typeof err.response?.data === "string" ? err.response.data : "") ||
                "Could not reserve that seat."
            );
        } finally {
            setSaving(false);
        }
    };

    const allSelectionsComplete = useMemo(() => {
        if (!flights.length || !passengersWithIndex.length) return false;

        return flights.every((flight) =>
            passengersWithIndex.every(
                (passenger) => !!seatSelections?.[flight.flightNum]?.[passenger.passengerId]
            )
        );
    }, [flights, passengersWithIndex, seatSelections]);

    const handleBack = () => {
        navigate("/booking/review", {
            state: {
                selectedItinerary,
                searchParams,
                passengers,
                pricingSummary,
            },
        });
    };

    const handleContinue = () => {
        if (!allSelectionsComplete) {
            setError("Please choose a seat for every passenger on every flight segment.");
            return;
        }

        navigate("/booking/payment", {
            state: {
                selectedItinerary,
                searchParams,
                passengers,
                pricingSummary,
                seatSelections,
            },
        });
    };

    if (!selectedItinerary || !searchParams || !currentFlight || !currentPassenger) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-2xl font-semibold text-gray-900">Choose Seats</h1>

                <Card className="p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm text-gray-500">Cabin</p>
                            <p className="font-medium text-gray-900">{capitalize(searchParams.cabinClass)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Current flight</p>
                            <p className="font-medium text-gray-900">
                                {currentFlight.departingPortCode || currentFlight.departingPort} →{" "}
                                {currentFlight.arrivingPortCode || currentFlight.arrivingPort}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Current passenger</p>
                            <p className="font-medium text-gray-900">
                                {buildPassengerLabel(
                                    currentPassenger.passengerType,
                                    currentPassenger.indexWithinType
                                )}{" "}
                                — {currentPassenger.firstName} {currentPassenger.lastName}
                            </p>
                        </div>
                    </div>

                    <PlaneLegend />
                </Card>

                {error && (
                    <Card className="p-4 border-red-200">
                        <p className="text-red-600 text-sm">{error}</p>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
                    <Card className="p-4 space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">Flight segments</p>
                            <div className="space-y-2">
                                {flights.map((flight, index) => (
                                    <button
                                        key={flight.flightNum}
                                        type="button"
                                        onClick={() => setFlightIndex(index)}
                                        className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                                            index === flightIndex
                                                ? "border-blue-300 bg-blue-50"
                                                : "border-gray-200 bg-white hover:bg-gray-50"
                                        }`}
                                    >
                                        <p className="text-sm font-medium text-gray-900">
                                            Flight {flight.flightNum}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(flight.departingPortCode || flight.departingPort)} →{" "}
                                            {(flight.arrivingPortCode || flight.arrivingPort)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">Passengers</p>
                            <div className="space-y-2">
                                {passengersWithIndex.map((passenger, index) => {
                                    const assigned =
                                        seatSelections?.[currentFlight.flightNum]?.[passenger.passengerId];

                                    return (
                                        <button
                                            key={passenger.passengerId || index}
                                            type="button"
                                            onClick={() => setActivePassengerIndex(index)}
                                            className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                                                index === activePassengerIndex
                                                    ? "border-blue-300 bg-blue-50"
                                                    : "border-gray-200 bg-white hover:bg-gray-50"
                                            }`}
                                        >
                                            <p className="text-sm font-medium text-gray-900">
                                                {buildPassengerLabel(
                                                    passenger.passengerType,
                                                    passenger.indexWithinType
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {passenger.firstName} {passenger.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Seat: {assigned || "Not selected"}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 space-y-4">
                        {loading ? (
                            <p className="text-sm text-gray-500">Loading seats...</p>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Class</p>
                                        <p className="font-medium text-gray-900">{capitalize(searchParams.cabinClass)}</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Selected seat</p>
                                        <p className="font-medium text-gray-900">
                                            {selectedSeatNumber || "None"}
                                        </p>
                                    </div>
                                </div>

                                <SeatMap
                                    seats={currentSeats}
                                    allowedClass={cabinClass}
                                    selectedPassengerId={currentPassenger.passengerId}
                                    selectedSeatNumber={selectedSeatNumber}
                                    onSelectSeat={handleSelectSeat}
                                />
                            </>
                        )}
                    </Card>
                </div>

                <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={handleBack}>
                        Back
                    </Button>

                    <Button onClick={handleContinue} disabled={saving || loading}>
                        Continue to Payment
                    </Button>
                </div>
            </div>
        </div>
    );
}
