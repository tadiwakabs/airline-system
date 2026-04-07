import React from 'react';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

function Admin() {
    const navigate = useNavigate();

    const menuItems = [
        { label: "Manage Flights", icon: "✈️", path: "/flights", color: "bg-blue-50" },
        { label: "Add Flights", icon: "📝", path: "/add-flight", color: "bg-green-50" },
        { label: "Manage Aircraft", icon: "🔧", path: "/manage-aircraft", color: "bg-purple-50" },
        { label: "Reports", icon: "📊", path: "/report", color: "bg-skyblue-50" },
        { label: "My Profile", icon: "🆔", path: "/profile", color: "bg-gray-50" }
    ];
}

export default Admin;