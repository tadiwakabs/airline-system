import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { createBooking } from "../../services/bookingService";
import { completePendingPayment } from "../../services/paymentService";
import { useFormErrors } from "../../utils/useFormErrors";

import FormError from "../../components/common/FormError";

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

const RequiredMark = () => <span className="text-red-500"> *</span>;

const emptyForm = {
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
};

const Field = ({ label, field, placeholder, type = "text", value, onChange, error }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            className={`w-full border px-3 py-2 rounded ${error ? "border-red-500" : "border-gray-300"}`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

export default function BookingPayment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const {errors:serverErrors,setErrors:setServerErrors,clearErrors}= useFormErrors();


    // Read state passed from BookingSeats
    const booking = location.state || {};
    const standbyBooking = booking.standbyBooking || null;
    const isStandbyPayment = !!standbyBooking;

    // Existing normal booking flow state
    const selectedItinerary = booking.selectedItinerary;
    const returnItinerary = booking.returnItinerary ?? null;
    const searchParams = booking.searchParams;
    const passengers = booking.passengers ?? [];
    const pricingSummary = booking.pricingSummary;
    const seatSelections = booking.seatSelections ?? {};

    // Existing booking summary values
    const firstFlight = selectedItinerary?.flights?.[0];
    const lastFlight = selectedItinerary?.flights?.[selectedItinerary?.flights?.length - 1];

    const normalFlightDetails = firstFlight
        ? returnItinerary
            ? `${firstFlight.departingPort} → ${lastFlight.arrivingPort} (return)`
            : `${firstFlight.departingPort} → ${lastFlight.arrivingPort}`
        : "Unknown Flight";

    const normalTotalPrice = pricingSummary?.total ?? 0;

    const normalPassengerName = passengers[0]
        ? `${passengers[0].firstName} ${passengers[0].lastName}`
        : "Guest";

    const allFlights = [
        ...(selectedItinerary?.flights ?? []),
        ...(returnItinerary?.flights ?? []),
    ];

    const firstPassengerId = passengers[0]?.passengerId;
    const firstFlightNum = firstFlight?.flightNum;
    const normalSeatNumber = seatSelections?.[firstFlightNum]?.[firstPassengerId] ?? "N/A";

    // Standby-aware summary values
    const totalPrice = isStandbyPayment
        ? Number(standbyBooking.totalPrice ?? 0)
        : normalTotalPrice;

    const passengerName = isStandbyPayment
        ? (
            user?.FirstName && user?.LastName
                ? `${user.FirstName} ${user.LastName}`
                : user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : "Standby Passenger"
        )
        : normalPassengerName;

    const flightDetails = isStandbyPayment
        ? `Flight ${standbyBooking.flightNum}`
        : normalFlightDetails;

    const seatNumber = isStandbyPayment
        ? standbyBooking.seatNumber ?? "N/A"
        : normalSeatNumber;

    const [form, setForm] = useState(emptyForm);
    const [localErrors,setLocalErrors]=useState({});
    const [submitting, setSubmitting] = useState(false);

    const cardType = detectCardType(form.cardNumber);

    const handleChange = (field, value) => {
        if (field === "cardNumber") {
            value = formatCardNumber(value);
        }
        if (field === "expiry") {
            value = value
                .replace(/\D/g, "")
                .replace(/(\d{2})(\d)/, "$1/$2")
                .slice(0, 5);
        }
        if (field === "cvv") {
            value = value.replace(/\D/g, "").slice(0, cardType === "Amex" ? 4 : 3);
        }
        setForm({ ...form, [field]: value });
        setLocalErrors({ ...localErrors, [field]: "" });
        clearErrors();
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
        const expMonth = parseInt(month);
        const expYear = parseInt("20" + year);
        if (!form.expiry || form.expiry.length < 5) newErrors.expiry = "Invalid expiry date";
        else if (expMonth < 1 || expMonth > 12) newErrors.expiry = "Invalid month";
        else if (
            expYear < now.getFullYear() ||
            (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)
        ) newErrors.expiry = "Card is expired";

        const expectedCvv = isAmex ? 4 : 3;
        if (form.cvv.length !== expectedCvv)
            newErrors.cvv = `CVV must be ${expectedCvv} digits`;

        if (!isValidPhone(form.phone)) newErrors.phone = "Invalid phone number";
        if (!form.address.trim()) newErrors.address = "Address is required";
        if (!form.city.trim()) newErrors.city = "City is required";
        if (!form.state.trim()) newErrors.state = "State is required";
        if (!isValidZip(form.zip)) newErrors.zip = "Invalid zip/postal code. Must be 5 digits";
        if (!form.country.trim()) newErrors.country = "Country is required";

        return newErrors;
    };

    const handleSubmit = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setLocalErrors(validationErrors);
            return;
        }
        clearErrors();
        setSubmitting(true);

        try {
            const resolvedUserId = user?.UserId || user?.userId || null;
            if (!resolvedUserId) {
                setServerErrors({ response:{ data:"You must be logged in before making a payment." }});
                setSubmitting(false);
                return;
            }

            // Standby payment path: complete existing pending payment
            if (isStandbyPayment) {
                const resolvedUserId = user?.UserId || user?.userId || null;

                const bookingPayload = {
                    userId: resolvedUserId,
                    totalPrice: Number(standbyBooking.totalPrice ?? 0),
                    cabinClass: "economy",           // standby is always economy
                    paymentMethod: cardType || "Card",
                    tickets: [
                        {
                            flightNum: standbyBooking.flightNum,
                            passengerId: standbyBooking.passengerId,
                            seatNumber: standbyBooking.seatNumber,
                            price: Number(standbyBooking.totalPrice ?? 0),
                            origin: standbyBooking.origin,
                            destination: standbyBooking.destination,
                            boardingTime: standbyBooking.boardingTime ?? "",
                        },
                    ],
                };

                const res = await createBooking(bookingPayload);
                const confirmation = res.data;

                navigate("/booking/confirmation", {
                    state: {
                        transactionId: confirmation.transactionId,
                        bookingId: confirmation.bookingId,
                        tickets: confirmation.tickets,
                        passengerName,
                        flightDetails,
                        totalPrice,
                        cardType,
                        lastFour: form.cardNumber.replace(/\s/g, "").slice(-4),
                    },
                });
                return;
            }

            // Existing normal booking flow below stays intact
            const tickets = [];
            for (const flight of allFlights) {
                const origin = flight.departingPort || flight.departingPortCode;
                const destination = flight.arrivingPort || flight.arrivingPortCode;
                const boardingTime = new Date(flight.departTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });

                for (const passenger of passengers) {
                    const selectedSeatNumber = seatSelections?.[flight.flightNum]?.[passenger.passengerId];
                    if (!selectedSeatNumber) continue;

                    // Per-passenger price for this leg from the quote
                    const cabinClass = searchParams?.cabinClass ?? "economy";
                    const fareBreakdown = selectedItinerary?.quote?.[cabinClass] ?? {};
                    const legPrice =
                        passenger.passengerType === "Child"
                            ? (fareBreakdown.perChild ?? 0)
                            : passenger.passengerType === "Infant"
                                ? (fareBreakdown.perInfant ?? 0)
                                : (fareBreakdown.perAdult ?? 0);

                    tickets.push({
                        flightNum: flight.flightNum,
                        passengerId: passenger.passengerId,
                        seatNumber: selectedSeatNumber,
                        price: legPrice,
                        origin,
                        destination,
                        boardingTime,
                    });
                }
            }

            const bookingPayload = {
                userId: resolvedUserId,
                totalPrice: Number(totalPrice),
                cabinClass: searchParams?.cabinClass ?? "economy",
                paymentMethod: cardType,
                tickets,
            };

            const res = await createBooking(bookingPayload);
            const confirmation = res.data;

            const cabinClassLabel =
                searchParams?.cabinClass?.toLowerCase() === "first"
                    ? "First Class"
                    : searchParams?.cabinClass?.toLowerCase() === "business"
                        ? "Business Class"
                        : "Economy Class";

            const ticketsWithDetails = (confirmation.tickets ?? []).map((ticket) => {
                const matchedPassenger = passengers.find(
                    (p) => p.passengerId === ticket.passengerId
                );

                return {
                    ...ticket,
                    passengerName: matchedPassenger
                        ? `${matchedPassenger.firstName} ${matchedPassenger.lastName}`
                        : "Unknown Passenger",
                    seatDisplay: ticket.seatNumber
                        ? `${ticket.seatNumber} (${cabinClassLabel})`
                        : "—",
                };
            });

            navigate("/booking/confirmation", {
                state: {
                    transactionId: confirmation.transactionId,
                    bookingId: confirmation.bookingId,
                    tickets: ticketsWithDetails,
                    passengerName,
                    flightDetails,
                    totalPrice,
                    cardType,
                    lastFour: form.cardNumber.replace(/\s/g, "").slice(-4),
                },
            });

        } catch (err) {
            setServerErrors(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-2">Payment</h1>

            <FormError errors={serverErrors}/>

            {/* Booking Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm">
                <p className="font-semibold text-blue-800 mb-1">Booking Summary</p>
                <p>Passenger: <span className="font-medium">{passengerName}</span></p>
                <p>Flight: <span className="font-medium">{flightDetails}</span></p>
                <p>Seat: <span className="font-medium">{seatNumber}</span></p>
                <p>Total: <span className="font-bold text-blue-700">${totalPrice}</span></p>
            </div>

            {/* Card Details */}
            <div className="border rounded p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Card Details</h2>
                    {cardType && (
                        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {cardType}
                        </span>
                    )}
                </div>
                <div className="grid gap-3">
                    <Field
                        label={<>Card Number<RequiredMark /></>}
                        field="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={form.cardNumber}
                        onChange={handleChange}
                        error={localErrors.cardNumber}
                    />
                    <Field
                        label={<>Name on Card<RequiredMark /></>}
                        field="cardName"
                        placeholder="John Smith"
                        value={form.cardName}
                        onChange={handleChange}
                        error={localErrors.cardName}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label={<>Expiry (MM/YY)<RequiredMark /></>}
                            field="expiry"
                            placeholder="MM/YY"
                            value={form.expiry}
                            onChange={handleChange}
                            error={localErrors.expiry}
                        />
                        <Field
                            label={<>CVV<RequiredMark /></>}
                            field="cvv"
                            placeholder="123"
                            value={form.cvv}
                            onChange={handleChange}
                            error={localErrors.cvv}
                        />
                    </div>
                </div>
            </div>

            {/* Billing Address */}
            <div className="border rounded p-4 mb-6">
                <h2 className="font-semibold mb-3">Billing Address</h2>
                <div className="grid gap-3">
                    <Field
                        label={<>Phone Number<RequiredMark /></>}
                        field="phone"
                        placeholder="+1 (800) 000-0000"
                        value={form.phone}
                        onChange={handleChange}
                        error={localErrors.phone}
                    />
                    <Field
                        label={<>Address<RequiredMark /></>}
                        field="address"
                        placeholder="123 Main St"
                        value={form.address}
                        onChange={handleChange}
                        error={localErrors.address}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label={<>City<RequiredMark /></>}
                            field="city"
                            placeholder="Houston"
                            value={form.city}
                            onChange={handleChange}
                            error={localErrors.city}
                        />
                        <Field
                            label={<>State<RequiredMark /></>}
                            field="state"
                            placeholder="TX"
                            value={form.state}
                            onChange={handleChange}
                            error={localErrors.state}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label={<>Zip / Postal Code<RequiredMark /></>}
                            field="zip"
                            placeholder="77001"
                            value={form.zip}
                            onChange={handleChange}
                            error={localErrors.zip}
                        />
                        <Field
                            label={<>Country<RequiredMark /></>}
                            field="country"
                            placeholder="USA"
                            value={form.country}
                            onChange={handleChange}
                            error={localErrors.country}
                        />
                    </div>
                </div>
            </div>

            
            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
                {submitting ? "Processing..." : `Pay $${totalPrice}`}
            </button>
        </div>
    );
}