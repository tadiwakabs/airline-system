import React from 'react';
import { Routes, Route } from "react-router-dom";
import './globals.css'

// Route Imports
import Home from './pages/Home'

function App() {
    return (
        <Routes>
            {/* Open Routes */}
            <Route path="/" element={<Home />} />

            {/* User-Authenticated Routes */}

            {/* Employee-Authenticated Routes */}

            {/* Administrator-Authenticated Routes */}
            
        </Routes>
        
    );
}

export default App;
