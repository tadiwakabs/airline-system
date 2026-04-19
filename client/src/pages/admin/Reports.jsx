import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api"; 
import FinancialSummary from "./FinancialSummary";

export default function Reports() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [stagedReportType, setStagedReportType] = useState("revenue");
    const [stagedShowAll, setStagedShowAll] = useState(false); 
    const [stagedSearch, setStagedSearch] = useState("");
    const [stagedSort, setStagedSort] = useState({ key: "", direction: "asc" });
    const [stagedDates, setStagedDates] = useState({ start: "", end: "" });
    
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

    const summaryStats = useMemo(() => {
        if (!data.length) return [
            { label: "—", value: "—", subLabel: "—", subValue: "—" },
            { label: "—", value: "—", subLabel: "—", subValue: "—" },
            { label: "—", value: "—", subLabel: "—", subValue: "—" },
            { label: "—", value: "—", subLabel: "—", subValue: "—" },
        ];

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
        if (['totalrevenue', 'avgfare', 'profit'].includes(k)) {
            return `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (k === 'refunds') {
            const num = Number(val || 0);
            const formatted = `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            return num > 0 ? `-${formatted}` : formatted;
        }
        if (k.includes('percent') || k.includes('factor')) {
            return `${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        }
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

    return (
        <div className="p-4 max-w-full mx-auto min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans">
            <header className="mb-4">
                <h1 className="text-2xl font-bold text-[#0f172a] uppercase tracking-tight">Executive Reports</h1>
            </header>

            <div className="mb-4">
                <FinancialSummary stats={summaryStats} />
            </div>

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