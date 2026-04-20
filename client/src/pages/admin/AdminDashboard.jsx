import React from 'react';
import { useNavigate } from 'react-router-dom';

function Admin() {
    const navigate = useNavigate();

    const menuItems = [
        { 
            label: "Manage Flights", 
            icon: "🛫", 
            path: "/flights", 
            color: "bg-purple-600",
            description: "Manage existing flights"
        },
        { 
            label: "Manage Aircraft", 
            icon: "⚙️", 
            path: "/aircraft", 
            color: "bg-blue-600",
            description: "Maintain fleet and plane assignments"
        },
        { 
            label: "Manage Airports", 
            icon: "🏢", 
            path: "/airports", 
            color: "bg-orange-400",
            description: "Manage existing airports"
        },
        {
            label: "Manage Employees",
            icon: "👥",
            path: "/employees",
            color: "bg-green-400",
            description: "Manage existing employees"
        },
        {
            label: "Crew Assignments",
            icon: "🧑‍✈️",
            path: "/flight-ops/crew-assignment",
            color: "bg-cyan-500",
            description: "Assign cabin crew to flights"
        },
        {
            label: "Bag Check",
            icon: "🧳",
            path: "/cabin-crew/bag-check",
            color: "bg-emerald-500",
            description: "Check passenger bags for assigned flights",
        },
        {
            label: "Passenger List",
            icon: "👥",
            path: "/passenger-list",
            color: "bg-blue-400",
            description: "View passenger details for assigned flights",
        },
        {
            label: "Reports",
            icon: "📊",
            path: "/reports",
            color: "bg-red-400",
            description: "Analyze reports"
        },
        {
            label: "My Profile",
            icon: "👤",
            path: "/profile",
            color: "bg-yellow-500",
            description: "Manage your account information"
        },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            
            <header className="mb-12">
                <h1 className="text-5xl font-black text-white drop-shadow-2xl tracking-tight">
                    Admin Dashboard
                </h1>
                <p className="text-lg font-bold text-white mt-3 drop-shadow-lg opacity-90">
                    Welcome back. Select an operation below to get started.
                </p>
            </header>

            {/* --- Dashboard Grid --- */}
            <div className="flex flex-wrap justify-center gap-8">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="group relative flex flex-col items-center justify-center p-10 bg-white/95 backdrop-blur-md border-none rounded-[2.5rem] shadow-xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-300 text-center w-full sm:w-72"
                    >
                        {/* Icon Container */}
                        <div className={`w-20 h-20 ${item.color} rounded-3xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                            {item.icon}
                        </div>

                        {/* Text Content */}
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {item.label}
                        </h3>

                        <p className="text-sm font-semibold text-slate-500 mt-2 leading-relaxed">
                            {item.description}
                        </p>

                        {/* Subtle bottom indicator on hover */}
                        <div className="absolute bottom-4 w-12 h-1.5 bg-transparent group-hover:bg-blue-600/20 rounded-full transition-all" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Admin;