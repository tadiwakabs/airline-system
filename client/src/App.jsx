import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import './globals.css'
import AppLayout from "./components/layout/AppLayout.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute.jsx";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute.jsx";

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
import BookingPayment from './pages/booking/BookingPayment'
import Confirmation from './pages/booking/BookingConfirmation'
import Employees from "./pages/admin/Employees.jsx";
import PassengerList from "./pages/employee/PassengerList.jsx";

// Dashboards
import Admin from './pages/admin/AdminDashboard.jsx';
import Employee from './pages/employee/EmployeeDashboard.jsx';




function App() {
    return (
        <AuthProvider>
            <AppLayout>
                <Routes>
                    {/* Open Routes */}
                    <Route path="/" element={<Home />} />
                    <Route 
                        path="/register" 
                        element={<PublicOnlyRoute>
                                    <Register />
                                </PublicOnlyRoute>} />
                    <Route
                        path="/login"
                        element={<PublicOnlyRoute>
                            <Login />
                        </PublicOnlyRoute>} />
                    <Route path="/help" element = {<Help />} />
                    <Route path="/flight-search" element={<FlightSearch />} />

                    {/* User-Authenticated Routes */}
                    <Route 
                        path="/profile" 
                        element={<ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>} />
                    <Route 
                        path="/booking/passengers"
                        element={<ProtectedRoute>
                                    <BookingPassengers />
                                </ProtectedRoute>} />
                    <Route 
                        path="/booking/review"
                        element={<ProtectedRoute>
                                    <BookingReview />
                                </ProtectedRoute>} />
                    <Route 
                        path="/booking/seat-selection"
                        element={<ProtectedRoute>
                                    <BookingSeats />
                                </ProtectedRoute>} />
                    <Route 
                        path="/booking/payment"
                        element={<ProtectedRoute>
                                    <BookingPayment />
                                </ProtectedRoute>} />
                    <Route 
                        path="/booking/confirmation"
                        element={<ProtectedRoute>
                                    <Confirmation />
                                </ProtectedRoute>} />

                    {/* Employee-Authenticated Routes */}
                    <Route 
                        path='/employee/dashboard' 
                        element={<RoleProtectedRoute allowedRoles={["Employee", "Administrator"]}>
                                    <Employee />
                                </RoleProtectedRoute>} />
                    <Route
                        path='/flights'
                        element={<RoleProtectedRoute allowedRoles={["Employee", "Administrator"]}>
                            <Flights />
                        </RoleProtectedRoute>} />

                    <Route
                        path='/passenger-list'
                        element={<RoleProtectedRoute allowedRoles={["Employee", "Administrator"]}>
                            <PassengerList />
                        </RoleProtectedRoute>} />
                    
                    {/* Administrator-Authenticated Routes */}
                    <Route
                        path='/aircraft'
                        element={<RoleProtectedRoute allowedRoles={["Administrator"]}>
                            <Aircraft />
                        </RoleProtectedRoute>} />
                    <Route
                        path='/airports'
                        element={<RoleProtectedRoute allowedRoles={["Administrator"]}>
                            <Airport />
                        </RoleProtectedRoute>} />
                    <Route
                        path='/admin/dashboard'
                        element={<RoleProtectedRoute allowedRoles={["Administrator"]}>
                            <Admin />
                        </RoleProtectedRoute>} />
                    <Route
                        path='/employees'
                        element={<Employees />} />
                    
                </Routes>
            </AppLayout>
        </AuthProvider>
    );
}

export default App;
