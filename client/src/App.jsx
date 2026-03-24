import React from 'react';
import { Routes, Route } from "react-router-dom";
import './globals.css'
import AppLayout from "./components/layout/AppLayout.jsx";

// Route Imports
import Home from './pages/Home'
import Register from './pages/Register'
import Login from "./pages/Login.jsx";
import {AuthProvider} from "./contexts/AuthContext.jsx";
import Profile from "./pages/passenger/Profile.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";

function App() {
    return (
        <AuthProvider>
            <AppLayout>
                <Routes>
                    {/* Open Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />

                    {/* User-Authenticated Routes */}
                    <Route 
                        path="/profile" 
                        element={<ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>} />

                    {/* Employee-Authenticated Routes */}

                    {/* Administrator-Authenticated Routes */}

                </Routes>
            </AppLayout>
        </AuthProvider>
    );
}

export default App;
