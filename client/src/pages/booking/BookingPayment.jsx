import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { createBooking } from "../../services/bookingService";
import Button from "../../components/common/Button";

// ─── Helpers (Kept your exact logic) ──────────────────────────────────────────

function detectCardType(number) {
    const clean = number.replace(/\s/g, "");
    if (/^4/.test(clean)) return "Visa";
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
    if (/^3[47]/.test(clean)) return "Amex";
    if (/^6(?:011|5)/.test(clean)) return "Discover";
    return null;
}

function formatCardNumber(value) {
    const clean = value.replace(/\D/g, "");
    const isAmex = /^3[47]/.test(clean);
    if (isAmex) {
        return clean.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3").trim();
    }
    return clean.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function isValidPhone(phone) {
    return /^\+?[\d\s\-().]{7,15}$/.test(phone);
}

function isValidZip(zip) {
    return /^\d{5}(-\d{4})?$|^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(zip);
}

// ─── Sub-Components with Glass Styling ───────────────────────────────────────

const Field = ({ label, field, placeholder, type = "text", value, onChange, error }) => (
    <div className="space-y-1">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            {label}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            className={`w-full p-3 rounded-xl border transition-all outline-none shadow-sm ${
                error 
                ? "border-red-500 bg-red-50 text-red-900" 
                : "border-slate-200 bg-white/80 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            }`}
        />
        {error && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{error}</p>}
    </div>
);

export default function BookingPayment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Data from previous steps
    const booking = location.state || {};
    const { selectedItinerary, returnItinerary = null, searchParams, passengers = [], pricingSummary, seatSelections = {} } = booking;

    // Derived Summary Info
    const firstFlight = selectedItinerary?.flights?.[0];
    const lastFlight = selectedItinerary?.flights?.[selectedItinerary?.flights?.length - 1];
    const flightDetails = firstFlight
        ? returnItinerary
            ? `${firstFlight.departingPort} → ${lastFlight.arrivingPort} (Return)`
            : `${firstFlight.departingPort} → ${lastFlight.arrivingPort}`
        : "Unknown Flight";
    
    const totalPrice = pricingSummary?.total ?? 0;
    const passengerName = passengers[0] ? `${passengers[0].firstName} ${passengers[0].lastName}` : "Guest";
    const allFlights = [...(selectedItinerary?.flights ?? []), ...(returnItinerary?.flights ?? [])];

    // Form State
    const [form, setForm] = useState({
        cardNumber: "", cardName: "", expiry: "", cvv: "",
        phone: "", address: "", city: "", state: "", zip: "", country: ""
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const cardType = detectCardType(form.cardNumber);

    const handleChange = (field, value) => {
        if (field === "cardNumber") value = formatCardNumber(value);
        if (field === "expiry") value = value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);
        if (field === "cvv") value = value.replace(/\D/g, "").slice(0, cardType === "Amex" ? 4 : 3);
        
        setForm({ ...form, [field]: value });
        setErrors({ ...errors, [field]: "" });
    };

    const validate = () => {
        const newErrors = {};
        const clean = form.cardNumber.replace(/\s/g, "");
        const isAmex = cardType === "Amex";

        if (!cardType) newErrors.cardNumber = "Invalid card number";
        else if (isAmex && clean.length !== 15) newErrors.cardNumber = "Amex cards have 15 digits";
        else if (!isAmex && clean.length !== 16) newErrors.cardNumber = "Card must have 16 digits";

        if (!form.cardName.trim()) newErrors.cardName = "Name on card is required";

        const [month, year] = form.expiry.split("/");
        const now = new Date();
        if (!form.expiry || form.expiry.length < 5) newErrors.expiry = "Invalid expiry date";
        else {
            const expMonth = parseInt(month);
            const expYear = parseInt("20" + year);
            if (expMonth < 1 || expMonth > 12) newErrors.expiry = "Invalid month";
            else if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) 
                newErrors.expiry = "Card is expired";
        }

        const expectedCvv = isAmex ? 4 : 3;
        if (form.cvv.length !== expectedCvv) newErrors.cvv = `CVV must be ${expectedCvv} digits`;

        if (!isValidPhone(form.phone)) newErrors.phone = "Invalid phone number";
        if (!form.address.trim()) newErrors.address = "Address is required";
        if (!form.city.trim()) newErrors.city = "City is required";
        if (!form.state.trim()) newErrors.state = "State is required";
        if (!isValidZip(form.zip)) newErrors.zip = "Invalid zip code";
        if (!form.country.trim()) newErrors.country = "Country is required";

        return newErrors;
    };

    const handleSubmit = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        try {
            const resolvedUserId = user?.UserId || user?.userId || null;
            if (!resolvedUserId) {
                setErrors({ submit: "You must be logged in to pay." });
                setSubmitting(false);
                return;
            }

            const tickets = [];
            for (const flight of allFlights) {
                const origin = flight.departingPort || flight.departingPortCode;
                const destination = flight.arrivingPort || flight.arrivingPortCode;
                const boardingTime = new Date(flight.departTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                for (const passenger of passengers) {
                    const seat = seatSelections?.[flight.flightNum]?.[passenger.passengerId];
                    if (!seat) continue;

                    const cabinClass = searchParams?.cabinClass ?? "economy";
                    const fareBreakdown = selectedItinerary?.quote?.[cabinClass] ?? {};
                    const legPrice = passenger.passengerType === "Child" ? (fareBreakdown.perChild ?? 0) :
                                     passenger.passengerType === "Infant" ? (fareBreakdown.perInfant ?? 0) :
                                     (fareBreakdown.perAdult ?? 0);

                    tickets.push({ flightNum: flight.flightNum, passengerId: passenger.passengerId, seatNumber: seat, price: legPrice, origin, destination, boardingTime });
                }
            }

            const res = await createBooking({ userId: resolvedUserId, totalPrice: Number(totalPrice), cabinClass: searchParams?.cabinClass ?? "economy", paymentMethod: cardType, tickets });
            
            navigate("/booking/confirmation", {
                state: { ...res.data, passengerName, flightDetails, totalPrice, cardType, lastFour: form.cardNumber.slice(-4) }
            });

        } catch (err) {
            setErrors({ submit: err?.response?.data?.message || "Payment failed. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* ── Visual Summary Header ── */}
                <div className="bg-blue-600 backdrop-blur-md text-white p-8 rounded-[2rem] shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-blue-400/30">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">Total to Pay</p>
                        <h2 className="text-4xl font-black">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalPrice)}</h2>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 text-xs space-y-1">
                        <p><span className="opacity-60">Flight:</span> <span className="font-bold">{flightDetails}</span></p>
                        <p><span className="opacity-60">Passenger:</span> <span className="font-bold">{passengerName}</span></p>
                    </div>
                </div>

                {/* ── Payment Form ── */}
                <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/40">
                    <div className="space-y-8">
                        
                        {/* Card Section */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                                    <span className="w-8 h-1 bg-blue-600 rounded-full"/> Card Details
                                </h3>
                                {cardType && <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase">{cardType}</span>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <Field label="Card Number" field="cardNumber" placeholder="1234 5678 9012 3456" value={form.cardNumber} onChange={handleChange} error={errors.cardNumber} />
                                </div>
                                <Field label="Name on Card" field="cardName" placeholder="John Smith" value={form.cardName} onChange={handleChange} error={errors.cardName} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Expiry (MM/YY)" field="expiry" placeholder="MM/YY" value={form.expiry} onChange={handleChange} error={errors.expiry} />
                                    <Field label="CVV" field="cvv" placeholder="123" value={form.cvv} onChange={handleChange} error={errors.cvv} />
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-slate-100" />

                        {/* Billing Section */}
                        <section>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-1 bg-slate-300 rounded-full"/> Billing Address
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label="Phone Number" field="phone" placeholder="+1 (800) 000-0000" value={form.phone} onChange={handleChange} error={errors.phone} />
                                <Field label="Street Address" field="address" placeholder="123 Main St" value={form.address} onChange={handleChange} error={errors.address} />
                                <Field label="City" field="city" placeholder="Houston" value={form.city} onChange={handleChange} error={errors.city} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="State" field="state" placeholder="TX" value={form.state} onChange={handleChange} error={errors.state} />
                                    <Field label="Zip" field="zip" placeholder="77001" value={form.zip} onChange={handleChange} error={errors.zip} />
                                </div>
                                <div className="md:col-span-2">
                                    <Field label="Country" field="country" placeholder="USA" value={form.country} onChange={handleChange} error={errors.country} />
                                </div>
                            </div>
                        </section>

                        {errors.submit && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm font-bold animate-pulse">
                                ⚠️ {errors.submit}
                            </div>
                        )}

                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                            <button onClick={() => navigate(-1)} className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">
                                Back
                            </button>
                            <button 
                                onClick={handleSubmit} 
                                disabled={submitting} 
                                className="flex-[2] py-4 px-6 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
                            >
                                {submitting ? "Processing Payment..." : `Pay ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalPrice)}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}