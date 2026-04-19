import { useState } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import Separator from "../common/Separator";

function parseLocalDateTime(value) {
    if (!value) return null;

    const raw = String(value).trim();
    const [datePart, timePart = ""] = raw.split("T");
    if (!datePart) return null;

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0] = timePart.split(":").map(Number);

    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day, hour, minute);
}

function arrivesNextDay(departValue, arrivalValue) {
    const depart = parseLocalDateTime(departValue);
    const arrival = parseLocalDateTime(arrivalValue);

    if (!depart || !arrival) return false;

    return (
        arrival.getFullYear() > depart.getFullYear() ||
        arrival.getMonth() > depart.getMonth() ||
        arrival.getDate() > depart.getDate()
    );
}

function formatTime(value) {
    const d = parseLocalDateTime(value);
    if (!d) return "—";

    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDuration(startUtc, endUtc) {
    if (!startUtc || !endUtc) return "—";

    const diff = Math.max(0, (new Date(endUtc) - new Date(startUtc)) / 1000 / 60);
    const hours = Math.floor(diff / 60);
    const mins = Math.round(diff % 60);

    return `${hours}h ${mins}m`;
}

function formatDate(value) {
    const d = parseLocalDateTime(value);
    if (!d) return "—";

    return d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function getBasePrice(pricing, cabinClass) {
    if (!pricing) return 0;
    return pricing[cabinClass] ?? 0;
}

function calculateTotal(basePrice, passengers) {
    if (!passengers) return basePrice;

    const adults = passengers.adults || 0;
    const children = passengers.children || 0;
    const infants = passengers.infants || 0;

    const adultFare = basePrice;
    const childFare = basePrice * 0.8;
    const infantFare = basePrice * 0.1;

    return (
        adults * adultFare +
        children * childFare +
        infants * infantFare
    );
}

function getSelectedQuote(quote, cabinClass) {
    if (!quote) return null;
    if (cabinClass === "business") return quote.business;
    if (cabinClass === "first") return quote.first;
    return quote.economy;
}

function formatMoney(value) {
    if (value == null) return "—";
    return Number(value).toFixed(2);
}

export default function FlightCard({
       type,
       flights,
       pricing,
       quote,
       cabinClass = "economy",
       passengers,
       onSelect,
    }) {
    const [expanded, setExpanded] = useState(false);

    const first = flights[0];
    const last = flights[flights.length - 1];
    const arrivalNextDay = arrivesNextDay(first.departTime, last.arrivalTime);

    const totalDuration = formatDuration(first.departTimeUtc, last.arrivalTimeUtc);

    const basePrice = getBasePrice(pricing, cabinClass || "economy");
    const selectedQuote = getSelectedQuote(quote, cabinClass);

    return (
        <Card className="p-5 space-y-4">
            {/* Top Row */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500">
                        {type === "direct" ? "Direct Flight" : "Connecting Flight"}
                    </p>
                    <p className="text-lg font-semibold">
                        {first.departingPort} → {last.arrivingPort}
                    </p>
                    <p className="text-sm text-gray-500">
                        {formatDate(first.departTime)}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{totalDuration}</p>
                </div>
            </div>

            {/* Times */}
            <div className="flex justify-between text-sm">
                <div>
                    <p className="font-medium">{formatTime(first.departTime)}</p>
                    <p className="text-gray-500">{first.departingPort}</p>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="h-px w-full bg-gray-300" />
                </div>

                <div className="text-right">
                    <p className="font-medium">
                        {formatTime(last.arrivalTime)}
                        {arrivalNextDay && (
                            <span className="ml-2 text-xs font-semibold text-blue-600 align-middle">+1</span>
                        )}
                    </p>
                    <p className="text-gray-500">{last.arrivingPort}</p>
                </div>
            </div>

            {/* Pricing */}
            <div className="flex justify-between items-center text-sm">
                <div>
                    <p className="text-gray-500">Price per adult</p>
                    <p className="font-medium">${formatMoney(selectedQuote?.perAdult)}</p>
                </div>

                <div className="text-right">
                    <p className="text-gray-500">Estimated total</p>
                    <p className="font-semibold">${formatMoney(selectedQuote?.total)}</p>
                    {passengers && (
                        <p className="text-xs text-right text-gray-500">
                            {passengers.adults || 0} Adult{passengers.adults > 1 ? "s" : ""}
                            {passengers.children ? `, ${passengers.children} Child${passengers.children > 1 ? "ren" : ""}` : ""}
                            {passengers.infants ? `, ${passengers.infants} Infant${passengers.infants > 1 ? "s" : ""}` : ""}
                        </p>
                    )}
                </div>
                
            </div>
            

            <Separator />

            {/* Expand Button */}
            <div className="flex justify-between items-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? "Hide Details" : "View Details"}
                </Button>

                <Button
                    onClick={() =>
                        onSelect?.({
                            type,
                            flights,
                            pricing,
                            quote,
                            cabinClass,
                            passengers,
                        })
                    }
                >
                    Select
                </Button>
            </div>

            {/* Expanded Section */}
            {expanded && (
                <div className="space-y-3 text-sm">
                    {flights.map((f, i) => (
                        <div key={i} className="flex justify-between">
                            <div>
                                <p className="font-medium">
                                    {f.departingPort} → {f.arrivingPort}
                                </p>
                                <p className="text-gray-500">
                                    {formatDate(f.departTime)} • {formatTime(f.departTime)} - {formatDate(f.arrivalTime)} • {formatTime(f.arrivalTime)}
                                    {arrivesNextDay(f.departTime, f.arrivalTime) && (
                                        <span className="ml-2 text-xs font-semibold text-blue-600">+1</span>
                                    )}
                                </p>
                            </div>
                            <p>Flight #{f.flightNum}</p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
