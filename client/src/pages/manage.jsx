import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { getSeatsForFlight } from "../services/seatingService"; 

function formatDateTime(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function groupSeatsForRender(seats) {
    const rows = new Map();
    for (const seat of seats) {
        const match = String(seat.seatNumber).match(/^(\d+)([A-Z])$/i);
        if (!match) return;
        const rowNumber = Number(match[1]);
        const letter = match[2].toUpperCase();
        if (!rows.has(rowNumber)) rows.set(rowNumber, []);
        rows.get(rowNumber).push({ ...seat, letter });
    }
    return [...rows.entries()].sort((a, b) => a[0] - b[0])
        .map(([rowNumber, rowSeats]) => ({
            rowNumber,
            seats: rowSeats.sort((a, b) => a.letter.localeCompare(b.letter)),
        }));
}


const ManageBooking = () => {
    const [bookings, setBookings] = useState([]);
    const [flightDetails,setFlightDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [availableSeats, setAvailableSeats] = useState([]);
    const [newSeatNumber, setNewSeatNumber] = useState("");
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [allowedClass, setAllowedClass] = useState("economy");
    
    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Booking/myBooking');
            const bookingsData = response.data;
            setBookings(bookingsData);

            const detailsMap = {};
            await Promise.all(
                bookingsData.map(async (b) => {
                    try {
                        const ticketRes = await api.get(`/Ticket/by-booking/${b.bookingId}`);
                        const flightCode = ticketRes.data.flightCode;

                        const flightRes = await api.get(`/Flights/${flightCode}`); 
                        
                        detailsMap[b.bookingId] = {
                            ...flightRes.data,
                            cabinClass: ticketRes.data.class
                        };
                    } catch (e) {
                        console.error(`Data chain broken for ${b.bookingId}`, e);
                    }
                })
            );
            setFlightDetails(detailsMap);
        } catch (err) { 
            console.error("Booking fetch failed", err); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;

        try {
            await api.delete(`/Booking/${bookingId}/cancel`); 
            alert("Booking successfully cancelled. Your seat has been released.");
            fetchBookings(); // Refresh the UI
        } catch (err) {
            console.error("Cancellation error:", err);
            alert(err.response?.data || "Could not cancel booking.");
        }
    };
    
    const openSeatModal = async (booking) => {
        const flightData = flightDetails[booking.bookingId];
        if (!flightData) return alert("Flight info not loaded yet.");

        setSelectedBooking(booking);
        setLoadingSeats(true);
        setNewSeatNumber("");
        
        setAllowedClass(flightData.cabinClass?.toLowerCase() || "economy");

        try {
            const seatRes = await getSeatsForFlight(flightData.flightNum); 
            setAvailableSeats(seatRes.data);
        } catch (err) { 
            console.error("Seat load error:", err);
            alert("Error loading seats"); 
            setSelectedBooking(null);
        } finally { 
            setLoadingSeats(false); 
        }
    };

    const handleCloseModal = () => setSelectedBooking(null);

    const confirmSeatChange = async () => {
        try {
            await api.put(`/Booking/${selectedBooking.bookingId}/change-seat`, 
                JSON.stringify(newSeatNumber), 
                { headers: { 'Content-Type': 'application/json' } }
            );
            alert("Seat updated successfully!");
            handleCloseModal();
            fetchBookings(); // Refresh list
        } catch (err) {
            alert("Failed to update seat.");
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-blue-600">Loading Your Trips...</div>;

    return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
        {/* HEADER */}
        <header className="mb-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Bookings</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage your seats and flight details</p>
        </header>

        {/* BOOKING CARDS LIST */}
        <div className="space-y-6">
            {bookings.map((b) => {
                const isCancelled = b.bookingStatus === "Cancelled" || b.bookingStatus === 2;
                const flight = flightDetails[b.bookingId];

                return (
                    <div key={b.bookingId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
                        {/* Left Side: Flight Info */}
                        <div className="p-8 flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded-full uppercase">
                                    Ref: {b.bookingId.substring(0, 8)}
                                </span>
                                <div className={`h-2 w-2 rounded-full ${isCancelled ? 'bg-red-500' : 'bg-green-500'}`} />
                                <span className="text-sm font-bold text-gray-700">{b.bookingStatus}</span>
                            </div>

                            {flight ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-6 py-2">
                                <div className="text-center min-w-[80px]">
                                    <p className="text-xl font-black text-gray-900 leading-none">
                                        {flight.departingPortCode || flight.departingPort}
                                    </p>
                                    <p className="text-[10px] text-gray-400 uppercase mt-1 font-bold">Departure</p>
                                </div>

                                <div className="flex-1 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-gray-200 border-t border-dashed" />
                                    <svg className="w-4 h-4 text-blue-500 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                    </svg>
                                    <div className="h-px flex-1 bg-gray-200 border-t border-dashed" />
                                </div>

                                <div className="text-center min-w-[80px]">
                                    {/* Use the exact JsonPropertyName from your C# Model */}
                                    <p className="text-xl font-black text-gray-900 leading-none">
                                        {flight.arrivingPortCode || flight.arrivingPort}
                                    </p>
                                    <p className="text-[10px] text-gray-400 uppercase mt-1 font-bold">Arrival</p>
                                </div>
                            </div>

                                {/* Info Row */}
                                <div className="flex gap-8 mt-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400">Date</p>
                                        <p className="text-sm font-bold text-gray-800">
                                            {new Date(flight.departTime).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400">Time</p>
                                        <p className="text-sm font-bold text-gray-800">
                                            {formatDateTime(flight.departTime)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400">Flight #</p>
                                        <p className="text-sm font-bold text-gray-800">{flight.flightNum}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400">Cabin</p>
                                        <p className="text-sm font-bold text-blue-600 uppercase">{flight.cabinClass || "Economy"}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-gray-50 rounded-2xl text-gray-400 text-sm font-medium animate-pulse">
                                Fetching flight details...
                            </div>
                        )}
                        </div>

                        {/* Right Side: Actions */}
                        <div className="bg-gray-50/50 p-8 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center gap-3 w-full md:w-72">
                            <button 
                                onClick={() => openSeatModal(b)} 
                                disabled={isCancelled || !flight}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold transition-all disabled:bg-gray-200 disabled:text-gray-400 shadow-lg shadow-blue-100 disabled:shadow-none"                            >
                                Change Seat
                            </button>
                            {!isCancelled && (
                            <button 
                                onClick={() => handleCancelBooking(b.bookingId)}
                                className="w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-lg font-bold transition-all hover:bg-red-100 active:scale-95"
                                >Cancel Trip
                            </button>
                        )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* SEAT SELECTION MODAL */}
        {selectedBooking && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Select New Seat</h2>
                            <p className="text-sm text-gray-500 font-medium">Choose a seat in {allowedClass.toUpperCase()}</p>
                        </div>
                        <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-900 text-3xl transition-colors">&times;</button>
                    </div>

                    {loadingSeats ? (
                        <div className="text-center py-20 font-bold text-gray-400 animate-pulse">Loading Aircraft Layout...</div>
                    ) : (
                        <div className="space-y-8">
                            {/* Visual Seat Map Container */}
                            <div className="flex justify-center bg-gray-50 p-8 rounded-3xl border border-gray-100">
                                <div className="grid grid-cols-1 gap-4">
                                    <p className="text-center text-[10px] text-gray-400 uppercase tracking-[0.3em] mb-4 font-black">Front of Aircraft</p>
                                    <div className="space-y-3">
                                        {groupSeatsForRender(availableSeats).map(row => (
                                            <div key={row.rowNumber} className="flex gap-3 items-center justify-center">
                                                <span className="w-6 text-[10px] font-black text-gray-300">{row.rowNumber}</span>
                                                {row.seats.map(seat => {
                                                    const isWrongClass = seat.seatclass?.toLowerCase() !== allowedClass;
                                                    const isOccupied = seat.seatStatus === "Occupied";
                                                    const isSelected = newSeatNumber === seat.seatNumber;

                                                    return (
                                                        <button
                                                            key={seat.seatNumber}
                                                            disabled={isOccupied || isWrongClass}                                                       
                                                            onClick={() => setNewSeatNumber(seat.seatNumber)}
                                                            className={`w-11 h-11 rounded-xl text-xs font-black border-2 transition-all ${
                                                                isSelected 
                                                                ? "bg-blue-600 text-white border-blue-700 shadow-md scale-110" 
                                                                : isOccupied 
                                                                ? "bg-red-50 text-red-300 cursor-not-allowed border-red-100" 
                                                                : isWrongClass
                                                                ? "bg-gray-100 text-gray-300 cursor-not-allowed border-gray-100"
                                                                : "bg-white text-green-600 border-green-100 hover:border-green-400 hover:bg-green-50"
                                                            }`}
                                                        >
                                                            {seat.letter}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Selection Summary Footer */}
                            <div className="flex items-center justify-between bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-100">
                                <div>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Target Seat</p>
                                    <p className="text-3xl font-black text-white">{newSeatNumber || "--"}</p>
                                </div>
                                <button 
                                    onClick={confirmSeatChange}
                                    disabled={!newSeatNumber}
                                    className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black shadow-lg disabled:bg-blue-400 disabled:text-blue-200 transition-all active:scale-95"
                                >
                                    Confirm Change
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
    );
};

export default ManageBooking;