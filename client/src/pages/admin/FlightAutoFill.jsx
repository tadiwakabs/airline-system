import { useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Dropdown from "../../components/common/Dropdown";
import api from "../../services/api";

const paymentMethodOptions = [
    { label: "Visa", value: "Visa" },
    { label: "Mastercard", value: "Mastercard" },
    { label: "American Express", value: "American Express" },
    { label: "Discover", value: "Discover" },
];

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

const modeOptions = [
    { label: "Single Flight", value: "single" },
    { label: "Fill Route", value: "route" },
];

export default function FlightAutoFill() {
    const [mode, setMode] = useState("single");

    // Single flight state
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

    // Route fill state
    const [departingPort, setDepartingPort] = useState("");
    const [arrivingPort, setArrivingPort] = useState("");
    const [routePaymentMethod, setRoutePaymentMethod] = useState("Visa");
    const [economyMin, setEconomyMin] = useState("50");
    const [economyMax, setEconomyMax] = useState("80");
    const [businessMin, setBusinessMin] = useState("40");
    const [businessMax, setBusinessMax] = useState("70");
    const [firstMin, setFirstMin] = useState("30");
    const [firstMax, setFirstMax] = useState("60");
    const [routeResult, setRouteResult] = useState(null);
    const [routeError, setRouteError] = useState("");
    const [routeSubmitting, setRouteSubmitting] = useState(false);

    const loadSummary = async () => {
        if (!flightNum.trim()) return;
        try {
            setError("");
            setResult(null);
            setLoadingSummary(true);
            const res = await api.get(`/admin/fill-flight/${flightNum.trim()}/summary`, { params: { fillClass } });
            setSummary(res.data);
            if (fillMode === "seats") setSeatCount(String(res.data.availableSeats));
        } catch (err) {
            setSummary(null);
            setError(err?.response?.data?.message || "Failed to load flight summary.");
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleSingleSubmit = async (e) => {
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

    const handleRouteSubmit = async (e) => {
        e.preventDefault();
        try {
            setRouteError("");
            setRouteResult(null);
            setRouteSubmitting(true);
            const payload = {
                departingPort: departingPort.trim().toUpperCase(),
                arrivingPort: arrivingPort.trim().toUpperCase(),
                paymentMethod: routePaymentMethod,
                economyMin: Number(economyMin),
                economyMax: Number(economyMax),
                businessMin: Number(businessMin),
                businessMax: Number(businessMax),
                firstMin: Number(firstMin),
                firstMax: Number(firstMax),
            };
            const res = await api.post("/admin/fill-flight/route", payload);
            setRouteResult(res.data);
        } catch (err) {
            setRouteError(err?.response?.data?.message || "Failed to fill route.");
        } finally {
            setRouteSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Flight Auto Fill</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Internal admin tool for creating synthetic passengers/bookings/tickets.
                    </p>
                </div>
                <div className="flex gap-2">
                    {modeOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setMode(opt.value)}
                            className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                                mode === opt.value
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Single Flight Mode */}
            {mode === 'single' && (
                <>
                    {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                    {result && <p className="mb-4 text-sm text-green-600">{result.message}</p>}

                    <Card className="p-6">
                        <form onSubmit={handleSingleSubmit} className="space-y-4">
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
                                {[
                                    { label: "Total Seats", value: summary.totalSeats },
                                    { label: "Occupied", value: summary.occupiedSeats },
                                    { label: "Reserved", value: summary.reservedSeats },
                                    { label: "Available", value: summary.availableSeats },
                                    { label: "Mode", value: fillMode === "percent" ? `${fillPercent}%` : `${seatCount || 0} seats` },
                                ].map(({ label, value }) => (
                                    <div key={label} className="rounded-lg bg-gray-50 p-3">
                                        <p className="font-medium">{label}</p>
                                        <p>{value}</p>
                                    </div>
                                ))}
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
                </>
            )}

            {/* Route Fill Mode */}
            {mode === 'route' && (
                <>
                    {routeError && <p className="mb-4 text-sm text-red-600">{routeError}</p>}
                    {routeResult && (
                        <p className="mb-4 text-sm text-green-600">{routeResult.message}</p>
                    )}

                    <Card className="p-6">
                        <form onSubmit={handleRouteSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                <TextInput
                                    label="Departing Port"
                                    value={departingPort}
                                    onChange={(e) => setDepartingPort(e.target.value)}
                                    placeholder="e.g. ATL"
                                />
                                <TextInput
                                    label="Arriving Port"
                                    value={arrivingPort}
                                    onChange={(e) => setArrivingPort(e.target.value)}
                                    placeholder="e.g. CDG"
                                />
                                <Dropdown
                                    label="Payment Method"
                                    value={routePaymentMethod}
                                    onChange={(val) => setRoutePaymentMethod(val)}
                                    options={paymentMethodOptions}
                                />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-3">Fill % Range per Cabin Class</p>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-lg border border-gray-200 p-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Economy</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <TextInput
                                                label="Min %"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={economyMin}
                                                onChange={(e) => setEconomyMin(e.target.value)}
                                            />
                                            <TextInput
                                                label="Max %"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={economyMax}
                                                onChange={(e) => setEconomyMax(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 p-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Business</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <TextInput
                                                label="Min %"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={businessMin}
                                                onChange={(e) => setBusinessMin(e.target.value)}
                                            />
                                            <TextInput
                                                label="Max %"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={businessMax}
                                                onChange={(e) => setBusinessMax(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 p-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">First Class</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <TextInput
                                                label="Min %"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={firstMin}
                                                onChange={(e) => setFirstMin(e.target.value)}
                                            />
                                            <TextInput
                                                label="Max %"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={firstMax}
                                                onChange={(e) => setFirstMax(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={!departingPort.trim() || !arrivingPort.trim() || routeSubmitting}
                            >
                                {routeSubmitting ? "Filling Route..." : "Fill All Flights on Route"}
                            </Button>
                        </form>
                    </Card>

                    {routeResult?.items?.length > 0 && (
                        <Card className="mt-6 p-6">
                            <h2 className="mb-1 text-lg font-semibold text-gray-900">Created Records</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                {routeResult.flightsProcessed} flights processed — {routeResult.totalCreated} bookings created
                            </p>
                            {routeResult.errors?.length > 0 && (
                                <div className="mb-4">
                                    {routeResult.errors.map((e, i) => (
                                        <p key={i} className="text-sm text-red-600">{e}</p>
                                    ))}
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500">
                                            <th className="px-3 py-2">Flight</th>
                                            <th className="px-3 py-2">Seat</th>
                                            <th className="px-3 py-2">Class</th>
                                            <th className="px-3 py-2">Fill %</th>
                                            <th className="px-3 py-2">Price</th>
                                            <th className="px-3 py-2">Ticket</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {routeResult.items.map((item, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="px-3 py-2">{item.flightNum}</td>
                                                <td className="px-3 py-2">{item.seatNumber}</td>
                                                <td className="px-3 py-2">{item.cabinClass}</td>
                                                <td className="px-3 py-2">{item.fillPct}%</td>
                                                <td className="px-3 py-2">{item.price}</td>
                                                <td className="px-3 py-2">{item.ticketCode}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}