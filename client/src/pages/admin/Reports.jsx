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
    
    const [activeReportType, setActiveReportType] = useState("revenue");
    const [activeDates, setActiveDates] = useState({ start: "", end: "" });
    const [activeShowAll, setActiveShowAll] = useState(false);
    const [activeSearch, setActiveSearch] = useState("");

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeDates.start) params.append("start", activeDates.start);
            if (activeDates.end) params.append("end", activeDates.end);
            const res = await api.get(`reports/${activeReportType}?${params.toString()}`);
            setData(Array.isArray(res.data) ? res.data : []);
            setSortConfig({ key: null, direction: 'asc' }); 
        } catch (err) {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [activeReportType, activeDates]);

    const handleApplyFilters = () => {
        setActiveReportType(stagedReportType);
        setActiveDates(stagedDates);
        setActiveShowAll(stagedShowAll);
        setActiveSearch(stagedSearch);
    };

    const handleReset = () => {
        setStagedReportType("revenue");
        setStagedDates({ start: "", end: "" });
        setStagedShowAll(false);
        setStagedSearch("");
        setActiveReportType("revenue");
        setActiveDates({ start: "", end: "" });
        setActiveShowAll(false);
        setActiveSearch("");
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const processedData = useMemo(() => {
        let items = [...data];
        if (!activeShowAll) {
            items = items.filter(row => {
                return Object.entries(row).some(([key, val]) => {
                    const k = key.toLowerCase();
                    return (k.includes('revenue') || k.includes('fare') || k.includes('ticket') || k.includes('price') || k.includes('loadfactor') || k.includes('passengers')) && Number(val) > 0;
                });
            });
        }
        if (activeSearch) {
            items = items.filter(row => Object.values(row).some(val => val?.toString().toLowerCase().includes(activeSearch.toLowerCase())));
        }
        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [data, activeSearch, sortConfig, activeShowAll]);

    const formatValue = (key, val) => {
        const k = key.toLowerCase();
        if (k.includes('tailnumber')) return <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono text-[9px] tracking-widest">{val}</span>;
        
        if (k.includes('percent') || k.includes('contribution') || k.includes('factor')) {
            return <span className="text-blue-600 font-black">{val}%</span>;
        }

        if (k.includes('price') || k.includes('revenue') || k.includes('fare')) {
            return `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        return val?.toString() ?? "—";
    };

    const getReportLabel = (type) => {
        const labels = {
            revenue: "Financial Revenue",
            popularity: "Market Popularity",
            activity: "Operational Activity"
        };
        return labels[type] || type;
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-white text-slate-900 font-sans">
            <header className="mb-6 flex justify-between items-end border-l-4 border-blue-600 pl-4">
                <h1 className="text-4xl font-black tracking-[0.05em] uppercase text-slate-900 leading-none">REPORTS</h1>
                <div className="flex items-center gap-6">
                     <button onClick={handleReset} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Reset All</button>
                </div>
            </header>

            <FinancialSummary />

            {/* Compact Controls Grid */}
            <div className="grid grid-cols-[1.2fr_0.8fr_1.5fr_1fr_1fr_1fr] items-end gap-3 mb-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                
                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1 tracking-widest">Report Module</label>
                    <div className="relative group">
                        <div className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 h-[42px] shadow-sm transition-all group-hover:border-blue-300">
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="text-[11px] font-black uppercase text-blue-600 truncate">
                                {getReportLabel(stagedReportType)}
                            </span>
                            <select 
                                value={stagedReportType} 
                                onChange={(e) => setStagedReportType(e.target.value)} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                <option value="revenue">Financial Revenue</option>
                                <option value="popularity">Market Popularity</option>
                                <option value="activity">Operational Activity</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1 tracking-widest">Visibility</label>
                    <div className="flex items-center h-[42px] gap-2.5 bg-white border border-slate-200 px-3 rounded-xl shadow-sm cursor-pointer select-none" onClick={() => setStagedShowAll(!stagedShowAll)}>
                        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${stagedShowAll ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                            {stagedShowAll && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <label className="text-[10px] font-black uppercase text-slate-600 cursor-pointer">Show All</label>
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1 tracking-widest">Search</label>
                    <input type="text" placeholder="Filter results..." value={stagedSearch} onChange={(e) => setStagedSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold shadow-sm focus:ring-2 ring-blue-500 outline-none h-[42px]" />
                </div>

                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1 tracking-widest">Start</label>
                    <input type="date" value={stagedDates.start} onChange={(e) => setStagedDates({...stagedDates, start: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-2 text-[10px] font-bold text-slate-600 h-[42px]" />
                </div>
                
                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1 tracking-widest">End</label>
                    <input type="date" value={stagedDates.end} onChange={(e) => setStagedDates({...stagedDates, end: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-2 text-[10px] font-bold text-slate-600 h-[42px]" />
                </div>

                <button onClick={handleApplyFilters} className="bg-slate-900 text-white w-full h-[42px] rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2">
                    <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Apply
                </button>
            </div>

            {/* Tighter Table Container */}
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {data.length > 0 ? Object.keys(data[0]).map(key => (
                                    <th key={key} onClick={() => requestSort(key)} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                                        <div className="flex items-center gap-2">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                            {sortConfig.key === key && (
                                                <span className="text-blue-600 text-[9px]">
                                                    {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                )) : <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Awaiting stream...</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="10" className="py-20 text-center text-sm font-black text-slate-200 animate-pulse tracking-[0.4em] uppercase">Syncing...</td></tr>
                            ) : processedData.length > 0 ? (
                                processedData.map((row, i) => (
                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                        {Object.entries(row).map(([key, val], j) => (
                                            <td key={j} className="px-6 py-3.5 text-[11px] font-bold text-slate-600 group-hover:text-blue-900 border-r border-slate-50 last:border-0">{formatValue(key, val)}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="10" className="py-10 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Zero Results</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <footer className="flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-[0.1em] mb-6">
                <span>REPORTS BY AULIA</span>
                <div className="flex gap-6">
                    <span>MODE: {activeShowAll ? 'UNFILTERED' : 'PURCHASED'}</span>
                    <span>ENTRIES: {processedData.length}</span>
                </div>
            </footer>
        </div>
    );
}