import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api"; 

export default function Reports() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Staging states
    const [stagedReportType, setStagedReportType] = useState("revenue");
    const [stagedDates, setStagedDates] = useState({ start: "", end: "" });
    const [stagedShowAll, setStagedShowAll] = useState(false); 
    const [stagedSearch, setStagedSearch] = useState("");
    
    // Active states
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

    useEffect(() => {
        loadData();
    }, [activeReportType, activeDates]);

    const handleApplyFilters = () => {
        setActiveReportType(stagedReportType);
        setActiveDates(stagedDates);
        setActiveShowAll(stagedShowAll);
        setActiveSearch(stagedSearch);
    };

    const handleReset = () => {
        const defaultDates = { start: "", end: "" };
        setStagedReportType("revenue");
        setStagedDates(defaultDates);
        setStagedShowAll(false);
        setStagedSearch("");
        
        setActiveReportType("revenue");
        setActiveDates(defaultDates);
        setActiveShowAll(false);
        setActiveSearch("");
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const processedData = useMemo(() => {
        let items = [...data];

        if (!activeShowAll) {
            items = items.filter(row => {
                return Object.entries(row).some(([key, val]) => {
                    const k = key.toLowerCase();
                    const isActivityKey = 
                        k.includes('revenue') || 
                        k.includes('fare') || 
                        k.includes('ticket') || 
                        k.includes('price') || 
                        k.includes('loadfactor') || 
                        k.includes('passengers');

                    return isActivityKey && Number(val) > 0;
                });
            });
        }

        if (activeSearch) {
            items = items.filter(row => 
                Object.values(row).some(val => 
                    val?.toString().toLowerCase().includes(activeSearch.toLowerCase())
                )
            );
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
        if (k.includes('passengersperweek')) {
            return (
                <div className="flex items-center gap-1.5">
                    <span className="text-slate-900 font-black text-lg">{val.toLocaleString()}</span>
                    <span className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded font-bold uppercase border border-blue-100">pax/wk</span>
                </div>
            );
        }
        if (k.includes('percent') || k.includes('factor')) return <span className="text-blue-600 font-black">{val}%</span>;
        if (k.includes('frequency')) return <span className="text-slate-900 font-black text-xl">{val}<span className="text-blue-600 text-sm ml-0.5">x</span></span>;
        if (k.includes('tailnumber')) return <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono text-[10px] tracking-widest leading-none">{val}</span>;
        if (k.includes('price') || k.includes('revenue') || k.includes('fare')) return `$${Number(val || 0).toLocaleString()}`;
        return val?.toString() ?? "—";
    };

    const SortIndicator = ({ columnKey }) => {
        const isActive = sortConfig.key === columnKey;
        return (
            <div className="ml-2 flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                <svg className={`w-2.5 h-2.5 ${isActive && sortConfig.direction === 'asc' ? 'text-blue-600 opacity-100' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l-7 7h14l-7-7z" /></svg>
                <svg className={`w-2.5 h-2.5 ${isActive && sortConfig.direction === 'desc' ? 'text-blue-600 opacity-100' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l7-7H3l7 7z" /></svg>
            </div>
        );
    };

    return (
        <div className="p-10 max-w-7xl mx-auto min-h-screen bg-white text-slate-900 font-sans">
            <header className="mb-10 border-l-8 border-blue-600 pl-6 flex justify-between items-end">
                <h1 className="text-6xl font-black tracking-[0.1em] uppercase text-slate-900 leading-none">
                    REPORTS
                </h1>
                <div className="flex flex-col items-end">
                    <button 
                        onClick={handleApplyFilters}
                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-95 shadow-lg flex items-center gap-3"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Apply & Refresh
                    </button>
                </div>
            </header>

            {/* REDUCED GAP AND CUSTOM FRACTIONS FOR WIDTH BALANCING */}
            <div className="grid grid-cols-[1.4fr_0.8fr_2.4fr_1.2fr_1.2fr_0.6fr] items-end gap-3 mb-8 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                
                {/* 1. WIDER MODULE */}
                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1">Report Module</label>
                    <select 
                        value={stagedReportType} 
                        onChange={(e) => setStagedReportType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider text-blue-600 focus:ring-2 ring-blue-500 shadow-sm outline-none cursor-pointer appearance-none h-[42px]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232563eb'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1em'
                        }}
                    >
                        <option value="revenue">Financial Revenue</option>
                        <option value="popularity">Market Popularity</option>
                        <option value="activity">Operational Activity</option>
                    </select>
                </div>

                {/* 2. NARROWER VISIBILITY */}
                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1">Visibility</label>
                    <div className="flex items-center h-[42px] gap-2.5 bg-white border border-slate-200 px-3 rounded-xl shadow-sm cursor-pointer select-none" onClick={() => setStagedShowAll(!stagedShowAll)}>
                        <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${stagedShowAll ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                            {stagedShowAll && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <label className="text-[10px] font-black uppercase text-slate-600 cursor-pointer truncate">Show All</label>
                    </div>
                </div>

                {/* 3. MUCH WIDER SEARCH */}
                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1">Search</label>
                    <input 
                        type="text" 
                        placeholder="Filter results..." 
                        value={stagedSearch}
                        onChange={(e) => setStagedSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 ring-blue-500 outline-none h-[42px]"
                    />
                </div>
                
                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1">Start</label>
                    <input type="date" value={stagedDates.start} onChange={(e) => setStagedDates({...stagedDates, start: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 shadow-sm outline-none h-[42px]" />
                </div>

                <div className="flex flex-col">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1">End</label>
                    <input type="date" value={stagedDates.end} onChange={(e) => setStagedDates({...stagedDates, end: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 shadow-sm outline-none h-[42px]" />
                </div>

                {/* 6. COMPACT RESET COLUMN */}
                <div className="flex items-center justify-center">
                    <button onClick={handleReset}
                        className="w-full px-2 py-2.5 text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors h-[42px] flex items-center justify-center">
                        Reset
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden mb-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {data.length > 0 ? Object.keys(data[0]).map(key => (
                                    <th 
                                        key={key} 
                                        onClick={() => requestSort(key)}
                                        className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                    >
                                        <div className="flex items-center">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                            <SortIndicator columnKey={key} />
                                        </div>
                                    </th>
                                )) : <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase text-center italic tracking-widest">Awaiting stream...</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="10" className="py-40 text-center text-xl font-black text-slate-200 animate-pulse tracking-[0.6em] uppercase">Syncing...</td></tr>
                            ) : processedData.length > 0 ? (
                                processedData.map((row, i) => (
                                    <tr key={i} className="hover:bg-blue-50/40 transition-colors group">
                                        {Object.entries(row).map(([key, val], j) => (
                                            <td key={j} className="px-8 py-6 text-sm font-bold text-slate-600 group-hover:text-blue-900">{formatValue(key, val)}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="10" className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Zero Results</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <footer className="flex justify-end items-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                <div className="flex gap-6">
                    <span className={`${!activeShowAll ? 'text-blue-400' : ''}`}>Mode: {activeShowAll ? 'UNFILTERED' : 'PURCHASED ONLY'}</span>
                    <span>Total: {processedData.length}</span>
                </div>
            </footer>
        </div>
    );
}