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

    // Single / multi-flight state
    const [flightNums, setFlightNums] = useState("");
    const [fillMode, setFillMode] = useState("seats");
    const [seatCount, setSeatCount] = useState("");
    const [fillPercentMin, setFillPercentMin] = useState("60");
    const [fillPercentMax, setFillPercentMax] = useState("80");
    const [fillClass, setFillClass] = useState("all");
    const [paymentMethod, setPaymentMethod] = useState("Visa");
    const [randomizeSeats, setRandomizeSeats] = useState(true);
    const [summary, setSummary] = useState(null);
    const [result, setResult] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Route fill state
    const [departingPort, setDepartingPort] = useState("");
    const [arrivingPort, setArrivingPort] = useState("");
    const [routeFillMode, setRouteFillMode] = useState("percent");
    const [routeSeatCount, setRouteSeatCount] = useState("");
    const [routeFillPercentMin, setRouteFillPercentMin] = useState("60");
    const [routeFillPercentMax, setRouteFillPercentMax] = useState("80");
    const [routeFillClass, setRouteFillClass] = useState("all");
    const [routePaymentMethod, setRoutePaymentMethod] = useState("Visa");
    const [routeRandomizeSeats, setRouteRandomizeSeats] = useState(true);
    const [routeResult, setRouteResult] = useState(null);
    const [routeError, setRouteError] = useState("");
    const [routeSubmitting, setRouteSubmitting] = useState(false);

    const loadSummary = async () => {
        const firstFlight = parsedFlightNums[0];
        if (!firstFlight) return;

        try {
            setError("");
            setResult(null);
            setLoadingSummary(true);

            const res = await api.get(`/admin/fill-flight/${firstFlight}/summary`, {
                params: { fillClass }
            });

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

    const parsedFlightNums = flightNums
        .split(",")
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => Number(v))
        .filter(v => !Number.isNaN(v));

    const handleSingleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");
            setResult(null);
            setSubmitting(true);

            if (parsedFlightNums.length === 0) {
                setError("Enter at least one flight number.");
                return;
            }

            const payload = {
                flightNums: parsedFlightNums,
                fillMode,
                seatCount: fillMode === "seats" ? Number(seatCount) : null,
                fillPercent: null,
                fillPercentMin: fillMode === "percent" ? Number(fillPercentMin) : null,
                fillPercentMax: fillMode === "percent" ? Number(fillPercentMax) : null,
                fillClass,
                paymentMethod,
                randomizeSeats,
            };

            const res = await api.post("/admin/fill-flight/batch", payload);
            setResult(res.data);

            await loadSummary();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to fill flights.");
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
                fillMode: routeFillMode,
                seatCount: routeFillMode === "seats" ? Number(routeSeatCount) : null,
                fillPercent: null,
                fillPercentMin: routeFillMode === "percent" ? Number(routeFillPercentMin) : null,
                fillPercentMax: routeFillMode === "percent" ? Number(routeFillPercentMax) : null,
                fillClass: routeFillClass,
                paymentMethod: routePaymentMethod,
                randomizeSeats: routeRandomizeSeats,
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
                                    label="Flight #s"
                                    value={flightNums}
                                    onChange={(e) => setFlightNums(e.target.value)}
                                    placeholder="e.g. 30000, 30001, 30002"
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
                                        disabled={parsedFlightNums.length === 0 || loadingSummary}
                                    >
                                        {loadingSummary ? "Loading..." : "Load First Flight"}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
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
                                    <div className="grid grid-cols-2 gap-2">
                                        <TextInput
                                            label="Min %"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={fillPercentMin}
                                            onChange={(e) => setFillPercentMin(e.target.value)}
                                        />
                                        <TextInput
                                            label="Max %"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={fillPercentMax}
                                            onChange={(e) => setFillPercentMax(e.target.value)}
                                        />
                                    </div>
                                )}

                                <Dropdown
                                    label="Payment Method"
                                    value={paymentMethod}
                                    onChange={(val) => setPaymentMethod(val)}
                                    options={paymentMethodOptions}
                                />

                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={randomizeSeats}
                                            onChange={(e) => setRandomizeSeats(e.target.checked)}
                                        />
                                        Randomize seats
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        parsedFlightNums.length === 0 ||
                                        (fillMode === "seats" && !seatCount) ||
                                        (fillMode === "percent" && (!fillPercentMin || !fillPercentMax))
                                    }
                                >
                                    {submitting ? "Submitting..." : "Fill Flights"}
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
                                    {
                                        label: "Mode",
                                        value:
                                            fillMode === "percent"
                                                ? `${fillPercentMin || 0}% - ${fillPercentMax || 0}%`
                                                : `${seatCount || 0} seats`
                                    },
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
                                        <th className="px-3 py-2">Flight</th>
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
                                            <td className="px-3 py-2">{item.flightNum}</td>
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
                                    label="Fill Class"
                                    value={routeFillClass}
                                    onChange={(val) => setRouteFillClass(val)}
                                    options={fillOptions}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
                                <Dropdown
                                    label="Fill Mode"
                                    value={routeFillMode}
                                    onChange={(val) => setRouteFillMode(val)}
                                    options={fillModeOptions}
                                />

                                {routeFillMode === "seats" ? (
                                    <TextInput
                                        label="# of Seats"
                                        type="number"
                                        min="1"
                                        value={routeSeatCount}
                                        onChange={(e) => setRouteSeatCount(e.target.value)}
                                    />
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <TextInput
                                            label="Min %"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={routeFillPercentMin}
                                            onChange={(e) => setRouteFillPercentMin(e.target.value)}
                                        />
                                        <TextInput
                                            label="Max %"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={routeFillPercentMax}
                                            onChange={(e) => setRouteFillPercentMax(e.target.value)}
                                        />
                                    </div>
                                )}

                                <Dropdown
                                    label="Payment Method"
                                    value={routePaymentMethod}
                                    onChange={(val) => setRoutePaymentMethod(val)}
                                    options={paymentMethodOptions}
                                />

                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={routeRandomizeSeats}
                                            onChange={(e) => setRouteRandomizeSeats(e.target.checked)}
                                        />
                                        Randomize seats
                                    </label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={
                                    !departingPort.trim() ||
                                    !arrivingPort.trim() ||
                                    routeSubmitting ||
                                    (routeFillMode === "seats" && !routeSeatCount) ||
                                    (routeFillMode === "percent" && (!routeFillPercentMin || !routeFillPercentMax))
                                }
                            >
                                {routeSubmitting ? "Filling Route..." : "Fill All Future Flights on Route"}
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
                                        <th className="px-3 py-2">Price</th>
                                        <th className="px-3 py-2">Passenger</th>
                                        <th className="px-3 py-2">Booking</th>
                                        <th className="px-3 py-2">Ticket</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {routeResult.items.map((item, i) => (
                                        <tr key={item.ticketCode ?? i} className="border-t">
                                            <td className="px-3 py-2">{item.flightNum}</td>
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
        </div>
    );
}