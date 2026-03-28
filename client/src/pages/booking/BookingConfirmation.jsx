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
                    <span className="text-gray-500">Passenger</span>
                    <span>{state.passengerName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Flight</span>
                    <span>{state.flightDetails}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Seat</span>
                    <span>{state.seatNumber}</span>
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

            <Button
                onClick={() => navigate("/")}
                className="cursor-pointer w-full"
            >
                Back to Home
            </Button>
        </div>
    );
}