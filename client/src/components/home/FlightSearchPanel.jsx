import DatePicker from "../common/DatePicker.jsx";
import Dropdown from "../common/Dropdown.jsx";
import Button from "../common/Button.jsx";
import Combobox from "../common/Combobox.jsx";
import RadioGroup from "../common/RadioGroup.jsx";
import { useMemo, useState, useEffect } from "react";
import PassengerSelector from "./PassengerSelector.jsx";

import AIRPORTS from "../../dropdownData/airports.json";

const CLASSES = [
    { label: "Economy", value: "economy" },
    { label: "Business", value: "business" },
    { label: "First Class", value: "first" },
];

const FLIGHT_TYPE_OPTIONS = [
    { label: "One-way", value: "one-way" },
    { label: "Return", value: "return" },
];

const DEFAULT_PASSENGERS = { adults: 1, children: 0, infants: 0 };

function todayStr() {
    return new Date().toISOString().split("T")[0];
}

export default function FlightSearchPanel({ onSearch, initialValues }) {
    const [flightType, setFlightType] = useState(initialValues?.flightType || "one-way");
    const [departure, setDeparture] = useState(initialValues?.departure || "");
    const [arrival, setArrival] = useState(initialValues?.arrival || "");
    const [departureSearch, setDepartureSearch] = useState("");
    const [arrivalSearch, setArrivalSearch] = useState("");
    const [dateDepart, setDateDepart] = useState(initialValues?.dateDepart || "");
    const [dateReturn, setDateReturn] = useState(initialValues?.dateReturn || "");
    const [passengers, setPassengers] = useState(
        initialValues?.passengers || DEFAULT_PASSENGERS
    );
    const [cabinClass, setCabinClass] = useState(initialValues?.cabinClass || "economy");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!initialValues) return;

        setFlightType(initialValues.flightType || "one-way");
        setDeparture(initialValues.departure || "");
        setArrival(initialValues.arrival || "");
        setDateDepart(initialValues.dateDepart || "");
        setDateReturn(initialValues.dateReturn || "");
        setPassengers(initialValues.passengers || DEFAULT_PASSENGERS);
        setCabinClass(initialValues.cabinClass || "economy");
        setErrors({});
    }, [initialValues]);

    const isReturn = flightType === "return";

    const airportOptions = useMemo(
        () =>
            AIRPORTS.map((a) => ({
                label: `${a.city} (${a.value})`,
                value: a.value,
            })),
        []
    );

    const filteredDeparture = airportOptions.filter((a) =>
        a.label.toLowerCase().includes(departureSearch.toLowerCase())
    );

    const filteredArrival = airportOptions.filter((a) =>
        a.label.toLowerCase().includes(arrivalSearch.toLowerCase())
    );

    const validate = () => {
        const e = {};
        if (!departure) e.departure = "Please select a departure airport.";
        if (!arrival) e.arrival = "Please select an arrival airport.";
        if (departure && arrival && departure === arrival) {
            e.arrival = "Arrival must differ from departure.";
        }
        if (!dateDepart) e.dateDepart = "Please select a departure date.";
        if (isReturn && !dateReturn) e.dateReturn = "Please select a return date.";
        if (isReturn && dateDepart && dateReturn && dateReturn < dateDepart) {
            e.dateReturn = "Return date must be after departure.";
        }
        if (!passengers.adults || passengers.adults < 1) {
            e.passengers = "At least 1 adult required.";
        }
        return e;
    };

    const handleSearch = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        onSearch?.({
            flightType,
            departure,
            arrival,
            dateDepart,
            dateReturn,
            passengers,
            cabinClass,
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-5">
            <RadioGroup
                name="flightType"
                options={FLIGHT_TYPE_OPTIONS}
                selectedValue={flightType}
                onChange={setFlightType}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Combobox
                        label="Departure"
                        options={filteredDeparture}
                        value={departure}
                        onChange={setDeparture}
                        onSearch={setDepartureSearch}
                        placeholder="Search departure airport..."
                    />
                    {errors.departure && (
                        <p className="text-xs text-red-600 mt-1">{errors.departure}</p>
                    )}
                </div>

                <div>
                    <Combobox
                        label="Arrival"
                        options={filteredArrival}
                        value={arrival}
                        onChange={setArrival}
                        onSearch={setArrivalSearch}
                        placeholder="Search arrival airport..."
                    />
                    {errors.arrival && (
                        <p className="text-xs text-red-600 mt-1">{errors.arrival}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <DatePicker
                        label="Departure Date"
                        value={dateDepart}
                        onChange={setDateDepart}
                        min={todayStr()}
                    />
                    {errors.dateDepart && (
                        <p className="text-xs text-red-600 mt-1">{errors.dateDepart}</p>
                    )}
                </div>

                <div>
                    <DatePicker
                        label="Return Date"
                        value={dateReturn}
                        onChange={setDateReturn}
                        min={dateDepart || todayStr()}
                        disabled={!isReturn}
                    />
                    {!isReturn && (
                        <p className="text-xs text-gray-400 mt-1">
                            Only available for Return flights.
                        </p>
                    )}
                    {errors.dateReturn && (
                        <p className="text-xs text-red-600 mt-1">{errors.dateReturn}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <PassengerSelector
                        label="Passengers"
                        value={passengers}
                        onChange={setPassengers}
                        error={errors.passengers}
                    />
                </div>

                <Dropdown
                    label="Cabin Class"
                    value={cabinClass}
                    onChange={setCabinClass}
                    options={CLASSES}
                />
            </div>

            <div className="pt-1">
                <Button size="lg" onClick={handleSearch} className="w-full cursor-pointer">
                    Search Flights
                </Button>
            </div>
        </div>
    );
}
