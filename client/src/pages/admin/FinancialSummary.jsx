import React from "react";

export default function FinancialSummary({ stats = [] }) {
    return (
        <div className="grid grid-cols-4 gap-0 mb-4 border border-[#cbd5e1] bg-white shadow-sm">
            {stats.map((stat, index) => (
                <div 
                    key={index} 
                    className={`p-3 flex flex-col justify-between hover:bg-slate-50 transition-colors ${index !== 3 ? 'border-r border-[#e2e8f0]' : ''}`}
                >
                    <div>
                        <span className="block text-[10px] font-bold uppercase tracking-tight text-[#64748b] mb-1">
                            {stat.label}
                        </span>
                        <div className={`text-xl font-bold tabular-nums tracking-tighter ${stat.highlighted ? 'text-blue-600' : 'text-[#0f172a]'}`}>
                            {stat.value}
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#f1f5f9] flex justify-between items-center">
                        <span className="text-[9px] font-semibold text-[#94a3b8] uppercase">{stat.subLabel}</span>
                        <span className={`text-[11px] font-bold tabular-nums ${stat.highlighted ? 'text-[#0f172a]' : 'text-blue-600'}`}>
                            {stat.subValue}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}