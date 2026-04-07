import React from 'react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card'
import { useNavigate } from 'react-router-dom';

function Employee() {
    const navigate = useNavigate();

    const menuItems = [
        { label: "View Flights", icon: "✈️", path: "/flights", color: "bg-blue-50" },
        { label: "Add Flights", icon: "➕", path: "/add-flight", color: "bg-green-50" },
        { label: "Passenger List", icon: "👥", path: "/passenger-list", color: "bg-purple-50" },
        { label: "My Profile", icon: "👤", path: "/profile", color: "bg-gray-50" }
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
                <p className="text-gray-500 mt-2">Welcome back. Select an operation below to get started.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="group relative flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 text-left"
                    >
                        <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600">
                            {item.label}
                        </h3>
                        <span className="text-sm text-gray-400 mt-1">Manage {item.label.toLowerCase()}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Employee;