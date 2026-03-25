import React from 'react';
import { Routes, Route } from "react-router-dom";
import './globals.css'
import AppLayout from "./components/layout/AppLayout.jsx";

// Route Imports
import Home from './pages/Home'
import Register from './pages/Register'
import Ticket from './pages/Ticket'

function App() {
    return (
            <AppLayout>
                <Routes>
                    {/* Open Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />

                    {/* User-Authenticated Routes */}
                    <Route path = "/ticket" element={<Ticket />} />

                    {/* Employee-Authenticated Routes */}

                    {/* Administrator-Authenticated Routes */}

                </Routes>
            </AppLayout>
        
    );
}

export default App;
