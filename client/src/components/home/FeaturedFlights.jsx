import FeatureCard from "../flight/FeatureCard.jsx";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFeaturedFlights } from "../../services/flightService";
import AIRPORTS from "../../dropdownData/airports.json";

// Build a code → city lookup once from the airports JSON
const CODE_TO_CITY = Object.fromEntries(
    AIRPORTS.map((a) => [a.value.toUpperCase(), a.city])
);

// Destination images keyed by arriving airport code
const DESTINATION_IMAGES = {
    // Domestic
    ATL: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=600&auto=format&fit=crop", // Atlanta skyline
    CLT: "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=600&auto=format&fit=crop", // Charlotte skyline
    DEN: "https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=600&auto=format&fit=crop", // Denver mountains
    DFW: "https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=600&auto=format&fit=crop", // Dallas skyline
    JFK: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop", // New York
    LAX: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&auto=format&fit=crop", // Los Angeles
    ORD: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&auto=format&fit=crop", // Chicago
    PHX: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop", // Phoenix desert
    SEA: "https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=600&auto=format&fit=crop", // Seattle
    // International
    CDG: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop", // Paris
    DXB: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&auto=format&fit=crop", // Dubai
    HND: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&auto=format&fit=crop", // Tokyo
    ICN: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600&auto=format&fit=crop", // Seoul
    LHR: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop", // London
};

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop";

const RETURN_DAYS = 7;

function addDays(dateVal, days) {
    const d = new Date(dateVal);
    d.setDate(d.getDate() + days);
    return d;
}

function formatDateRange(departTime) {
    if (!departTime) return "";
    const fmt = (d) => d.toLocaleDateString([], { month: "short", day: "numeric" });
    const depart = new Date(departTime);
    const ret = addDays(departTime, RETURN_DAYS);
    return `${fmt(depart)} – ${fmt(ret)}`;
}

function getEconomyPrice(pricing) {
    if (!Array.isArray(pricing)) return null;
    const entry = pricing.find(
        (p) => (p.cabinClass || p.CabinClass || "").toLowerCase() === "economy"
    );
    return entry ? entry.price ?? entry.Price : null;
}

function SectionHeader({ eyebrow, title, subtitle }) {
    return (
        <div className="mb-8">
            {eyebrow && (
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
                    {eyebrow}
                </p>
            )}
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
        </div>
    );
}

export default function FeaturedFlights() {
    const navigate = useNavigate();
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await getFeaturedFlights();
                setFlights(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Failed to load featured flights:", err);
                setError("Unable to load featured flights right now.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleViewFlight = (flight) => {
        const departCode = (flight.departingPortCode || flight.DepartingPortCode || "").toUpperCase();
        const arriveCode = (flight.arrivingPortCode || flight.ArrivingPortCode || "").toUpperCase();
        const departTime = flight.departTime || flight.DepartTime || flight.scheduledDepartLocal;

        const toDateStr = (val) => {
            if (!val) return "";
            return new Date(val).toISOString().split("T")[0];
        };

        navigate("/flight-search", {
            state: {
                flightType: "return",
                departure: departCode,
                arrival: arriveCode,
                dateDepart: toDateStr(departTime),
                dateReturn: toDateStr(addDays(departTime, RETURN_DAYS)),
                passengers: { adults: 1, children: 0, infants: 0 },
                cabinClass: "economy",
            },
        });
    };

    return (
        <section>
            <SectionHeader
                eyebrow="Curated for you"
                title="Featured Destinations"
                subtitle="Upcoming flights departing from Houston this season."
            />

            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-gray-100 animate-pulse h-72"
                        />
                    ))}
                </div>
            )}

            {!loading && error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {!loading && !error && flights.length === 0 && (
                <p className="text-sm text-gray-500">No featured flights available at this time.</p>
            )}

            {!loading && !error && flights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {flights.map((flight) => {
                        const departCode = (flight.departingPortCode || flight.DepartingPortCode || "").toUpperCase();
                        const arriveCode = (flight.arrivingPortCode || flight.ArrivingPortCode || "").toUpperCase();
                        const pricing = flight.pricing || flight.Pricing || [];
                        const economyPrice = getEconomyPrice(pricing);
                        const departTime = flight.departTime || flight.DepartTime || flight.scheduledDepartLocal;

                        return (
                            <FeatureCard
                                key={flight.flightNum || flight.FlightNum}
                                image={DESTINATION_IMAGES[arriveCode] ?? FALLBACK_IMAGE}
                                origin={CODE_TO_CITY[departCode] ?? departCode}
                                destination={CODE_TO_CITY[arriveCode] ?? arriveCode}
                                price={economyPrice != null ? String(economyPrice * 2) : "—"}
                                dateRange={formatDateRange(departTime)}
                                isPromotion={false}
                                onBook={() => handleViewFlight(flight)}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}
