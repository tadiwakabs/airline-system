import React, { useEffect, useState } from "react";
import { getODDemand, getRouteVitality, getRevenueLeakage } from "../../services/reportsService";

const QUADRANT_COLORS = {
    "Gold Mine": "bg-green-100 text-green-800",
    "High Yield / Low Load": "bg-blue-100 text-blue-800",
    "Low Yield / High Load": "bg-yellow-100 text-yellow-800",
    "Danger Zone": "bg-red-100 text-red-800",
};

function SectionTitle({ children }) {
    return <h2 className="text-xl font-bold text-gray-800 mb-4">{children}</h2>;
}

function Table({ columns, data, emptyMsg }) {
    return (
        <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-4 py-2 font-semibold text-gray-600">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                                {emptyMsg || "No data available."}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, i) => (
                            <tr key={i} className="border-t hover:bg-gray-50">
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-2">
                                        {col.render ? col.render(row) : row[col.key] ?? "—"}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default function Reports() {
    const [odData, setOdData] = useState([]);
    const [vitalityData, setVitalityData] = useState([]);
    const [leakageData, setLeakageData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("od");

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const [od, vitality, leakage] = await Promise.all([
                    getODDemand(),
                    getRouteVitality(),
                    getRevenueLeakage(),
                ]);
                setOdData(od.data);
                setVitalityData(vitality.data);
                setLeakageData(leakage.data);
            } catch (err) {
                setError("Failed to load report data.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const tabs = [
        { id: "od", label: "O&D Market Demand" },
        { id: "vitality", label: "Route Vitality Matrix" },
        { id: "leakage", label: "Revenue Leakage & Spill" },
    ];

    const odColumns = [
        { key: "trueOrigin", label: "Origin" },
        { key: "trueDestination", label: "Destination" },
        { key: "totalPassengers", label: "Total Passengers" },
        {
            key: "connectionRatioPct",
            label: "Connection Ratio",
            render: (row) => `${row.connectionRatioPct}%`,
        },
        {
            key: "actualRevenue",
            label: "Actual Revenue",
            render: (row) => `$${row.actualRevenue?.toLocaleString()}`,
        },
        {
            key: "potentialDirectRevenue",
            label: "Potential Direct Revenue",
            render: (row) => `$${row.potentialDirectRevenue?.toLocaleString()}`,
        },
    ];

    const vitalityColumns = [
        { key: "flightNum", label: "Flight #" },
        { key: "departingPort", label: "From" },
        { key: "arrivingPort", label: "To" },
        { key: "bookedPassengers", label: "Booked" },
        { key: "totalCapacity", label: "Capacity" },
        {
            key: "actualLoadFactorPct",
            label: "Load Factor",
            render: (row) => `${row.actualLoadFactorPct}%`,
        },
        {
            key: "avgTicketPrice",
            label: "Avg Price",
            render: (row) => `$${row.avgTicketPrice}`,
        },
        {
            key: "passengerYield",
            label: "Yield ($/km)",
            render: (row) => `$${row.passengerYield}`,
        },
        {
            key: "quadrant",
            label: "Status",
            render: (row) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${QUADRANT_COLORS[row.quadrant] || "bg-gray-100 text-gray-700"}`}>
                    {row.quadrant}
                </span>
            ),
        },
    ];

    const leakageColumns = [
        { key: "flightNum", label: "Flight #" },
        { key: "departingPort", label: "From" },
        { key: "arrivingPort", label: "To" },
        {
            key: "loadFactorPct",
            label: "Load Factor",
            render: (row) => `${row.loadFactorPct}%`,
        },
        {
            key: "totalRevenue",
            label: "Revenue",
            render: (row) => `$${row.totalRevenue?.toLocaleString()}`,
        },
        { key: "RASK", label: "RASK" },
        { key: "networkAvgRASK", label: "Network Avg RASK" },
        {
            key: "estimatedSpillCost",
            label: "Spill Cost",
            render: (row) => (
                <span className={row.estimatedSpillCost > 0 ? "text-red-600 font-semibold" : ""}>
                    ${row.estimatedSpillCost?.toLocaleString()}
                </span>
            ),
        },
        { key: "unconstrainedDemandEstimate", label: "Unconstrained Demand" },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Analytics & Reports</h1>
            <p className="text-gray-500 text-sm mb-6">Admin-only operational intelligence reports.</p>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {loading ? (
                <p className="text-gray-400">Loading report data...</p>
            ) : (
                <>
                    {activeTab === "od" && (
                        <div>
                            <SectionTitle>O&D Market Demand Report</SectionTitle>
                            <p className="text-sm text-gray-500 mb-4">
                                Shows true origin-to-destination passenger demand regardless of layovers.
                                High connection ratios with large passenger volumes suggest opportunity for direct routes.
                            </p>
                            <Table
                                columns={odColumns}
                                data={odData}
                                emptyMsg="No O&D data available. Data will appear once tickets are booked."
                            />
                        </div>
                    )}

                    {activeTab === "vitality" && (
                        <div>
                            <SectionTitle>Route Vitality & Rightsizing Matrix</SectionTitle>
                            <p className="text-sm text-gray-500 mb-4">
                                Categorizes routes into four quadrants based on yield and load factor.
                            </p>
                            <div className="flex flex-wrap gap-3 mb-4">
                                {Object.entries(QUADRANT_COLORS).map(([label, cls]) => (
                                    <span key={label} className={`px-3 py-1 rounded text-xs font-semibold ${cls}`}>
                                        {label}
                                    </span>
                                ))}
                            </div>
                            <Table
                                columns={vitalityColumns}
                                data={vitalityData}
                                emptyMsg="No route data available yet."
                            />
                        </div>
                    )}

                    {activeTab === "leakage" && (
                        <div>
                            <SectionTitle>Revenue Leakage & Spill Report</SectionTitle>
                            <p className="text-sm text-gray-500 mb-4">
                                Identifies flights where demand exceeded capacity (spill) and routes
                                underperforming the network average RASK.
                            </p>
                            <Table
                                columns={leakageColumns}
                                data={leakageData}
                                emptyMsg="No leakage data available yet."
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}