import { useState, useEffect, useRef } from "react";
import TextInput from "../common/TextInput.jsx";
import Button from "../common/Button.jsx";

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Flight Route Tracker ────────────────────────────────────────────────────
function FlightRouteTracker({ flight }) {
    const {
        departingPort,
        arrivingPort,
        departingCity,
        arrivingCity,
        departTime,       // local display time
        arrivalTime,      // local display time
        departTimeUtc,    // UTC math time
        arrivalTimeUtc,   // UTC math time
        status,
    } = flight;

    const [progress, setProgress] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const depart = new Date(departTimeUtc).getTime();
        const arrive = new Date(arrivalTimeUtc).getTime();
        const total = arrive - depart;

        if (!Number.isFinite(depart) || !Number.isFinite(arrive) || total <= 0) {
            setProgress(0);
            return;
        }

        const tick = () => {
            const now = Date.now();
            const elapsed = now - depart;
            const pct = Math.min(Math.max(elapsed / total, 0), 1);
            setProgress(pct);
            if (pct < 1) rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [departTimeUtc, arrivalTimeUtc]);

    const departDt = parseLocalDateTime(departTime);
    const arriveDt = parseLocalDateTime(arrivalTime);

    const fmtTime = (d) =>
        d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

    const fmtDate = (d) =>
        d ? d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : "—";

    const planeX = 4 + progress * 92;
    const arcY = -Math.sin(progress * Math.PI) * 18;

    const isDelayed = status === "Delayed";

    const now = Date.now();
    const departMs = new Date(departTimeUtc).getTime();
    const arriveMs = new Date(arrivalTimeUtc).getTime();

    const remainingMs =
        Number.isFinite(arriveMs) ? Math.max(arriveMs - now, 0) : 0;

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    const remainingText =
        remainingMs > 0
            ? `${hours} hr ${minutes} min remaining`
            : "Arrived";

    return (
        <div
            className="rounded-2xl overflow-hidden mt-4"
            style={{
                background: "#1C253F",
                border: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            <div className="flex justify-between items-start px-6 pt-6 pb-2">
                <div>
                    <p
                        className="text-5xl font-black tracking-tight"
                        style={{ color: "#f0f4ff", fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                        {departingPort}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#dbeafe" }}>
                        {departingCity}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#6b7a99" }}>
                        {fmtDate(departDt)}
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "#94a3b8" }}>
                        Departed
                    </p>
                    <p
                        className="text-2xl font-black mt-0.5"
                        style={{ color: isDelayed ? "#f87171" : "#60d394", fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                        {fmtTime(departDt)}
                    </p>
                </div>

                <div className="text-right">
                    <p
                        className="text-5xl font-black tracking-tight"
                        style={{ color: "#f0f4ff", fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                        {arrivingPort}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#dbeafe" }}>
                        {arrivingCity}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#6b7a99" }}>
                        {fmtDate(arriveDt)}
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "#94a3b8" }}>
                        Est. arrival
                    </p>
                    <p
                        className="text-2xl font-black mt-0.5"
                        style={{ color: "#f0f4ff", fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                        {fmtTime(arriveDt)}
                    </p>
                </div>
            </div>

            <div className="px-6 py-2">
                <svg
                    viewBox="0 0 400 60"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full"
                    style={{ overflow: "visible" }}
                >
                    <line
                        x1="20" y1="40" x2="380" y2="40"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                    />

                    <line
                        x1="20" y1="40"
                        x2={20 + progress * 360} y2="40"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        opacity="0.5"
                    />

                    <circle cx="20" cy="40" r="4" fill="#3b82f6" />
                    <circle cx="380" cy="40" r="4" fill={progress >= 1 ? "#60d394" : "rgba(255,255,255,0.2)"} />

                    <text
                        x={`${planeX}%`}
                        y={40 + arcY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="20"
                        style={{
                            fill: "#ffffff",
                            filter: "drop-shadow(0 0 6px rgba(59,130,246,0.8))",
                            transition: "none",
                        }}
                    >
                        ✈
                    </text>
                </svg>
            </div>

            <div className="px-6 pb-5">
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xs" style={{ color: "#dbeafe" }}>
                        {remainingText}
                    </p>
                    <span
                        className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{
                            background: isDelayed ? "rgba(248,113,113,0.15)" : "rgba(96,211,148,0.15)",
                            color: isDelayed ? "#f87171" : "#60d394",
                        }}
                    >
                        {status}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Flight Status Panel ─────────────────────────────────────────────────────
export default function FlightStatusPanel({ onCheck, result }) {
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");

    const handleCheck = () => {
        const trimmed = query.trim();
        if (!trimmed) {
            setError("Please enter a booking reference or flight number.");
            return;
        }
        setError("");
        onCheck?.(trimmed);
    };

    const now = Date.now();
    const departMs = result?.departTimeUtc ? new Date(result.departTimeUtc).getTime() : null;
    const arriveMs = result?.arrivalTimeUtc ? new Date(result.arrivalTimeUtc).getTime() : null;

    const showTracker =
        !Array.isArray(result?.bookingFlights) &&
        departMs &&
        arriveMs &&
        now >= departMs &&
        now <= arriveMs;

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
            <p className="text-sm text-gray-500">
                Enter your booking reference (e.g.&nbsp;
                <span className="font-mono font-semibold text-gray-700">565b2bda</span>)
                or flight number (e.g.&nbsp;
                <span className="font-mono font-semibold text-gray-700">1342</span>).
                <br />
                <span className="text-xs text-gray-400">
                    You can find your booking reference in your confirmation email.
                </span>
            </p>

            <TextInput
                label="Booking # or Flight #"
                placeholder="e.g. 565b2bda or 1342"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (error) setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                error={error}
            />

            <Button size="lg" variant="secondary" onClick={handleCheck} className="w-full cursor-pointer">
                Check Status
            </Button>

            {showTracker && <FlightRouteTracker flight={result} />}

            {!showTracker && result && !Array.isArray(result?.bookingFlights) && (
                <p className="text-xs text-gray-400 mt-2">
                    Flight times are shown in local airport time.
                </p>
            )}
        </div>
    );
}
