import React from 'react';
import FlightCard from "../components/flight/FlightCard.jsx";

export default function Home () {
    return (
        <>
            <p className="text-2xl text-blue-600">Airline Ticketing System</p>
            <p>COSC 3380 Team 13</p>
            <FlightCard
                image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05"
                origin="Houston"
                destination="New York"
                price="249"
                dateRange="Apr 10 - Apr 17"
                isPromotion={true}
                onBook={() => console.log("Go to flight details")}
            />
        </>
    );
}
