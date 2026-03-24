import React, { useState } from "react";

import TabBar from "../components/home/TabBar.jsx";
import FlightStatusPanel from "../components/home/FlightStatus.jsx";
import FlightSearchPanel from "../components/home/FlightSearchPanel.jsx";
import Hero from "../components/home/HeroSection.jsx";
import FeaturedFlights from "../components/home/FeaturedFlights.jsx";

export default function Home() {
    const [activeTab, setActiveTab] = useState("search");

    const handleSearch = (params) => {
        // TODO: navigate to search results page with params
        console.log("Search params:", params);
        alert(
            `Searching ${params.departure} → ${params.arrival}\n` +
            `${params.flightType} · ${params.dateDepart}${params.flightType === "return" ? " → " + params.dateReturn : ""}\n` +
            `${params.passengers.adults + params.passengers.children + params.passengers.infants} pax · ${params.cabinClass}`
        );
    };

    const handleStatusCheck = (query) => {
        // TODO: navigate to flight status page with query
        console.log("Status query:", query);
        alert(`Checking status for: ${query}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-14">

                {/* ── Hero Section ── */}
                <Hero />

                {/* ── Search / Status Tabs ── */}
                <section>
                    <TabBar active={activeTab} onChange={setActiveTab} />
                    {activeTab === "search" ? (
                        <FlightSearchPanel onSearch={handleSearch} />
                    ) : (
                        <FlightStatusPanel onCheck={handleStatusCheck} />
                    )}
                </section>

                {/* ── Featured Flights ── */}
                <FeaturedFlights />

            </div>
        </div>
    );
}
