import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";

export default function Confirmation() {
    const { state } = useLocation();
    const navigate = useNavigate();

    if (!state) {
        return (
            <div className="max-w-lg mx-auto p-6 text-center">
                <p className="text-gray-500">No confirmation data found.</p>
                <button onClick={() => navigate("/")} className="mt-4 text-blue-600 hover:underline">
                    Go Home
                </button>
            </div>
        );
    }
    
    const tickets = state.tickets ?? [];

    return (
        <div className="max-w-lg mx-auto p-6">
            <div className="text-center mb-6">
                <div className="text-green-500 text-5xl mb-2">✓</div>
                <h1 className="text-2xl font-bold">Payment Successful!</h1>
                <p className="text-gray-500 text-sm mt-1">Your booking has been confirmed.</p>
            </div>

            <div className="border rounded p-4 mb-4 bg-gray-50 text-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono font-semibold">TXN-{state.transactionId}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Booking Reference</span>
                    <span className="font-mono font-semibold">{state.bookingId}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-semibold">${state.totalPrice}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Card</span>
                    <span>{state.cardType} •••• {state.lastFour}</span>
                </div>
            </div>

            {/* One card per ticket */}
            {tickets.map((ticket) => (
                <div key={ticket.ticketCode}
                     className="border rounded p-4 mb-3 text-sm space-y-2">
                    <p className="font-semibold text-gray-700">
                        {ticket.origin} → {ticket.destination}
                    </p>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Ticket</span>
                        <span className="font-mono">{ticket.ticketCode}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Flight</span>
                        <span>#{ticket.flightNum}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Seat</span>
                        <span>{ticket.seatNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Boarding</span>
                        <span>{ticket.boardingTime}</span>
                    </div>
                </div>
            ))}

            <Button onClick={() => navigate("/")} className="w-full">
                Back to Home
            </Button>
        </div>
    );
}