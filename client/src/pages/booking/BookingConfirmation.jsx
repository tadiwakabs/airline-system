import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

const LabelValue = ({ label, value, mono = false }) => (
    <div className="flex justify-between items-baseline py-1">
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</span>
        <span className={`text-sm font-bold text-gray-900 ${mono ? "font-mono" : ""}`}>
            {value || "—"}
        </span>
    </div>
);

export default function Confirmation() {
    const { state } = useLocation();
    const navigate = useNavigate();

    if (!state) {
        return (
            <div className="max-w-lg mx-auto p-12 text-center bg-white/90 backdrop-blur rounded-3xl mt-20">
                <p className="text-gray-500 font-bold">No confirmation data found.</p>
                <Button onClick={() => navigate("/")} className="mt-4">
                    Go Home
                </Button>
            </div>
        );
    }

    const tickets = state.tickets ?? [];
    const totalPrice = state.totalPrice ?? 0;

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            
            {/* ── Payment Success Header (Now inside a Card for visibility) ── */}
            <Card className="p-8 text-center bg-white shadow-2xl rounded-[2rem] border-none">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <span className="text-green-600 text-4xl font-black">✓</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">
                    Payment Successful!
                </h1>
                <p className="text-gray-500 font-medium mt-2">
                    Your booking has been confirmed and tickets are issued.
                </p>
            </Card>

            <Card className="p-6 bg-white shadow-2xl rounded-[2rem] border-none space-y-8">
                
                {/* ── Transaction Details ── */}
                <section>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4 px-1">
                        Transaction Info
                    </h2>
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                        <LabelValue label="Transaction ID" value={`TXN-${state.transactionId}`} mono />
                        <LabelValue label="Booking Ref" value={state.bookingId} mono />
                        <LabelValue label="Amount Paid" value={formatCurrency(totalPrice)} />
                        <LabelValue label="Card" value={`${state.cardType} •••• ${state.lastFour}`} />
                    </div>
                </section>

                {/* ── Ticket Details ── */}
                <section>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4 px-1">
                        Boarding Passes
                    </h2>
                    <div className="space-y-4">
                        {tickets.map((ticket, index) => (
                            <div 
                                key={index}
                                className="border border-gray-100 rounded-2xl p-5 hover:border-blue-100 transition-colors"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-lg font-black text-gray-900">
                                        {ticket.origin} <span className="text-blue-500 mx-1">→</span> {ticket.destination}
                                    </p>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
                                        Flight #{ticket.flightNum}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-y-2">
                                    <LabelValue label="Passenger" value={ticket.passengerName} />
                                    <LabelValue label="Ticket Code" value={ticket.ticketCode} mono />
                                    <LabelValue label="Seat" value={ticket.seatDisplay || ticket.seatNumber} />
                                    
                                    {/* Boarding Section (Time + Date) */}
                                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-50">
                                        <span className="text-xs font-medium uppercase text-gray-400">Boarding</span>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-blue-600">
                                                {ticket.boardingTime}
                                            </p>
                                            <p className="text-[11px] font-bold text-gray-500 uppercase">
                                                {formatDate(state.dateDepart || new Date())}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Final Actions ── */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button 
                        onClick={() => navigate("/manage")} 
                        variant="outline" 
                        className="w-full py-4 rounded-xl border-slate-200 text-slate-600 font-bold"
                    >
                        Manage Bookings
                    </Button>

                    <Button 
                        onClick={() => navigate("/")} 
                        className="w-full py-4 rounded-xl shadow-xl shadow-blue-600/20 font-bold"
                    >
                        Back to Home
                    </Button>
                </div>
                
            </Card>
        </div>
    );
}
