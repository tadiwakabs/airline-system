import React from 'react';
import { Routes, Route } from "react-router-dom";
import './globals.css'
import AppLayout from "./components/layout/AppLayout.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";

// Route Imports
import Home from './pages/Home'
import Register from './pages/Register'
import Aircraft from './pages/admin/Aircraft'
import Login from "./pages/Login.jsx";
import {AuthProvider} from "./contexts/AuthContext.jsx";
import Profile from "./pages/passenger/Profile.jsx";
import Flights from "./pages/employee/Flights";
import Airport from "./pages/admin/Airport.jsx";
import Help from "./pages/HelpPage.jsx";

function App() {
    return (
        <AuthProvider>
            <AppLayout>
                <Routes>
                    {/* Open Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/help" element = {<Help />} />
                

                    {/* User-Authenticated Routes */}
                    <Route 
                        path="/profile" 
                        element={<ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>} />

                    {/* Employee-Authenticated Routes */}
                    <Route path="/flights" element={<Flights />} />
                    
                    {/* Administrator-Authenticated Routes */}
                    <Route path="/aircraft" element={<Aircraft />} />
                    <Route path= "/airport" element={<Airport />}/>

                </Routes>
            </AppLayout>
        </AuthProvider>
    );
}

export default App;
