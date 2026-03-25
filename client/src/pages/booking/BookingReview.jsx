import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";

// ─── helpers ────────────────────────────────────────────────────────────────

function capitalize(value) {
    if (!value) return "";
    if (value === "first") return "First Class";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

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

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}


function buildPassengerLabel(type, indexWithinType) {
    return `${type} ${indexWithinType + 1}`;
}

// ─── price calculation ───────────────────────────────────────────────────────
// Rates mirror the backend constants in FlightsController.cs:
//   ChildMultiplier  = 0.8
//   InfantMultiplier = 0.1
// The backend already computes these in BuildQuote and returns them as
// selectedItinerary.quote[cabinClass].{ perAdult, perChild, perInfant, total }
// We use those values directly so the review page always matches what the
// backend calculated — no risk of drift if the multipliers ever change.

function usePriceBreakdown(selectedItinerary, searchParams) {
    return useMemo(() => {
        const cabinClass = searchParams?.cabinClass ?? "economy";
        const { adults = 0, children = 0, infants = 0 } =
        searchParams?.passengers ?? {};

        // quote is shaped as: { economy, business, first }
        // each cabin object: { perAdult, perChild, perInfant, total }
        const fareBreakdown = selectedItinerary?.quote?.[cabinClass] ?? {};

        const perAdult  = fareBreakdown.perAdult  ?? 0;
        const perChild  = fareBreakdown.perChild  ?? 0;
        const perInfant = fareBreakdown.perInfant ?? 0;

        const adultFare  = perAdult  * adults;
        const childFare  = perChild  * children;
        const infantFare = perInfant * infants;

        // Use the backend's pre-calculated total as the source of truth.
        // It equals adultFare + childFare + infantFare already rounded.
        const total = fareBreakdown.total ?? (adultFare + childFare + infantFare);

        return {
            perAdult,
            perChild,
            perInfant,
            adultFare,
            childFare,
            infantFare,
            total,
            adults,
            children,
            infants,
            cabinClass,
        };
    }, [selectedItinerary, searchParams]);
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }) {
    return (
        <h2 className="text-base font-semibold text-gray-800 mb-3">{children}</h2>
    );
}

function LabelValue({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {label}
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || "—"}</p>
        </div>
    );
}

function Divider() {
    return <hr className="border-gray-100 my-4" />;
}

function FlightSegment({ flight, index }) {
    return (
        <div className="flex items-start gap-4">
            {/* step indicator */}
            <div className="flex flex-col items-center pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" />
                {/* connector line — only shown between segments, handled by parent */}
            </div>

            <div className="flex-1 pb-4">
                <p className="text-xs text-gray-400 mb-1">Flight {flight.flightNum}</p>
                <div className="flex items-center gap-3">
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 leading-none">
                            {flight.departingPort}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {formatDateTime(flight.departTime)}
                        </p>
                    </div>

                    <div className="flex-1 flex items-center gap-1">
                        <div className="h-px flex-1 bg-gray-200" />
                        <svg
                            className="w-4 h-4 text-gray-400"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                        </svg>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 leading-none">
                            {flight.arrivingPort}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {formatDateTime(flight.arrivalTime)}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                        {flight.isDomestic ? "Domestic" : "International"}
                    </span>
                    {flight.aircraftUsed && (
                        <>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{flight.aircraftUsed}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function PassengerCard({ passenger, indexWithinType, isDomestic }) {
    const label = buildPassengerLabel(passenger.passengerType, indexWithinType);

    const hasPassport =
        !isDomestic &&
        (passenger.passportNumber ||
            passenger.passportCountryCode ||
            passenger.passportExpirationDate);

    const hasDL =
        isDomestic &&
        passenger.passengerType === "Adult" &&
        (passenger.dlNumber || passenger.dlState);

    return (
        <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-white">
            <p className="text-sm font-semibold text-gray-800">{label}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                <LabelValue
                    label="Name"
                    value={`${passenger.firstName} ${passenger.lastName}`.trim()}
                />
                <LabelValue label="Date of Birth" value={formatDate(passenger.dateOfBirth)} />
                <LabelValue label="Gender" value={capitalize(passenger.gender)} />
                {passenger.email && (
                    <LabelValue label="Email" value={passenger.email} />
                )}
                {passenger.phoneNumber && (
                    <LabelValue label="Phone" value={passenger.phoneNumber} />
                )}
            </div>

            {hasPassport && (
                <>
                    <Divider />
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Passport
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                        <LabelValue label="Passport No." value={passenger.passportNumber} />
                        <LabelValue label="Country" value={passenger.passportCountryCode} />
                        <LabelValue
                            label="Expiry"
                            value={formatDate(passenger.passportExpirationDate)}
                        />
                        {passenger.placeOfBirth && (
                            <LabelValue label="Place of Birth" value={passenger.placeOfBirth} />
                        )}
                        {passenger.nationality && (
                            <LabelValue label="Nationality" value={passenger.nationality} />
                        )}
                    </div>
                </>
            )}

            {hasDL && (
                <>
                    <Divider />
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        ID / Driver's License
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <LabelValue label="DL Number" value={passenger.dlNumber} />
                        <LabelValue label="State" value={passenger.dlState} />
                    </div>
                </>
            )}
        </div>
    );
}

function PriceRow({ label, value, sub, bold }) {
    return (
        <div className={`flex justify-between items-baseline ${bold ? "font-semibold" : ""}`}>
            <div>
                <span className={`${bold ? "text-gray-900" : "text-gray-600"} text-sm`}>
                    {label}
                </span>
                {sub && (
                    <span className="ml-1.5 text-xs text-gray-400">{sub}</span>
                )}
            </div>
            <span className={`text-sm ${bold ? "text-gray-900 text-base" : "text-gray-700"}`}>
                {value}
            </span>
        </div>
    );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function BookingReview() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const selectedItinerary = state?.selectedItinerary;
    const searchParams      = state?.searchParams;
    const passengers        = state?.passengers ?? [];

    // Guard: if state is missing, send user back
    useEffect(() => {
        if (!selectedItinerary || !searchParams || !passengers.length) {
            navigate("/flight-search");
        }
    }, [selectedItinerary, searchParams, passengers, navigate]);

    const pricing = usePriceBreakdown(selectedItinerary, searchParams);

    // Group passengers by type for labelling
    const passengersWithIndex = useMemo(() => {
        const counters = {};
        return passengers.map((p) => {
            const type = p.passengerType;
            counters[type] = (counters[type] ?? 0);
            const idx = counters[type];
            counters[type]++;
            return { ...p, indexWithinType: idx };
        });
    }, [passengers]);

    const isDomesticItinerary =
        selectedItinerary?.flights?.every((f) => f.isDomestic) ?? true;

    const handleBack = () => {
        navigate("/booking/passengers", {
            state: { selectedItinerary, searchParams, passengers },
        });
    };

    const handleConfirm = () => {
        navigate("/booking/payment", {
            state: {
                selectedItinerary,
                searchParams,
                passengers,
                pricingSummary: pricing,
            },
        });
    };

    if (!selectedItinerary || !searchParams) return null;

    const flights = selectedItinerary.flights ?? [];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-2xl font-semibold text-gray-900">Review Your Booking</h1>

                {/* ── Flight summary ── */}
                <Card className="p-5">
                    <SectionTitle>
                        {selectedItinerary.type === "connecting"
                            ? "Connecting Flight"
                            : "Direct Flight"}
                    </SectionTitle>

                    <div className="space-y-0">
                        {flights.map((flight, i) => (
                            <div key={i} className="relative">
                                <FlightSegment flight={flight} index={i} />
                                {/* connector line between segments */}
                                {i < flights.length - 1 && (
                                    <div className="absolute left-[4px] top-[22px] w-px bg-gray-200"
                                         style={{ height: "calc(100% - 10px)" }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <Divider />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <LabelValue label="Cabin" value={capitalize(searchParams.cabinClass)} />
                        <LabelValue label="Trip Type" value={capitalize(searchParams.flightType)} />
                        <LabelValue label="Date" value={formatDate(searchParams.dateDepart)} />
                        {searchParams.flightType === "return" && searchParams.dateReturn && (
                            <LabelValue
                                label="Return Date"
                                value={formatDate(searchParams.dateReturn)}
                            />
                        )}
                    </div>
                </Card>

                {/* ── Passengers ── */}
                <Card className="p-5">
                    <SectionTitle>Passengers</SectionTitle>
                    <div className="space-y-3">
                        {passengersWithIndex.map((passenger, i) => (
                            <PassengerCard
                                key={i}
                                passenger={passenger}
                                indexWithinType={passenger.indexWithinType}
                                isDomestic={isDomesticItinerary}
                            />
                        ))}
                    </div>
                </Card>

                {/* ── Price breakdown ── */}
                <Card className="p-5">
                    <SectionTitle>Price Breakdown</SectionTitle>

                    <div className="space-y-2.5">
                        {pricing.adults > 0 && (
                            <PriceRow
                                label={`Adults × ${pricing.adults}`}
                                sub={`${formatCurrency(pricing.perAdult)} each`}
                                value={formatCurrency(pricing.adultFare)}
                            />
                        )}
                        {pricing.children > 0 && (
                            <PriceRow
                                label={`Children × ${pricing.children}`}
                                sub={`${formatCurrency(pricing.perChild)} each (80%)`}
                                value={formatCurrency(pricing.childFare)}
                            />
                        )}
                        {pricing.infants > 0 && (
                            <PriceRow
                                label={`Infants × ${pricing.infants}`}
                                sub={`${formatCurrency(pricing.perInfant)} each (10%)`}
                                value={formatCurrency(pricing.infantFare)}
                            />
                        )}

                        <Divider />

                        <PriceRow
                            label="Total"
                            value={formatCurrency(pricing.total)}
                            bold
                        />
                    </div>
                </Card>

                {/* ── Actions ── */}
                <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={handleBack}>
                        Back
                    </Button>
                    <Button onClick={handleConfirm}>
                        Confirm & Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
