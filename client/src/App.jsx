import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
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
import FlightSearch from "./pages/FlightSearch";
import BookingPassengers from "./pages/booking/BookingPassengers.jsx";
import BookingReview from "./pages/booking/BookingReview.jsx";
import BookingSeats from "./pages/booking/BookingSeats.jsx";
import Payment from './pages/booking/BookingPayment'
import Confirmation from './pages/booking/BookingConfirmation'

//dashboard
import Admin from './pages/admin/AdminDashboard.jsx';
import Employee from './pages/employee/EmployeeDashboard.jsx';



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
                    <Route path="/flight-search" element={<FlightSearch />} />

                    {/* User-Authenticated Routes */}
                    <Route 
                        path="/profile" 
                        element={<ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>} />
                    <Route path="/booking/passengers" element={<BookingPassengers />} />
                    <Route path="/booking/review" element={<BookingReview />} />
                    <Route path="/booking/seat-selection" element={<BookingSeats />} />
                    <Route path="/booking/payment" element={<Payment />} />
                    <Route path="/booking/confirmation" element={<Confirmation />} />

                    {/* Employee-Authenticated Routes */}
                    <Route path="/flights" element={<Flights />} />
                    <Route path="/employee/dashboard" element={<Employee />} />
                    
                    {/* Administrator-Authenticated Routes */}
                    <Route path="/aircraft" element={<Aircraft />} />
                    <Route path= "/airport" element={<Airport />}/>
                    <Route path="/admin" element={<Admin />} />
                    <Route path='/employee' element={<Employee />} />
                    <Route path="/admin/dashboard" element={<Admin />} />
                    <Route 
                        path="/admin/dashboard" 
                        element={
                            <ProtectedRoute roles={["Admin"]}>
                                <Admin />
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </AppLayout>
        </AuthProvider>
    );
}

export default App;
