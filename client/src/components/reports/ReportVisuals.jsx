import React from 'react';

export default function ReportVisuals({ data, activeTab }) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="h-32 mb-10 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Awaiting Report Data...</p>
            </div>
        );
    }

    let chartTitle = "";
    let chartData = [];
    let unit = "";

    if (activeTab === 'revenue') {
        chartTitle = "Highest Revenue Routes";
        unit = "$";
        chartData = [...data]
            .sort((a, b) => ((b.totalRevenue || b.TotalRevenue) || 0) - ((a.totalRevenue || a.TotalRevenue) || 0))
            .slice(0, 5)
            .map(d => ({ 
                label: (d.origin || d.Origin) && (d.destination || d.Destination) ? `${d.origin || d.Origin}-${d.destination || d.Destination}` : "Unknown Route", 
                val: (d.totalRevenue || d.TotalRevenue) || 0 
            }));
    } else if (activeTab === 'popularity') {
        chartTitle = "Top Destination Popularity";
        unit = "Pax";
        chartData = [...data]
            .sort((a, b) => ((b.passengerCount || b.PassengerCount) || 0) - ((a.passengerCount || a.PassengerCount) || 0))
            .slice(0, 5)
            .map(d => ({ 
                label: d.destination || d.Destination || "Unknown Dest", 
                val: (d.passengerCount || d.PassengerCount) || 0 
            }));
    } else {
        chartTitle = "Fleet Utilization (Hours/Day)";
        unit = "Hrs";
        chartData = [...data]
            .sort((a, b) => ((b.utilizationHours || b.UtilizationHours) || 0) - ((a.utilizationHours || a.UtilizationHours) || 0))
            .slice(0, 5)
            .map(d => ({ 
                label: d.tailNumber || d.TailNumber || d.aircraftType || d.AircraftType || "Unknown AC", 
                val: (d.utilizationHours || d.UtilizationHours) || 0 
            }));
    }

    const maxValue = Math.max(...chartData.map(d => d.val), 1);
    const avgStat = data.reduce((acc, curr) => acc + (curr.utilizationPct || curr.UtilizationPct || 0), 0) / data.length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 animate-in fade-in duration-500">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">{chartTitle}</h3>
                <div className="flex items-end justify-around h-40 gap-4">
                    {chartData.map((item, i) => (
                        <div key={i} className="flex-grow flex flex-col items-center group max-w-[100px]">
                            <div className="relative w-full flex flex-col justify-end items-center h-32">
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg font-bold z-10">
                                    {unit === '$' ? `$${(item.val || 0).toLocaleString()}` : `${(item.val || 0).toLocaleString()} ${unit}`}
                                </div>
                                <div 
                                    className={`w-full rounded-t-xl transition-all duration-1000 ease-out ${activeTab === 'revenue' ? 'bg-emerald-500' : activeTab === 'popularity' ? 'bg-blue-500' : 'bg-slate-700'}`}
                                    style={{ height: `${((item.val || 0) / maxValue) * 100}%` }}
                                />
                            </div>
                            <span className="mt-4 text-[9px] font-black text-slate-500 uppercase truncate w-full text-center">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-3xl p-8 text-white flex-grow flex flex-col justify-center">
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2 text-blue-400">System Utilization</p>
                    <div className="flex items-baseline gap-1">
                        <h4 className="text-6xl font-black">{(avgStat || 0).toFixed(1)}</h4>
                        <span className="text-2xl font-bold opacity-30">%</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-8 flex-grow flex flex-col justify-center shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fleet Status</p>
                    <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                        {avgStat > 85 ? 'High Load' : avgStat < 40 ? 'Under-Used' : 'Optimal'}
                    </h4>
                </div>
            </div>
        </div>
    );
}