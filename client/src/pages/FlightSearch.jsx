import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FlightCard from "../components/flight/FlightCard";
import FlightSearchPanel from "../components/home/FlightSearchPanel.jsx";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import { searchFlightResults } from "../services/flightService";

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
    if (passengers.adults) parts.push(`${passengers.adults} Adult${passengers.adults > 1 ? "s" : ""}`);
    if (passengers.children) parts.push(`${passengers.children} Child${passengers.children > 1 ? "ren" : ""}`);
    if (passengers.infants) parts.push(`${passengers.infants} Infant${passengers.infants > 1 ? "s" : ""}`);
    return parts.join(", ");
}

function formatCabinClass(cabinClass) {
    if (!cabinClass) return "";
    if (cabinClass === "first") return "First Class";
    return cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1);
}

export default function FlightSearch() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const fallbackParams = {
        flightType: "one-way",
        departure: "",
        arrival: "",
        dateDepart: "",
        dateReturn: "",
        passengers: { adults: 1, children: 0, infants: 0 },
        cabinClass: "economy",
    };

    const [searchParams, setSearchParams] = useState(state || fallbackParams);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSearchForm, setShowSearchForm] = useState(true);

    useEffect(() => {
        if (state) {
            setSearchParams(state);
        }
    }, [state]);

    useEffect(() => {
        const hasRequiredFields =
            searchParams?.departure &&
            searchParams?.arrival &&
            searchParams?.dateDepart;

        if (!hasRequiredFields) {
            setResults([]);
            setShowSearchForm(true);
            return;
        }

        const fetchResults = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await searchFlightResults({
                    from: searchParams.departure,
                    to: searchParams.arrival,
                    date: searchParams.dateDepart,
                    adults: searchParams.passengers?.adults ?? 1,
                    children: searchParams.passengers?.children ?? 0,
                    infants: searchParams.passengers?.infants ?? 0,
                });

                const normalized = res.data.map((item) => ({
                    type: item.type,
                    flights: item.flights.map((f) => ({
                        flightNum: f.flightNum,
                        departingPort: f.departingPortCode,
                        arrivingPort: f.arrivingPortCode,
                        departTime: f.departTime,
                        arrivalTime: f.arrivalTime,
                        status: f.status,
                        aircraftUsed: f.aircraftUsed,
                        distance: f.distance,
                    })),
                    pricing: {
                        economy: item.pricing?.economy ?? 0,
                        business: item.pricing?.business ?? 0,
                        first: item.pricing?.first ?? 0,
                    },
                    quote: item.quote,
                }));

                setResults(normalized);
                setShowSearchForm(false);
            } catch (err) {
                console.error("Error fetching flights:", err);
                setError("Could not load flight results.");
                setResults([]);
                setShowSearchForm(true);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [searchParams]);

    const handleSearch = (params) => {
        setSearchParams(params);
        navigate("/flight-search", { state: params, replace: true });
    };

    const searchSummary = useMemo(() => {
        return {
            route:
                searchParams.departure && searchParams.arrival
                    ? `${searchParams.departure} → ${searchParams.arrival}`
                    : "Select route",
            date:
                searchParams.flightType === "return" && searchParams.dateReturn
                    ? `${formatDate(searchParams.dateDepart)} - ${formatDate(searchParams.dateReturn)}`
                    : formatDate(searchParams.dateDepart),
            passengers: buildPassengerSummary(searchParams.passengers),
            cabinClass: formatCabinClass(searchParams.cabinClass),
            flightType:
                searchParams.flightType === "return" ? "Return" : "One-way",
        };
    }, [searchParams]);

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
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Route
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {searchSummary.route}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Trip
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {searchSummary.flightType}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Dates
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {searchSummary.date || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Passengers
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {searchSummary.passengers || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Cabin
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {searchSummary.cabinClass || "—"}
                                    </p>
                                </div>
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

                {loading && (
                    <Card className="p-6">
                        <p>Loading flights...</p>
                    </Card>
                )}

                {error && (
                    <Card className="p-6 border-red-200">
                        <p className="text-red-600">{error}</p>
                    </Card>
                )}

                {!loading && !error && results.length === 0 && (
                    <Card className="p-6">
                        <p>No flights found.</p>
                    </Card>
                )}

                {!loading && !error && results.length > 0 && (
                    <div className="space-y-4">
                        {results.map((result, index) => (
                            <FlightCard
                                key={index}
                                {...result}
                                cabinClass={searchParams.cabinClass}
                                passengers={searchParams.passengers}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
