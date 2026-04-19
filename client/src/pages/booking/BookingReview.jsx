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
    }).format(amount ?? 0);
}

function buildPassengerLabel(type, indexWithinType) {
    return `${type} ${indexWithinType + 1}`;
}

// ─── price calculation ───────────────────────────────────────────────────────

const TAX_RATE = 0.075;

function usePriceBreakdown(selectedItinerary, searchParams) {
    return useMemo(() => {
        const cabinClass = searchParams?.cabinClass ?? "economy";
        const { adults = 0, children = 0, infants = 0 } = searchParams?.passengers ?? {};

        const fareBreakdown = selectedItinerary?.quote?.[cabinClass] ?? {};

        const perAdult = fareBreakdown.perAdult ?? 0;
        const perChild = fareBreakdown.perChild ?? 0;
        const perInfant = fareBreakdown.perInfant ?? 0;

        const adultFare = perAdult * adults;
        const childFare = perChild * children;
        const infantFare = perInfant * infants;

        const subtotal = fareBreakdown.total ?? (adultFare + childFare + infantFare);
        const taxAmount = subtotal * TAX_RATE;
        const total = subtotal + taxAmount;

        return {
            perAdult,
            perChild,
            perInfant,
            adultFare,
            childFare,
            infantFare,
            subtotal,
            taxAmount,
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
    return <h2 className="text-base font-semibold text-gray-800 mb-3">{children}</h2>;
}

function LabelValue({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || "—"}</p>
        </div>
    );
}

function Divider() {
    return <hr className="border-gray-100 my-4" />;
}

function FlightSegment({ flight }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex flex-col items-center pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" />
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
        <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-white/90 backdrop-blur-sm">
            <p className="text-sm font-semibold text-gray-800">{label}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                <LabelValue
                    label="Name"
                    value={`${passenger.firstName} ${passenger.lastName}`.trim()}
                />
                <LabelValue label="Date of Birth" value={formatDate(passenger.dateOfBirth)} />
                <LabelValue label="Gender" value={capitalize(passenger.gender)} />
                {passenger.email && <LabelValue label="Email" value={passenger.email} />}
                {passenger.phoneNumber && <LabelValue label="Phone" value={passenger.phoneNumber} />}
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

function PriceRow({ label, value, sub, bold, isTotal }) {
    return (
        <div className={`flex justify-between items-baseline ${bold ? "font-bold" : ""}`}>
            <div>
                <span className={`${bold ? "text-gray-900" : "text-gray-600"} text-sm`}>
                    {label}
                </span>
                {sub && <span className="ml-1.5 text-xs text-gray-400">{sub}</span>}
            </div>
            <span
                className={`text-sm ${
                    isTotal ? "text-blue-600 text-xl" : bold ? "text-gray-900" : "text-gray-700"
                }`}
            >
                {value}
            </span>
        </div>
    );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function BookingReview() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const standbyBooking = state?.standbyBooking ?? null;
    const isStandbyBooking = !!standbyBooking;

    const selectedItinerary = state?.selectedItinerary;
    const searchParams = state?.searchParams;
    const passengers = state?.passengers ?? [];
    const returnItinerary = state?.returnItinerary ?? null;

    useEffect(() => {
        if (!isStandbyBooking && (!selectedItinerary || !searchParams || !passengers.length)) {
            navigate("/flight-search");
        }
    }, [isStandbyBooking, selectedItinerary, searchParams, passengers, navigate]);

    const pricing = usePriceBreakdown(selectedItinerary, searchParams);
    const returnPricing = usePriceBreakdown(returnItinerary, searchParams);

    const totalTax = pricing.taxAmount + (returnItinerary ? returnPricing.taxAmount : 0);
    const combinedSubtotal =
        pricing.subtotal + (returnItinerary ? returnPricing.subtotal : 0);
    const combinedTotal = pricing.total + (returnItinerary ? returnPricing.total : 0);

    const passengersWithIndex = useMemo(() => {
        const counters = {};
        return passengers.map((p) => {
            const type = p.passengerType;
            counters[type] = counters[type] ?? 0;
            const idx = counters[type];
            counters[type]++;
            return { ...p, indexWithinType: idx };
        });
    }, [passengers]);

    const isDomesticItinerary =
        selectedItinerary?.flights?.every((f) => f.isDomestic) ?? true;

    const handleBack = () => {
        if (isStandbyBooking) {
            navigate("/profile", {
                state: { defaultTab: "standby" },
            });
            return;
        }

        navigate("/booking/passengers", {
            state: { selectedItinerary, returnItinerary, searchParams, passengers },
        });
    };

    const handleConfirm = () => {
        if (isStandbyBooking) {
            navigate("/booking/payment", {
                state: {
                    standbyBooking,
                },
            });
            return;
        }

        navigate("/booking/seat-selection", {
            state: {
                selectedItinerary,
                returnItinerary,
                searchParams,
                passengers,
                pricingSummary: {
                    ...pricing,
                    subtotal: combinedSubtotal,
                    taxAmount: totalTax,
                    total: combinedTotal,
                },
            },
        });
    };

    if (isStandbyBooking) {
        return (
            <div className="min-h-screen bg-transparent">
                <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                    <h1 className="text-3xl font-black text-white drop-shadow-md">
                        Review Your Booking
                    </h1>

                    <Card className="p-5 bg-white/90 backdrop-blur-md border-none shadow-xl">
                        <SectionTitle>Standby Flight</SectionTitle>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <LabelValue label="Flight" value={standbyBooking.flightNum} />
                            <LabelValue label="Seat" value={standbyBooking.seatNumber} />
                            <LabelValue label="From" value={standbyBooking.origin} />
                            <LabelValue label="To" value={standbyBooking.destination} />
                        </div>
                    </Card>

                    <Card className="p-5 bg-white/90 backdrop-blur-md border-none shadow-xl">
                        <SectionTitle>Passenger</SectionTitle>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <LabelValue label="Passenger ID" value={standbyBooking.passengerId} />
                            <LabelValue label="Status" value="Standby Accepted" />
                            <LabelValue label="Seat Hold" value="Reserved" />
                        </div>
                    </Card>

                    <Card className="p-5 bg-white/90 backdrop-blur-md border-none shadow-xl">
                        <SectionTitle>Price Breakdown</SectionTitle>
                        <div className="space-y-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                                Fare Summary
                            </p>
                            <PriceRow
                                label="Standby Fare"
                                value={formatCurrency(Number(standbyBooking.totalPrice ?? 0))}
                            />
                            <Divider />
                            <PriceRow
                                label="Grand Total"
                                value={formatCurrency(Number(standbyBooking.totalPrice ?? 0))}
                                bold
                                isTotal
                            />
                        </div>
                    </Card>

                    <div className="flex justify-between items-center pt-4">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="bg-white/20 text-white border-white/40 hover:bg-white/30 backdrop-blur-sm"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="px-10 shadow-lg shadow-blue-600/30"
                        >
                            Continue to Payment
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedItinerary || !searchParams) return null;

    const outboundFlights = selectedItinerary.flights ?? [];
    const inboundFlights = returnItinerary?.flights ?? [];

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-3xl font-black text-white drop-shadow-md">
                    Review Your Booking
                </h1>

                <Card className="p-5 bg-white/90 backdrop-blur-md border-none shadow-xl">
                    <SectionTitle>
                        {selectedItinerary.type === "connecting" ? "Connecting" : "Direct"}
                    </SectionTitle>
                    <div className="space-y-0">
                        {outboundFlights.map((flight, i) => (
                            <div key={i} className="relative">
                                <FlightSegment flight={flight} />
                                {i < outboundFlights.length - 1 && (
                                    <div
                                        className="absolute left-1 top-5.5 w-px bg-gray-200"
                                        style={{ height: "calc(100% - 10px)" }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <Divider />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <LabelValue label="Cabin" value={capitalize(searchParams.cabinClass)} />
                        <LabelValue label="Trip Type" value={capitalize(searchParams.flightType)} />
                        <LabelValue label="Date" value={formatDate(searchParams.dateDepart)} />
                    </div>
                </Card>

                {returnItinerary && (
                    <Card className="p-5 bg-white/90 backdrop-blur-md border-none shadow-xl">
                        <SectionTitle>Return Flight</SectionTitle>
                        <div className="space-y-0">
                            {inboundFlights.map((flight, i) => (
                                <div key={i} className="relative">
                                    <FlightSegment flight={flight} />
                                    {i < inboundFlights.length - 1 && (
                                        <div
                                            className="absolute left-1 top-5.5 w-px bg-gray-200"
                                            style={{ height: "calc(100% - 10px)" }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <Divider />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <LabelValue label="Cabin" value={capitalize(searchParams.cabinClass)} />
                            <LabelValue label="Trip Type" value={capitalize(searchParams.flightType)} />
                            {searchParams.flightType === "return" && searchParams.dateReturn && (
                                <LabelValue label="Date" value={formatDate(searchParams.dateReturn)} />
                            )}
                        </div>
                    </Card>
                )}

                <Card className="p-5 bg-white/90 backdrop-blur-md border-none shadow-xl">
                    <SectionTitle>Passengers</SectionTitle>
                    <div className="grid grid-cols-1 gap-4">
                        {passengersWithIndex.map((p, i) => (
                            <PassengerCard
                                key={i}
                                passenger={p}
                                indexWithinType={p.indexWithinType}
                                isDomestic={isDomesticItinerary}
                            />
                        ))}
                    </div>
                </Card>

                <Card className="p-5 bg-white/90 backdrop-blur-md border-none shadow-xl">
                    <SectionTitle>Price Breakdown</SectionTitle>
                    <div className="space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                            Outbound Fare Summary
                        </p>

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

                        {returnItinerary && (
                            <>
                                <Divider />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                                    Return Fare Summary
                                </p>

                                {returnPricing.adults > 0 && (
                                    <PriceRow
                                        label={`Adults × ${returnPricing.adults}`}
                                        sub={`${formatCurrency(returnPricing.perAdult)} each`}
                                        value={formatCurrency(returnPricing.adultFare)}
                                    />
                                )}
                                {returnPricing.children > 0 && (
                                    <PriceRow
                                        label={`Children × ${returnPricing.children}`}
                                        sub={`${formatCurrency(returnPricing.perChild)} each (80%)`}
                                        value={formatCurrency(returnPricing.childFare)}
                                    />
                                )}
                                {returnPricing.infants > 0 && (
                                    <PriceRow
                                        label={`Infants × ${returnPricing.infants}`}
                                        sub={`${formatCurrency(returnPricing.perInfant)} each (10%)`}
                                        value={formatCurrency(returnPricing.infantFare)}
                                    />
                                )}
                            </>
                        )}

                        <div className="pt-2 mt-2 border-t border-gray-200">
                            <PriceRow
                                label="Estimated Taxes & Fees"
                                sub="(7.5%)"
                                value={formatCurrency(totalTax)}
                            />
                        </div>

                        <Divider />
                        <PriceRow
                            label="Grand Total"
                            value={formatCurrency(combinedTotal)}
                            bold
                            isTotal
                        />
                    </div>
                </Card>

                <div className="flex justify-between items-center pt-4">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        className="bg-white/20 text-white border-white/40 hover:bg-white/30 backdrop-blur-sm"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="px-10 shadow-lg shadow-blue-600/30"
                    >
                        Confirm & Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
