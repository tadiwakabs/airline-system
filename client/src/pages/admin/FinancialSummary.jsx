import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api"; 

const FinancialSummary = () => {
    const [finData, setFinData] = useState([]);
    const [fleetData, setFleetData] = useState([]);
    const [popData, setPopData] = useState([]); // Added for Peak Month fallback
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLockedStats = async () => {
            try {
                const [revRes, fleetRes, popRes] = await Promise.all([
                    api.get("reports/revenue"),
                    api.get("aircraft"),
                    api.get("reports/popularity")
                ]);
                setFinData(Array.isArray(revRes.data) ? revRes.data : []);
                setFleetData(Array.isArray(fleetRes.data) ? fleetRes.data : []);
                setPopData(Array.isArray(popRes.data) ? popRes.data : []);
            } catch (err) {
                console.error("Summary sync failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLockedStats();
    }, []);

    const kpis = useMemo(() => {
        // 1. Financials & Load Factor
        let totalRev = 0;
        let totalPax = 0;
        const sectorMap = {};

        finData.forEach(row => {
            const rev = Number(row.totalRevenue ?? row.TotalRevenue ?? 0);
            const pax = Number(row.passengers ?? row.Passengers ?? 0);
            const origin = row.origin ?? row.Origin ?? '??';
            const dest = row.destination ?? row.Destination ?? '??';
            const route = `${origin}-${dest}`;

            totalRev += rev;
            totalPax += pax;
            if (origin !== '??' && dest !== '??') {
                sectorMap[route] = (sectorMap[route] || 0) + rev;
            }
        });

        let topRoute = "N/A", topRouteRev = 0;
        Object.entries(sectorMap).forEach(([route, rev]) => {
            if (rev > topRouteRev) { topRouteRev = rev; topRoute = route; }
        });

        const totalSeats = fleetData.reduce((acc, ac) => acc + Number(ac.numSeats ?? ac.NumSeats ?? 0), 0);
        const loadFactor = totalSeats > 0 ? (totalPax / totalSeats) * 100 : 0;

        // 2. Peak Travel Month (Rolling 12)
        // We pull the peakMonth from the popularity report which uses the SQL MAX count logic
        let peakMonth = "N/A";
        if (popData.length > 0) {
            // Find the destination with the highest active bookings to determine the network peak
            const topDest = popData[0]; 
            peakMonth = topDest.peakMonth ?? topDest.PeakMonth ?? "N/A";
        }

        return {
            totalRev,
            avgFare: totalPax > 0 ? totalRev / totalPax : 0,
            topRoute,
            topRouteRev,
            totalSeats,
            loadFactor,
            peakMonth
        };
    }, [finData, fleetData, popData]);

    const fmt = (v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) return <div className="grid grid-cols-4 gap-6 mb-10 h-48 animate-pulse bg-slate-50 rounded-[3rem]" />;

    return (
        <div className="grid grid-cols-4 gap-6 mb-10">
            {/* TILE 1: REVENUE */}
            <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Total Revenue</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">{fmt(kpis.totalRev)}</h3>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Avg Network Fare</p>
                    <p className="text-xl font-black text-blue-400">{fmt(kpis.avgFare)}</p>
                </div>
            </div>

            {/* TILE 2: LOAD FACTOR */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">System Load Factor</p>
                    <h3 className="text-5xl font-black text-slate-900 leading-none">
                        {kpis.loadFactor.toFixed(1)}<span className="text-blue-600">%</span>
                    </h3>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Total Capacity</p>
                    <p className="text-2xl font-black text-slate-900">{kpis.totalSeats.toLocaleString()}</p>
                </div>
            </div>

            {/* TILE 3: PEAK MONTH */}
            <div className="bg-blue-600 rounded-[3rem] p-10 shadow-xl flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-blue-200 mb-2 tracking-widest">Peak Travel Month</p>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{kpis.peakMonth}</h3>
                </div>
                <div className="mt-8 pt-6 border-t border-blue-500">
                    <p className="text-[10px] font-black uppercase text-blue-200 mb-1 tracking-widest">Rolling 12M Window</p>
                    <p className="text-sm font-bold text-white italic">Based on booking density</p>
                </div>
            </div>

            {/* TILE 4: SECTOR PERFORMANCE */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Top Sector</p>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{kpis.topRoute}</h3>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Sector Revenue</p>
                    <p className="text-xl font-black text-blue-600">{fmt(kpis.topRouteRev)}</p>
                </div>
            </div>
        </div>
    );
};

export default FinancialSummary;