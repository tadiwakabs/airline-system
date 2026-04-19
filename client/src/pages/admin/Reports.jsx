import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api"; 
import FinancialSummary from "./FinancialSummary";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement, BubbleController } from 'chart.js';
import { Bar, Pie, Bubble } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement, BubbleController);

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Calendar Heatmap Component
function CalendarHeatmap({ heatmapData }) {
    const [monthIndex, setMonthIndex] = useState(0);

    if (!heatmapData || heatmapData.length === 0) return (
        <div className="text-center text-slate-400 text-[11px] py-8">No heatmap data available.</div>
    );

    const maxPassengers = Math.max(...heatmapData.map(r => r.passengers), 1);

    const getColor = (passengers) => {
        if (passengers === 0) return '#f1f5f9';
        const intensity = passengers / maxPassengers;
        if (intensity < 0.2) return '#bfdbfe';
        if (intensity < 0.4) return '#93c5fd';
        if (intensity < 0.6) return '#3b82f6';
        if (intensity < 0.8) return '#1d4ed8';
        return '#0f172a';
    };

    const grouped = heatmapData.reduce((acc, row) => {
        const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
        if (!acc[key]) acc[key] = { year: row.year, month: row.month, days: [] };
        acc[key].days.push(row);
        return acc;
    }, {});

    const months = Object.values(grouped).sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.month - b.month
    );

    if (months.length === 0) return null;

    const safeIndex = Math.min(monthIndex, months.length - 1);
    const visibleMonths = months.slice(safeIndex, safeIndex + 2);
    const TILE = 32;
    const GAP = 3;

    const renderMonth = ({ year, month, days }) => {
        const grid = Array.from({ length: 5 }, (_, w) =>
            Array.from({ length: 7 }, (_, d) => {
                const cell = days.find(r => r.weekOfMonth === w + 1 && r.dayOfWeek === d);
                return cell || null;
            })
        );

        return (
            <div key={`${year}-${month}`}>
                <p className="text-[10px] font-bold uppercase text-[#64748b] mb-1">
                    {MONTH_NAMES[month - 1]} {year}
                </p>
                <div style={{ display: 'flex', gap: GAP, marginBottom: GAP }}>
                    {DAY_NAMES.map(d => (
                        <div key={d} style={{ width: TILE, textAlign: 'center', fontSize: 8, fontWeight: 'bold', color: '#94a3b8' }}>
                            {d}
                        </div>
                    ))}
                </div>
                {grid.map((row, wi) => (
                    <div key={wi} style={{ display: 'flex', gap: GAP, marginBottom: GAP }}>
                        {row.map((cell, di) => (
                            <div
                                key={di}
                                title={cell ? `${cell.passengers} passengers` : ''}
                                style={{
                                    width: TILE,
                                    height: TILE,
                                    backgroundColor: cell ? getColor(cell.passengers) : '#f8fafc',
                                    color: cell && cell.passengers / maxPassengers > 0.5 ? '#fff' : '#64748b',
                                    border: cell ? 'none' : '1px dashed #e2e8f0',
                                    fontSize: 9,
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    flexShrink: 0,
                                }}
                            >
                                {cell && cell.passengers > 0 ? cell.passengers : ''}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="inline-flex flex-col items-center">
            <div className="flex gap-6">
                {visibleMonths.map(renderMonth)}
            </div>
            <div className="flex items-center justify-between w-full mt-2">
                <div className="flex items-center gap-1">
                    <span className="text-[7px] text-[#94a3b8] uppercase font-bold">Low</span>
                    {['#f1f5f9', '#bfdbfe', '#93c5fd', '#3b82f6', '#1d4ed8', '#0f172a'].map(c => (
                        <div key={c} className="w-3 h-3 rounded" style={{ backgroundColor: c }} />
                    ))}
                    <span className="text-[7px] text-[#94a3b8] uppercase font-bold">High</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[8px] text-[#94a3b8] font-bold">
                        {safeIndex + 1}–{Math.min(safeIndex + 2, months.length)} / {months.length}
                    </span>
                    <button
                        onClick={() => setMonthIndex(i => Math.max(0, i - 2))}
                        disabled={safeIndex === 0}
                        className="w-5 h-5 flex items-center justify-center border border-[#e2e8f0] rounded text-[#64748b] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => setMonthIndex(i => Math.min(months.length - 1, i + 2))}
                        disabled={safeIndex >= months.length - 1}
                        className="w-5 h-5 flex items-center justify-center border border-[#e2e8f0] rounded text-[#64748b] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        ›
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Reports() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heatmapData, setHeatmapData] = useState([]);
    useEffect(() => {
    api.get('/reports/heatmap')  // add the /
        .then(res => setHeatmapData(res.data || []))
        .catch(() => setHeatmapData([]));
    }, []);

    // Staged filter state
    const [stagedReportType, setStagedReportType] = useState("revenue");
    const [stagedShowAll, setStagedShowAll] = useState(false);
    const [stagedSearch, setStagedSearch] = useState("");
    const [stagedSort, setStagedSort] = useState({ key: "", direction: "asc" });
    const [stagedDates, setStagedDates] = useState({ start: "", end: "" });

    // Active filter state
    const [activeReportType, setActiveReportType] = useState("revenue");
    const [activeShowAll, setActiveShowAll] = useState(false);
    const [activeSearch, setActiveSearch] = useState("");
    const [activeSort, setActiveSort] = useState({ key: null, direction: 'asc' });
    const [activeDates, setActiveDates] = useState({ start: "", end: "" });

    const reportColumnsMap = {
        revenue: ["origin", "destination", "totalRevenue", "refunds", "profit", "avgFare", "cabinDriver"],
        popularity: ["destination", "totalActiveBookings", "passengersPerWeek", "revenueContributionPercent", "peakMonth", "peakDay", "marketTier"],
        activity: ["origin", "destination", "tailNumber", "planeModel", "weeklyFrequency", "avgLoadFactorPercent", "recommendedAction"]
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeDates.start) params.append("startDate", activeDates.start);
            if (activeDates.end) params.append("endDate", activeDates.end);
            const res = await api.get(`reports/${activeReportType}?${params.toString()}`);
            setData(res.data || []);
        } catch (err) {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [activeReportType, activeDates]);

    useEffect(() => {
        api.get('reports/heatmap')
            .then(res => setHeatmapData(res.data || []))
            .catch(() => setHeatmapData([]));
    }, []);

    const handleApplyFilters = () => {
        setActiveReportType(stagedReportType);
        setActiveShowAll(stagedShowAll);
        setActiveSearch(stagedSearch);
        setActiveSort({ ...stagedSort });
        setActiveDates({ ...stagedDates });
    };

    const requestHeaderSort = (key) => {
        let direction = 'asc';
        if (activeSort.key === key && activeSort.direction === 'asc') direction = 'desc';
        setActiveSort({ key, direction });
    };

    const handleDownload = (format) => {
        if (!data.length) return;
        const filename = `${activeReportType}-report`;

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(processedData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        if (format === 'csv') {
            if (!processedData.length) return;
            const keys = reportColumnsMap[activeReportType];
            const header = keys.join(',');
            const rows = processedData.map(row =>
                keys.map(k => {
                    const val = row[k];
                    if (val === null || val === undefined) return '';
                    const str = val.toString();
                    return str.includes(',') ? `"${str}"` : str;
                }).join(',')
            );
            const csv = [header, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Summary stats
    const summaryStats = useMemo(() => {
        if (!data.length) return [
            { label: "—", value: "—", subLabel: "—", subValue: "—" },
            { label: "—", value: "—", subLabel: "—", subValue: "—" },
            { label: "—", value: "—", subLabel: "—", subValue: "—" },
            { label: "—", value: "—", subLabel: "—", subValue: "—" },
        ];

        // Revenue summary
        if (activeReportType === "revenue") {
            const totalRevenue = data.reduce((s, r) => s + Number(r.totalRevenue || 0), 0);
            const totalProfit = data.reduce((s, r) => s + Number(r.profit || 0), 0);
            const totalRefunds = data.reduce((s, r) => s + Number(r.refunds || 0), 0);
            const premiumRoutes = data.filter(r => r.cabinDriver === "Premium").length;
            const topRoute = [...data].sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))[0];
            return [
                { label: "Total Revenue", value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subLabel: "Network Total", subValue: "USD" },
                { label: "Net Profit", value: `$${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subLabel: "After Deductions", subValue: `$${totalRefunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Refunded/Reimbursed`, highlighted: true },
                { label: "Premium Routes", value: `${premiumRoutes}`, subLabel: "of total routes", subValue: `${data.length} routes` },
                { label: "Top Route", value: topRoute ? `${topRoute.origin}→${topRoute.destination}`.toUpperCase() : "—", subLabel: "Route Revenue", subValue: `$${Number(topRoute?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            ];
        }

        // Popularity summary
        if (activeReportType === "popularity") {
            const totalBookings = data.reduce((s, r) => s + Number(r.totalActiveBookings || 0), 0);
            const topDest = [...data].sort((a, b) => Number(b.totalActiveBookings) - Number(a.totalActiveBookings))[0];
            const activeDestinations = data.filter(r => Number(r.totalActiveBookings) > 0);
            let leastDestLabel = "—", leastDestValue = "0";
            if (activeDestinations.length > 0) {
                const minBookings = Math.min(...activeDestinations.map(r => Number(r.totalActiveBookings)));
                const tiedLeast = activeDestinations.filter(r => Number(r.totalActiveBookings) === minBookings);
                leastDestLabel = tiedLeast.map(r => r.destination).join(", ").toUpperCase();
                leastDestValue = minBookings.toLocaleString();
            }
            const monthCounts = data.filter(r => r.peakMonth && r.peakMonth !== "N/A").reduce((acc, r) => { acc[r.peakMonth] = (acc[r.peakMonth] || 0) + 1; return acc; }, {});
            const peakMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
            const dayCounts = data.filter(r => r.peakDay && r.peakDay !== "N/A").reduce((acc, r) => { acc[r.peakDay] = (acc[r.peakDay] || 0) + 1; return acc; }, {});
            const peakDay = (Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A").toUpperCase();
            return [
                { label: "Total Bookings", value: totalBookings.toLocaleString(), subLabel: "Network Wide", subValue: "Booked Tickets" },
                { label: "Most Popular", value: topDest?.destination?.toUpperCase() || "—", subLabel: "Total Bookings", subValue: Number(topDest?.totalActiveBookings || 0).toLocaleString(), highlighted: true },
                { label: "Least Popular", value: leastDestLabel, subLabel: "Total Bookings", subValue: leastDestValue },
                { label: "Peak Travel", value: peakDay, subLabel: "Peak Month", subValue: peakMonth.toUpperCase() },
            ];
        }

        // Activity summary
        if (activeReportType === "activity") {
            const avgLoad = data.reduce((s, r) => s + Number(r.avgLoadFactorPercent || 0), 0) / (data.length || 1);
            const topRoute = [...data].sort((a, b) => Number(b.avgLoadFactorPercent) - Number(a.avgLoadFactorPercent))[0];
            const uniqueTails = new Set(data.map(r => r.tailNumber)).size;
            const avgWeekly = data.reduce((s, r) => s + Number(r.weeklyFrequency || 0), 0) / (data.length || 1);
            return [
                { label: "Avg Load Factor", value: `${avgLoad.toFixed(2)}%`, subLabel: "Network Average", subValue: "All Routes" },
                { label: "Busiest Route", value: topRoute ? `${topRoute.origin}→${topRoute.destination}`.toUpperCase() : "—", subLabel: "Load Factor", subValue: `${Number(topRoute?.avgLoadFactorPercent || 0).toFixed(2)}%`, highlighted: true },
                { label: "Active Tail Count", value: `${uniqueTails}`, subLabel: "Fleet Status", subValue: "Operational" },
                { label: "Avg Weekly Flights", value: `${avgWeekly.toFixed(1)}`, subLabel: "Per Route", subValue: "Flights" },
            ];
        }

        return [];
    }, [data, activeReportType]);

    // Processed/filtered data
    const processedData = useMemo(() => {
        let items = [...data];
        if (!activeShowAll) {
            items = items.filter(row => {
                if (activeReportType === 'revenue') return Number(row.totalRevenue || 0) > 0;
                if (activeReportType === 'popularity') return Number(row.totalActiveBookings || 0) > 0;
                if (activeReportType === 'activity') return Number(row.avgLoadFactorPercent || 0) > 0;
                return true;
            });
        }
        if (activeSearch) {
            items = items.filter(row =>
                Object.values(row).some(v => v?.toString().toLowerCase().includes(activeSearch.toLowerCase()))
            );
        }
        if (activeSort.key) {
            items.sort((a, b) => {
                let aVal = a[activeSort.key] ?? 0;
                let bVal = b[activeSort.key] ?? 0;
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal < bVal) return activeSort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return activeSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [data, activeSearch, activeSort, activeShowAll, activeReportType]);

    const formatValue = (key, val) => {
        const k = key.toLowerCase();
        if (k === 'cabindriver' || k === 'peakmonth' || k === 'peakday')
            return val?.toString().toUpperCase() ?? "—";
        if (['totalrevenue', 'avgfare', 'profit'].includes(k))
            return `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (k === 'refunds') {
            const num = Number(val || 0);
            const formatted = `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            return num > 0 ? `-${formatted}` : formatted;
        }
        if (k.includes('percent') || k.includes('factor'))
            return `${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        if (k === 'recommendedaction') {
            const colors = {
                'UPSIZE AIRCRAFT': 'text-red-600 font-bold',
                'DOWNSIZE AIRCRAFT': 'text-yellow-600 font-bold',
                'OPTIMAL': 'text-green-600 font-bold',
                'MONITOR': 'text-blue-600 font-bold',
            };
            const upper = val?.toString().toUpperCase() ?? "—";
            return <span className={colors[upper] || ''}>{upper}</span>;
        }
        if (k === 'markettier') {
            const colors = {
                'PRIMARY': 'text-blue-700 font-bold',
                'SECONDARY': 'text-slate-600 font-bold',
                'INACTIVE': 'text-gray-400 font-bold',
            };
            const upper = val?.toString().toUpperCase() ?? "—";
            return <span className={colors[upper] || ''}>{upper}</span>;
        }
        return val?.toString() ?? "—";
    };

    const formatHeader = (key) => {
        if (key === 'refunds') return 'DEDUCTIONS';
        return key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
    };

    // Charts
    const renderVisuals = () => {
        if (loading || processedData.length === 0) return null;

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

                {/* Revenue charts */}
                {activeReportType === 'revenue' && (
                    <>
                        <div className="bg-white border border-[#cbd5e1] p-4 shadow-sm h-[320px]">
                            <h3 className="text-[10px] font-bold uppercase text-[#64748b] mb-2">Revenue Distribution by Route</h3>
                            <div style={{ height: 260 }}>
                                <Bar
                                    data={{
                                        labels: processedData.slice(0, 10).map(r => `${r.origin}→${r.destination}`),
                                        datasets: [
                                            {
                                                label: 'Net Profit',
                                                data: processedData.slice(0, 10).map(r => Number(r.profit || 0)),
                                                backgroundColor: '#0f172a',
                                                stack: 'a',
                                            },
                                            {
                                                label: 'Refunds/Deductions',
                                                data: processedData.slice(0, 10).map(r => Number(r.refunds || 0)),
                                                backgroundColor: '#94a3b8',
                                                stack: 'a',
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { labels: { font: { size: 10 }, boxWidth: 12 } },
                                            tooltip: { callbacks: { label: (ctx) => `$${Number(ctx.raw).toLocaleString()}` } }
                                        },
                                        scales: {
                                            x: { ticks: { font: { size: 9 }, color: '#64748b', maxRotation: 45 }, grid: { display: false } },
                                            y: { ticks: { font: { size: 9 }, color: '#64748b', callback: (v) => `$${v/1000}k` }, grid: { color: '#f1f5f9' } }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="bg-white border border-[#cbd5e1] p-4 shadow-sm h-[320px] flex flex-col">
                            <h3 className="text-[10px] font-bold uppercase text-[#64748b] mb-4">Cabin Class Driver Split</h3>
                            <div className="flex-1 flex items-center justify-center">
                                <div style={{ width: 220, height: 220 }}>
                                    <Pie
                                        data={{
                                            labels: ['PREMIUM', 'ECONOMY'],
                                            datasets: [{
                                                data: [
                                                    data.filter(r => r.cabinDriver === 'Premium').length,
                                                    data.filter(r => r.cabinDriver === 'Economy').length
                                                ],
                                                backgroundColor: ['#0f172a', '#3b82f6'],
                                                borderWidth: 2,
                                                borderColor: '#fff',
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            cutout: '60%',
                                            plugins: {
                                                legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } },
                                                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} routes` } }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Popularity charts */}
                {activeReportType === 'popularity' && (
                    <>
                        <div className="bg-white border border-[#cbd5e1] p-4 shadow-sm h-[320px]">
                            <h3 className="text-[10px] font-bold uppercase text-[#64748b] mb-4">Market Positioning</h3>
                            <div style={{ height: 260 }}>
                                <Bubble
                                    data={{
                                        datasets: processedData.map(r => ({
                                            label: r.destination,
                                            data: [{
                                                x: Number(r.passengersPerWeek || 0),
                                                y: Number(r.revenueContributionPercent || 0),
                                                r: Math.max(4, Math.sqrt(Number(r.totalActiveBookings || 0)) * 1.5),
                                            }],
                                            backgroundColor: r.marketTier === 'Primary' ? 'rgba(15,23,42,0.8)' :
                                                r.marketTier === 'Secondary' ? 'rgba(59,130,246,0.7)' : 'rgba(203,213,225,0.7)',
                                            borderColor: r.marketTier === 'Primary' ? '#0f172a' :
                                                r.marketTier === 'Secondary' ? '#3b82f6' : '#cbd5e1',
                                            borderWidth: 1,
                                        }))
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: (ctx) => {
                                                        const r = processedData.find(d => d.destination === ctx.dataset.label);
                                                        return [
                                                            `${ctx.dataset.label} (${r?.marketTier || '—'})`,
                                                            `Pax/Week: ${ctx.raw.x}`,
                                                            `Rev Share: ${ctx.raw.y}%`,
                                                            `Total Bookings: ${r?.totalActiveBookings || 0}`
                                                        ];
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            x: {
                                                title: { display: true, text: 'Passengers / Week', font: { size: 9 }, color: '#64748b' },
                                                ticks: { font: { size: 9 }, color: '#64748b' },
                                                grid: { color: '#f1f5f9' }
                                            },
                                            y: {
                                                title: { display: true, text: 'Revenue Contribution %', font: { size: 9 }, color: '#64748b' },
                                                ticks: { font: { size: 9 }, color: '#64748b', callback: (v) => `${v}%` },
                                                grid: { color: '#f1f5f9' }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="bg-white border border-[#cbd5e1] p-4 shadow-sm flex flex-col items-center">
                            <h3 className="text-[10px] font-bold uppercase text-[#64748b] mb-4 self-start">Passenger Heatmap by Day</h3>
                            <CalendarHeatmap heatmapData={heatmapData} />
                        </div>
                    </>
                )}

                {/* Activity charts */}
                {activeReportType === 'activity' && (
                    <>
                        <div className="bg-white border border-[#cbd5e1] p-4 shadow-sm h-[320px]">
                            <h3 className="text-[10px] font-bold uppercase text-[#64748b] mb-2">Load Factor by Route</h3>
                            <div style={{ height: 270 }}>
                                <Bar
                                    data={{
                                        labels: processedData.map(r => `${r.origin}→${r.destination}`),
                                        datasets: [{
                                            label: 'Load Factor %',
                                            data: processedData.map(r => Number(r.avgLoadFactorPercent || 0)),
                                            backgroundColor: processedData.map(r => {
                                                const action = r.recommendedAction;
                                                if (action === 'Upsize Aircraft') return 'rgba(220,38,38,0.8)';
                                                if (action === 'Downsize Aircraft') return 'rgba(234,179,8,0.8)';
                                                if (action === 'Optimal') return 'rgba(34,197,94,0.8)';
                                                return 'rgba(59,130,246,0.8)';
                                            }),
                                            borderRadius: 3,
                                        }]
                                    }}
                                    options={{
                                        indexAxis: 'y',
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: (ctx) => {
                                                        const r = processedData[ctx.dataIndex];
                                                        return [`Load: ${ctx.raw}%`, `Action: ${r?.recommendedAction || '—'}`];
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            x: {
                                                max: 100,
                                                ticks: { font: { size: 9 }, color: '#64748b', callback: (v) => `${v}%` },
                                                grid: { color: '#f1f5f9' }
                                            },
                                            y: {
                                                ticks: { font: { size: 8 }, color: '#64748b' },
                                                grid: { display: false }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="bg-white border border-[#cbd5e1] p-4 shadow-sm h-[320px]">
                            <h3 className="text-[10px] font-bold uppercase text-[#64748b] mb-2">Weekly Frequency vs Capacity Used</h3>
                            <div style={{ height: 270 }}>
                                <Bar
                                    data={{
                                        labels: processedData.map(r => `${r.origin}→${r.destination}`),
                                        datasets: [
                                            {
                                                label: 'Flights / Week',
                                                data: processedData.map(r => Number(r.weeklyFrequency || 0)),
                                                backgroundColor: 'rgba(15,23,42,0.8)',
                                                borderRadius: 3,
                                            },
                                            {
                                                label: 'Avg Load Factor %',
                                                data: processedData.map(r => Number(r.avgLoadFactorPercent || 0)),
                                                backgroundColor: 'rgba(59,130,246,0.7)',
                                                borderRadius: 3,
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { labels: { font: { size: 10 }, boxWidth: 12 } },
                                            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` } }
                                        },
                                        scales: {
                                            x: { ticks: { font: { size: 8 }, color: '#64748b', maxRotation: 45 }, grid: { display: false } },
                                            y: { ticks: { font: { size: 9 }, color: '#64748b' }, grid: { color: '#f1f5f9' } }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 max-w-full mx-auto min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans">

            {/* Header */}
            <header className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#0f172a] uppercase tracking-tight">Executive Reports</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleDownload('csv')}
                        className="px-3 py-1.5 bg-white border border-[#cbd5e1] text-[#64748b] text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        ↓ CSV
                    </button>
                    <button
                        onClick={() => handleDownload('json')}
                        className="px-3 py-1.5 bg-[#0f172a] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#2563eb] transition-all"
                    >
                        ↓ JSON
                    </button>
                </div>
            </header>

            {/* Summary stats */}
            <div className="mb-4">
                <FinancialSummary stats={summaryStats} />
            </div>

            {/* Charts */}
            {renderVisuals()}

            {/* Filter bar */}
            <div className="flex items-stretch gap-0 mb-4 border border-[#cbd5e1] bg-white shadow-sm overflow-hidden text-[10px] font-bold uppercase text-[#64748b]">
                <div className="flex-1 border-r border-[#e2e8f0] p-2 bg-[#f8fafc]/50">
                    <label className="block mb-1">Report Module</label>
                    <select value={stagedReportType} onChange={(e) => setStagedReportType(e.target.value)} className="w-full px-2 py-1 bg-white border border-[#e2e8f0] text-[12px] font-semibold outline-none cursor-pointer">
                        <option value="revenue">Financial Revenue</option>
                        <option value="popularity">Market Popularity</option>
                        <option value="activity">Operational Activity</option>
                    </select>
                </div>
                <div className="flex-1 border-r border-[#e2e8f0] p-2">
                    <label className="block mb-1">Sort By</label>
                    <select value={stagedSort.key} onChange={(e) => setStagedSort({ ...stagedSort, key: e.target.value })} className="w-full px-2 py-1 bg-white border border-[#e2e8f0] text-[12px] font-semibold outline-none cursor-pointer">
                        <option value="">Default</option>
                        {(reportColumnsMap[stagedReportType] || []).map(col => (
                            <option key={col} value={col}>{formatHeader(col)}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-[0.6] border-r border-[#e2e8f0] p-2">
                    <label className="block mb-1">Order</label>
                    <select value={stagedSort.direction} onChange={(e) => setStagedSort({ ...stagedSort, direction: e.target.value })} className="w-full px-2 py-1 bg-white border border-[#e2e8f0] text-[12px] font-semibold outline-none cursor-pointer">
                        <option value="asc">ASC</option>
                        <option value="desc">DESC</option>
                    </select>
                </div>
                <div className="flex-[1.2] border-r border-[#e2e8f0] p-2">
                    <label className="block mb-1">Search</label>
                    <input
                        type="text"
                        placeholder="Filter..."
                        value={stagedSearch}
                        onChange={(e) => setStagedSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                        className="w-full px-2 py-1 bg-white border border-[#e2e8f0] text-[12px] outline-none"
                    />
                </div>
                <div className="flex-1 border-r border-[#e2e8f0] p-2 bg-[#f8fafc]/20">
                    <label className="block mb-1">Date Range</label>
                    <div className="flex gap-1">
                        <input
                            type="date"
                            value={stagedDates.start}
                            onChange={(e) => setStagedDates({ ...stagedDates, start: e.target.value })}
                            className="w-full px-2 py-1 border border-[#e2e8f0] text-[12px] outline-none"
                        />
                        <input
                            type="date"
                            value={stagedDates.end}
                            onChange={(e) => setStagedDates({ ...stagedDates, end: e.target.value })}
                            className="w-full px-2 py-1 border border-[#e2e8f0] text-[12px] outline-none"
                        />
                    </div>
                </div>
                <div
                    className="flex items-center px-4 border-r border-[#e2e8f0] cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setStagedShowAll(!stagedShowAll)}
                >
                    <div className={`w-4 h-4 border border-[#94a3b8] mr-2 flex items-center justify-center ${stagedShowAll ? 'bg-[#0f172a] border-[#0f172a]' : 'bg-white'}`}>
                        {stagedShowAll && <div className="w-1.5 h-1.5 bg-white"></div>}
                    </div>
                    <span className="whitespace-nowrap text-[#64748b]">Show All</span>
                </div>
                <button
                    onClick={handleApplyFilters}
                    className="px-8 bg-[#0f172a] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-[#2563eb] transition-all"
                >
                    {loading ? '...' : 'Execute'}
                </button>
            </div>

            {/* Data table */}
            <div className="bg-white border border-[#cbd5e1] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-[#f1f5f9] border-b border-[#cbd5e1]">
                            <tr>
                                {(reportColumnsMap[activeReportType] || []).map(key => (
                                    <th
                                        key={key}
                                        onClick={() => requestHeaderSort(key)}
                                        className="px-3 py-3 text-[10px] font-bold text-[#64748b] uppercase border-r border-[#e2e8f0] cursor-pointer hover:bg-[#e2e8f0] whitespace-nowrap last:border-0 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            {formatHeader(key)}
                                            <span className="text-[8px]">
                                                {activeSort.key === key ? (activeSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {loading ? (
                                <tr>
                                    <td colSpan="20" className="py-12 text-center text-[11px] font-bold text-slate-400 uppercase animate-pulse">
                                        Syncing...
                                    </td>
                                </tr>
                            ) : processedData.length > 0 ? (
                                processedData.map((row, i) => (
                                    <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                                        {(reportColumnsMap[activeReportType]).map((key, j) => (
                                            <td
                                                key={j}
                                                className={`px-3 py-2 border-r border-[#f1f5f9] last:border-0 text-[11px] font-medium ${key === 'refunds' ? 'text-red-600 font-bold' : 'text-slate-700'}`}
                                            >
                                                {formatValue(key, row[key])}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="20" className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                                        No Records Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}