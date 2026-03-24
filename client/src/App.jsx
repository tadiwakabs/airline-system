import React from 'react';
import { Routes, Route } from "react-router-dom";
import './globals.css'
import AppLayout from "./components/layout/AppLayout.jsx";

// Route Imports
import Home from './pages/Home'
import Register from './pages/Register'
import Aircraft from './pages/Aircraft'

function App() {
    return (
            <AppLayout>
                <Routes>
                    {/* Open Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />

                    {/* User-Authenticated Routes */}

                    {/* Employee-Authenticated Routes */}

                    {/* Administrator-Authenticated Routes */}
                    <Route path="/aircraft" element={<Aircraft />} />

                </Routes>
            </AppLayout>
        
    );
}

export default App;
