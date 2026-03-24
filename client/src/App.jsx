import React from 'react';
import { Routes, Route } from "react-router-dom";
import './globals.css'
import AppLayout from "./components/layout/AppLayout.jsx";

// Route Imports
import Home from './pages/Home'
import Register from './pages/Register'
import Flights from "./pages/Flights";

function App() {
    return (
            <AppLayout>
                <Routes>
                    {/* Open Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />

                    {/* User-Authenticated Routes */}

                    {/* Employee-Authenticated Routes */}
                    <Route path="/flights" element={<Flights />} />

                    {/* Administrator-Authenticated Routes */}

                </Routes>
            </AppLayout>
        
    );
}

export default App;
