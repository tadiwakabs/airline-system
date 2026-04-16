import FeatureCard from "../flight/FeatureCard.jsx";
import React from "react";

const FEATURED_FLIGHTS = [
    {
        image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop",
        origin: "Houston",
        destination: "New York",
        price: "249",
        dateRange: "Apr 10 – Apr 17",
        isPromotion: true,
    },
    {
        image: "https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=1920&auto=format&fit=crop",
        origin: "Houston",
        destination: "Los Angeles",
        price: "189",
        dateRange: "May 2 – May 9",
        isPromotion: false,
    },
    {
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop",
        origin: "Houston",
        destination: "Miami",
        price: "214",
        dateRange: "Apr 25 – May 2",
        isPromotion: true,
    },
    {
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&auto=format&fit=crop",
        origin: "Houston",
        destination: "San Francisco",
        price: "299",
        dateRange: "Jun 1 – Jun 8",
        isPromotion: false,
    },
];

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
    
    const handleBookFlight = (flight) => {
        // TODO: navigate to booking page
        console.log("Book flight:", flight);
        alert(`Opening booking for ${flight.origin} → ${flight.destination}`);
    };
    
    return (
        <section>
            <SectionHeader
                eyebrow="Curated for you"
                title="Featured Destinations"
                subtitle="Hand-picked deals departing from Houston this season."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURED_FLIGHTS.map((flight) => (
                    <FeatureCard
                        key={`${flight.origin}-${flight.destination}`}
                        image={flight.image}
                        origin={flight.origin}
                        destination={flight.destination}
                        price={flight.price}
                        dateRange={flight.dateRange}
                        isPromotion={flight.isPromotion}
                        onBook={() => handleBookFlight(flight)}
                    />
                ))}
            </div>
        </section>
    )
}