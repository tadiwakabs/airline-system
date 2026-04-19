import React from "react";
import { useLocation } from "react-router-dom"; 
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppLayout({ children }) {
    const location = useLocation();
    

    const isHomePage = location.pathname === "/";

    return (
        <div className="min-h-screen bg-transparent text-slate-900 flex flex-col">
            <Navbar />
            
            <main className={`flex-1 bg-transparent ${isHomePage ? "pt-0" : "pt-24"}`}>
                {children}
            </main>
            
            <Footer />
        </div>
    );
}
