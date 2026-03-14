import React from 'react';
import { Routes, Route } from "react-router-dom";
import './globals.css'
import AppLayout from "./components/layout/AppLayout.jsx";

// Route Imports
import Home from './pages/Home'

function App() {
    return (
            <AppLayout>
                <Routes>
                    {/* Open Routes */}
                    <Route path="/" element={<Home />} />

                    {/* User-Authenticated Routes */}

                    {/* Employee-Authenticated Routes */}

                    {/* Administrator-Authenticated Routes */}

                </Routes>
            </AppLayout>
        
    );
}

export default App;
