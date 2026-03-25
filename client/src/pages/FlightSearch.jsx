import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FlightCard from "../components/flight/FlightCard";
import FlightSearchPanel from "../components/home/FlightSearchPanel.jsx";
import { searchFlightResults } from "../services/flightService";

export default function FlightSearch() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useState(
        state || {
            flightType: "one-way",
            departure: "",
            arrival: "",
            dateDepart: "",
            dateReturn: "",
            passengers: { adults: 1, children: 0, infants: 0 },
            cabinClass: "economy",
        }
    );

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!searchParams?.departure || !searchParams?.arrival || !searchParams?.dateDepart) {
            setResults([]);
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
                }));

                setResults(normalized);
            } catch (err) {
                console.error("Error fetching flights:", err);
                setError("Could not load flight results.");
                setResults([]);
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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-2xl font-semibold">Flight Results</h1>

                <FlightSearchPanel
                    onSearch={handleSearch}
                    initialValues={searchParams}
                />

                {loading && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <p>Loading flights...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-white border border-red-200 rounded-2xl p-6">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {!loading && !error && results.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <p>No flights found.</p>
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                    <div className="space-y-4">
                        {results.map((result, index) => (
                            <FlightCard key={index} {...result} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
