import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FlightCard from "../components/flight/FlightCard";
import FlightSearchPanel from "../components/home/FlightSearchPanel.jsx";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import { searchFlightResults } from "../services/flightService";
import { joinStandby } from "../services/standbyService";
import { useAuth } from "../contexts/AuthContext";

function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function buildPassengerSummary(passengers) {
    if (!passengers) return "";
    const parts = [];
    if (passengers.adults)
        parts.push(`${passengers.adults} Adult${passengers.adults > 1 ? "s" : ""}`);
    if (passengers.children)
        parts.push(`${passengers.children} Child${passengers.children > 1 ? "ren" : ""}`);
    if (passengers.infants)
        parts.push(`${passengers.infants} Infant${passengers.infants > 1 ? "s" : ""}`);
    return parts.join(", ");
}

function formatCabinClass(cabinClass) {
    if (!cabinClass) return "";
    if (cabinClass === "first") return "First Class";
    return cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1);
}

function parseLocalDateTime(value) {
    if (!value) return null;

    const raw = String(value).trim();
    const [datePart, timePart = ""] = raw.split("T");
    if (!datePart) return null;

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0] = timePart.split(":").map(Number);

    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day, hour, minute);
}

function formatLocalTime(value) {
    const d = parseLocalDateTime(value);
    if (!d) return "—";

    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function useFlightSearch(from, to, date, passengers, enabled) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!enabled || !from || !to || !date) {
            setResults([]);
            return;
        }

        let cancelled = false;

        const run = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await searchFlightResults({
                    from, to, date,
                    adults:   passengers?.adults   ?? 1,
                    children: passengers?.children ?? 0,
                    infants:  passengers?.infants  ?? 0,
                });

                if (cancelled) return;
                setResults(res.data.map((item) => ({
                    type: item.type,
                    flights: item.flights.map((f) => ({
                        flightNum:      f.flightNum,
                        departingPort:  f.departingPortCode,
                        arrivingPort:   f.arrivingPortCode,
                        departTime:     f.departTime,
                        arrivalTime:    f.arrivalTime,
                        departTimeUtc:  f.departTimeUtc,
                        arrivalTimeUtc: f.arrivalTimeUtc,
                        status:         f.status,
                        aircraftUsed:   f.aircraftUsed,
                        distance:       f.distance,
                        isDomestic:     f.isDomestic,
                        isFull: f.isFull,
                    })),
                    pricing: {
                        economy:  item.pricing?.economy  ?? 0,
                        business: item.pricing?.business ?? 0,
                        first:    item.pricing?.first    ?? 0,
                    },
                    quote: item.quote,
                })));
                setLoading(false);
            } catch (err) {
                if (!cancelled) {
                    const serverError = err.response?.data;
                    let message= "Could not load flight results.";
                    
                    if (typeof serverError==='string'){
                        message = serverError;
                    } else if (serverError?.errors){
                        message= Object.values(serverError.errors).flat().join(", ");
                    }
                    setError(message);
                    setLoading(false);
            
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [from, to, date, passengers, enabled]);

    return { results, loading, error };
}

export default function FlightSearch() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingSelection, setPendingSelection] = useState(null);

    const fallback = {
        flightType: "one-way",
        departure: "",
        arrival: "",
        dateDepart: "",
        dateReturn: "",
        passengers: { adults: 1, children: 0, infants: 0 },
        cabinClass: "economy",
    };

    const [searchParams, setSearchParams] = useState(state || fallback);
    const [showSearchForm, setShowSearchForm] = useState(!state);
    const [selectionStage, setSelectionStage] = useState("outbound");
    const [selectedOutbound, setSelectedOutbound] = useState(null);

    const [standbyMessage, setStandbyMessage] = useState("");
    const [standbyError, setStandbyError] = useState("");
    const [joiningFlight, setJoiningFlight] = useState(null);

    const isReturn = searchParams.flightType === "return";

    // Outbound search — always runs when form is submitted
    const outbound = useFlightSearch(
        searchParams.departure,
        searchParams.arrival,
        searchParams.dateDepart,
        searchParams.passengers,
        !showSearchForm
    );

    // Return search — only runs after user picks an outbound flight
    const returnSearch = useFlightSearch(
        searchParams.arrival,    // reversed
        searchParams.departure,
        searchParams.dateReturn,
        searchParams.passengers,
        isReturn && selectionStage === "return"
    );

    const handleSearch = (params) => {
        setSearchParams(params);
        setSelectedOutbound(null);
        setSelectionStage("outbound");
        setShowSearchForm(false);
        navigate("/flight-search", { state: params, replace: true });
    };

    const handleJoinStandby = async (flightNum) => {
        try {
            setStandbyMessage("");
            setStandbyError("");
            setJoiningFlight(flightNum);

            const res = await joinStandby(flightNum);
            setStandbyMessage(res.message || "Joined standby successfully.");
        } catch (err) {
            setStandbyError(
                err?.response?.data?.message || "Failed to join standby."
            );
        } finally {
            setJoiningFlight(null);
        }
    };

    const handleSelectOutbound = (itinerary) => {
        if (!isAuthenticated) {
            setPendingSelection({
                type: "outbound",
                itinerary
            });
            setShowAuthModal(true);
            return;
        }

        if (isReturn) {
            setSelectedOutbound(itinerary);
            setSelectionStage("return");
        } else {
            navigate("/booking/passengers", {
                state: { selectedItinerary: itinerary, searchParams },
            });
        }
    };

    const handleSelectReturn = (returnItinerary) => {
        if (!isAuthenticated) {
            setPendingSelection({
                type: "return",
                returnItinerary,
                selectedOutbound
            });
            setShowAuthModal(true);
            return;
        }

        navigate("/booking/passengers", {
            state: {
                selectedItinerary: selectedOutbound,
                returnItinerary,
                searchParams,
            },
        });
    };

    const handleBackToOutbound = () => {
        setSelectionStage("outbound");
        setSelectedOutbound(null);
    };

    const searchSummary = useMemo(
        () => ({
            route:
                searchParams.departure && searchParams.arrival
                    ? `${searchParams.departure} → ${searchParams.arrival}`
                    : "Select route",
            date:
                isReturn && searchParams.dateReturn
                    ? `${formatDate(searchParams.dateDepart)} - ${formatDate(
                          searchParams.dateReturn
                      )}`
                    : formatDate(searchParams.dateDepart),
            passengers: buildPassengerSummary(searchParams.passengers),
            cabinClass: formatCabinClass(searchParams.cabinClass),
            flightType: isReturn ? "Return" : "One-way",
        }),
        [searchParams, isReturn]
    );

    const activeResults = selectionStage === "return" ? returnSearch : outbound;
    const stageLabel =
        selectionStage === "return"
            ? `Select return flight — ${searchParams.arrival} → ${searchParams.departure} on ${formatDate(
                  searchParams.dateReturn
              )}`
            : `Select outbound flight — ${searchParams.departure} → ${searchParams.arrival} on ${formatDate(
                  searchParams.dateDepart
              )}`;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-2xl font-semibold">Flight Results</h1>

                {showSearchForm ? (
                    <FlightSearchPanel
                        onSearch={handleSearch}
                        initialValues={searchParams}
                    />
                ) : (
                    <Card className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
                                {[
                                    ["Route", searchSummary.route],
                                    ["Trip", searchSummary.flightType],
                                    ["Dates", searchSummary.date || "—"],
                                    ["Passengers", searchSummary.passengers || "—"],
                                    ["Cabin", searchSummary.cabinClass || "—"],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            {label}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-start lg:justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSearchForm(true)}
                                >
                                    Modify Search
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Stage indicator for return trips */}
                {!showSearchForm && isReturn && (
                    <div className="flex items-center gap-3">
                        {selectionStage === "return" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBackToOutbound}
                            >
                                ← Change outbound
                            </Button>
                        )}

                        <div className="flex gap-2 text-sm">
                            <span
                                className={`px-3 py-1 rounded-full font-medium ${
                                    selectionStage === "outbound"
                                        ? "bg-blue-600 text-white"
                                        : "bg-green-100 text-green-700"
                                }`}
                            >
                                {selectionStage === "outbound"
                                    ? "1. Choose outbound"
                                    : "✓ Outbound selected"}
                            </span>

                            <span
                                className={`px-3 py-1 rounded-full font-medium ${
                                    selectionStage === "return"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                2. Choose return
                            </span>
                        </div>
                    </div>
                )}

                {/* Selected outbound summary when picking return */}
                {selectionStage === "return" && selectedOutbound && (
                    <Card className="p-4 border-green-200 bg-green-50">
                        <p className="text-xs font-medium uppercase tracking-wide text-green-600 mb-1">
                            Outbound selected
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                            {selectedOutbound.flights[0].departingPort} →{" "}
                            {
                                selectedOutbound.flights[
                                    selectedOutbound.flights.length - 1
                                ].arrivingPort
                            }
                            {" · "}
                            {formatLocalTime(selectedOutbound.flights[0].departTime)}
                        </p>
                    </Card>
                )}

                {!showSearchForm && (
                    <p className="text-sm font-medium text-gray-600">
                        {stageLabel}
                    </p>
                )}

                {standbyMessage && (
                    <Card className="p-4 border-green-200">
                        <p className="text-green-600">{standbyMessage}</p>
                    </Card>
                )}

                {standbyError && (
                    <Card className="p-4 border-red-200">
                        <p className="text-red-600">{standbyError}</p>
                    </Card>
                )}

                {activeResults.loading && <Card className="p-6"><p>Loading flights...</p></Card>}
                {activeResults.error && (
                    <Card className="p-6 border-red-100 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-red-700 font-bold text-sm">
                                {activeResults.error}
                            </p>
                        </div>
                    </Card>
                )}
                 {!activeResults.loading && !activeResults.error && activeResults.results.length === 0 && !showSearchForm && (
                    <Card className="p-6"><p>No flights found.</p></Card>
                )}

                {!activeResults.loading &&
                    !activeResults.error &&
                    activeResults.results.length > 0 && (
                        <div className="space-y-4">
                            {activeResults.results.map((result, index) => (
                                <div key={index} className="space-y-3">
                                    <FlightCard
                                        {...result}
                                        cabinClass={searchParams.cabinClass}
                                        passengers={searchParams.passengers}
                                        onSelect={
                                            selectionStage === "return"
                                                ? handleSelectReturn
                                                : handleSelectOutbound
                                        }
                                    />

                                    {result.flights?.length > 0 &&
                                        result.flights.every(
                                            (flight) => flight.isFull
                                        ) && (
                                            <Card className="p-4">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            This flight is full
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Join standby to be
                                                            notified if a seat
                                                            opens.
                                                        </p>
                                                    </div>

                                                    <Button
                                                        onClick={() =>
                                                            handleJoinStandby(
                                                                result.flights[0]
                                                                    .flightNum
                                                            )
                                                        }
                                                        disabled={
                                                            joiningFlight ===
                                                            result.flights[0]
                                                                .flightNum
                                                        }
                                                    >
                                                        {joiningFlight ===
                                                        result.flights[0]
                                                            .flightNum
                                                            ? "Joining..."
                                                            : "Join Standby"}
                                                    </Button>
                                                </div>
                                            </Card>
                                        )}
                                </div>
                            ))}
                        </div>
                    )}


                {/* Authentication check */}
                {showAuthModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
                            <h2 className="text-lg font-semibold">
                                To continue booking, you must be signed in.
                            </h2>

                            <div className="flex gap-3 justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAuthModal(false)}
                                >
                                    <span className="mx-2">Back</span>
                                </Button>

                                <div className="flex gap-3 items-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            navigate("/register", {
                                                state: {
                                                    from: "/booking/passengers",
                                                    pendingSelection,
                                                    searchParams
                                                }
                                            });
                                        }}
                                    >
                                        Register
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            navigate("/login", {
                                                state: {
                                                    from: "/booking/passengers",
                                                    pendingSelection,
                                                    searchParams
                                                }
                                            });
                                        }}
                                    >
                                        Login
                                    </Button>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
