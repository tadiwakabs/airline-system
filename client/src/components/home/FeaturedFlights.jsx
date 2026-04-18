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
        <div className="mb-10">
            {eyebrow && (
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">
                    {eyebrow}
                </p>
            )}
            <h2 className="text-4xl font-black text-white tracking-tight">{title}</h2>
            {subtitle && <p className="mt-2 text-slate-300 font-medium">{subtitle}</p>}
        </div>
    );
}

export default function FeaturedFlights() {
    
    const handleBookFlight = (flight) => {
        console.log("Book flight:", flight);
        alert(`Opening booking for ${flight.origin} → ${flight.destination}`);
    };
    
    return (
        <section className="relative bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 border border-white/10 shadow-2xl overflow-hidden">
            {/* Subtle glow effect in the corner */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
                <SectionHeader
                    eyebrow="Curated for you"
                    title="Featured Destinations"
                    subtitle="Hand-picked deals departing from Houston this season."
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURED_FLIGHTS.map((flight) => (
                        <div key={`${flight.origin}-${flight.destination}`} className="transition-transform duration-300 hover:-translate-y-2">
                            <FeatureCard
                                image={flight.image}
                                origin={flight.origin}
                                destination={flight.destination}
                                price={flight.price}
                                dateRange={flight.dateRange}
                                isPromotion={flight.isPromotion}
                                onBook={() => handleBookFlight(flight)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}