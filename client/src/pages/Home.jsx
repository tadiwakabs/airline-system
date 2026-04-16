import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import TabBar from "../components/home/TabBar.jsx";
import FlightStatusPanel from "../components/home/FlightStatus.jsx";
import FlightSearchPanel from "../components/home/FlightSearchPanel.jsx";
import Hero from "../components/home/HeroSection.jsx";
import FeaturedFlights from "../components/home/FeaturedFlights.jsx";
import Card from "../components/common/Card.jsx";
import { getFlightById } from "../services/flightService";
import { getFlightsByBooking } from "../services/bookingService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatusBadgeClass(status) {
    switch ((status || "").toLowerCase()) {
        case "on time":
        case "ontime":
            return "bg-green-100 text-green-700 border-green-200";
        case "delayed":
            return "bg-yellow-100 text-yellow-700 border-yellow-200";
        case "cancelled":
        case "canceled":
            return "bg-red-100 text-red-700 border-red-200";
        case "boarding":
            return "bg-blue-100 text-blue-700 border-blue-200";
        default:
            return "bg-gray-100 text-gray-700 border-gray-200";
    }
}

function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function getAirportCode(flight, type) {
    if (type === "depart") {
        return (
            flight.departingPortCode ??
            flight.departingPort ??
            flight.departurePortCode ??
            flight.departurePort ??
            ""
        );
    }
    return (
        flight.arrivingPortCode ??
        flight.arrivingPort ??
        flight.arrivalPortCode ??
        flight.arrivalPort ??
        ""
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
    const [activeTab, setActiveTab] = useState("search");
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState("");
    const [statusResult, setStatusResult] = useState(null);

    const navigate = useNavigate();

    const handleSearch = (params) => {
        navigate("/flight-search", { state: params });
    };

    const handleStatusCheck = async (query) => {
        try {
            setStatusLoading(true);
            setStatusError("");
            setStatusResult(null);

            const input = typeof query === "object" ? query?.flightNum : query;
            if (!input) {
                setStatusError("Please enter a flight or booking number.");
                return;
            }

            const isBookingId = input.includes("-") || isNaN(Number(input));

            if (isBookingId) {
                const res = await getFlightsByBooking(input);
                const flights = res.data;
                if (!flights?.length) {
                    setStatusError("No flights found for that booking.");
                    return;
                }
                setStatusResult({ bookingFlights: flights });
            } else {
                const res = await getFlightById(input);
                const flight = res.data;
                setStatusResult({
                    flightNum: flight.flightNum,
                    status: flight.status,
                    departingPort: getAirportCode(flight, "depart"),
                    arrivingPort: getAirportCode(flight, "arrive"),
                    departTime: flight.departTime,
                    arrivalTime: flight.arrivalTime,
                    aircraftUsed: flight.aircraftUsed,
                });
            }
        } catch (err) {
            setStatusError("Could not find that flight or booking.");
        } finally {
            setStatusLoading(false);
        }
    };

    return (
        /* Changed 'bg-gray-50' to 'bg-transparent' so the slider shows through.
           Added 'backdrop-blur-sm' to provide some depth.
        */
        <div className="min-h-screen bg-transparent backdrop-blur-[2px]">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-14">
                
                {/* Hero Section */}
                <Hero />

                <section className="space-y-4">
                    <TabBar active={activeTab} onChange={setActiveTab} />

                    {/* Glass Panel wrapper for the Search/Status box */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-1 border border-white/20">
                        {activeTab === "search" ? (
                            <FlightSearchPanel onSearch={handleSearch} />
                        ) : (
                            <div className="p-4">
                                <FlightStatusPanel onCheck={handleStatusCheck} />

                                {statusLoading && (
                                    <div className="p-5 text-center text-gray-600">
                                        <p className="animate-pulse">Checking flight status...</p>
                                    </div>
                                )}

                                {statusError && (
                                    <div className="mt-4 p-4 bg-red-50/90 border border-red-200 rounded-xl text-red-600">
                                        {statusError}
                                    </div>
                                )}

                                {!statusLoading && !statusError && statusResult && !statusResult.bookingFlights && (
                                    <Card className="mt-6 p-6 bg-white shadow-lg border-none">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Flight Status</p>
                                                <h3 className="text-2xl font-black text-slate-900">{statusResult.flightNum}</h3>
                                                <p className="text-slate-500 font-medium">{statusResult.departingPort} → {statusResult.arrivingPort}</p>
                                            </div>
                                            <span className={`inline-flex rounded-full px-4 py-1 text-xs font-bold uppercase border ${getStatusBadgeClass(statusResult.status)}`}>
                                                {statusResult.status || "Unknown"}
                                            </span>
                                        </div>

                                        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Departure</p>
                                                <p className="text-sm font-bold text-slate-800">{formatDateTime(statusResult.departTime)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Arrival</p>
                                                <p className="text-sm font-bold text-slate-800">{formatDateTime(statusResult.arrivalTime)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Aircraft</p>
                                                <p className="text-sm font-bold text-slate-800">{statusResult.aircraftUsed || "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Route Type</p>
                                                <p className="text-sm font-bold text-slate-800">Direct</p>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {!statusLoading && !statusError && statusResult?.bookingFlights && (
                                    <div className="mt-6 space-y-4">
                                        {statusResult.bookingFlights.map((flight) => (
                                            <Card key={flight.flightNum} className="p-5 bg-white shadow-md border-none">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-blue-600">Flight {flight.flightNum}</h4>
                                                        <p className="text-sm text-slate-600">{getAirportCode(flight, "depart")} to {getAirportCode(flight, "arrive")}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadgeClass(flight.status)}`}>
                                                        {flight.status}
                                                    </span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Featured Flights - Wrapped in a subtle glass container */}
                <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10 shadow-xl">
                    <FeaturedFlights />
                </div>
            </div>
        </div>
    );
}