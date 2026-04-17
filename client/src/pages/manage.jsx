import React, { useState, useEffect,useMemo } from 'react';
import api from '../services/api'; 
import { getSeatsForFlight } from "../services/seatingService"; 
import { useNavigate } from "react-router-dom";


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
        if (!match) continue;
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

function seatClassMatches(seatClass, cabinClass) {
    return String(seatClass || "").toLowerCase() === String(cabinClass || "").toLowerCase();
}

function getSeatVisualState(seat, allowedClass, selectedPassengerId, selectedSeatNumber) {
    const seatClass = seat.seatclass;
    const status = seat.seatStatus;

    if (!seatClassMatches(seatClass, allowedClass)) return "wrong-class";
    if (status === "Occupied") return "occupied";
    if (status === "Reserved" && seat.passengerId !== selectedPassengerId) return "reserved";
    if (seat.seatNumber === selectedSeatNumber) return "selected";
    return "available";
}

function seatButtonClass(state) {
    const base =
        "w-11 h-11 rounded-lg border text-sm font-semibold transition-colors";

    switch (state) {
        case "selected":
            return `${base} bg-blue-600 text-white border-blue-600`;
        case "occupied":
            return `${base} bg-red-100 text-red-600 border-red-200 cursor-not-allowed`;
        case "reserved":
            return `${base} bg-amber-100 text-amber-700 border-amber-200 cursor-not-allowed`;
        case "wrong-class":
            return `${base} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`;
        default:
            return `${base} bg-green-50 text-green-700 border-green-200 hover:bg-green-100`;
    }
}

function getCabinSection(rowNumber) {
    if (rowNumber >= 1 && rowNumber <= 4) return "First Class";
    if (rowNumber >= 5 && rowNumber <= 10) return "Business Class";
    return "Economy Class";
}

function shouldShowSectionDivider(currentRow, previousRow) {
    if (previousRow == null) return true;
    return getCabinSection(currentRow) !== getCabinSection(previousRow);
}

function PlaneLegend() {
    return (
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-green-50 border border-green-200 inline-block" />
                Available
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-blue-600 inline-block" />
                Selected
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-red-100 border border-red-200 inline-block" />
                Occupied
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-amber-100 border border-amber-200 inline-block" />
                Reserved
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-gray-100 border border-gray-200 inline-block" />
                Unavailable
            </div>
        </div>
    );
}

function SeatMap({
                     seats,
                     allowedClass,
                     selectedPassengerId,
                     selectedSeatNumber,
                     onSelectSeat,
                 }) {
    const rows = useMemo(() => groupSeatsForRender(seats), [seats]);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mx-auto mb-6 w-40 rounded-t-full border border-gray-200 bg-gray-50 py-2 text-center text-xs font-medium text-gray-500">
                Front of aircraft
            </div>

            <div className="space-y-2">
                {rows.map((row, index) => {
                    const previousRowNumber = index > 0 ? rows[index - 1].rowNumber : null;
                    const showDivider = shouldShowSectionDivider(row.rowNumber, previousRowNumber);

                    const seatLetters = row.seats.map((s) => s.letter);
                    const left = row.seats.filter((s) => ["A", "B", "C"].includes(s.letter));
                    const right = row.seats.filter((s) => ["D", "E", "F"].includes(s.letter));
                    const compact = !seatLetters.includes("E") && !seatLetters.includes("F");

                    return (
                        <div key={row.rowNumber} className="space-y-2">
                            {showDivider && (
                                <div className="flex items-center gap-3 py-2">
                                    <div className="h-px flex-1 bg-gray-200" />
                                    <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                        {getCabinSection(row.rowNumber)}
                                    </div>
                                    <div className="h-px flex-1 bg-gray-200" />
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-3">
                                <div className="w-8 text-right text-xs font-medium text-gray-400">
                                    {row.rowNumber}
                                </div>

                                <div className="flex items-center gap-2">
                                    {(compact ? row.seats.slice(0, 2) : left).map((seat) => {
                                        const state = getSeatVisualState(
                                            seat,
                                            allowedClass,
                                            selectedPassengerId,
                                            selectedSeatNumber
                                        );

                                        return (
                                            <button
                                                key={seat.seatNumber}
                                                type="button"
                                                className={seatButtonClass(state)}
                                                disabled={state !== "available" && state !== "selected"}
                                                onClick={() => onSelectSeat(seat)}
                                            >
                                                {seat.letter}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="w-8 text-center text-[10px] uppercase tracking-wide text-gray-300">
                                    aisle
                                </div>

                                <div className="flex items-center gap-2">
                                    {(compact ? row.seats.slice(2) : right).map((seat) => {
                                        const state = getSeatVisualState(
                                            seat,
                                            allowedClass,
                                            selectedPassengerId,
                                            selectedSeatNumber
                                        );

                                        return (
                                            <button
                                                key={seat.seatNumber}
                                                type="button"
                                                className={seatButtonClass(state)}
                                                disabled={state !== "available" && state !== "selected"}
                                                onClick={() => onSelectSeat(seat)}
                                            >
                                                {seat.letter}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


const ManageBooking = () => {
    const [bookings, setBookings] = useState([]);
    const [flightDetails,setFlightDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [availableSeats, setAvailableSeats] = useState([]);
    const [newSeatNumber, setNewSeatNumber] = useState("");
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [allowedClass, setAllowedClass] = useState("economy");
    const [targetFlight, setTargetFlight] = useState(null);
    const navigate = useNavigate();

    
    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
    try {
        setLoading(true);
        const response = await api.get('/Booking/myBooking');
        setBookings(response.data);
    } catch (err) { 
        console.error("Fetch failed", err); 
    } finally { 
        setLoading(false); 
    }
};

    const groupedBookings = useMemo(() => {
            return bookings.map(booking => {
                // Group tickets by flightCode so passengers on the same flight are together
                const flightMap = booking.tickets.reduce((acc, ticket) => {
                    const code = ticket.flightCode;
                    if (!acc[code]) {
                        acc[code] = { 
                            flightInfo: ticket.flight, 
                            passengers: [] 
                        };
                    }
                    acc[code].passengers.push(ticket);
                    return acc;
                }, {});

                return { ...booking, flights: Object.values(flightMap) };
            });
        }, [bookings]
    );

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
    
    const openSeatModal = async (ticket, flightInfo) => {
    setSelectedTicket(ticket);
    setTargetFlight(flightInfo);
    
    setLoadingSeats(true);
    setNewSeatNumber("");
    
    setAllowedClass(ticket.ticketClass?.toLowerCase() || "economy");

    try {
        const seatRes = await getSeatsForFlight(flightInfo.flightNum); 
        setAvailableSeats(seatRes.data);
    } catch (err) { 
        console.error("Seat load error:", err);
        alert("Error loading seats"); 
        setSelectedTicket(null); // Reset on error
    } finally { 
        setLoadingSeats(false); 
    }
};

    const handleCloseModal = () => setSelectedTicket(null);

    const confirmSeatChange = async () => {
        try {
            await api.put(`Ticket/${selectedTicket.ticketCode}/change-seat`, 
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

        {/*--Empty State---*/}
        {groupedBookings.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
                <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-gray-900">No trips found</h2>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium">
                    It looks like you haven't booked any flights yet. Ready to start your next adventure?
                </p>
                <button 
                    onClick={() => navigate('/')} 
                    className="mt-8 px-8 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-100 hover:scale-105 transition-all"
                >
                    Book a Flight
                </button>
            </div>
        ):(
        <div className="space-y-6">
            {(groupedBookings|| [])
                    .filter((b) => b.bookingStatus !== "Cancelled" )
                    .map((b) => {
                const flight = flightDetails[b.bookingId];
                const isCancelled = b.bookingStatus === "Cancelled" || b.bookingStatus === 2;
                

                return (
                    <div key={b.bookingId} className="bg-white rounded-2xl border border-gray-100 shadow-lg mb-8 overflow-hidden">
                        <div className="p-8">
                            
                            <div className="flex items-center gap-4 mb-8">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded-full uppercase">
                                    Ref: {b.bookingId.substring(0, 8)}
                                </span>
                                <div className="h-2.5 w-2.5 rounded-full" />
                                <span className="text-sm font-bold text-gray-700"></span>
                            </div>

                            {/* --- NESTED FLIGHTS LOOP --- */}
                            {b.flights.map((flightGroup, index) => (
                                <div key={index} className="mt-10 pt-10 first:mt-0 first:pt-0 border-t border-dashed border-gray-100 relative">
                                    {/* Outbound/Return indicator */}
                                    {b.flights.length > 1 && (
                                        <p className="absolute top-3 left-0 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                            {index === 0 ? "Outbound Flight" : "Return Flight"}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-6 py-2">
                                        <div className="text-center min-w-[80px]">
                                            <p className="text-3xl font-black text-gray-900">{flightGroup.flightInfo.departingPortCode}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Departure</p>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="h-px flex-1 bg-gray-200" />
                                            <svg className="w-5 h-5 text-blue-500 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" /></svg>
                                            <div className="h-px flex-1 bg-gray-200" />
                                        </div>
                                        <div className="text-center min-w-[80px]">
                                            <p className="text-3xl font-black text-gray-900">{flightGroup.flightInfo.arrivingPortCode}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Arrival</p>
                                        </div>
                                    </div>

                                    {/* ---INFO ROW --- */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-y-6 gap-x-4 mt-8 pt-6 border-t border-gray-100">
                                        <div>
                                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-wider mb-1">Departure</p>
                                            <p className="text-base font-bold text-gray-900">
                                                {new Date(flightGroup.flightInfo.departTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            <p className="text-sm font-medium text-gray-500">{formatDateTime(flightGroup.flightInfo.departTime)}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-wider mb-1">Arrival Est.</p>
                                            <p className="text-base font-bold text-gray-900">
                                                {flightGroup.flightInfo.arrivalTime ? new Date(flightGroup.flightInfo.arrivalTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Same Day"}
                                            </p>
                                            <p className="text-sm font-medium text-gray-500">
                                                {flightGroup.flightInfo.arrivalTime ? formatDateTime(flightGroup.flightInfo.arrivalTime) : "TBD"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-wider mb-1">Flight Details</p>
                                            <p className="text-base font-bold text-gray-900">#{flightGroup.flightInfo.flightNum}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-wider mb-1">Cabin Class</p>
                                            <p className="text-base font-bold text-blue-600 uppercase tracking-tight">
                                                {flightGroup.passengers[0]?.ticketClass || "Economy"}
                                            </p>
                                        </div>

                                        <div className="md:text-right">
                                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-wider mb-1"> Flight Status</p>
                                            <p className="text-s font-black text-green-600 uppercase">On Time</p>
                                        </div>
                                    </div>

                                    {/* PASSENGER SECTION (New Logic, Classy Look) */}
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {flightGroup.passengers.map(ticket => (
                                            <div key={ticket.ticketCode} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                                                <div>
                                            
                                                    <p className="font-black text-gray-900">
                                                        {ticket.passenger?.firstName} {ticket.passenger?.lastName}
                                                    </p>
                                                    <p className="text-s font-bold text-gray-500">Seat <span className="text-blue-600 font-black">{ticket.seatNumber}</span></p>
                                                </div>
                                                <button 
                                                    onClick={() => openSeatModal(ticket, flightGroup.flightInfo)}
                                                    disabled={isCancelled}
                                                    className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-all"
                                                >
                                                    Change Seat
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* General Actions (Cancel) */}
                        <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end">
                            {!isCancelled && (
                                <button 
                                    onClick={() => handleCancelBooking(b.bookingId)}
                                    className="px-8 py-3 bg-red-50 text-red-600 font-bold text-sm rounded-xl transition-all hover:bg-red-100 active:scale-95"
                                >
                                    Cancel Entire Itinerary
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}           
        </div>)
        }

        {/* SEAT SELECTION MODAL */}
        {selectedTicket && (
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
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Passenger</p>
                                        <p className="font-medium text-gray-900">
                                            {selectedTicket?.passenger?.firstName} {selectedTicket?.passenger?.lastName}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Selected seat</p>
                                        <p className="font-medium text-gray-900">
                                            {newSeatNumber || selectedTicket?.seatNumber || "None"}
                                        </p>
                                    </div>
                                </div>

                                <PlaneLegend />

                                <SeatMap
                                    seats={availableSeats}
                                    allowedClass={allowedClass}
                                    selectedPassengerId={selectedTicket?.passengerId}
                                    selectedSeatNumber={newSeatNumber || selectedTicket?.seatNumber}
                                    onSelectSeat={(seat) => setNewSeatNumber(seat.seatNumber)}
                                />
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