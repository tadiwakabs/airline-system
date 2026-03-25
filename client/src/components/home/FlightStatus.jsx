import {useState} from "react";
import TextInput from "../common/TextInput.jsx";
import Button from "../common/Button.jsx";

export default function FlightStatusPanel({ onCheck }) {
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");

    const handleCheck = () => {
        if (!query.trim()) {
            setError("Please enter a booking or flight number.");
            return;
        }
        setError("");
        onCheck?.(query.trim());
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
            <p className="text-sm text-gray-500">
                Enter your booking reference (e.g.&nbsp;<span className="font-mono font-semibold text-gray-700">BK-00423</span>)
                or flight number (e.g.&nbsp;<span className="font-mono font-semibold text-gray-700">AA 1342</span>).
            </p>
            <TextInput
                label="Booking # or Flight #"
                placeholder="e.g. BK-00423 or AA 1342"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (error) setError("");
                }}
                error={error}
            />
            <Button size="lg" variant="secondary" onClick={handleCheck} className="w-full cursor-pointer">
                Check Status
            </Button>
        </div>
    );
}
