import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import TabBar from "../components/home/TabBar.jsx";
import FlightStatusPanel from "../components/home/FlightStatus.jsx";
import FlightSearchPanel from "../components/home/FlightSearchPanel.jsx";
import Hero from "../components/home/HeroSection.jsx";
import FeaturedFlights from "../components/home/FeaturedFlights.jsx";
import Card from "../components/common/Card.jsx";
import { getStatusByBooking } from "../services/bookingService";

function getStatusBadgeClass(status) {
    switch ((status || "").toLowerCase()) {
        case "on time":
        case "ontime":
            return "bg-green-100 text-green-700";
        case "delayed":
            return "bg-yellow-100 text-yellow-700";
        case "cancelled":
        case "canceled":
            return "bg-red-100 text-red-700";
        case "boarding":
            return "bg-blue-100 text-blue-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
}

function formatDateTime(value) {
    if (!value) return "—";

    const raw = String(value).trim();
    const [datePart, timePart = ""] = raw.split("T");
    if (!datePart) return value;

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0] = timePart.split(":").map(Number);

    if (!year || !month || !day) return value;

    const d = new Date(year, month - 1, day, hour, minute);

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

export default function Home() {
    const [activeTab, setActiveTab] = useState("search");
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState("");
    const [statusResult, setStatusResult] = useState(null);

    const navigate = useNavigate();

    const handleSearch = (params) => {
        console.log("Search params:", params);
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

            const res = await getStatusByBooking(input);
            const data = res.data;

            if (Array.isArray(data)) {
                setStatusResult({ bookingFlights: data });
            } else {
                setStatusResult(data);
            }
        } catch (err) {
            console.error("Error checking status:", err);
            setStatusError("Could not find that flight or booking.");
        } finally {
            setStatusLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-14">
                <Hero />

                <section className="space-y-4">
                    <TabBar active={activeTab} onChange={setActiveTab} />

                    {activeTab === "search" ? (
                        <FlightSearchPanel onSearch={handleSearch} />
                    ) : (
                        <>
                            <FlightStatusPanel onCheck={handleStatusCheck} result={statusResult} />

                            {statusLoading && (
                                <Card className="p-5">
                                    <p>Checking flight status...</p>
                                </Card>
                            )}

                            {statusError && (
                                <Card className="p-5 border-red-200">
                                    <p className="text-red-600">{statusError}</p>
                                </Card>
                            )}

                            {!statusLoading && !statusError && statusResult && !statusResult.bookingFlights && (
                                <Card className="p-5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Flight
                                            </p>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {statusResult.flightNum}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {statusResult.departingPort} → {statusResult.arrivingPort}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {statusResult.departingCity || "—"} → {statusResult.arrivingCity || "—"}
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                                                statusResult.status
                                            )}`}
                                        >
                                            {statusResult.status || "Unknown"}
                                        </span>
                                    </div>

                                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Departure
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {formatDateTime(statusResult.departTime)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Arrival
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {formatDateTime(statusResult.arrivalTime)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Aircraft
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {statusResult.aircraftUsed || "—"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Route
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {statusResult.departingPort} → {statusResult.arrivingPort}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {!statusLoading && !statusError && statusResult?.bookingFlights && (
                                <div className="space-y-3">
                                    {statusResult.bookingFlights.map((flight) => (
                                        <Card key={flight.flightNum} className="p-5">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Flight</p>
                                                    <h3 className="text-xl font-semibold text-gray-900">{flight.flightNum}</h3>
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        {getAirportCode(flight, "depart")} → {getAirportCode(flight, "arrive")}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {flight.departingCity || "—"} → {flight.arrivingCity || "—"}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(flight.status)}`}>
                        {flight.status || "Unknown"}
                    </span>
                                            </div>
                                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Departure</p>
                                                    <p className="text-sm font-semibold text-gray-900">{formatDateTime(flight.departTime)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Arrival</p>
                                                    <p className="text-sm font-semibold text-gray-900">{formatDateTime(flight.arrivalTime)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Aircraft</p>
                                                    <p className="text-sm font-semibold text-gray-900">{flight.aircraftUsed || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Route</p>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {getAirportCode(flight, "depart")} → {getAirportCode(flight, "arrive")}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>

                <FeaturedFlights />
            </div>
        </div>
    );
}
