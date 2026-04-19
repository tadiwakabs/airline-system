import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TabBar from "../components/home/TabBar.jsx";
import FlightStatusPanel from "../components/home/FlightStatus.jsx";
import FlightSearchPanel from "../components/home/FlightSearchPanel.jsx";
import Hero from "../components/home/HeroSection.jsx";
import FeaturedFlights from "../components/home/FeaturedFlights.jsx";
import Card from "../components/common/Card.jsx";
import { getMyNotifications, markNotificationAsRead } from "../services/notificationService";
import { getStatusByBooking } from "../services/bookingService";

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

function arrivesNextDay(departValue, arrivalValue) {
    const depart = parseLocalDateTime(departValue);
    const arrival = parseLocalDateTime(arrivalValue);

    if (!depart || !arrival) return false;

    return (
        arrival.getFullYear() > depart.getFullYear() ||
        arrival.getMonth() > depart.getMonth() ||
        arrival.getDate() > depart.getDate()
    );
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

    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState("");

    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            loadNotifications();
        }
    }, [isAuthenticated]);

    const loadNotifications = async () => {
        try {
            setNotificationsLoading(true);
            setNotificationsError("");

            const data = await getMyNotifications();
            setNotifications(
                Array.isArray(data)
                    ? data.filter(n => n.notificationStatus !== "Read")
                    : []
            );
        } catch (err) {
            console.error("Error loading notifications:", err);
            setNotificationsError(
                err?.response?.data?.message || "Failed to load notifications."
            );
        } finally {
            setNotificationsLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
    try {
        await markNotificationAsRead(id);

        setNotifications((prev) =>
            prev.filter((n) => n.notificationId !== id)
        );
    } catch (err) {
        console.error("Error marking notification as read:", err);
    }
};

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
        <div className="min-h-screen bg-transparent backdrop-blur-[2px]">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-14">
                <Hero />

                {isAuthenticated && notifications.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Notifications
                                </h2>
                                <p className="text-sm text-gray-200">
                                    Important flight and standby updates for your account.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/profile", {
                                        state: { defaultTab: "notifications" },
                                    })
                                }
                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                            >
                                View All
                            </button>
                        </div>

                        {notificationsLoading && (
                            <Card className="p-5">
                                <p className="text-sm text-gray-600">Loading notifications...</p>
                            </Card>
                        )}

                        {notificationsError && (
                            <Card className="p-5 border-red-200">
                                <p className="text-red-600">{notificationsError}</p>
                            </Card>
                        )}

                        {!notificationsLoading && !notificationsError && (
                            <div className="space-y-3">
                                {notifications.slice(0, 3).map((notification) => (
                                    <Card key={notification.notificationId} className="p-5">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {notification.message}
                                                </p>

                                                <div className="mt-2 space-y-1 text-xs text-gray-500">
                                                    <p>
                                                        Flight: {notification.flightNum || "—"}
                                                    </p>
                                                    <p>
                                                        Created:{" "}
                                                        {notification.createdAt
                                                            ? formatDateTime(notification.createdAt)
                                                            : "—"}
                                                    </p>
                                                </div>
                                                {(notification.notificationStatus || "").toLowerCase() === "unread" && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.notificationId)}
                                                        className="mt-2 text-xs text-blue-600 hover:underline"
                                                    >
                                                        Mark as Read
                                                    </button>
                                                )}
                                            </div>

                                            <span
                                                className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                                                    (notification.notificationStatus || "").toLowerCase() ===
                                                    "unread"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                {notification.notificationStatus || "Unknown"}
                                            </span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                <section className="space-y-4">
                    <TabBar active={activeTab} onChange={setActiveTab} />

                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-1 border border-white/20">
                        {activeTab === "search" ? (
                            <FlightSearchPanel onSearch={handleSearch} />
                        ) : (
                            <div className="p-4">
                                <FlightStatusPanel
                                    onCheck={handleStatusCheck}
                                    result={statusResult}
                                />

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

                                {!statusLoading &&
                                    !statusError &&
                                    statusResult &&
                                    !statusResult.bookingFlights && (
                                        <Card className="mt-6 p-6 bg-white shadow-lg border-none">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                                                        Flight Status
                                                    </p>
                                                    <h3 className="text-2xl font-black text-slate-900">
                                                        {statusResult.flightNum}
                                                    </h3>
                                                    <p className="text-slate-500 font-medium">
                                                        {statusResult.departingPort} →{" "}
                                                        {statusResult.arrivingPort}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {statusResult.departingCity || "—"} →{" "}
                                                        {statusResult.arrivingCity || "—"}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`inline-flex rounded-full px-4 py-1 text-xs font-bold uppercase border ${getStatusBadgeClass(
                                                        statusResult.status
                                                    )}`}
                                                >
                                                    {statusResult.status || "Unknown"}
                                                </span>
                                            </div>

                                            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">
                                                        Departure
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {formatDateTime(statusResult.departTime)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">
                                                        Arrival
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {formatDateTime(statusResult.arrivalTime)}
                                                        {arrivesNextDay(
                                                            statusResult.departTime,
                                                            statusResult.arrivalTime
                                                        ) && (
                                                            <span className="ml-2 text-xs font-semibold text-blue-600">
                                                                +1
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">
                                                        Aircraft
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {statusResult.aircraftUsed || "—"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">
                                                        Route
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {statusResult.departingPort} →{" "}
                                                        {statusResult.arrivingPort}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    )}

                                {!statusLoading && !statusError && statusResult?.bookingFlights && (
                                    <div className="mt-6 space-y-4">
                                        {statusResult.bookingFlights.map((flight) => (
                                            <Card
                                                key={flight.flightNum}
                                                className="p-5 bg-white shadow-md border-none"
                                            >
                                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-blue-600">
                                                            Flight {flight.flightNum}
                                                        </h4>
                                                        <p className="text-sm text-slate-600">
                                                            {getAirportCode(flight, "depart")} to{" "}
                                                            {getAirportCode(flight, "arrive")}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {flight.departingCity || "—"} →{" "}
                                                            {flight.arrivingCity || "—"}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadgeClass(
                                                            flight.status
                                                        )}`}
                                                    >
                                                        {flight.status || "Unknown"}
                                                    </span>
                                                </div>

                                                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                            Departure
                                                        </p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {formatDateTime(flight.departTime)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                            Arrival
                                                        </p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {formatDateTime(flight.arrivalTime)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                            Aircraft
                                                        </p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {flight.aircraftUsed || "—"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                            Route
                                                        </p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {getAirportCode(flight, "depart")} →{" "}
                                                            {getAirportCode(flight, "arrive")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <div className="mt-36">
                    <FeaturedFlights />
                </div>
            </div>
        </div>
    );
}
