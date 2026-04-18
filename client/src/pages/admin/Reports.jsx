import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api"; 
import FinancialSummary from "./FinancialSummary";

export default function Reports() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [stagedReportType, setStagedReportType] = useState("revenue");
    const [stagedDates, setStagedDates] = useState({ start: "", end: "" });
    const [stagedShowAll, setStagedShowAll] = useState(false); 
    const [stagedSearch, setStagedSearch] = useState("");
    const [stagedSort, setStagedSort] = useState({ key: "", direction: "asc" });
    
    const [activeReportType, setActiveReportType] = useState("revenue");
    const [activeDates, setActiveDates] = useState({ start: "", end: "" });
    const [activeShowAll, setActiveShowAll] = useState(false);
    const [activeSearch, setActiveSearch] = useState("");
    const [activeSort, setActiveSort] = useState({ key: null, direction: 'asc' });

    const summaryConfigs = {
        revenue: [
            { label: "TOTAL REVENUE", value: "$1,911,003.00", subLabel: "NETWORK TOTAL", subValue: "USD" },
            { label: "MOST PROFITABLE CABIN", value: "PREMIUM", subLabel: "REVENUE SHARE", subValue: "62%", highlighted: true },
            { label: "AVERAGE NETWORK FARE", value: "$874.20", subLabel: "PER TICKET", subValue: "AVG" },
            { label: "TOP PERFORMING SECTOR", value: "ICN-CDG", subLabel: "SECTOR REVENUE", subValue: "$1,746,300.00" }
        ],
        popularity: [
            { label: "MOST POPULAR DESTINATION", value: "CDG", subLabel: "TOTAL BOOKINGS", subValue: "2,073" },
            { label: "LEAST POPULAR DESTINATION", value: "CLT", subLabel: "TOTAL BOOKINGS", subValue: "14", highlighted: true },
            { label: "PEAK TRAVEL MONTH", value: "APRIL", subLabel: "SYSTEM WIDE", subValue: "2026" },
            { label: "PEAK TRAVEL DAY", value: "SATURDAY", subLabel: "AVG DENSITY", subValue: "HIGH" }
        ],
        activity: [
            { label: "TOTAL FLIGHT CYCLES", value: "482", subLabel: "SCHEDULED", subValue: "510" },
            { label: "SYSTEM LOAD FACTOR", value: "9.60%", subLabel: "TOTAL CAPACITY", subValue: "22,680", highlighted: true },
            { label: "ACTIVE TAIL COUNT", value: "18", subLabel: "FLEET STATUS", subValue: "OPERATIONAL" },
            { label: "WEEKLY FREQUENCY", value: "7.20", subLabel: "AVG PER ROUTE", subValue: "FLIGHTS" }
        ]
    };

    const reportColumnsMap = {
        revenue: ["origin", "destination", "passengers", "totalRevenue", "avgFare", "cabinDriver"],
        popularity: ["destination", "totalActiveBookings", "passengersPerWeek", "revenueContributionPercent", "peakMonth", "peakDay"],
        activity: ["origin", "destination", "tailNumber", "planeModel", "weeklyFrequency", "avgLoadFactorPercent"]
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`reports/${activeReportType}`);
            setData(res.data || []);
        } catch (err) {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [activeReportType]);

    const handleApplyFilters = () => {
        setActiveReportType(stagedReportType);
        setActiveDates(stagedDates);
        setActiveShowAll(stagedShowAll);
        setActiveSearch(stagedSearch);
        setActiveSort({ ...stagedSort });
    };

    const requestHeaderSort = (key) => {
        let direction = 'asc';
        if (activeSort.key === key && activeSort.direction === 'asc') {
            direction = 'desc';
        }
        setActiveSort({ key, direction });
    };

    const processedData = useMemo(() => {
        let items = [...data];
        
        // Filter logic for toggling "Show All"
        if (!activeShowAll) {
            items = items.filter(row => {
                if (activeReportType === 'revenue') {
                    // Only show routes that made money
                    return Number(row.totalRevenue || 0) > 0;
                }
                if (activeReportType === 'popularity') {
                    // Only show routes with bookings
                    return Number(row.totalActiveBookings || 0) > 0;
                }
                if (activeReportType === 'activity') {
                    // Only show planes with purchased tickets (Load Factor > 0)
                    return Number(row.avgLoadFactorPercent || 0) > 0;
                }
                return true;
            });
        }

        if (activeSearch) {
            items = items.filter(row => Object.values(row).some(v => v?.toString().toLowerCase().includes(activeSearch.toLowerCase())));
        }

        if (activeSort.key) {
            items.sort((a, b) => {
                const aVal = a[activeSort.key];
                const bVal = b[activeSort.key];
                if (aVal < bVal) return activeSort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return activeSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [data, activeSearch, activeSort, activeShowAll, activeReportType]);

    const formatValue = (key, val) => {
        const k = key.toLowerCase();
        if (k === 'cabindriver' || k === 'peakmonth' || k === 'peakday') return val?.toString().toUpperCase();
        if (['totalrevenue', 'avgfare'].includes(k)) {
            return `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (k.includes('percent') || k.includes('factor')) return `${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        return val?.toString() ?? "—";
    };

    const formatHeader = (key) => {
        let label = key.replace(/([A-Z])/g, ' $1').trim();
        return label.toUpperCase();
    };

    return (
        <div className="p-4 max-w-full mx-auto min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans">
            <header className="mb-4">
                <h1 className="text-2xl font-bold text-[#0f172a] uppercase tracking-tight">Executive Reports</h1>
            </header>

            <div className="mb-4">
                <FinancialSummary stats={summaryConfigs[activeReportType]} />
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
                        {(reportColumnsMap[stagedReportType] || []).map(col => (<option key={col} value={col}>{formatHeader(col)}</option>))}
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
                    <input type="text" placeholder="Filter..." value={stagedSearch} onChange={(e) => setStagedSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} className="w-full px-2 py-1 bg-white border border-[#e2e8f0] text-[12px] outline-none" />
                </div>

                {/* Show All Toggle */}
                <div className="flex items-center px-4 border-r border-[#e2e8f0] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setStagedShowAll(!stagedShowAll)}>
                    <div className={`w-4 h-4 border border-[#94a3b8] mr-2 flex items-center justify-center ${stagedShowAll ? 'bg-[#0f172a] border-[#0f172a]' : 'bg-white'}`}>
                        {stagedShowAll && <div className="w-1.5 h-1.5 bg-white"></div>}
                    </div>
                    <span className="whitespace-nowrap text-[#64748b]">Show All</span>
                </div>

                <button onClick={handleApplyFilters} className="px-8 bg-[#0f172a] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-[#2563eb] transition-all">
                    {loading ? '...' : 'Execute'}
                </button>
            </div>

            <div className="bg-white border border-[#cbd5e1] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-[#f1f5f9] border-b border-[#cbd5e1]">
                            <tr>
                                {(reportColumnsMap[activeReportType] || []).map(key => (
                                    <th key={key} onClick={() => requestHeaderSort(key)} className="px-3 py-2 text-[10px] font-bold text-[#64748b] uppercase border-r border-[#e2e8f0] cursor-pointer hover:bg-[#e2e8f0] whitespace-nowrap last:border-0">
                                        <div className="flex items-center justify-between gap-2">
                                            {formatHeader(key)}
                                            <span className="text-[8px]">{activeSort.key === key ? (activeSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {loading ? (
                                <tr><td colSpan="20" className="py-12 text-center text-[11px] font-bold text-slate-400 uppercase animate-pulse">Syncing...</td></tr>
                            ) : processedData.length > 0 ? (processedData.map((row, i) => (
                                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                    {(reportColumnsMap[activeReportType]).map((key, j) => (
                                        <td key={j} className="px-3 py-1.5 border-r border-[#f1f5f9] last:border-0 text-[11px] font-medium text-slate-700">
                                            {formatValue(key, row[key])}
                                        </td>
                                    ))}
                                </tr>
                            ))) : (
                                <tr><td colSpan="20" className="py-8 text-center text-[10px] font-bold text-slate-400 uppercase">No Records Found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}