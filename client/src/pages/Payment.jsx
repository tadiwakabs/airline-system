import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createPayment } from "../services/paymentService";
import { createBooking } from "../services/bookingService";

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

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Read state passed from BookingSeats
    const booking = location.state || {};
    const selectedItinerary = booking.selectedItinerary;
    const searchParams = booking.searchParams;
    const passengers = booking.passengers ?? [];
    const pricingSummary = booking.pricingSummary;
    const seatSelections = booking.seatSelections ?? {};

    // Build readable values for the summary
    const firstFlight = selectedItinerary?.flights?.[0];
    const lastFlight = selectedItinerary?.flights?.[selectedItinerary?.flights?.length - 1];
    const flightDetails = firstFlight
        ? `${firstFlight.departingPort} → ${lastFlight.arrivingPort}`
        : "Unknown Flight";
    const totalPrice = pricingSummary?.total ?? 0;
    const passengerName = passengers[0]
        ? `${passengers[0].firstName} ${passengers[0].lastName}`
        : "Guest";

    const firstPassengerId = passengers[0]?.passengerId;
    const firstFlightNum = firstFlight?.flightNum;
    const seatNumber = seatSelections?.[firstFlightNum]?.[firstPassengerId] ?? "N/A";

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
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
        if (!isValidZip(form.zip)) newErrors.zip = "Invalid zip/postal code";
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
            // 1. Create booking
            const bookingData = {
                UserId: user?.UserId || user?.userId || "test",
                totalPrice: Number(totalPrice)
            };

            const bookingRes = await createBooking(bookingData);
            const realBookingId = bookingRes.data.bookingId;

            // 2. Create payment using real bookingId
            const paymentData = {
                userId: user?.userId || "guest",
                bookingId: realBookingId,
                bookingPrice: totalPrice,
                totalPrice: totalPrice,
                paymentMethod: cardType,
                paymentStatus: 1
            };

            const paymentRes = await createPayment(paymentData);

            // 3. Navigate
            navigate("/booking/confirmation", {
                state: {
                    transactionId: paymentRes.data.transactionId,
                    bookingId: realBookingId,
                    passengerName: passengerName,
                    flightDetails: flightDetails,
                    seatNumber: seatNumber,
                    totalPrice: totalPrice,
                    cardType,
                    lastFour: form.cardNumber.replace(/\s/g, "").slice(-4),
                },
            });

        } catch (err) {
            console.error("FULL ERROR:", err);
            console.error("RESPONSE:", err?.response);
            console.error("DATA:", err?.response?.data);

            setErrors({ submit: "Payment failed. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-2">Payment</h1>

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
                        label="Card Number"
                        field="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={form.cardNumber}
                        onChange={handleChange}
                        error={errors.cardNumber}
                    />
                    <Field
                        label="Name on Card"
                        field="cardName"
                        placeholder="John Smith"
                        value={form.cardName}
                        onChange={handleChange}
                        error={errors.cardName}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label="Expiry (MM/YY)"
                            field="expiry"
                            placeholder="MM/YY"
                            value={form.expiry}
                            onChange={handleChange}
                            error={errors.expiry}
                        />
                        <Field
                            label="CVV"
                            field="cvv"
                            placeholder="123"
                            value={form.cvv}
                            onChange={handleChange}
                            error={errors.cvv}
                        />
                    </div>
                </div>
            </div>

            {/* Billing Address */}
            <div className="border rounded p-4 mb-6">
                <h2 className="font-semibold mb-3">Billing Address</h2>
                <div className="grid gap-3">
                    <Field
                        label="Phone Number"
                        field="phone"
                        placeholder="+1 (800) 000-0000"
                        value={form.phone}
                        onChange={handleChange}
                        error={errors.phone}
                    />
                    <Field
                        label="Address"
                        field="address"
                        placeholder="123 Main St"
                        value={form.address}
                        onChange={handleChange}
                        error={errors.address}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label="City"
                            field="city"
                            placeholder="Houston"
                            value={form.city}
                            onChange={handleChange}
                            error={errors.city}
                        />
                        <Field
                            label="State"
                            field="state"
                            placeholder="TX"
                            value={form.state}
                            onChange={handleChange}
                            error={errors.state}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label="Zip / Postal Code"
                            field="zip"
                            placeholder="77001"
                            value={form.zip}
                            onChange={handleChange}
                            error={errors.zip}
                        />
                        <Field
                            label="Country"
                            field="country"
                            placeholder="USA"
                            value={form.country}
                            onChange={handleChange}
                            error={errors.country}
                        />
                    </div>
                </div>
            </div>

            {errors.submit && <p className="text-red-500 mb-3">{errors.submit}</p>}

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