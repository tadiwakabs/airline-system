import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { getSeatsForFlight } from "../services/seatingService"; 


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

function getSeatClass(seat, selected) {
    const base = "w-10 h-10 rounded-lg border text-xs font-bold transition-all";
    if (seat.seatNumber === selected) return `${base} bg-blue-600 text-white border-blue-700 shadow-md`;
    if (seat.seatStatus === "Occupied") return `${base} bg-red-100 text-red-400 border-red-200 cursor-not-allowed`;
    return `${base} bg-green-50 text-green-700 border-green-200 hover:bg-green-100`;
}

const ManageBooking = () => {
    const [bookings, setBookings] = useState([]);
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
            const response = await api.get('/Booking/myBooking');
            setBookings(response.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    
    const openSeatModal = async (booking) => {
        if (booking.bookingStatus=== "Cancelled" || booking.bookingStatus === 2)
            return; 
        
        setSelectedBooking(booking);
        setLoadingSeats(true);
        setNewSeatNumber("");
        
        try {
    
            const ticketRes = await api.get(`/Ticket/by-booking/${booking.bookingId}`);
            const flightNum = ticketRes.data.flightCode;

            setAllowedClass(ticketRes.data.class?.toLowerCase() || "economy");
            
            const seatRes = await getSeatsForFlight(flightNum);
            setAvailableSeats(seatRes.data);
        } catch (err) {
            alert("Could not load seating chart.");
        } finally {
            setLoadingSeats(false);
        }
    };

    const confirmSeatChange = async () => {
        try {
            await api.put(`/Booking/${selectedBooking.bookingId}/change-seat`, 
                JSON.stringify(newSeatNumber), 
                { headers: { 'Content-Type': 'application/json' } }
            );
            alert("Seat updated successfully!");
            setSelectedBooking(null);
            fetchBookings(); // Refresh list
        } catch (err) {
            alert("Failed to update seat.");
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-blue-600">Loading Your Trips...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Manage Bookings</h1>

            <div className="space-y-4">
            {bookings.map((b) => {
                const isCancelled = b.bookingStatus === "Cancelled" || b.bookingStatus === 2;

                return (
                    <div key={b.bookingId} className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-blue-500 uppercase">Ref: {b.bookingId.substring(0, 8)}</span>
                            <h2 className={`text-xl font-bold ${isCancelled ? 'text-red-500' : 'text-gray-900'}`}>
                                Status: {b.bookingStatus}
                            </h2>
                            <p className="text-gray-500">Date: {new Date(b.bookingDate).toLocaleDateString()}</p>
                        </div>

                        <div className="flex flex-col gap-2 w-48">
                            {/* --- CHANGE SEAT BUTTON --- */}
                            <button 
                                onClick={() => openSeatModal(b)} 
                                disabled={isCancelled} // DISABLE LOGIC HERE
                                className={`py-2 rounded-lg font-semibold transition ${
                                    isCancelled 
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                }`}
                            >
                                {isCancelled ? "Seat Released" : "Change Seat"}
                            </button>

                            {/* --- CANCEL TRIP BUTTON --- */}
                            {!isCancelled && (
                                <button className="border border-red-500 text-red-500 py-2 rounded-lg font-semibold hover:bg-red-50 transition">
                                    Cancel Trip
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

            {/* SEAT MAP MODAL */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Select New Seat</h2>
                            <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        {loadingSeats ? (
                            <div className="text-center py-10">Preparing Aircraft...</div>
                        ) : (
                            <div className="space-y-6">
                                {/* Use your SeatMap logic here */}
                                <div className="flex justify-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Simplified visual of your SeatMap Component */}
                                        <p className="text-center text-sm text-gray-400 uppercase tracking-widest mb-4">Front of Plane</p>
                                        <div className="space-y-2">
                                            {groupSeatsForRender(availableSeats).map(row => (
                                                <div key={row.rowNumber} className="flex gap-2 items-center justify-center">
                                                    <span className="w-6 text-xs text-gray-400">{row.rowNumber}</span>
                                                    {row.seats.map(seat => {
                                                    const isWrongClass = seat.seatclass?.toLowerCase() !== allowedClass;
                                                    const isOccupied = seat.seatStatus === "Occupied";
                                                    const isSelected = newSeatNumber === seat.seatNumber;

                                                    return (
                                                        <button
                                                            key={seat.seatNumber}
                                                            disabled={isOccupied || isWrongClass}                                                       
                                                            onClick={() => setNewSeatNumber(seat.seatNumber)}

                                                            className={`w-10 h-10 rounded-md text-xs font-bold border transition ${
                                                                isSelected 
                                                                ? "bg-blue-600 text-white border-blue-700" 
                                                                : isOccupied 
                                                                ? "bg-red-100 text-red-400 cursor-not-allowed border-red-200" 
                                                                : isWrongClass
                                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" // THE GRAY OUT STYLE
                                                                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                            }`}
                                                        >
                                                            {seat.letter}
                                                        </button>
                                                    );
                                                    })}
                                                </div>
                                            ))}
                                        </div>\
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Selected Seat</p>
                                        <p className="text-xl font-bold text-blue-900">{newSeatNumber || "None Selected"}</p>
                                    </div>
                                    <button 
                                        onClick={confirmSeatChange}
                                        disabled={!newSeatNumber}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg disabled:bg-gray-300 transition"
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