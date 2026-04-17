import { useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Dropdown from "../../components/common/Dropdown";
import api from "../../services/api";

const fillOptions = [
    { label: "All", value: "all" },
    { label: "Economy", value: "economy" },
    { label: "Business", value: "business" },
    { label: "First", value: "first" },
];

const fillModeOptions = [
    { label: "Seat Count", value: "seats" },
    { label: "Fill %", value: "percent" },
];

const paymentMethodOptions = [
    { label: "Visa", value: "Visa" },
    { label: "Mastercard", value: "Mastercard" },
    { label: "American Express", value: "American Express" },
    { label: "Discover", value: "Discover" },
];

export default function FlightAutoFill() {
    const [flightNum, setFlightNum] = useState("");
    const [fillMode, setFillMode] = useState("seats");
    const [seatCount, setSeatCount] = useState("");
    const [fillPercent, setFillPercent] = useState("70");
    const [fillClass, setFillClass] = useState("all");
    const [paymentMethod, setPaymentMethod] = useState("Visa");
    const [summary, setSummary] = useState(null);
    const [result, setResult] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const loadSummary = async () => {
        if (!flightNum.trim()) return;

        try {
            setError("");
            setResult(null);
            setLoadingSummary(true);

            const res = await api.get(
                `/admin/fill-flight/${flightNum.trim()}/summary`,
                { params: { fillClass } }
            );

            setSummary(res.data);

            if (fillMode === "seats") {
                setSeatCount(String(res.data.availableSeats));
            }
        } catch (err) {
            setSummary(null);
            setError(err?.response?.data?.message || "Failed to load flight summary.");
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");
            setResult(null);
            setSubmitting(true);

            const payload = {
                flightNum: Number(flightNum),
                fillMode,
                seatCount: fillMode === "seats" ? Number(seatCount) : null,
                fillPercent: fillMode === "percent" ? Number(fillPercent) : null,
                fillClass,
                paymentMethod,
            };

            const res = await api.post("/admin/fill-flight", payload);
            setResult(res.data);

            await loadSummary();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to fill flight.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Flight Auto Fill</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Internal admin tool for creating synthetic passengers/bookings/tickets.
                </p>
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {result && <p className="mb-4 text-sm text-green-600">{result.message}</p>}

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <TextInput
                            label="Flight #"
                            value={flightNum}
                            onChange={(e) => setFlightNum(e.target.value)}
                            placeholder="e.g. 30000"
                        />

                        <Dropdown
                            label="Fill Class"
                            value={fillClass}
                            onChange={(val) => setFillClass(val)}
                            options={fillOptions}
                        />

                        <div className="flex items-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={loadSummary}
                                disabled={!flightNum.trim() || loadingSummary}
                            >
                                {loadingSummary ? "Loading..." : "Load Flight"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Dropdown
                            label="Fill Mode"
                            value={fillMode}
                            onChange={(val) => setFillMode(val)}
                            options={fillModeOptions}
                        />

                        {fillMode === "seats" ? (
                            <TextInput
                                label="# of Seats"
                                type="number"
                                min="1"
                                value={seatCount}
                                onChange={(e) => setSeatCount(e.target.value)}
                            />
                        ) : (
                            <TextInput
                                label="Fill %"
                                type="number"
                                min="1"
                                max="100"
                                value={fillPercent}
                                onChange={(e) => setFillPercent(e.target.value)}
                                placeholder="e.g. 70"
                            />
                        )}

                        <Dropdown
                            label="Payment Method"
                            value={paymentMethod}
                            onChange={(val) => setPaymentMethod(val)}
                            options={paymentMethodOptions}
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={
                                !summary ||
                                submitting ||
                                (fillMode === "seats" && !seatCount) ||
                                (fillMode === "percent" && !fillPercent)
                            }
                        >
                            {submitting ? "Submitting..." : "Fill Flight"}
                        </Button>
                    </div>
                </form>
            </Card>

            {summary && (
                <Card className="mt-6 p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Flight Details</h2>

                    <div className="grid gap-4 md:grid-cols-2 text-sm">
                        <div>
                            <p><span className="font-medium">Flight #:</span> {summary.flightNum}</p>
                            <p><span className="font-medium">Route:</span> {summary.departingPort} → {summary.arrivingPort}</p>
                            <p><span className="font-medium">Status:</span> {summary.status}</p>
                        </div>
                        <div>
                            <p><span className="font-medium">Depart:</span> {new Date(summary.scheduledDepartLocal).toLocaleString()}</p>
                            <p><span className="font-medium">Arrive:</span> {new Date(summary.scheduledArrivalLocal).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-4 text-sm">
                        <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-medium">Total Seats</p>
                            <p>{summary.totalSeats}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-medium">Occupied</p>
                            <p>{summary.occupiedSeats}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-medium">Reserved</p>
                            <p>{summary.reservedSeats}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-medium">Available</p>
                            <p>{summary.availableSeats}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-medium">Mode</p>
                            <p>{fillMode === "percent" ? `${fillPercent}%` : `${seatCount || 0} seats`}</p>
                        </div>
                    </div>
                </Card>
            )}

            {result?.items?.length > 0 && (
                <Card className="mt-6 p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Created Records</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                            <tr className="text-left text-gray-500">
                                <th className="px-3 py-2">Seat</th>
                                <th className="px-3 py-2">Class</th>
                                <th className="px-3 py-2">Price</th>
                                <th className="px-3 py-2">Passenger</th>
                                <th className="px-3 py-2">Booking</th>
                                <th className="px-3 py-2">Ticket</th>
                            </tr>
                            </thead>
                            <tbody>
                            {result.items.map((item) => (
                                <tr key={item.ticketCode} className="border-t">
                                    <td className="px-3 py-2">{item.seatNumber}</td>
                                    <td className="px-3 py-2">{item.cabinClass}</td>
                                    <td className="px-3 py-2">{item.price}</td>
                                    <td className="px-3 py-2">{item.passengerId}</td>
                                    <td className="px-3 py-2">{item.bookingId}</td>
                                    <td className="px-3 py-2">{item.ticketCode}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
