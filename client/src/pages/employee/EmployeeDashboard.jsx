import React from 'react';
import { useNavigate } from 'react-router-dom';

function Employee() {
    const navigate = useNavigate();

    const menuItems = [
        { 
            label: "View Flights", 
            icon: "✈️", 
            path: "/flights", 
            color: "bg-red-400",
            description: "View your assigned flights" 
        },
        { 
            label: "Passenger List", 
            icon: "👥", 
            path: "/passenger-list", 
            color: "bg-blue-400",
            description: "View traveler info" 
        },
        { 
            label: "My Profile", 
            icon: "👤", 
            path: "/profile", 
            color: "bg-yellow-400",
            description: "Manage your account information" 
        }
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-black-900">Employee Dashboard</h1>
                <p className="font-bold text-gray-500 mt-2">Welcome back. Select an operation below to get started.</p>
            </header>

            <div className="flex flex-wrap justify-center gap-6">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="group relative flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 text-center w-full sm:w-64"
                    >
                        <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                            {item.icon}
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600">
                            {item.label}
                        </h3>

                        <span className="font-semibold text-sm text-gray-500 mt-1">
                            {item.description}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Employee;